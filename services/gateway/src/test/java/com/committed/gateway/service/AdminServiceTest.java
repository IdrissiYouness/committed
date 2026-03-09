package com.committed.gateway.service;

import com.committed.gateway.client.CoreServiceClient;
import com.committed.gateway.dto.AdminUpdateUserRequest;
import com.committed.gateway.dto.AdminUserResponse;
import com.committed.gateway.dto.PagedResponse;
import com.committed.gateway.dto.internal.CoreAdminUpdateRequest;
import com.committed.gateway.dto.internal.CoreAdminUserListResponse;
import com.committed.gateway.exception.EmailAlreadyExistsException;
import com.committed.gateway.exception.UserNotFoundException;
import com.committed.gateway.security.JwtPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AdminService.
 *
 * Covers:
 *   - listUsers: delegation to CoreServiceClient, response mapping, pagination passthrough
 *   - updateUser: delegation, self-demotion guard, self-deactivation guard, error propagation
 *   - deactivateUser: delegation, self-deactivation guard, error propagation
 */
@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private CoreServiceClient coreServiceClient;

    @InjectMocks
    private AdminService adminService;

    // -------------------------------------------------------------------------
    // Shared fixtures
    // -------------------------------------------------------------------------

    private static final String ADMIN_ID   = "1";
    private static final String TARGET_ID  = "2";
    private static final Long   ADMIN_ID_L  = 1L;
    private static final Long   TARGET_ID_L = 2L;

    private JwtPrincipal adminPrincipal;

    @BeforeEach
    void setUp() {
        adminPrincipal = new JwtPrincipal(ADMIN_ID, "admin@committed.com", "ADMIN");
    }

    // =========================================================================
    // listUsers
    // =========================================================================

    @Nested
    class ListUsers {

        @Test
        void listUsers_NoFilters_DelegatesToCoreAndMapsResponse() {
            // Arrange
            CoreAdminUserListResponse coreResponse = buildCoreListResponse(2, 0, 20, 2, 1);
            when(coreServiceClient.adminListUsers(
                eq(ADMIN_ID_L), eq(0), eq(20),
                eq("createdAt"), eq("desc"),
                isNull(), isNull(), isNull()
            )).thenReturn(coreResponse);

            // Act
            PagedResponse<AdminUserResponse> result = adminService.listUsers(
                adminPrincipal, 0, 20, "createdAt", "desc", null, null, null
            );

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(2);
            assertThat(result.getPage()).isEqualTo(0);
            assertThat(result.getSize()).isEqualTo(20);
            assertThat(result.getTotalElements()).isEqualTo(2);
            assertThat(result.getTotalPages()).isEqualTo(1);
            assertThat(result.isHasNext()).isFalse();
            assertThat(result.isHasPrev()).isFalse();

            verify(coreServiceClient).adminListUsers(
                ADMIN_ID_L, 0, 20, "createdAt", "desc", null, null, null
            );
        }

        @Test
        void listUsers_WithRoleFilter_PassesFilterToCore() {
            // Arrange
            CoreAdminUserListResponse coreResponse = buildCoreListResponse(1, 0, 20, 1, 1);
            when(coreServiceClient.adminListUsers(
                any(), anyInt(), anyInt(), any(), any(), eq("admin"), isNull(), isNull()
            )).thenReturn(coreResponse);

            // Act
            adminService.listUsers(adminPrincipal, 0, 20, "createdAt", "desc", "admin", null, null);

            // Assert
            verify(coreServiceClient).adminListUsers(
                ADMIN_ID_L, 0, 20, "createdAt", "desc", "admin", null, null
            );
        }

        @Test
        void listUsers_WithIsActiveFilter_PassesFilterToCore() {
            // Arrange
            CoreAdminUserListResponse coreResponse = buildCoreListResponse(1, 0, 20, 1, 1);
            when(coreServiceClient.adminListUsers(
                any(), anyInt(), anyInt(), any(), any(), isNull(), eq(false), isNull()
            )).thenReturn(coreResponse);

            // Act
            adminService.listUsers(adminPrincipal, 0, 20, "createdAt", "desc", null, false, null);

            // Assert
            verify(coreServiceClient).adminListUsers(
                ADMIN_ID_L, 0, 20, "createdAt", "desc", null, false, null
            );
        }

        @Test
        void listUsers_WithSearchFilter_PassesFilterToCore() {
            // Arrange
            CoreAdminUserListResponse coreResponse = buildCoreListResponse(1, 0, 20, 1, 1);
            when(coreServiceClient.adminListUsers(
                any(), anyInt(), anyInt(), any(), any(), isNull(), isNull(), eq("alice")
            )).thenReturn(coreResponse);

            // Act
            adminService.listUsers(adminPrincipal, 0, 20, "createdAt", "desc", null, null, "alice");

            // Assert
            verify(coreServiceClient).adminListUsers(
                ADMIN_ID_L, 0, 20, "createdAt", "desc", null, null, "alice"
            );
        }

        @Test
        void listUsers_PageNegative_ClampedToZero() {
            // Arrange
            CoreAdminUserListResponse coreResponse = buildCoreListResponse(0, 0, 20, 0, 0);
            when(coreServiceClient.adminListUsers(
                any(), eq(0), anyInt(), any(), any(), any(), any(), any()
            )).thenReturn(coreResponse);

            // Act
            adminService.listUsers(adminPrincipal, -5, 20, "createdAt", "desc", null, null, null);

            // Assert: clamped page=0 forwarded to Core
            verify(coreServiceClient).adminListUsers(
                ADMIN_ID_L, 0, 20, "createdAt", "desc", null, null, null
            );
        }

        @Test
        void listUsers_SizeExceedsMax_ClampedTo100() {
            // Arrange
            CoreAdminUserListResponse coreResponse = buildCoreListResponse(0, 0, 100, 0, 0);
            when(coreServiceClient.adminListUsers(
                any(), anyInt(), eq(100), any(), any(), any(), any(), any()
            )).thenReturn(coreResponse);

            // Act
            adminService.listUsers(adminPrincipal, 0, 500, "createdAt", "desc", null, null, null);

            // Assert: clamped size=100 forwarded to Core
            verify(coreServiceClient).adminListUsers(
                ADMIN_ID_L, 0, 100, "createdAt", "desc", null, null, null
            );
        }

        @Test
        void listUsers_NullUsersFromCore_ReturnsEmptyContent() {
            // Arrange — Core returns null users list (edge case)
            CoreAdminUserListResponse coreResponse = new CoreAdminUserListResponse(
                null,
                new CoreAdminUserListResponse.PaginationMeta(0, 20, 0, 0, false, false)
            );
            when(coreServiceClient.adminListUsers(any(), anyInt(), anyInt(), any(), any(), any(), any(), any()))
                .thenReturn(coreResponse);

            // Act
            PagedResponse<AdminUserResponse> result = adminService.listUsers(
                adminPrincipal, 0, 20, "createdAt", "desc", null, null, null
            );

            // Assert
            assertThat(result.getContent()).isEmpty();
        }

        @Test
        void listUsers_SecondPage_HasPrevTrue() {
            // Arrange — page=1, 40 total elements, size=20 → totalPages=2
            CoreAdminUserListResponse coreResponse = buildCoreListResponse(20, 1, 20, 40, 2);
            // Override hasNext/hasPrev for page 1
            CoreAdminUserListResponse.PaginationMeta meta =
                new CoreAdminUserListResponse.PaginationMeta(1, 20, 40, 2, false, true);
            coreResponse.setPagination(meta);

            when(coreServiceClient.adminListUsers(any(), anyInt(), anyInt(), any(), any(), any(), any(), any()))
                .thenReturn(coreResponse);

            // Act
            PagedResponse<AdminUserResponse> result = adminService.listUsers(
                adminPrincipal, 1, 20, "createdAt", "desc", null, null, null
            );

            // Assert
            assertThat(result.isHasPrev()).isTrue();
            assertThat(result.isHasNext()).isFalse();
            assertThat(result.getPage()).isEqualTo(1);
        }

        @Test
        void listUsers_UserFieldsMappedCorrectly() {
            // Arrange — Core returns a user with known fields
            Map<String, Object> rawUser = Map.of(
                "userId",     42,
                "email",      "bob@committed.com",
                "fullName",   "Bob Smith",
                "systemRole", "user",
                "isActive",   true,
                "createdAt",  "2024-01-01T00:00:00+00:00",
                "updatedAt",  "2024-06-01T00:00:00+00:00"
            );
            CoreAdminUserListResponse coreResponse = new CoreAdminUserListResponse(
                List.of(rawUser),
                new CoreAdminUserListResponse.PaginationMeta(0, 20, 1, 1, false, false)
            );
            when(coreServiceClient.adminListUsers(any(), anyInt(), anyInt(), any(), any(), any(), any(), any()))
                .thenReturn(coreResponse);

            // Act
            PagedResponse<AdminUserResponse> result = adminService.listUsers(
                adminPrincipal, 0, 20, "createdAt", "desc", null, null, null
            );

            // Assert
            assertThat(result.getContent()).hasSize(1);
            AdminUserResponse user = result.getContent().get(0);
            assertThat(user.getUserId()).isEqualTo(42L);
            assertThat(user.getEmail()).isEqualTo("bob@committed.com");
            assertThat(user.getFullName()).isEqualTo("Bob Smith");
            assertThat(user.getSystemRole()).isEqualTo("user");
            assertThat(user.getIsActive()).isTrue();
            assertThat(user.getCreatedAt()).isEqualTo("2024-01-01T00:00:00+00:00");
            assertThat(user.getUpdatedAt()).isEqualTo("2024-06-01T00:00:00+00:00");
        }

        @Test
        void listUsers_CoreServiceUnavailable_ExceptionPropagated() {
            // Arrange
            when(coreServiceClient.adminListUsers(any(), anyInt(), anyInt(), any(), any(), any(), any(), any()))
                .thenThrow(new RuntimeException("Core unreachable"));

            // Act & Assert
            assertThatThrownBy(() ->
                adminService.listUsers(adminPrincipal, 0, 20, "createdAt", "desc", null, null, null)
            ).isInstanceOf(RuntimeException.class)
             .hasMessageContaining("Core unreachable");
        }
    }

    // =========================================================================
    // updateUser
    // =========================================================================

    @Nested
    class UpdateUser {

        @Test
        void updateUser_ValidRequest_DelegatesToCoreAndReturnsResponse() {
            // Arrange
            AdminUpdateUserRequest request = AdminUpdateUserRequest.builder()
                .fullName("New Name")
                .build();

            AdminUserResponse expected = buildAdminUserResponse(TARGET_ID_L, "target@test.com", "New Name", "user", true);
            when(coreServiceClient.adminUpdateUser(eq(ADMIN_ID_L), eq(TARGET_ID_L), any(CoreAdminUpdateRequest.class)))
                .thenReturn(expected);

            // Act
            AdminUserResponse result = adminService.updateUser(adminPrincipal, TARGET_ID_L, request);

            // Assert
            assertThat(result).isEqualTo(expected);
        }

        @Test
        void updateUser_OnlyNonNullFieldsForwardedToCore() {
            // Arrange — only email is set; other fields are null
            AdminUpdateUserRequest request = AdminUpdateUserRequest.builder()
                .email("new@committed.com")
                .build();

            when(coreServiceClient.adminUpdateUser(any(), any(), any()))
                .thenReturn(buildAdminUserResponse(TARGET_ID_L, "new@committed.com", "Target", "user", true));

            // Act
            adminService.updateUser(adminPrincipal, TARGET_ID_L, request);

            // Assert — verify the CoreAdminUpdateRequest forwarded to Core
            ArgumentCaptor<CoreAdminUpdateRequest> captor = ArgumentCaptor.forClass(CoreAdminUpdateRequest.class);
            verify(coreServiceClient).adminUpdateUser(eq(ADMIN_ID_L), eq(TARGET_ID_L), captor.capture());

            CoreAdminUpdateRequest sent = captor.getValue();
            assertThat(sent.getEmail()).isEqualTo("new@committed.com");
            assertThat(sent.getFullName()).isNull();
            assertThat(sent.getSystemRole()).isNull();
            assertThat(sent.getIsActive()).isNull();
        }

        @Test
        void updateUser_AllFieldsForwardedToCore() {
            // Arrange
            AdminUpdateUserRequest request = AdminUpdateUserRequest.builder()
                .email("new@test.com")
                .fullName("New Name")
                .systemRole("admin")
                .isActive(false)
                .build();

            when(coreServiceClient.adminUpdateUser(any(), any(), any()))
                .thenReturn(buildAdminUserResponse(TARGET_ID_L, "new@test.com", "New Name", "admin", false));

            // Act
            adminService.updateUser(adminPrincipal, TARGET_ID_L, request);

            // Assert
            ArgumentCaptor<CoreAdminUpdateRequest> captor = ArgumentCaptor.forClass(CoreAdminUpdateRequest.class);
            verify(coreServiceClient).adminUpdateUser(eq(ADMIN_ID_L), eq(TARGET_ID_L), captor.capture());

            CoreAdminUpdateRequest sent = captor.getValue();
            assertThat(sent.getEmail()).isEqualTo("new@test.com");
            assertThat(sent.getFullName()).isEqualTo("New Name");
            assertThat(sent.getSystemRole()).isEqualTo("admin");
            assertThat(sent.getIsActive()).isFalse();
        }

        @Test
        void updateUser_AdminPromotesAnotherUser_Allowed() {
            // Arrange — admin (id=1) promotes a different user (id=2) to admin
            AdminUpdateUserRequest request = AdminUpdateUserRequest.builder()
                .systemRole("admin")
                .build();

            when(coreServiceClient.adminUpdateUser(any(), any(), any()))
                .thenReturn(buildAdminUserResponse(TARGET_ID_L, "target@test.com", "Target", "admin", true));

            // Act — should not throw
            AdminUserResponse result = adminService.updateUser(adminPrincipal, TARGET_ID_L, request);

            // Assert
            assertThat(result.getSystemRole()).isEqualTo("admin");
            verify(coreServiceClient).adminUpdateUser(eq(ADMIN_ID_L), eq(TARGET_ID_L), any(CoreAdminUpdateRequest.class));
        }

        @Test
        void updateUser_AdminDemotesOwnRole_ThrowsIllegalArgument() {
            // Arrange — admin (id=1) attempts to demote themselves to "user"
            JwtPrincipal selfPrincipal = new JwtPrincipal(ADMIN_ID, "admin@committed.com", "ADMIN");
            AdminUpdateUserRequest request = AdminUpdateUserRequest.builder()
                .systemRole("user")
                .build();

            // Act & Assert
            assertThatThrownBy(() ->
                adminService.updateUser(selfPrincipal, ADMIN_ID_L, request)
            ).isInstanceOf(IllegalArgumentException.class)
             .hasMessageContaining("demote");

            verifyNoInteractions(coreServiceClient);
        }

        @Test
        void updateUser_AdminDeactivatesOwnAccountViaIsActive_ThrowsIllegalArgument() {
            // Arrange — admin (id=1) attempts to deactivate themselves via isActive=false in PUT
            JwtPrincipal selfPrincipal = new JwtPrincipal(ADMIN_ID, "admin@committed.com", "ADMIN");
            AdminUpdateUserRequest request = AdminUpdateUserRequest.builder()
                .isActive(false)
                .build();

            // Act & Assert
            assertThatThrownBy(() ->
                adminService.updateUser(selfPrincipal, ADMIN_ID_L, request)
            ).isInstanceOf(IllegalArgumentException.class)
             .hasMessageContaining("deactivate");

            verifyNoInteractions(coreServiceClient);
        }

        @Test
        void updateUser_AdminUpdatesOwnNameAndEmail_Allowed() {
            // Arrange — admin updates their own non-sensitive fields (not role/isActive)
            JwtPrincipal selfPrincipal = new JwtPrincipal(ADMIN_ID, "admin@committed.com", "ADMIN");
            AdminUpdateUserRequest request = AdminUpdateUserRequest.builder()
                .fullName("Updated Admin Name")
                .email("newemail@committed.com")
                .build();

            when(coreServiceClient.adminUpdateUser(any(), any(), any()))
                .thenReturn(buildAdminUserResponse(ADMIN_ID_L, "newemail@committed.com", "Updated Admin Name", "admin", true));

            // Act — should NOT throw; only role-demotion and self-deactivation are blocked
            AdminUserResponse result = adminService.updateUser(selfPrincipal, ADMIN_ID_L, request);

            // Assert
            assertThat(result.getFullName()).isEqualTo("Updated Admin Name");
            verify(coreServiceClient).adminUpdateUser(eq(ADMIN_ID_L), eq(ADMIN_ID_L), any());
        }

        @Test
        void updateUser_AdminSetsOwnIsActiveTrue_Allowed() {
            // Arrange — isActive=true on self is harmless (re-activation), must not be blocked
            JwtPrincipal selfPrincipal = new JwtPrincipal(ADMIN_ID, "admin@committed.com", "ADMIN");
            AdminUpdateUserRequest request = AdminUpdateUserRequest.builder()
                .isActive(true)
                .build();

            when(coreServiceClient.adminUpdateUser(any(), any(), any()))
                .thenReturn(buildAdminUserResponse(ADMIN_ID_L, "admin@committed.com", "Admin", "admin", true));

            // Act — should NOT throw
            adminService.updateUser(selfPrincipal, ADMIN_ID_L, request);

            verify(coreServiceClient).adminUpdateUser(eq(ADMIN_ID_L), eq(ADMIN_ID_L), any());
        }

        @Test
        void updateUser_TargetNotFound_PropagatesUserNotFoundException() {
            // Arrange
            AdminUpdateUserRequest request = AdminUpdateUserRequest.builder()
                .fullName("Ghost")
                .build();
            when(coreServiceClient.adminUpdateUser(any(), any(), any()))
                .thenThrow(new UserNotFoundException(TARGET_ID_L));

            // Act & Assert
            assertThatThrownBy(() ->
                adminService.updateUser(adminPrincipal, TARGET_ID_L, request)
            ).isInstanceOf(UserNotFoundException.class)
             .hasMessageContaining(TARGET_ID.toString());
        }

        @Test
        void updateUser_EmailConflict_PropagatesEmailAlreadyExistsException() {
            // Arrange
            AdminUpdateUserRequest request = AdminUpdateUserRequest.builder()
                .email("taken@committed.com")
                .build();
            when(coreServiceClient.adminUpdateUser(any(), any(), any()))
                .thenThrow(new EmailAlreadyExistsException("taken@committed.com"));

            // Act & Assert
            assertThatThrownBy(() ->
                adminService.updateUser(adminPrincipal, TARGET_ID_L, request)
            ).isInstanceOf(EmailAlreadyExistsException.class);
        }
    }

    // =========================================================================
    // deactivateUser
    // =========================================================================

    @Nested
    class DeactivateUser {

        @Test
        void deactivateUser_ValidTarget_DelegatesToCoreAndReturnsDeactivatedUser() {
            // Arrange
            AdminUserResponse expected = buildAdminUserResponse(TARGET_ID_L, "target@test.com", "Target", "user", false);
            when(coreServiceClient.adminDeactivateUser(ADMIN_ID_L, TARGET_ID_L)).thenReturn(expected);

            // Act
            AdminUserResponse result = adminService.deactivateUser(adminPrincipal, TARGET_ID_L);

            // Assert
            assertThat(result).isEqualTo(expected);
            assertThat(result.getIsActive()).isFalse();
            verify(coreServiceClient).adminDeactivateUser(ADMIN_ID_L, TARGET_ID_L);
        }

        @Test
        void deactivateUser_SelfDeactivation_ThrowsIllegalArgument() {
            // Arrange — admin (id=1) tries to deactivate themselves
            JwtPrincipal selfPrincipal = new JwtPrincipal(ADMIN_ID, "admin@committed.com", "ADMIN");

            // Act & Assert
            assertThatThrownBy(() ->
                adminService.deactivateUser(selfPrincipal, ADMIN_ID_L)
            ).isInstanceOf(IllegalArgumentException.class)
             .hasMessageContaining("deactivate");

            verifyNoInteractions(coreServiceClient);
        }

        @Test
        void deactivateUser_TargetNotFound_PropagatesUserNotFoundException() {
            // Arrange
            when(coreServiceClient.adminDeactivateUser(ADMIN_ID_L, TARGET_ID_L))
                .thenThrow(new UserNotFoundException(TARGET_ID_L));

            // Act & Assert
            assertThatThrownBy(() ->
                adminService.deactivateUser(adminPrincipal, TARGET_ID_L)
            ).isInstanceOf(UserNotFoundException.class);

            verify(coreServiceClient).adminDeactivateUser(ADMIN_ID_L, TARGET_ID_L);
        }

        @Test
        void deactivateUser_AdminIdPassedToCore() {
            // Arrange — verify the correct adminId is forwarded (not targetId)
            AdminUserResponse response = buildAdminUserResponse(TARGET_ID_L, "t@t.com", "T", "user", false);
            when(coreServiceClient.adminDeactivateUser(ADMIN_ID_L, TARGET_ID_L)).thenReturn(response);

            // Act
            adminService.deactivateUser(adminPrincipal, TARGET_ID_L);

            // Assert — adminId=1 and targetId=2 forwarded in the correct positions
            verify(coreServiceClient).adminDeactivateUser(ADMIN_ID_L, TARGET_ID_L);
            verify(coreServiceClient, never()).adminDeactivateUser(TARGET_ID_L, ADMIN_ID_L);
        }
    }

    // =========================================================================
    // Malformed principal
    // =========================================================================

    @Nested
    class MalformedPrincipal {

        @Test
        void listUsers_NonNumericUserId_ThrowsIllegalState() {
            JwtPrincipal badPrincipal = new JwtPrincipal("not-a-number", "x@x.com", "ADMIN");

            assertThatThrownBy(() ->
                adminService.listUsers(badPrincipal, 0, 20, "createdAt", "desc", null, null, null)
            ).isInstanceOf(IllegalStateException.class)
             .hasMessageContaining("Malformed userId");
        }

        @Test
        void updateUser_NonNumericUserId_ThrowsIllegalState() {
            JwtPrincipal badPrincipal = new JwtPrincipal("not-a-number", "x@x.com", "ADMIN");
            AdminUpdateUserRequest request = AdminUpdateUserRequest.builder().fullName("X").build();

            assertThatThrownBy(() ->
                adminService.updateUser(badPrincipal, TARGET_ID_L, request)
            ).isInstanceOf(IllegalStateException.class)
             .hasMessageContaining("Malformed userId");
        }

        @Test
        void deactivateUser_NonNumericUserId_ThrowsIllegalState() {
            JwtPrincipal badPrincipal = new JwtPrincipal("not-a-number", "x@x.com", "ADMIN");

            assertThatThrownBy(() ->
                adminService.deactivateUser(badPrincipal, TARGET_ID_L)
            ).isInstanceOf(IllegalStateException.class)
             .hasMessageContaining("Malformed userId");
        }
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    /**
     * Build a CoreAdminUserListResponse with the given number of stub user entries
     * and pagination metadata.
     */
    private CoreAdminUserListResponse buildCoreListResponse(
            int userCount, int page, int size, long totalElements, int totalPages
    ) {
        List<Map<String, Object>> users = java.util.stream.IntStream.range(0, userCount)
            .mapToObj(i -> {
                Map<String, Object> m = new HashMap<>();
                m.put("userId",     (long) (100 + i));
                m.put("email",      "user" + i + "@test.com");
                m.put("fullName",   "User " + i);
                m.put("systemRole", "user");
                m.put("isActive",   true);
                m.put("createdAt",  "2024-01-01T00:00:00+00:00");
                m.put("updatedAt",  "2024-01-01T00:00:00+00:00");
                return m;
            })
            .toList();

        boolean hasNext = page < totalPages - 1;
        boolean hasPrev = page > 0;

        return new CoreAdminUserListResponse(
            users,
            new CoreAdminUserListResponse.PaginationMeta(page, size, totalElements, totalPages, hasNext, hasPrev)
        );
    }

    /**
     * Build a stub AdminUserResponse with specified fields.
     */
    private AdminUserResponse buildAdminUserResponse(
            Long userId, String email, String fullName, String systemRole, boolean isActive
    ) {
        return AdminUserResponse.builder()
            .userId(userId)
            .email(email)
            .fullName(fullName)
            .systemRole(systemRole)
            .isActive(isActive)
            .createdAt("2024-01-01T00:00:00+00:00")
            .updatedAt("2024-06-01T00:00:00+00:00")
            .build();
    }
}