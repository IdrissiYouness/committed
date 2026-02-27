package com.committed.gateway.controller;

import com.committed.gateway.dto.ApiResponse;
import com.committed.gateway.dto.AuthResponse;
import com.committed.gateway.dto.RegisterRequest;
import com.committed.gateway.dto.LoginRequest;
import com.committed.gateway.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Authentication Controller
 * Handles user authentication endpoints (register, login)
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {
    
    private final AuthService authService;
    
    /**
     * User Registration
     * POST /api/auth/register
     * 
     * @param request Registration request with email, fullName, password
     * @return AuthResponse with JWT tokens and user info
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
        @Valid @RequestBody RegisterRequest request
    ) {
        log.info("Registration request received for email: {}", request.getEmail());
        
        ApiResponse<AuthResponse> response = authService.register(request);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    /**
         * Login with email + password.
         * POST /api/auth/login
         * Returns JWT access + refresh tokens on success.
         * Returns 401 for invalid credentials (same message for wrong password and unknown email).
         */
        @PostMapping("/login")
        public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request
        ) {
            log.info("Login request received for email: {}", request.getEmail());
            ApiResponse<AuthResponse> response = authService.login(request);
            return ResponseEntity.ok(response);
        }
}
