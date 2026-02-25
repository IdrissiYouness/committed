package com.committed.gateway.controller;

import com.committed.gateway.dto.ApiResponse;
import com.committed.gateway.dto.AuthResponse;
import com.committed.gateway.dto.RegisterRequest;
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
}
