<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260419120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Rename github-specific columns to generic names; add resubmission_count, grade.source, grade.is_finalized';
    }

    public function up(Schema $schema): void
    {
        // Rename github_repo_url → repo_url on submission
        $this->addSql('ALTER TABLE submission RENAME COLUMN github_repo_url TO repo_url');

        // Rename require_github_repo → require_repo_url on assignment
        $this->addSql('ALTER TABLE assignment RENAME COLUMN require_github_repo TO require_repo_url');

        // Track how many times a student has resubmitted (0 = first submission, 1 = first resubmission, 2 = locked)
        $this->addSql('ALTER TABLE submission ADD resubmission_count INTEGER DEFAULT 0 NOT NULL');

        // Track grade origin and finalization
        $this->addSql("ALTER TABLE grade ADD source VARCHAR(20) DEFAULT 'manual' NOT NULL");
        $this->addSql('ALTER TABLE grade ADD is_finalized BOOLEAN DEFAULT FALSE NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE submission RENAME COLUMN repo_url TO github_repo_url');
        $this->addSql('ALTER TABLE assignment RENAME COLUMN require_repo_url TO require_github_repo');
        $this->addSql('ALTER TABLE submission DROP COLUMN resubmission_count');
        $this->addSql('ALTER TABLE grade DROP COLUMN source');
        $this->addSql('ALTER TABLE grade DROP COLUMN is_finalized');
    }
}
