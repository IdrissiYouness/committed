package com.committed.gateway.controller;

import com.committed.gateway.dto.AdminUpdateUserRequest;
import com.committed.gateway.dto.AdminUserResponse;
import com.committed.gateway.dto.ApiResponse;
import com.committed.gateway.dto.PagedResponse;
import com.committed.gateway.security.JwtPrincipal;
import com.committed.gateway.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Admin Controller
 *
 * Provides admin-only user management endpoints.
 *
 * Security is enforced at two levels:
 *   1. URL-level: SecurityConfig maps /api/admin/** → hasRole("ADMIN")
 *   2. Method-level: @PreAuthorize("hasRole('ADMIN')") on the class as a second line of defence
 *
 * The userId of the acting admin is always sourced from the JWT principal —
 * clients cannot supply a different adminId.
 *
 * All endpoints log structured audit entries via AdminService.
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Slf4j
public class AdminController {

    private final AdminService adminService;

    // -------------------------------------------------------------------------
    // GET /api/admin/users
    // -------------------------------------------------------------------------

    /**
     * Return a paginated, optionally filtered list of all users.
     *
     * <pre>
     * GET /api/admin/users
     * Authorization: Bearer &lt;access_token&gt;   (must be ADMIN)
     * </pre>
     *
     * Query parameters (all optional):
     * <ul>
     *   <li>{@code page}     — 0-based page index (default 0)</li>
     *   <li>{@code size}     — results per page, 1–100 (default 20)</li>
     *   <li>{@code sortBy}   — fullName | email | createdAt | systemRole (default createdAt)</li>
     *   <li>{@code sortDir}  — asc | desc (default desc)</li>
     *   <li>{@code role}     — filter by systemRole: user | admin</li>
     *   <li>{@code isActive} — filter by active status: true | false</li>
     *   <li>{@code search}   — partial match on fullName or email (case-insensitive)</li>
     * </ul>
     *
     * @param principal JWT principal of the acting admin
     * @return 200 OK with a {@link PagedResponse} of {@link AdminUserResponse}
     */
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<PagedResponse<AdminUserResponse>>> listUsers(
        @AuthenticationPrincipal JwtPrincipal principal,
        @RequestParam(defaultValue = "0")          int     page,
        @RequestParam(defaultValue = "20")         int     size,
        @RequestParam(defaultValue = "createdAt")  String  sortBy,
        @RequestParam(defaultValue = "desc")       String  sortDir,
        @RequestParam(required = false)            String  role,
        @RequestParam(required = false)            Boolean isActive,
        @RequestParam(required = false)            String  search
    ) {
        log.info("GET /api/admin/users — adminId={}, page={}, size={}, role={}, isActive={}, search={}",
            principal.userId(), page, size, role, isActive, search);

        PagedResponse<AdminUserResponse> result = adminService.listUsers(
            principal, page, size, sortBy, sortDir, role, isActive, search
        );

        return ResponseEntity.ok(
            ApiResponse.success(result, "Users retrieved successfully")
        );
    }

    // -------------------------------------------------------------------------
    // PUT /api/admin/users/{userId}
    // -------------------------------------------------------------------------

    /**
     * Partially update any user's account (fullName, email, systemRole, isActive).
     * Only non-null fields in the request body are applied.
     *
     * <pre>
     * PUT /api/admin/users/{userId}
     * Authorization: Bearer &lt;access_token&gt;   (must be ADMIN)
     * Body: { "fullName": "...", "email": "...", "systemRole": "admin", "isActive": true }
     *       (all fields optional, at least one required)
     * </pre>
     *
     * Business rules:
     * <ul>
     *   <li>Admin cannot demote their own systemRole to "user".</li>
     *   <li>Admin cannot set isActive=false on their own account.</li>
     * </ul>
     *
     * @param principal JWT principal of the acting admin
     * @param userId    Target user to update
     * @param request   Fields to update (at least one must be non-null)
     * @return 200 OK with the updated {@link AdminUserResponse}
     */
    @PutMapping("/users/{userId}")
    public ResponseEntity<ApiResponse<AdminUserResponse>> updateUser(
        @AuthenticationPrincipal JwtPrincipal principal,
        @PathVariable Long userId,
        @Valid @RequestBody AdminUpdateUserRequest request
    ) {
        log.info("PUT /api/admin/users/{} — adminId={}", userId, principal.userId());

        if (!request.hasUpdates()) {
            return ResponseEntity.badRequest().body(
                ApiResponse.<AdminUserResponse>builder()
                    .success(false)
                    .message("At least one field (fullName, email, systemRole, or isActive) must be provided")
                    .build()
            );
        }

        AdminUserResponse updated = adminService.updateUser(principal, userId, request);

        return ResponseEntity.ok(
            ApiResponse.success(updated, "User updated successfully")
        );
    }

    // -------------------------------------------------------------------------
    // DELETE /api/admin/users/{userId}
    // -------------------------------------------------------------------------

    /**
     * Soft-deactivate a user (sets isActive = false).
     * This is reversible — the user can be reactivated by calling
     * {@code PUT /api/admin/users/{userId}} with {@code "isActive": true}.
     *
     * <pre>
     * DELETE /api/admin/users/{userId}
     * Authorization: Bearer &lt;access_token&gt;   (must be ADMIN)
     * </pre>
     *
     * Business rules:
     * <ul>
     *   <li>Admin cannot deactivate their own account.</li>
     * </ul>
     *
     * @param principal JWT principal of the acting admin
     * @param userId    Target user to deactivate
     * @return 200 OK with the deactivated {@link AdminUserResponse}
     */
    @DeleteMapping("/users/{userId}")
    public ResponseEntity<ApiResponse<AdminUserResponse>> deactivateUser(
        @AuthenticationPrincipal JwtPrincipal principal,
        @PathVariable Long userId
    ) {
        log.info("DELETE /api/admin/users/{} — adminId={}", userId, principal.userId());

        AdminUserResponse deactivated = adminService.deactivateUser(principal, userId);

        return ResponseEntity.ok(
            ApiResponse.success(deactivated, "User deactivated successfully")
        );
    }
}