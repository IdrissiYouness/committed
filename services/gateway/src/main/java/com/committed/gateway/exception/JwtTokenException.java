package com.committed.gateway.exception;

/**
 * JWT Token Exception
 * Thrown when JWT token validation fails
 */
public class JwtTokenException extends RuntimeException {
    
    public JwtTokenException(String message) {
        super(message);
    }
    
    public JwtTokenException(String message, Throwable cause) {
        super(message, cause);
    }
}
