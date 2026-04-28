<?php

namespace App\DTO;

/**
 * Internal DTO for returning user details including passwordHash.
 * Only used for internal Gateway → Core communication (login).
 * Never expose this to public-facing endpoints.
 */
class UserDetailsResponse
{
    public function __construct(
        private int    $userId,
        private string $email,
        private string $fullName,
        private string $passwordHash,
        private string $systemRole,
        private bool   $isActive,
        private string $createdAt,
        private int    $tokenVersion = 1
    ) {}

    public function toArray(): array
    {
        return [
            'userId'       => $this->userId,
            'email'        => $this->email,
            'fullName'     => $this->fullName,
            'passwordHash' => $this->passwordHash,
            'systemRole'   => $this->systemRole,
            'isActive'     => $this->isActive,
            'tokenVersion' => $this->tokenVersion,
            'createdAt'    => $this->createdAt,
        ];
    }
}
