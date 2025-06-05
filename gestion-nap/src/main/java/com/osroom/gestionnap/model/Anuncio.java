package com.osroom.gestionnap.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Anuncio {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String titulo;
    
    @Column(length = 2000)
    private String contenido;
    
    private LocalDateTime fechaPublicacion;
    
    private LocalDateTime fechaExpiracion;
    
    private String autorId; // ID del usuario de Keycloak que creó el anuncio
    
    private String autorNombre; // Nombre del autor para mostrar
    
    private boolean importante;
    
    // Categoría del anuncio (general, clase específica, etc.)
    private String categoria;
    
    // Lista de IDs de clases a las que va dirigido el anuncio
    @ElementCollection(fetch = FetchType.EAGER)
    private List<Long> clasesDestinatarias;
    
    // Lista de IDs de usuarios específicos a los que va dirigido el anuncio
    @ElementCollection(fetch = FetchType.EAGER)
    private List<String> usuariosDestinatarios;
} 