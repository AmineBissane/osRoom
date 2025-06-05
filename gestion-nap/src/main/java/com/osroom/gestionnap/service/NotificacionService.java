package com.osroom.gestionnap.service;

import com.osroom.gestionnap.model.Notificacion;
import com.osroom.gestionnap.repository.NotificacionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificacionService {

    private final NotificacionRepository notificacionRepository;

    @Transactional(readOnly = true)
    public List<Notificacion> getAllNotificaciones() {
        log.debug("Getting all notificaciones");
        return notificacionRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Notificacion getNotificacionById(Long id) {
        log.debug("Getting notificacion with id: {}", id);
        return notificacionRepository.findById(id).orElse(null);
    }

    @Transactional
    public Notificacion createNotificacion(Notificacion notificacion) {
        log.debug("Creating notificacion: {}", notificacion);
        // Establecer la fecha de creación si no está establecida
        if (notificacion.getFechaCreacion() == null) {
            notificacion.setFechaCreacion(LocalDateTime.now());
        }
        // Por defecto, la notificación no está leída
        notificacion.setLeida(false);
        return notificacionRepository.save(notificacion);
    }

    @Transactional
    public Notificacion updateNotificacion(Long id, Notificacion notificacion) {
        log.debug("Updating notificacion with id: {}", id);
        if (notificacionRepository.existsById(id)) {
            notificacion.setId(id);
            return notificacionRepository.save(notificacion);
        }
        return null;
    }

    @Transactional
    public void deleteNotificacion(Long id) {
        log.debug("Deleting notificacion with id: {}", id);
        notificacionRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<Notificacion> getNotificacionesByUsuario(String usuarioId) {
        log.debug("Getting notificaciones for user: {}", usuarioId);
        // Try first with destinatarioId (new field)
        List<Notificacion> notificaciones = notificacionRepository.findByDestinatarioId(usuarioId);
        if (notificaciones != null && !notificaciones.isEmpty()) {
            return notificaciones;
        }
        // Fallback to usuarioDestinatarioId (old field)
        return notificacionRepository.findByUsuarioDestinatarioId(usuarioId);
    }

    @Transactional(readOnly = true)
    public List<Notificacion> getNotificacionesNoLeidasByUsuario(String usuarioId) {
        log.debug("Getting unread notificaciones for user: {}", usuarioId);
        // Try first with destinatarioId (new field)
        List<Notificacion> notificaciones = notificacionRepository.findByDestinatarioIdAndLeida(usuarioId, false);
        if (notificaciones != null && !notificaciones.isEmpty()) {
            return notificaciones;
        }
        // Fallback to usuarioDestinatarioId (old field)
        return notificacionRepository.findByUsuarioDestinatarioIdAndLeidaFalse(usuarioId);
    }

    @Transactional(readOnly = true)
    public long countNotificacionesNoLeidasByUsuario(String usuarioId) {
        log.debug("Counting unread notificaciones for user: {}", usuarioId);
        // Try first with destinatarioId (new field)
        long count = notificacionRepository.countByDestinatarioIdAndLeida(usuarioId, false);
        if (count > 0) {
            return count;
        }
        // Fallback to usuarioDestinatarioId (old field)
        return notificacionRepository.countByUsuarioDestinatarioIdAndLeidaFalse(usuarioId);
    }

    @Transactional
    public Notificacion marcarComoLeida(Long id) {
        log.debug("Marking notificacion as read: {}", id);
        Notificacion notificacion = notificacionRepository.findById(id).orElse(null);
        if (notificacion != null) {
            notificacion.setLeida(true);
            notificacion.setFechaLectura(LocalDateTime.now());
            return notificacionRepository.save(notificacion);
        }
        return null;
    }

    @Transactional
    public List<Notificacion> marcarTodasComoLeidas(String usuarioId) {
        log.debug("Marking all notificaciones as read for user: {}", usuarioId);
        // Try first with destinatarioId (new field)
        List<Notificacion> notificaciones = notificacionRepository.findByDestinatarioIdAndLeida(usuarioId, false);
        if (notificaciones == null || notificaciones.isEmpty()) {
            // Fallback to usuarioDestinatarioId (old field)
            notificaciones = notificacionRepository.findByUsuarioDestinatarioIdAndLeidaFalse(usuarioId);
        }
        
        LocalDateTime now = LocalDateTime.now();
        
        for (Notificacion notificacion : notificaciones) {
            notificacion.setLeida(true);
            notificacion.setFechaLectura(now);
        }
        
        return notificacionRepository.saveAll(notificaciones);
    }

    @Transactional
    public void crearNotificacionSistema(String destinatarioId, String titulo, String contenido, String tipo) {
        log.debug("Creating system notification for user: {}", destinatarioId);
        
        // Skip notification creation if destinatarioId is null or empty
        if (destinatarioId == null || destinatarioId.trim().isEmpty()) {
            log.warn("Skipping notification creation because destinatarioId is null or empty");
            return;
        }
        
        Notificacion notificacion = Notificacion.builder()
                .destinatarioId(destinatarioId)
                .usuarioDestinatarioId(destinatarioId) // Set both fields for compatibility
                .titulo(titulo)
                .contenido(contenido)
                .tipo(tipo)
                .fechaCreacion(LocalDateTime.now())
                .leida(false)
                .build();
        
        notificacionRepository.save(notificacion);
    }
} 