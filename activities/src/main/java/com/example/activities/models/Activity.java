package com.example.activities.models;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

@Entity
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Activity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String description;
    private Date endDate;
    @ElementCollection
    private List<Long> classroomsIds;
    private String fileId;
    
    // ID del usuario que creó esta actividad (basado en el campo sub del JWT)
    private Long creatorId;
    
    // Fecha de creación
    private LocalDateTime createdAt = LocalDateTime.now();
}
