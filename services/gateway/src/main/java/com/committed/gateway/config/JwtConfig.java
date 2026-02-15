package com.committed.gateway.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * JWT Configuration properties
 * Maps values from application.yml jwt.* properties
 */
@Configuration
@ConfigurationProperties(prefix = "jwt")
@Data
public class JwtConfig {
    
    /**
     * Secret key for signing JWT tokens
     * MUST be at least 256 bits (32 bytes) for HS256
     * Should be stored in environment variable in production
     */
    private String secret;
    
    /**
     * Token expiration time in milliseconds
     * Default: 86400000 ms = 24 hours
     */
    private long expiration;
    
    /**
     * Refresh token expiration time in milliseconds
     * Default: 604800000 ms = 7 days
     */
    private long refreshExpiration;
    
    /**
     * Token issuer identifier
     * Used to identify who issued the token
     */
    private String issuer;
}
