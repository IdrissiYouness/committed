<?php

namespace App\EventListener;

use App\Exception\DuplicateEmailException;
use App\Exception\InvalidOperationException;
use App\Exception\UserNotFoundException;
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
        $event->setResponse($this->createResponse($exception));
    }

    private function createResponse(\Throwable $exception): JsonResponse
    {
        $statusCode = 500;
        $error      = 'Internal Server Error';
        $message    = 'An unexpected error occurred';
        $details    = null;

        if ($exception instanceof DuplicateEmailException) {
            $statusCode = 409;
            $error      = 'Conflict';
            $message    = $exception->getMessage();
        } elseif ($exception instanceof InvalidOperationException) {
            $statusCode = 400;
            $error      = 'Bad Request';
            $message    = $exception->getMessage();
        } elseif ($exception instanceof UserNotFoundException) {
            $statusCode = 404;
            $error      = 'Not Found';
            $message    = $exception->getMessage();
        } elseif ($exception instanceof ValidationException) {
            $statusCode = 400;
            $error      = 'Bad Request';
            $message    = 'Validation failed';
            $details    = $exception->getErrors();
        } elseif ($exception instanceof HttpExceptionInterface) {
            $statusCode = $exception->getStatusCode();
            $error      = $this->getErrorTitle($statusCode);
            $message    = $exception->getMessage();
        } else {
            $this->logger->error('Unexpected exception', [
                'exception' => get_class($exception),
                'message'   => $exception->getMessage(),
                'trace'     => $exception->getTraceAsString()
            ]);
            $message = $this->environment === 'prod'
                ? 'An unexpected error occurred'
                : $exception->getMessage();
        }

        $responseData = ['error' => $error, 'message' => $message];
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
