<?php

namespace App\Exception;

class UserNotFoundException extends \RuntimeException
{
    public function __construct(string $email, ?\Throwable $previous = null)
    {
        parent::__construct(
            "User not found with email: {$email}",
            404,
            $previous
        );
    }
}
