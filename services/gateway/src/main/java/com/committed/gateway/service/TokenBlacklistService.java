package com.committed.gateway.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * Redis-backed token revocation service.
 *
 * Two key namespaces:
 *   blacklist:{jti}          — TTL = remaining token lifetime. Set on logout or refresh rotation.
 *   token_version:{userId}   — No TTL. Set only when a version-bump event occurs
 *                              (password change, admin deactivation). The filter rejects
 *                              tokens whose tokenVersion claim < the stored value.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TokenBlacklistService {

    private final RedisTemplate<String, String> redisTemplate;

    private static final String BLACKLIST_PREFIX = "blacklist:";
    private static final String VERSION_PREFIX   = "token_version:";

    public void blacklistToken(String jti, long remainingSeconds) {
        if (remainingSeconds > 0) {
            redisTemplate.opsForValue().set(BLACKLIST_PREFIX + jti, "1", Duration.ofSeconds(remainingSeconds));
            log.debug("Blacklisted token jti={} for {}s", jti, remainingSeconds);
        }
    }

    public boolean isBlacklisted(String jti) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(BLACKLIST_PREFIX + jti));
    }

    public void setTokenVersion(String userId, int version) {
        redisTemplate.opsForValue().set(VERSION_PREFIX + userId, String.valueOf(version));
        log.debug("Set token_version for userId={} to {}", userId, version);
    }

    /**
     * Returns the stored version, or null if no bump event has ever occurred for this user.
     * A null return means the token is valid (no revocation event on record).
     */
    public Integer getStoredVersion(String userId) {
        String val = redisTemplate.opsForValue().get(VERSION_PREFIX + userId);
        return val != null ? Integer.parseInt(val) : null;
    }
}
