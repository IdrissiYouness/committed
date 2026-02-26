<?php

namespace App\Controller;

use App\DTO\CreateUserRequest;
use App\DTO\FindUserByEmailRequest;
use App\Exception\UserNotFoundException;
use App\Exception\ValidationException;
use App\Service\UserService;
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
        private UserService         $userService,
        private SerializerInterface $serializer,
        private ValidatorInterface  $validator,
        private LoggerInterface     $logger
    ) {
    }

    /**
     * Create user — called by Gateway during registration.
     * POST /api/users/create
     */
    #[Route('/create', name: 'internal_user_create', methods: ['POST'])]
    public function createUser(Request $request): JsonResponse
    {
        $this->logger->info('Received user creation request');

        try {
            $createUserRequest = $this->serializer->deserialize(
                $request->getContent(),
                CreateUserRequest::class,
                'json'
            );

            $errors = $this->validator->validate($createUserRequest);
            if (count($errors) > 0) {
                $errorMessages = [];
                foreach ($errors as $error) {
                    $errorMessages[$error->getPropertyPath()] = $error->getMessage();
                }
                throw new ValidationException($errorMessages);
            }

            $response = $this->userService->createUser($createUserRequest);

            $this->logger->info('User created successfully', [
                'userId' => $response->toArray()['userId']
            ]);

            return $this->json($response->toArray(), Response::HTTP_CREATED);

        } catch (ValidationException | \App\Exception\DuplicateEmailException $e) {
            throw $e;
        } catch (\Exception $e) {
            $this->logger->error('Unexpected error creating user', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Find user by email — called by Gateway during login.
     * Returns user details including passwordHash for credential verification.
     * POST /api/users/find-by-email
     */
    #[Route('/find-by-email', name: 'internal_user_find_by_email', methods: ['POST'])]
    public function findByEmail(Request $request): JsonResponse
    {
        $this->logger->info('Received find-by-email request');

        try {
            $findRequest = $this->serializer->deserialize(
                $request->getContent(),
                FindUserByEmailRequest::class,
                'json'
            );

            $errors = $this->validator->validate($findRequest);
            if (count($errors) > 0) {
                $errorMessages = [];
                foreach ($errors as $error) {
                    $errorMessages[$error->getPropertyPath()] = $error->getMessage();
                }
                throw new ValidationException($errorMessages);
            }

            $userDetails = $this->userService->getUserDetails($findRequest->getEmail());

            return $this->json($userDetails->toArray(), Response::HTTP_OK);

        } catch (ValidationException | UserNotFoundException $e) {
            throw $e;
        } catch (\Exception $e) {
            $this->logger->error('Unexpected error in find-by-email', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }
}
