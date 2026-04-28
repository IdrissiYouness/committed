package com.committed.gateway.controller;

import com.committed.gateway.dto.ApiResponse;
import com.committed.gateway.dto.AuthResponse;
import com.committed.gateway.dto.LogoutRequest;
import com.committed.gateway.dto.RegisterRequest;
import com.committed.gateway.dto.LoginRequest;
import com.committed.gateway.security.JwtPrincipal;
import com.committed.gateway.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;

    /** POST /api/auth/register */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
        @Valid @RequestBody RegisterRequest request
    ) {
        log.info("Registration request received for email: {}", request.getEmail());
        ApiResponse<AuthResponse> response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /** POST /api/auth/login */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
        @Valid @RequestBody LoginRequest request
    ) {
        log.info("Login request received for email: {}", request.getEmail());
        ApiResponse<AuthResponse> response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/auth/logout
     * Blacklists the current access token (and optionally the refresh token).
     * Requires a valid Bearer token — unauthenticated users are rejected by the filter chain.
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
        @RequestHeader("Authorization") String bearerToken,
        @RequestBody(required = false) LogoutRequest body,
        @AuthenticationPrincipal JwtPrincipal principal
    ) {
        log.info("Logout request for userId={}", principal.userId());
        authService.logout(bearerToken.substring(7), body, principal);
        return ResponseEntity.ok(ApiResponse.success(null, "Logged out successfully"));
    }
}
