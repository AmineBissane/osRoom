package com.osroom.gestionnap.service;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import com.osroom.gestionnap.model.Calificacion;
import com.osroom.gestionnap.model.RegistroAsistencia;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PdfGeneratorService {

    // Generar PDF de calificaciones para un estudiante
    public byte[] generarPdfCalificaciones(List<Calificacion> calificaciones, Map<String, Object> datosEstudiante, String periodo) {
        Document document = null;
        ByteArrayOutputStream baos = null;
        
        try {
            System.out.println("Iniciando generación de PDF...");
            
            // Create document with explicit page size and margins
            document = new Document(PageSize.A4, 36, 36, 54, 36); // left, right, top, bottom margins
            baos = new ByteArrayOutputStream();
            PdfWriter writer = PdfWriter.getInstance(document, baos);
            
            // Set some document properties for better handling
            writer.setStrictImageSequence(true);
            writer.setPdfVersion(PdfWriter.PDF_VERSION_1_7);
            writer.setCompressionLevel(9); // Maximum compression
            
            document.open();
            
            // Título
            Font titleFont = new Font(Font.FontFamily.HELVETICA, 18, Font.BOLD, BaseColor.DARK_GRAY);
            Paragraph title = new Paragraph("Boletín de Calificaciones", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(Chunk.NEWLINE);
            
            // Información del estudiante
            Font subtitleFont = new Font(Font.FontFamily.HELVETICA, 14, Font.BOLD, BaseColor.DARK_GRAY);
            document.add(new Paragraph("Información del Estudiante", subtitleFont));
            
            // Safely get student data with fallbacks for null values
            String firstName = (String) datosEstudiante.getOrDefault("firstName", "");
            String lastName = (String) datosEstudiante.getOrDefault("lastName", "");
            String studentId = (String) datosEstudiante.getOrDefault("id", "");
            
            Font normalFont = new Font(Font.FontFamily.HELVETICA, 12, Font.NORMAL);
            document.add(new Paragraph("Nombre: " + firstName + " " + lastName, normalFont));
            document.add(new Paragraph("ID: " + studentId, normalFont));
            document.add(new Paragraph("Periodo: " + (periodo != null ? periodo : "Todos"), normalFont));
            document.add(Chunk.NEWLINE);
            
            // Tabla de calificaciones
            PdfPTable table = new PdfPTable(5);
            table.setWidthPercentage(100);
            table.setSpacingBefore(10f);
            table.setSpacingAfter(10f);
            
            try {
                // Set relative column widths
                table.setWidths(new float[]{3, 2, 2, 2, 4});
            } catch (DocumentException e) {
                System.err.println("Error setting table widths: " + e.getMessage());
            }
            
            // Encabezados
            Font headerFont = new Font(Font.FontFamily.HELVETICA, 12, Font.BOLD, BaseColor.WHITE);
            PdfPCell headerCell = new PdfPCell();
            headerCell.setBackgroundColor(BaseColor.DARK_GRAY);
            headerCell.setPadding(5);
            
            headerCell.setPhrase(new Phrase("Clase", headerFont));
            table.addCell(headerCell);
            
            headerCell.setPhrase(new Phrase("Tipo", headerFont));
            table.addCell(headerCell);
            
            headerCell.setPhrase(new Phrase("Calificación", headerFont));
            table.addCell(headerCell);
            
            headerCell.setPhrase(new Phrase("Fecha", headerFont));
            table.addCell(headerCell);
            
            headerCell.setPhrase(new Phrase("Comentarios", headerFont));
            table.addCell(headerCell);
            
            // Datos
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            
            // Add each grade with error handling for each cell
            for (Calificacion calificacion : calificaciones) {
                try {
                    // Clase
                    String claseNombre = calificacion.getClaseNombre();
                    if (claseNombre == null) {
                        claseNombre = calificacion.getClassroomName();
                        if (claseNombre == null) claseNombre = "N/A";
                    }
                    table.addCell(claseNombre);
                    
                    // Tipo
                    String tipo = calificacion.getTipo();
                    table.addCell(tipo != null ? tipo : "N/A");
                    
                    // Calificación
                    Double valor = calificacion.getValor();
                    Double valorMaximo = calificacion.getValorMaximo();
                    if (valor == null) valor = 0.0;
                    if (valorMaximo == null) valorMaximo = 10.0;
                    table.addCell(String.format("%.2f / %.2f", valor, valorMaximo));
                    
                    // Fecha
                    try {
                        table.addCell(calificacion.getFecha().format(dateFormatter));
                    } catch (Exception e) {
                        table.addCell("N/A");
                    }
                    
                    // Comentarios
                    table.addCell(calificacion.getComentarios() != null ? calificacion.getComentarios() : "");
                } catch (Exception e) {
                    System.err.println("Error adding row to PDF table: " + e.getMessage());
                    // Add empty cells if there's an error
                    for (int i = 0; i < 5; i++) {
                        table.addCell("Error");
                    }
                }
            }
            
            document.add(table);
            
            // Agregar promedio con error handling
            double promedio = 0;
            try {
                promedio = calificaciones.stream()
                    .filter(c -> c.getValor() != null && c.getValorMaximo() != null && c.getValorMaximo() > 0)
                    .mapToDouble(c -> c.getValor() / c.getValorMaximo() * 10)
                    .average()
                    .orElse(0);
            } catch (Exception e) {
                System.err.println("Error calculating average: " + e.getMessage());
            }
            
            Font promedioFont = new Font(Font.FontFamily.HELVETICA, 14, Font.BOLD, BaseColor.DARK_GRAY);
            Paragraph promedioParrafo = new Paragraph("Promedio: " + String.format("%.2f", promedio), promedioFont);
            promedioParrafo.setAlignment(Element.ALIGN_RIGHT);
            document.add(promedioParrafo);
            
            document.close();
            writer.close();
            
            return baos.toByteArray();
        } catch (Exception e) {
            System.err.println("Error generando PDF: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error al generar PDF de calificaciones: " + e.getMessage(), e);
        } finally {
            // Ensure resources are closed properly
            if (document != null && document.isOpen()) {
                document.close();
            }
            if (baos != null) {
                try {
                    baos.close();
                } catch (Exception e) {
                    System.err.println("Error closing ByteArrayOutputStream: " + e.getMessage());
                }
            }
        }
    }
    
    // Generar PDF de asistencia para un estudiante
    public byte[] generarPdfAsistencia(List<RegistroAsistencia> registros, Map<String, Object> datosEstudiante, 
                                      String periodo, Map<String, Object> datosClase) {
        try {
            Document document = new Document(PageSize.A4);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PdfWriter.getInstance(document, baos);
            
            document.open();
            
            // Título
            Font titleFont = new Font(Font.FontFamily.HELVETICA, 18, Font.BOLD, BaseColor.DARK_GRAY);
            Paragraph title = new Paragraph("Registro de Asistencia", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(Chunk.NEWLINE);
            
            // Información del estudiante y clase
            Font subtitleFont = new Font(Font.FontFamily.HELVETICA, 14, Font.BOLD, BaseColor.DARK_GRAY);
            document.add(new Paragraph("Información del Estudiante", subtitleFont));
            
            Font normalFont = new Font(Font.FontFamily.HELVETICA, 12, Font.NORMAL);
            document.add(new Paragraph("Nombre: " + datosEstudiante.getOrDefault("firstName", "") + " " + 
                                      datosEstudiante.getOrDefault("lastName", ""), normalFont));
            document.add(new Paragraph("ID: " + datosEstudiante.getOrDefault("id", ""), normalFont));
            document.add(new Paragraph("Clase: " + datosClase.getOrDefault("name", ""), normalFont));
            document.add(new Paragraph("Periodo: " + periodo, normalFont));
            document.add(Chunk.NEWLINE);
            
            // Tabla de asistencias
            PdfPTable table = new PdfPTable(4);
            table.setWidthPercentage(100);
            table.setSpacingBefore(10f);
            table.setSpacingAfter(10f);
            
            // Encabezados
            Font headerFont = new Font(Font.FontFamily.HELVETICA, 12, Font.BOLD, BaseColor.WHITE);
            PdfPCell headerCell = new PdfPCell();
            headerCell.setBackgroundColor(BaseColor.DARK_GRAY);
            headerCell.setPadding(5);
            
            headerCell.setPhrase(new Phrase("Fecha", headerFont));
            table.addCell(headerCell);
            
            headerCell.setPhrase(new Phrase("Estado", headerFont));
            table.addCell(headerCell);
            
            headerCell.setPhrase(new Phrase("Hora", headerFont));
            table.addCell(headerCell);
            
            headerCell.setPhrase(new Phrase("Observaciones", headerFont));
            table.addCell(headerCell);
            
            // Datos
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
            
            for (RegistroAsistencia registro : registros) {
                table.addCell(registro.getFecha().format(dateFormatter));
                
                PdfPCell estadoCell = new PdfPCell(new Phrase(registro.getEstado()));
                switch (registro.getEstado()) {
                    case "PRESENTE":
                        estadoCell.setBackgroundColor(new BaseColor(200, 255, 200)); // Verde claro
                        break;
                    case "AUSENTE":
                        estadoCell.setBackgroundColor(new BaseColor(255, 200, 200)); // Rojo claro
                        break;
                    case "TARDANZA":
                        estadoCell.setBackgroundColor(new BaseColor(255, 255, 200)); // Amarillo claro
                        break;
                    case "JUSTIFICADO":
                        estadoCell.setBackgroundColor(new BaseColor(200, 200, 255)); // Azul claro
                        break;
                }
                table.addCell(estadoCell);
                
                table.addCell(registro.getHoraRegistro().format(timeFormatter));
                table.addCell(registro.getObservaciones() != null ? registro.getObservaciones() : "");
            }
            
            document.add(table);
            
            // Estadísticas
            long presentes = registros.stream().filter(r -> r.getEstado().equals("PRESENTE")).count();
            long ausentes = registros.stream().filter(r -> r.getEstado().equals("AUSENTE")).count();
            long tardanzas = registros.stream().filter(r -> r.getEstado().equals("TARDANZA")).count();
            long justificados = registros.stream().filter(r -> r.getEstado().equals("JUSTIFICADO")).count();
            double porcentajeAsistencia = (double) (presentes + tardanzas) / registros.size() * 100;
            
            document.add(new Paragraph("Resumen:", subtitleFont));
            document.add(new Paragraph("Total de clases: " + registros.size(), normalFont));
            document.add(new Paragraph("Presentes: " + presentes, normalFont));
            document.add(new Paragraph("Ausentes: " + ausentes, normalFont));
            document.add(new Paragraph("Tardanzas: " + tardanzas, normalFont));
            document.add(new Paragraph("Justificados: " + justificados, normalFont));
            
            Font promedioFont = new Font(Font.FontFamily.HELVETICA, 14, Font.BOLD, BaseColor.DARK_GRAY);
            Paragraph promedioParrafo = new Paragraph("Porcentaje de Asistencia: " + String.format("%.2f%%", porcentajeAsistencia), promedioFont);
            promedioParrafo.setAlignment(Element.ALIGN_RIGHT);
            document.add(promedioParrafo);
            
            document.close();
            return baos.toByteArray();
            
        } catch (Exception e) {
            throw new RuntimeException("Error al generar PDF de asistencia", e);
        }
    }
} 