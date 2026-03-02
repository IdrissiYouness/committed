package com.committed.gateway.exception;

/**
 * Thrown when login credentials are invalid (wrong password or unknown email).
 * Both cases map to HTTP 401 — same message to prevent email enumeration.
 * An optional custom message constructor is provided for cases such as
 * "new password must differ from current password".
 */
public class InvalidCredentialsException extends RuntimeException {

    public InvalidCredentialsException() {
        super("Invalid email or password");
    }

    public InvalidCredentialsException(String message) {
        super(message);
    }
}