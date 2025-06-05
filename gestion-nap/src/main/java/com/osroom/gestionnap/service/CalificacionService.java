package com.osroom.gestionnap.service;

import com.osroom.gestionnap.client.ClassroomClient;
import com.osroom.gestionnap.client.KeycloakClient;
import com.osroom.gestionnap.model.Calificacion;
import com.osroom.gestionnap.repository.CalificacionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CalificacionService {

    private final CalificacionRepository calificacionRepository;
    private final KeycloakClient keycloakClient;
    private final ClassroomClient classroomClient;
    private final NotificacionService notificacionService;
    private final PdfGeneratorService pdfGeneratorService;

    public List<Calificacion> getAllCalificaciones() {
        return calificacionRepository.findAll();
    }

    public Calificacion getCalificacionById(Long id) {
        return calificacionRepository.findById(id).orElse(null);
    }

    public Calificacion createCalificacion(Calificacion calificacion) {
        // Establecer la fecha actual si no está establecida
        if (calificacion.getFecha() == null) {
            calificacion.setFecha(LocalDate.now());
        }
        
        Calificacion saved = calificacionRepository.save(calificacion);
        
        try {
            // Determine which ID to use for notification (prefer estudianteId but fall back to userId)
            String notificationRecipientId = 
                (calificacion.getEstudianteId() != null && !calificacion.getEstudianteId().trim().isEmpty()) 
                ? calificacion.getEstudianteId() 
                : calificacion.getUserId();
            
            // Only send notification if we have a recipient ID
            if (notificationRecipientId != null && !notificationRecipientId.trim().isEmpty()) {
                // Determine which class name to use (prefer claseNombre but fall back to classroomName)
                String classNameForNotification = 
                    (calificacion.getClaseNombre() != null && !calificacion.getClaseNombre().trim().isEmpty())
                    ? calificacion.getClaseNombre()
                    : calificacion.getClassroomName();
                
                // Enviar notificación al estudiante
                notificacionService.crearNotificacionSistema(
                    notificationRecipientId,
                    "Nueva calificación registrada",
                    "Se ha registrado una calificación de " + calificacion.getValor() + 
                    " en la clase " + classNameForNotification + 
                    (calificacion.getActividadNombre() != null ? " para la actividad " + calificacion.getActividadNombre() : ""),
                    "CALIFICACION"
                );
            }
        } catch (Exception e) {
            // Log error but don't fail the grade creation
            System.err.println("Error sending notification: " + e.getMessage());
        }
        
        return saved;
    }

    public Calificacion updateCalificacion(Long id, Calificacion calificacion) {
        if (calificacionRepository.existsById(id)) {
            calificacion.setId(id);
            return calificacionRepository.save(calificacion);
        }
        return null;
    }

    public void deleteCalificacion(Long id) {
        calificacionRepository.deleteById(id);
    }

    public List<Calificacion> getCalificacionesByEstudiante(String estudianteId) {
        // Try both fields for compatibility
        List<Calificacion> calificaciones = calificacionRepository.findByEstudianteId(estudianteId);
        
        // If no results with estudianteId, try with userId
        if (calificaciones == null || calificaciones.isEmpty()) {
            try {
                List<Calificacion> calificacionesPorUserId = calificacionRepository.findByUserId(estudianteId);
                if (calificacionesPorUserId != null && !calificacionesPorUserId.isEmpty()) {
                    System.out.println("Se encontraron " + calificacionesPorUserId.size() + 
                                      " calificaciones usando userId en lugar de estudianteId");
                    return calificacionesPorUserId;
                }
            } catch (Exception e) {
                System.err.println("Error al buscar calificaciones por userId: " + e.getMessage());
            }
        }
        
        return calificaciones;
    }

    public List<Calificacion> getCalificacionesByClase(Long claseId) {
        return calificacionRepository.findByClaseId(claseId);
    }

    public List<Calificacion> getCalificacionesByEstudianteAndClase(String estudianteId, Long claseId) {
        return calificacionRepository.findByEstudianteIdAndClaseId(estudianteId, claseId);
    }

    public List<Calificacion> getCalificacionesByEstudianteAndClaseAndPeriodo(
            String estudianteId, Long claseId, String periodo) {
        return calificacionRepository.findByEstudianteIdAndClaseIdAndPeriodo(estudianteId, claseId, periodo);
    }

    public List<Calificacion> getCalificacionesByTipo(String tipo) {
        return calificacionRepository.findByTipo(tipo);
    }

    public List<Calificacion> getCalificacionesByActividad(Long actividadId) {
        return calificacionRepository.findByActividadId(actividadId);
    }

    public Double calcularPromedioByEstudianteAndClase(String estudianteId, Long claseId) {
        return calificacionRepository.calcularPromedioByEstudianteAndClase(estudianteId, claseId);
    }

    public Double calcularPromedioByEstudianteAndClaseAndPeriodo(
            String estudianteId, Long claseId, String periodo) {
        return calificacionRepository.calcularPromedioByEstudianteAndClaseAndPeriodo(estudianteId, claseId, periodo);
    }

    // Generar PDF de calificaciones
    public byte[] generarPdfCalificaciones(String estudianteId, Long claseId, String periodo, String authHeader) {
        try {
            System.out.println("Service: Generando PDF para estudiante: " + estudianteId + 
                               ", clase: " + claseId + ", periodo: " + periodo);
            
            // Validar estudianteId
            if (estudianteId == null || estudianteId.trim().isEmpty()) {
                throw new IllegalArgumentException("El ID del estudiante es requerido");
            }
            
            // Get all grades for the student if claseId is not specified
            List<Calificacion> calificaciones;
            if (claseId != null) {
                // Try using the combined query method first
                try {
                    calificaciones = calificacionRepository.findByUserAndClassroomCombined(estudianteId, claseId);
                    System.out.println("Query combinada: encontradas " + calificaciones.size() + " calificaciones");
                } catch (Exception e) {
                    System.err.println("Error en query combinada: " + e.getMessage());
                    // Fallback to the regular method
                    if (periodo != null && !periodo.trim().isEmpty()) {
                        calificaciones = getCalificacionesByEstudianteAndClaseAndPeriodo(estudianteId, claseId, periodo);
                    } else {
                        calificaciones = getCalificacionesByEstudianteAndClase(estudianteId, claseId);
                    }
                }
            } else {
                // Try to find grades using all possible field combinations
                try {
                    // First try the most comprehensive search
                    calificaciones = calificacionRepository.findByUserIdOrEstudianteId(estudianteId);
                    System.out.println("Búsqueda completa: Se encontraron " + calificaciones.size() + 
                                      " calificaciones para estudianteId/userId: " + estudianteId);
                    
                    if (calificaciones.isEmpty()) {
                        // Debug all grades in the system
                        List<Calificacion> allGrades = calificacionRepository.findAll();
                        System.out.println("Total de calificaciones en el sistema: " + allGrades.size());
                        
                        if (allGrades.size() < 30) { // Only debug if there aren't too many
                            System.out.println("Listando todas las calificaciones:");
                            for (Calificacion cal : allGrades) {
                                System.out.println("- ID: " + cal.getId() + 
                                                  ", userId: " + cal.getUserId() +
                                                  ", estudianteId: " + cal.getEstudianteId() +
                                                  ", valor: " + cal.getValor() +
                                                  ", clase: " + cal.getClassroomName());
                            }
                        }
                    }
                } catch (Exception e) {
                    System.err.println("Error en búsqueda combinada: " + e.getMessage());
                    // Fallback to standard methods
                    calificaciones = getCalificacionesByEstudiante(estudianteId);
                }
                
                System.out.println("Obtenidas " + calificaciones.size() + " calificaciones para el estudiante " + estudianteId);
            }
            
            // Fix date field if null
            for (Calificacion cal : calificaciones) {
                if (cal.getFecha() == null) {
                    cal.setFecha(LocalDate.now());
                    System.out.println("Fixed null date for grade ID: " + cal.getId());
                }
            }
            
            // If no grades found, add a dummy one so we still generate a PDF
            if (calificaciones == null || calificaciones.isEmpty()) {
                System.out.println("No se encontraron calificaciones para el estudiante " + estudianteId + ", usando datos de ejemplo");
                Calificacion dummyCalificacion = Calificacion.builder()
                    .estudianteId(estudianteId)
                    .userId(estudianteId) // Ensure both fields are set
                    .estudianteNombre("Estudiante")
                    .userName("Estudiante") // Set both name fields
                    .claseId(1L)
                    .classroomId(1) // Set both class ID fields
                    .claseNombre("Sin calificaciones registradas")
                    .classroomName("Sin calificaciones registradas") // Set both class name fields
                    .valor(0.0)
                    .valorMaximo(10.0)
                    .fecha(java.time.LocalDate.now())
                    .tipo("Información")
                    .comentarios("No hay calificaciones registradas para este estudiante")
                    .build();
                calificaciones = new ArrayList<>();
                calificaciones.add(dummyCalificacion);
            }
            
            // Obtener datos del estudiante (con manejo de errores)
            Map<String, Object> datosEstudiante;
            try {
                datosEstudiante = keycloakClient.getUserById("osRoom", estudianteId, authHeader);
                System.out.println("Datos del estudiante obtenidos correctamente");
            } catch (Exception e) {
                System.err.println("Error obteniendo datos del estudiante: " + e.getMessage());
                // Create dummy student data if Keycloak is not available
                datosEstudiante = new HashMap<>();
                datosEstudiante.put("firstName", "Estudiante");
                datosEstudiante.put("lastName", "");
                datosEstudiante.put("id", estudianteId);
            }
            
            // Use empty string for periodo if not provided
            String periodoToUse = (periodo != null && !periodo.trim().isEmpty()) ? periodo : "Todos";
            
            // Generar PDF
            System.out.println("Generando PDF con " + calificaciones.size() + " calificaciones");
            return pdfGeneratorService.generarPdfCalificaciones(calificaciones, datosEstudiante, periodoToUse);
            
        } catch (Exception e) {
            System.err.println("Error en generarPdfCalificaciones: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error al generar PDF de calificaciones: " + e.getMessage(), e);
        }
    }

    // Registrar calificaciones en lote para una actividad
    public List<Calificacion> registrarCalificacionesActividad(Long actividadId, String actividadNombre, 
                                                              Long claseId, String claseNombre, 
                                                              Map<String, Double> calificacionesPorEstudiante, 
                                                              String tipo, String periodo, 
                                                              Double valorMaximo,
                                                              String profesorId, String profesorNombre) {
        
        List<Calificacion> calificaciones = calificacionesPorEstudiante.entrySet().stream()
                .map(entry -> {
                    String estudianteId = entry.getKey();
                    Double valor = entry.getValue();
                    
                    return Calificacion.builder()
                            .estudianteId(estudianteId)
                            .claseId(claseId)
                            .claseNombre(claseNombre)
                            .actividadId(actividadId)
                            .actividadNombre(actividadNombre)
                            .tipo(tipo)
                            .periodo(periodo)
                            .valor(valor)
                            .valorMaximo(valorMaximo)
                            .fecha(LocalDate.now())
                            .profesorId(profesorId)
                            .profesorNombre(profesorNombre)
                            .build();
                })
                .toList();
        
        List<Calificacion> savedCalificaciones = calificacionRepository.saveAll(calificaciones);
        
        // Enviar notificaciones a los estudiantes
        for (Calificacion cal : savedCalificaciones) {
            notificacionService.crearNotificacionSistema(
                cal.getEstudianteId(),
                "Nueva calificación registrada",
                "Se ha registrado una calificación de " + cal.getValor() + 
                " en la actividad " + cal.getActividadNombre() + 
                " de la clase " + cal.getClaseNombre(),
                "CALIFICACION"
            );
        }
        
        return savedCalificaciones;
    }

    // Registrar calificaciones finales para un periodo
    public Map<String, Object> registrarCalificacionesPeriodo(Long claseId, String periodo, 
                                                           String profesorId, String profesorNombre, 
                                                           String authHeader) {
        try {
            // Obtener información de la clase
            Map<String, Object> classroom = classroomClient.getClassroomById(claseId, authHeader);
            String className = (String) classroom.get("name");
            
            // Obtener lista de estudiantes de la clase
            List<Long> studentIds = (List<Long>) classroom.get("studentIds");
            
            Map<String, Object> result = new HashMap<>();
            result.put("total", studentIds.size());
            int procesados = 0;
            
            // Para cada estudiante, calcular promedio y registrar calificación final
            for (Long studentIdLong : studentIds) {
                String studentId = String.valueOf(studentIdLong);
                
                // Calcular promedio de calificaciones del periodo
                Double promedio = calcularPromedioByEstudianteAndClaseAndPeriodo(studentId, claseId, periodo);
                
                if (promedio != null) {
                    // Obtener información del estudiante
                    Map<String, Object> student = keycloakClient.getUserById("osRoom", studentId, authHeader);
                    String studentName = student.get("firstName") + " " + student.get("lastName");
                    
                    // Crear calificación final
                    Calificacion calificacionFinal = Calificacion.builder()
                            .estudianteId(studentId)
                            .estudianteNombre(studentName)
                            .claseId(claseId)
                            .claseNombre(className)
                            .tipo("FINAL_" + periodo)
                            .periodo(periodo)
                            .valor(promedio)
                            .valorMaximo(10.0)
                            .fecha(LocalDate.now())
                            .profesorId(profesorId)
                            .profesorNombre(profesorNombre)
                            .comentarios("Calificación final del " + periodo)
                            .build();
                    
                    calificacionRepository.save(calificacionFinal);
                    procesados++;
                    
                    // Enviar notificación
                    notificacionService.crearNotificacionSistema(
                        studentId,
                        "Calificación final del " + periodo,
                        "Se ha registrado tu calificación final del " + periodo + 
                        " para la clase " + className + ": " + String.format("%.2f", promedio),
                        "CALIFICACION_FINAL"
                    );
                }
            }
            
            result.put("procesados", procesados);
            return result;
            
        } catch (Exception e) {
            throw new RuntimeException("Error al registrar calificaciones del periodo", e);
        }
    }
} 