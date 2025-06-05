package com.osroom.gestionnap.service;

import com.osroom.gestionnap.model.Anuncio;
import com.osroom.gestionnap.repository.AnuncioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AnuncioService {

    private final AnuncioRepository anuncioRepository;

    @Transactional(readOnly = true)
    public List<Anuncio> getAllAnuncios() {
        return anuncioRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Anuncio getAnuncioById(Long id) {
        return anuncioRepository.findById(id).orElse(null);
    }

    @Transactional
    public Anuncio createAnuncio(Anuncio anuncio) {
        // Establecer la fecha de publicación si no está establecida
        if (anuncio.getFechaPublicacion() == null) {
            anuncio.setFechaPublicacion(LocalDateTime.now());
        }
        
        // Handle case where fechaExpiracion is provided as a date string without time
        if (anuncio.getFechaExpiracion() != null) {
            try {
                // If fechaExpiracion is already a valid LocalDateTime, this will be a no-op
                LocalDateTime fechaExpiracion = anuncio.getFechaExpiracion();
            } catch (Exception e) {
                // This catch block won't be reached with a properly constructed LocalDateTime
                // It's just a safety mechanism in case we need more conversion logic in the future
            }
        }
        
        return anuncioRepository.save(anuncio);
    }

    @Transactional
    public Anuncio updateAnuncio(Long id, Anuncio anuncio) {
        if (anuncioRepository.existsById(id)) {
            anuncio.setId(id);
            return anuncioRepository.save(anuncio);
        }
        return null;
    }

    @Transactional
    public void deleteAnuncio(Long id) {
        anuncioRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<Anuncio> getAnunciosByCategoria(String categoria) {
        return anuncioRepository.findByCategoria(categoria);
    }

    @Transactional(readOnly = true)
    public List<Anuncio> getAnunciosVigentes() {
        return anuncioRepository.findByFechaExpiracionAfterOrFechaExpiracionIsNull(LocalDateTime.now());
    }

    @Transactional(readOnly = true)
    public List<Anuncio> getAnunciosImportantes() {
        return anuncioRepository.findByImportanteTrue();
    }

    @Transactional(readOnly = true)
    public List<Anuncio> getAnunciosByClaseId(Long claseId) {
        return anuncioRepository.findByClaseDestinataria(claseId);
    }

    @Transactional(readOnly = true)
    public List<Anuncio> getAnunciosByUsuarioId(String usuarioId) {
        return anuncioRepository.findByUsuarioDestinatario(usuarioId);
    }

    @Transactional(readOnly = true)
    public List<Anuncio> getAnunciosRelevantesForUser(String usuarioId, List<Long> clasesIds) {
        return anuncioRepository.findRelevantForUser(usuarioId, clasesIds);
    }
} 