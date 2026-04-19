package com.committed.gateway.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Slf4j
public class ReportProxyController {

    private final RestTemplate restTemplate;

    @Value("${analyzer.service.url}")
    private String analyzerServiceUrl;

    @GetMapping("/{filename}")
    @PreAuthorize("hasRole('USER') or hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<byte[]> getReport(@PathVariable String filename) {
        // Reject path traversal and non-PDF files
        if (filename.contains("/") || filename.contains("..") || !filename.endsWith(".pdf")) {
            return ResponseEntity.badRequest().build();
        }

        String url = analyzerServiceUrl + "/reports/" + filename;
        log.debug("Proxying report request to {}", url);

        try {
            ResponseEntity<byte[]> response = restTemplate.exchange(
                    url, HttpMethod.GET, null, byte[].class
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDisposition(
                    ContentDisposition.attachment().filename(filename).build()
            );

            return ResponseEntity.ok().headers(headers).body(response.getBody());

        } catch (HttpClientErrorException e) {
            log.warn("Report not found at analyzer: {} — {}", url, e.getStatusCode());
            return ResponseEntity.status(e.getStatusCode()).build();
        } catch (Exception e) {
            log.error("Failed to proxy report {}: {}", filename, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).build();
        }
    }
}
