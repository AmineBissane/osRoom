package com.osroom.gestionnap.controller;

import com.osroom.gestionnap.model.Calificacion;
import com.osroom.gestionnap.service.CalificacionService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/calificaciones")
@RequiredArgsConstructor
public class CalificacionController {

    private final CalificacionService calificacionService;

    @GetMapping
    public ResponseEntity<List<Calificacion>> getAllCalificaciones(
            @RequestParam(required = false) Integer classroomId,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String search) {
        
        if (classroomId != null && userId != null) {
            return ResponseEntity.ok(calificacionService.getCalificacionesByEstudianteAndClase(userId, classroomId.longValue()));
        } else if (classroomId != null) {
            return ResponseEntity.ok(calificacionService.getCalificacionesByClase(classroomId.longValue()));
        } else if (userId != null) {
            return ResponseEntity.ok(calificacionService.getCalificacionesByEstudiante(userId));
        } else {
            return ResponseEntity.ok(calificacionService.getAllCalificaciones());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Calificacion> getCalificacionById(@PathVariable Long id) {
        return ResponseEntity.ok(calificacionService.getCalificacionById(id));
    }

    @PostMapping
    public ResponseEntity<Calificacion> createCalificacion(@RequestBody Calificacion calificacion) {
        return ResponseEntity.ok(calificacionService.createCalificacion(calificacion));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Calificacion> updateCalificacion(
            @PathVariable Long id,
            @RequestBody Calificacion calificacion) {
        return ResponseEntity.ok(calificacionService.updateCalificacion(id, calificacion));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCalificacion(@PathVariable Long id) {
        calificacionService.deleteCalificacion(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/pdf/{estudianteId}")
    public ResponseEntity<byte[]> generarPdfCalificaciones(
            @PathVariable String estudianteId,
            @RequestParam(required = false) Long claseId,
            @RequestParam(required = false) String periodo,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            System.out.println("Generando PDF para estudiante: " + estudianteId);
            
            // Set a default authorization if none provided (for testing)
            if (authHeader == null || authHeader.isEmpty()) {
                System.out.println("No authorization header provided, using default");
                authHeader = "Bearer test-token";
            }
            
            byte[] pdf = calificacionService.generarPdfCalificaciones(estudianteId, claseId, periodo, authHeader);
            
            if (pdf == null || pdf.length == 0) {
                System.err.println("ERROR: PDF generado tiene tamaño cero");
                return ResponseEntity.noContent().build();
            }
            
            System.out.println("PDF generado correctamente, tamaño: " + pdf.length + " bytes");
            
            // Set appropriate headers for PDF download
            return ResponseEntity.ok()
                    .header("Content-Type", "application/pdf")
                    .header("Content-Disposition", "attachment; filename=calificaciones_" + estudianteId + ".pdf")
                    .header("Access-Control-Expose-Headers", "Content-Disposition")
                    .header("Content-Length", String.valueOf(pdf.length))
                    .body(pdf);
        } catch (Exception e) {
            System.err.println("Error al generar PDF: " + e.getMessage());
            e.printStackTrace();
            
            // Return a plain text error message instead of throwing an exception
            String errorMessage = "Error al generar PDF: " + e.getMessage();
            return ResponseEntity.status(500)
                    .header("Content-Type", "text/plain;charset=UTF-8")
                    .body(errorMessage.getBytes());
        }
    }

    @GetMapping("/pdf")
    public ResponseEntity<byte[]> generarPdfTodasCalificaciones(
            @RequestParam(required = false) Long claseId,
            @RequestParam(required = false) String periodo,
            @RequestHeader("Authorization") String authHeader) {
        // This would typically return a PDF with all grades, possibly filtered by class or period
        // For now, we'll just return an empty implementation
        // In a real implementation, you'd want to implement this in the service
        return ResponseEntity.ok()
                .header("Content-Type", "application/pdf")
                .header("Content-Disposition", "attachment; filename=todas_calificaciones.pdf")
                .body(new byte[0]);
    }
} 