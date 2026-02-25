package com.committed.gateway.dto.internal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Internal DTO for user creation response from Core service
 * Core -> Gateway communication
 *
 * Note: createdAt is kept as String because Core (PHP Symfony) returns
 * ISO 8601 timestamps with timezone offsets (e.g. "2026-02-25T22:57:55+00:00")
 * which cannot be parsed by java.time.LocalDateTime. Since this value is just
 * passed through to the client-facing UserResponse, a String avoids
 * deserialization issues without losing any information.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateUserResponse {

    private Long userId;
    private String email;
    private String fullName;
    private String systemRole;
    private Boolean isActive;
    private String createdAt;
}
