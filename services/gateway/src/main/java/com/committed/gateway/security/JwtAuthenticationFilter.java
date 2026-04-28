package com.committed.gateway.security;

import com.committed.gateway.exception.JwtTokenException;
import com.committed.gateway.service.TokenBlacklistService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

/**
 * JWT Authentication Filter.
 * Validates the bearer token on every request and enforces:
 *   1. Signature + expiry (via JwtTokenProvider)
 *   2. Blacklist check (logout / rotated refresh tokens)
 *   3. Token version check (password change / admin deactivation)
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider       tokenProvider;
    private final TokenBlacklistService  blacklistService;

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX        = "Bearer ";

    @Override
    protected void doFilterInternal(
        HttpServletRequest  request,
        HttpServletResponse response,
        FilterChain         filterChain
    ) throws ServletException, IOException {

        try {
            String token = extractTokenFromRequest(request);

            if (token != null && tokenProvider.validateToken(token)) {
                String userId     = tokenProvider.getUserIdFromToken(token);
                String email      = tokenProvider.getEmailFromToken(token);
                String systemRole = tokenProvider.getSystemRoleFromToken(token);

                // 1. Blacklist check — covers logout and rotated refresh tokens
                String jti = tokenProvider.getJtiFromToken(token);
                if (blacklistService.isBlacklisted(jti)) {
                    log.warn("Rejected blacklisted token jti={} for userId={}", jti, userId);
                    filterChain.doFilter(request, response);
                    return;
                }

                // 2. Token version check — covers password change and admin deactivation
                int tokenVersion    = tokenProvider.getTokenVersionFromToken(token);
                Integer storedVersion = blacklistService.getStoredVersion(userId);
                if (storedVersion != null && tokenVersion < storedVersion) {
                    log.warn("Rejected stale token for userId={}: tokenVersion={}, current={}",
                        userId, tokenVersion, storedVersion);
                    filterChain.doFilter(request, response);
                    return;
                }

                JwtPrincipal principal = new JwtPrincipal(userId, email, systemRole);

                List<SimpleGrantedAuthority> authorities =
                    Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + systemRole));

                UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(principal, null, authorities);

                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);

                log.debug("Authenticated user: {} (id={}) role={}", email, userId, systemRole);
            }

        } catch (JwtTokenException ex) {
            log.error("JWT validation failed: {}", ex.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    private String extractTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader(AUTHORIZATION_HEADER);
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(BEARER_PREFIX)) {
            return bearerToken.substring(BEARER_PREFIX.length());
        }
        return null;
    }
}
