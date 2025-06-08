package com.osroom.gestionnap;

import com.osroom.gestionnap.client.ClassroomClient;
import com.osroom.gestionnap.client.KeycloakClient;
import com.osroom.gestionnap.model.RegistroAsistencia;
import com.osroom.gestionnap.repository.RegistroAsistenciaRepository;
import com.osroom.gestionnap.service.KeycloakTokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.Bean;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
public class GestionNapApplication {

    @Autowired
    private ClassroomClient classroomClient;
    
    @Autowired
    private KeycloakClient keycloakClient;
    
    @Autowired
    private KeycloakTokenService keycloakTokenService;
    
    @Value("${app.keycloak.realm:osRoom}")
    private String realm;

    public static void main(String[] args) {
        SpringApplication.run(GestionNapApplication.class, args);
    }
    
    @Bean
    public CommandLineRunner initData(RegistroAsistenciaRepository registroAsistenciaRepository) {
        return args -> {
            // Check if we already have records
            if (registroAsistenciaRepository.count() > 0) {
                System.out.println("Database already contains attendance records, skipping initialization");
                return;
            }
            
            System.out.println("Initializing attendance data...");
            List<RegistroAsistencia> allRegistros = new ArrayList<>();
            Random random = new Random();
            
            try {
                String token = keycloakTokenService.getServiceAccountToken();
                List<Map<String, Object>> classrooms = new ArrayList<>();
                
                try {
                    classrooms = classroomClient.getAllClassrooms(token);
                    System.out.println("Found " + classrooms.size() + " classrooms for attendance initialization");
                } catch (Exception e) {
                    System.err.println("Error fetching classrooms: " + e.getMessage());
                    e.printStackTrace();
                    // Return early if we can't get any classrooms
                    return;
                }
                
                if (classrooms.isEmpty()) {
                    System.out.println("No classrooms found, skipping attendance initialization");
                    return;
                }
                
                // Process each classroom to create attendance records
                for (Map<String, Object> classroom : classrooms) {
                    Long classroomId = null;
                    String classroomName = "Unknown Classroom";
                    
                    // Extract classroom ID
                    if (classroom.containsKey("id")) {
                        Object idObj = classroom.get("id");
                        if (idObj instanceof Long) {
                            classroomId = (Long) idObj;
                        } else if (idObj instanceof Integer) {
                            classroomId = ((Integer) idObj).longValue();
                        } else if (idObj instanceof String) {
                            try {
                                classroomId = Long.parseLong((String) idObj);
                            } catch (Exception e) {
                                continue;
                            }
                        }
                    }
                    
                    if (classroomId == null) {
                        continue;
                    }
                    
                    // Extract classroom name
                    if (classroom.containsKey("name")) {
                        classroomName = classroom.get("name").toString();
                    }
                    
                    System.out.println("Processing classroom: " + classroomName + " (ID: " + classroomId + ")");
                    
                    // Try different approaches to get student data
                    List<Map<String, Object>> students = getStudentsForClassroom(classroomId, token, classroom);
                    
                    if (students.isEmpty()) {
                        System.out.println("No students found for classroom " + classroomId + ", skipping");
                        continue;
                    }
                    
                    System.out.println("Found " + students.size() + " students for classroom " + classroomId);
                    
                    // Create attendance records for the last 3 days
                    LocalDate today = LocalDate.now();
                    LocalDate[] dates = {
                        today,
                        today.minusDays(1),
                        today.minusDays(2)
                    };
                    
                    for (LocalDate date : dates) {
                        for (Map<String, Object> student : students) {
                            String studentId;
                            String studentName = "Unknown Student";
                            
                            // Extract student ID
                            if (student.containsKey("id")) {
                                studentId = student.get("id").toString();
                            } else if (student.containsKey("sub")) {
                                studentId = student.get("sub").toString();
                            } else {
                                // Skip if no ID
                                continue;
                            }
                            
                            // Extract student name
                            if (student.containsKey("firstName") && student.containsKey("lastName")) {
                                studentName = student.get("firstName") + " " + student.get("lastName");
                            } else if (student.containsKey("given_name") && student.containsKey("family_name")) {
                                studentName = student.get("given_name") + " " + student.get("family_name");
                            } else if (student.containsKey("name")) {
                                studentName = student.get("name").toString();
                            } else if (student.containsKey("username")) {
                                studentName = student.get("username").toString();
                            } else if (student.containsKey("preferred_username")) {
                                studentName = student.get("preferred_username").toString();
                            }
                            
                            // Create attendance record
                            boolean presente = random.nextDouble() > 0.2; // 80% chance of being present
                            
                            RegistroAsistencia registro = RegistroAsistencia.builder()
                                    .userId(studentId)
                                    .userName(studentName)
                                    .estudianteId(studentId)
                                    .estudianteNombre(studentName)
                                    .classroomId(classroomId.intValue())
                                    .classroomName(classroomName)
                                    .claseId(classroomId)
                                    .claseNombre(classroomName)
                                    .fecha(date)
                                    .presente(presente)
                                    .estado(presente ? "PRESENTE" : "AUSENTE")
                                    .observaciones("Registro creado automáticamente")
                                    .horaRegistro(LocalTime.of(8, 0).plusMinutes(random.nextInt(30)))
                                    .build();
                            
                            allRegistros.add(registro);
                        }
                    }
                }
                
                if (!allRegistros.isEmpty()) {
                    registroAsistenciaRepository.saveAll(allRegistros);
                    System.out.println("Successfully created " + allRegistros.size() + " attendance records");
                } else {
                    System.out.println("No attendance records were created");
                }
                
            } catch (Exception e) {
                System.err.println("Error initializing attendance data: " + e.getMessage());
                e.printStackTrace();
            }
        };
    }

