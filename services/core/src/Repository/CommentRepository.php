<?php

namespace App\Repository;

use App\Entity\Comment;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Doctrine\ORM\Tools\Pagination\Paginator;

/**
 * @extends ServiceEntityRepository<Comment>
 *
 * @method Comment|null find($id, $lockMode = null, $lockVersion = null)
 * @method Comment|null findOneBy(array $criteria, array $orderBy = null)
 * @method Comment[]    findAll()
 * @method Comment[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class CommentRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Comment::class);
    }

    public function save(Comment $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(Comment $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * @return Paginator Returns a paginated list of Comments for a given announcement
     */
    public function findByAnnouncementPaginated(int $announcementId, int $page = 0, int $size = 20): Paginator
    {
        $query = $this->createQueryBuilder('c')
            ->andWhere('c.announcement = :announcementId')
            ->setParameter('announcementId', $announcementId)
            ->orderBy('c.createdAt', 'ASC') // Oldest first is typical for comments
            ->setFirstResult($page * $size)
            ->setMaxResults($size)
            ->getQuery();

        return new Paginator($query);
    }
}