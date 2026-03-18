<?php

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use App\Repository\AnnouncementRepository;

#[ORM\Entity(repositoryClass: AnnouncementRepository::class)]
#[ORM\Table(name: 'announcement')]
#[ORM\Index(name: 'idx_announcement_posted_by', columns: ['posted_by'])]
#[ORM\Index(name: 'idx_announcement_course', columns: ['course_id'])]
#[ORM\Index(name: 'idx_announcement_posted_at', columns: ['posted_at'])]
class Announcement
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(name: 'announcement_id', type: Types::INTEGER)]
    private ?int $announcementId = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'posted_by', referencedColumnName: 'user_id', nullable: false, onDelete: 'CASCADE')]
    private User $postedBy;

    #[ORM\ManyToOne(targetEntity: Course::class)]
    #[ORM\JoinColumn(name: 'course_id', referencedColumnName: 'course_id', nullable: false, onDelete: 'CASCADE')]
    private Course $course;

    #[ORM\Column(name: 'title', type: Types::STRING, length: 500)]
    private string $title;

    #[ORM\Column(name: 'content', type: Types::TEXT)]
    private string $content;

    #[ORM\Column(name: 'posted_at', type: Types::DATETIME_MUTABLE)]
    private \DateTime $postedAt;

    #[ORM\Column(name: 'updated_at', type: Types::DATETIME_MUTABLE)]
    private \DateTime $updatedAt;

    public function __construct()
    {
        $this->postedAt = new \DateTime();
        $this->updatedAt = new \DateTime();
    }

    public function getAnnouncementId(): ?int
    {
        return $this->announcementId;
    }

    public function getPostedBy(): User
    {
        return $this->postedBy;
    }

    public function setPostedBy(User $postedBy): self
    {
        $this->postedBy = $postedBy;
        return $this;
    }

    public function getCourse(): Course
    {
        return $this->course;
    }

    public function setCourse(Course $course): self
    {
        $this->course = $course;
        return $this;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function setTitle(string $title): self
    {
        $this->title = $title;
        return $this;
    }

    public function getContent(): string
    {
        return $this->content;
    }

    public function setContent(string $content): self
    {
        $this->content = $content;
        return $this;
    }

    public function getPostedAt(): \DateTime
    {
        return $this->postedAt;
    }

    public function setPostedAt(\DateTime $postedAt): self
    {
        $this->postedAt = $postedAt;
        return $this;
    }

    public function getUpdatedAt(): \DateTime
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(\DateTime $updatedAt): self
    {
        $this->updatedAt = $updatedAt;
        return $this;
    }

    public function toArray(): array
    {
        return [
            'announcementId' => $this->announcementId,
            'postedBy' => isset($this->postedBy) ? [
                'userId' => $this->postedBy->getUserId(),
                'fullName' => $this->postedBy->getFullName()
            ] : null,
            'courseId' => isset($this->course) ? $this->course->getCourseId() : null,
            'title' => $this->title,
            'content' => $this->content,
            'postedAt' => $this->postedAt->format(\DateTime::ATOM),
            'updatedAt' => $this->updatedAt->format(\DateTime::ATOM),
        ];
    }
}