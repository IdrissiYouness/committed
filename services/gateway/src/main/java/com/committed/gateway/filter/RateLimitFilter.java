package com.committed.gateway.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory rate limiting for auth endpoints.
 *   /api/auth/login    — 5 requests per minute per IP
 *   /api/auth/register — 3 requests per minute per IP
 *
 * Returns HTTP 429 with a JSON body and Retry-After header when exceeded.
 */
@Component
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    private static final String LOGIN_PATH    = "/api/auth/login";
    private static final String REGISTER_PATH = "/api/auth/register";

    private final ConcurrentHashMap<String, Bucket> loginBuckets    = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Bucket> registerBuckets = new ConcurrentHashMap<>();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !path.equals(LOGIN_PATH) && !path.equals(REGISTER_PATH);
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest  request,
        HttpServletResponse response,
        FilterChain         filterChain
    ) throws ServletException, IOException {

        String path = request.getRequestURI();
        String ip   = getClientIp(request);

        Bucket bucket = path.equals(LOGIN_PATH)
            ? loginBuckets.computeIfAbsent(ip, k -> buildBucket(5))
            : registerBuckets.computeIfAbsent(ip, k -> buildBucket(3));

        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
        } else {
            log.warn("Rate limit exceeded for {} on {}", ip, path);
            response.setStatus(429);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setHeader("Retry-After", "60");
            new ObjectMapper().writeValue(response.getOutputStream(), Map.of(
                "timestamp", Instant.now().toString(),
                "status",    429,
                "error",     "Too Many Requests",
                "message",   "Rate limit exceeded. Please wait before retrying."
            ));
        }
    }

    private Bucket buildBucket(int requestsPerMinute) {
        Bandwidth limit = Bandwidth.classic(
            requestsPerMinute,
            Refill.greedy(requestsPerMinute, Duration.ofMinutes(1))
        );
        return Bucket.builder().addLimit(limit).build();
    }

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
