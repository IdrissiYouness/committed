package com.committed.gateway.dto.internal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Internal DTO sent from Gateway to Core on PUT /api/users/{userId}/profile.
 * Only non-null fields are applied by Core (partial update).
 * Gateway → Core communication only — never exposed to the client.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserProfileRequest {

    private String email;
    private String fullName;
}