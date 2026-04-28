package com.committed.gateway.dto.internal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Internal DTO sent from Gateway to Core on PUT /api/internal/admin/users/{userId}.
 * Only non-null fields are applied by Core (partial update).
 *
 * Gateway → Core communication only — never exposed to the client.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CoreAdminUpdateRequest {

    /** Updated full name — null means no change. */
    private String fullName;

    /** Updated email address — null means no change. */
    private String email;

    /**
     * Updated system role — null means no change.
     * Accepted values: "user", "admin".
     */
    private String systemRole;

    /**
     * Updated active flag — null means no change.
     * false = deactivate; true = reactivate.
     */
    private Boolean isActive;
}