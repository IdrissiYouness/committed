<?php

namespace App\DTO;

use Symfony\Component\Validator\Constraints as Assert;

class CreateUserRequest
{
    #[Assert\NotBlank(message: 'Email is required')]
    #[Assert\Email(message: 'Invalid email format')]
    #[Assert\Length(max: 255, maxMessage: 'Email cannot be longer than {{ limit }} characters')]
    private string $email;

    #[Assert\NotBlank(message: 'Full name is required')]
    #[Assert\Length(
        min: 2,
        max: 255,
        minMessage: 'Full name must be at least {{ limit }} characters',
        maxMessage: 'Full name cannot be longer than {{ limit }} characters'
    )]
    private string $fullName;

    #[Assert\NotBlank(message: 'Password hash is required')]
    #[Assert\Length(max: 255, maxMessage: 'Password hash cannot be longer than {{ limit }} characters')]
    private string $passwordHash;

    public function getEmail(): string
    {
        return $this->email;
    }

    public function setEmail(string $email): void
    {
        $this->email = $email;
    }

    public function getFullName(): string
    {
        return $this->fullName;
    }

    public function setFullName(string $fullName): void
    {
        $this->fullName = $fullName;
    }

    public function getPasswordHash(): string
    {
        return $this->passwordHash;
    }

    public function setPasswordHash(string $passwordHash): void
    {
        $this->passwordHash = $passwordHash;
    }
}
