package com.committed.gateway.dto.internal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Internal DTO — user details from Core including passwordHash.
 * Used only during login credential verification.
 * Never expose passwordHash in any public-facing response.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDetailsResponse {

    private Long    userId;
    private String  email;
    private String  fullName;
    private String  passwordHash;
    private String  systemRole;
    private Boolean isActive;
    private String  createdAt;
}
