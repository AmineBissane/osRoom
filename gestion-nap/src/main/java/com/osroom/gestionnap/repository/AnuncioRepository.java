package com.osroom.gestionnap.repository;

import com.osroom.gestionnap.model.Anuncio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AnuncioRepository extends JpaRepository<Anuncio, Long> {
    
    // Buscar anuncios por categoría
    List<Anuncio> findByCategoria(String categoria);
    
    // Buscar anuncios vigentes (no expirados)
    List<Anuncio> findByFechaExpiracionAfterOrFechaExpiracionIsNull(LocalDateTime fecha);
    
    // Buscar anuncios importantes
    List<Anuncio> findByImportanteTrue();
    
    // Buscar anuncios para una clase específica
    @Query("SELECT a FROM Anuncio a WHERE :claseId MEMBER OF a.clasesDestinatarias")
    List<Anuncio> findByClaseDestinataria(@Param("claseId") Long claseId);
    
    // Buscar anuncios para un usuario específico
    @Query("SELECT a FROM Anuncio a WHERE :usuarioId MEMBER OF a.usuariosDestinatarios")
    List<Anuncio> findByUsuarioDestinatario(@Param("usuarioId") String usuarioId);
    
    // Buscar anuncios relevantes para un usuario (dirigidos a él o a sus clases)
    @Query("SELECT DISTINCT a FROM Anuncio a WHERE " +
           ":usuarioId MEMBER OF a.usuariosDestinatarios OR " +
           "EXISTS (SELECT 1 FROM a.clasesDestinatarias c WHERE c IN :clasesIds) OR " +
           "(a.clasesDestinatarias IS EMPTY AND a.usuariosDestinatarios IS EMPTY)")
    List<Anuncio> findRelevantForUser(@Param("usuarioId") String usuarioId, @Param("clasesIds") List<Long> clasesIds);
} 