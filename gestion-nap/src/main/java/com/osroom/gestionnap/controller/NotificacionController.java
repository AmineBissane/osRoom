package com.osroom.gestionnap.controller;

import com.osroom.gestionnap.model.Notificacion;
import com.osroom.gestionnap.service.NotificacionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notificaciones")
@RequiredArgsConstructor
public class NotificacionController {

    private final NotificacionService notificacionService;

    @GetMapping
    public ResponseEntity<List<Notificacion>> getAllNotificaciones() {
        return ResponseEntity.ok(notificacionService.getAllNotificaciones());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Notificacion> getNotificacionById(@PathVariable Long id) {
        Notificacion notificacion = notificacionService.getNotificacionById(id);
        if (notificacion != null) {
            return ResponseEntity.ok(notificacion);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<Notificacion> createNotificacion(
            @RequestBody Notificacion notificacion,
            @RequestHeader("Authorization") String authHeader) {
        
        return ResponseEntity.ok(notificacionService.createNotificacion(notificacion));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Notificacion> updateNotificacion(
            @PathVariable Long id,
            @RequestBody Notificacion notificacion,
            @RequestHeader("Authorization") String authHeader) {
        
        Notificacion updatedNotificacion = notificacionService.updateNotificacion(id, notificacion);
        if (updatedNotificacion != null) {
            return ResponseEntity.ok(updatedNotificacion);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotificacion(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {
        
        notificacionService.deleteNotificacion(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<Notificacion>> getNotificacionesByUsuario(@PathVariable String usuarioId) {
        return ResponseEntity.ok(notificacionService.getNotificacionesByUsuario(usuarioId));
    }

    @GetMapping("/usuario/{usuarioId}/no-leidas")
    public ResponseEntity<List<Notificacion>> getNotificacionesNoLeidasByUsuario(@PathVariable String usuarioId) {
        return ResponseEntity.ok(notificacionService.getNotificacionesNoLeidasByUsuario(usuarioId));
    }

    @GetMapping("/usuario/{usuarioId}/count-no-leidas")
    public ResponseEntity<Map<String, Long>> countNotificacionesNoLeidasByUsuario(@PathVariable String usuarioId) {
        long count = notificacionService.countNotificacionesNoLeidasByUsuario(usuarioId);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PutMapping("/{id}/marcar-leida")
    public ResponseEntity<Notificacion> marcarComoLeida(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {
        
        Notificacion notificacion = notificacionService.marcarComoLeida(id);
        if (notificacion != null) {
            return ResponseEntity.ok(notificacion);
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/usuario/{usuarioId}/marcar-todas-leidas")
    public ResponseEntity<List<Notificacion>> marcarTodasComoLeidas(
            @PathVariable String usuarioId,
            @RequestHeader("Authorization") String authHeader) {
        
        return ResponseEntity.ok(notificacionService.marcarTodasComoLeidas(usuarioId));
    }

    @PostMapping("/sistema")
    public ResponseEntity<Void> crearNotificacionSistema(
            @RequestBody Map<String, String> payload,
            @RequestHeader("Authorization") String authHeader) {
        
        String usuarioId = payload.get("usuarioId");
        String titulo = payload.get("titulo");
        String mensaje = payload.get("mensaje");
        String tipo = payload.get("tipo");
        
        notificacionService.crearNotificacionSistema(usuarioId, titulo, mensaje, tipo);
        return ResponseEntity.ok().build();
    }
} 