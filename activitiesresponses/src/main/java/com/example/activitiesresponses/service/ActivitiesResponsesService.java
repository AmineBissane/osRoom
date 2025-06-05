package com.example.activitiesresponses.service;

import com.example.activitiesresponses.Repository.ActivitiesResponsesRepository;
import com.example.activitiesresponses.client.FileStorageClient;
import com.example.activitiesresponses.dto.ActivityResponseDto;
import com.example.activitiesresponses.entities.ActivitiesResponses;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ActivitiesResponsesService {

    private final ActivitiesResponsesRepository activitiesResponsesRepository;
    private final FileStorageClient fileStorageClient;

    /**
     * Checks if a student has already submitted a response for a specific activity
     * @param activityId Activity ID
     * @param studentId Student ID (can be null if using UUID)
     * @param creatorId Creator ID (UUID, can be null if using numeric ID)
     * @param userId User ID (alternative UUID field, can be null)
     * @return true if a response already exists, false otherwise
     */
    public boolean hasExistingResponse(Long activityId, Long studentId, String creatorId, String userId) {
        log.info("Checking for existing response: activityId={}, studentId={}, creatorId={}, userId={}", 
                 activityId, studentId, creatorId, userId);
        
        // First check by numeric student ID if available
        if (studentId != null) {
            List<ActivitiesResponses> responses = activitiesResponsesRepository.findByActivityIdAndStudentId(activityId, studentId);
            if (!responses.isEmpty()) {
                log.info("Found existing response by studentId: {}", studentId);
                return true;
            }
        }
        
        // If no match by student ID or no student ID provided, check by UUID identifiers
        if (creatorId != null || userId != null) {
            List<ActivitiesResponses> allResponses = activitiesResponsesRepository.findByActivityId(activityId);
            
            for (ActivitiesResponses response : allResponses) {
                // Check if the creatorId matches
                if (creatorId != null && creatorId.equals(response.getCreatorId())) {
                    log.info("Found existing response by creatorId: {}", creatorId);
                    return true;
                }
                
                // Check if the userId matches
                if (userId != null && userId.equals(response.getUserId())) {
                    log.info("Found existing response by userId: {}", userId);
                    return true;
                }
            }
        }
        
        log.info("No existing response found");
        return false;
    }

    public void saveActivityResponse(ActivitiesResponses activitiesResponses) {
        // Validate that required fields are present
        if ((activitiesResponses.getStudentId() == null && activitiesResponses.getCreatorId() == null) || 
            activitiesResponses.getStudentName() == null || 
            activitiesResponses.getStudentName().isEmpty()) {
            throw new IllegalArgumentException("Student ID/Creator ID and name are required");
        }
        
        // Check if a response already exists
        if (hasExistingResponse(
                activitiesResponses.getActivityId(),
                activitiesResponses.getStudentId(),
                activitiesResponses.getCreatorId(),
                activitiesResponses.getUserId())) {
            throw new IllegalStateException("Student has already submitted a response for this activity");
        }
        
        // Ensure finalNote is between 0 and 10
        if (activitiesResponses.getFinalNote() != null) {
            if (activitiesResponses.getFinalNote() < 0 || activitiesResponses.getFinalNote() > 10) {
                throw new IllegalArgumentException("Final note must be between 0 and 10");
            }
        }
        
        // Set createdAt if it's null
        if (activitiesResponses.getCreatedAt() == null) {
            activitiesResponses.setCreatedAt(LocalDateTime.now());
        }
        
        activitiesResponsesRepository.save(activitiesResponses);
    }

    public ActivitiesResponses saveActivityResponseWithFile(ActivitiesResponses activitiesResponses, MultipartFile file) {
        // Check if a response already exists
        if (hasExistingResponse(
                activitiesResponses.getActivityId(),
                activitiesResponses.getStudentId(),
                activitiesResponses.getCreatorId(),
                activitiesResponses.getUserId())) {
            throw new IllegalStateException("Student has already submitted a response for this activity");
        }
        
        // Upload file to file-storage service
        ResponseEntity<String> response = fileStorageClient.uploadFile(file);
        String fileId = response.getBody();
        
        // Set the response file ID
        activitiesResponses.setResponseFileId(fileId);
        
        // Set creation date
        activitiesResponses.setCreatedAt(LocalDateTime.now());
        
        // Save the activity response
        saveActivityResponse(activitiesResponses);
        
        return activitiesResponses;
    }
    
    /**
     * Nuevo método que acepta un DTO para manejar identificadores UUID
     */
    public ActivitiesResponses saveWithFile(ActivityResponseDto dto, MultipartFile file) {
        // Convertir DTO a entidad
        ActivitiesResponses activitiesResponses = dto.toEntity();
        
        // Check if a response already exists
        if (hasExistingResponse(
                dto.getActivityId(),
                dto.getStudentId(),
                dto.getCreatorId(),
                dto.getUserId())) {
            throw new IllegalStateException("Student has already submitted a response for this activity");
        }
        
        // Upload file to file-storage service
        ResponseEntity<String> response = fileStorageClient.uploadFile(file);
        String fileId = response.getBody();
        
        // Set the response file ID
        activitiesResponses.setResponseFileId(fileId);
        
        // Set creation date
        activitiesResponses.setCreatedAt(LocalDateTime.now());
        
        try {
            // Save the activity response but skip the duplicate check since we just did it
            activitiesResponsesRepository.save(activitiesResponses);
            return activitiesResponses;
        } catch (Exception e) {
            log.error("Error saving activity response", e);
            throw e;
        }
    }

    public ResponseEntity<byte[]> getResponseFile(Long id) {
        // Get the activity response
        ActivitiesResponses response = getActivityResponseById(id);
        if (response == null || response.getResponseFileId() == null) {
            return ResponseEntity.notFound().build();
        }
        
        // Get the file from file-storage service
        return fileStorageClient.downloadFile(response.getResponseFileId());
    }

    public List<ActivitiesResponses> getActivitiesByActivityId(Long activityId) {
        return activitiesResponsesRepository.findByActivityId(activityId);
    }
    
    /**
     * Get all activity responses for a specific student
     * @param studentId The ID of the student
     * @return List of activity responses
     */
    public List<ActivitiesResponses> getActivitiesByStudentId(Long studentId) {
        return activitiesResponsesRepository.findByStudentId(studentId);
    }
    
    /**
     * Get all activity responses for a specific student in a specific activity
     * @param activityId The ID of the activity
     * @param studentId The ID of the student
     * @return List of activity responses
     */
    public List<ActivitiesResponses> getActivitiesByActivityIdAndStudentId(Long activityId, Long studentId) {
        return activitiesResponsesRepository.findByActivityIdAndStudentId(activityId, studentId);
    }

    public ActivitiesResponses getActivityResponseById(Long id) {
        return activitiesResponsesRepository.findById(id).orElse(null);
    }

    public void deleteActivityResponse(Long id) {
        ActivitiesResponses response = getActivityResponseById(id);
        if (response != null && response.getResponseFileId() != null) {
            // Delete the file from file-storage service
            fileStorageClient.deleteFile(response.getResponseFileId());
        }
        
        activitiesResponsesRepository.deleteById(id);
    }
    
    /**
     * Obtiene todas las respuestas calificadas por un usuario específico (usando UUID)
     * @param graderUuid UUID del calificador
     * @return Lista de respuestas calificadas por el usuario
     */
    public List<ActivitiesResponses> getResponsesGradedByUserUuid(String graderUuid) {
        log.info("Buscando respuestas calificadas por el usuario UUID: {}", graderUuid);
        
        if (graderUuid == null || graderUuid.isEmpty()) {
            return new ArrayList<>();
        }
        
        // Usar el método del repositorio para una consulta más eficiente
        return activitiesResponsesRepository.findByGradedByUuid(graderUuid);
    }

    /**
     * Califica una respuesta de actividad
     * @param id ID de la respuesta
     * @param grade Calificación (0-10)
     * @param teacherName Nombre del profesor que califica
     * @param teacherUuid UUID del profesor que califica (opcional)
     * @return La respuesta actualizada
     */
    public ActivitiesResponses gradeResponse(Long id, Double grade, String teacherName, String teacherUuid) {
        // Validar la calificación
        if (grade < 0 || grade > 10) {
            throw new IllegalArgumentException("La calificación debe estar entre 0 y 10");
        }
        
        // Buscar la respuesta
        ActivitiesResponses response = activitiesResponsesRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Respuesta no encontrada con id: " + id));
        
        // Actualizar la calificación
        response.setGrade(grade);
        response.setGradedAt(LocalDateTime.now());
        response.setGradedBy(teacherName);
        response.setGradedByUuid(teacherUuid);  // Guardar el UUID del calificador
        
        // Guardar los cambios
        return activitiesResponsesRepository.save(response);
    }
    
    /**
     * Versión simplificada para mantener compatibilidad con código existente
     */
    public ActivitiesResponses gradeResponse(Long id, Double grade, String teacherName) {
        return gradeResponse(id, grade, teacherName, null);
    }
}
