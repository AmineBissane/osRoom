package com.osroom.gestionnap.service;

import com.osroom.gestionnap.client.ClassroomClient;
import com.osroom.gestionnap.client.KeycloakClient;
import com.osroom.gestionnap.model.RegistroAsistencia;
import com.osroom.gestionnap.repository.RegistroAsistenciaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class RegistroAsistenciaService {

    private final RegistroAsistenciaRepository registroAsistenciaRepository;
    private final KeycloakClient keycloakClient;
    private final ClassroomClient classroomClient;
    private final NotificacionService notificacionService;
    private final KeycloakTokenService keycloakTokenService;
    
    @Value("${app.keycloak.realm:osRoom}")
    private String realm;

    public List<RegistroAsistencia> getAllRegistrosAsistencia() {
        return registroAsistenciaRepository.findAll();
    }

    public RegistroAsistencia getRegistroAsistenciaById(Long id) {
        return registroAsistenciaRepository.findById(id).orElse(null);
    }

    public RegistroAsistencia createRegistroAsistencia(RegistroAsistencia registroAsistencia) {
        // Establecer la fecha actual si no está establecida
        if (registroAsistencia.getFecha() == null) {
            registroAsistencia.setFecha(LocalDate.now());
        }
        
        // Establecer la hora actual si no está establecida
        if (registroAsistencia.getHoraRegistro() == null) {
            registroAsistencia.setHoraRegistro(LocalTime.now());
        }
        
        RegistroAsistencia saved = registroAsistenciaRepository.save(registroAsistencia);
        
        // Enviar notificación al estudiante si está ausente
        if ("AUSENTE".equals(registroAsistencia.getEstado())) {
            notificacionService.crearNotificacionSistema(
                registroAsistencia.getEstudianteId(),
                "Registro de ausencia",
                "Se ha registrado tu ausencia en la clase " + registroAsistencia.getClaseNombre() + 
                " del día " + registroAsistencia.getFecha(),
                "AUSENCIA"
            );
        }
        
        return saved;
    }

    public RegistroAsistencia updateRegistroAsistencia(Long id, RegistroAsistencia registroAsistencia) {
        if (registroAsistenciaRepository.existsById(id)) {
            registroAsistencia.setId(id);
            return registroAsistenciaRepository.save(registroAsistencia);
        }
        return null;
    }

    public void deleteRegistroAsistencia(Long id) {
        registroAsistenciaRepository.deleteById(id);
    }

    public List<RegistroAsistencia> getRegistrosByEstudiante(String estudianteId) {
        return registroAsistenciaRepository.findByEstudianteId(estudianteId);
    }

    public List<RegistroAsistencia> getRegistrosByClase(Long claseId) {
        return registroAsistenciaRepository.findByClaseId(claseId);
    }

    public List<RegistroAsistencia> getRegistrosByFecha(LocalDate fecha) {
        return registroAsistenciaRepository.findByFecha(fecha);
    }

    public List<RegistroAsistencia> getRegistrosByClaseYFecha(Long claseId, LocalDate fecha) {
        return registroAsistenciaRepository.findByClaseIdAndFecha(claseId, fecha);
    }

    public long countAusenciasByEstudianteAndClase(String estudianteId, Long claseId) {
        return registroAsistenciaRepository.countAusenciasByEstudianteAndClase(estudianteId, claseId);
    }

    public double calcularPorcentajeAsistencia(String estudianteId, Long claseId) {
        long presencias = registroAsistenciaRepository.countPresenciasByEstudianteAndClase(estudianteId, claseId);
        List<RegistroAsistencia> registros = registroAsistenciaRepository.findByEstudianteIdAndClaseId(estudianteId, claseId);
        
        if (registros.isEmpty()) {
            return 0.0;
        }
        
        return (double) presencias / registros.size() * 100;
    }

    // Registrar asistencia para toda una clase
    public List<RegistroAsistencia> registrarAsistenciaClase(Long claseId, LocalDate fecha, String profesorId, 
                                                           String profesorNombre, String authHeader) {
        try {
            // Use provided auth header or get a service account token
            String token = (authHeader != null && !authHeader.isBlank()) 
                ? authHeader 
                : keycloakTokenService.getServiceAccountToken();
                
            // Obtener información de la clase
            Map<String, Object> classroom = classroomClient.getClassroomById(claseId, token);
            String className = (String) classroom.get("name");
            
            // Obtener lista de estudiantes de la clase
            List<Long> studentIds = (List<Long>) classroom.get("studentIds");
            if (studentIds == null || studentIds.isEmpty()) {
                return new ArrayList<>();
            }
            
            List<RegistroAsistencia> registros = new ArrayList<>();
            
            // Para cada estudiante, crear un registro de ausencia por defecto
            for (Long studentIdLong : studentIds) {
                String studentId = String.valueOf(studentIdLong);
                
                // Obtener información del estudiante desde Keycloak
                Map<String, Object> student = keycloakClient.getUserById(realm, studentId, token);
                String studentName = student.get("firstName") + " " + student.get("lastName");
                
                RegistroAsistencia registro = RegistroAsistencia.builder()
                        .userId(studentId) // Use both fields for compatibility
                        .estudianteId(studentId)
                        .estudianteNombre(studentName)
                        .userName(studentName)
                        .classroomId(claseId.intValue()) // Use both fields for compatibility
                        .claseId(claseId)
                        .classroomName(className)
                        .claseNombre(className)
                        .fecha(fecha)
                        .horaRegistro(LocalTime.now())
                        .estado("AUSENTE") // Por defecto, todos ausentes
                        .profesorId(profesorId)
                        .profesorNombre(profesorNombre)
                        .build();
                
                registros.add(registro);
            }
            
            // Guardar todos los registros
            return registroAsistenciaRepository.saveAll(registros);
            
        } catch (Exception e) {
            throw new RuntimeException("Error al registrar asistencia para la clase", e);
        }
    }

    // Actualizar el estado de asistencia de un estudiante
    public RegistroAsistencia actualizarEstadoAsistencia(Long registroId, String estado, String observaciones) {
        RegistroAsistencia registro = registroAsistenciaRepository.findById(registroId).orElse(null);
        if (registro != null) {
            registro.setEstado(estado);
            registro.setObservaciones(observaciones);
            registro.setHoraRegistro(LocalTime.now());
            
            return registroAsistenciaRepository.save(registro);
        }
        return null;
    }

    public List<RegistroAsistencia> obtenerAsistenciasPorClaseYFecha(Integer classroomId, LocalDate fecha) {
        try {
            // Try both old and new field naming
            List<RegistroAsistencia> registros = registroAsistenciaRepository.findByClassroomIdAndFecha(classroomId, fecha);
            
            if (registros == null || registros.isEmpty()) {
                registros = registroAsistenciaRepository.findByClaseIdAndFecha(classroomId.longValue(), fecha);
            }
            
            return registros != null ? registros : new ArrayList<>();
        } catch (Exception e) {
            System.err.println("Error getting attendance for classroom " + classroomId + " and date " + fecha + ": " + e.getMessage());
            return new ArrayList<>();
        }
    }

    public List<RegistroAsistencia> obtenerAsistenciasPorUsuario(String userId) {
        try {
            // Try both old and new field naming
            List<RegistroAsistencia> registros = registroAsistenciaRepository.findByUserId(userId);
            
            if (registros == null || registros.isEmpty()) {
                registros = registroAsistenciaRepository.findByEstudianteId(userId);
            }
            
            return registros != null ? registros : new ArrayList<>();
        } catch (Exception e) {
            System.err.println("Error getting attendance for user " + userId + ": " + e.getMessage());
            return new ArrayList<>();
        }
    }

    public List<RegistroAsistencia> obtenerAsistenciasPorClase(Integer classroomId) {
        try {
            // Try both old and new field naming
            List<RegistroAsistencia> registros = registroAsistenciaRepository.findByClassroomId(classroomId);
            
            if (registros == null || registros.isEmpty()) {
                registros = registroAsistenciaRepository.findByClaseId(classroomId.longValue());
            }
            
            return registros != null ? registros : new ArrayList<>();
        } catch (Exception e) {
            System.err.println("Error getting attendance for classroom " + classroomId + ": " + e.getMessage());
            return new ArrayList<>();
        }
    }

    public List<RegistroAsistencia> obtenerAsistenciasPorFecha(LocalDate fecha) {
        try {
            return registroAsistenciaRepository.findByFecha(fecha);
        } catch (Exception e) {
            System.err.println("Error getting attendance for date " + fecha + ": " + e.getMessage());
            return new ArrayList<>();
        }
    }

    public List<RegistroAsistencia> guardarAsistencias(List<RegistroAsistencia> registros) {
        try {
            // Ensure all required fields are set and compatible fields are populated
            registros.forEach(registro -> {
                // Set fecha if not present
                if (registro.getFecha() == null) {
                    registro.setFecha(LocalDate.now());
                }
                
                // Set hora if not present
                if (registro.getHoraRegistro() == null) {
                    registro.setHoraRegistro(LocalTime.now());
                }
                
                // Ensure compatibility fields are set
                if (registro.getUserId() != null && registro.getEstudianteId() == null) {
                    registro.setEstudianteId(registro.getUserId());
                } else if (registro.getEstudianteId() != null && registro.getUserId() == null) {
                    registro.setUserId(registro.getEstudianteId());
                }
                
                if (registro.getUserName() != null && registro.getEstudianteNombre() == null) {
                    registro.setEstudianteNombre(registro.getUserName());
                } else if (registro.getEstudianteNombre() != null && registro.getUserName() == null) {
                    registro.setUserName(registro.getEstudianteNombre());
                }
                
                if (registro.getClassroomId() != null && registro.getClaseId() == null) {
                    registro.setClaseId(registro.getClassroomId().longValue());
                } else if (registro.getClaseId() != null && registro.getClassroomId() == null) {
                    registro.setClassroomId(registro.getClaseId().intValue());
                }
                
                if (registro.getClassroomName() != null && registro.getClaseNombre() == null) {
                    registro.setClaseNombre(registro.getClassroomName());
                } else if (registro.getClaseNombre() != null && registro.getClassroomName() == null) {
                    registro.setClassroomName(registro.getClaseNombre());
                }
            });
            
            return registroAsistenciaRepository.saveAll(registros);
        } catch (Exception e) {
            System.err.println("Error saving attendance records: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    public RegistroAsistencia guardarAsistencia(RegistroAsistencia registro) {
        try {
            // Set fecha if not present
            if (registro.getFecha() == null) {
                registro.setFecha(LocalDate.now());
            }
            
            // Set hora if not present
            if (registro.getHoraRegistro() == null) {
                registro.setHoraRegistro(LocalTime.now());
            }
            
            // Ensure compatibility fields are set
            if (registro.getUserId() != null && registro.getEstudianteId() == null) {
                registro.setEstudianteId(registro.getUserId());
            } else if (registro.getEstudianteId() != null && registro.getUserId() == null) {
                registro.setUserId(registro.getEstudianteId());
            }
            
            if (registro.getUserName() != null && registro.getEstudianteNombre() == null) {
                registro.setEstudianteNombre(registro.getUserName());
            } else if (registro.getEstudianteNombre() != null && registro.getUserName() == null) {
                registro.setUserName(registro.getEstudianteNombre());
            }
            
            if (registro.getClassroomId() != null && registro.getClaseId() == null) {
                registro.setClaseId(registro.getClassroomId().longValue());
            } else if (registro.getClaseId() != null && registro.getClassroomId() == null) {
                registro.setClassroomId(registro.getClaseId().intValue());
            }
            
            if (registro.getClassroomName() != null && registro.getClaseNombre() == null) {
                registro.setClaseNombre(registro.getClassroomName());
            } else if (registro.getClaseNombre() != null && registro.getClassroomName() == null) {
                registro.setClassroomName(registro.getClaseNombre());
            }
            
            return registroAsistenciaRepository.save(registro);
        } catch (Exception e) {
            System.err.println("Error saving attendance record: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    /**
     * Gets student information from Keycloak for a list of student IDs
     */
    public Map<String, Map<String, Object>> getStudentDataFromKeycloak(List<String> studentIds, String authHeader) {
        Map<String, Map<String, Object>> studentData = new HashMap<>();
        
        try {
            // Use provided auth header or get a service account token
            String token = (authHeader != null && !authHeader.isBlank()) 
                ? authHeader 
                : keycloakTokenService.getServiceAccountToken();
                
            for (String studentId : studentIds) {
                try {
                    Map<String, Object> userData = keycloakClient.getUserById(realm, studentId, token);
                    if (userData != null) {
                        studentData.put(studentId, userData);
                    }
                } catch (Exception e) {
                    System.err.println("Error fetching data for student " + studentId + ": " + e.getMessage());
                }
            }
        } catch (Exception e) {
            System.err.println("Error fetching student data from Keycloak: " + e.getMessage());
        }
        
        return studentData;
    }
} 