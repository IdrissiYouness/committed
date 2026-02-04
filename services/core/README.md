# Core Service

PHP Symfony service for core business logic of the CommitEd platform.

## Technology Stack

- PHP 8.2
- Symfony 7.0
- Oracle Database (OCI8)

## IDE Setup (PhpStorm)

1. Open PhpStorm
2. File → Open → Select `services/core` directory
3. PhpStorm will detect the Symfony project
4. Configure PHP interpreter:
   - Settings → PHP → CLI Interpreter
   - Add new interpreter (Docker or local PHP 8.2)

### Install Dependencies

```bash
composer install
```

### Run Configuration

1. Run → Edit Configurations
2. Add New Configuration → PHP Built-in Web Server
3. Host: localhost
4. Port: 8000
5. Document root: `public`
6. Environment variables:
   ```
   APP_ENV=dev
   APP_SECRET=symfony-secret-key-change-this
   DATABASE_URL=oci8://committed_user:SecurePassword123!@localhost:1521/XEPDB1
   ```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check endpoint |
| GET | `/db-test` | Database connectivity test |

## Local Development

```bash
# Install dependencies
composer install

# Start development server
php -S localhost:8000 -t public

# Or using Symfony CLI
symfony server:start
```

## Docker

```bash
# Build image
docker build -t commit-ed-core .

# Run container
docker run -p 8000:8000 commit-ed-core
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| APP_ENV | Environment (dev/prod) | dev |
| APP_SECRET | Symfony secret key | (required) |
| DATABASE_URL | Oracle connection string | (required) |
| GATEWAY_SERVICE_URL | Gateway service URL | http://gateway:8080 |
| ANALYZER_SERVICE_URL | Analyzer service URL | http://code-analyzer:5000 |
| NOTIFICATION_SERVICE_URL | Notification service URL | http://notifications:5001 |
