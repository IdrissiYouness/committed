<?php

namespace App\DTO;

class CreateUserResponse
{
    private int $userId;
    private string $email;
    private string $fullName;
    private string $systemRole;
    private bool $isActive;
    private string $createdAt;

    public function __construct(
        int $userId,
        string $email,
        string $fullName,
        string $systemRole,
        bool $isActive,
        string $createdAt
    ) {
        $this->userId = $userId;
        $this->email = $email;
        $this->fullName = $fullName;
        $this->systemRole = $systemRole;
        $this->isActive = $isActive;
        $this->createdAt = $createdAt;
    }

    public function toArray(): array
    {
        return [
            'userId' => $this->userId,
            'email' => $this->email,
            'fullName' => $this->fullName,
            'systemRole' => $this->systemRole,
            'isActive' => $this->isActive,
            'createdAt' => $this->createdAt,
        ];
    }
}
