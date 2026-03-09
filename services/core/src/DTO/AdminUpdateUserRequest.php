<?php

namespace App\DTO;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * DTO for an admin's partial update of any user account.
 * All fields are optional — only non-null fields are applied.
 *
 * Called internally by Gateway → Core on PUT /api/internal/admin/users/{userId}.
 */
class AdminUpdateUserRequest
{
    #[Assert\Email(message: 'Invalid email format')]
    #[Assert\Length(max: 255, maxMessage: 'Email cannot be longer than {{ limit }} characters')]
    private ?string $email = null;

    #[Assert\Length(
        min: 2,
        max: 255,
        minMessage: 'Full name must be at least {{ limit }} characters',
        maxMessage: 'Full name cannot be longer than {{ limit }} characters'
    )]
    #[Assert\NotBlank(message: 'Full name cannot be blank', allowNull: true)]
    private ?string $fullName = null;

    #[Assert\Choice(
        choices: ['user', 'admin'],
        message: 'System role must be one of: user, admin'
    )]
    private ?string $systemRole = null;

    private ?bool $isActive = null;

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(?string $email): void
    {
        $this->email = $email;
    }

    public function getFullName(): ?string
    {
        return $this->fullName;
    }

    public function setFullName(?string $fullName): void
    {
        $this->fullName = $fullName;
    }

    public function getSystemRole(): ?string
    {
        return $this->systemRole;
    }

    public function setSystemRole(?string $systemRole): void
    {
        $this->systemRole = $systemRole;
    }

    public function getIsActive(): ?bool
    {
        return $this->isActive;
    }

    public function setIsActive(?bool $isActive): void
    {
        $this->isActive = $isActive;
    }

    /**
     * Returns true if at least one updatable field is present.
     */
    public function hasUpdates(): bool
    {
        return $this->email      !== null
            || $this->fullName   !== null
            || $this->systemRole !== null
            || $this->isActive   !== null;
    }
}