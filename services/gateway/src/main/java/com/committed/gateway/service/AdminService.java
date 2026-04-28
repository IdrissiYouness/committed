package com.committed.gateway.service;

import com.committed.gateway.client.CoreServiceClient;
import com.committed.gateway.dto.AdminUpdateUserRequest;
import com.committed.gateway.dto.AdminUserResponse;
import com.committed.gateway.dto.PagedResponse;
import com.committed.gateway.dto.internal.CoreAdminUpdateRequest;
import com.committed.gateway.dto.internal.CoreAdminUserListResponse;
import com.committed.gateway.exception.EmailAlreadyExistsException;
import com.committed.gateway.exception.UserNotFoundException;
import com.committed.gateway.security.JwtPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Admin Service
 *
 * Handles all admin user-management operations:
 *   - Paginated / filtered user listing
 *   - Partial user update (fullName, email, systemRole, isActive)
 *   - Soft deactivation
 *
 * Responsibility boundary:
 *   - Gateway owns: self-guard validation, audit log entries, mapping between
 *                   client-facing DTOs and internal Core DTOs.
 *   - Core owns: persistence, duplicate-email check, DB-level guard enforcement.
 *
 * Self-guard rules enforced here (before even calling Core):
 *   1. An admin cannot deactivate their own account via DELETE.
 *   2. An admin cannot demote their own systemRole to "user" via PUT.
 *   3. An admin cannot deactivate themselves via the isActive=false field in PUT.
 *
 * Core also enforces the same rules as a second line of defence, so even if
 * a request somehow bypasses this service the operation will still be blocked.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final CoreServiceClient     coreServiceClient;
    private final TokenBlacklistService blacklistService;

    // -------------------------------------------------------------------------
    // List Users
    // -------------------------------------------------------------------------

    /**
     * Return a paginated, optionally filtered list of all users.
     *
     * @param principal JWT principal of the acting admin
     * @param page      0-based page index (clamped to ≥ 0)
     * @param size      Page size (clamped to 1–100)
     * @param sortBy    Field to sort by: fullName | email | createdAt | systemRole
     * @param sortDir   Sort direction: "asc" | "desc"
     * @param role      Optional systemRole filter: "user" | "admin"
     * @param isActive  Optional active-status filter
     * @param search    Optional partial-match string against fullName / email
     *
     * @return paginated {@link PagedResponse} of {@link AdminUserResponse}
     */
    public PagedResponse<AdminUserResponse> listUsers(
            JwtPrincipal principal,
            int          page,
            int          size,
            String       sortBy,
            String       sortDir,
            String       role,
            Boolean      isActive,
            String       search
    ) {
        Long adminId = parsedUserId(principal);

        // Validate role filter before forwarding to Core.
        // Without this guard, an invalid role reaches Core, Core returns 400,
        // but CoreServiceClient's catch-all converts any 4xx from Core into a
        // ServiceUnavailableException — causing the client to see 503 instead of 400.
        if (role != null && !role.equals("user") && !role.equals("admin")) {
            throw new IllegalArgumentException(
                "role filter must be one of: user, admin (got: '" + role + "')");
        }

        // Validate sortBy before forwarding — same 503 risk as above.
        if (sortBy != null && !sortBy.equals("fullName") && !sortBy.equals("email")
                && !sortBy.equals("createdAt") && !sortBy.equals("systemRole")) {
            throw new IllegalArgumentException(
                "sortBy must be one of: fullName, email, createdAt, systemRole (got: '" + sortBy + "')");
        }

        // Validate sortDir before forwarding.
        if (sortDir != null && !sortDir.equals("asc") && !sortDir.equals("desc")) {
            throw new IllegalArgumentException(
                "sortDir must be one of: asc, desc (got: '" + sortDir + "')");
        }

        // Normalise bounds
        int normPage = Math.max(0, page);
        int normSize = Math.min(100, Math.max(1, size));

        log.info("ADMIN_ACTION adminId={} action=LIST_USERS page={} size={} filters={}",
            adminId, normPage, normSize,
            buildFilterDescription(role, isActive, search));

        CoreAdminUserListResponse coreResponse = coreServiceClient.adminListUsers(
            adminId, normPage, normSize, sortBy, sortDir, role, isActive, search
        );

        List<AdminUserResponse> users = mapUserList(coreResponse.getUsers());

        CoreAdminUserListResponse.PaginationMeta meta = coreResponse.getPagination();

        return PagedResponse.<AdminUserResponse>builder()
            .content(users)
            .page(meta.getPage())
            .size(meta.getSize())
            .totalElements(meta.getTotalElements())
            .totalPages(meta.getTotalPages())
            .hasNext(meta.isHasNext())
            .hasPrev(meta.isHasPrev())
            .build();
    }

    // -------------------------------------------------------------------------
    // Update User
    // -------------------------------------------------------------------------

    /**
     * Partially update any user's account fields.
     *
     * <p>Rules (enforced before delegating to Core):
     * <ul>
     *   <li>Admin cannot demote their own systemRole to "user".</li>
     *   <li>Admin cannot set isActive=false on their own account.</li>
     *   <li>At least one field must be provided (caller must check
     *       {@link AdminUpdateUserRequest#hasUpdates()} before calling).</li>
     * </ul>
     *
     * @param principal JWT principal of the acting admin
     * @param targetId  userId of the user to update
     * @param request   Partial update fields (all optional)
     *
     * @return the updated user as {@link AdminUserResponse}
     *
     * @throws IllegalArgumentException  if the admin tries to demote or deactivate themselves
     * @throws UserNotFoundException     if targetId does not exist
     * @throws EmailAlreadyExistsException if the new email is already taken
     */
    public AdminUserResponse updateUser(
            JwtPrincipal           principal,
            Long                   targetId,
            AdminUpdateUserRequest request
    ) {
        Long adminId = parsedUserId(principal);

        enforceSelfGuardOnUpdate(adminId, targetId, request);

        log.info("ADMIN_ACTION adminId={} action=UPDATE_USER targetId={}", adminId, targetId);

        CoreAdminUpdateRequest coreRequest = CoreAdminUpdateRequest.builder()
            .email(request.getEmail())
            .fullName(request.getFullName())
            .systemRole(request.getSystemRole())
            .isActive(request.getIsActive())
            .build();

        AdminUserResponse updated = coreServiceClient.adminUpdateUser(adminId, targetId, coreRequest);

        log.info("ADMIN_ACTION adminId={} action=UPDATE_USER targetId={} — success", adminId, targetId);

        return updated;
    }

    // -------------------------------------------------------------------------
    // Deactivate User
    // -------------------------------------------------------------------------

    /**
     * Soft-deactivate a user by setting isActive = false.
     *
     * <p>An admin cannot deactivate their own account — this prevents accidental
     * admin lockout. Reactivation (isActive = true) is still available via
     * {@link #updateUser} and is not restricted.
     *
     * @param principal JWT principal of the acting admin
     * @param targetId  userId of the user to deactivate
     *
     * @return the deactivated user as {@link AdminUserResponse}
     *
     * @throws IllegalArgumentException if the admin tries to deactivate themselves
     * @throws UserNotFoundException    if targetId does not exist
     */
    public AdminUserResponse deactivateUser(JwtPrincipal principal, Long targetId) {
        Long adminId = parsedUserId(principal);

        if (adminId.equals(targetId)) {
            log.warn("ADMIN_ACTION adminId={} action=DEACTIVATE_USER_BLOCKED — self-deactivation attempt",
                adminId);
            throw new IllegalArgumentException("Admins cannot deactivate their own account");
        }

        log.info("ADMIN_ACTION adminId={} action=DEACTIVATE_USER targetId={}", adminId, targetId);

        AdminUserResponse deactivated = coreServiceClient.adminDeactivateUser(adminId, targetId);

        // Immediately invalidate all existing sessions for the deactivated user
        try {
            int newVersion = coreServiceClient.incrementTokenVersion(targetId);
            blacklistService.setTokenVersion(String.valueOf(targetId), newVersion);
            log.info("Token version bumped to {} for deactivated userId={}", newVersion, targetId);
        } catch (Exception e) {
            log.error("Failed to bump token version after deactivating userId={}: {}", targetId, e.getMessage());
        }


        log.info("ADMIN_ACTION adminId={} action=DEACTIVATE_USER targetId={} — success", adminId, targetId);

        return deactivated;
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Block self-demotion and self-deactivation before calling Core.
     * Throws {@link IllegalArgumentException} if a guard fires.
     */
    private void enforceSelfGuardOnUpdate(Long adminId, Long targetId, AdminUpdateUserRequest request) {
        if (!adminId.equals(targetId)) {
            return; // Guards only apply to self-targeting
        }

        if ("user".equals(request.getSystemRole())) {
            log.warn("ADMIN_ACTION adminId={} action=UPDATE_USER_BLOCKED — self-demotion attempt", adminId);
            throw new IllegalArgumentException("Admins cannot demote their own system role");
        }

        if (Boolean.FALSE.equals(request.getIsActive())) {
            log.warn("ADMIN_ACTION adminId={} action=UPDATE_USER_BLOCKED — self-deactivation attempt via isActive", adminId);
            throw new IllegalArgumentException("Admins cannot deactivate their own account");
        }
    }

    /**
     * Map Core's raw user-list (List of Map) into typed {@link AdminUserResponse} objects.
     */
    private List<AdminUserResponse> mapUserList(List<Map<String, Object>> rawUsers) {
        if (rawUsers == null) {
            return List.of();
        }

        return rawUsers.stream()
            .map(this::mapUser)
            .collect(Collectors.toList());
    }

    /**
     * Convert a single raw user map (from Core's JSON) to an {@link AdminUserResponse}.
     * The keys match Core's {@code GetUserProfileResponse#toArray()} output.
     */
    private AdminUserResponse mapUser(Map<String, Object> raw) {
        return AdminUserResponse.builder()
            .userId(toLong(raw.get("userId")))
            .email((String)  raw.get("email"))
            .fullName((String)  raw.get("fullName"))
            .systemRole((String)  raw.get("systemRole"))
            .isActive(toBoolean(raw.get("isActive")))
            .createdAt((String)  raw.get("createdAt"))
            .updatedAt((String)  raw.get("updatedAt"))
            .build();
    }

    /**
     * Safely convert Object → Long.
     * Jackson deserialises JSON numbers as Integer when they fit, so we handle both.
     */
    private Long toLong(Object value) {
        if (value == null)          return null;
        if (value instanceof Long)  return (Long)  value;
        if (value instanceof Integer) return ((Integer) value).longValue();
        try {
            return Long.parseLong(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * Safely convert Object → Boolean.
     */
    private Boolean toBoolean(Object value) {
        if (value == null)           return null;
        if (value instanceof Boolean) return (Boolean) value;
        return Boolean.parseBoolean(value.toString());
    }

    /**
     * Parse the userId string from the JWT principal to Long.
     */
    private Long parsedUserId(JwtPrincipal principal) {
        try {
            return Long.parseLong(principal.userId());
        } catch (NumberFormatException e) {
            log.error("Invalid userId in JWT principal: '{}'", principal.userId());
            throw new IllegalStateException("Malformed userId in JWT token", e);
        }
    }

    /**
     * Build a short, structured description of active filters for audit log entries.
     */
    private String buildFilterDescription(String role, Boolean isActive, String search) {
        StringBuilder sb = new StringBuilder("{");
        if (role     != null) sb.append("role=").append(role).append(", ");
        if (isActive != null) sb.append("isActive=").append(isActive).append(", ");
        if (search   != null) sb.append("search=").append(search).append(", ");
        String result = sb.toString();
        if (result.endsWith(", ")) result = result.substring(0, result.length() - 2);
        return result + "}";
    }
}