package com.osroom.gestionnap.controller;

import com.osroom.gestionnap.service.KeycloakTokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/test")
@RequiredArgsConstructor
@Slf4j
public class TestController {

    private final KeycloakTokenService keycloakTokenService;

    @GetMapping("/ping")
    public ResponseEntity<Map<String, Object>> ping() {
        log.info("Test ping endpoint called");
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Service is up and running");
        response.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/auth")
    public ResponseEntity<Map<String, Object>> testAuth(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        log.info("Test auth endpoint called");
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Authentication test endpoint");
        response.put("hasAuthHeader", authHeader != null);
        if (authHeader != null) {
            response.put("authHeaderLength", authHeader.length());
            response.put("authHeaderPrefix", authHeader.length() > 10 ? authHeader.substring(0, 10) + "..." : authHeader);
        }
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/keycloak")
    public ResponseEntity<Map<String, Object>> testKeycloak() {
        log.info("Test Keycloak endpoint called");
        Map<String, Object> response = new HashMap<>();
        
        try {
            String adminToken = keycloakTokenService.getAdminToken();
            response.put("status", "success");
            response.put("message", "Successfully obtained admin token from Keycloak");
            response.put("adminTokenLength", adminToken.length());
            response.put("adminTokenPrefix", adminToken.substring(0, 20) + "...");
            
            try {
                String serviceToken = keycloakTokenService.getServiceAccountToken();
                response.put("serviceTokenLength", serviceToken.length());
                response.put("serviceTokenPrefix", serviceToken.substring(0, 20) + "...");
            } catch (Exception e) {
                response.put("serviceTokenError", e.getMessage());
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", "Failed to obtain token from Keycloak");
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
} 