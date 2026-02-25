package com.committed.gateway.dto.internal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Internal DTO for creating user in Core service
 * Gateway -> Core communication
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateUserRequest {
    
    private String email;
    private String fullName;
    private String passwordHash;
    
    // systemRole defaults to 'user' in Core
}
