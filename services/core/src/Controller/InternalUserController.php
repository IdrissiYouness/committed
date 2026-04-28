<?php

namespace App\Controller;

use App\DTO\ChangePasswordRequest;
use App\DTO\CreateUserRequest;
use App\DTO\FindUserByEmailRequest;
use App\DTO\UpdateUserProfileRequest;
use App\Exception\DuplicateEmailException;
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
                'userId' => $response->toArray()['userId'],
            ]);

            return $this->json($response->toArray(), Response::HTTP_CREATED);

        } catch (ValidationException | \App\Exception\DuplicateEmailException $e) {
            throw $e;
        } catch (\Exception $e) {
            $this->logger->error('Unexpected error creating user', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
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
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Get full user details by ID — called by Gateway's TokenController during refresh.
     * Returns tokenVersion; does NOT return passwordHash.
     * GET /api/users/{userId}/details
     */
    #[Route('/{userId}/details', name: 'internal_user_get_details', methods: ['GET'], requirements: ['userId' => '\d+'])]
    public function getUserDetails(int $userId): JsonResponse
    {
        $this->logger->info('Received get-details request', ['userId' => $userId]);

        try {
            $user = $this->userService->getUserById($userId);

            if ($user === null) {
                throw new UserNotFoundException('User not found');
            }

            $data = [
                'userId'       => $user->getUserId(),
                'email'        => $user->getEmail(),
                'fullName'     => $user->getFullName(),
                'systemRole'   => $user->getSystemRole(),
                'isActive'     => $user->isActive(),
                'tokenVersion' => $user->getTokenVersion(),
                'createdAt'    => $user->getCreatedAt()->format(\DateTime::ATOM),
            ];

            return $this->json($data, Response::HTTP_OK);

        } catch (UserNotFoundException $e) {
            throw $e;
        } catch (\Exception $e) {
            $this->logger->error('Unexpected error in get-details', [
                'userId' => $userId,
                'error'  => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Increment token_version for a user — called by Gateway after password change or deactivation.
     * PUT /api/users/{userId}/token-version
     */
    #[Route('/{userId}/token-version', name: 'internal_user_increment_token_version', methods: ['PUT'], requirements: ['userId' => '\d+'])]
    public function incrementTokenVersion(int $userId): JsonResponse
    {
        $this->logger->info('Received increment-token-version request', ['userId' => $userId]);

        try {
            $response = $this->userService->incrementTokenVersion($userId);

            return $this->json([
                'tokenVersion' => $response->toArray()['tokenVersion'],
            ], Response::HTTP_OK);

        } catch (UserNotFoundException $e) {
            throw $e;
        } catch (\Exception $e) {
            $this->logger->error('Unexpected error in increment-token-version', [
                'userId' => $userId,
                'error'  => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Get public profile for a user by ID — called by Gateway on GET /api/users/profile.
     * Does NOT return passwordHash.
     * GET /api/users/{userId}/profile
     */
    #[Route('/{userId}/profile', name: 'internal_user_get_profile', methods: ['GET'], requirements: ['userId' => '\d+'])]
    public function getProfile(int $userId): JsonResponse
    {
        $this->logger->info('Received get-profile request', ['userId' => $userId]);

        try {
            $profile = $this->userService->getProfile($userId);

            return $this->json($profile->toArray(), Response::HTTP_OK);

        } catch (UserNotFoundException $e) {
            throw $e;
        } catch (\Exception $e) {
            $this->logger->error('Unexpected error in get-profile', [
                'userId' => $userId,
                'error'  => $e->getMessage(),
                'trace'  => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Update a user's profile (fullName, email) — called by Gateway on PUT /api/users/profile.
     * All fields are optional; only non-null values are applied.
     * PUT /api/users/{userId}/profile
     */
    #[Route('/{userId}/profile', name: 'internal_user_update_profile', methods: ['PUT'], requirements: ['userId' => '\d+'])]
    public function updateProfile(int $userId, Request $request): JsonResponse
    {
        $this->logger->info('Received update-profile request', ['userId' => $userId]);

        try {
            $updateRequest = $this->serializer->deserialize(
                $request->getContent(),
                UpdateUserProfileRequest::class,
                'json'
            );

            $errors = $this->validator->validate($updateRequest);
            if (count($errors) > 0) {
                $errorMessages = [];
                foreach ($errors as $error) {
                    $errorMessages[$error->getPropertyPath()] = $error->getMessage();
                }
                throw new ValidationException($errorMessages);
            }

            if (!$updateRequest->hasUpdates()) {
                throw new ValidationException(['body' => 'At least one field (fullName or email) must be provided']);
            }

            $profile = $this->userService->updateProfile($userId, $updateRequest);

            return $this->json($profile->toArray(), Response::HTTP_OK);

        } catch (ValidationException | UserNotFoundException | DuplicateEmailException $e) {
            throw $e;
        } catch (\Exception $e) {
            $this->logger->error('Unexpected error in update-profile', [
                'userId' => $userId,
                'error'  => $e->getMessage(),
                'trace'  => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Change a user's password — called by Gateway on POST /api/users/profile/change-password.
     * Gateway verifies the old password before calling this endpoint.
     * Only the new BCrypt hash is accepted here.
     * PUT /api/users/{userId}/password
     */
    #[Route('/{userId}/password', name: 'internal_user_change_password', methods: ['PUT'], requirements: ['userId' => '\d+'])]
    public function changePassword(int $userId, Request $request): JsonResponse
    {
        $this->logger->info('Received change-password request', ['userId' => $userId]);

        try {
            $changeRequest = $this->serializer->deserialize(
                $request->getContent(),
                ChangePasswordRequest::class,
                'json'
            );

            $errors = $this->validator->validate($changeRequest);
            if (count($errors) > 0) {
                $errorMessages = [];
                foreach ($errors as $error) {
                    $errorMessages[$error->getPropertyPath()] = $error->getMessage();
                }
                throw new ValidationException($errorMessages);
            }

            $this->userService->changePassword($userId, $changeRequest);

            return $this->json([
                'message' => 'Password changed successfully',
            ], Response::HTTP_OK);

        } catch (ValidationException | UserNotFoundException $e) {
            throw $e;
        } catch (\Exception $e) {
            $this->logger->error('Unexpected error in change-password', [
                'userId' => $userId,
                'error'  => $e->getMessage(),
                'trace'  => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }
}