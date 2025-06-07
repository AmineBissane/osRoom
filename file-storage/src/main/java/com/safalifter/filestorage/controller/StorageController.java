package com.safalifter.filestorage.controller;

import com.safalifter.filestorage.model.File;
import com.safalifter.filestorage.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.core.io.Resource;
import org.springframework.core.io.InputStreamResource;

import com.safalifter.filestorage.model.FileData;
import org.springframework.web.multipart.MultipartFile;
import java.util.HashMap;
import java.util.Map;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("api/v1/file-storage")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", allowedHeaders = "*", exposedHeaders = {"Content-Disposition", "Content-Type"})
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
    @CrossOrigin(origins = "*", allowedHeaders = "*")
    public ResponseEntity<String> uploadFileToFileSystem(@RequestPart("file") MultipartFile file) {
        return ResponseEntity.ok().body(storageService.uploadFile(file));
    }

    @GetMapping("/download/{id}")
    @CrossOrigin(origins = "*", allowedHeaders = "*", exposedHeaders = {"Content-Disposition", "Content-Type"})
    public ResponseEntity<?> downloadFile(@PathVariable String id, @RequestParam(required = false, defaultValue = "false") boolean preview) {
        try {
            var fileData = storageService.downloadFile(id);
            String contentType = determineContentType(fileData.getFileName(), fileData.getContentType());
            
            // Create headers with extensive CORS settings
            HttpHeaders headers = new HttpHeaders();
            headers.add("Access-Control-Allow-Origin", "*");
            headers.add("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
            headers.add("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
            headers.add("Access-Control-Expose-Headers", "Content-Disposition, Content-Type, Content-Length, X-Content-Type-Options");
            headers.add("Access-Control-Max-Age", "3600");
            
            // Set content type based on file extension and detected type
            headers.add(HttpHeaders.CONTENT_TYPE, contentType);
            
            // Set disposition based on preview flag
            if (preview) {
                headers.add(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileData.getFileName() + "\"");
            } else {
                headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileData.getFileName() + "\"");
            }
            
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
                .contentLength(fileData.getData().length)
                .body(fileData.getData());
        } catch (Exception e) {
            // Log the error
            System.err.println("Error downloading file: " + e.getMessage());
            e.printStackTrace();
            
            // Return error response with CORS headers
            HttpHeaders headers = new HttpHeaders();
            headers.add("Access-Control-Allow-Origin", "*");
            headers.add("Access-Control-Allow-Methods", "GET, OPTIONS");
            headers.add("Access-Control-Allow-Headers", "*");
            
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to download file: " + e.getMessage());
            return ResponseEntity.internalServerError()
                .headers(headers)
                .body(error);
        }
    }

    @DeleteMapping("/delete/{id}")
    @CrossOrigin(origins = "*", allowedHeaders = "*")
    public ResponseEntity<Void> deleteFileFromFileSystem(@PathVariable String id) {
        storageService.deleteFile(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/metadata")
    @CrossOrigin(origins = "*", allowedHeaders = "*")
    public ResponseEntity<?> getFileMetadata(@PathVariable String id) {
        try {
            // Find the file by ID
            File file = storageService.findFileById(id);
            
            // Create a response with just the metadata
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("id", file.getId());
            metadata.put("contentType", file.getType());
            metadata.put("fileName", file.getOriginalFileName());
            
            // Add CORS headers
            HttpHeaders headers = new HttpHeaders();
            headers.add("Access-Control-Allow-Origin", "*");
            headers.add("Access-Control-Allow-Methods", "GET, OPTIONS");
            headers.add("Access-Control-Allow-Headers", "*");
            
            // Return the metadata
            return ResponseEntity.ok()
                .headers(headers)
                .body(metadata);
            
        } catch (Exception e) {
            // Log the error
            System.err.println("Error getting file metadata: " + e.getMessage());
            e.printStackTrace();
            
            // Return error response with CORS headers
            HttpHeaders headers = new HttpHeaders();
            headers.add("Access-Control-Allow-Origin", "*");
            headers.add("Access-Control-Allow-Methods", "GET, OPTIONS");
            headers.add("Access-Control-Allow-Headers", "*");
            
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to get file metadata: " + e.getMessage());
            return ResponseEntity.internalServerError()
                .headers(headers)
                .body(error);
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
}
