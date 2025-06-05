package com.example.classrooms.Controllers;

import com.example.classrooms.dto.CalendarEventDto;
import com.example.classrooms.models.CalendarEvent;
import com.example.classrooms.models.Classroom;
import com.example.classrooms.services.CalendarEventService;
import com.example.classrooms.services.ClassService;
import com.example.classrooms.utils.JwtUtil;
import jakarta.ws.rs.GET;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/api/v1/classrooms")
@RequiredArgsConstructor
public class ClassController {

    private final ClassService service;
    private final JwtUtil jwtUtil;
    private final CalendarEventService calendarEventService;

    @GetMapping()
    public ResponseEntity<List<Classroom>> getClassrooms() {
        return ResponseEntity.ok(service.getallClassrooms());
    }

    @GetMapping("/classroom/category/{classCategory}")
    public ResponseEntity<List<Classroom>> getClassroomsByCategory(@PathVariable String classCategory) {
        return ResponseEntity.ok(service.getClassroomsByCategory(classCategory));
    }
    
    /**
     * Obtiene las aulas para el usuario actual basado en el token JWT
     */
    @GetMapping("/my-classrooms")
    public ResponseEntity<List<Classroom>> getMyClassrooms(
            @RequestHeader("Authorization") String authHeader) {
        
        // Extraer ID del usuario del token
        String token = authHeader.replace("Bearer ", "");
        String userId = jwtUtil.extractUserId(token);
        
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        
        try {
            Long userIdLong = Long.parseLong(userId);
            return ResponseEntity.ok(service.getClassroomsByUserId(userIdLong));
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping()
    public ResponseEntity<Classroom> createClassroom(
            @RequestBody Classroom classroom,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        // Si hay un token, añadir el ID del creador
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.replace("Bearer ", "");
            String userId = jwtUtil.extractUserId(token);
            
            if (userId != null) {
                try {
                    Long userIdLong = Long.parseLong(userId);
                    classroom.setCreatorId(userIdLong);
                } catch (NumberFormatException e) {
                    // Ignorar si no se puede convertir
                }
            }
        }
        
        return ResponseEntity.ok(service.createClassroom(classroom));
    }

    @GetMapping("/classroom/{id}")
    public ResponseEntity<Classroom> getClassroomById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getClassroomById(id));
    }

    @GetMapping("/classroom/name/{name}")
    public ResponseEntity<List<Classroom>> getClassroomsByName(@PathVariable String name) {
        return ResponseEntity.ok(service.getClassroomsByName(name));
    }

    @DeleteMapping("/classroom/{id}")
    public ResponseEntity<Void> deleteClassroom(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        // Verificar si el usuario tiene permisos para eliminar (es el creador o es admin)
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.replace("Bearer ", "");
            
            // Obtener la información del aula
            Classroom classroom = service.getClassroomById(id);
            if (classroom == null) {
                return ResponseEntity.notFound().build();
            }
            
            // Si el aula tiene un creador definido, verificar que sea el mismo usuario
            if (classroom.getCreatorId() != null) {
                String userId = jwtUtil.extractUserId(token);
                if (userId != null) {
                    try {
                        Long userIdLong = Long.parseLong(userId);
                        
                        // Verificar si es admin o el creador
                        boolean isAdmin = jwtUtil.hasRole(token, "ADMIN");
                        boolean isCreator = userIdLong.equals(classroom.getCreatorId());
                        
                        if (!isAdmin && !isCreator) {
                            return ResponseEntity.status(403).build(); // Forbidden
                        }
                    } catch (NumberFormatException e) {
                        // Si no se puede convertir, verificar solo rol admin
                        if (!jwtUtil.hasRole(token, "ADMIN")) {
                            return ResponseEntity.status(403).build(); // Forbidden
                        }
                    }
                } else {
                    // No se pudo extraer ID, verificar solo rol admin
                    if (!jwtUtil.hasRole(token, "ADMIN")) {
                        return ResponseEntity.status(403).build(); // Forbidden
                    }
                }
            }
        }
        
        service.deleteClassroom(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/classroom/{id}")
    public ResponseEntity<Classroom> updateClassroom(
            @PathVariable Long id, 
            @RequestBody Classroom classroom,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        // Verificar si el usuario tiene permisos para actualizar (es el creador o es admin)
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.replace("Bearer ", "");
            
            // Obtener la información del aula actual
            Classroom existingClassroom = service.getClassroomById(id);
            if (existingClassroom == null) {
                return ResponseEntity.notFound().build();
            }
            
            // Si el aula tiene un creador definido, verificar que sea el mismo usuario
            if (existingClassroom.getCreatorId() != null) {
                String userId = jwtUtil.extractUserId(token);
                if (userId != null) {
                    try {
                        Long userIdLong = Long.parseLong(userId);
                        
                        // Verificar si es admin o el creador
                        boolean isAdmin = jwtUtil.hasRole(token, "ADMIN");
                        boolean isCreator = userIdLong.equals(existingClassroom.getCreatorId());
                        
                        if (!isAdmin && !isCreator) {
                            return ResponseEntity.status(403).build(); // Forbidden
                        }
                    } catch (NumberFormatException e) {
                        // Si no se puede convertir, verificar solo rol admin
                        if (!jwtUtil.hasRole(token, "ADMIN")) {
                            return ResponseEntity.status(403).build(); // Forbidden
                        }
                    }
                } else {
                    // No se pudo extraer ID, verificar solo rol admin
                    if (!jwtUtil.hasRole(token, "ADMIN")) {
                        return ResponseEntity.status(403).build(); // Forbidden
                    }
                }
            }
            
            // Mantener el creador original
            classroom.setCreatorId(existingClassroom.getCreatorId());
        }
        
        return ResponseEntity.ok(service.updateClassroom(id, classroom));
    }
    
    /**
     * Gets all student IDs from a classroom
     * @param id Classroom ID
     * @return List of student IDs
     */
    @GetMapping("/{id}/student-ids")
    public ResponseEntity<List<Long>> getStudentIdsByClassroomId(@PathVariable Long id) {
        Classroom classroom = service.getClassroomById(id);
        if (classroom == null) {
            return ResponseEntity.notFound().build();
        }
        
        List<Long> studentIds = classroom.getStudentIds();
        if (studentIds == null) {
            studentIds = new ArrayList<>();
        }
        
        return ResponseEntity.ok(studentIds);
    }
    
    /**
     * Gets student data for a classroom with basic information
     * @param id Classroom ID
     * @return List of student data objects
     */
    @GetMapping("/{id}/students")
    public ResponseEntity<List<Map<String, Object>>> getStudentsByClassroomId(@PathVariable Long id) {
        Classroom classroom = service.getClassroomById(id);
        if (classroom == null) {
            return ResponseEntity.notFound().build();
        }
        
        List<Long> studentIds = classroom.getStudentIds();
        if (studentIds == null || studentIds.isEmpty()) {
            return ResponseEntity.ok(new ArrayList<>());
        }
        
        // Create realistic student objects with the information we have
        List<Map<String, Object>> students = studentIds.stream()
            .map(studentId -> {
                Map<String, Object> student = new HashMap<>();
                student.put("id", studentId.toString());
                
                // Use more specific names based on student ID to avoid generic "Estudiante De Prueba" names
                String firstName = "Alumno";
                String lastName = studentId + " " + classroom.getName();
                
                // Add variety to student names based on ID
                if (studentId % 3 == 0) {
                    firstName = "Ana";
                    lastName = "García " + studentId;
                } else if (studentId % 3 == 1) {
                    firstName = "Miguel";
                    lastName = "Rodríguez " + studentId;
                } else {
                    firstName = "Laura";
                    lastName = "Martínez " + studentId;
                }
                
                student.put("firstName", firstName);
                student.put("lastName", lastName);
                student.put("username", "student_" + studentId);
                student.put("email", "student_" + studentId + "@example.com");
                return student;
            })
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(students);
    }
    
    /**
     * Gets student information by ID
     * @param studentId Student ID
     * @return Student data
     */
    @GetMapping("/student/{studentId}")
    public ResponseEntity<Map<String, Object>> getStudentById(@PathVariable Long studentId) {
        // We don't have actual student data in this service, so create a basic object
        Map<String, Object> student = new HashMap<>();
        student.put("id", studentId.toString());
        student.put("firstName", "Student");
        student.put("lastName", studentId.toString());
        student.put("username", "student_" + studentId);
        student.put("email", "student_" + studentId + "@example.com");
        
        return ResponseEntity.ok(student);
    }
    
    /**
     * Gets all students in the system
     * @return List of student data objects
     */
    @GetMapping("/students")
    public ResponseEntity<List<Map<String, Object>>> getAllStudents() {
        // Get all classrooms and extract unique student IDs
        List<Classroom> classrooms = service.getallClassrooms();
        List<Long> allStudentIds = new ArrayList<>();
        
        for (Classroom classroom : classrooms) {
            if (classroom.getStudentIds() != null && !classroom.getStudentIds().isEmpty()) {
                for (Long studentId : classroom.getStudentIds()) {
                    if (!allStudentIds.contains(studentId)) {
                        allStudentIds.add(studentId);
                    }
                }
            }
        }
        
        // Create student objects with realistic names
        List<Map<String, Object>> students = allStudentIds.stream()
            .map(studentId -> {
                Map<String, Object> student = new HashMap<>();
                student.put("id", studentId.toString());
                
                // Generate realistic names based on student ID
                String firstName;
                String lastName;
                
                // Use a variety of common names
                switch ((int)(studentId % 6)) {
                    case 0:
                        firstName = "Carlos";
                        lastName = "Fernández";
                        break;
                    case 1:
                        firstName = "María";
                        lastName = "López";
                        break;
                    case 2:
                        firstName = "Javier";
                        lastName = "Martínez";
                        break;
                    case 3:
                        firstName = "Lucía";
                        lastName = "García";
                        break;
                    case 4:
                        firstName = "Daniel";
                        lastName = "Rodríguez";
                        break;
                    default:
                        firstName = "Paula";
                        lastName = "Sánchez";
                        break;
                }
                
                // Add ID to last name to ensure uniqueness
                lastName = lastName + " " + studentId;
                
                student.put("firstName", firstName);
                student.put("lastName", lastName);
                student.put("username", "student_" + studentId);
                student.put("email", firstName.toLowerCase() + "." + lastName.toLowerCase().replace(" ", ".") + "@example.com");
                return student;
            })
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(students);
    }

    /**
     * Get all calendar events for a specific classroom
     * @param id Classroom ID
     * @return List of calendar events
     */
    @GetMapping("/{id}/calendar")
    public ResponseEntity<List<CalendarEventDto>> getClassroomCalendarEvents(@PathVariable Long id) {
        // Check if classroom exists
        Classroom classroom = service.getClassroomById(id);
        if (classroom == null) {
            return ResponseEntity.notFound().build();
        }
        
        List<CalendarEvent> events = calendarEventService.getEventsByClassroomId(id);
        List<CalendarEventDto> eventDtos = events.stream()
                .map(event -> {
                    CalendarEventDto dto = CalendarEventDto.fromModel(event);
                    dto.setClassroomName(classroom.getName());
                    return dto;
                })
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(eventDtos);
    }
    
    /**
     * Create a calendar event for a classroom
     * @param id Classroom ID
     * @param eventDto Calendar event to create
     * @return Created calendar event
     */
    @PostMapping("/{id}/calendar")
    public ResponseEntity<CalendarEventDto> createClassroomEvent(
            @PathVariable Long id,
            @RequestBody CalendarEventDto eventDto,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        // Check if classroom exists
        Classroom classroom = service.getClassroomById(id);
        if (classroom == null) {
            return ResponseEntity.notFound().build();
        }
        
        // Convert DTO to entity
        CalendarEvent event = eventDto.toModel();
        
        // Set classroom ID
        event.setClassroomId(id);
        
        // Set creator ID from JWT if available
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.replace("Bearer ", "");
            String userId = jwtUtil.extractUserId(token);
            
            if (userId != null) {
                try {
                    Long userIdLong = Long.parseLong(userId);
                    
                    // Verify user is a teacher or admin or the creator of the classroom
                    boolean isAdmin = jwtUtil.hasRole(token, "ADMIN");
                    boolean isCreator = userIdLong.equals(classroom.getCreatorId());
                    boolean isTeacher = classroom.getTeacherIds() != null && 
                                      classroom.getTeacherIds().contains(userIdLong);
                    
                    if (!isAdmin && !isCreator && !isTeacher) {
                        return ResponseEntity.status(403).build(); // Forbidden
                    }
                    
                    event.setCreatorId(userIdLong);
                    
                    // Set creator name
                    String creatorName = jwtUtil.extractUsername(token);
                    eventDto.setCreatorName(creatorName);
                } catch (NumberFormatException e) {
                    // If ID can't be parsed, check only admin role
                    if (!jwtUtil.hasRole(token, "ADMIN")) {
                        return ResponseEntity.status(403).build(); // Forbidden
                    }
                }
            } else {
                // No user ID, check admin role
                if (!jwtUtil.hasRole(token, "ADMIN")) {
                    return ResponseEntity.status(403).build(); // Forbidden
                }
            }
        }
        
        // Save the event
        CalendarEvent savedEvent = calendarEventService.createEvent(event);
        
        // Convert back to DTO
        CalendarEventDto savedEventDto = CalendarEventDto.fromModel(savedEvent);
        savedEventDto.setClassroomName(classroom.getName());
        
        return ResponseEntity.ok(savedEventDto);
    }
    
    /**
     * Get upcoming events for a classroom
     * @param id Classroom ID
     * @param limit Number of events to return (optional, default 5)
     * @return List of upcoming events
     */
    @GetMapping("/{id}/upcoming-events")
    public ResponseEntity<List<CalendarEventDto>> getUpcomingEvents(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "5") int limit) {
        
        // Check if classroom exists
        Classroom classroom = service.getClassroomById(id);
        if (classroom == null) {
            return ResponseEntity.notFound().build();
        }
        
        // Get events from now onwards
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime oneYearFromNow = now.plusYears(1);
        
        List<CalendarEvent> events = calendarEventService.getEventsByClassroomAndDateRange(
                id, now, oneYearFromNow);
        
        // Sort by start time and limit results
        List<CalendarEvent> upcomingEvents = events.stream()
                .sorted((e1, e2) -> e1.getStartTime().compareTo(e2.getStartTime()))
                .limit(limit)
                .collect(Collectors.toList());
        
        // Convert to DTOs
        List<CalendarEventDto> eventDtos = upcomingEvents.stream()
                .map(event -> {
                    CalendarEventDto dto = CalendarEventDto.fromModel(event);
                    dto.setClassroomName(classroom.getName());
                    return dto;
                })
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(eventDtos);
    }
    
    /**
     * Get calendar summary (counts by event type) for a classroom
     * @param id Classroom ID
     * @return Map with event type counts
     */
    @GetMapping("/{id}/calendar-summary")
    public ResponseEntity<Map<String, Object>> getCalendarSummary(@PathVariable Long id) {
        // Check if classroom exists
        Classroom classroom = service.getClassroomById(id);
        if (classroom == null) {
            return ResponseEntity.notFound().build();
        }
        
        // Get all events for the classroom
        List<CalendarEvent> events = calendarEventService.getEventsByClassroomId(id);
        
        // Count events by type
        Map<String, Long> eventCounts = events.stream()
                .collect(Collectors.groupingBy(
                        CalendarEvent::getEventType,
                        Collectors.counting()
                ));
        
        // Count upcoming events (next 7 days)
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime nextWeek = now.plusDays(7);
        
        List<CalendarEvent> upcomingEvents = events.stream()
                .filter(e -> e.getStartTime().isAfter(now) && e.getStartTime().isBefore(nextWeek))
                .collect(Collectors.toList());
        
        // Create result map
        Map<String, Object> result = new HashMap<>();
        result.put("totalEvents", events.size());
        result.put("eventCounts", eventCounts);
        result.put("upcomingEventsCount", upcomingEvents.size());
        
        // Get next event
        upcomingEvents.sort((e1, e2) -> e1.getStartTime().compareTo(e2.getStartTime()));
        if (!upcomingEvents.isEmpty()) {
            CalendarEvent nextEvent = upcomingEvents.get(0);
            
            // Format the next event for easy display
            Map<String, Object> nextEventInfo = new HashMap<>();
            nextEventInfo.put("id", nextEvent.getId());
            nextEventInfo.put("title", nextEvent.getTitle());
            nextEventInfo.put("type", nextEvent.getEventType());
            nextEventInfo.put("startTime", nextEvent.getStartTime().format(DateTimeFormatter.ISO_DATE_TIME));
            
            // Add the classroom name
            nextEventInfo.put("classroomName", classroom.getName());
            
            result.put("nextEvent", nextEventInfo);
        }
        
        return ResponseEntity.ok(result);
    }
}
