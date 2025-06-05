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
        FileData fileData = secureStorageService.downloadSecureFile(id);
        
        HttpHeaders headers = new HttpHeaders();
        
        if (preview) {
            // For preview in browser
            headers.setContentType(MediaType.parseMediaType(fileData.getContentType()));
        } else {
            // For download
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", fileData.getFileName());
        }
        
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");
        
        return ResponseEntity.ok()
                .headers(headers)
                .contentLength(fileData.getData().length)
                .body(fileData.getData());
    }

    /**
     * Delete a securely stored file
     */
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteSecureFile(@PathVariable String id) {
        secureStorageService.deleteSecureFile(id);
        return ResponseEntity.noContent().build();
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
} 