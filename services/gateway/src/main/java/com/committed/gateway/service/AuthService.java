package com.committed.gateway.service;

import com.committed.gateway.client.CoreServiceClient;
import com.committed.gateway.dto.*;
import com.committed.gateway.dto.LoginRequest;
import com.committed.gateway.dto.internal.CreateUserRequest;
import com.committed.gateway.dto.internal.CreateUserResponse;
import com.committed.gateway.dto.internal.UserDetailsResponse;
import com.committed.gateway.exception.JwtTokenException;
import com.committed.gateway.security.JwtPrincipal;
import com.committed.gateway.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.committed.gateway.exception.InvalidCredentialsException;

import java.util.Date;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final CoreServiceClient     coreServiceClient;
    private final JwtTokenProvider      jwtTokenProvider;
    private final PasswordEncoder       passwordEncoder;
    private final TokenBlacklistService blacklistService;

    public ApiResponse<AuthResponse> register(RegisterRequest request) {
        log.info("Starting user registration for email: {}", request.getEmail());

        String passwordHash = passwordEncoder.encode(request.getPassword());

        CreateUserRequest coreRequest = CreateUserRequest.builder()
            .email(request.getEmail())
            .fullName(request.getFullName())
            .passwordHash(passwordHash)
            .build();

        CreateUserResponse coreResponse = coreServiceClient.createUser(coreRequest);
        log.info("User created in Core service: userId={}", coreResponse.getUserId());

        int tokenVersion = coreResponse.getTokenVersion() != null ? coreResponse.getTokenVersion() : 1;

        String accessToken = jwtTokenProvider.generateToken(
            coreResponse.getUserId().toString(),
            coreResponse.getEmail(),
            coreResponse.getFullName(),
            coreResponse.getSystemRole().toUpperCase(),
            tokenVersion
        );

        String refreshToken = jwtTokenProvider.generateRefreshToken(
            coreResponse.getUserId().toString()
        );

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

    public ApiResponse<AuthResponse> login(LoginRequest request) {
        log.info("Starting login for email: {}", request.getEmail());

        UserDetailsResponse coreUser = coreServiceClient.getUserByEmail(request.getEmail());

        if (Boolean.FALSE.equals(coreUser.getIsActive())) {
            log.warn("Login attempt for inactive account: {}", request.getEmail());
            throw new InvalidCredentialsException();
        }

        if (!passwordEncoder.matches(request.getPassword(), coreUser.getPasswordHash())) {
            log.warn("Invalid password for email: {}", request.getEmail());
            throw new InvalidCredentialsException();
        }

        int tokenVersion = coreUser.getTokenVersion() != null ? coreUser.getTokenVersion() : 1;

        String accessToken = jwtTokenProvider.generateToken(
            coreUser.getUserId().toString(),
            coreUser.getEmail(),
            coreUser.getFullName(),
            coreUser.getSystemRole().toUpperCase(),
            tokenVersion
        );

        String refreshToken = jwtTokenProvider.generateRefreshToken(
            coreUser.getUserId().toString()
        );

        log.info("Login successful for userId={}", coreUser.getUserId());

        UserResponse userResponse = UserResponse.builder()
            .userId(coreUser.getUserId())
            .email(coreUser.getEmail())
            .fullName(coreUser.getFullName())
            .systemRole(coreUser.getSystemRole())
            .isActive(coreUser.getIsActive())
            .createdAt(coreUser.getCreatedAt())
            .build();

        AuthResponse authResponse = AuthResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .user(userResponse)
            .tokenType("Bearer")
            .build();

        return ApiResponse.success(authResponse, "Login successful");
    }

    /**
     * Logout: blacklist the current access token and optionally the refresh token.
     * Client-side storage must also be cleared by the frontend.
     */
    public void logout(String accessToken, LogoutRequest body, JwtPrincipal principal) {
        String jti      = jwtTokenProvider.getJtiFromToken(accessToken);
        Date   exp      = jwtTokenProvider.getExpirationFromToken(accessToken);
        long   remaining = Math.max(0, (exp.getTime() - System.currentTimeMillis()) / 1000);
        blacklistService.blacklistToken(jti, remaining);
        log.info("Access token blacklisted for userId={}", principal.userId());

        if (body != null && body.getRefreshToken() != null) {
            try {
                jwtTokenProvider.validateToken(body.getRefreshToken());
                String refreshJti      = jwtTokenProvider.getJtiFromToken(body.getRefreshToken());
                Date   refreshExp      = jwtTokenProvider.getExpirationFromToken(body.getRefreshToken());
                long   refreshRemaining = Math.max(0, (refreshExp.getTime() - System.currentTimeMillis()) / 1000);
                blacklistService.blacklistToken(refreshJti, refreshRemaining);
                log.info("Refresh token blacklisted for userId={}", principal.userId());
            } catch (JwtTokenException ignored) {
                // Invalid refresh token on logout — ignore, access token already blacklisted
            }
        }
    }
}
