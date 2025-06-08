package com.osroom.gestionnap.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class KeycloakAdminService {

    private final RestTemplate restTemplate;
    private final KeycloakTokenService keycloakTokenService;

    @Value("${app.keycloak.server-url:http://82.29.168.17:8080}")
    private String keycloakServerUrl;

    @Value("${app.keycloak.realm:osRoom}")
    private String realm;

    /**
     * Get all users directly using RestTemplate instead of Feign
     * @return List of users
     */
    public List<Map<String, Object>> getAllUsers() {
        try {
            String token = keycloakTokenService.getServiceAccountToken();
            log.debug("Getting all users with token: {}", token.substring(0, Math.min(30, token.length())) + "...");
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", token);
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
            
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            
            String url = keycloakServerUrl + "/admin/realms/" + realm + "/users";
            log.debug("Making request to URL: {}", url);
            
            ResponseEntity<List> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    List.class);
            
            if (response.getBody() != null) {
                log.debug("Successfully fetched {} users", response.getBody().size());
                return response.getBody();
            } else {
                log.warn("Response body is null");
                return new ArrayList<>();
            }
        } catch (Exception e) {
            log.error("Error getting all users: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }
    
    /**
     * Get a user by ID directly using RestTemplate instead of Feign
     * @param userId The user ID
     * @return User data or null if not found
     */
    public Map<String, Object> getUserById(String userId) {
        try {
            String token = keycloakTokenService.getServiceAccountToken();
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", token);
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
            
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            
            String url = keycloakServerUrl + "/admin/realms/" + realm + "/users/" + userId;
            
            ResponseEntity<Map> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    Map.class);
            
            return response.getBody();
        } catch (Exception e) {
            log.error("Error getting user by ID {}: {}", userId, e.getMessage(), e);
            return null;
        }
    }
} 