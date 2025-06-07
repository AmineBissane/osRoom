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
            headers.add("Access-Control-Expose-Headers", "Content-Disposition, Content-Type, Content-Length");
            headers.add("Access-Control-Max-Age", "3600");
            
            if (preview) {
                // For preview, use inline disposition
                headers.add(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileData.getFileName() + "\"");
            } else {
                // For download, use attachment disposition
                headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileData.getFileName() + "\"");
            }
            
            // Special handling for text files
            if (isTextFile(fileData.getFileName(), contentType)) {
                // For text files, convert to UTF-8 string and set proper content type
                String textContent = new String(fileData.getData(), StandardCharsets.UTF_8);
                headers.add(HttpHeaders.CONTENT_TYPE, "text/plain; charset=UTF-8");
                return ResponseEntity.ok()
                    .headers(headers)
                    .body(textContent);
            }
            
            // For PDF files, ensure proper content type
            if (contentType.equals("application/pdf")) {
                headers.add(HttpHeaders.CONTENT_TYPE, "application/pdf");
                return ResponseEntity.ok()
                    .headers(headers)
                    .contentLength(fileData.getData().length)
                    .body(fileData.getData());
            }
            
            // For images, ensure proper content type
            if (contentType.startsWith("image/")) {
                headers.add(HttpHeaders.CONTENT_TYPE, contentType);
                return ResponseEntity.ok()
                    .headers(headers)
                    .contentLength(fileData.getData().length)
                    .body(fileData.getData());
            }
            
            // For all other binary files, stream the content
            return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.parseMediaType(contentType))
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
    public ResponseEntity<Map<String, Object>> getFileMetadata(@PathVariable String id) {
        File fileRecord = storageService.findFileById(id);
        
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("id", fileRecord.getId());
        metadata.put("fileName", fileRecord.getOriginalFileName());
        metadata.put("contentType", determineContentType(fileRecord.getOriginalFileName(), fileRecord.getType()));
        
        return ResponseEntity.ok(metadata);
    }
    
    private String determineContentType(String fileName, String defaultType) {
        if (fileName == null) {
            return defaultType != null ? defaultType : "application/octet-stream";
        }
        
        String lowerFileName = fileName.toLowerCase();
        String extension = lowerFileName.lastIndexOf('.') > -1 
            ? lowerFileName.substring(lowerFileName.lastIndexOf('.')) 
            : "";
            
        // Check if it's a text file by extension
        if (TEXT_EXTENSIONS.contains(extension)) {
            return "text/plain; charset=UTF-8";
        }
        
        // Use the default content type if provided and valid
        if (defaultType != null && !defaultType.equals("application/octet-stream")) {
            return defaultType;
        }
        
        // Fallback to common content types based on extension
        switch (extension) {
            case ".pdf": return "application/pdf";
            case ".jpg":
            case ".jpeg": return "image/jpeg";
            case ".png": return "image/png";
            case ".gif": return "image/gif";
            case ".doc": return "application/msword";
            case ".docx": return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            case ".xls": return "application/vnd.ms-excel";
            case ".xlsx": return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            default: return "application/octet-stream";
        }
    }
    
    private boolean isTextFile(String fileName, String contentType) {
        if (contentType == null) {
            return false;
        }
        
        // Check by content type
        boolean isTextByMimetype = TEXT_MIMETYPES.stream()
            .anyMatch(textType -> contentType.toLowerCase().startsWith(textType));
            
        if (isTextByMimetype) {
            return true;
        }
        
        // Check by extension
        if (fileName != null) {
            String lowerFileName = fileName.toLowerCase();
            String extension = lowerFileName.lastIndexOf('.') > -1 
                ? lowerFileName.substring(lowerFileName.lastIndexOf('.')) 
                : "";
            return TEXT_EXTENSIONS.contains(extension);
        }
        
        return false;
    }
}
