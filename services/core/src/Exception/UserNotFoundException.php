<?php

namespace App\Exception;

class UserNotFoundException extends \RuntimeException
{
    public function __construct(string $identifier, string $type = 'email', ?\Throwable $previous = null)
    {
        $message = match ($type) {
            'id'    => "User not found with ID: {$identifier}",
            default => "User not found with email: {$identifier}",
        };

        parent::__construct($message, 404, $previous);
    }

    public static function byEmail(string $email): self
    {
        return new self($email, 'email');
    }

    public static function byId(int $userId): self
    {
        return new self((string) $userId, 'id');
    }
}