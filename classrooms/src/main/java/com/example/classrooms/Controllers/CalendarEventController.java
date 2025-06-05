package com.example.classrooms.Controllers;

import com.example.classrooms.dto.CalendarEventDto;
import com.example.classrooms.models.CalendarEvent;
import com.example.classrooms.models.Classroom;
import com.example.classrooms.services.CalendarEventService;
import com.example.classrooms.services.ClassService;
import com.example.classrooms.utils.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/calendar")
@RequiredArgsConstructor
public class CalendarEventController {

    private final CalendarEventService eventService;
    private final ClassService classService;
    private final JwtUtil jwtUtil;

    @GetMapping("/events")
    public ResponseEntity<List<CalendarEventDto>> getAllEvents() {
        List<CalendarEvent> events = eventService.getAllEvents();
        List<CalendarEventDto> eventDtos = events.stream()
                .map(event -> {
                    CalendarEventDto dto = CalendarEventDto.fromModel(event);
                    // Add classroom name if available
                    if (event.getClassroomId() != null) {
                        Classroom classroom = classService.getClassroomById(event.getClassroomId());
                        if (classroom != null) {
                            dto.setClassroomName(classroom.getName());
                        }
                    }
                    return dto;
                })
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(eventDtos);
    }

    @GetMapping("/events/{id}")
    public ResponseEntity<CalendarEventDto> getEventById(@PathVariable Long id) {
        CalendarEvent event = eventService.getEventById(id);
        if (event == null) {
            return ResponseEntity.notFound().build();
        }
        
        CalendarEventDto dto = CalendarEventDto.fromModel(event);
        
        // Add classroom name if available
        if (event.getClassroomId() != null) {
            Classroom classroom = classService.getClassroomById(event.getClassroomId());
            if (classroom != null) {
                dto.setClassroomName(classroom.getName());
            }
        }
        
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/events")
    public ResponseEntity<CalendarEventDto> createEvent(
            @RequestBody CalendarEventDto eventDto,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        CalendarEvent event = eventDto.toModel();
        
        // Set creator ID from JWT if available
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.replace("Bearer ", "");
            String userId = jwtUtil.extractUserId(token);
            
            if (userId != null) {
                try {
                    Long userIdLong = Long.parseLong(userId);
                    event.setCreatorId(userIdLong);
                    
                    // Set creator name
                    String creatorName = jwtUtil.extractUsername(token);
                    eventDto.setCreatorName(creatorName);
                } catch (NumberFormatException e) {
                    // Ignore if can't parse
                }
            }
        }
        
        // Verify classroom exists
        if (event.getClassroomId() != null) {
            Classroom classroom = classService.getClassroomById(event.getClassroomId());
            if (classroom == null) {
                return ResponseEntity.badRequest().build();
            }
            
            // Set classroom name in DTO
            eventDto.setClassroomName(classroom.getName());
        }
        
        CalendarEvent savedEvent = eventService.createEvent(event);
        return ResponseEntity.ok(CalendarEventDto.fromModel(savedEvent));
    }

    @PutMapping("/events/{id}")
    public ResponseEntity<CalendarEventDto> updateEvent(
            @PathVariable Long id,
            @RequestBody CalendarEventDto eventDto,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        // Check if event exists
        CalendarEvent existingEvent = eventService.getEventById(id);
        if (existingEvent == null) {
            return ResponseEntity.notFound().build();
        }
        
        // Check permissions (only creator, teachers, or admins can update)
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.replace("Bearer ", "");
            String userId = jwtUtil.extractUserId(token);
            boolean isAdmin = jwtUtil.hasRole(token, "ADMIN");
            
            if (!isAdmin && userId != null) {
                try {
                    Long userIdLong = Long.parseLong(userId);
                    
                    // Check if user is the creator
                    boolean isCreator = userIdLong.equals(existingEvent.getCreatorId());
                    
                    // Check if user is a teacher for this classroom
                    boolean isTeacher = false;
                    if (existingEvent.getClassroomId() != null) {
                        Classroom classroom = classService.getClassroomById(existingEvent.getClassroomId());
                        isTeacher = classroom != null && 
                                    classroom.getTeacherIds() != null && 
                                    classroom.getTeacherIds().contains(userIdLong);
                    }
                    
                    if (!isCreator && !isTeacher) {
                        return ResponseEntity.status(403).build(); // Forbidden
                    }
                } catch (NumberFormatException e) {
                    // If ID can't be parsed, check only admin role
                    if (!isAdmin) {
                        return ResponseEntity.status(403).build(); // Forbidden
                    }
                }
            } else if (!isAdmin) {
                return ResponseEntity.status(403).build(); // Forbidden
            }
        }
        
        // Convert DTO to entity
        CalendarEvent event = eventDto.toModel();
        event.setId(id);
        
        // Preserve creator ID
        event.setCreatorId(existingEvent.getCreatorId());
        
        // Update event
        CalendarEvent updatedEvent = eventService.updateEvent(id, event);
        
        // Convert back to DTO
        CalendarEventDto updatedDto = CalendarEventDto.fromModel(updatedEvent);
        
        // Add classroom name if available
        if (updatedEvent.getClassroomId() != null) {
            Classroom classroom = classService.getClassroomById(updatedEvent.getClassroomId());
            if (classroom != null) {
                updatedDto.setClassroomName(classroom.getName());
            }
        }
        
