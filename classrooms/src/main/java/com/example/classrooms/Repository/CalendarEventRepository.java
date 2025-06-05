package com.example.classrooms.Repository;

import com.example.classrooms.models.CalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CalendarEventRepository extends JpaRepository<CalendarEvent, Long> {
    
    // Find events by classroom ID
    List<CalendarEvent> findByClassroomId(Long classroomId);
    
    // Find events by classroom ID and in a time range
    @Query("SELECT e FROM CalendarEvent e WHERE e.classroomId = :classroomId AND " +
           "((e.startTime BETWEEN :startTime AND :endTime) OR " +
           "(e.endTime BETWEEN :startTime AND :endTime) OR " +
           "(e.startTime <= :startTime AND e.endTime >= :endTime))")
    List<CalendarEvent> findByClassroomIdAndTimeRange(
            @Param("classroomId") Long classroomId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);
    
    // Find events by event type
    List<CalendarEvent> findByEventType(String eventType);
    
    // Find events by creator ID
    List<CalendarEvent> findByCreatorId(Long creatorId);
    
    // Find all events for a list of classroom IDs (for a student's or teacher's view)
    @Query("SELECT e FROM CalendarEvent e WHERE e.classroomId IN :classroomIds")
    List<CalendarEvent> findByClassroomIds(@Param("classroomIds") List<Long> classroomIds);
    
    // Find events by classroom ID and event type
    List<CalendarEvent> findByClassroomIdAndEventType(Long classroomId, String eventType);
} 