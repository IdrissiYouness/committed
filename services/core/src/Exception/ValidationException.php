<?php

namespace App\Exception;

class ValidationException extends \RuntimeException
{
    private array $errors;

    public function __construct(array $errors, ?\Throwable $previous = null)
    {
        $this->errors = $errors;
        parent::__construct(
            'Validation failed: ' . json_encode($errors),
            400,
            $previous
        );
    }

    public function getErrors(): array
    {
        return $this->errors;
    }
}
