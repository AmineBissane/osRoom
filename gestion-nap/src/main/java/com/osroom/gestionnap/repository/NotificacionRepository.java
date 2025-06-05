package com.osroom.gestionnap.repository;

import com.osroom.gestionnap.model.Notificacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {
    
    // Métodos para el nuevo modelo
    List<Notificacion> findByDestinatarioId(String destinatarioId);
    
    List<Notificacion> findByDestinatarioIdAndLeida(String destinatarioId, boolean leida);
    
    long countByDestinatarioIdAndLeida(String destinatarioId, boolean leida);
    
    // Métodos para el modelo anterior
    List<Notificacion> findByUsuarioDestinatarioId(String usuarioDestinatarioId);
    
    List<Notificacion> findByUsuarioDestinatarioIdAndLeidaFalse(String usuarioDestinatarioId);
    
    long countByUsuarioDestinatarioIdAndLeidaFalse(String usuarioDestinatarioId);
    
    // Buscar notificaciones por tipo
    List<Notificacion> findByUsuarioDestinatarioIdAndTipo(String usuarioId, String tipo);
    
    // Buscar notificaciones relacionadas con una entidad específica
    List<Notificacion> findByEntidadRelacionadaIdAndTipoEntidadRelacionada(Long entidadId, String tipoEntidad);
} 