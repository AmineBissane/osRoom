package com.osroom.gestionnap.repository;

import com.osroom.gestionnap.model.RegistroAsistencia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface RegistroAsistenciaRepository extends JpaRepository<RegistroAsistencia, Long> {
    
    // Métodos para el nuevo modelo
    List<RegistroAsistencia> findByClassroomIdAndFecha(Integer classroomId, LocalDate fecha);
    
    List<RegistroAsistencia> findByUserId(String userId);
    
    List<RegistroAsistencia> findByClassroomId(Integer classroomId);
    
    // Métodos para el modelo anterior
    List<RegistroAsistencia> findByEstudianteId(String estudianteId);
    
    List<RegistroAsistencia> findByClaseId(Long claseId);
    
    List<RegistroAsistencia> findByFecha(LocalDate fecha);
    
    List<RegistroAsistencia> findByClaseIdAndFecha(Long claseId, LocalDate fecha);
    
    List<RegistroAsistencia> findByEstudianteIdAndClaseId(String estudianteId, Long claseId);
    
    List<RegistroAsistencia> findByEstudianteIdAndClaseIdAndFechaBetween(
            String estudianteId, Long claseId, LocalDate fechaInicio, LocalDate fechaFin);
    
    // Consultas para estadísticas
    @Query("SELECT COUNT(r) FROM RegistroAsistencia r WHERE r.estudianteId = :estudianteId " +
           "AND r.claseId = :claseId AND r.estado = 'AUSENTE'")
    long countAusenciasByEstudianteAndClase(
            @Param("estudianteId") String estudianteId, @Param("claseId") Long claseId);
    
    @Query("SELECT COUNT(r) FROM RegistroAsistencia r WHERE r.estudianteId = :estudianteId " +
           "AND r.claseId = :claseId AND r.estado = 'PRESENTE'")
    long countPresenciasByEstudianteAndClase(
            @Param("estudianteId") String estudianteId, @Param("claseId") Long claseId);
} 