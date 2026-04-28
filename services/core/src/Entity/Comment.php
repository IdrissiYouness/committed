<?php

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use App\Repository\CommentRepository;

#[ORM\Entity(repositoryClass: CommentRepository::class)]
#[ORM\Table(name: 'comment')]
#[ORM\Index(name: 'idx_comment_announcement', columns: ['announcement_id'])]
#[ORM\Index(name: 'idx_comment_user', columns: ['user_id'])]
#[ORM\Index(name: 'idx_comment_parent', columns: ['parent_comment_id'])]
class Comment
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(name: 'comment_id', type: Types::INTEGER)]
    private ?int $commentId = null;

    #[ORM\ManyToOne(targetEntity: Announcement::class)]
    #[ORM\JoinColumn(name: 'announcement_id', referencedColumnName: 'announcement_id', nullable: false, onDelete: 'CASCADE')]
    private Announcement $announcement;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'user_id', nullable: false, onDelete: 'CASCADE')]
    private User $user;

    #[ORM\ManyToOne(targetEntity: Comment::class)]
    #[ORM\JoinColumn(name: 'parent_comment_id', referencedColumnName: 'comment_id', nullable: true, onDelete: 'CASCADE')]
    private ?Comment $parentComment = null;

    #[ORM\Column(name: 'content', type: Types::TEXT)]
    private string $content;

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_MUTABLE)]
    private \DateTime $createdAt;

    #[ORM\Column(name: 'updated_at', type: Types::DATETIME_MUTABLE)]
    private \DateTime $updatedAt;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
        $this->updatedAt = new \DateTime();
    }

    public function getCommentId(): ?int
    {
        return $this->commentId;
    }

    public function getAnnouncement(): Announcement
    {
        return $this->announcement;
    }

    public function setAnnouncement(Announcement $announcement): self
    {
        $this->announcement = $announcement;
        return $this;
    }

    public function getUser(): User
    {
        return $this->user;
    }

    public function setUser(User $user): self
    {
        $this->user = $user;
        return $this;
    }

    public function getParentComment(): ?Comment
    {
        return $this->parentComment;
    }

    public function setParentComment(?Comment $parentComment): self
    {
        $this->parentComment = $parentComment;
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

    public function getCreatedAt(): \DateTime
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTime $createdAt): self
    {
        $this->createdAt = $createdAt;
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
            'commentId' => $this->commentId,
            'announcementId' => isset($this->announcement) ? $this->announcement->getAnnouncementId() : null,
            'user' => isset($this->user) ? [
                'userId' => $this->user->getUserId(),
                'fullName' => $this->user->getFullName()
            ] : null,
            'parentCommentId' => $this->parentComment ? $this->parentComment->getCommentId() : null,
            'content' => $this->content,
            'createdAt' => $this->createdAt->format(\DateTime::ATOM),
            'updatedAt' => $this->updatedAt->format(\DateTime::ATOM),
        ];
    }
}