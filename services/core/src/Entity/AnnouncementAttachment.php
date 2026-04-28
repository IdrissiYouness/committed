<?php

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use App\Repository\AnnouncementAttachmentRepository;

#[ORM\Entity(repositoryClass: AnnouncementAttachmentRepository::class)]
#[ORM\Table(name: 'announcement_attachment')]
#[ORM\Index(name: 'idx_ann_attach_announcement', columns: ['announcement_id'])]
#[ORM\Index(name: 'idx_ann_attach_uploaded_by', columns: ['uploaded_by'])]
class AnnouncementAttachment
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(name: 'attachment_id', type: Types::INTEGER)]
    private ?int $attachmentId = null;

    #[ORM\ManyToOne(targetEntity: Announcement::class)]
    #[ORM\JoinColumn(name: 'announcement_id', referencedColumnName: 'announcement_id', nullable: false, onDelete: 'CASCADE')]
    private Announcement $announcement;

    #[ORM\Column(name: 'file_name', type: Types::STRING, length: 500)]
    private string $fileName;

    #[ORM\Column(name: 'file_path', type: Types::STRING, length: 1000)]
    private string $filePath;

    #[ORM\Column(name: 'file_type', type: Types::STRING, length: 100, nullable: true)]
    private ?string $fileType = null;

    #[ORM\Column(name: 'file_size', type: Types::BIGINT, nullable: true)]
    private ?int $fileSize = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'uploaded_by', referencedColumnName: 'user_id', nullable: false, onDelete: 'CASCADE')]
    private User $uploadedBy;

    #[ORM\Column(name: 'uploaded_at', type: Types::DATETIME_MUTABLE)]
    private \DateTime $uploadedAt;

    public function __construct()
    {
        $this->uploadedAt = new \DateTime();
    }

    public function getAttachmentId(): ?int
    {
        return $this->attachmentId;
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

    public function getFileName(): string
    {
        return $this->fileName;
    }

    public function setFileName(string $fileName): self
    {
        $this->fileName = $fileName;
        return $this;
    }

    public function getFilePath(): string
    {
        return $this->filePath;
    }

    public function setFilePath(string $filePath): self
    {
        $this->filePath = $filePath;
        return $this;
    }

    public function getFileType(): ?string
    {
        return $this->fileType;
    }

    public function setFileType(?string $fileType): self
    {
        $this->fileType = $fileType;
        return $this;
    }

    public function getFileSize(): ?int
    {
        return $this->fileSize;
    }

    public function setFileSize(?int $fileSize): self
    {
        $this->fileSize = $fileSize;
        return $this;
    }

    public function getUploadedBy(): User
    {
        return $this->uploadedBy;
    }

    public function setUploadedBy(User $uploadedBy): self
    {
        $this->uploadedBy = $uploadedBy;
        return $this;
    }

    public function getUploadedAt(): \DateTime
    {
        return $this->uploadedAt;
    }

    public function setUploadedAt(\DateTime $uploadedAt): self
    {
        $this->uploadedAt = $uploadedAt;
        return $this;
    }

    public function toArray(): array
    {
        return [
            'attachmentId' => $this->attachmentId,
            'announcementId' => isset($this->announcement) ? $this->announcement->getAnnouncementId() : null,
            'fileName' => $this->fileName,
            'filePath' => $this->filePath,
            'fileType' => $this->fileType,
            'fileSize' => $this->fileSize,
            'uploadedBy' => isset($this->uploadedBy) ? [
                'userId' => $this->uploadedBy->getUserId(),
                'fullName' => $this->uploadedBy->getFullName()
            ] : null,
            'uploadedAt' => $this->uploadedAt->format(\DateTime::ATOM),
        ];
    }
}