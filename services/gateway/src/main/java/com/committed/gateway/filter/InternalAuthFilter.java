package com.committed.gateway.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;

/**
 * Protects /internal/** routes with a shared secret header.
 * These routes are called only from within the Docker network (e.g. code-analyzer callback).
 * The header enforces an extra layer on top of network isolation.
 */
@Component
@Slf4j
public class InternalAuthFilter extends OncePerRequestFilter {

    private static final String INTERNAL_HEADER = "X-Internal-Secret";

    @Value("${internal.secret}")
    private String internalSecret;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/internal/");
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest  request,
        HttpServletResponse response,
        FilterChain         filterChain
    ) throws ServletException, IOException {

        String provided = request.getHeader(INTERNAL_HEADER);

        if (internalSecret == null || !internalSecret.equals(provided)) {
            log.warn("Rejected /internal request — missing or invalid X-Internal-Secret from {}",
                request.getRemoteAddr());
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            new ObjectMapper().writeValue(response.getOutputStream(), Map.of(
                "timestamp", Instant.now().toString(),
                "status",    403,
                "error",     "Forbidden",
                "message",   "Invalid internal secret"
            ));
            return;
        }

        filterChain.doFilter(request, response);
    }
}
