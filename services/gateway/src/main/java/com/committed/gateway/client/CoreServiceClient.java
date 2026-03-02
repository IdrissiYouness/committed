package com.committed.gateway.client;

import com.committed.gateway.dto.UserProfileResponse;
import com.committed.gateway.dto.internal.ChangePasswordCoreRequest;
import com.committed.gateway.dto.internal.CreateUserRequest;
import com.committed.gateway.dto.internal.CreateUserResponse;
import com.committed.gateway.dto.internal.UpdateUserProfileRequest;
import com.committed.gateway.dto.internal.UserDetailsResponse;
import com.committed.gateway.exception.EmailAlreadyExistsException;
import com.committed.gateway.exception.InvalidCredentialsException;
import com.committed.gateway.exception.ServiceUnavailableException;
import com.committed.gateway.exception.UserNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import java.util.Map;

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

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private HttpHeaders jsonHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

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
            HttpEntity<CreateUserRequest> entity = new HttpEntity<>(request, jsonHeaders());

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
    
    /**
         * Find user by email in Core service — used during login.
         * Returns user details including passwordHash for credential verification.
         *
         * @throws InvalidCredentialsException if user not found (404) — prevents email enumeration
         * @throws ServiceUnavailableException if Core service is unavailable
         */
    public UserDetailsResponse getUserByEmail(String email) {
        String url = coreServiceUrl + "/api/users/find-by-email";

        log.info("Calling Core service to find user by email: {}", email);

        try {
            // POST with body to avoid email appearing in server access logs
            Map<String, String> body = Map.of("email", email);
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, jsonHeaders());
    
            ResponseEntity<UserDetailsResponse> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                UserDetailsResponse.class
            );

            log.info("User found in Core: userId={}", response.getBody().getUserId());
            return response.getBody();

        } catch (HttpClientErrorException.NotFound ex) {
            // 404 → treat as invalid credentials (don't reveal whether email exists)
            log.warn("User not found in Core for login attempt");
            throw new InvalidCredentialsException();

        } catch (HttpClientErrorException ex) {
            log.error("Client error calling Core find-by-email: status={}", ex.getStatusCode());
            throw new ServiceUnavailableException("Core", ex);

        } catch (ResourceAccessException ex) {
            log.error("Cannot connect to Core service: {}", ex.getMessage());
            throw new ServiceUnavailableException("Core", ex);

        } catch (Exception ex) {
            log.error("Unexpected error calling Core find-by-email: {}", ex.getMessage(), ex);
            throw new ServiceUnavailableException("Core", ex);
        }
    }

    /**
     * Fetch the public profile of a user by ID.
     * Called by Gateway on GET /api/users/profile.
     *
     * @throws UserNotFoundException       if Core returns 404
     * @throws ServiceUnavailableException if Core is unreachable
     */
    public UserProfileResponse getUserProfile(Long userId) {
        String url = coreServiceUrl + "/api/users/" + userId + "/profile";

        log.info("Calling Core service to get profile for userId={}", userId);

        try {
            HttpEntity<Void> entity = new HttpEntity<>(jsonHeaders());

            ResponseEntity<UserProfileResponse> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                UserProfileResponse.class
            );

            log.info("Profile fetched from Core for userId={}", userId);
            return response.getBody();

        } catch (HttpClientErrorException.NotFound ex) {
            log.warn("User not found in Core: userId={}", userId);
            throw new UserNotFoundException(userId);

        } catch (HttpClientErrorException ex) {
            log.error("Client error calling Core get-profile: status={}", ex.getStatusCode());
            throw new ServiceUnavailableException("Core", ex);

        } catch (ResourceAccessException ex) {
            log.error("Cannot connect to Core service: {}", ex.getMessage());
            throw new ServiceUnavailableException("Core", ex);

        } catch (Exception ex) {
            log.error("Unexpected error calling Core get-profile: {}", ex.getMessage(), ex);
            throw new ServiceUnavailableException("Core", ex);
        }
    }

    /**
     * Update a user's profile (fullName and/or email) in Core.
     * Called by Gateway on PUT /api/users/profile.
     *
     * @throws UserNotFoundException       if Core returns 404
     * @throws EmailAlreadyExistsException if Core returns 409 (new email taken)
     * @throws ServiceUnavailableException if Core is unreachable
     */
    public UserProfileResponse updateUserProfile(Long userId, UpdateUserProfileRequest request) {
        String url = coreServiceUrl + "/api/users/" + userId + "/profile";

        log.info("Calling Core service to update profile for userId={}", userId);

        try {
            HttpEntity<UpdateUserProfileRequest> entity = new HttpEntity<>(request, jsonHeaders());

            ResponseEntity<UserProfileResponse> response = restTemplate.exchange(
                url,
                HttpMethod.PUT,
                entity,
                UserProfileResponse.class
            );

            log.info("Profile updated in Core for userId={}", userId);
            return response.getBody();

        } catch (HttpClientErrorException.NotFound ex) {
            log.warn("User not found in Core during profile update: userId={}", userId);
            throw new UserNotFoundException(userId);

        } catch (HttpClientErrorException.Conflict ex) {
            log.warn("Email conflict during profile update for userId={}", userId);
            // Extract the new email from request for a clear error message
            throw new EmailAlreadyExistsException(request.getEmail());

        } catch (HttpClientErrorException ex) {
            log.error("Client error calling Core update-profile: status={}", ex.getStatusCode());
            throw new ServiceUnavailableException("Core", ex);

        } catch (ResourceAccessException ex) {
            log.error("Cannot connect to Core service: {}", ex.getMessage());
            throw new ServiceUnavailableException("Core", ex);

        } catch (Exception ex) {
            log.error("Unexpected error calling Core update-profile: {}", ex.getMessage(), ex);
            throw new ServiceUnavailableException("Core", ex);
        }
    }

    /**
     * Replace a user's password hash in Core.
     * Gateway has already verified the old password and BCrypt-hashed the new one.
     * Called by Gateway on POST /api/users/profile/change-password.
     *
     * @throws UserNotFoundException       if Core returns 404
     * @throws ServiceUnavailableException if Core is unreachable
     */
    public void changeUserPassword(Long userId, ChangePasswordCoreRequest request) {
        String url = coreServiceUrl + "/api/users/" + userId + "/password";

        log.info("Calling Core service to change password for userId={}", userId);

        try {
            HttpEntity<ChangePasswordCoreRequest> entity = new HttpEntity<>(request, jsonHeaders());

            restTemplate.exchange(url, HttpMethod.PUT, entity, Void.class);

            log.info("Password changed in Core for userId={}", userId);

        } catch (HttpClientErrorException.NotFound ex) {
            log.warn("User not found in Core during password change: userId={}", userId);
            throw new UserNotFoundException(userId);

        } catch (HttpClientErrorException ex) {
            log.error("Client error calling Core change-password: status={}", ex.getStatusCode());
            throw new ServiceUnavailableException("Core", ex);

        } catch (ResourceAccessException ex) {
            log.error("Cannot connect to Core service: {}", ex.getMessage());
            throw new ServiceUnavailableException("Core", ex);

        } catch (Exception ex) {
            log.error("Unexpected error calling Core change-password: {}", ex.getMessage(), ex);
            throw new ServiceUnavailableException("Core", ex);
        }
    }
}
