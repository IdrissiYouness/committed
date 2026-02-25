# Core Service

PHP Symfony service for core business logic of the Committed platform.

## Technology Stack

- PHP 8.3 (FPM Alpine)
- Symfony 7.4
- Doctrine ORM 3.6
- Doctrine Migrations
- PostgreSQL 16 (via `pdo_pgsql`)
- Nginx + Supervisord (production container)

## IDE Setup (PhpStorm)

1. Open PhpStorm
2. File → Open → Select `services/core` directory
3. PhpStorm will detect the Symfony project

### Install Dependencies

```bash
composer install
```

### Configuring PHP Interpreter

1. Go to **Settings → PHP**
2. Click **...** next to CLI Interpreter
3. Add a new interpreter:
    - **Local PHP** (if PHP 8.3 is installed locally)
    - Or **Docker** (recommended for consistency)
4. Select PHP 8.3 or higher

### Run Configuration

1. Run → Edit Configurations
2. Add New Configuration → PHP Built-in Web Server
3. Host: `localhost`
4. Port: `8000`
5. Document root: Select the `public` folder
6. Environment variables:
    ```
    APP_ENV=dev
    APP_SECRET=symfony-secret-key-change-this
    DATABASE_URL=postgresql://core_user:CoreSecurePass123!@localhost:5432/committed_core?serverVersion=16&charset=utf8
    ```

## Endpoints

| Method | Path      | Description                                    |
| ------ | --------- | ---------------------------------------------- |
| GET    | `/health` | Health check (DB status, table count, users)   |

## Local Development

```bash
# Install dependencies
composer install

# Start development server
php -S localhost:8000 -t public

# Or using Symfony CLI
symfony server:start

# Run Doctrine migrations (when migration files exist)
php bin/console doctrine:migrations:migrate

# Generate a migration from entity changes
php bin/console make:migration

# Validate the Doctrine schema against the database
php bin/console doctrine:schema:validate
```

## Docker

```bash
# Build image
docker build -t committed-core .

# Run container
docker run -p 8000:8000 committed-core
```

The Docker image uses PHP-FPM + Nginx managed by Supervisord for production-like performance.

## Project Structure

```
services/core/
├── config/
│   ├── packages/
│   │   ├── doctrine.yaml            # Doctrine DBAL + ORM config
│   │   ├── doctrine_migrations.yaml # Migration settings
│   │   ├── nelmio_cors.yaml         # CORS configuration
│   │   └── ...
│   ├── routes.yaml
│   └── services.yaml
├── docker/
│   ├── nginx.conf          # Nginx config for container
│   ├── supervisord.conf    # Supervisord process manager
│   └── php.ini             # PHP configuration overrides
├── migrations/             # Doctrine migration files
├── public/
│   └── index.php           # Application entry point
├── src/
│   ├── Controller/
│   │   └── HealthCheckController.php
│   ├── Entity/             # Doctrine ORM entities (to be created)
│   ├── Repository/         # Doctrine repositories (to be created)
│   └── Kernel.php
├── composer.json
├── Dockerfile
└── README.md
```

## Key Dependencies

| Package                          | Purpose                          |
| -------------------------------- | -------------------------------- |
| `doctrine/orm`                   | Object-Relational Mapping        |
| `doctrine/doctrine-bundle`       | Symfony integration for Doctrine |
| `doctrine/doctrine-migrations-bundle` | Database schema migrations  |
| `nelmio/cors-bundle`            | CORS header management           |
| `symfony/serializer`            | JSON serialization/deserialization |
| `symfony/validator`             | Request validation               |
| `symfony/uid`                   | UUID/ULID generation             |
| `symfony/property-access`       | Property accessor for serializer |

## Environment Variables

| Variable                 | Description                | Default                                                                                              |
| ------------------------ | -------------------------- | ---------------------------------------------------------------------------------------------------- |
| APP_ENV                  | Environment (dev/prod)     | dev                                                                                                  |
| APP_SECRET               | Symfony secret key         | (required)                                                                                           |
| DATABASE_URL             | PostgreSQL connection URL  | postgresql://core_user:CoreSecurePass123!@postgres-db:5432/committed_core?serverVersion=16&charset=utf8 |
| CORS_ALLOW_ORIGIN        | Allowed CORS origins       | `^https?://(localhost\|127\.0\.0\.1)(:[0-9]+)?$`                                                     |
| GATEWAY_SERVICE_URL      | Gateway service URL        | http://gateway:8080                                                                                  |
| ANALYZER_SERVICE_URL     | Analyzer service URL       | http://code-analyzer:5000                                                                            |
| NOTIFICATION_SERVICE_URL | Notification service URL   | http://notifications:5001                                                                            |

## Testing

```bash
# Health check endpoint (returns DB status + user data)
curl http://localhost:8000/health

# Test via Doctrine DBAL
docker exec committed-core php bin/console dbal:run-sql "SELECT COUNT(*) FROM users"

# Validate ORM mapping against database schema
docker exec committed-core php bin/console doctrine:schema:validate
```

## Next Steps

- [ ] Create Doctrine ORM entities mapped to existing PostgreSQL tables
- [ ] Create repositories for each entity
- [ ] Generate initial Doctrine migration from entities
- [ ] Implement CRUD endpoints for courses, assignments, submissions, and users
- [ ] Add request validation with Symfony Validator
