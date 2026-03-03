package com.committed.gateway.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Public-facing user profile response DTO.
 * Returned by GET /api/users/profile and PUT /api/users/profile.
 * Does NOT contain passwordHash — safe to send to the client.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {

    private Long    userId;
    private String  email;
    private String  fullName;
    private String  systemRole;
    private Boolean isActive;
    private String  createdAt;
    private String  updatedAt;
}