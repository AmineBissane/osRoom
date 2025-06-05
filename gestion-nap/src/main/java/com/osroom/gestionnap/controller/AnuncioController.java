package com.osroom.gestionnap.controller;

import com.osroom.gestionnap.dto.AnuncioDTO;
import com.osroom.gestionnap.model.Anuncio;
import com.osroom.gestionnap.service.AnuncioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/anuncios")
@RequiredArgsConstructor
public class AnuncioController {

    private final AnuncioService anuncioService;

    @GetMapping
    public ResponseEntity<List<AnuncioDTO>> getAllAnuncios() {
        List<Anuncio> anuncios = anuncioService.getAllAnuncios();
        return ResponseEntity.ok(AnuncioDTO.fromEntities(anuncios));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AnuncioDTO> getAnuncioById(@PathVariable Long id) {
        Anuncio anuncio = anuncioService.getAnuncioById(id);
        if (anuncio != null) {
            return ResponseEntity.ok(AnuncioDTO.fromEntity(anuncio));
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<AnuncioDTO> createAnuncio(
            @RequestBody AnuncioDTO anuncioDTO,
            @RequestHeader("Authorization") String authHeader) {
        
        // La fecha de publicación se establece automáticamente en el servicio
        Anuncio anuncio = anuncioService.createAnuncio(anuncioDTO.toEntity());
        return ResponseEntity.ok(AnuncioDTO.fromEntity(anuncio));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AnuncioDTO> updateAnuncio(
            @PathVariable Long id,
            @RequestBody AnuncioDTO anuncioDTO,
            @RequestHeader("Authorization") String authHeader) {
        
        Anuncio anuncio = anuncioService.updateAnuncio(id, anuncioDTO.toEntity());
        if (anuncio != null) {
            return ResponseEntity.ok(AnuncioDTO.fromEntity(anuncio));
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAnuncio(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {
        
        anuncioService.deleteAnuncio(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/categoria/{categoria}")
    public ResponseEntity<List<AnuncioDTO>> getAnunciosByCategoria(@PathVariable String categoria) {
        List<Anuncio> anuncios = anuncioService.getAnunciosByCategoria(categoria);
        return ResponseEntity.ok(AnuncioDTO.fromEntities(anuncios));
    }

    @GetMapping("/vigentes")
    public ResponseEntity<List<AnuncioDTO>> getAnunciosVigentes() {
        List<Anuncio> anuncios = anuncioService.getAnunciosVigentes();
        return ResponseEntity.ok(AnuncioDTO.fromEntities(anuncios));
    }

    @GetMapping("/importantes")
    public ResponseEntity<List<AnuncioDTO>> getAnunciosImportantes() {
        List<Anuncio> anuncios = anuncioService.getAnunciosImportantes();
        return ResponseEntity.ok(AnuncioDTO.fromEntities(anuncios));
    }

    @GetMapping("/clase/{claseId}")
    public ResponseEntity<List<AnuncioDTO>> getAnunciosByClaseId(@PathVariable Long claseId) {
        List<Anuncio> anuncios = anuncioService.getAnunciosByClaseId(claseId);
        return ResponseEntity.ok(AnuncioDTO.fromEntities(anuncios));
    }

    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<AnuncioDTO>> getAnunciosByUsuarioId(@PathVariable String usuarioId) {
        List<Anuncio> anuncios = anuncioService.getAnunciosByUsuarioId(usuarioId);
        return ResponseEntity.ok(AnuncioDTO.fromEntities(anuncios));
    }

    @GetMapping("/relevantes")
    public ResponseEntity<List<AnuncioDTO>> getAnunciosRelevantesForUser(
            @RequestParam String usuarioId,
            @RequestParam List<Long> clasesIds) {
        
        List<Anuncio> anuncios = anuncioService.getAnunciosRelevantesForUser(usuarioId, clasesIds);
        return ResponseEntity.ok(AnuncioDTO.fromEntities(anuncios));
    }
} 