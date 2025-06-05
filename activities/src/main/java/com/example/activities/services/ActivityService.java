package com.example.activities.services;

import com.example.activities.models.Activity;
import com.example.activities.repository.ActivityRepository;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ActivityService {

    private final ActivityRepository activityRepository;

    /**
     * Get all activities
     * @return List of all activities
     */
    public List<Activity> getAllActivities() {
        return activityRepository.findAll();
    }

    public Activity saveActivity(Activity activity) {
        // Establecer la fecha de creación si no está definida
        if (activity.getCreatedAt() == null) {
            activity.setCreatedAt(LocalDateTime.now());
        }
        return activityRepository.save(activity);
    }
    public Activity getActivityById(Long id) {
        return activityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Activity not found"));
    }

    public List<Activity> getActivitiesByClassroomsIds(List<Long> classroomsIds) {
        return activityRepository.findByClassroomsIdsIn(classroomsIds);

    }

    public void deleteActivity(Long id) {
        // Verificar primero si la actividad existe
        if (!activityRepository.existsById(id)) {
            throw new RuntimeException("Activity not found");
        }
        // Eliminar la actividad
        activityRepository.deleteById(id);
    }

    /**
     * Obtiene todas las actividades creadas por un usuario específico
     * @param creatorId ID del creador
     * @return Lista de actividades
     */
    public List<Activity> getActivitiesByCreatorId(Long creatorId) {
        // Como no hay un método específico en el repositorio, 
        // obtenemos todas y filtramos
        return activityRepository.findAll().stream()
                .filter(activity -> activity.getCreatorId() != null 
                        && activity.getCreatorId().equals(creatorId))
                .collect(Collectors.toList());
    }

}
