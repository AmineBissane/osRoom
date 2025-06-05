package com.example.activities.Controller;

import com.example.activities.services.FileStorageClient;
import com.example.activities.models.Activity;
import com.example.activities.services.ActivityService;
import com.example.activities.utils.JwtUtil;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("/api/v1/activities")
@RequiredArgsConstructor
@Slf4j
public class ActivityController {

    private final ActivityService activityService;
    private final FileStorageClient fileStorageClient;
    private final JwtUtil jwtUtil;

    /**
     * Get all activities
     * @return List of all activities
     */
    @GetMapping
    public ResponseEntity<List<Activity>> getAllActivities() {
        log.info("Fetching all activities");
        return ResponseEntity.ok(activityService.getAllActivities());
    }

    @GetMapping("{id}")
    public ResponseEntity<Activity> getActivity(@PathVariable Long id) {
        Activity activity = activityService.getActivityById(id);
        return ResponseEntity.ok(activity);
    }

    @DeleteMapping("{id}")
    public ResponseEntity<Void> deleteActivity(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        // Verificar permisos de eliminación si hay un token
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.replace("Bearer ", "");
            
            // Obtener la actividad
            Activity activity = activityService.getActivityById(id);
            if (activity == null) {
                return ResponseEntity.notFound().build();
            }
            
            // Si la actividad tiene creador, verificar que sea el mismo o un admin
            if (activity.getCreatorId() != null) {
                String userId = jwtUtil.extractUserId(token);
                if (userId != null) {
                    try {
                        Long userIdLong = Long.parseLong(userId);
                        
                        // Verificar si es admin o el creador
                        boolean isAdmin = jwtUtil.hasRole(token, "ADMIN") || jwtUtil.hasRole(token, "TEACHER");
                        boolean isCreator = userIdLong.equals(activity.getCreatorId());
                        
                        if (!isAdmin && !isCreator) {
                            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
                        }
                    } catch (NumberFormatException e) {
                        // Si no se puede convertir, verificar solo rol admin
                        if (!jwtUtil.hasRole(token, "ADMIN") && !jwtUtil.hasRole(token, "TEACHER")) {
                            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
                        }
                    }
                } else {
                    // No se pudo extraer ID, verificar solo rol admin
                    if (!jwtUtil.hasRole(token, "ADMIN") && !jwtUtil.hasRole(token, "TEACHER")) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
                    }
                }
            }
        }
        
        activityService.deleteActivity(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Activity> createActivity(
            @RequestParam("name") String name,
            @RequestParam("description") String description,
            @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") Date endDate,
            @RequestParam("classroomsIds") List<Long> classroomsIds,
            @RequestPart("file") MultipartFile file,
            @RequestHeader(value = "Authorization", required = false) String authHeader) throws IOException {

        Activity activity = new Activity();
        activity.setName(name);
        activity.setDescription(description);
        activity.setEndDate(endDate);
        activity.setClassroomsIds(classroomsIds);
        
        // Establecer el creador si hay un token
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.replace("Bearer ", "");
            String userId = jwtUtil.extractUserId(token);
            
            if (userId != null) {
                try {
                    Long userIdLong = Long.parseLong(userId);
                    activity.setCreatorId(userIdLong);
                    log.info("Estableciendo creatorId para la actividad: {}", userIdLong);
                } catch (NumberFormatException e) {
                    log.warn("No se pudo convertir el ID del token a Long: {}", userId);
                }
            }
        }

        String fileId = fileStorageClient.uploadFile(file);
        activity.setFileId(fileId);
        Activity saved = activityService.saveActivity(activity);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/classrooms/{classroomId}")
    public ResponseEntity<List<Activity>> getActivitiesByClassroomId(@PathVariable Long classroomId) {
        List<Activity> activities = activityService.getActivitiesByClassroomsIds(List.of(classroomId));
        return ResponseEntity.ok(activities);
    }
    
    /**
     * Obtiene las actividades creadas por el usuario actual
     */
    @GetMapping("/my-activities")
    public ResponseEntity<List<Activity>> getMyActivities(
            @RequestHeader("Authorization") String authHeader) {
        
        String token = authHeader.replace("Bearer ", "");
        String userId = jwtUtil.extractUserId(token);
        
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        try {
            Long userIdLong = Long.parseLong(userId);
            List<Activity> activities = activityService.getActivitiesByCreatorId(userIdLong);
            return ResponseEntity.ok(activities);
        } catch (NumberFormatException e) {
            log.error("Error al convertir el ID del usuario: {}", userId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
