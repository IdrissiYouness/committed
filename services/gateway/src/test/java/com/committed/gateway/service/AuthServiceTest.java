package com.committed.gateway.service;

import com.committed.gateway.client.CoreServiceClient;
import com.committed.gateway.dto.*;
import com.committed.gateway.dto.internal.CreateUserRequest;
import com.committed.gateway.dto.internal.CreateUserResponse;
import com.committed.gateway.exception.EmailAlreadyExistsException;
import com.committed.gateway.exception.ServiceUnavailableException;
import com.committed.gateway.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;


import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private CoreServiceClient coreServiceClient;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    private RegisterRequest registerRequest;
    private CreateUserResponse coreResponse;

    @BeforeEach
    void setUp() {
        registerRequest = RegisterRequest.builder()
            .email("test@committed.com")
            .fullName("Test User")
            .password("securepass123")
            .build();

        coreResponse = CreateUserResponse.builder()
            .userId(1L)
            .email("test@committed.com")
            .fullName("Test User")
            .systemRole("user")
            .isActive(true)
            .tokenVersion(1)
            .createdAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) + "+00:00")
            .build();
    }

    @Test
    void register_Success() {
        // Arrange
        String hashedPassword = "$2a$10$hashedpassword";
        String accessToken = "access.token.jwt";
        String refreshToken = "refresh.token.jwt";

        when(passwordEncoder.encode(anyString())).thenReturn(hashedPassword);
        when(coreServiceClient.createUser(any(CreateUserRequest.class))).thenReturn(coreResponse);
        when(jwtTokenProvider.generateToken(anyString(), anyString(), anyString(), anyString(), anyInt()))
            .thenReturn(accessToken);
        when(jwtTokenProvider.generateRefreshToken(anyString())).thenReturn(refreshToken);

        // Act
        ApiResponse<AuthResponse> response = authService.register(registerRequest);

        // Assert
        assertNotNull(response);
        assertTrue(response.getSuccess());
        assertEquals("Registration successful", response.getMessage());

        AuthResponse authResponse = response.getData();
        assertNotNull(authResponse);
        assertEquals(accessToken, authResponse.getAccessToken());
        assertEquals(refreshToken, authResponse.getRefreshToken());
        assertEquals("Bearer", authResponse.getTokenType());

        UserResponse user = authResponse.getUser();
        assertNotNull(user);
        assertEquals(1L, user.getUserId());
        assertEquals("test@committed.com", user.getEmail());
        assertEquals("Test User", user.getFullName());
        assertEquals("user", user.getSystemRole());
        assertTrue(user.getIsActive());

        // Verify interactions
        verify(passwordEncoder).encode("securepass123");
        verify(coreServiceClient).createUser(any(CreateUserRequest.class));
        verify(jwtTokenProvider).generateToken("1", "test@committed.com", "Test User", "USER", 1);
        verify(jwtTokenProvider).generateRefreshToken("1");
    }

    @Test
    void register_EmailAlreadyExists_ThrowsException() {
        // Arrange
        String hashedPassword = "$2a$10$hashedpassword";
        when(passwordEncoder.encode(anyString())).thenReturn(hashedPassword);
        when(coreServiceClient.createUser(any(CreateUserRequest.class)))
            .thenThrow(new EmailAlreadyExistsException("test@committed.com"));

        // Act & Assert
        assertThrows(EmailAlreadyExistsException.class, () -> {
            authService.register(registerRequest);
        });

        verify(passwordEncoder).encode("securepass123");
        verify(coreServiceClient).createUser(any(CreateUserRequest.class));
        verifyNoInteractions(jwtTokenProvider);
    }

    @Test
    void register_CoreServiceDown_ThrowsException() {
        // Arrange
        String hashedPassword = "$2a$10$hashedpassword";
        when(passwordEncoder.encode(anyString())).thenReturn(hashedPassword);
        when(coreServiceClient.createUser(any(CreateUserRequest.class)))
            .thenThrow(new ServiceUnavailableException("Core"));

        // Act & Assert
        assertThrows(ServiceUnavailableException.class, () -> {
            authService.register(registerRequest);
        });

        verify(passwordEncoder).encode("securepass123");
        verify(coreServiceClient).createUser(any(CreateUserRequest.class));
        verifyNoInteractions(jwtTokenProvider);
    }

    @Test
    void register_PasswordHashing() {
        // Arrange
        String hashedPassword = "$2a$10$differenthash";
        when(passwordEncoder.encode("securepass123")).thenReturn(hashedPassword);
        when(coreServiceClient.createUser(argThat(request ->
            request.getPasswordHash().equals(hashedPassword)
        ))).thenReturn(coreResponse);
        when(jwtTokenProvider.generateToken(anyString(), anyString(), anyString(), anyString(), anyInt()))
            .thenReturn("token");
        when(jwtTokenProvider.generateRefreshToken(anyString())).thenReturn("refresh");

        // Act
        authService.register(registerRequest);

        // Assert
        verify(passwordEncoder).encode("securepass123");
        verify(coreServiceClient).createUser(argThat(request ->
            request.getPasswordHash().equals(hashedPassword)
        ));
    }
}
