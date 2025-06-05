package com.osroom.gestionnap.service;

import com.osroom.gestionnap.client.KeycloakClient;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final KeycloakClient keycloakClient;
    private final KeycloakTokenService keycloakTokenService;
    
    @Value("${app.keycloak.realm}")
    private String realm;
    
    /**
     * Get all users from Keycloak
     * @param authHeader The Authorization header with Bearer token, or null to use service account
     * @return List of users as maps
     */
    public List<Map<String, Object>> getAllUsers(String authHeader) {
        try {
            log.debug("Fetching all users from Keycloak, realm: {}", realm);
            
            // Use provided auth header or get a new token
            String token = (authHeader != null && !authHeader.isBlank()) 
                ? authHeader 
                : keycloakTokenService.getAdminToken();
            
            List<Map<String, Object>> users = keycloakClient.getAllUsers(realm, token);
            log.debug("Successfully fetched {} users from Keycloak", users.size());
            return users;
        } catch (FeignException e) {
            log.error("Error fetching all users from Keycloak: {} - {}", e.status(), e.getMessage());
            handleFeignException(e);
            // This will never be reached due to the exception being thrown in handleFeignException
            return Collections.emptyList();
        } catch (Exception e) {
            log.error("Unexpected error fetching all users from Keycloak", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error fetching users from Keycloak", e);
        }
    }
    
    /**
     * Get a user by ID from Keycloak
     * @param userId The user ID
     * @param authHeader The Authorization header with Bearer token, or null to use service account
     * @return User as a map
     */
    public Map<String, Object> getUserById(String userId, String authHeader) {
        try {
            log.debug("Fetching user from Keycloak, realm: {}, userId: {}", realm, userId);
            
            // Use provided auth header or get a new token
            String token = (authHeader != null && !authHeader.isBlank()) 
                ? authHeader 
                : keycloakTokenService.getAdminToken();
            
            Map<String, Object> user = keycloakClient.getUserById(realm, userId, token);
            log.debug("Successfully fetched user from Keycloak: {}", userId);
            return user;
        } catch (FeignException e) {
            log.error("Error fetching user by ID from Keycloak: {} - {}", e.status(), e.getMessage());
            handleFeignException(e);
            // This will never be reached due to the exception being thrown in handleFeignException
            return Collections.emptyMap();
        } catch (Exception e) {
            log.error("Unexpected error fetching user by ID from Keycloak", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error fetching user from Keycloak", e);
        }
    }
    
    /**
     * Search for users in Keycloak
     * @param query The search query
     * @param authHeader The Authorization header with Bearer token, or null to use service account
     * @return List of matching users as maps
     */
    public List<Map<String, Object>> searchUsers(String query, String authHeader) {
        try {
            log.debug("Searching users in Keycloak, realm: {}, query: {}", realm, query);
            
            // Use provided auth header or get a new token
            String token = (authHeader != null && !authHeader.isBlank()) 
                ? authHeader 
                : keycloakTokenService.getAdminToken();
            
            List<Map<String, Object>> users = keycloakClient.searchUsers(realm, query, token);
            log.debug("Successfully searched users in Keycloak, found: {}", users.size());
            return users;
        } catch (FeignException e) {
            log.error("Error searching users in Keycloak: {} - {}", e.status(), e.getMessage());
            handleFeignException(e);
            // This will never be reached due to the exception being thrown in handleFeignException
            return Collections.emptyList();
        } catch (Exception e) {
            log.error("Unexpected error searching users in Keycloak", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error searching users in Keycloak", e);
        }
    }
    
    /**
     * Handle FeignException by mapping it to appropriate ResponseStatusException
     * @param e The FeignException
     */
    private void handleFeignException(FeignException e) {
        if (e.status() == 401 || e.status() == 403) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized access to Keycloak API", e);
        } else if (e.status() == 404) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found in Keycloak", e);
        } else {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error communicating with Keycloak API", e);
        }
    }
} 