        return ResponseEntity.ok(updatedDto);
    }

    @DeleteMapping("/events/{id}")
    public ResponseEntity<Void> deleteEvent(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        // Check if event exists
        CalendarEvent existingEvent = eventService.getEventById(id);
        if (existingEvent == null) {
            return ResponseEntity.notFound().build();
        }
        
        // Check permissions (only creator, teachers, or admins can delete)
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.replace("Bearer ", "");
            String userId = jwtUtil.extractUserId(token);
            boolean isAdmin = jwtUtil.hasRole(token, "ADMIN");
            
            if (!isAdmin && userId != null) {
                try {
                    Long userIdLong = Long.parseLong(userId);
                    
                    // Check if user is the creator
                    boolean isCreator = userIdLong.equals(existingEvent.getCreatorId());
                    
                    // Check if user is a teacher for this classroom
                    boolean isTeacher = false;
                    if (existingEvent.getClassroomId() != null) {
                        Classroom classroom = classService.getClassroomById(existingEvent.getClassroomId());
                        isTeacher = classroom != null && 
                                    classroom.getTeacherIds() != null && 
                                    classroom.getTeacherIds().contains(userIdLong);
                    }
                    
                    if (!isCreator && !isTeacher) {
                        return ResponseEntity.status(403).build(); // Forbidden
                    }
                } catch (NumberFormatException e) {
                    // If ID can't be parsed, check only admin role
                    if (!isAdmin) {
                        return ResponseEntity.status(403).build(); // Forbidden
                    }
                }
            } else if (!isAdmin) {
                return ResponseEntity.status(403).build(); // Forbidden
            }
        }
        
        eventService.deleteEvent(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/classroom/{classroomId}/events")
    public ResponseEntity<List<CalendarEventDto>> getEventsByClassroomId(@PathVariable Long classroomId) {
        // Check if classroom exists
        Classroom classroom = classService.getClassroomById(classroomId);
        if (classroom == null) {
            return ResponseEntity.notFound().build();
        }
        
        List<CalendarEvent> events = eventService.getEventsByClassroomId(classroomId);
        List<CalendarEventDto> eventDtos = events.stream()
                .map(event -> {
                    CalendarEventDto dto = CalendarEventDto.fromModel(event);
                    dto.setClassroomName(classroom.getName());
                    return dto;
                })
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(eventDtos);
    }

    @GetMapping("/classroom/{classroomId}/events/range")
    public ResponseEntity<List<CalendarEventDto>> getEventsByClassroomAndDateRange(
            @PathVariable Long classroomId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        
        // Check if classroom exists
        Classroom classroom = classService.getClassroomById(classroomId);
        if (classroom == null) {
            return ResponseEntity.notFound().build();
        }
        
        List<CalendarEvent> events = eventService.getEventsByClassroomAndDateRange(classroomId, start, end);
        List<CalendarEventDto> eventDtos = events.stream()
                .map(event -> {
                    CalendarEventDto dto = CalendarEventDto.fromModel(event);
                    dto.setClassroomName(classroom.getName());
                    return dto;
                })
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(eventDtos);
    }

    @GetMapping("/events/type/{eventType}")
    public ResponseEntity<List<CalendarEventDto>> getEventsByType(@PathVariable String eventType) {
        List<CalendarEvent> events = eventService.getEventsByType(eventType);
        List<CalendarEventDto> eventDtos = events.stream()
                .map(event -> {
                    CalendarEventDto dto = CalendarEventDto.fromModel(event);
                    
                    // Add classroom name if available
                    if (event.getClassroomId() != null) {
                        Classroom classroom = classService.getClassroomById(event.getClassroomId());
                        if (classroom != null) {
                            dto.setClassroomName(classroom.getName());
                        }
                    }
                    
                    return dto;
                })
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(eventDtos);
    }

    @GetMapping("/classroom/{classroomId}/events/type/{eventType}")
    public ResponseEntity<List<CalendarEventDto>> getEventsByClassroomIdAndType(
            @PathVariable Long classroomId,
            @PathVariable String eventType) {
        
        // Check if classroom exists
        Classroom classroom = classService.getClassroomById(classroomId);
        if (classroom == null) {
            return ResponseEntity.notFound().build();
        }
        
        List<CalendarEvent> events = eventService.getEventsByClassroomIdAndType(classroomId, eventType);
        List<CalendarEventDto> eventDtos = events.stream()
                .map(event -> {
                    CalendarEventDto dto = CalendarEventDto.fromModel(event);
                    dto.setClassroomName(classroom.getName());
                    return dto;
                })
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(eventDtos);
    }

    @GetMapping("/my-events")
    public ResponseEntity<List<CalendarEventDto>> getMyEvents(
            @RequestHeader("Authorization") String authHeader) {
        
        // Extract user ID from token
        String token = authHeader.replace("Bearer ", "");
        String userId = jwtUtil.extractUserId(token);
        
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        
        try {
            Long userIdLong = Long.parseLong(userId);
            List<CalendarEvent> events = eventService.getEventsByUserId(userIdLong);
            
            List<CalendarEventDto> eventDtos = events.stream()
                    .map(event -> {
                        CalendarEventDto dto = CalendarEventDto.fromModel(event);
                        
                        // Add classroom name if available
                        if (event.getClassroomId() != null) {
                            Classroom classroom = classService.getClassroomById(event.getClassroomId());
                            if (classroom != null) {
                                dto.setClassroomName(classroom.getName());
                            }
                        }
                        
                        return dto;
                    })
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(eventDtos);
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().build();
        }
    }
} 