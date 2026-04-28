<?php

namespace App\DTO;

class CreateUserResponse
{
    public function __construct(
        private int    $userId,
        private string $email,
        private string $fullName,
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
            'systemRole'   => $this->systemRole,
            'isActive'     => $this->isActive,
            'tokenVersion' => $this->tokenVersion,
            'createdAt'    => $this->createdAt,
        ];
    }
}
