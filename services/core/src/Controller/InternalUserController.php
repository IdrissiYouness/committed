<?php

namespace App\Controller;

use App\DTO\CreateUserRequest;
use App\Service\UserService;
use App\Exception\ValidationException;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/users')]
class InternalUserController extends AbstractController
{
    public function __construct(
        private UserService $userService,
        private SerializerInterface $serializer,
        private ValidatorInterface $validator,
        private LoggerInterface $logger
    ) {
    }

    /**
     * Internal endpoint for creating users (called by Gateway)
     * POST /api/users/create
     */
    #[Route('/create', name: 'internal_user_create', methods: ['POST'])]
    public function createUser(Request $request): JsonResponse
    {
        $this->logger->info('Received user creation request');

        try {
            // Deserialize JSON request to DTO
            $createUserRequest = $this->serializer->deserialize(
                $request->getContent(),
                CreateUserRequest::class,
                'json'
            );

            // Validate the DTO
            $errors = $this->validator->validate($createUserRequest);
            if (count($errors) > 0) {
                $errorMessages = [];
                foreach ($errors as $error) {
                    $errorMessages[$error->getPropertyPath()] = $error->getMessage();
                }
                throw new ValidationException($errorMessages);
            }

            // Create user via service
            $response = $this->userService->createUser($createUserRequest);

            $this->logger->info('User created successfully', [
                'userId' => $response->toArray()['userId']
            ]);

            // Return 201 Created with user data
            return $this->json(
                $response->toArray(),
                Response::HTTP_CREATED
            );

        } catch (ValidationException | \App\Exception\DuplicateEmailException $e) {
            // These exceptions are handled by ExceptionListener
            throw $e;
        } catch (\Exception $e) {
            $this->logger->error('Unexpected error creating user', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            throw $e;
        }
    }
}
