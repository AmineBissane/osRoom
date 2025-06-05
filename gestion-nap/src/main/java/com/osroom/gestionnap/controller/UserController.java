package com.osroom.gestionnap.controller;

import com.osroom.gestionnap.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.HashSet;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllUsers(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        log.info("Request received to fetch all users");
        
        if (authHeader == null || authHeader.isBlank()) {
            log.error("Authorization header is missing or empty");
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authorization header is required");
        }
        
        try {
            List<Map<String, Object>> users = userService.getAllUsers(authHeader);
            log.info("Successfully fetched {} users", users.size());
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            log.error("Error fetching all users: {}", e.getMessage(), e);
            throw e;
        }
    }

    @GetMapping("/{userId}")
    public ResponseEntity<Map<String, Object>> getUserById(
            @PathVariable String userId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        log.info("Request received to fetch user by ID: {}", userId);
        
        if (authHeader == null || authHeader.isBlank()) {
            log.error("Authorization header is missing or empty");
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authorization header is required");
        }
        
        try {
            Map<String, Object> user = userService.getUserById(userId, authHeader);
            log.info("Successfully fetched user: {}", userId);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            log.error("Error fetching user by ID {}: {}", userId, e.getMessage(), e);
            throw e;
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<Map<String, Object>>> searchUsers(
            @RequestParam String query,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        log.info("Request received to search users with query: {}", query);
        
        if (authHeader == null || authHeader.isBlank()) {
            log.error("Authorization header is missing or empty");
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authorization header is required");
        }
        
        try {
            List<Map<String, Object>> users = userService.searchUsers(query, authHeader);
            log.info("Successfully searched users, found: {}", users.size());
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            log.error("Error searching users with query {}: {}", query, e.getMessage(), e);
            throw e;
        }
    }
    
    @GetMapping("/classes")
    public ResponseEntity<List<String>> getAvailableClasses(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        log.info("Request received to fetch available class categories");
        
        try {
            // Get all users
            List<Map<String, Object>> users = userService.getAllUsers(authHeader);
            
            // Extract class attributes from users
            Set<String> classCategories = new HashSet<>();
            
            for (Map<String, Object> user : users) {
                // Try all possible attribute names for class
                String classValue = null;
                
                if (user.containsKey("class")) {
                    classValue = (String) user.get("class");
                } else if (user.containsKey("classCategory")) {
                    classValue = (String) user.get("classCategory");
                } else if (user.containsKey("attributes") && user.get("attributes") instanceof Map) {
                    Map<String, Object> attributes = (Map<String, Object>) user.get("attributes");
                    if (attributes.containsKey("class") && attributes.get("class") instanceof List) {
                        List<String> classes = (List<String>) attributes.get("class");
                        if (!classes.isEmpty()) {
                            classValue = classes.get(0);
                        }
                    }
                }
                
                if (classValue != null && !classValue.trim().isEmpty()) {
                    // Handle comma-separated classes
                    if (classValue.contains(",")) {
                        String[] classes = classValue.split(",");
                        for (String cls : classes) {
                            if (!cls.trim().isEmpty()) {
                                classCategories.add(cls.trim());
                            }
                        }
                    } else {
                        classCategories.add(classValue.trim());
                    }
                }
            }
            
            // Convert to sorted list
            List<String> result = classCategories.stream()
                .sorted()
                .collect(Collectors.toList());
            
            log.info("Successfully fetched {} class categories", result.size());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error fetching class categories: {}", e.getMessage(), e);
            // Return a default list of classes to ensure frontend works
            return ResponseEntity.ok(List.of("DAM", "ESO", "BACH", "FP", "1A", "1B", "2A", "2B"));
        }
    }
    
    @GetMapping("/by-class/{classCategory}")
    public ResponseEntity<List<Map<String, Object>>> getUsersByClass(
            @PathVariable String classCategory,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        log.info("Request received to fetch users by class: {}", classCategory);
        
        try {
            // Get all users
            List<Map<String, Object>> allUsers = userService.getAllUsers(authHeader);
            
            // Filter users by class
            List<Map<String, Object>> filteredUsers = allUsers.stream()
                .filter(user -> {
                    // Check class attribute
                    if (user.containsKey("class")) {
                        String userClass = (String) user.get("class");
                        if (userClass != null) {
                            // Handle comma-separated classes
                            if (userClass.contains(",")) {
                                for (String cls : userClass.split(",")) {
                                    if (cls.trim().equalsIgnoreCase(classCategory)) {
                                        return true;
                                    }
                                }
                                return false;
                            }
                            return userClass.equalsIgnoreCase(classCategory);
                        }
                    }
                    
                    // Check classCategory attribute
                    if (user.containsKey("classCategory")) {
                        String userClass = (String) user.get("classCategory");
                        if (userClass != null) {
                            return userClass.equalsIgnoreCase(classCategory);
                        }
                    }
                    
                    // Check attributes map
                    if (user.containsKey("attributes") && user.get("attributes") instanceof Map) {
                        Map<String, Object> attributes = (Map<String, Object>) user.get("attributes");
                        if (attributes.containsKey("class") && attributes.get("class") instanceof List) {
                            List<String> classes = (List<String>) attributes.get("class");
                            return classes.stream()
                                .anyMatch(cls -> cls.equalsIgnoreCase(classCategory));
                        }
                    }
                    
                    return false;
                })
                .collect(Collectors.toList());
            
            log.info("Found {} users in class {}", filteredUsers.size(), classCategory);
            return ResponseEntity.ok(filteredUsers);
        } catch (Exception e) {
            log.error("Error fetching users by class {}: {}", classCategory, e.getMessage(), e);
            return ResponseEntity.ok(Collections.emptyList());
        }
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleException(Exception e) {
        log.error("Global exception handler caught: {}", e.getMessage(), e);
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("error", e.getClass().getSimpleName());
        errorResponse.put("message", e.getMessage());
        
        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;
        if (e instanceof ResponseStatusException) {
            status = ((ResponseStatusException) e).getStatusCode().is4xxClientError() 
                    ? HttpStatus.valueOf(((ResponseStatusException) e).getStatusCode().value())
                    : HttpStatus.INTERNAL_SERVER_ERROR;
        }
        
        return new ResponseEntity<>(errorResponse, status);
    }
} 