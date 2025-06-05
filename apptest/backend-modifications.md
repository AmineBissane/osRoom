# Modificaciones necesarias en el backend (microservicio activitiesresponses)

## 1. Modificar la entidad ActivityResponse

Añadir los siguientes campos a la entidad `ActivityResponse`:

```java
@Column(name = "grade")
private Double grade;

@Column(name = "graded_at")
private LocalDateTime gradedAt;

@Column(name = "graded_by")
private String gradedBy;
```

## 2. Crear un nuevo endpoint para calificar respuestas

Añadir el siguiente endpoint en el controlador `ActivityResponseController`:

```java
@PostMapping("/{id}/grade")
public ResponseEntity<ActivityResponse> gradeResponse(
        @PathVariable Long id,
        @RequestBody GradeRequest gradeRequest,
        @RequestHeader("Authorization") String authHeader) {
    
    // Extraer el token
    String token = authHeader.replace("Bearer ", "");
    
    // Obtener el nombre del profesor que está calificando
    String teacherName = jwtUtil.extractUsername(token);
    
    // Calificar la respuesta
    ActivityResponse gradedResponse = activityResponseService.gradeResponse(id, gradeRequest.getGrade(), teacherName);
    
    return ResponseEntity.ok(gradedResponse);
}
```

## 3. Crear la clase GradeRequest

```java
public class GradeRequest {
    private Double grade;
    
    // Getters y setters
    public Double getGrade() {
        return grade;
    }
    
    public void setGrade(Double grade) {
        this.grade = grade;
    }
}
```

## 4. Añadir el método en el servicio ActivityResponseService

```java
@Transactional
public ActivityResponse gradeResponse(Long id, Double grade, String teacherName) {
    // Validar la calificación
    if (grade < 0 || grade > 10) {
        throw new IllegalArgumentException("La calificación debe estar entre 0 y 10");
    }
    
    // Buscar la respuesta
    ActivityResponse response = activityResponseRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Respuesta no encontrada con id: " + id));
    
    // Actualizar la calificación
    response.setGrade(grade);
    response.setGradedAt(LocalDateTime.now());
    response.setGradedBy(teacherName);
    
    // Guardar los cambios
    return activityResponseRepository.save(response);
}
```

## 5. Modificar el método findByActivityId para incluir más detalles

Asegurarse de que el método que devuelve las respuestas de una actividad incluya todos los campos necesarios:

```java
@GetMapping("/activity/{activityId}")
public ResponseEntity<List<ActivityResponse>> getResponsesByActivityId(@PathVariable Long activityId) {
    List<ActivityResponse> responses = activityResponseService.findByActivityId(activityId);
    
    // Incluir información detallada de cada respuesta
    responses.forEach(response -> {
        // Asegurarse de que se incluye la fecha exacta de entrega
        if (response.getCreatedAt() != null) {
            // La fecha ya está incluida
        }
        
        // Asegurarse de que se incluye la información de calificación
        // (grade, gradedAt, gradedBy)
    });
    
    return ResponseEntity.ok(responses);
}
```

## 6. Modificar el método findByActivityId en el servicio

```java
public List<ActivityResponse> findByActivityId(Long activityId) {
    return activityResponseRepository.findByActivityId(activityId);
}
```

## 7. Añadir un nuevo endpoint para obtener todas las respuestas de una actividad

```java
@GetMapping("/activity/{activityId}/all")
public ResponseEntity<List<ActivityResponse>> getAllResponsesByActivityId(
        @PathVariable Long activityId,
        @RequestHeader("Authorization") String authHeader) {
    
    // Extraer el token
    String token = authHeader.replace("Bearer ", "");
    
    // Verificar que el usuario es profesor o administrador
    if (!jwtUtil.hasRole(token, "TEACHER") && !jwtUtil.hasRole(token, "ADMIN")) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }
    
    List<ActivityResponse> responses = activityResponseService.findByActivityId(activityId);
    return ResponseEntity.ok(responses);
}
```

## 8. Asegurar que la fecha de creación se guarda correctamente

Verificar que cuando se crea una nueva respuesta, se guarda correctamente la fecha y hora:

```java
@PostMapping
public ResponseEntity<ActivityResponse> createActivityResponse(@RequestBody ActivityResponse activityResponse) {
    // Establecer la fecha y hora actual
    activityResponse.setCreatedAt(LocalDateTime.now());
    
    ActivityResponse savedResponse = activityResponseService.save(activityResponse);
    return ResponseEntity.status(HttpStatus.CREATED).body(savedResponse);
}
```

## 9. Asegurar que la respuesta incluye el archivo adjunto

Verificar que cuando se devuelven las respuestas, se incluye la información del archivo adjunto:

```java
@GetMapping("/{id}")
public ResponseEntity<ActivityResponse> getActivityResponseById(@PathVariable Long id) {
    ActivityResponse response = activityResponseService.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Respuesta no encontrada con id: " + id));
    
    // Asegurarse de que se incluye la información del archivo
    if (response.getFileId() != null) {
        // La información del archivo ya está incluida
    }
    
    return ResponseEntity.ok(response);
}
```

## 10. Base de datos

Asegurarse de que la tabla `activity_response` en la base de datos tiene las columnas necesarias:

```sql
ALTER TABLE activity_response ADD COLUMN grade DOUBLE PRECISION;
ALTER TABLE activity_response ADD COLUMN graded_at TIMESTAMP;
ALTER TABLE activity_response ADD COLUMN graded_by VARCHAR(255);
``` 