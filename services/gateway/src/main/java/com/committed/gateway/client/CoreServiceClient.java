package com.committed.gateway.client;

import com.committed.gateway.dto.internal.CreateUserRequest;
import com.committed.gateway.dto.internal.CreateUserResponse;
import com.committed.gateway.exception.EmailAlreadyExistsException;
import com.committed.gateway.exception.ServiceUnavailableException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

/**
 * Core Service Client
 * Handles communication with Core (PHP Symfony) service
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CoreServiceClient {

    private final RestTemplate restTemplate;

    @Value("${core.service.url:http://core:8000}")
    private String coreServiceUrl;

    /**
     * Create a new user in Core service
     *
     * @param request User creation request
     * @return Created user response
     * @throws EmailAlreadyExistsException if email already exists (409)
     * @throws ServiceUnavailableException if Core service is unavailable
     */
    public CreateUserResponse createUser(CreateUserRequest request) {
        String url = coreServiceUrl + "/api/users/create";

        log.info("Calling Core service to create user: {}", request.getEmail());

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<CreateUserRequest> entity = new HttpEntity<>(request, headers);

            ResponseEntity<CreateUserResponse> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                CreateUserResponse.class
            );

            if (response.getStatusCode() == HttpStatus.CREATED && response.getBody() != null) {
                log.info("User created successfully in Core: userId={}", response.getBody().getUserId());
                return response.getBody();
            } else {
                log.error("Unexpected response from Core: status={}", response.getStatusCode());
                throw new ServiceUnavailableException("Core");
            }

        } catch (HttpClientErrorException.Conflict ex) {
            // 409 Conflict - email already exists
            log.warn("Email already exists in Core: {}", request.getEmail());
            throw new EmailAlreadyExistsException(request.getEmail());

        } catch (HttpClientErrorException ex) {
            // Other 4xx errors
            log.error("Client error calling Core service: status={}, message={}",
                ex.getStatusCode(), ex.getMessage());
            throw new ServiceUnavailableException("Core", ex);

        } catch (ResourceAccessException ex) {
            // Connection error - Core service is down
            log.error("Cannot connect to Core service: {}", ex.getMessage());
            throw new ServiceUnavailableException("Core", ex);

        } catch (Exception ex) {
            // Unexpected error
            log.error("Unexpected error calling Core service: {}", ex.getMessage(), ex);
            throw new ServiceUnavailableException("Core", ex);
        }
    }
}
