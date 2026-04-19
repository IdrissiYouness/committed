package com.committed.gateway.dto.internal;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.Map;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class AnalysisCallbackRequest {

    @JsonProperty("submissionId")
    private Integer submissionId;

    @JsonProperty("status")
    private String status;

    @JsonProperty("grade")
    private String grade;

    @JsonProperty("percentage")
    private Double percentage;

    @JsonProperty("student_level")
    private String studentLevel;

    @JsonProperty("breakdown")
    private Map<String, Object> breakdown;

    @JsonProperty("metrics")
    private Map<String, Object> metrics;

    @JsonProperty("reportUrl")
    private String reportUrl;

    @JsonProperty("analyzedAt")
    private String analyzedAt;

    @JsonProperty("analyzedIn")
    private String analyzedIn;

    @JsonProperty("errorMessage")
    private String errorMessage;
}
