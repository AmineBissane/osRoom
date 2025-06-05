package com.example.classrooms.services;

import com.example.classrooms.Repository.ClassRepository;
import com.example.classrooms.models.Activities;
import com.example.classrooms.models.Classroom;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClassService {

    private final ClassRepository classRepository;

    public List<Classroom> getClassroomsByCategory(String classCategory) {
        return classRepository.findByClasscategories(classCategory);
    }

    public List<Classroom> getallClassrooms() {
        return classRepository.findAll();
    }

    public Classroom getClassroomById(Long id) {
        return classRepository.findById(id).orElse(null);
    }

    public Classroom createClassroom(Classroom classroom) {
        return classRepository.save(classroom);
    }

    public Classroom updateClassroom(Long id, Classroom classroom) {
        if (classRepository.existsById(id)) {
            classroom.setId(id);
            return classRepository.save(classroom);
        }
        return null;
    }

    public void deleteClassroom(Long id) {
        classRepository.deleteById(id);
    }

    public List<Classroom> getClassroomsByName(String name) {
        return classRepository.findAll().stream()
                .filter(classroom -> classroom.getName().equalsIgnoreCase(name))
                .toList();
    }

    public List<Classroom> getClassroomsByDescription(String description) {
        return classRepository.findAll().stream()
                .filter(classroom -> classroom.getDescription().equalsIgnoreCase(description))
                .toList();
    }
    
    /**
     * Obtiene todas las aulas donde el usuario es creador, estudiante o profesor
     * @param userId ID del usuario
     * @return Lista de aulas
     */
    public List<Classroom> getClassroomsByUserId(Long userId) {
        if (userId == null) {
            return new ArrayList<>();
        }
        
        // Obtener todas las aulas
        List<Classroom> allClassrooms = classRepository.findAll();
        
        // Filtrar por aquellas donde el usuario es creador, estudiante o profesor
        return allClassrooms.stream()
                .filter(classroom -> 
                    // Es el creador
                    (classroom.getCreatorId() != null && classroom.getCreatorId().equals(userId)) ||
                    // Es estudiante
                    (classroom.getStudentIds() != null && classroom.getStudentIds().contains(userId)) ||
                    // Es profesor
                    (classroom.getTeacherIds() != null && classroom.getTeacherIds().contains(userId))
                )
                .collect(Collectors.toList());
    }
}
