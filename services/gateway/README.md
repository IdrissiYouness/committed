# Gateway Service

Java Spring Boot service handling authentication and request routing for the Committed platform.

## Technology Stack

- Java 17
- Spring Boot 3.2
- Spring Data JPA
- Oracle Database

## IDE Setup (IntelliJ IDEA)

1. Open IntelliJ IDEA
2. File → Open → Select `services/gateway` directory
3. IntelliJ will detect the Maven project and import dependencies
4. Wait for indexing to complete

### Run Configuration

1. Run → Edit Configurations
2. Add New Configuration → Spring Boot
3. Main class: `com.committed.gateway.GatewayApplication`
4. Environment variables:
   ```
   SPRING_DATASOURCE_URL=jdbc:oracle:thin:@localhost:1521/XEPDB1
   SPRING_DATASOURCE_USERNAME=committed_user
   SPRING_DATASOURCE_PASSWORD=SecurePassword123!
   CORE_SERVICE_URL=http://localhost:8000
   ```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check endpoint |
| GET | `/test-chain` | Test end-to-end connectivity |
| GET | `/actuator/health` | Spring Actuator health |

## Local Development

```bash
# Run with Maven
./mvnw spring-boot:run

# Build JAR
./mvnw clean package

# Run JAR
java -jar target/gateway-0.0.1-SNAPSHOT.jar
```

## Docker

```bash
# Build image
docker build -t committed-gateway .

# Run container
docker run -p 8080:8080 committed-gateway
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| SPRING_DATASOURCE_URL | Oracle JDBC URL | jdbc:oracle:thin:@localhost:1521/XEPDB1 |
| SPRING_DATASOURCE_USERNAME | Database username | committed_user |
| SPRING_DATASOURCE_PASSWORD | Database password | SecurePassword123! |
| CORE_SERVICE_URL | Core service URL | http://core:8000 |
| JWT_SECRET | JWT signing secret | (required) |
| JWT_EXPIRATION | JWT expiration in ms | 86400000 |
