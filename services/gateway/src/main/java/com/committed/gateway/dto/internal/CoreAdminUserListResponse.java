package com.committed.gateway.dto.internal;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Internal DTO used to deserialise the paginated user list returned by Core on
 * GET /api/internal/admin/users.
 *
 * Core returns:
 * <pre>
 * {
 *   "users": [ { userId, email, fullName, systemRole, isActive, createdAt, updatedAt }, ... ],
 *   "pagination": {
 *     "page":          0,
 *     "size":          20,
 *     "totalElements": 47,
 *     "totalPages":    3,
 *     "hasNext":       true,
 *     "hasPrev":       false
 *   }
 * }
 * </pre>
 *
 * Gateway → Core communication only — never exposed to the client directly.
 * AdminService maps this into the client-facing {@link com.committed.gateway.dto.PagedResponse}
 * of {@link com.committed.gateway.dto.AdminUserResponse}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class CoreAdminUserListResponse {

    /**
     * The users on the current page.
     * Each entry is a flat map matching Core's GetUserProfileResponse#toArray() shape:
     * userId, email, fullName, systemRole, isActive, createdAt, updatedAt.
     */
    private List<Map<String, Object>> users;

    /**
     * Pagination metadata returned by Core.
     */
    private PaginationMeta pagination;

    /**
     * Nested pagination metadata — mirrors Core's PaginationMeta#toArray() shape.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PaginationMeta {

        private int  page;
        private int  size;
        private long totalElements;
        private int  totalPages;
        private boolean hasNext;
        private boolean hasPrev;
    }
}