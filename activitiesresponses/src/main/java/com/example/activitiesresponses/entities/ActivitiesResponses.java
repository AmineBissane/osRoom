package com.example.activitiesresponses.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Column;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@AllArgsConstructor
@RequiredArgsConstructor
public class ActivitiesResponses {
    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.IDENTITY)
    private Long id;
    private Long activityId;
    private String FileId;
    private Long studentId;
    private String studentName;
    private Double finalNote;
    private String responseFileId; // ID of the file in the file-storage service
    
    // Campos para soporte de UUID en lugar de Long ID
    @Column(name = "creator_id")
    private String creatorId; // UUID del usuario creador (cuando studentId no es aplicable)
    
    @Column(name = "user_id")
    private String userId; // Campo alternativo para UUID
    
    // Campos para la calificación
    @Column(name = "grade")
    private Double grade;
    
    @Column(name = "graded_at")
    private LocalDateTime gradedAt;
    
    @Column(name = "graded_by")
    private String gradedBy;
    
    @Column(name = "graded_by_uuid")
    private String gradedByUuid;
    
    // Fecha de creación/entrega
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}