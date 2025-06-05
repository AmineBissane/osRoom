package com.osroom.gestionnap.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class KeycloakTokenService {

    private final RestTemplate restTemplate;

    @Value("${app.keycloak.server-url}")
    private String keycloakServerUrl;

    @Value("${app.keycloak.realm}")
    private String realm;

    @Value("${app.keycloak.client-id}")
    private String clientId;

    @Value("${app.keycloak.client-secret}")
    private String clientSecret;

    /**
     * Get an admin access token from Keycloak
     * @return The admin access token
     */
    public String getAdminToken() {
        try {
            log.debug("Getting admin token from Keycloak");
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            
            MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
            map.add("client_id", "admin-cli");
            map.add("username", "admin");
            map.add("password", "admin");
            map.add("grant_type", "password");
            
            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    keycloakServerUrl + "/realms/master/protocol/openid-connect/token", 
                    request, 
                    Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String token = (String) response.getBody().get("access_token");
                log.debug("Successfully obtained admin token from Keycloak");
                return "Bearer " + token;
            } else {
                log.error("Failed to get admin token from Keycloak: {}", response.getStatusCode());
                throw new RuntimeException("Failed to get admin token from Keycloak");
            }
        } catch (Exception e) {
            log.error("Error getting admin token from Keycloak", e);
            throw new RuntimeException("Error getting admin token from Keycloak", e);
        }
    }

    /**
     * Get a service account token from Keycloak
     * @return The service account access token
     */
    public String getServiceAccountToken() {
        try {
            log.debug("Getting service account token from Keycloak for client {}", clientId);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            
            MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
            map.add("client_id", clientId);
            map.add("client_secret", clientSecret);
            map.add("grant_type", "client_credentials");
            
            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    keycloakServerUrl + "/realms/" + realm + "/protocol/openid-connect/token", 
                    request, 
                    Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String token = (String) response.getBody().get("access_token");
                log.debug("Successfully obtained service account token from Keycloak");
                return "Bearer " + token;
            } else {
                log.error("Failed to get service account token from Keycloak: {}", response.getStatusCode());
                throw new RuntimeException("Failed to get service account token from Keycloak");
            }
        } catch (Exception e) {
            log.error("Error getting service account token from Keycloak", e);
            throw new RuntimeException("Error getting service account token from Keycloak", e);
        }
    }
} 