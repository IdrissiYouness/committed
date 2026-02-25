<?php

namespace App\EventListener;

use App\Exception\DuplicateEmailException;
use App\Exception\ValidationException;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\KernelEvents;

#[AsEventListener(event: KernelEvents::EXCEPTION)]
class ExceptionListener
{
    public function __construct(
        private LoggerInterface $logger,
        #[Autowire('%kernel.environment%')]
        private string $environment
    ) {
    }

    public function __invoke(ExceptionEvent $event): void
    {
        $exception = $event->getThrowable();

        // Create response based on exception type
        $response = $this->createResponse($exception);

        // Set the response
        $event->setResponse($response);
    }

    private function createResponse(\Throwable $exception): JsonResponse
    {
        $statusCode = 500;
        $error = 'Internal Server Error';
        $message = 'An unexpected error occurred';
        $details = null;

        // Handle specific exception types
        if ($exception instanceof DuplicateEmailException) {
            $statusCode = 409;
            $error = 'Conflict';
            $message = $exception->getMessage();
        } elseif ($exception instanceof ValidationException) {
            $statusCode = 400;
            $error = 'Bad Request';
            $message = 'Validation failed';
            $details = $exception->getErrors();
        } elseif ($exception instanceof HttpExceptionInterface) {
            $statusCode = $exception->getStatusCode();
            $error = $this->getErrorTitle($statusCode);
            $message = $exception->getMessage();
        } else {
            // Log unexpected errors
            $this->logger->error('Unexpected exception', [
                'exception' => get_class($exception),
                'message' => $exception->getMessage(),
                'trace' => $exception->getTraceAsString()
            ]);

            // Don't expose internal error details in production
            if ($this->environment === 'prod') {
                $message = 'An unexpected error occurred';
            } else {
                $message = $exception->getMessage();
            }
        }

        $responseData = [
            'error' => $error,
            'message' => $message,
        ];

        if ($details !== null) {
            $responseData['details'] = $details;
        }

        return new JsonResponse($responseData, $statusCode);
    }

    private function getErrorTitle(int $statusCode): string
    {
        return match ($statusCode) {
            400 => 'Bad Request',
            404 => 'Not Found',
            409 => 'Conflict',
            500 => 'Internal Server Error',
            default => 'Error',
        };
    }
}
