package com.osroom.gestionnap.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "notificaciones")
public class Notificacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titulo;

    @Column(nullable = false, length = 1000)
    private String contenido;

    @Column(nullable = false)
    private String destinatarioId;

    private String autorId;

    private String autorNombre;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    @Column(nullable = false)
    @Builder.Default
    private boolean leida = false;
    
    // Campos adicionales para compatibilidad
    private LocalDateTime fechaLectura;
    private String usuarioDestinatarioId;
    private String tipo;
    private Long entidadRelacionadaId;
    private String tipoEntidadRelacionada;
    private String urlRedireccion;
    private String mensaje;
    
    // Métodos de compatibilidad
    public String getUsuarioDestinatarioId() {
        return usuarioDestinatarioId != null ? usuarioDestinatarioId : destinatarioId;
    }
    
    public void setFechaLectura(LocalDateTime fechaLectura) {
        this.fechaLectura = fechaLectura;
    }
} 