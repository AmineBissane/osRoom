package com.osroom.gestionnap.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "calificaciones")
public class Calificacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false)
    private String userName;

    @Column(nullable = false)
    private Integer classroomId;

    @Column(nullable = false)
    private String classroomName;

    @Column(nullable = false)
    private Double valor;

    @Column(nullable = false)
    @Builder.Default
    private Double valorMaximo = 10.0;

    private String descripcion;
    
    @Column(nullable = false)
    private LocalDate fecha;
    
    private String tipo;
    
    private String comentarios;
    
    // Campos adicionales para compatibilidad
    private String estudianteId;
    private String estudianteNombre;
    private Long claseId;
    private String claseNombre;
    private String periodo;
    private String profesorId;
    private String profesorNombre;
    private Long actividadId;
    private String actividadNombre;
    
    // Métodos de compatibilidad
    public String getClaseNombre() {
        return claseNombre != null ? claseNombre : classroomName;
    }
    
    public String getActividadNombre() {
        return actividadNombre;
    }
} 