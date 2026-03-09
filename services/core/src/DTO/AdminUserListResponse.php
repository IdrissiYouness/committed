<?php

namespace App\DTO;

/**
 * Response DTO for the admin paginated user list.
 * Wraps an array of user profile arrays together with pagination metadata.
 *
 * Returned by Core on GET /api/internal/admin/users and forwarded by Gateway
 * to the client as the body of GET /api/admin/users.
 */
class AdminUserListResponse
{
    /**
     * @param array<int, array<string, mixed>> $users      Array of serialised user profiles (no passwordHash)
     * @param PaginationMeta                   $pagination Pagination metadata
     */
    public function __construct(
        private array          $users,
        private PaginationMeta $pagination
    ) {}

    public function getUsers(): array
    {
        return $this->users;
    }

    public function getPagination(): PaginationMeta
    {
        return $this->pagination;
    }

    public function toArray(): array
    {
        return [
            'users'      => $this->users,
            'pagination' => $this->pagination->toArray(),
        ];
    }
}