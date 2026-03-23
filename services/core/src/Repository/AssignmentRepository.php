<?php

namespace App\Repository;

use App\Entity\Assignment;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Assignment>
 *
 * @method Assignment|null find($id, $lockMode = null, $lockVersion = null)
 * @method Assignment|null findOneBy(array $criteria, array $orderBy = null)
 * @method Assignment[]    findAll()
 * @method Assignment[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class AssignmentRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Assignment::class);
    }

    public function save(Assignment $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(Assignment $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * @return array{data: Assignment[], total: int, page: int, size: int, totalPages: int}
     */
    public function findByCourseWithPagination(int $courseId, int $page = 0, int $size = 20): array
    {
        $qb = $this->createQueryBuilder('a')
            ->andWhere('a.course = :courseId')
            ->setParameter('courseId', $courseId)
            ->orderBy('a.createdAt', 'DESC');

        // Count total
        $countQb = clone $qb;
        $total = $countQb->select('COUNT(a.assignmentId)')
            ->resetDQLPart('orderBy')
            ->getQuery()
            ->getSingleScalarResult();

        // Get paginated data
        $qb->setFirstResult($page * $size)
           ->setMaxResults($size);

        $data = $qb->getQuery()->getResult();

        return [
            'data' => $data,
            'total' => (int) $total,
            'page' => $page,
            'size' => $size,
            'totalPages' => (int) ceil($total / $size)
        ];
    }
}