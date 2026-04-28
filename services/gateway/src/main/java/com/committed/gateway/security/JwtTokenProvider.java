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
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtTokenProvider {

    private final JwtConfig jwtConfig;

    private static final String CLAIM_USER_ID       = "userId";
    private static final String CLAIM_SYS_ROLE      = "systemRole";
    private static final String CLAIM_EMAIL         = "email";
    private static final String CLAIM_FULL_NAME     = "fullName";
    private static final String CLAIM_TOKEN_VERSION = "tokenVersion";

    /**
     * Generate JWT access token.
     * Includes a random JTI for blacklisting and a tokenVersion for session invalidation.
     */
    public String generateToken(String userId, String email, String fullName, String systemRole, int tokenVersion) {
        Date now        = new Date();
        Date expiryDate = new Date(now.getTime() + jwtConfig.getExpiration());

        Map<String, Object> claims = new HashMap<>();
        claims.put(CLAIM_USER_ID,       userId);
        claims.put(CLAIM_EMAIL,         email);
        claims.put(CLAIM_FULL_NAME,     fullName);
        claims.put(CLAIM_SYS_ROLE,      systemRole);
        claims.put(CLAIM_TOKEN_VERSION, tokenVersion);

        return Jwts.builder()
            .subject(email)
            .claims(claims)
            .id(UUID.randomUUID().toString())
            .issuer(jwtConfig.getIssuer())
            .issuedAt(now)
            .expiration(expiryDate)
            .signWith(getSigningKey(), Jwts.SIG.HS512)
            .compact();
    }

    /**
     * Generate refresh token.
     * Includes a random JTI for rotation/blacklisting and a type="refresh" claim.
     */
    public String generateRefreshToken(String userId) {
        Date now        = new Date();
        Date expiryDate = new Date(now.getTime() + jwtConfig.getRefreshExpiration());

        return Jwts.builder()
            .subject(userId)
            .id(UUID.randomUUID().toString())
            .claim("type", "refresh")
            .issuer(jwtConfig.getIssuer())
            .issuedAt(now)
            .expiration(expiryDate)
            .signWith(getSigningKey(), Jwts.SIG.HS512)
            .compact();
    }

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

    public String getJtiFromToken(String token) {
        return getClaimsFromToken(token).getId();
    }

    public String getUserIdFromToken(String token) {
        return getClaimsFromToken(token).get(CLAIM_USER_ID, String.class);
    }

    public String getUserIdSubjectFromToken(String token) {
        return getClaimsFromToken(token).getSubject();
    }

    public String getEmailFromToken(String token) {
        return getClaimsFromToken(token).getSubject();
    }

    public String getSystemRoleFromToken(String token) {
        return getClaimsFromToken(token).get(CLAIM_SYS_ROLE, String.class);
    }

    public String getFullNameFromToken(String token) {
        return getClaimsFromToken(token).get(CLAIM_FULL_NAME, String.class);
    }

    public int getTokenVersionFromToken(String token) {
        Integer v = getClaimsFromToken(token).get(CLAIM_TOKEN_VERSION, Integer.class);
        return v != null ? v : 0;
    }

    public String getTypeFromToken(String token) {
        return getClaimsFromToken(token).get("type", String.class);
    }

    public Date getExpirationFromToken(String token) {
        return getClaimsFromToken(token).getExpiration();
    }

    public boolean isTokenExpired(String token) {
        return getExpirationFromToken(token).before(new Date());
    }

    private Claims getClaimsFromToken(String token) {
        return Jwts.parser()
            .verifyWith(getSigningKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = jwtConfig.getSecret().getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
