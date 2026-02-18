// services/gateway/src/main/java/com/committed/gateway/controller/TokenController.java
package com.committed.gateway.controller;

import com.committed.gateway.dto.JwtAuthenticationResponse;
import com.committed.gateway.dto.TokenRefreshRequest;
import com.committed.gateway.security.JwtTokenProvider;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Token Controller
 * Handles token refresh and validation
 */
@RestController
@RequestMapping("/api/token")
@RequiredArgsConstructor
@Slf4j
public class TokenController {
    
    private final JwtTokenProvider tokenProvider;
    
    /**
     * Refresh access token using refresh token
     * 
     * POST /api/token/refresh
     * Body: { "refreshToken": "..." }
     */
    @PostMapping("/refresh")
    public ResponseEntity<JwtAuthenticationResponse> refreshToken(
        @Valid @RequestBody TokenRefreshRequest request
    ) {
        log.info("Token refresh requested");
        
        // Validate refresh token
        String refreshToken = request.getRefreshToken();
        tokenProvider.validateToken(refreshToken);
        
        // Extract user ID from refresh token
        String userId = tokenProvider.getUserIdFromToken(refreshToken);
        
        // TODO: In AUTH-002, we'll fetch user details from Core service
        // For now, return mock response
        String email = "user@example.com";
        String fullName = "Test User";
        String systemRole = "USER";
        
        // Generate new access token
        String newAccessToken = tokenProvider.generateToken(userId, email, fullName, systemRole);
        
        // Build response
        JwtAuthenticationResponse response = JwtAuthenticationResponse.builder()
            .accessToken(newAccessToken)
            .refreshToken(refreshToken) // Keep same refresh token
            .tokenType("Bearer")
            .expiresIn(86400L) // 24 hours in seconds
            .userId(userId)
            .email(email)
            .fullName(fullName)
            .systemRole(systemRole)
            .build();
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Validate current token
     * 
     * GET /api/token/validate
     * Header: Authorization: Bearer <token>
     */
    @GetMapping("/validate")
    public ResponseEntity<Map<String, Object>> validateToken(
        @RequestHeader("Authorization") String bearerToken
    ) {
        String token = bearerToken.substring(7); // Remove "Bearer " prefix
        
        boolean isValid = tokenProvider.validateToken(token);
        
        Map<String, Object> response = new HashMap<>();
        response.put("valid", isValid);
        
        if (isValid) {
            response.put("userId", tokenProvider.getUserIdFromToken(token));
            response.put("email", tokenProvider.getEmailFromToken(token));
            response.put("role", tokenProvider.getSystemRoleFromToken(token));
            response.put("expiresAt", tokenProvider.getExpirationFromToken(token));
        }
        
        return ResponseEntity.ok(response);
    }
}
