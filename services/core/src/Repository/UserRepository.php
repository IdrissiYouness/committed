<?php

namespace App\Repository;

use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * Repository for User queries (read-only)
 *
 * This repository only contains query methods.
 * Write operations (persist, remove, flush) are handled by EntityManager in the Service layer.
 *
 * @extends ServiceEntityRepository<User>
 */
class UserRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, User::class);
    }

    /**
     * Find user by email
     */
    public function findByEmail(string $email): ?User
    {
        return $this->createQueryBuilder('u')
            ->where('u.email = :email')
            ->setParameter('email', $email)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Find all active users
     */
    public function findActiveUsers(): array
    {
        return $this->createQueryBuilder('u')
            ->where('u.isActive = true')
            ->orderBy('u.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Find users by system role
     */
    public function findBySystemRole(string $role): array
    {
        return $this->createQueryBuilder('u')
            ->where('u.systemRole = :role')
            ->setParameter('role', $role)
            ->orderBy('u.fullName', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Find users with optional filters and pagination.
     *
     * @param int         $page      0-based page number
     * @param int         $size      Number of results per page
     * @param string      $sortBy    Column to sort by (whitelisted: fullName, email, createdAt, systemRole)
     * @param string      $sortDir   Sort direction: 'asc' or 'desc'
     * @param string|null $role      Filter by systemRole ('user' or 'admin')
     * @param bool|null   $isActive  Filter by active status
     * @param string|null $search    Partial match on fullName or email (case-insensitive)
     *
     * @return User[]
     */
    public function findPaginated(
        int     $page,
        int     $size,
        string  $sortBy   = 'createdAt',
        string  $sortDir  = 'desc',
        ?string $role     = null,
        ?bool   $isActive = null,
        ?string $search   = null
    ): array {
        $allowedSortFields = ['fullName', 'email', 'createdAt', 'systemRole'];
        $sortField = in_array($sortBy, $allowedSortFields, true) ? $sortBy : 'createdAt';
        $sortDirection = strtolower($sortDir) === 'asc' ? 'ASC' : 'DESC';

        $qb = $this->createQueryBuilder('u');

        $this->applyFilters($qb, $role, $isActive, $search);

        $qb->orderBy('u.' . $sortField, $sortDirection)
           ->setFirstResult($page * $size)
           ->setMaxResults($size);

        return $qb->getQuery()->getResult();
    }

    /**
     * Count users matching the same optional filters used by findPaginated.
     * Used to compute totalElements and totalPages for paginated responses.
     *
     * @param string|null $role     Filter by systemRole
     * @param bool|null   $isActive Filter by active status
     * @param string|null $search   Partial match on fullName or email
     */
    public function countWithFilters(
        ?string $role     = null,
        ?bool   $isActive = null,
        ?string $search   = null
    ): int {
        $qb = $this->createQueryBuilder('u')
            ->select('COUNT(u.userId)');

        $this->applyFilters($qb, $role, $isActive, $search);

        return (int) $qb->getQuery()->getSingleScalarResult();
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Apply common WHERE clauses for role / isActive / search filters.
     * Mutates the provided QueryBuilder in place so it can be reused
     * by both findPaginated and countWithFilters.
     */
    private function applyFilters(
        \Doctrine\ORM\QueryBuilder $qb,
        ?string                    $role,
        ?bool                      $isActive,
        ?string                    $search
    ): void {
        if ($role !== null) {
            $qb->andWhere('u.systemRole = :role')
               ->setParameter('role', $role);
        }

        if ($isActive !== null) {
            $qb->andWhere('u.isActive = :isActive')
               ->setParameter('isActive', $isActive);
        }

        if ($search !== null && $search !== '') {
            $qb->andWhere(
                $qb->expr()->orX(
                    $qb->expr()->like('LOWER(u.fullName)', ':search'),
                    $qb->expr()->like('LOWER(u.email)',    ':search')
                )
            )->setParameter('search', '%' . strtolower($search) . '%');
        }
    }

    /**
     * Count total users
     */
    public function countUsers(): int
    {
        return (int) $this->createQueryBuilder('u')
            ->select('COUNT(u.userId)')
            ->getQuery()
            ->getSingleScalarResult();
    }

    /**
     * Count active users
     */
    public function countActiveUsers(): int
    {
        return (int) $this->createQueryBuilder('u')
            ->select('COUNT(u.userId)')
            ->where('u.isActive = true')
            ->getQuery()
            ->getSingleScalarResult();
    }
}
