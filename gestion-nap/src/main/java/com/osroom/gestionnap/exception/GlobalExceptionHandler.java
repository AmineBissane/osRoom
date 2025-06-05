package com.osroom.gestionnap.exception;

import feign.FeignException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(FeignException.class)
    public ResponseEntity<Map<String, Object>> handleFeignException(FeignException e) {
        log.error("Feign client error: {}", e.getMessage(), e);
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("error", "ExternalServiceError");
        errorResponse.put("message", "Error communicating with external service");
        errorResponse.put("status", e.status());
        
        if (e.responseBody().isPresent()) {
            try {
                String responseBody = new String(e.responseBody().get().array());
                errorResponse.put("details", responseBody);
                log.error("External service response: {}", responseBody);
            } catch (Exception ex) {
                log.error("Failed to read response body", ex);
            }
        }
        
        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;
        if (e.status() > 0) {
            status = HttpStatus.valueOf(e.status());
        }
        
        return new ResponseEntity<>(errorResponse, status);
    }
    
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatusException(ResponseStatusException e) {
        log.error("Response status exception: {}", e.getMessage(), e);
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("error", "ApiError");
        errorResponse.put("message", e.getReason());
        errorResponse.put("status", e.getStatusCode().value());
        
        return new ResponseEntity<>(errorResponse, e.getStatusCode());
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception e) {
        log.error("Unhandled exception: {}", e.getMessage(), e);
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("error", e.getClass().getSimpleName());
        errorResponse.put("message", e.getMessage());
        
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }
} 