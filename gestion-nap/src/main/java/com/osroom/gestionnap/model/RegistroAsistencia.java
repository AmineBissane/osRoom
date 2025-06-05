package com.osroom.gestionnap.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "registros_asistencia")
public class RegistroAsistencia {

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
    private LocalDate fecha;

    @Column(nullable = false)
    private boolean presente;

    private String observaciones;
    
    // Campos adicionales para compatibilidad con el código existente
    private String estudianteId;
    private String estudianteNombre;
    private Long claseId;
    private String claseNombre;
    private LocalTime horaRegistro;
    private String estado;
    private String profesorId;
    private String profesorNombre;
    
    // Métodos de compatibilidad
    public String getEstado() {
        if (estado != null) {
            return estado;
        }
        return presente ? "PRESENTE" : "AUSENTE";
    }
    
    public void setEstado(String estado) {
        this.estado = estado;
        this.presente = "PRESENTE".equals(estado);
    }
    
    public String getEstudianteId() {
        return estudianteId != null ? estudianteId : userId;
    }
    
    public String getClaseNombre() {
        return claseNombre != null ? claseNombre : classroomName;
    }
} 