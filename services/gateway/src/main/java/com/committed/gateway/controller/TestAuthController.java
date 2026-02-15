// services/gateway/src/main/java/com/committed/gateway/controller/TestAuthController.java
package com.committed.gateway.controller;

import com.committed.gateway.dto.JwtAuthenticationResponse;
import com.committed.gateway.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * ⚠️ TEMPORARY TEST CONTROLLER - FOR DEVELOPMENT ONLY
 * 
 * This controller provides endpoints to test JWT functionality
 * without requiring the full authentication system.
 * 
 * TODO: DELETE THIS FILE WHEN AUTH-002 IS IMPLEMENTED
 */
@RestController
@RequestMapping("/api/test-auth")
@RequiredArgsConstructor
@Slf4j
public class TestAuthController {
    
    private final JwtTokenProvider tokenProvider;
    
    /**
     * Generate a test token for a student
     * 
     * GET /api/test-auth/token/student
     */
    @GetMapping("/token/student")
    public ResponseEntity<JwtAuthenticationResponse> generateStudentToken() {
        log.info("Generating test token for STUDENT");
        
        String userId = "TEST-STUDENT-001";
        String email = "student@test.com";
        String fullName = "Test Student";
        String role = "STUDENT";
        
        String accessToken = tokenProvider.generateToken(userId, email, fullName, role);
        String refreshToken = tokenProvider.generateRefreshToken(userId);
        
        JwtAuthenticationResponse response = JwtAuthenticationResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .tokenType("Bearer")
            .expiresIn(86400L) // 24 hours in seconds
            .userId(userId)
            .email(email)
            .fullName(fullName)
            .role(role)
            .build();
        
        log.info("Generated token for user: {}", email);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Generate a test token for a professor
     * 
     * GET /api/test-auth/token/professor
     */
    @GetMapping("/token/professor")
    public ResponseEntity<JwtAuthenticationResponse> generateProfessorToken() {
        log.info("Generating test token for PROFESSOR");
        
        String userId = "TEST-PROF-001";
        String email = "professor@test.com";
        String fullName = "Test Professor";
        String role = "PROFESSOR";
        
        // Generate tokens
        String accessToken = tokenProvider.generateToken(userId, email, fullName, role);
        String refreshToken = tokenProvider.generateRefreshToken(userId);
        
        // Build response
        JwtAuthenticationResponse response = JwtAuthenticationResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .tokenType("Bearer")
            .expiresIn(86400L)
            .userId(userId)
            .email(email)
            .fullName(fullName)
            .role(role)
            .build();
        
        log.info("Generated token for user: {}", email);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Generate a test token for an admin
     * 
     * GET /api/test-auth/token/admin
     */
    @GetMapping("/token/admin")
    public ResponseEntity<JwtAuthenticationResponse> generateAdminToken() {
        log.info("Generating test token for ADMIN");
        
        // Mock admin data
        String userId = "TEST-ADMIN-001";
        String email = "admin@test.com";
        String fullName = "Test Admin";
        String role = "ADMIN";
        
        // Generate tokens
        String accessToken = tokenProvider.generateToken(userId, email, fullName, role);
        String refreshToken = tokenProvider.generateRefreshToken(userId);
        
        // Build response
        JwtAuthenticationResponse response = JwtAuthenticationResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .tokenType("Bearer")
            .expiresIn(86400L)
            .userId(userId)
            .email(email)
            .fullName(fullName)
            .role(role)
            .build();
        
        log.info("Generated token for user: {}", email);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Test endpoint - requires authentication (any role)
     * 
     * GET /api/test-auth/protected
     * Header: Authorization: Bearer <token>
     */
    @GetMapping("/protected")
    public ResponseEntity<Map<String, Object>> testProtectedEndpoint() {
        // Get current authenticated user from SecurityContext
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "You have successfully accessed a protected endpoint!");
        response.put("email", auth.getName());
        response.put("authorities", auth.getAuthorities());
        response.put("authenticated", auth.isAuthenticated());
        
        log.info("Protected endpoint accessed by: {}", auth.getName());
        return ResponseEntity.ok(response);
    }
    
    /**
     * Test endpoint - requires STUDENT role only
     * 
     * GET /api/test-auth/student-only
     * Header: Authorization: Bearer <token>
     */
    @GetMapping("/student-only")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Map<String, String>> testStudentOnly() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "This endpoint is accessible only to STUDENTS");
        response.put("role", "STUDENT");
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Test endpoint - requires PROFESSOR role only
     * 
     * GET /api/test-auth/professor-only
     * Header: Authorization: Bearer <token>
     */
    @GetMapping("/professor-only")
    @PreAuthorize("hasRole('PROFESSOR')")
    public ResponseEntity<Map<String, String>> testProfessorOnly() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "This endpoint is accessible only to PROFESSORS");
        response.put("role", "PROFESSOR");
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Test endpoint - requires ADMIN role only
     * 
     * GET /api/test-auth/admin-only
     * Header: Authorization: Bearer <token>
     */
    @GetMapping("/admin-only")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> testAdminOnly() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "This endpoint is accessible only to ADMINS");
        response.put("role", "ADMIN");
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Test endpoint - requires PROFESSOR or ADMIN role
     * 
     * GET /api/test-auth/staff-only
     * Header: Authorization: Bearer <token>
     */
    @GetMapping("/staff-only")
    @PreAuthorize("hasAnyRole('PROFESSOR', 'ADMIN')")
    public ResponseEntity<Map<String, String>> testStaffOnly() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "This endpoint is accessible to PROFESSORS and ADMINS");
        response.put("yourRole", auth.getAuthorities().toString());
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get information about the current user from JWT token
     * 
     * GET /api/test-auth/me
     * Header: Authorization: Bearer <token>
     */
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(
        @RequestHeader("Authorization") String bearerToken
    ) {
        // Extract token
        String token = bearerToken.substring(7); // Remove "Bearer " prefix
        
        // Get user info from token
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("userId", tokenProvider.getUserIdFromToken(token));
        userInfo.put("email", tokenProvider.getEmailFromToken(token));
        userInfo.put("fullName", tokenProvider.getFullNameFromToken(token));
        userInfo.put("role", tokenProvider.getRoleFromToken(token));
        userInfo.put("expiresAt", tokenProvider.getExpirationFromToken(token));
        userInfo.put("isExpired", tokenProvider.isTokenExpired(token));
        
        return ResponseEntity.ok(userInfo);
    }
}
