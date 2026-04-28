package com.committed.gateway.exception;

/**
 * Thrown when a user cannot be found by ID in the Core service.
 * Maps to HTTP 404 Not Found.
 */
public class UserNotFoundException extends RuntimeException {

    public UserNotFoundException(Long userId) {
        super("User not found with ID: " + userId);
    }

    public UserNotFoundException(String message) {
        super(message);
    }
}