package com.committed.gateway.controller;

import com.committed.gateway.dto.ApiResponse;
import com.committed.gateway.dto.ChangePasswordRequest;
import com.committed.gateway.dto.UpdateProfileRequest;
import com.committed.gateway.dto.UserProfileResponse;
import com.committed.gateway.service.ProfileService;
import com.committed.gateway.security.JwtPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Profile Controller
 *
 * Handles user profile management for the authenticated user.
 * All endpoints require a valid JWT (enforced by SecurityConfig + JwtAuthenticationFilter).
 *
 * The userId is always sourced from the JWT principal — clients cannot supply
 * a different userId, so users can only ever operate on their own profile.
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
public class ProfileController {

    private final ProfileService profileService;

    // -------------------------------------------------------------------------
    // GET /api/users/profile
    // -------------------------------------------------------------------------

    /**
     * Retrieve the authenticated user's profile.
     *
     * <pre>
     * GET /api/users/profile
     * Authorization: Bearer &lt;access_token&gt;
     * </pre>
     *
     * @param principal JWT principal injected by Spring Security
     * @return 200 OK with the user's public profile (no passwordHash)
     */
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile(
        @AuthenticationPrincipal JwtPrincipal principal
    ) {
        log.info("GET /api/users/profile — userId={}", principal.userId());

        UserProfileResponse profile = profileService.getProfile(principal);

        return ResponseEntity.ok(
            ApiResponse.success(profile, "Profile retrieved successfully")
        );
    }

    // -------------------------------------------------------------------------
    // PUT /api/users/profile
    // -------------------------------------------------------------------------

    /**
     * Update the authenticated user's profile.
     * At least one field (fullName, email) must be supplied.
     * Only non-null fields are applied (partial update).
     *
     * <pre>
     * PUT /api/users/profile
     * Authorization: Bearer &lt;access_token&gt;
     * Body: { "fullName": "...", "email": "..." }  (both optional, min one required)
     * </pre>
     *
     * <p>If email or fullName changes, the response includes fresh JWT tokens
     * so the client can replace its stored credentials immediately.
     *
     * @param principal JWT principal injected by Spring Security
     * @param request   fields to update
     * @return 200 OK with updated profile and optionally new tokens
     */
    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateProfile(
        @AuthenticationPrincipal JwtPrincipal principal,
        @Valid @RequestBody UpdateProfileRequest request
    ) {
        log.info("PUT /api/users/profile — userId={}", principal.userId());

        // Require at least one updatable field
        if (request.getEmail() == null && request.getFullName() == null) {
            return ResponseEntity.badRequest().body(
                ApiResponse.<Map<String, Object>>builder()
                    .success(false)
                    .message("At least one field (fullName or email) must be provided")
                    .build()
            );
        }

        ProfileService.UpdateProfileResult result = profileService.updateProfile(principal, request);

        Map<String, Object> responseData = new LinkedHashMap<>();
        responseData.put("profile", result.profile());

        if (result.tokensRefreshed()) {
            log.info("JWT claims changed for userId={} — returning new tokens", principal.userId());
            Map<String, String> tokens = new LinkedHashMap<>();
            tokens.put("accessToken",  result.accessToken());
            tokens.put("refreshToken", result.refreshToken());
            tokens.put("tokenType",    "Bearer");
            responseData.put("tokens", tokens);
        }

        String message = result.tokensRefreshed()
            ? "Profile updated successfully. New tokens issued — please replace your stored credentials."
            : "Profile updated successfully";

        return ResponseEntity.ok(ApiResponse.success(responseData, message));
    }

    // -------------------------------------------------------------------------
    // POST /api/users/profile/change-password
    // -------------------------------------------------------------------------

    /**
     * Change the authenticated user's password.
     *
     * <pre>
     * POST /api/users/profile/change-password
     * Authorization: Bearer &lt;access_token&gt;
     * Body: { "currentPassword": "...", "newPassword": "..." }
     * </pre>
     *
     * <p>Gateway verifies the current password against the stored BCrypt hash
     * before forwarding only the new BCrypt hash to Core — plaintext never
     * leaves the Gateway service.
     *
     * <p>Fresh tokens are always returned after a successful password change.
     *
     * @param principal JWT principal injected by Spring Security
     * @param request   currentPassword (plaintext) + newPassword (plaintext, min 8 chars)
     * @return 200 OK with new access and refresh tokens
     */
    @PostMapping("/profile/change-password")
    public ResponseEntity<ApiResponse<Map<String, String>>> changePassword(
        @AuthenticationPrincipal JwtPrincipal principal,
        @Valid @RequestBody ChangePasswordRequest request
    ) {
        log.info("POST /api/users/profile/change-password — userId={}", principal.userId());

        ProfileService.ChangePasswordResult result = profileService.changePassword(principal, request);

        Map<String, String> tokens = new LinkedHashMap<>();
        tokens.put("accessToken",  result.accessToken());
        tokens.put("refreshToken", result.refreshToken());
        tokens.put("tokenType",    "Bearer");

        return ResponseEntity.ok(
            ApiResponse.success(tokens, "Password changed successfully. Please replace your stored credentials.")
        );
    }
}