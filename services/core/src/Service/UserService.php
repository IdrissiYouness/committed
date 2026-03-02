<?php

namespace App\Service;

use App\DTO\ChangePasswordRequest;
use App\DTO\CreateUserRequest;
use App\DTO\CreateUserResponse;
use App\DTO\GetUserProfileResponse;
use App\DTO\UpdateUserProfileRequest;
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
     * Create a new user in the database.
     *
     * @throws DuplicateEmailException if email already exists
     */
    public function createUser(CreateUserRequest $request): CreateUserResponse
    {
        $this->logger->info('Creating user', ['email' => $request->getEmail()]);

        $existingUser = $this->userRepository->findByEmail($request->getEmail());

        if ($existingUser !== null) {
            $this->logger->warning('Duplicate email attempt', ['email' => $request->getEmail()]);
            throw new DuplicateEmailException($request->getEmail());
        }

        $this->logger->info('Starting transaction...');
        $this->em->beginTransaction();

        try {
            $user = new User();
            $user->setEmail($request->getEmail());
            $user->setFullName($request->getFullName());
            $user->setPasswordHash($request->getPasswordHash());
            $user->setSystemRole('user');
            $user->setIsActive(true);

            $this->em->persist($user);
            $this->em->flush();
            $this->em->commit();

            $this->logger->info('User created successfully', [
                'userId' => $user->getUserId(),
                'email'  => $user->getEmail(),
            ]);

            return new CreateUserResponse(
                userId:     $user->getUserId(),
                email:      $user->getEmail(),
                fullName:   $user->getFullName(),
                systemRole: $user->getSystemRole(),
                isActive:   $user->isActive(),
                createdAt:  $user->getCreatedAt()->format(\DateTime::ATOM)
            );
        } catch (\Exception $e) {
            $this->em->rollback();

            $this->logger->error('Failed to create user', [
                'email' => $request->getEmail(),
                'error' => $e->getMessage(),
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
            throw UserNotFoundException::byEmail($email);
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
     * Get public profile for a user by ID.
     * Does NOT include passwordHash — safe to return via internal API.
     *
     * @throws UserNotFoundException if no user with that ID exists
     */
    public function getProfile(int $userId): GetUserProfileResponse
    {
        $this->logger->info('Fetching user profile', ['userId' => $userId]);

        $user = $this->userRepository->find($userId);

        if ($user === null) {
            $this->logger->warning('Profile fetch for unknown userId', ['userId' => $userId]);
            throw UserNotFoundException::byId($userId);
        }

        return $this->buildProfileResponse($user);
    }

    /**
     * Update a user's profile (fullName and/or email).
     * Only non-null fields in the request are applied.
     *
     * @throws UserNotFoundException       if no user with that ID exists
     * @throws DuplicateEmailException     if the new email is already taken by another user
     */
    public function updateProfile(int $userId, UpdateUserProfileRequest $request): GetUserProfileResponse
    {
        $this->logger->info('Updating user profile', ['userId' => $userId]);

        $user = $this->userRepository->find($userId);

        if ($user === null) {
            $this->logger->warning('Profile update for unknown userId', ['userId' => $userId]);
            throw UserNotFoundException::byId($userId);
        }

        // If email is changing, verify the new address is not already taken
        if ($request->getEmail() !== null && $request->getEmail() !== $user->getEmail()) {
            $existing = $this->userRepository->findByEmail($request->getEmail());
            if ($existing !== null) {
                $this->logger->warning('Profile email update conflicts with existing account', [
                    'userId'   => $userId,
                    'newEmail' => $request->getEmail(),
                ]);
                throw new DuplicateEmailException($request->getEmail());
            }
        }

        $this->em->beginTransaction();

        try {
            if ($request->getFullName() !== null) {
                $user->setFullName($request->getFullName());
            }

            if ($request->getEmail() !== null) {
                $user->setEmail($request->getEmail());
            }

            $user->setUpdatedAt(new \DateTime());

            $this->em->flush();
            $this->em->commit();

            $this->logger->info('User profile updated successfully', ['userId' => $userId]);

            return $this->buildProfileResponse($user);

        } catch (\Exception $e) {
            $this->em->rollback();

            $this->logger->error('Failed to update user profile', [
                'userId' => $userId,
                'error'  => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Replace a user's password hash.
     * Gateway is responsible for:
     *   1. Fetching the current hash
     *   2. Verifying the old password with BCrypt
     *   3. BCrypt-hashing the new password before calling this method
     *
     * @throws UserNotFoundException if no user with that ID exists
     */
    public function changePassword(int $userId, ChangePasswordRequest $request): void
    {
        $this->logger->info('Changing password for user', ['userId' => $userId]);

        $user = $this->userRepository->find($userId);

        if ($user === null) {
            $this->logger->warning('Password change for unknown userId', ['userId' => $userId]);
            throw UserNotFoundException::byId($userId);
        }

        $this->em->beginTransaction();

        try {
            $user->setPasswordHash($request->getNewPasswordHash());
            $user->setUpdatedAt(new \DateTime());

            $this->em->flush();
            $this->em->commit();

            $this->logger->info('Password changed successfully', ['userId' => $userId]);

        } catch (\Exception $e) {
            $this->em->rollback();

            $this->logger->error('Failed to change password', [
                'userId' => $userId,
                'error'  => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Get user by ID (raw entity — for internal service use).
     */
    public function getUserById(int $userId): ?User
    {
        return $this->userRepository->find($userId);
    }

    /**
     * Get user by email (raw entity — for internal service use).
     */
    public function getUserByEmail(string $email): ?User
    {
        return $this->userRepository->findByEmail($email);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function buildProfileResponse(User $user): GetUserProfileResponse
    {
        return new GetUserProfileResponse(
            userId:     $user->getUserId(),
            email:      $user->getEmail(),
            fullName:   $user->getFullName(),
            systemRole: $user->getSystemRole(),
            isActive:   $user->isActive(),
            createdAt:  $user->getCreatedAt()->format(\DateTime::ATOM),
            updatedAt:  $user->getUpdatedAt()->format(\DateTime::ATOM)
        );
    }
}