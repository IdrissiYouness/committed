<?php

namespace App\Repository;

use App\Entity\AnnouncementAttachment;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<AnnouncementAttachment>
 *
 * @method AnnouncementAttachment|null find($id, $lockMode = null, $lockVersion = null)
 * @method AnnouncementAttachment|null findOneBy(array $criteria, array $orderBy = null)
 * @method AnnouncementAttachment[]    findAll()
 * @method AnnouncementAttachment[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class AnnouncementAttachmentRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, AnnouncementAttachment::class);
    }

    public function save(AnnouncementAttachment $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(AnnouncementAttachment $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * @return AnnouncementAttachment[] Returns an array of AnnouncementAttachment objects
     */
    public function findByAnnouncementId(int $announcementId): array
    {
        return $this->createQueryBuilder('a')
            ->andWhere('a.announcement = :announcementId')
            ->setParameter('announcementId', $announcementId)
            ->orderBy('a.uploadedAt', 'ASC')
            ->getQuery()
            ->getResult()
        ;
    }
}