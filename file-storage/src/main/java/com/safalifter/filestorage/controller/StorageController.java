package com.safalifter.filestorage.controller;

import com.safalifter.filestorage.model.File;
import com.safalifter.filestorage.model.FileData;
import com.safalifter.filestorage.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

// No Cross-Origin annotations at controller level since we have a global CORS configuration
@RestController
@RequestMapping("api/v1/file-storage")
@RequiredArgsConstructor
public class StorageController {
    private final StorageService storageService;
    
    private static final List<String> TEXT_EXTENSIONS = Arrays.asList(
        ".txt", ".log", ".csv", ".md", ".json", ".xml", ".yml", ".yaml", 
        ".js", ".ts", ".jsx", ".tsx", ".html", ".css", ".scss", ".less",
        ".java", ".py", ".rb", ".php", ".c", ".cpp", ".h", ".hpp",
        ".sql", ".sh", ".bash", ".zsh", ".conf", ".ini", ".properties"
    );
    
    private static final List<String> TEXT_MIMETYPES = Arrays.asList(
        "text/", "application/json", "application/javascript", "application/xml",
        "application/x-yaml", "application/x-properties"
    );

    @PostMapping("/upload")
    public ResponseEntity<String> uploadFile(@RequestPart("file") MultipartFile file) {
        return ResponseEntity.ok(storageService.uploadFile(file));
    }

