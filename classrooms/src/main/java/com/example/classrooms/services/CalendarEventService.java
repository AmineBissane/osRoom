package com.example.classrooms.services;

import com.example.classrooms.Repository.CalendarEventRepository;
import com.example.classrooms.Repository.ClassRepository;
import com.example.classrooms.models.CalendarEvent;
import com.example.classrooms.models.Classroom;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CalendarEventService {

    private final CalendarEventRepository eventRepository;
    private final ClassRepository classRepository;

    // Get all events
    public List<CalendarEvent> getAllEvents() {
        return eventRepository.findAll();
    }

    // Get event by ID
    public CalendarEvent getEventById(Long id) {
        return eventRepository.findById(id).orElse(null);
    }

    // Create a new event
    public CalendarEvent createEvent(CalendarEvent event) {
        return eventRepository.save(event);
    }

    // Update an event
    public CalendarEvent updateEvent(Long id, CalendarEvent event) {
        if (eventRepository.existsById(id)) {
            event.setId(id);
            return eventRepository.save(event);
        }
        return null;
    }

    // Delete an event
    public void deleteEvent(Long id) {
        eventRepository.deleteById(id);
    }

    // Get events for a specific classroom
    public List<CalendarEvent> getEventsByClassroomId(Long classroomId) {
        return eventRepository.findByClassroomId(classroomId);
    }

    // Get events for a specific classroom in a date range
    public List<CalendarEvent> getEventsByClassroomAndDateRange(
            Long classroomId, LocalDateTime startTime, LocalDateTime endTime) {
        return eventRepository.findByClassroomIdAndTimeRange(classroomId, startTime, endTime);
    }

    // Get events by event type
    public List<CalendarEvent> getEventsByType(String eventType) {
        return eventRepository.findByEventType(eventType);
    }

    // Get events by creator ID
    public List<CalendarEvent> getEventsByCreatorId(Long creatorId) {
        return eventRepository.findByCreatorId(creatorId);
    }
    
    // Get all events for classrooms where user is enrolled or teaching
    public List<CalendarEvent> getEventsByUserId(Long userId) {
        if (userId == null) {
            return new ArrayList<>();
        }
        
        // Find all classrooms where this user is a student, teacher, or creator
        List<Classroom> userClassrooms = classRepository.findAll().stream()
                .filter(classroom -> 
                    (classroom.getCreatorId() != null && classroom.getCreatorId().equals(userId)) ||
                    (classroom.getStudentIds() != null && classroom.getStudentIds().contains(userId)) ||
                    (classroom.getTeacherIds() != null && classroom.getTeacherIds().contains(userId))
                )
                .collect(Collectors.toList());
        
        if (userClassrooms.isEmpty()) {
            return new ArrayList<>();
        }
        
        // Extract classroom IDs
        List<Long> classroomIds = userClassrooms.stream()
                .map(Classroom::getId)
                .collect(Collectors.toList());
        
        // Find all events for these classrooms
        return eventRepository.findByClassroomIds(classroomIds);
    }
    
    // Get events for a specific classroom and event type
    public List<CalendarEvent> getEventsByClassroomIdAndType(Long classroomId, String eventType) {
        return eventRepository.findByClassroomIdAndEventType(classroomId, eventType);
    }
} 