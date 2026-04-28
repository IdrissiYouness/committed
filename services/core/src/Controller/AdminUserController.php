<?php

namespace App\Controller;

use App\DTO\AdminUpdateUserRequest;
use App\Exception\DuplicateEmailException;
use App\Exception\InvalidOperationException;
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

/**
 * Admin User Controller — Internal
 *
 * These routes are called exclusively by the Gateway service (not exposed to the public).
 * Authorization enforcement (ADMIN role) happens at the Gateway level before these endpoints
 * are ever reached.
 *
 * All routes are prefixed with /api/internal/admin to distinguish them from
 * the public-facing internal user routes (/api/users/...).
 */
#[Route('/api/internal/admin')]
class AdminUserController extends AbstractController
{
    public function __construct(
        private UserService         $userService,
        private SerializerInterface $serializer,
        private ValidatorInterface  $validator,
        private LoggerInterface     $logger
    ) {
    }

    // -------------------------------------------------------------------------
    // GET /api/internal/admin/users
    // -------------------------------------------------------------------------

    /**
     * Return a paginated, optionally filtered list of all users.
     *
     * Query parameters:
     *   page     (int,    default 0)           — 0-based page index
     *   size     (int,    default 20, max 100) — results per page
     *   sortBy   (string, default 'createdAt') — field: fullName|email|createdAt|systemRole
     *   sortDir  (string, default 'desc')      — asc|desc
     *   role     (string, optional)            — filter by systemRole: user|admin
     *   isActive (bool,   optional)            — filter by active status: true|false
     *   search   (string, optional)            — partial match on fullName or email
     *
     * Called by Gateway on GET /api/admin/users.
     * The x-admin-id header carries the acting admin's userId forwarded by Gateway.
     */
    #[Route('/users', name: 'internal_admin_list_users', methods: ['GET'])]
    public function listUsers(Request $request): JsonResponse
    {
        $adminId = (int) $request->headers->get('x-admin-id', '0');

        $page    = max(0, (int) $request->query->get('page', 0));
        $size    = min(100, max(1, (int) $request->query->get('size', 20)));
        $sortBy  = $request->query->get('sortBy', 'createdAt');
        $sortDir = $request->query->get('sortDir', 'desc');
        $role    = $request->query->get('role');
        $search  = $request->query->get('search');

        // Parse optional isActive filter (accepts 'true'/'false' strings from query string)
        $isActiveParam = $request->query->get('isActive');
        $isActive      = null;
        if ($isActiveParam !== null) {
            $isActive = filter_var($isActiveParam, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        }

        // Validate role filter value
        if ($role !== null && !in_array($role, ['user', 'admin'], true)) {
            return $this->json(
                ['error' => 'Bad Request', 'message' => 'role must be one of: user, admin'],
                Response::HTTP_BAD_REQUEST
            );
        }

        $this->logger->info('ADMIN_ACTION adminId={adminId} action=LIST_USERS page={page} size={size} filters={filters}', [
            'adminId' => $adminId,
            'page'    => $page,
            'size'    => $size,
            'filters' => json_encode(['role' => $role, 'isActive' => $isActive, 'search' => $search]),
        ]);

        $result = $this->userService->adminListUsers(
            page:     $page,
            size:     $size,
            sortBy:   $sortBy,
            sortDir:  $sortDir,
            role:     $role,
            isActive: $isActive,
            search:   $search
        );

        return $this->json($result->toArray(), Response::HTTP_OK);
    }

    // -------------------------------------------------------------------------
    // PUT /api/internal/admin/users/{userId}
    // -------------------------------------------------------------------------

    /**
     * Partially update any user's account (fullName, email, systemRole, isActive).
     * Only non-null fields in the request body are applied.
     *
     * The x-admin-id header carries the acting admin's userId forwarded by Gateway
     * so that self-demotion / self-deactivation guards can be enforced in the service.
     *
     * Called by Gateway on PUT /api/admin/users/{userId}.
     */
    #[Route('/users/{userId}', name: 'internal_admin_update_user', methods: ['PUT'], requirements: ['userId' => '\d+'])]
    public function updateUser(int $userId, Request $request): JsonResponse
    {
        $adminId = (int) $request->headers->get('x-admin-id', '0');

        $this->logger->info('Received admin update-user request', [
            'adminId'  => $adminId,
            'targetId' => $userId,
        ]);

        try {
            /** @var AdminUpdateUserRequest $updateRequest */
            $updateRequest = $this->serializer->deserialize(
                $request->getContent(),
                AdminUpdateUserRequest::class,
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
                throw new ValidationException([
                    'body' => 'At least one field (fullName, email, systemRole, or isActive) must be provided',
                ]);
            }

            $profile = $this->userService->adminUpdateUser($userId, $adminId, $updateRequest);

            return $this->json($profile->toArray(), Response::HTTP_OK);

        } catch (ValidationException | UserNotFoundException | DuplicateEmailException | InvalidOperationException $e) {
            throw $e;
        } catch (\Exception $e) {
            $this->logger->error('Unexpected error in admin update-user', [
                'adminId'  => $adminId,
                'targetId' => $userId,
                'error'    => $e->getMessage(),
                'trace'    => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    // -------------------------------------------------------------------------
    // DELETE /api/internal/admin/users/{userId}
    // -------------------------------------------------------------------------

    /**
     * Soft-deactivate a user (sets isActive = false).
     * Hard deletes are not supported — deactivation is reversible via PUT.
     *
     * The x-admin-id header carries the acting admin's userId forwarded by Gateway
     * so that self-deactivation can be blocked in the service layer.
     *
     * Called by Gateway on DELETE /api/admin/users/{userId}.
     */
    #[Route('/users/{userId}', name: 'internal_admin_deactivate_user', methods: ['DELETE'], requirements: ['userId' => '\d+'])]
    public function deactivateUser(int $userId, Request $request): JsonResponse
    {
        $adminId = (int) $request->headers->get('x-admin-id', '0');

        $this->logger->info('Received admin deactivate-user request', [
            'adminId'  => $adminId,
            'targetId' => $userId,
        ]);

        try {
            $profile = $this->userService->adminDeactivateUser($userId, $adminId);

            return $this->json($profile->toArray(), Response::HTTP_OK);

        } catch (UserNotFoundException | InvalidOperationException $e) {
            throw $e;
        } catch (\Exception $e) {
            $this->logger->error('Unexpected error in admin deactivate-user', [
                'adminId'  => $adminId,
                'targetId' => $userId,
                'error'    => $e->getMessage(),
                'trace'    => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }
}