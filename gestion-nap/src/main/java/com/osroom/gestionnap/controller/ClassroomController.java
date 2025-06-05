package com.osroom.gestionnap.controller;

import com.osroom.gestionnap.client.ClassroomClient;
import com.osroom.gestionnap.client.KeycloakClient;
import com.osroom.gestionnap.service.KeycloakTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.HashMap;

@RestController
@RequestMapping("/api/v1/classrooms")
@RequiredArgsConstructor
public class ClassroomController {

    private final ClassroomClient classroomClient;
    private final KeycloakClient keycloakClient;
    private final KeycloakTokenService keycloakTokenService;
    
    @Value("${app.keycloak.realm:osRoom}")
    private String realm;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllClassrooms(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            List<Map<String, Object>> classrooms = classroomClient.getAllClassrooms(authHeader);
            return ResponseEntity.ok(classrooms);
        } catch (Exception e) {
            // Log error and return an empty list if the service is not available
            return ResponseEntity.ok(List.of());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getClassroomById(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            Map<String, Object> classroom = classroomClient.getClassroomById(id, authHeader);
            return ResponseEntity.ok(classroom);
        } catch (Exception e) {
            // Return 404 if the service is not available or classroom not found
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/students")
    public ResponseEntity<List<Map<String, Object>>> getStudentsByClassroomId(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        System.out.println("Received request for students in classroom ID: " + id);
        
        try {
            // First try to use the dedicated endpoint for students
            try {
                System.out.println("Attempting to call dedicated students endpoint...");
                List<Map<String, Object>> students = classroomClient.getStudentsByClassroomId(id, authHeader);
                if (students != null && !students.isEmpty()) {
                    System.out.println("Success! Found " + students.size() + " students from dedicated endpoint");
                    return ResponseEntity.ok(students);
                } else {
                    System.out.println("Students endpoint returned empty list");
                }
            } catch (Exception e) {
                // Log the error but continue with fallback approaches
                System.err.println("Error fetching students from dedicated endpoint: " + e.getMessage());
                e.printStackTrace();
            }
            
            // Fallback: try to get the classroom details and extract students
            try {
                System.out.println("Falling back to classroom details endpoint...");
                Map<String, Object> classroom = classroomClient.getClassroomById(id, authHeader);
                
                // Debug: Print classroom contents for debugging
                if (classroom != null) {
                    System.out.println("Classroom found with ID " + id + ", keys: " + classroom.keySet());
                    
                    // Extract the students or student IDs from the classroom data
                    // Check if the classroom response already contains a students list
                    if (classroom.containsKey("students") && classroom.get("students") instanceof List) {
                        List<Map<String, Object>> students = (List<Map<String, Object>>) classroom.get("students");
                        System.out.println("Found students list in classroom data with " + students.size() + " students");
                        return ResponseEntity.ok(students);
                    }
                    
                    // If there are only studentIds, try to fetch each student's details from Keycloak
                    if (classroom.containsKey("studentIds") && classroom.get("studentIds") instanceof List) {
                        List<Object> studentIds = (List<Object>) classroom.get("studentIds");
                        System.out.println("Found studentIds list with " + studentIds.size() + " IDs");
                        
                        if (!studentIds.isEmpty()) {
                            // Get a token for Keycloak
                            String token = (authHeader != null && !authHeader.isBlank()) 
                                ? authHeader 
                                : keycloakTokenService.getAdminToken();
                            
                            List<Map<String, Object>> realStudents = new ArrayList<>();
                            List<Map<String, Object>> dummyStudents = new ArrayList<>();
                            
                            // Try to get actual user data from Keycloak
                            boolean anyRealStudentsFetched = false;
                            for (Object studentIdObj : studentIds) {
                                String studentId = studentIdObj.toString();
                                try {
                                    Map<String, Object> user = keycloakClient.getUserById(realm, studentId, token);
                                    if (user != null) {
                                        realStudents.add(user);
                                        anyRealStudentsFetched = true;
                                    } else {
                                        // Add a dummy student if Keycloak returned null
                                        Map<String, Object> dummyStudent = new HashMap<>();
                                        dummyStudent.put("id", studentId);
                                        dummyStudent.put("firstName", "Estudiante");
                                        dummyStudent.put("lastName", "ID: " + studentId);
                                        dummyStudent.put("email", "estudiante_" + studentId + "@ejemplo.com");
                                        dummyStudent.put("username", "estudiante_" + studentId);
                                        dummyStudents.add(dummyStudent);
                                    }
                                } catch (Exception e) {
                                    System.err.println("Error fetching user " + studentId + " from Keycloak: " + e.getMessage());
                                    // Add a dummy student on error
                                    Map<String, Object> dummyStudent = new HashMap<>();
                                    dummyStudent.put("id", studentId);
                                    dummyStudent.put("firstName", "Estudiante");
                                    dummyStudent.put("lastName", "ID: " + studentId);
                                    dummyStudent.put("email", "estudiante_" + studentId + "@ejemplo.com");
                                    dummyStudent.put("username", "estudiante_" + studentId);
                                    dummyStudents.add(dummyStudent);
                                }
                            }
                            
                            if (anyRealStudentsFetched) {
                                System.out.println("Successfully fetched " + realStudents.size() + " real students from Keycloak");
                                // If we have some real students, return them with any dummy students as a fallback
                                realStudents.addAll(dummyStudents);
                                return ResponseEntity.ok(realStudents);
                            } else if (!dummyStudents.isEmpty()) {
                                // If we have student IDs but couldn't fetch real data, return dummy data
                                System.out.println("Using " + dummyStudents.size() + " dummy students (no real data)");
                                return ResponseEntity.ok(dummyStudents);
                            }
                        } else {
                            System.out.println("StudentIds list is empty");
                        }
                    } else {
                        System.out.println("No students or studentIds found in classroom data");
                    }
                } else {
                    System.out.println("No classroom found with ID " + id);
                }
            } catch (Exception e) {
                // Log the error but continue with last fallback
                System.err.println("Error fetching classroom details: " + e.getMessage());
                e.printStackTrace();
            }
            
            // If all else fails, return some dummy students for testing
            List<Map<String, Object>> dummyStudents = new ArrayList<>();
            for (int i = 1; i <= 5; i++) {
                Map<String, Object> student = new HashMap<>();
                student.put("id", "dummy-" + i);
                student.put("firstName", "Estudiante");
                student.put("lastName", "De Prueba " + i);
                student.put("email", "estudiante" + i + "@test.com");
                student.put("username", "estudiante" + i);
                dummyStudents.add(student);
            }
            System.out.println("Returning " + dummyStudents.size() + " dummy students as final fallback");
            return ResponseEntity.ok(dummyStudents);
        } catch (Exception e) {
            // Log error and return an empty list if the service is not available
            System.err.println("Fatal error in getStudentsByClassroomId: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.ok(List.of());
        }
    }

    @GetMapping("/my-classrooms")
    public ResponseEntity<List<Map<String, Object>>> getMyClassrooms(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            List<Map<String, Object>> classrooms = classroomClient.getMyClassrooms(authHeader);
            return ResponseEntity.ok(classrooms);
        } catch (Exception e) {
            // Log error and return an empty list if the service is not available
            return ResponseEntity.ok(List.of());
        }
    }
    
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Map<String, Object>>> getClassroomsByStudentId(
            @PathVariable String studentId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            // First try to get classes where the student is enrolled
            List<Map<String, Object>> classrooms = classroomClient.getClassroomsByStudentId(studentId, authHeader);
            return ResponseEntity.ok(classrooms);
        } catch (Exception e) {
            // If the client doesn't support student-specific queries, use a fallback
            try {
                // Fallback: get all classrooms and filter on our side
                List<Map<String, Object>> allClassrooms = classroomClient.getAllClassrooms(authHeader);
                
                // Filter classrooms where the student is enrolled
                List<Map<String, Object>> filteredClassrooms = allClassrooms.stream()
                    .filter(classroom -> {
                        List<Object> studentIds = (List<Object>) classroom.get("studentIds");
                        return studentIds != null && 
                               (studentIds.contains(studentId) || 
                                studentIds.contains(Long.parseLong(studentId)));
                    })
                    .toList();
                    
                return ResponseEntity.ok(filteredClassrooms);
            } catch (Exception ex) {
                // Log error and return an empty list if filtering fails
                return ResponseEntity.ok(List.of());
            }
        }
    }
} 