package com.example.activitiesresponses.dto;

import com.example.activitiesresponses.entities.ActivitiesResponses;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ActivityResponseDto {
    private Long activityId;
    private Long studentId;
    private String studentName;
    private Double finalNote;
    private String creatorId; // UUID del usuario creador
    private String userId; // Campo alternativo para UUID
    
    public ActivitiesResponses toEntity() {
        ActivitiesResponses response = new ActivitiesResponses();
        response.setActivityId(this.activityId);
        response.setStudentId(this.studentId);
        response.setStudentName(this.studentName);
        response.setFinalNote(this.finalNote);
        response.setCreatorId(this.creatorId);
        response.setUserId(this.userId);
        return response;
    }
} 