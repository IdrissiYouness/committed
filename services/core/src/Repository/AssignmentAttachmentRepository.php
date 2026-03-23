<?php

namespace App\Repository;

use App\Entity\AssignmentAttachment;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<AssignmentAttachment>
 *
 * @method AssignmentAttachment|null find($id, $lockMode = null, $lockVersion = null)
 * @method AssignmentAttachment|null findOneBy(array $criteria, array $orderBy = null)
 * @method AssignmentAttachment[]    findAll()
 * @method AssignmentAttachment[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class AssignmentAttachmentRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, AssignmentAttachment::class);
    }

    public function save(AssignmentAttachment $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(AssignmentAttachment $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }
}