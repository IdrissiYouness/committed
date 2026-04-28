package com.committed.gateway.client;

import com.committed.gateway.dto.NotifyPayload;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationClient {

    private final RestTemplate restTemplate;

    @Value("${notification.service.url}")
    private String notificationServiceUrl;

    public void notify(NotifyPayload payload) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            ResponseEntity<Void> response = restTemplate.exchange(
                    notificationServiceUrl + "/internal/notify",
                    HttpMethod.POST,
                    new HttpEntity<>(payload, headers),
                    Void.class
            );

            log.debug("Notification queued type={} to={} status={}",
                    payload.getType(), payload.getRecipientEmail(), response.getStatusCode());

        } catch (Exception e) {
            log.error("Failed to send notification type={} to={}: {}",
                    payload.getType(), payload.getRecipientEmail(), e.getMessage());
        }
    }
}
