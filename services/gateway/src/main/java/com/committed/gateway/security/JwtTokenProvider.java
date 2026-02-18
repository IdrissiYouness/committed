package com.committed.gateway.security;

import com.committed.gateway.config.JwtConfig;
import com.committed.gateway.exception.JwtTokenException;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * JWT Token Provider
 * Handles token generation, validation, and parsing
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtTokenProvider {
    
    private final JwtConfig jwtConfig;
    
    private static final String CLAIM_USER_ID = "userId";
    private static final String CLAIM_SYS_ROLE = "systemRole";
    private static final String CLAIM_EMAIL = "email";
    private static final String CLAIM_FULL_NAME = "fullName";
    
    /**
     * Generate JWT access token
     * 
     * @param userId User ID
     * @param email User email
     * @param fullName User full name
     * @param systemRole User system role (USER, ADMIN)
     * @return JWT token string
     */
    public String generateToken(String userId, String email, String fullName, String systemRole) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtConfig.getExpiration());
        
        Map<String, Object> claims = new HashMap<>();
        claims.put(CLAIM_USER_ID, userId);
        claims.put(CLAIM_EMAIL, email);
        claims.put(CLAIM_FULL_NAME, fullName);
        claims.put(CLAIM_SYS_ROLE, systemRole);
        
        return Jwts.builder()
            .subject(email)  
            .claims(claims)
            .issuer(jwtConfig.getIssuer())
            .issuedAt(now)
            .expiration(expiryDate)
            .signWith(getSigningKey(), Jwts.SIG.HS512)
            .compact();
    }
    
    /**
     * Generate refresh token
     * Refresh tokens have longer expiration time
     * 
     * @param userId User ID
     * @return Refresh token string
     */
    public String generateRefreshToken(String userId) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtConfig.getRefreshExpiration());
        
        return Jwts.builder()
            .subject(userId)
            .claim("type", "refresh")
            .issuer(jwtConfig.getIssuer())
            .issuedAt(now)
            .expiration(expiryDate)
            .signWith(getSigningKey(), Jwts.SIG.HS512)
            .compact();
    }
    
    /**
     * Validate JWT token
     * 
     * @param token JWT token
     * @return true if valid, false otherwise
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token);
            return true;
            
        } catch (SignatureException ex) {
            log.error("Invalid JWT signature: {}", ex.getMessage());
            throw new JwtTokenException("Invalid JWT signature");
            
        } catch (MalformedJwtException ex) {
            log.error("Invalid JWT token: {}", ex.getMessage());
            throw new JwtTokenException("Invalid JWT token");
            
        } catch (ExpiredJwtException ex) {
            log.error("Expired JWT token: {}", ex.getMessage());
            throw new JwtTokenException("Expired JWT token");
            
        } catch (UnsupportedJwtException ex) {
            log.error("Unsupported JWT token: {}", ex.getMessage());
            throw new JwtTokenException("Unsupported JWT token");
            
        } catch (IllegalArgumentException ex) {
            log.error("JWT claims string is empty: {}", ex.getMessage());
            throw new JwtTokenException("JWT claims string is empty");
        }
    }
    
    /**
     * Get user ID from token
     */
    public String getUserIdFromToken(String token) {
        Claims claims = getClaimsFromToken(token);
        return claims.get(CLAIM_USER_ID, String.class);
    }
    
    /**
     * Get email from token
     */
    public String getEmailFromToken(String token) {
        Claims claims = getClaimsFromToken(token);
        return claims.getSubject();
    }
    
    /**
     * Get role from token
     */
    public String getSystemRoleFromToken(String token) {
        Claims claims = getClaimsFromToken(token);
        return claims.get(CLAIM_SYS_ROLE, String.class);
    }
    
    /**
     * Get full name from token
     */
    public String getFullNameFromToken(String token) {
        Claims claims = getClaimsFromToken(token);
        return claims.get(CLAIM_FULL_NAME, String.class);
    }
    
    /**
     * Get expiration date from token
     */
    public Date getExpirationFromToken(String token) {
        Claims claims = getClaimsFromToken(token);
        return claims.getExpiration();
    }
    
    /**
     * Check if token is expired
     */
    public boolean isTokenExpired(String token) {
        Date expiration = getExpirationFromToken(token);
        return expiration.before(new Date());
    }
    
    /**
     * Get all claims from token
     */
    private Claims getClaimsFromToken(String token) {
        return Jwts.parser()
            .verifyWith(getSigningKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
    
    /**
     * Get signing key from secret
     */
    private SecretKey getSigningKey() {
        byte[] keyBytes = jwtConfig.getSecret().getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
