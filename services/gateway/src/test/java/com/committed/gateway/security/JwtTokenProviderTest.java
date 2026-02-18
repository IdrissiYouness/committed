// services/gateway/src/test/java/com/committed/gateway/security/JwtTokenProviderTest.java
package com.committed.gateway.security;

import com.committed.gateway.config.JwtConfig;
import com.committed.gateway.exception.JwtTokenException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.lenient;

/**
 * Unit tests for JwtTokenProvider
 */
@ExtendWith(MockitoExtension.class)
class JwtTokenProviderTest {
    
    @Mock
    private JwtConfig jwtConfig;
    
    private JwtTokenProvider tokenProvider;
    
    private static final String TEST_SECRET = "dGhpcy1pcy1hLXRlc3Qtc2VjcmV0LWtleS1mb3ItdGVzdGluZy1wdXJwb3Nlcy1vbmx5LW11c3QtYmUtMjU2LWJpdHMtbG9uZw==";
    private static final long TEST_EXPIRATION = 86400000L; // 24 hours
    private static final String TEST_ISSUER = "test-issuer";
    
    @BeforeEach
    void setUp() {
        lenient().when(jwtConfig.getSecret()).thenReturn(TEST_SECRET);
        lenient().when(jwtConfig.getExpiration()).thenReturn(TEST_EXPIRATION);
        lenient().when(jwtConfig.getRefreshExpiration()).thenReturn(604800000L);
        lenient().when(jwtConfig.getIssuer()).thenReturn(TEST_ISSUER);
        
        tokenProvider = new JwtTokenProvider(jwtConfig);
    }
    
    @Test
    void shouldGenerateValidToken() {
        String userId = "123";
        String email = "test@example.com";
        String fullName = "Test User";
        String systemRole = "USER";
        
        String token = tokenProvider.generateToken(userId, email, fullName, systemRole);
        
        assertNotNull(token);
        assertTrue(token.length() > 0);
        assertTrue(token.split("\\.").length == 3); // JWT has 3 parts
    }
    
    @Test
    void shouldValidateToken() {
        String token = tokenProvider.generateToken("123", "test@example.com", "Test User", "STUDENT");
        
        boolean isValid = tokenProvider.validateToken(token);
        
        assertTrue(isValid);
    }
    
    @Test
    void shouldExtractUserIdFromToken() {
        String userId = "123";
        String token = tokenProvider.generateToken(userId, "test@example.com", "Test User", "STUDENT");
        
        String extractedUserId = tokenProvider.getUserIdFromToken(token);
        
        assertEquals(userId, extractedUserId);
    }
    
    @Test
    void shouldExtractEmailFromToken() {
        String email = "test@example.com";
        String token = tokenProvider.generateToken("123", email, "Test User", "USER");
        
        String extractedEmail = tokenProvider.getEmailFromToken(token);
        
        assertEquals(email, extractedEmail);
    }
    
    @Test
    void shouldExtractSystemRoleFromToken() {
        String systemRole = "USER";
        String token = tokenProvider.generateToken("123", "test@example.com", "Test User", systemRole);
        
        String extractedRole = tokenProvider.getSystemRoleFromToken(token);
        
        assertEquals(systemRole, extractedRole);
    }
    
    @Test
    void shouldThrowExceptionForInvalidToken() {
        String invalidToken = "invalid.token.here";
        
        assertThrows(JwtTokenException.class, () -> {
            tokenProvider.validateToken(invalidToken);
        });
    }
    
    @Test
    void shouldThrowExceptionForExpiredToken() {
        when(jwtConfig.getExpiration()).thenReturn(1L); // 1 millisecond
        JwtTokenProvider shortExpiryProvider = new JwtTokenProvider(jwtConfig);
        
        String token = shortExpiryProvider.generateToken("123", "test@example.com", "Test User", "USER");
        
        try {
            Thread.sleep(10);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        assertThrows(JwtTokenException.class, () -> {
            shortExpiryProvider.validateToken(token);
        });
    }
    
    @Test
    void shouldGenerateRefreshToken() {
        String userId = "123";
        String refreshToken = tokenProvider.generateRefreshToken(userId);
        assertNotNull(refreshToken);
        assertTrue(refreshToken.length() > 0);
        assertTrue(tokenProvider.validateToken(refreshToken));
    }
}
