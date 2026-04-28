<?php

namespace App\Service;

use App\DTO\AdminUpdateUserRequest;
use App\DTO\AdminUserListResponse;
use App\DTO\ChangePasswordRequest;
use App\DTO\CreateUserRequest;
use App\DTO\CreateUserResponse;
use App\DTO\GetUserProfileResponse;
use App\DTO\PaginationMeta;
use App\DTO\UpdateUserProfileRequest;
use App\DTO\UserDetailsResponse;
use App\Entity\User;
use App\Exception\DuplicateEmailException;
use App\Exception\InvalidOperationException;
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
                userId:        $user->getUserId(),
                email:         $user->getEmail(),
                fullName:      $user->getFullName(),
                systemRole:    $user->getSystemRole(),
                isActive:      $user->isActive(),
                createdAt:     $user->getCreatedAt()->format(\DateTime::ATOM),
                tokenVersion:  $user->getTokenVersion()
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
            createdAt:    $user->getCreatedAt()->format(\DateTime::ATOM),
            tokenVersion: $user->getTokenVersion()
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

    // -------------------------------------------------------------------------
    // Admin Operations
    // -------------------------------------------------------------------------

    /**
     * Return a paginated, filtered list of all users.
     * Only admins should call this method (enforced at controller level).
     *
     * @param int         $page      0-based page number
     * @param int         $size      Page size (capped at 100)
     * @param string      $sortBy    Column name (whitelisted in repository)
     * @param string      $sortDir   'asc' or 'desc'
     * @param string|null $role      Optional systemRole filter
     * @param bool|null   $isActive  Optional isActive filter
     * @param string|null $search    Optional partial-match against fullName / email
     */
    public function adminListUsers(
        int     $page     = 0,
        int     $size     = 20,
        string  $sortBy   = 'createdAt',
        string  $sortDir  = 'desc',
        ?string $role     = null,
        ?bool   $isActive = null,
        ?string $search   = null
    ): AdminUserListResponse {
        // Cap page size to prevent runaway queries
        $size = min($size, 100);
        $page = max($page, 0);

        $this->logger->info('Admin listing users', [
            'page' => $page, 'size' => $size,
            'role' => $role, 'isActive' => $isActive, 'search' => $search,
        ]);

        $users = $this->userRepository->findPaginated($page, $size, $sortBy, $sortDir, $role, $isActive, $search);
        $total = $this->userRepository->countWithFilters($role, $isActive, $search);

        $pagination = PaginationMeta::create($page, $size, $total);

        $userArrays = array_map(
            fn(User $u) => $this->buildProfileResponse($u)->toArray(),
            $users
        );

        return new AdminUserListResponse($userArrays, $pagination);
    }

    /**
     * Partially update any user's account fields (fullName, email, systemRole, isActive).
     * Calling admin's own userId is passed in to enforce self-demotion and self-deactivation guards.
     *
     * @param int                    $targetUserId  The user to update
     * @param int                    $adminUserId   The admin performing the action (for guard checks)
     * @param AdminUpdateUserRequest $request       Fields to update (all optional)
     *
     * @throws UserNotFoundException      if targetUserId does not exist
     * @throws DuplicateEmailException    if the new email is already taken
     * @throws InvalidOperationException  if admin tries to demote or deactivate themselves
     */
    public function adminUpdateUser(
        int                    $targetUserId,
        int                    $adminUserId,
        AdminUpdateUserRequest $request
    ): GetUserProfileResponse {
        $this->logger->info('Admin updating user', [
            'adminId'  => $adminUserId,
            'targetId' => $targetUserId,
        ]);

        $user = $this->userRepository->find($targetUserId);
        if ($user === null) {
            throw UserNotFoundException::byId($targetUserId);
        }

        // Guard: admin cannot demote their own role
        if ($targetUserId === $adminUserId
            && $request->getSystemRole() !== null
            && $request->getSystemRole() === 'user'
        ) {
            $this->logger->warning('Admin attempted self-demotion', ['adminId' => $adminUserId]);
            throw new InvalidOperationException('Admins cannot demote their own system role');
        }

        // Guard: admin cannot deactivate themselves
        if ($targetUserId === $adminUserId
            && $request->getIsActive() === false
        ) {
            $this->logger->warning('Admin attempted self-deactivation via update', ['adminId' => $adminUserId]);
            throw new InvalidOperationException('Admins cannot deactivate their own account');
        }

        // Check new email is not taken by another account
        if ($request->getEmail() !== null && $request->getEmail() !== $user->getEmail()) {
            $existing = $this->userRepository->findByEmail($request->getEmail());
            if ($existing !== null) {
                throw new DuplicateEmailException($request->getEmail());
            }
        }

        $changes = [];

        $this->em->beginTransaction();

        try {
            if ($request->getFullName() !== null) {
                $changes['fullName'] = $user->getFullName() . ' → ' . $request->getFullName();
                $user->setFullName($request->getFullName());
            }

            if ($request->getEmail() !== null) {
                $changes['email'] = $user->getEmail() . ' → ' . $request->getEmail();
                $user->setEmail($request->getEmail());
            }

            if ($request->getSystemRole() !== null) {
                $changes['systemRole'] = $user->getSystemRole() . ' → ' . $request->getSystemRole();
                $user->setSystemRole($request->getSystemRole());
            }

            if ($request->getIsActive() !== null) {
                $changes['isActive'] = ($user->getIsActive() ? 'true' : 'false')
                    . ' → ' . ($request->getIsActive() ? 'true' : 'false');
                $user->setIsActive($request->getIsActive());
            }

            $user->setUpdatedAt(new \DateTime());

            $this->em->flush();
            $this->em->commit();

            $this->logger->info('ADMIN_ACTION adminId={adminId} action=UPDATE_USER targetId={targetId} changes={changes}', [
                'adminId'  => $adminUserId,
                'targetId' => $targetUserId,
                'changes'  => json_encode($changes),
            ]);

            return $this->buildProfileResponse($user);

        } catch (\Exception $e) {
            $this->em->rollback();
            $this->logger->error('Admin update failed', [
                'adminId'  => $adminUserId,
                'targetId' => $targetUserId,
                'error'    => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Soft-deactivate a user by setting isActive = false.
     * An admin cannot deactivate themselves.
     *
     * @throws UserNotFoundException     if targetUserId does not exist
     * @throws InvalidOperationException if the admin tries to deactivate themselves
     */
    public function adminDeactivateUser(int $targetUserId, int $adminUserId): GetUserProfileResponse
    {
        $this->logger->info('Admin deactivating user', [
            'adminId'  => $adminUserId,
            'targetId' => $targetUserId,
        ]);

        if ($targetUserId === $adminUserId) {
            $this->logger->warning('Admin attempted self-deactivation', ['adminId' => $adminUserId]);
            throw new InvalidOperationException('Admins cannot deactivate their own account');
        }

        $user = $this->userRepository->find($targetUserId);
        if ($user === null) {
            throw UserNotFoundException::byId($targetUserId);
        }

        $this->em->beginTransaction();

        try {
            $user->setIsActive(false);
            $user->setUpdatedAt(new \DateTime());

            $this->em->flush();
            $this->em->commit();

            $this->logger->info('ADMIN_ACTION adminId={adminId} action=DEACTIVATE_USER targetId={targetId}', [
                'adminId'  => $adminUserId,
                'targetId' => $targetUserId,
            ]);

            return $this->buildProfileResponse($user);

        } catch (\Exception $e) {
            $this->em->rollback();
            $this->logger->error('Admin deactivate failed', [
                'adminId'  => $adminUserId,
                'targetId' => $targetUserId,
                'error'    => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Increment token_version for a user, persisting the new value.
     * Called by Gateway after a password change or admin deactivation.
     *
     * @throws UserNotFoundException if no user with that ID exists
     */
    public function incrementTokenVersion(int $userId): UserDetailsResponse
    {
        $this->logger->info('Incrementing token version', ['userId' => $userId]);

        $user = $this->userRepository->find($userId);
        if ($user === null) {
            throw UserNotFoundException::byId($userId);
        }

        $user->incrementTokenVersion();
        $user->setUpdatedAt(new \DateTime());
        $this->em->flush();

        $this->logger->info('Token version incremented', [
            'userId'  => $userId,
            'version' => $user->getTokenVersion(),
        ]);

        return new UserDetailsResponse(
            userId:       $user->getUserId(),
            email:        $user->getEmail(),
            fullName:     $user->getFullName(),
            passwordHash: $user->getPasswordHash(),
            systemRole:   $user->getSystemRole(),
            isActive:     $user->isActive(),
            createdAt:    $user->getCreatedAt()->format(\DateTime::ATOM),
            tokenVersion: $user->getTokenVersion()
        );
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