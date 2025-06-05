package com.example.classrooms.dto;

import com.example.classrooms.models.CalendarEvent;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CalendarEventDto {
    private Long id;
    private String title;
    private String description;
    private String startTime;
    private String endTime;
    private Long classroomId;
    private String eventType;
    private String color;
    private String location;
    private String meetingLink;
    private Long creatorId;
    private String creatorName;
    private boolean visibleToStudents;
    
    // Additional fields for frontend display
    private String classroomName;
    
    // Convert to DTO from model
    public static CalendarEventDto fromModel(CalendarEvent event) {
        if (event == null) {
            return null;
        }
        
        DateTimeFormatter formatter = DateTimeFormatter.ISO_DATE_TIME;
        
        return CalendarEventDto.builder()
                .id(event.getId())
                .title(event.getTitle())
                .description(event.getDescription())
                .startTime(event.getStartTime() != null ? event.getStartTime().format(formatter) : null)
                .endTime(event.getEndTime() != null ? event.getEndTime().format(formatter) : null)
                .classroomId(event.getClassroomId())
                .eventType(event.getEventType())
                .color(event.getColor())
                .location(event.getLocation())
                .meetingLink(event.getMeetingLink())
                .creatorId(event.getCreatorId())
                .visibleToStudents(event.isVisibleToStudents())
                .build();
    }
    
    // Convert to model from DTO
    public CalendarEvent toModel() {
        DateTimeFormatter formatter = DateTimeFormatter.ISO_DATE_TIME;
        
        return CalendarEvent.builder()
                .id(this.id)
                .title(this.title)
                .description(this.description)
                .startTime(this.startTime != null ? LocalDateTime.parse(this.startTime, formatter) : null)
                .endTime(this.endTime != null ? LocalDateTime.parse(this.endTime, formatter) : null)
                .classroomId(this.classroomId)
                .eventType(this.eventType)
                .color(this.color)
                .location(this.location)
                .meetingLink(this.meetingLink)
                .creatorId(this.creatorId)
                .visibleToStudents(this.visibleToStudents)
                .build();
    }
} 