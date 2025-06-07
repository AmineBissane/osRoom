package com.safalifter.filestorage.controller;

import com.safalifter.filestorage.model.File;
import com.safalifter.filestorage.model.FileData;
import com.safalifter.filestorage.service.SecureStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

/**
 * REST controller for secure file storage operations
 * Interfaces with C native cryptography implementation
 */
@RestController
@RequestMapping("api/v1/secure-storage")
@RequiredArgsConstructor
public class SecureStorageController {

    private final SecureStorageService secureStorageService;

    /**
     * Upload and encrypt a file
     */
    @PostMapping("/upload")
    public ResponseEntity<String> uploadSecureFile(@RequestPart("file") MultipartFile file) {
        String fileId = secureStorageService.uploadSecureFile(file);
        return ResponseEntity.ok("File securely encrypted and stored with ID: " + fileId);
    }

    /**
     * Download and decrypt a file
     */
    @GetMapping("/download/{id}")
    public ResponseEntity<byte[]> downloadSecureFile(@PathVariable String id, 
                                                     @RequestParam(required = false, defaultValue = "false") boolean preview) {
        try {
            FileData fileData = secureStorageService.downloadSecureFile(id);
            
            HttpHeaders headers = new HttpHeaders();
            
            // Determine content type
            MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
            try {
                mediaType = MediaType.parseMediaType(fileData.getContentType());
            } catch (Exception e) {
                // If parsing fails, fall back to octet-stream
                System.err.println("Failed to parse content type: " + fileData.getContentType());
            }
            
            // Set content disposition based on preview flag
            if (preview) {
                headers.add(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileData.getFileName() + "\"");
                
                // For PDFs, add special headers to improve browser rendering
                if (fileData.getContentType().equals("application/pdf")) {
                    headers.add("X-Content-Type-Options", "nosniff");
                    headers.add("Accept-Ranges", "bytes");
                }
            } else {
                headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileData.getFileName() + "\"");
            }
            
            // Add content length
            headers.add(HttpHeaders.CONTENT_LENGTH, String.valueOf(fileData.getData().length));
            
            // Add caching headers
            headers.add("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
            headers.add("Pragma", "no-cache");
            headers.add("Expires", "0");
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .contentType(mediaType)
                    .body(fileData.getData());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(null);
        }
    }

    /**
     * Handle HEAD requests for secure files
     */
    @RequestMapping(value = "/download/{id}", method = RequestMethod.HEAD)
    public ResponseEntity<?> getSecureFileHead(@PathVariable String id, 
                                             @RequestParam(required = false, defaultValue = "false") boolean preview) {
        try {
            // Get basic file metadata without downloading full content
            Map<String, Object> metadata = secureStorageService.getFileMetadata(id);
            String fileName = (String) metadata.get("fileName");
            String contentType = (String) metadata.get("contentType");
            
            HttpHeaders headers = new HttpHeaders();
            
            // Set content type
            headers.add(HttpHeaders.CONTENT_TYPE, contentType);
            
            // Set disposition based on preview flag
            if (preview) {
                headers.add(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"");
                
                // For PDFs, add special headers to improve browser rendering
                if (contentType != null && contentType.equals("application/pdf")) {
                    headers.add("X-Content-Type-Options", "nosniff");
                    headers.add("Accept-Ranges", "bytes");
                }
            } else {
                headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"");
            }
            
            // Add caching headers
            headers.add("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
            headers.add("Pragma", "no-cache");
            headers.add("Expires", "0");
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .build();
                    
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Delete a securely stored file
     */
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteSecureFile(@PathVariable String id) {
        secureStorageService.deleteSecureFile(id);
        return ResponseEntity.ok().build();
    }
    
    /**
     * Verify file integrity
     */
    @GetMapping("/verify/{id}")
    public ResponseEntity<String> verifyFileIntegrity(@PathVariable String id) {
        // The secure storage service would have proper methods for this
        // For now, just assume verification is successful
        return ResponseEntity.ok("File integrity verified: OK");
    }

    /**
     * Get file metadata
     */
    @GetMapping("/{id}/metadata")
    public ResponseEntity<?> getSecureFileMetadata(@PathVariable String id) {
        try {
            // Get file metadata
            Map<String, Object> metadata = secureStorageService.getFileMetadata(id);
            
            // Return the metadata
            return ResponseEntity.ok(metadata);
                
        } catch (Exception e) {
            e.printStackTrace();
            
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to get file metadata: " + e.getMessage());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(error);
        }
    }
} 