    /**
     * Tries different approaches to get students for a classroom
     */
    private List<Map<String, Object>> getStudentsForClassroom(Long classroomId, String token, Map<String, Object> classroom) {
        List<Map<String, Object>> students = new ArrayList<>();
        
        // Approach 1: Try to get students from dedicated students endpoint
        try {
            students = classroomClient.getStudentsByClassroomId(classroomId, token);
            if (!students.isEmpty()) {
                System.out.println("Successfully got " + students.size() + " students from students endpoint");
                return students;
            }
        } catch (Exception e) {
            System.out.println("Error getting students from dedicated endpoint: " + e.getMessage());
        }
        
        // Approach 2: Try to extract student IDs from classroom and get data from Keycloak
        if (classroom.containsKey("studentIds") && classroom.get("studentIds") instanceof List) {
            List<Object> studentIds = (List<Object>) classroom.get("studentIds");
            System.out.println("Found " + studentIds.size() + " student IDs in classroom data");
            
            // Process each student ID
            for (Object studentIdObj : studentIds) {
                String studentId = studentIdObj.toString();
                
                try {
                    // Try to get student data from Keycloak
                    Map<String, Object> user = keycloakClient.getUserById(realm, studentId, token);
                    if (user != null) {
                        students.add(user);
                    } else {
                        // Create a minimal student object if Keycloak doesn't have data
                        Map<String, Object> minimalStudent = new HashMap<>();
                        minimalStudent.put("id", studentId);
                        minimalStudent.put("firstName", "Student");
                        minimalStudent.put("lastName", studentId);
                        students.add(minimalStudent);
                    }
                } catch (Exception ex) {
                    // Create a minimal student object on error
                    Map<String, Object> minimalStudent = new HashMap<>();
                    minimalStudent.put("id", studentId);
                    minimalStudent.put("firstName", "Student");
                    minimalStudent.put("lastName", studentId);
                    students.add(minimalStudent);
                }
            }
            
            if (!students.isEmpty()) {
                System.out.println("Successfully created " + students.size() + " student records from classroom data");
                return students;
            }
        }
        
        // Approach 3: Create dummy students as a last resort
        if (students.isEmpty()) {
            System.out.println("Creating dummy students for classroom " + classroomId);
            
            // Common Spanish first names and last names for more realistic data
            String[] firstNames = {"Miguel", "Laura", "Carlos", "Ana", "David", "Lucía", "Javier", "Elena", "Pablo", "Marta"};
            String[] lastNames = {"García", "Rodríguez", "Martínez", "Fernández", "López", "Sánchez", "Pérez", "González", "Ruiz", "Díaz"};
            Random random = new Random();
            
            for (int i = 1; i <= 5; i++) {
                // Generate a realistic name
                String firstName = firstNames[random.nextInt(firstNames.length)];
                String lastName = lastNames[random.nextInt(lastNames.length)] + " " + lastNames[random.nextInt(lastNames.length)];
                
                Map<String, Object> dummyStudent = new HashMap<>();
                dummyStudent.put("id", "student-" + classroomId + "-" + i);
                dummyStudent.put("firstName", firstName);
                dummyStudent.put("lastName", lastName);
                dummyStudent.put("username", firstName.toLowerCase() + "." + lastName.toLowerCase().replace(" ", "."));
                dummyStudent.put("email", firstName.toLowerCase() + "." + lastName.toLowerCase().replace(" ", ".") + "@example.com");
                students.add(dummyStudent);
            }
        }
        
        return students;
    }
} 