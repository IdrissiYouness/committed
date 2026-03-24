<?php

namespace App\Service;

use App\Entity\Assignment;
use App\Entity\Submission;

class SubmissionService
{
    public function determineStatus(Assignment $assignment): string
    {
        $dueDate = $assignment->getDueDate();
        if ($dueDate && new \DateTime() > $dueDate) {
            return 'late';
        }
        return 'submitted';
    }
}
