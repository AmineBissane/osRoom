package com.osroom.gestionnap.dto;

import com.osroom.gestionnap.model.Anuncio;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AnuncioDTO {
    private Long id;
    private String titulo;
    private String contenido;
    private LocalDateTime fechaPublicacion;
    private LocalDateTime fechaExpiracion;
    private String autorId;
    private String autorNombre;
    private boolean importante;
    private String categoria;
    private List<Long> clasesDestinatarias;
    private List<String> usuariosDestinatarios;
    
    public static AnuncioDTO fromEntity(Anuncio anuncio) {
        if (anuncio == null) {
            return null;
        }
        
        return AnuncioDTO.builder()
                .id(anuncio.getId())
                .titulo(anuncio.getTitulo())
                .contenido(anuncio.getContenido())
                .fechaPublicacion(anuncio.getFechaPublicacion())
                .fechaExpiracion(anuncio.getFechaExpiracion())
                .autorId(anuncio.getAutorId())
                .autorNombre(anuncio.getAutorNombre())
                .importante(anuncio.isImportante())
                .categoria(anuncio.getCategoria())
                .clasesDestinatarias(anuncio.getClasesDestinatarias() != null 
                    ? new ArrayList<>(anuncio.getClasesDestinatarias()) 
                    : new ArrayList<>())
                .usuariosDestinatarios(anuncio.getUsuariosDestinatarios() != null 
                    ? new ArrayList<>(anuncio.getUsuariosDestinatarios()) 
                    : new ArrayList<>())
                .build();
    }
    
    public static List<AnuncioDTO> fromEntities(List<Anuncio> anuncios) {
        if (anuncios == null) {
            return new ArrayList<>();
        }
        
        List<AnuncioDTO> dtos = new ArrayList<>(anuncios.size());
        for (Anuncio anuncio : anuncios) {
            dtos.add(fromEntity(anuncio));
        }
        return dtos;
    }
    
    public Anuncio toEntity() {
        return Anuncio.builder()
                .id(this.id)
                .titulo(this.titulo)
                .contenido(this.contenido)
                .fechaPublicacion(this.fechaPublicacion)
                .fechaExpiracion(this.fechaExpiracion)
                .autorId(this.autorId)
                .autorNombre(this.autorNombre)
                .importante(this.importante)
                .categoria(this.categoria)
                .clasesDestinatarias(this.clasesDestinatarias)
                .usuariosDestinatarios(this.usuariosDestinatarios)
                .build();
    }
} 