<?php

namespace App\Exception;

class DuplicateEmailException extends \RuntimeException
{
    public function __construct(string $email, ?\Throwable $previous = null)
    {
        parent::__construct(
            "Email already registered: {$email}",
            409,
            $previous
        );
    }
}
