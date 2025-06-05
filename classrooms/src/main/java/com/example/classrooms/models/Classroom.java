package com.example.classrooms.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Entity
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Classroom {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String description;
    
    @ElementCollection
    private List<Long> activitiesIds;
    
    @ElementCollection
    private List<String> classcategories;
    
    // ID del usuario que creó esta aula (basado en el campo sub del JWT)
    private Long creatorId;
    
    // Lista de IDs de estudiantes inscritos en esta aula
    @ElementCollection
    private List<Long> studentIds;
    
    // Lista de IDs de profesores asignados a esta aula
    @ElementCollection
    private List<Long> teacherIds;
}
