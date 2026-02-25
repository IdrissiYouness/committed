package com.committed.gateway.exception;

/**
 * Exception thrown when a downstream service (Core, Analyzer, etc.) is unavailable
 * Maps to HTTP 503 Service Unavailable
 */
public class ServiceUnavailableException extends RuntimeException {
    
    public ServiceUnavailableException(String service) {
        super(service + " service is currently unavailable");
    }
    
    public ServiceUnavailableException(String service, Throwable cause) {
        super(service + " service is currently unavailable", cause);
    }
}
