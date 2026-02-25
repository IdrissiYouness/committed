package com.committed.gateway.service;

import com.committed.gateway.client.CoreServiceClient;
import com.committed.gateway.dto.*;
import com.committed.gateway.dto.internal.CreateUserRequest;
import com.committed.gateway.dto.internal.CreateUserResponse;
import com.committed.gateway.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Authentication Service
 * Handles user registration and authentication logic
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {
    
    private final CoreServiceClient coreServiceClient;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    
    /**
     * Register a new user
     * 
     * @param request Registration request
     * @return API response with auth tokens and user info
     */
    public ApiResponse<AuthResponse> register(RegisterRequest request) {
        log.info("Starting user registration for email: {}", request.getEmail());
        
        
        String passwordHash = passwordEncoder.encode(request.getPassword());
        log.debug("Password hashed successfully");
        
        
        CreateUserRequest coreRequest = CreateUserRequest.builder()
            .email(request.getEmail())
            .fullName(request.getFullName())
            .passwordHash(passwordHash)
            .build();
        
        CreateUserResponse coreResponse = coreServiceClient.createUser(coreRequest);
        log.info("User created in Core service: userId={}", coreResponse.getUserId());
        
        
        String accessToken = jwtTokenProvider.generateToken(
            coreResponse.getUserId().toString(),
            coreResponse.getEmail(),
            coreResponse.getFullName(),
            coreResponse.getSystemRole().toUpperCase() // Convert 'user' to 'USER' for JWT
        );
        
        String refreshToken = jwtTokenProvider.generateRefreshToken(
            coreResponse.getUserId().toString()
        );
        
        log.info("JWT tokens generated for user: userId={}", coreResponse.getUserId());
        
        
        UserResponse userResponse = UserResponse.builder()
            .userId(coreResponse.getUserId())
            .email(coreResponse.getEmail())
            .fullName(coreResponse.getFullName())
            .systemRole(coreResponse.getSystemRole())
            .isActive(coreResponse.getIsActive())
            .createdAt(coreResponse.getCreatedAt())
            .build();
        
        
        AuthResponse authResponse = AuthResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .user(userResponse)
            .tokenType("Bearer")
            .build();
        
        return ApiResponse.success(authResponse, "Registration successful");
    }
}
