<?php

namespace App\Service;

use Doctrine\DBAL\Connection;
use Symfony\Contracts\Cache\CacheInterface;
use Symfony\Contracts\Cache\ItemInterface;

class CourseStatisticsService
{
    private Connection $connection;
    private CacheInterface $cache;

    public function __construct(Connection $connection, CacheInterface $cache)
    {
        $this->connection = $connection;
        $this->cache = $cache;
    }

    /**
     * Get statistics for a specific course, utilizing a cache to reduce DB load.
     */
    public function getCourseStats(int $courseId): array
    {
        $cacheKey = $this->getCacheKey($courseId);

        return $this->cache->get($cacheKey, function (ItemInterface $item) use ($courseId) {
            // Set a short TTL (e.g., 60 seconds) to ensure data is relatively fresh
            // but protects the database from bursts of identical queries.
            $item->expiresAfter(60);

            return [
                'totalStudents' => $this->getTotalStudents($courseId),
                'averageGrade' => $this->getAverageGrade($courseId),
                'completionRate' => null, // Stubbed for Phase 4
                'recentActivity' => [],   // Stubbed for Phase 4
            ];
        });
    }

    /**
     * Manually invalidate the cache for a course's stats (e.g., when an enrollment changes).
     */
    public function invalidateCourseStatsCache(int $courseId): void
    {
        $this->cache->delete($this->getCacheKey($courseId));
    }

    private function getCacheKey(int $courseId): string
    {
        return sprintf('course_stats_%d', $courseId);
    }

    private function getTotalStudents(int $courseId): int
    {
        $sql = "
            SELECT COUNT(*) 
            FROM enrollment 
            WHERE course_id = :courseId 
              AND course_role = 'student'
        ";

        $count = $this->connection->fetchOne($sql, ['courseId' => $courseId]);

        return (int) $count;
    }

    private function getAverageGrade(int $courseId): ?float
    {
        $sql = "
            SELECT AVG((g.points_earned / g.max_points) * 100) 
            FROM grade g
            JOIN submission s ON g.submission_id = s.submission_id
            JOIN assignment a ON s.assignment_id = a.assignment_id
            WHERE a.course_id = :courseId
        ";

        $avg = $this->connection->fetchOne($sql, ['courseId' => $courseId]);

        if ($avg === null || $avg === false) {
            return null;
        }

        return round((float) $avg, 2);
    }
}