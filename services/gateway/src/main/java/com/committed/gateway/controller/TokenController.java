package com.committed.gateway.controller;

import com.committed.gateway.client.CoreServiceClient;
import com.committed.gateway.dto.JwtAuthenticationResponse;
import com.committed.gateway.dto.TokenRefreshRequest;
import com.committed.gateway.exception.InvalidCredentialsException;
import com.committed.gateway.exception.JwtTokenException;
import com.committed.gateway.security.JwtTokenProvider;
import com.committed.gateway.service.TokenBlacklistService;
import com.committed.gateway.dto.internal.UserDetailsResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/token")
@RequiredArgsConstructor
@Slf4j
public class TokenController {

    private final JwtTokenProvider      tokenProvider;
    private final CoreServiceClient     coreServiceClient;
    private final TokenBlacklistService blacklistService;

    /**
     * Refresh access token using a valid refresh token.
     * Issues a new refresh token (rotation) and blacklists the old one.
     * POST /api/token/refresh
     */
    @PostMapping("/refresh")
    public ResponseEntity<JwtAuthenticationResponse> refreshToken(
        @Valid @RequestBody TokenRefreshRequest request
    ) {
        log.info("Token refresh requested");

        String refreshToken = request.getRefreshToken();

        // 1. Validate signature and expiry
        tokenProvider.validateToken(refreshToken);

        // 2. Enforce type claim — reject access tokens used as refresh tokens
        String type = tokenProvider.getTypeFromToken(refreshToken);
        if (!"refresh".equals(type)) {
            log.warn("Token refresh attempted with non-refresh token type={}", type);
            throw new JwtTokenException("Not a refresh token");
        }

        // 3. Check blacklist — reject already-rotated tokens
        String oldJti = tokenProvider.getJtiFromToken(refreshToken);
        if (blacklistService.isBlacklisted(oldJti)) {
            log.warn("Refresh token already revoked jti={}", oldJti);
            throw new JwtTokenException("Refresh token revoked");
        }

        // 4. Fetch fresh user from Core (replaces hardcoded mock data)
        String userId = tokenProvider.getUserIdSubjectFromToken(refreshToken);
        UserDetailsResponse user = coreServiceClient.getUserById(Long.parseLong(userId));

        if (Boolean.FALSE.equals(user.getIsActive())) {
            log.warn("Refresh attempted for inactive userId={}", userId);
            throw new InvalidCredentialsException();
        }

        // 5. Generate new access token with current tokenVersion
        int tokenVersion = user.getTokenVersion() != null ? user.getTokenVersion() : 1;
        String newAccessToken = tokenProvider.generateToken(
            userId,
            user.getEmail(),
            user.getFullName(),
            user.getSystemRole().toUpperCase(),
            tokenVersion
        );

        // 6. Rotate: issue new refresh token, blacklist the old one
        String newRefreshToken   = tokenProvider.generateRefreshToken(userId);
        long remainingSeconds    = Math.max(0,
            (tokenProvider.getExpirationFromToken(refreshToken).getTime() - System.currentTimeMillis()) / 1000);
        blacklistService.blacklistToken(oldJti, remainingSeconds);

        log.info("Token refreshed and rotated for userId={}", userId);

        return ResponseEntity.ok(JwtAuthenticationResponse.builder()
            .accessToken(newAccessToken)
            .refreshToken(newRefreshToken)
            .tokenType("Bearer")
            .expiresIn(900L)
            .userId(userId)
            .email(user.getEmail())
            .fullName(user.getFullName())
            .systemRole(user.getSystemRole())
            .build());
    }

    /**
     * Validate current token.
     * GET /api/token/validate
     */
    @GetMapping("/validate")
    public ResponseEntity<Map<String, Object>> validateToken(
        @RequestHeader("Authorization") String bearerToken
    ) {
        String token = bearerToken.substring(7);

        boolean isValid = tokenProvider.validateToken(token);

        Map<String, Object> response = new HashMap<>();
        response.put("valid", isValid);

        if (isValid) {
            response.put("userId",    tokenProvider.getUserIdFromToken(token));
            response.put("email",     tokenProvider.getEmailFromToken(token));
            response.put("role",      tokenProvider.getSystemRoleFromToken(token));
            response.put("expiresAt", tokenProvider.getExpirationFromToken(token));
        }

        return ResponseEntity.ok(response);
    }
}
