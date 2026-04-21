<?php

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use App\Repository\UserRepository;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: 'users')]
#[ORM\Index(name: 'idx_users_email', columns: ['email'])]
#[ORM\Index(name: 'idx_users_system_role', columns: ['system_role'])]
#[ORM\Index(name: 'idx_users_is_active', columns: ['is_active'])]
class User
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(name: 'user_id', type: Types::INTEGER)]
    private ?int $userId = null;

    #[ORM\Column(name: 'email', type: Types::STRING, length: 255, unique: true)]
    private string $email;

    #[ORM\Column(name: 'full_name', type: Types::STRING, length: 255)]
    private string $fullName;

    #[ORM\Column(name: 'password_hash', type: Types::STRING, length: 255)]
    private string $passwordHash;

    #[ORM\Column(name: 'system_role', type: Types::STRING, length: 20)]
    private string $systemRole = 'user';

    #[ORM\Column(name: 'is_active', type: Types::BOOLEAN)]
    private bool $isActive = true;

    #[ORM\Column(name: 'token_version', type: Types::INTEGER)]
    private int $tokenVersion = 1;

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_MUTABLE)]
    private \DateTime $createdAt;

    #[ORM\Column(name: 'updated_at', type: Types::DATETIME_MUTABLE)]
    private \DateTime $updatedAt;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
        $this->updatedAt = new \DateTime();
    }

    public function getUserId(): ?int
    {
        return $this->userId;
    }

    public function setUserId(?int $userId): self
    {
        $this->userId = $userId;
        return $this;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    public function setEmail(string $email): self
    {
        $this->email = $email;
        return $this;
    }

    public function getFullName(): string
    {
        return $this->fullName;
    }

    public function setFullName(string $fullName): self
    {
        $this->fullName = $fullName;
        return $this;
    }

    public function getPasswordHash(): string
    {
        return $this->passwordHash;
    }

    public function setPasswordHash(string $passwordHash): self
    {
        $this->passwordHash = $passwordHash;
        return $this;
    }

    public function getSystemRole(): string
    {
        return $this->systemRole;
    }

    public function setSystemRole(string $systemRole): self
    {
        $this->systemRole = $systemRole;
        return $this;
    }

    public function getIsActive(): bool
    {
        return $this->isActive;
    }

    public function setIsActive(bool $isActive): self
    {
        $this->isActive = $isActive;
        return $this;
    }

    public function isActive(): bool
    {
        return $this->isActive;
    }

    public function getTokenVersion(): int
    {
        return $this->tokenVersion;
    }

    public function setTokenVersion(int $tokenVersion): self
    {
        $this->tokenVersion = $tokenVersion;
        return $this;
    }

    public function incrementTokenVersion(): self
    {
        $this->tokenVersion++;
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
            'userId'       => $this->userId,
            'email'        => $this->email,
            'fullName'     => $this->fullName,
            'systemRole'   => $this->systemRole,
            'isActive'     => $this->isActive,
            'tokenVersion' => $this->tokenVersion,
            'createdAt'    => $this->createdAt->format(\DateTime::ATOM),
        ];
    }
}
