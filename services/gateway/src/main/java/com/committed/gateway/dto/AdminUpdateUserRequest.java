package com.committed.gateway.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request body for PUT /api/admin/users/{userId}.
 * All fields are optional — only non-null values are forwarded to Core.
 *
 * Validation is enforced here at the Gateway boundary so Core never receives
 * structurally invalid data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUpdateUserRequest {

    @Email(message = "Must be a valid email address")
    @Size(max = 255, message = "Email cannot exceed 255 characters")
    private String email;

    @Size(
        min = 2,
        max = 255,
        message = "Full name must be between 2 and 255 characters"
    )
    private String fullName;

    /**
     * System-level role assignment.
     * Accepted values: "user", "admin" (case-sensitive).
     */
    @Pattern(
        regexp = "^(user|admin)$",
        message = "systemRole must be one of: user, admin"
    )
    private String systemRole;

    /**
     * Set to false to deactivate the user (soft delete).
     * Set to true to reactivate a previously deactivated user.
     */
    private Boolean isActive;

    /**
     * Returns true if at least one updatable field is non-null.
     * Used by the controller to reject empty-body requests early.
     */
    public boolean hasUpdates() {
        return email      != null
            || fullName   != null
            || systemRole != null
            || isActive   != null;
    }
}