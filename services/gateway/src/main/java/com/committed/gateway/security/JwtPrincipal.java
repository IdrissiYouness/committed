package com.committed.gateway.security;

/**
 * Immutable principal stored in the Spring Security context after JWT validation.
 * Replaces the bare String (email) that was previously set as the principal,
 * so that controllers can access userId without re-parsing the token.
 *
 * Usage in controllers:
 *   @AuthenticationPrincipal JwtPrincipal principal
 *   principal.userId()   → e.g. "42"
 *   principal.email()    → e.g. "alice@example.com"
 *   principal.systemRole() → e.g. "USER"
 */
public record JwtPrincipal(
        String userId,
        String email,
        String systemRole
) {
    /**
     * Returns a human-readable string used in Spring Security logs.
     */
    @Override
    public String toString() {
        return "JwtPrincipal{userId='" + userId + "', email='" + email + "', role='" + systemRole + "'}";
    }
}