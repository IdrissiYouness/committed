package com.committed.gateway.dto.internal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Internal DTO sent from Gateway → Core for PUT /api/users/{userId}/password.
 * Contains only the BCrypt-hashed new password.
 *
 * Gateway is responsible for:
 *   1. Fetching the user's current passwordHash from Core (via find-by-email)
 *   2. Verifying the old password using BCrypt
 *   3. Hashing the new password with BCrypt
 * Core simply stores the resulting hash — it never sees the plaintext passwords.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChangePasswordCoreRequest {

    private String newPasswordHash;
}