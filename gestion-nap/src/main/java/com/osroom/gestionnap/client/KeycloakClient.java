package com.osroom.gestionnap.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.Map;

@FeignClient(
    name = "keycloak", 
    url = "${app.keycloak.server-url:http://82.29.168.17:8080}",
    configuration = KeycloakClientConfig.class
)
public interface KeycloakClient {
    
    @GetMapping("/admin/realms/{realm}/users")
    List<Map<String, Object>> getAllUsers(
            @PathVariable("realm") String realm,
            @RequestHeader("Authorization") String authHeader);
    
    @GetMapping("/admin/realms/{realm}/users/{id}")
    Map<String, Object> getUserById(
            @PathVariable("realm") String realm,
            @PathVariable("id") String id,
            @RequestHeader("Authorization") String authHeader);
    
    @GetMapping("/admin/realms/{realm}/users")
    List<Map<String, Object>> searchUsers(
            @PathVariable("realm") String realm,
            @RequestParam("search") String query,
            @RequestHeader("Authorization") String authHeader);
} 