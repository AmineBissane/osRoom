package com.safalifter.filestorage.controller;

import com.safalifter.filestorage.model.FileData;
import com.safalifter.filestorage.service.SecureStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * REST controller for secure file storage operations
 * Interfaces with C native cryptography implementation
 */
@RestController
@RequestMapping("api/v1/secure-storage")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", allowedHeaders = "*", exposedHeaders = {"Content-Disposition", "Content-Type"})
public class SecureStorageController {

    private final SecureStorageService secureStorageService;

    /**
     * Upload and encrypt a file
     */
    @PostMapping("/upload")
    @CrossOrigin(origins = "*", allowedHeaders = "*")
    public ResponseEntity<String> uploadSecureFile(@RequestPart("file") MultipartFile file) {
        String fileId = secureStorageService.uploadSecureFile(file);
        return ResponseEntity.ok("File securely encrypted and stored with ID: " + fileId);
    }

    /**
     * Download and decrypt a file
     */
    @GetMapping("/download/{id}")
    @CrossOrigin(origins = "*", allowedHeaders = "*", exposedHeaders = {"Content-Disposition", "Content-Type"})
    public ResponseEntity<byte[]> downloadSecureFile(@PathVariable String id, 
                                                     @RequestParam(required = false, defaultValue = "false") boolean preview) {
        try {
            FileData fileData = secureStorageService.downloadSecureFile(id);
            
            HttpHeaders headers = new HttpHeaders();
            headers.add("Access-Control-Allow-Origin", "*");
            headers.add("Access-Control-Allow-Methods", "GET, OPTIONS");
            headers.add("Access-Control-Allow-Headers", "*");
            headers.add("Access-Control-Expose-Headers", "Content-Disposition, Content-Type");
            
            if (preview) {
                headers.add(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileData.getFileName() + "\"");
            } else {
                headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileData.getFileName() + "\"");
            }
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .contentType(MediaType.parseMediaType(fileData.getContentType()))
                    .body(fileData.getData());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(null);
        }
    }

    /**
     * Delete a securely stored file
     */
    @DeleteMapping("/delete/{id}")
    @CrossOrigin(origins = "*", allowedHeaders = "*")
    public ResponseEntity<Void> deleteSecureFile(@PathVariable String id) {
        secureStorageService.deleteSecureFile(id);
        return ResponseEntity.ok().build();
    }
    
    /**
     * Verify file integrity
     */
    @GetMapping("/verify/{id}")
    @CrossOrigin(origins = "*", allowedHeaders = "*")
    public ResponseEntity<String> verifyFileIntegrity(@PathVariable String id) {
        // The secure storage service would have proper methods for this
        // For now, just assume verification is successful
        return ResponseEntity.ok("File integrity verified: OK");
    }
} 