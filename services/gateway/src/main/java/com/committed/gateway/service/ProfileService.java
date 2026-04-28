package com.committed.gateway.service;

import com.committed.gateway.client.CoreServiceClient;
import com.committed.gateway.dto.ChangePasswordRequest;
import com.committed.gateway.dto.UpdateProfileRequest;
import com.committed.gateway.dto.UserProfileResponse;
import com.committed.gateway.dto.internal.ChangePasswordCoreRequest;
import com.committed.gateway.dto.internal.UpdateUserProfileRequest;
import com.committed.gateway.exception.InvalidCredentialsException;
import com.committed.gateway.security.JwtPrincipal;
import com.committed.gateway.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;


/**
 * Profile Service
 *
 * Handles all user profile operations:
 *   - Fetching the authenticated user's profile
 *   - Updating fullName and/or email
 *   - Changing the password (verifies old password before forwarding new hash to Core)
 *
 * Responsibility boundary:
 *   - Gateway owns: BCrypt verification, BCrypt hashing, JWT re-issuance
 *   - Core owns: persistence, duplicate-email check
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProfileService {

    private final CoreServiceClient     coreServiceClient;
    private final JwtTokenProvider      jwtTokenProvider;
    private final PasswordEncoder       passwordEncoder;
    private final TokenBlacklistService blacklistService;

    // -------------------------------------------------------------------------
    // Get Profile
    // -------------------------------------------------------------------------

    /**
     * Fetch the public profile of the authenticated user.
     *
     * @param principal JWT principal extracted from the access token
     * @return the user's public profile (no passwordHash)
     */
    public UserProfileResponse getProfile(JwtPrincipal principal) {
        Long userId = parsedUserId(principal);
        log.info("Fetching profile for userId={}", userId);

        return coreServiceClient.getUserProfile(userId);
    }

    // -------------------------------------------------------------------------
    // Update Profile
    // -------------------------------------------------------------------------

    /**
     * Partially update the authenticated user's profile (fullName and/or email).
     *
     * <p>Rules:
     * <ul>
     *   <li>At least one field must be non-null (enforced before calling this method
     *       by the controller via {@link UpdateProfileRequest} validation).</li>
     *   <li>If email changes, a new JWT is returned so the client's token stays
     *       consistent with the updated email claim.</li>
     *   <li>If fullName changes, a new JWT is also returned because fullName is
     *       embedded in the JWT claims.</li>
     * </ul>
     *
     * @param principal JWT principal extracted from the access token
     * @param request   fields to update (any non-null field is applied)
     * @return result containing the updated profile and freshly issued tokens when claims changed
     */
    public UpdateProfileResult updateProfile(JwtPrincipal principal, UpdateProfileRequest request) {
        Long userId = parsedUserId(principal);
        log.info("Updating profile for userId={}", userId);

        // Forward only the non-null fields to Core
        UpdateUserProfileRequest coreRequest = UpdateUserProfileRequest.builder()
            .email(request.getEmail())
            .fullName(request.getFullName())
            .build();

        UserProfileResponse updated = coreServiceClient.updateUserProfile(userId, coreRequest);

        log.info("Profile updated successfully for userId={}", userId);

        // Re-issue tokens if any JWT-embedded claim changed (email or fullName)
        boolean claimsChanged =
            (request.getEmail()    != null && !request.getEmail().equals(principal.email())) ||
            (request.getFullName() != null && !request.getFullName().equals(updated.getFullName()));

        String newAccessToken  = null;
        String newRefreshToken = null;

        if (claimsChanged) {
            log.info("JWT claims changed for userId={} — issuing new tokens", userId);
            // Fetch current tokenVersion to embed in the new token
            var userDetails = coreServiceClient.getUserByEmail(updated.getEmail());
            int tokenVersion = userDetails.getTokenVersion() != null ? userDetails.getTokenVersion() : 1;
            newAccessToken = jwtTokenProvider.generateToken(
                principal.userId(),
                updated.getEmail(),
                updated.getFullName(),
                updated.getSystemRole().toUpperCase(),
                tokenVersion
            );
            newRefreshToken = jwtTokenProvider.generateRefreshToken(principal.userId());
        }

        return new UpdateProfileResult(updated, newAccessToken, newRefreshToken);
    }

    // -------------------------------------------------------------------------
    // Change Password
    // -------------------------------------------------------------------------

    /**
     * Change the authenticated user's password.
     *
     * <p>Steps performed by Gateway:
     * <ol>
     *   <li>Fetch current user details (including passwordHash) from Core.</li>
     *   <li>Verify {@code currentPassword} against the stored BCrypt hash.</li>
     *   <li>Ensure new password differs from the current one.</li>
     *   <li>BCrypt-hash the new password.</li>
     *   <li>Send only the new hash to Core — plaintext never leaves Gateway.</li>
     *   <li>Issue a new token pair so the client seamlessly refreshes credentials.</li>
     * </ol>
     *
     * @param principal JWT principal extracted from the access token
     * @param request   {@code currentPassword} + {@code newPassword} (plaintext)
     * @return freshly issued access and refresh tokens
     * @throws InvalidCredentialsException if the current password is wrong
     */
    public ChangePasswordResult changePassword(JwtPrincipal principal, ChangePasswordRequest request) {
        Long userId = parsedUserId(principal);
        log.info("Password change requested for userId={}", userId);

        // 1. Fetch the current stored hash from Core (reuse the login endpoint)
        var coreUser = coreServiceClient.getUserByEmail(principal.email());

        // 2. Verify old password
        if (!passwordEncoder.matches(request.getCurrentPassword(), coreUser.getPasswordHash())) {
            log.warn("Current password verification failed for userId={}", userId);
            throw new InvalidCredentialsException();
        }

        // 3. Ensure new password differs from the current one
        if (passwordEncoder.matches(request.getNewPassword(), coreUser.getPasswordHash())) {
            log.warn("New password is the same as the current password for userId={}", userId);
            throw new InvalidCredentialsException("New password must differ from the current password");
        }

        // 4. Hash new password and forward to Core
        String newHash = passwordEncoder.encode(request.getNewPassword());
        coreServiceClient.changeUserPassword(userId, ChangePasswordCoreRequest.builder()
            .newPasswordHash(newHash)
            .build());

        log.info("Password changed successfully for userId={}", userId);

        // 5. Bump token version — immediately invalidates all existing sessions
        int newVersion = coreServiceClient.incrementTokenVersion(userId);
        blacklistService.setTokenVersion(String.valueOf(userId), newVersion);
        log.info("Token version bumped to {} for userId={} after password change", newVersion, userId);

        // 6. Issue fresh tokens with the new version
        String newAccessToken = jwtTokenProvider.generateToken(
            principal.userId(),
            principal.email(),
            coreUser.getFullName(),
            coreUser.getSystemRole().toUpperCase(),
            newVersion
        );
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(principal.userId());

        return new ChangePasswordResult(newAccessToken, newRefreshToken);
    }

    // -------------------------------------------------------------------------
    // Nested result types
    // -------------------------------------------------------------------------

    /**
     * Result of a profile update operation.
     * {@code accessToken} and {@code refreshToken} are non-null only when
     * JWT-embedded claims (email or fullName) changed.
     */
    public record UpdateProfileResult(
        UserProfileResponse profile,
        String accessToken,
        String refreshToken
    ) {
        public boolean tokensRefreshed() {
            return accessToken != null;
        }
    }

    /**
     * Result of a password change operation.
     * Always contains fresh tokens.
     */
    public record ChangePasswordResult(
        String accessToken,
        String refreshToken
    ) {}

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private Long parsedUserId(JwtPrincipal principal) {
        try {
            return Long.parseLong(principal.userId());
        } catch (NumberFormatException e) {
            log.error("Invalid userId in JWT principal: '{}'", principal.userId());
            throw new IllegalStateException("Malformed userId in JWT token", e);
        }
    }
}