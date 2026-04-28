<?php

namespace App\DTO;

/**
 * Public-facing user profile response DTO.
 * Safe to expose — does NOT contain passwordHash.
 * Used for GET /api/users/{userId}/profile and PUT /api/users/{userId}/profile responses.
 */
class GetUserProfileResponse
{
    public function __construct(
        private int    $userId,
        private string $email,
        private string $fullName,
        private string $systemRole,
        private bool   $isActive,
        private string $createdAt,
        private string $updatedAt
    ) {}

    public function getUserId(): int
    {
        return $this->userId;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    public function getFullName(): string
    {
        return $this->fullName;
    }

    public function getSystemRole(): string
    {
        return $this->systemRole;
    }

    public function getIsActive(): bool
    {
        return $this->isActive;
    }

    public function getCreatedAt(): string
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): string
    {
        return $this->updatedAt;
    }

    public function toArray(): array
    {
        return [
            'userId'     => $this->userId,
            'email'      => $this->email,
            'fullName'   => $this->fullName,
            'systemRole' => $this->systemRole,
            'isActive'   => $this->isActive,
            'createdAt'  => $this->createdAt,
            'updatedAt'  => $this->updatedAt,
        ];
    }
}