<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

class HealthController extends AbstractController
{
    #[Route('/health', name: 'health', methods: ['GET'])]
    public function health(): JsonResponse
    {
        return $this->json([
            'status' => 'UP',
            'service' => 'core',
            'timestamp' => (new \DateTime())->format(\DateTime::ATOM),
        ]);
    }

    #[Route('/db-test', name: 'db_test', methods: ['GET'])]
    public function dbTest(): JsonResponse
    {
        $dbConnected = false;
        $dbMessage = '';

        try {
            // Get database URL from environment
            $databaseUrl = $_ENV['DATABASE_URL'] ?? getenv('DATABASE_URL');
            
            if ($databaseUrl) {
                // Parse the OCI8 connection string
                // Format: oci8://user:password@host:port/service
                if (preg_match('/oci8:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/', $databaseUrl, $matches)) {
                    $user = $matches[1];
                    $password = $matches[2];
                    $host = $matches[3];
                    $port = $matches[4];
                    $service = $matches[5];
                    
                    $connectionString = "(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST={$host})(PORT={$port}))(CONNECT_DATA=(SERVICE_NAME={$service})))";
                    
                    // Try to connect using OCI8
                    if (function_exists('oci_connect')) {
                        $conn = @oci_connect($user, $password, $connectionString);
                        
                        if ($conn) {
                            // Test query
                            $stmt = oci_parse($conn, 'SELECT 1 FROM DUAL');
                            if (oci_execute($stmt)) {
                                $dbConnected = true;
                                $dbMessage = 'Oracle database connected successfully';
                            }
                            oci_free_statement($stmt);
                            oci_close($conn);
                        } else {
                            $error = oci_error();
                            $dbMessage = 'Failed to connect: ' . ($error['message'] ?? 'Unknown error');
                        }
                    } else {
                        $dbMessage = 'OCI8 extension not available';
                    }
                } else {
                    $dbMessage = 'Invalid DATABASE_URL format';
                }
            } else {
                $dbMessage = 'DATABASE_URL not configured';
            }
        } catch (\Exception $e) {
            $dbMessage = 'Exception: ' . $e->getMessage();
        }

        return $this->json([
            'service' => 'core',
            'database' => $dbConnected ? 'connected' : 'disconnected',
            'message' => $dbMessage,
            'timestamp' => (new \DateTime())->format(\DateTime::ATOM),
        ]);
    }
}
