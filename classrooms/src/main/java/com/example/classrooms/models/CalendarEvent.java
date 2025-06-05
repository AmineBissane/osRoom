package com.example.classrooms.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CalendarEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String title;
    private String description;
    
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    
    private Long classroomId;
    
    // Event type can be: "class", "assignment", "exam", "meeting", etc.
    private String eventType;
    
    // Optional color for display in the frontend
    private String color;
    
    // Optional location (physical or virtual)
    private String location;
    
    // Optional link for virtual meetings
    private String meetingLink;
    
    // Creator of the event (teacher or admin)
    private Long creatorId;
    
    // Whether the event is visible to students
    private boolean visibleToStudents = true;
} 