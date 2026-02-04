package com.committed.gateway.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
public class HealthController {

    @Value("${core.service.url:http://core:8000}")
    private String coreServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "gateway");
        response.put("timestamp", Instant.now().toString());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/test-chain")
    public ResponseEntity<Map<String, Object>> testChain() {
        Map<String, Object> response = new HashMap<>();
        Map<String, String> chain = new HashMap<>();
        
        // Gateway is always connected if we reach here
        chain.put("gateway", "connected");
        
        try {
            // Call Core service to test the chain
            @SuppressWarnings("unchecked")
            Map<String, Object> coreResponse = restTemplate.getForObject(
                coreServiceUrl + "/db-test", 
                Map.class
            );
            
            if (coreResponse != null && "connected".equals(coreResponse.get("database"))) {
                chain.put("core", "connected");
                chain.put("database", "connected");
                response.put("status", "success");
                response.put("message", "End-to-end chain test successful");
            } else {
                chain.put("core", "connected");
                chain.put("database", "disconnected");
                response.put("status", "partial");
                response.put("message", "Core connected but database check failed");
            }
        } catch (Exception e) {
            chain.put("core", "disconnected");
            chain.put("database", "unknown");
            response.put("status", "error");
            response.put("message", "Failed to connect to Core service: " + e.getMessage());
        }
        
        response.put("chain", chain);
        response.put("timestamp", Instant.now().toString());
        
        return ResponseEntity.ok(response);
    }
}
