<?php

namespace App\Repository;

use App\Entity\Enrollment;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Enrollment>
 *
 * @method Enrollment|null find($id, $lockMode = null, $lockVersion = null)
 * @method Enrollment|null findOneBy(array $criteria, array $orderBy = null)
 * @method Enrollment[]    findAll()
 * @method Enrollment[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class EnrollmentRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Enrollment::class);
    }

    public function save(Enrollment $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(Enrollment $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * Check if a user is already enrolled in a specific course.
     */
    public function findOneByCourseAndUser(int $courseId, int $userId): ?Enrollment
    {
        return $this->findOneBy([
            'course' => $courseId,
            'user' => $userId
        ]);
    }

    /**
     * Get all students enrolled in a specific course.
     * Returns an array of User objects.
     */
    public function findStudentsByCourseId(int $courseId): array
    {
        $enrollments = $this->createQueryBuilder('e')
            ->innerJoin('e.user', 'u')
            ->where('e.course = :courseId')
            ->andWhere('e.courseRole = :role')
            ->setParameter('courseId', $courseId)
            ->setParameter('role', 'student')
            ->getQuery()
            ->getResult();
            
        return array_map(fn($e) => $e->getUser(), $enrollments);
    }
}