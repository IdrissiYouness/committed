<?php

namespace App\Service;

use App\DTO\CreateUserRequest;
use App\DTO\CreateUserResponse;
use App\DTO\UserDetailsResponse;
use App\Entity\User;
use App\Exception\DuplicateEmailException;
use App\Exception\UserNotFoundException;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;

/**
 * User Service - Business Logic Layer
 *
 * Handles user-related business operations using:
 * - EntityManager for write operations (persist, remove, flush)
 * - UserRepository for read operations (queries)
 */
class UserService
{
    public function __construct(
        private EntityManagerInterface $em,
        private UserRepository $userRepository,
        private LoggerInterface $logger
    ) {
    }

    /**
     * Create a new user in the database
     *
     * @throws DuplicateEmailException if email already exists
     */

    public function createUser(CreateUserRequest $request): CreateUserResponse
    {
        $this->logger->info('Creating user', ['email' => $request->getEmail()]);

        // Check if email already exists (using repository for query)
        $existingUser = $this->userRepository->findByEmail($request->getEmail());

        if ($existingUser !== null) {
            $this->logger->warning('Duplicate email attempt', ['email' => $request->getEmail()]);
            throw new DuplicateEmailException($request->getEmail());
        }

        $this->logger->info('Starting transaction...');
        // Begin transaction
        $this->em->beginTransaction();

        try {
            // Create new user entity
            $user = new User();
            $user->setEmail($request->getEmail());
            $user->setFullName($request->getFullName());
            $user->setPasswordHash($request->getPasswordHash());
            $user->setSystemRole('user'); // Default role
            $user->setIsActive(true); // Active by default

            // Persist using EntityManager
            $this->em->persist($user);
            $this->em->flush();

            // Commit transaction
            $this->em->commit();

            $this->logger->info('User created successfully', [
                'userId' => $user->getUserId(),
                'email' => $user->getEmail()
            ]);

            // Return response DTO
            return new CreateUserResponse(
                userId: $user->getUserId(),
                email: $user->getEmail(),
                fullName: $user->getFullName(),
                systemRole: $user->getSystemRole(),
                isActive: $user->isActive(),
                createdAt: $user->getCreatedAt()->format(\DateTime::ATOM)
            );
        } catch (\Exception $e) {
            // Rollback on error
            $this->em->rollback();

            $this->logger->error('Failed to create user', [
                'email' => $request->getEmail(),
                'error' => $e->getMessage()
            ]);

            throw $e;
        }
    }

    /**
     * Get full user details including passwordHash.
     * Used internally by Gateway for login credential verification.
     *
     * @throws UserNotFoundException if no user with that email exists
     */
    public function getUserDetails(string $email): UserDetailsResponse
    {
        $this->logger->info('Fetching user details for login', ['email' => $email]);

        $user = $this->userRepository->findByEmail($email);

        if ($user === null) {
            $this->logger->warning('Login attempt for unknown email', ['email' => $email]);
            throw new UserNotFoundException($email);
        }

        return new UserDetailsResponse(
            userId:       $user->getUserId(),
            email:        $user->getEmail(),
            fullName:     $user->getFullName(),
            passwordHash: $user->getPasswordHash(),
            systemRole:   $user->getSystemRole(),
            isActive:     $user->isActive(),
            createdAt:    $user->getCreatedAt()->format(\DateTime::ATOM)
        );
    }

    /**
     * Get user by ID
     */
    public function getUserById(int $userId): ?User
    {
        return $this->userRepository->find($userId);
    }

    /**
     * Get user by email
     */
    public function getUserByEmail(string $email): ?User
    {
        return $this->userRepository->findByEmail($email);
    }
}