    @GetMapping("/download/{id}")
    public ResponseEntity<?> downloadFile(@PathVariable String id, 
                                         @RequestParam(required = false, defaultValue = "false") boolean preview,
                                         @RequestHeader(value = "Authorization", required = false) String authHeader,
                                         @RequestHeader(value = "Origin", required = false) String origin) {
        try {
            System.out.println("Download request for file ID: " + id);
            System.out.println("Preview mode: " + preview);
            System.out.println("Auth header present: " + (authHeader != null ? "yes" : "no"));
            System.out.println("Origin: " + (origin != null ? origin : "null"));
            
            var fileData = storageService.downloadFile(id);
            String contentType = determineContentType(fileData.getFileName(), fileData.getContentType());
            
            // Log content type for debugging
            System.out.println("Content type: " + contentType);
            System.out.println("File size: " + fileData.getData().length + " bytes");
            
            // Create headers with extensive CORS settings
            HttpHeaders headers = new HttpHeaders();
            
            // When credentials are true, we must reflect the actual origin
            if (origin != null) {
                headers.add("Access-Control-Allow-Origin", origin);
            } else {
                headers.add("Access-Control-Allow-Origin", "http://localhost:3000");
            }
            
            headers.add("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE, HEAD");
            headers.add("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
            headers.add("Access-Control-Expose-Headers", "Content-Disposition, Content-Type, Content-Length, X-Content-Type-Options");
            headers.add("Access-Control-Max-Age", "3600");
            headers.add("Access-Control-Allow-Credentials", "true");
            
            // Set content type based on file extension and detected type
            headers.add(HttpHeaders.CONTENT_TYPE, contentType);
            
            // Add explicit Content-Length for better browser handling
            headers.add(HttpHeaders.CONTENT_LENGTH, String.valueOf(fileData.getData().length));
            
            // Set disposition based on preview flag
            if (preview) {
                headers.add(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileData.getFileName() + "\"");
                
                // For PDFs, add special headers to improve browser rendering
                if (contentType.equals("application/pdf")) {
                    headers.add("X-Content-Type-Options", "nosniff");
                    headers.add("Accept-Ranges", "bytes");
                }
            } else {
                headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileData.getFileName() + "\"");
            }
            
            // Add caching headers to prevent caching issues
            headers.add("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
            headers.add("Pragma", "no-cache");
            headers.add("Expires", "0");
            
            // Allow embedding in iframe
            headers.add("X-Frame-Options", "SAMEORIGIN");
            
            // Special handling for text files
            if (isTextFile(contentType)) {
                String textContent = new String(fileData.getData(), StandardCharsets.UTF_8);
                return ResponseEntity.ok()
                    .headers(headers)
                    .body(textContent);
            }
            
            // For all binary files, stream the content with appropriate content type
            return ResponseEntity.ok()
                .headers(headers)
                .body(fileData.getData());
        } catch (Exception e) {
            // Log the error
            System.err.println("Error downloading file: " + e.getMessage());
            e.printStackTrace();
            
            // Return error response with CORS headers
            HttpHeaders headers = new HttpHeaders();
            
            // When credentials are true, we must reflect the actual origin
            if (origin != null) {
                headers.add("Access-Control-Allow-Origin", origin);
            } else {
                headers.add("Access-Control-Allow-Origin", "http://localhost:3000");
            }
            
            headers.add("Access-Control-Allow-Methods", "GET, OPTIONS, HEAD");
            headers.add("Access-Control-Allow-Headers", "*");
            headers.add("Access-Control-Allow-Credentials", "true");
            
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to download file: " + e.getMessage());
            return ResponseEntity.internalServerError()
                .headers(headers)
                .body(error);
        }
    }

    @RequestMapping(value = "/download/{id}", method = RequestMethod.HEAD)
    public ResponseEntity<?> getFileHead(@PathVariable String id, 
                                        @RequestParam(required = false, defaultValue = "false") boolean preview) {
        try {
            var file = storageService.findFileById(id);
            
            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, preview ? "inline" : "attachment");
            headers.add(HttpHeaders.CONTENT_TYPE, file.getType());
            
            return ResponseEntity.ok().headers(headers).build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteFile(@PathVariable String id) {
        storageService.deleteFile(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/metadata")
    public ResponseEntity<?> getFileMetadata(@PathVariable String id) {
        try {
            return ResponseEntity.ok(storageService.getFileMetadata(id));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Determines the correct content type based on file name and provided content type
     */
    private String determineContentType(String fileName, String providedContentType) {
        // Default content type
        String defaultType = "application/octet-stream";
        
        // If we have a valid content type that's not octet-stream, use it
        if (providedContentType != null && !providedContentType.equals(defaultType)) {
            return providedContentType;
        }
        
        // If we have a filename, try to determine content type from extension
        if (fileName != null) {
            String extension = "";
            int lastDot = fileName.lastIndexOf('.');
            if (lastDot > 0) {
                extension = fileName.substring(lastDot + 1).toLowerCase();
            }
            
            if (!extension.isEmpty()) {
                // Common file types mapping
                Map<String, String> typeMap = new HashMap<>();
                typeMap.put("pdf", "application/pdf");
                typeMap.put("jpg", "image/jpeg");
                typeMap.put("jpeg", "image/jpeg");
                typeMap.put("png", "image/png");
                typeMap.put("gif", "image/gif");
                typeMap.put("svg", "image/svg+xml");
                typeMap.put("webp", "image/webp");
                typeMap.put("txt", "text/plain");
                typeMap.put("html", "text/html");
                typeMap.put("css", "text/css");
                typeMap.put("js", "application/javascript");
                typeMap.put("json", "application/json");
                typeMap.put("xml", "application/xml");
                typeMap.put("csv", "text/csv");
                typeMap.put("doc", "application/msword");
                typeMap.put("docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
                typeMap.put("xls", "application/vnd.ms-excel");
                typeMap.put("xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
                typeMap.put("ppt", "application/vnd.ms-powerpoint");
                typeMap.put("pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation");
                typeMap.put("mp3", "audio/mpeg");
                typeMap.put("mp4", "video/mp4");
                typeMap.put("wav", "audio/wav");
                typeMap.put("ogg", "audio/ogg");
                typeMap.put("webm", "video/webm");
                typeMap.put("zip", "application/zip");
                typeMap.put("rar", "application/x-rar-compressed");
                typeMap.put("tar", "application/x-tar");
                typeMap.put("gz", "application/gzip");
                
                String contentType = typeMap.get(extension);
                if (contentType != null) {
                    return contentType;
                }
            }
        }
        
        return defaultType;
    }
    
    /**
     * Checks if the content type is a text file type
     */
    private boolean isTextFile(String contentType) {
        return contentType != null && (
            contentType.startsWith("text/") ||
            contentType.equals("application/json") ||
            contentType.equals("application/javascript") ||
            contentType.equals("application/xml") ||
            contentType.equals("application/x-yaml")
        );
    }
    
    /**
     * Determines if a file type can be previewed in the browser
     */
    private boolean isPreviewableType(String contentType) {
        if (contentType == null) return false;
        
        return contentType.startsWith("image/") ||
               contentType.equals("application/pdf") ||
               contentType.startsWith("text/") ||
               contentType.equals("application/json") ||
               contentType.equals("application/javascript") ||
               contentType.equals("application/xml");
    }
}
