package com.committed.gateway.dto;

import lombok.Data;

@Data
public class CodeAnalysisResponse {
    private String status;
    private String metricsData;
    private String reportPdfUrl;
}
