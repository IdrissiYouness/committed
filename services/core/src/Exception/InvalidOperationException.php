<?php

namespace App\Exception;

/**
 * Thrown when an admin attempts an operation that is not permitted on their own account.
 * Examples:
 *   - An admin trying to deactivate themselves
 *   - An admin trying to demote their own role to 'user'
 *
 * Maps to HTTP 400 Bad Request.
 */
class InvalidOperationException extends \RuntimeException
{
    public function __construct(string $message, ?\Throwable $previous = null)
    {
        parent::__construct($message, 400, $previous);
    }
}