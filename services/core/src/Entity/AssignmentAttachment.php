<?php

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use App\Repository\AssignmentAttachmentRepository;

#[ORM\Entity(repositoryClass: AssignmentAttachmentRepository::class)]
#[ORM\Table(name: 'assignment_attachment')]
#[ORM\Index(name: 'idx_assign_attach_assignment', columns: ['assignment_id'])]
#[ORM\Index(name: 'idx_assign_attach_uploaded_by', columns: ['uploaded_by'])]
class AssignmentAttachment
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(name: 'attachment_id', type: Types::INTEGER)]
    private ?int $attachmentId = null;

    #[ORM\ManyToOne(targetEntity: Assignment::class, inversedBy: 'attachments')]
    #[ORM\JoinColumn(name: 'assignment_id', referencedColumnName: 'assignment_id', nullable: false, onDelete: 'CASCADE')]
    private Assignment $assignment;

    #[ORM\Column(name: 'file_name', type: Types::STRING, length: 500)]
    private string $fileName;

    #[ORM\Column(name: 'file_path', type: Types::STRING, length: 1000)]
    private string $filePath;

    #[ORM\Column(name: 'file_type', type: Types::STRING, length: 100, nullable: true)]
    private ?string $fileType = null;

    #[ORM\Column(name: 'file_size', type: Types::BIGINT, nullable: true)]
    private ?string $fileSize = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'uploaded_by', referencedColumnName: 'user_id', nullable: false, onDelete: 'CASCADE')]
    private User $uploadedBy;

    #[ORM\Column(name: 'uploaded_at', type: Types::DATETIME_MUTABLE)]
    private \DateTimeInterface $uploadedAt;

    public function __construct()
    {
        $this->uploadedAt = new \DateTime();
    }

    public function getAttachmentId(): ?int
    {
        return $this->attachmentId;
    }

    public function getAssignment(): Assignment
    {
        return $this->assignment;
    }

    public function setAssignment(Assignment $assignment): self
    {
        $this->assignment = $assignment;
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

    public function getFileSize(): ?string
    {
        return $this->fileSize;
    }

    public function setFileSize(?string $fileSize): self
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

    public function getUploadedAt(): \DateTimeInterface
    {
        return $this->uploadedAt;
    }

    public function setUploadedAt(\DateTimeInterface $uploadedAt): self
    {
        $this->uploadedAt = $uploadedAt;
        return $this;
    }
}