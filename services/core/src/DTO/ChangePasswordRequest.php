<?php

namespace App\DTO;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * DTO for changing a user's password.
 * Receives only the newPasswordHash — Gateway has already:
 *   1. Fetched the user's current hash from Core
 *   2. Verified the old password with BCrypt
 *   3. BCrypt-hashed the new password
 * Core simply stores the new hash.
 */
class ChangePasswordRequest
{
    #[Assert\NotBlank(message: 'New password hash is required')]
    #[Assert\Length(max: 255, maxMessage: 'Password hash cannot be longer than {{ limit }} characters')]
    private string $newPasswordHash;

    public function getNewPasswordHash(): string
    {
        return $this->newPasswordHash;
    }

    public function setNewPasswordHash(string $newPasswordHash): void
    {
        $this->newPasswordHash = $newPasswordHash;
    }
}