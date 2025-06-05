package com.osroom.gestionnap.repository;

import com.osroom.gestionnap.model.Calificacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CalificacionRepository extends JpaRepository<Calificacion, Long> {
    
    // Métodos para el nuevo modelo
    List<Calificacion> findByUserId(String userId);
    
    List<Calificacion> findByClassroomId(Integer classroomId);
    
    List<Calificacion> findByUserIdAndClassroomId(String userId, Integer classroomId);
    
    // Métodos para el modelo anterior
    List<Calificacion> findByEstudianteId(String estudianteId);
    
    List<Calificacion> findByClaseId(Long claseId);
    
    List<Calificacion> findByEstudianteIdAndClaseId(String estudianteId, Long claseId);
    
    List<Calificacion> findByEstudianteIdAndClaseIdAndPeriodo(String estudianteId, Long claseId, String periodo);
    
    List<Calificacion> findByTipo(String tipo);
    
    List<Calificacion> findByActividadId(Long actividadId);
    
    // Additional search methods for more flexible queries
    @Query("SELECT c FROM Calificacion c WHERE c.userId = :id OR c.estudianteId = :id")
    List<Calificacion> findByUserIdOrEstudianteId(@Param("id") String id);
    
    @Query("SELECT c FROM Calificacion c WHERE c.classroomId = :id OR c.claseId = :id")
    List<Calificacion> findByClassroomIdOrClaseId(@Param("id") Long id);
    
    @Query("SELECT c FROM Calificacion c WHERE (c.userId = :userId OR c.estudianteId = :userId) " +
           "AND (c.classroomId = :classroomId OR c.claseId = :classroomId)")
    List<Calificacion> findByUserAndClassroomCombined(
            @Param("userId") String userId, 
            @Param("classroomId") Long classroomId);
    
    @Query("SELECT AVG(c.valor / c.valorMaximo * 10) FROM Calificacion c WHERE c.estudianteId = :estudianteId AND c.claseId = :claseId")
    Double calcularPromedioByEstudianteAndClase(@Param("estudianteId") String estudianteId, @Param("claseId") Long claseId);
    
    @Query("SELECT AVG(c.valor / c.valorMaximo * 10) FROM Calificacion c WHERE c.estudianteId = :estudianteId AND c.claseId = :claseId AND c.periodo = :periodo")
    Double calcularPromedioByEstudianteAndClaseAndPeriodo(
            @Param("estudianteId") String estudianteId, 
            @Param("claseId") Long claseId, 
            @Param("periodo") String periodo);
} 