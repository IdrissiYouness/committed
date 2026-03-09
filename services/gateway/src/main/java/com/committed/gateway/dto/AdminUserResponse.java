package com.committed.gateway.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Client-facing user representation returned by admin endpoints.
 * Contains all user fields visible to an admin — does NOT include passwordHash.
 *
 * Returned by:
 *   GET  /api/admin/users        (inside the PagedResponse content list)
 *   PUT  /api/admin/users/{id}   (single updated user)
 *   DELETE /api/admin/users/{id} (deactivated user)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserResponse {

    private Long    userId;
    private String  email;
    private String  fullName;
    private String  systemRole;
    private Boolean isActive;
    private String  createdAt;
    private String  updatedAt;
}