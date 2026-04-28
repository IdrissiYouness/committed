<?php

namespace App\Repository;

use App\Entity\Submission;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Doctrine\ORM\Tools\Pagination\Paginator;

class SubmissionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Submission::class);
    }

    public function findByAssignmentWithPagination(int $assignmentId, int $page = 1, int $limit = 20): Paginator
    {
        $query = $this->createQueryBuilder('s')
            ->andWhere('s.assignment = :val')
            ->setParameter('val', $assignmentId)
            ->orderBy('s.submittedAt', 'DESC')
            ->setFirstResult(($page - 1) * $limit)
            ->setMaxResults($limit)
            ->getQuery();

        return new Paginator($query);
    }

    public function findOneByStudentAndAssignment(int $studentId, int $assignmentId): ?Submission
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.student = :studentId')
            ->andWhere('s.assignment = :assignmentId')
            ->setParameter('studentId', $studentId)
            ->setParameter('assignmentId', $assignmentId)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
