package com.osroom.gestionnap.controller;

import com.osroom.gestionnap.service.KeycloakAdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/keycloak-admin")
@RequiredArgsConstructor
@Slf4j
public class KeycloakAdminController {

    private final KeycloakAdminService keycloakAdminService;

    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {
        log.info("Getting all users from Keycloak Admin API");
        List<Map<String, Object>> users = keycloakAdminService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<Map<String, Object>> getUserById(@PathVariable String id) {
        log.info("Getting user by ID: {}", id);
        Map<String, Object> user = keycloakAdminService.getUserById(id);
        if (user != null) {
            return ResponseEntity.ok(user);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
} 