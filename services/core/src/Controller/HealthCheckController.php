<?php

namespace App\Controller;

use Doctrine\DBAL\Connection;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

class HealthCheckController extends AbstractController
{
    #[Route("/health", name: "health_check", methods: ["GET"])]
    public function index(Connection $connection): JsonResponse
    {
        try {
            // Test basic connectivity
            $connection->executeQuery("SELECT 1");

            // Get user count
            $userCount = $connection->fetchOne("SELECT COUNT(*) FROM users");

            // Get list of users (limited to 10)
            $users = $connection->fetchAllAssociative(
                "SELECT user_id, email, full_name, system_role, is_active, created_at FROM users ORDER BY user_id LIMIT 10",
            );

            // Get table count in public schema
            $tableCount = $connection->fetchOne(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'",
            );

            return $this->json([
                "status" => "ok",
                "database" => [
                    "connected" => true,
                    "driver" => "pdo_pgsql",
                    "tables_count" => (int) $tableCount,
                ],
                "users" => [
                    "total_count" => (int) $userCount,
                    "sample" => array_map(
                        fn(array $user) => [
                            "user_id" => (int) $user["user_id"],
                            "email" => $user["email"],
                            "full_name" => $user["full_name"],
                            "system_role" => $user["system_role"],
                            "is_active" => (bool) $user["is_active"],
                            "created_at" => $user["created_at"],
                        ],
                        $users,
                    ),
                ],
                "timestamp" => (new \DateTimeImmutable())->format(
                    \DateTimeInterface::ATOM,
                ),
            ]);
        } catch (\Exception $e) {
            return $this->json(
                [
                    "status" => "error",
                    "database" => [
                        "connected" => false,
                        "error" => $e->getMessage(),
                    ],
                    "timestamp" => (new \DateTimeImmutable())->format(
                        \DateTimeInterface::ATOM,
                    ),
                ],
                503,
            );
        }
    }

    /**
     * Lightweight DB connectivity check used by the Gateway's chain test.
     * Returns the simple {"database": "connected"} format the Gateway expects.
     */
    #[Route("/db-test", name: "db_test", methods: ["GET"])]
    public function dbTest(Connection $connection): JsonResponse
    {
        try {
            $connection->executeQuery("SELECT 1");

            return $this->json([
                "database" => "connected",
                "timestamp" => (new \DateTimeImmutable())->format(
                    \DateTimeInterface::ATOM,
                ),
            ]);
        } catch (\Exception $e) {
            return $this->json(
                [
                    "database" => "disconnected",
                    "error" => $e->getMessage(),
                    "timestamp" => (new \DateTimeImmutable())->format(
                        \DateTimeInterface::ATOM,
                    ),
                ],
                503,
            );
        }
    }
}
