package com.example.activitiesresponses.controller;

import com.example.activitiesresponses.dto.ActivityResponseDto;
import com.example.activitiesresponses.dto.GradeRequest;
import com.example.activitiesresponses.entities.ActivitiesResponses;
import com.example.activitiesresponses.service.ActivitiesResponsesService;
import com.example.activitiesresponses.util.JwtUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/v1/activitiesresponses")
@RequiredArgsConstructor
@Slf4j
public class MainController {

    private final ActivitiesResponsesService activitiesResponsesService;
    private final ObjectMapper objectMapper;
    private final JwtUtil jwtUtil;

    @GetMapping("/activity/{id}")
    public ResponseEntity<List<ActivitiesResponses>> getByActivityId(@PathVariable Long id) {
        return ResponseEntity.ok(activitiesResponsesService.getActivitiesByActivityId(id));
    }
    
    /**
     * Obtiene todas las respuestas de una actividad (para profesores)
     */
    @GetMapping("/activity/{id}/all")
    public ResponseEntity<List<ActivitiesResponses>> getAllByActivityId(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {
        
        // Extraer el token
        String token = authHeader.replace("Bearer ", "");
        
        // Verificar que el usuario es profesor o administrador
        if (!jwtUtil.hasRole(token, "TEACHER") && !jwtUtil.hasRole(token, "ADMIN")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        return ResponseEntity.ok(activitiesResponsesService.getActivitiesByActivityId(id));
    }
    
    /**
     * Obtiene todas las respuestas para un estudiante específico
     * Si no se proporciona studentId, se usa el ID del token JWT
     */
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<ActivitiesResponses>> getByStudentId(
            @PathVariable Long studentId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        // Si no se proporciona ID de estudiante explícitamente y hay un token, usar el ID del token
        if (studentId == null && authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.replace("Bearer ", "");
            String userId = jwtUtil.extractUserId(token);
            
            if (userId != null) {
                try {
                    studentId = Long.parseLong(userId);
                    log.info("Usando ID del token JWT: {}", studentId);
                } catch (NumberFormatException e) {
                    log.warn("No se pudo convertir el ID del token '{}' a Long", userId);
                }
            }
        }
        
        if (studentId == null) {
            return ResponseEntity.badRequest().build();
        }
        
        log.info("Buscando respuestas para el estudiante ID: {}", studentId);
        List<ActivitiesResponses> responses = activitiesResponsesService.getActivitiesByStudentId(studentId);
        log.info("Se encontraron {} respuestas", responses.size());
        return ResponseEntity.ok(responses);
    }
    
    /**
     * Nuevo endpoint para obtener respuestas por usuario usando String ID (UUID)
     */
    @GetMapping("/activity/{activityId}/user/{userId}")
    public ResponseEntity<List<ActivitiesResponses>> getByActivityIdAndUserId(
            @PathVariable Long activityId,
            @PathVariable String userId) {
        
        log.info("Buscando respuestas para actividad ID: {} y usuario UUID: {}", activityId, userId);
        
        // Intentar obtener por ID numérico si es posible
        try {
            Long numericId = Long.parseLong(userId);
            List<ActivitiesResponses> responses = activitiesResponsesService.getActivitiesByActivityIdAndStudentId(activityId, numericId);
            log.info("Se encontraron {} respuestas usando ID numérico", responses.size());
            return ResponseEntity.ok(responses);
        } catch (NumberFormatException e) {
            // Si no es un número, buscar por creatorId o userId en lugar de studentId
            log.info("ID de usuario no es numérico, buscando por creatorId o userId");
            
            // Primero obtenemos todas las respuestas para la actividad
            List<ActivitiesResponses> allResponses = activitiesResponsesService.getActivitiesByActivityId(activityId);
            
            // Filtramos manualmente por el UUID en los campos alternativos
            List<ActivitiesResponses> filteredResponses = new ArrayList<>();
            for (ActivitiesResponses response : allResponses) {
                // Comprobamos si el userId coincide con algún campo relacionado con el usuario
                if (userId.equals(response.getCreatorId()) || 
                    userId.equals(response.getUserId()) || 
                    (response.getStudentId() != null && userId.equals(response.getStudentId().toString()))) {
                    filteredResponses.add(response);
                }
            }
            
            log.info("Se encontraron {} respuestas usando UUID", filteredResponses.size());
            return ResponseEntity.ok(filteredResponses);
        }
    }
    
    /**
     * Endpoint alternativo para obtener las respuestas del estudiante actual usando el token
     */
    @GetMapping("/my-responses")
    public ResponseEntity<List<ActivitiesResponses>> getMyResponses(
            @RequestParam(value = "activityId", required = false) Long activityId,
            @RequestHeader("Authorization") String authHeader) {
        
        String token = authHeader.replace("Bearer ", "");
        String userId = jwtUtil.extractUserId(token);
        
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        log.info("Buscando respuestas para el usuario actual, ID: {}", userId);
        
        // Si se proporcionó un activityId, filtrar por esa actividad
        if (activityId != null) {
            return getByActivityIdAndUserId(activityId, userId);
        }
        
        // Intentar como ID numérico primero
        try {
            Long studentId = Long.parseLong(userId);
            List<ActivitiesResponses> responses = activitiesResponsesService.getActivitiesByStudentId(studentId);
            log.info("Se encontraron {} respuestas usando ID numérico", responses.size());
            return ResponseEntity.ok(responses);
        } catch (NumberFormatException e) {
            log.info("ID de usuario no es numérico: {}", userId);
            
            // Para UUID, tendríamos que implementar una búsqueda personalizada
            // Como workaround, devolvemos una lista vacía para evitar errores
            log.info("Devolviendo lista vacía para UUID");
            return ResponseEntity.ok(new ArrayList<>());
        }
    }
    
    /**
     * Obtiene la respuesta de un estudiante para una actividad específica
     * Si no se proporciona studentId, se usa el ID del token JWT
     */
    @GetMapping("/activity/{activityId}/student/{studentId}")
    public ResponseEntity<List<ActivitiesResponses>> getByActivityIdAndStudentId(
            @PathVariable Long activityId,
            @PathVariable(required = false) Long studentId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        // Si no se proporciona ID de estudiante y hay un token, usar el ID del token
        if (studentId == null && authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.replace("Bearer ", "");
            String userId = jwtUtil.extractUserId(token);
            
            if (userId != null) {
                try {
                    studentId = Long.parseLong(userId);
                    log.info("Usando ID del token JWT: {}", studentId);
                } catch (NumberFormatException e) {
                    log.warn("No se pudo convertir el ID del token '{}' a Long", userId);
                }
            }
        }
        
        if (studentId == null) {
            return ResponseEntity.badRequest().build();
        }
        
        log.info("Buscando respuestas para la actividad ID: {} y estudiante ID: {}", activityId, studentId);
        List<ActivitiesResponses> responses = activitiesResponsesService.getActivitiesByActivityIdAndStudentId(activityId, studentId);
        log.info("Se encontraron {} respuestas", responses.size());
        return ResponseEntity.ok(responses);
    }
    
    /**
     * Endpoint alternativo para obtener la respuesta del estudiante actual para una actividad específica
     */
    @GetMapping("/activity/{activityId}/my-response")
    public ResponseEntity<List<ActivitiesResponses>> getMyResponseForActivity(
            @PathVariable Long activityId,
            @RequestHeader("Authorization") String authHeader) {
        
        String token = authHeader.replace("Bearer ", "");
        String userId = jwtUtil.extractUserId(token);
        
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        log.info("Obteniendo respuestas para actividad {} y usuario {}", activityId, userId);
        
        // Intentar el nuevo endpoint que maneja UUIDs
        return getByActivityIdAndUserId(activityId, userId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ActivitiesResponses> getActivitiesResponses(@PathVariable Long id) {
        return ResponseEntity.ok(activitiesResponsesService.getActivityResponseById(id));
    }

    @PostMapping()
    public ResponseEntity<ActivitiesResponses> saveActivitiesResponses(
            @RequestBody ActivitiesResponses activitiesResponses,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        // Si no se proporciona ID de estudiante y hay un token, usar el ID del token
        if (activitiesResponses.getStudentId() == null && authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.replace("Bearer ", "");
            String userId = jwtUtil.extractUserId(token);
            String userName = jwtUtil.extractUsername(token);
            
            if (userId != null) {
                try {
                    activitiesResponses.setStudentId(Long.parseLong(userId));
                    log.info("Usando ID del token JWT para studentId: {}", userId);
                } catch (NumberFormatException e) {
                    log.warn("No se pudo convertir el ID del token '{}' a Long", userId);
                    // Si no se puede convertir a Long, guardarlo como creatorId
                    activitiesResponses.setCreatorId(userId);
                    log.info("Guardando UUID como creatorId: {}", userId);
                }
                
                // También establecer el nombre del estudiante si no está definido
                if (activitiesResponses.getStudentName() == null || activitiesResponses.getStudentName().isEmpty()) {
                    activitiesResponses.setStudentName(userName);
                    log.info("Usando nombre del token JWT para studentName: {}", userName);
                }
            }
        }
        
        try {
            activitiesResponsesService.saveActivityResponse(activitiesResponses);
            return ResponseEntity.ok(activitiesResponses);
        } catch (IllegalStateException e) {
            // Si el usuario ya ha enviado una respuesta para esta actividad
            if (e.getMessage().contains("already submitted")) {
                log.warn("Intento de envío duplicado: {}", e.getMessage());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .header("X-Error-Type", "duplicate_submission")
                    .build();
            }
            // Otros errores de estado ilegal
            log.error("Error de estado ilegal al guardar respuesta: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            // Otros errores generales
            log.error("Error al guardar respuesta: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping(value = "/with-file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ActivitiesResponses> saveActivitiesResponsesWithFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("activityId") Long activityId,
            @RequestParam(value = "studentId", required = false) String studentIdParam,
            @RequestParam(value = "studentName", required = false) String studentName,
            @RequestParam(value = "finalNote", required = false) Double finalNote,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        Long studentId = null;
        String creatorId = null;
        
        // Procesar studentIdParam que ahora puede ser numérico o UUID
        if (studentIdParam != null) {
            try {
                studentId = Long.parseLong(studentIdParam);
                log.info("Usando ID numérico proporcionado: {}", studentId);
            } catch (NumberFormatException e) {
                // Si no es numérico, tratarlo como UUID
                creatorId = studentIdParam;
                log.info("Usando UUID proporcionado como creatorId: {}", creatorId);
            }
        }
        
        // Si no se proporciona ID y hay token, usar el token
        if (studentId == null && creatorId == null && authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.replace("Bearer ", "");
            String userId = jwtUtil.extractUserId(token);
            
            if (userId != null) {
                try {
                    studentId = Long.parseLong(userId);
                    log.info("Usando ID numérico del token: {}", studentId);
                } catch (NumberFormatException e) {
                    creatorId = userId;
                    log.info("Usando UUID del token como creatorId: {}", creatorId);
                }
            }
        }
        
        // Si no se proporciona nombre de estudiante y hay un token, usar el nombre del token
        if ((studentName == null || studentName.isEmpty()) && authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.replace("Bearer ", "");
            studentName = jwtUtil.extractUsername(token);
            log.info("Usando nombre del token JWT para studentName: {}", studentName);
        }
        
        // Verificar que tenemos al menos algún tipo de ID y un nombre
        if ((studentId == null && creatorId == null) || studentName == null || studentName.isEmpty()) {
            return ResponseEntity.badRequest().body(null);
        }
        
        ActivityResponseDto dto = new ActivityResponseDto();
        dto.setActivityId(activityId);
        dto.setStudentId(studentId);
        dto.setStudentName(studentName);
        
        // Añadir el creatorId si es un UUID
        if (creatorId != null) {
            dto.setCreatorId(creatorId);
        }
        
        if (finalNote != null) {
            dto.setFinalNote(finalNote);
        }
        
        try {
            // Intentar guardar la respuesta
            ActivitiesResponses response = activitiesResponsesService.saveWithFile(dto, file);
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            // Si el usuario ya ha enviado una respuesta para esta actividad
            if (e.getMessage().contains("already submitted")) {
                log.warn("Intento de envío duplicado: {}", e.getMessage());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .header("X-Error-Type", "duplicate_submission")
                    .build();
            }
            // Otros errores de estado ilegal
            log.error("Error de estado ilegal al guardar respuesta: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            // Otros errores generales
            log.error("Error al guardar respuesta: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Califica una respuesta de actividad
     */
    @PostMapping("/{id}/grade")
    public ResponseEntity<ActivitiesResponses> gradeResponse(
            @PathVariable Long id,
            @RequestBody GradeRequest gradeRequest,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        try {
            log.info("Recibida solicitud para calificar respuesta ID: {}", id);
            log.info("Calificación solicitada: {}", gradeRequest.getGrade());

            // Validar calificación
            if (gradeRequest.getGrade() == null) {
                log.error("La calificación no puede ser nula");
                return ResponseEntity.badRequest().build();
            }
 
            // Obtener nombre del calificador desde el token si está disponible
            String teacherName = "Anonymous Grader";
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.replace("Bearer ", "");
                String nameFromToken = jwtUtil.extractUsername(token);
                if (nameFromToken != null && !nameFromToken.equals("Unknown User")) {
                    teacherName = nameFromToken;
                    log.info("Usando nombre del token JWT para el calificador: {}", teacherName);
                }
            }
            
            // Calificar la respuesta
            ActivitiesResponses gradedResponse = activitiesResponsesService.gradeResponse(
                id, 
                gradeRequest.getGrade(), 
                teacherName
            );
            
            log.info("Respuesta calificada correctamente con valor: {}", gradeRequest.getGrade());
            return ResponseEntity.ok(gradedResponse);
        } catch (IllegalArgumentException e) {
            log.error("Error de argumento inválido: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (NoSuchElementException e) {
            log.error("Respuesta no encontrada: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error interno al calificar: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/file/{id}")
    public ResponseEntity<byte[]> getResponseFile(@PathVariable Long id) {
        return activitiesResponsesService.getResponseFile(id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteActivitiesResponses(@PathVariable Long id) {
        activitiesResponsesService.deleteActivityResponse(id);
        return ResponseEntity.ok().build();
    }

    /**
     * Obtiene las respuestas calificadas por un usuario específico usando UUID
     */
    @GetMapping("/graded-by-user/{userId}")
    public ResponseEntity<List<ActivitiesResponses>> getResponsesGradedByUser(
            @PathVariable String userId) {
        
        log.info("Obteniendo respuestas calificadas por el usuario UUID: {}", userId);
        
        try {
            List<ActivitiesResponses> responses = activitiesResponsesService.getResponsesGradedByUserUuid(userId);
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            log.error("Error al obtener respuestas calificadas por el usuario {}: {}", userId, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Califica una respuesta de actividad (versión mejorada con validación y respuesta HTTP adecuada)
     */
    @PostMapping("/grade/{responseId}")
    public ResponseEntity<?> gradeActivityResponse(
            @PathVariable Long responseId,
            @RequestBody GradeRequest gradeRequest,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        log.info("Recibida solicitud para calificar respuesta ID: {}", responseId);
        
        // Validar la solicitud
        if (gradeRequest == null || gradeRequest.getGrade() == null) {
            log.error("Solicitud de calificación inválida - grado nulo");
            return ResponseEntity
                .badRequest()
                .body(new ErrorResponse("La calificación no puede ser nula"));
        }
        
        if (gradeRequest.getGrade() < 0 || gradeRequest.getGrade() > 10) {
            log.error("Calificación fuera de rango: {}", gradeRequest.getGrade());
            return ResponseEntity
                .badRequest()
                .body(new ErrorResponse("La calificación debe estar entre 0 y 10"));
        }
        
        try {
            // Verificar que la respuesta existe
            ActivitiesResponses existingResponse = activitiesResponsesService.getActivityResponseById(responseId);
            if (existingResponse == null) {
                log.error("No se encontró la respuesta con ID: {}", responseId);
                return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse("No se encontró la respuesta con ID: " + responseId));
            }
            
            // Obtener información del calificador desde el token
            String graderName = "Anonymous Grader";
            String graderUuid = null;
            
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.replace("Bearer ", "");
                graderName = jwtUtil.extractUsername(token);
                graderUuid = jwtUtil.extractUserId(token);
                log.info("Calificación realizada por: {} ({})", graderName, graderUuid);
            }
            
            // Establecer la calificación
            ActivitiesResponses gradedResponse = activitiesResponsesService.gradeResponse(
                responseId, 
                gradeRequest.getGrade(),
                graderName,
                graderUuid
            );
            
            log.info("Respuesta {} calificada exitosamente con valor: {}", responseId, gradeRequest.getGrade());
            return ResponseEntity.ok(gradedResponse);
            
        } catch (NoSuchElementException e) {
            log.error("No se encontró la respuesta: {}", e.getMessage());
            return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse(e.getMessage()));
                
        } catch (Exception e) {
            log.error("Error al calificar la respuesta: {}", e.getMessage(), e);
            return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Error interno al calificar: " + e.getMessage()));
        }
    }

    // Clase para respuestas de error
    private static class ErrorResponse {
        private final String message;
        
        public ErrorResponse(String message) {
            this.message = message;
        }
        
        public String getMessage() {
            return message;
        }
    }
}
