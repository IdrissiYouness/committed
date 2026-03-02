<?php

namespace App\DTO;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * DTO for updating a user's profile.
 * All fields are optional — only non-null fields are applied (partial update).
 * Called internally by Gateway → Core on PUT /api/users/{userId}/profile.
 */
class UpdateUserProfileRequest
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

    /**
     * Returns true if at least one updatable field is present.
     */
    public function hasUpdates(): bool
    {
        return $this->email !== null || $this->fullName !== null;
    }
}