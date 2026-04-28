package com.committed.gateway.exception;

/**
 * Exception thrown when attempting to register with an email that already exists
 * Maps to HTTP 409 Conflict
 */
public class EmailAlreadyExistsException extends RuntimeException {
    
    public EmailAlreadyExistsException(String email) {
        super("Email already registered: " + email);
    }
}
