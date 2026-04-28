package com.committed.gateway.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for PUT /api/users/profile
 * All fields are optional — only provided (non-null) fields are applied.
 * At least one field must be present (enforced in ProfileService).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {

    @Email(message = "Email must be a valid email address")
    @Size(max = 255, message = "Email cannot exceed 255 characters")
    private String email;

    @Size(min = 2, max = 255, message = "Full name must be between 2 and 255 characters")
    private String fullName;
}