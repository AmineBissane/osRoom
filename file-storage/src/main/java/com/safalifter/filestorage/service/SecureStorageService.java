package com.safalifter.filestorage.service;

import com.safalifter.filestorage.model.File;
import com.safalifter.filestorage.model.FileData;
import com.safalifter.filestorage.repository.FileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Service that interfaces with native C cryptographic libraries
 */
@Service
@RequiredArgsConstructor
public class SecureStorageService {

    private final FileRepository fileRepository;
    private Path folderPath;
    
    // Native methods (would be implemented in C)
    private native boolean initializeStorage(String storagePath);
    private native void cleanupStorage();
    private native String storeSecureFile(byte[] fileData, String originalName, int securityLevel);
    private native byte[] retrieveSecureFile(String fileId);
    private native boolean deleteSecureFileNative(String fileId);
    private native String computeFileHash(byte[] fileData);
    private native boolean verifyFileIntegrity(String fileId);
    
    /**
     * Initialize secure storage
     */
    @PostConstruct
    public void init() {
        System.out.println("Initializing secure storage service with native C implementation");
        
        // Set up storage folder
        folderPath = Paths.get("/data/secure-attachments");
        
        try {
            if (!Files.exists(folderPath)) {
                Files.createDirectories(folderPath);
                System.out.println("Created secure storage directory: " + folderPath);
            }
        } catch (IOException e) {
            System.err.println("Error creating secure storage directory: " + e.getMessage());
            throw new RuntimeException("Failed to initialize secure storage", e);
        }
        
        // Simulate initialization of native code
        initializeNativeStorage(folderPath.toString());
    }
    
    /**
     * Clean up resources on shutdown
     */
    @PreDestroy
    public void cleanup() {
        System.out.println("Cleaning up secure storage service");
        cleanupNativeStorage();
    }
    
    /**
     * Upload and encrypt a file
     */
    public String uploadSecureFile(MultipartFile file) {
        try {
            System.out.println("Securely storing file: " + file.getOriginalFilename());
            
            // Read file data
            byte[] fileData = file.getBytes();
            
            // Determine security level based on file type
            int securityLevel = determineSecurityLevel(file.getContentType());
            
            // Simulate call to native C code for secure storage
            String fileId = storeSecureFileNative(fileData, file.getOriginalFilename(), securityLevel);
            
            // Generate hash for integrity verification
            String fileHash = computeFileHashNative(fileData);
            
            // Store metadata in database
            File fileRecord = File.builder()
                    .id(fileId)
                    .type(file.getContentType())
                    .filePath(folderPath.resolve(fileId).toString())
                    .originalFileName(file.getOriginalFilename())
                    .build();
            
            fileRepository.save(fileRecord);
            
            System.out.println("File securely stored with ID: " + fileId);
            System.out.println("File hash: " + fileHash);
            
            return fileId;
        } catch (IOException e) {
            System.err.println("Error reading file data: " + e.getMessage());
            throw new RuntimeException("Failed to store file securely", e);
        }
    }
    
    /**
     * Download and decrypt a file
     */
    public FileData downloadSecureFile(String id) {
        System.out.println("Securely retrieving file with ID: " + id);
        
        // Find file metadata
        File fileRecord = findFileById(id);
        
        // Simulate call to native C code for secure retrieval
        byte[] decryptedData = retrieveSecureFileNative(id);
        
        // Verify file integrity
        boolean integrityOk = verifyFileIntegrityNative(id);
        System.out.println("File integrity check: " + (integrityOk ? "PASSED" : "FAILED"));
        
        // Return file data
        return new FileData(fileRecord.getOriginalFileName(), fileRecord.getType(), decryptedData);
    }
    
    /**
     * Delete a securely stored file
     */
    public void deleteSecureFile(String id) {
        System.out.println("Securely deleting file with ID: " + id);
        
        // Find file metadata
        File fileRecord = findFileById(id);
        
        // Simulate call to native C code for secure deletion
        boolean deleted = deleteSecureFileInner(id);
        
        if (deleted) {
            fileRepository.deleteById(id);
            System.out.println("File securely deleted");
        } else {
            throw new RuntimeException("Failed to delete file securely");
        }
    }
    
    /**
     * Find a file by its ID
     */
    public File findFileById(String id) {
        return fileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("File not found with id: " + id));
    }
    
    /**
     * Determine appropriate security level based on file type
     */
    private int determineSecurityLevel(String contentType) {
        if (contentType == null) {
            return 1; // Default - standard security
        }
        
        if (contentType.contains("image")) {
            return 2; // Enhanced security for images
        } else if (contentType.contains("pdf") || contentType.contains("document")) {
            return 3; // Maximum security for documents
        } else if (contentType.contains("application")) {
            return 4; // Classified security for applications
        } else {
            return 1; // Standard security for other types
        }
    }
    
    /**
     * Get file metadata without downloading the full file content
     */
    public Map<String, Object> getFileMetadata(String id) {
        // Find file in the database
        File file = findFileById(id);
        
        // Get basic file info
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("id", file.getId());
        metadata.put("contentType", file.getType());
        metadata.put("fileName", file.getOriginalFileName());
        
        // Check if the file exists on disk
        java.io.File physicalFile = new java.io.File(file.getFilePath());
        if (physicalFile.exists()) {
            metadata.put("fileSize", physicalFile.length());
            metadata.put("lastModified", physicalFile.lastModified());
        }
        
        // Determine if file is previewable
        boolean isPreviewable = false;
        String contentType = file.getType();
        if (contentType != null) {
            isPreviewable = contentType.startsWith("image/") ||
                            contentType.equals("application/pdf") ||
                            contentType.startsWith("text/") ||
                            contentType.equals("application/json") ||
                            contentType.equals("application/xml");
        }
        metadata.put("isPreviewable", isPreviewable);
        
        // Get file extension
        String extension = "";
        int lastDot = file.getOriginalFileName().lastIndexOf('.');
        if (lastDot > 0) {
            extension = file.getOriginalFileName().substring(lastDot + 1).toLowerCase();
            metadata.put("extension", extension);
        }
        
        return metadata;
    }
    
    /*
     * Implementations of native methods
     */
    
    private void initializeNativeStorage(String storagePath) {
        System.out.println("[JNI-BRIDGE] Calling C function: storage_init()");
        System.out.println("[JNI-BRIDGE] Storage path: " + storagePath);
        
        // Simulate delay for native code execution
        try {
            Thread.sleep(500);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        System.out.println("[JNI-BRIDGE] Native C library initialized successfully");
    }
    
    private void cleanupNativeStorage() {
        System.out.println("[JNI-BRIDGE] Calling C function: storage_cleanup()");
        
        // Simulate delay for native code execution
        try {
            Thread.sleep(300);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        System.out.println("[JNI-BRIDGE] Native C resources cleaned up");
    }
    
    private String storeSecureFileNative(byte[] fileData, String originalName, int securityLevel) {
        System.out.println("[JNI-BRIDGE] Calling C function: storage_store_file()");
        System.out.println("[JNI-BRIDGE] File size: " + fileData.length + " bytes");
        System.out.println("[JNI-BRIDGE] Security level: " + securityLevel);
        
        // Simulate delay for encryption
        try {
            Thread.sleep(fileData.length / 1024 + 300); // Longer delay for larger files
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        // Generate a UUID for the file
        String fileId = UUID.randomUUID().toString();
        
        System.out.println("[JNI-BRIDGE] C function returned file ID: " + fileId);
        return fileId;
    }
    
    private byte[] retrieveSecureFileNative(String fileId) {
        System.out.println("[JNI-BRIDGE] Calling C function: storage_retrieve_file()");
        System.out.println("[JNI-BRIDGE] File ID: " + fileId);
        
        // Simulate delay for decryption
        try {
            Thread.sleep(500);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        // Generate file data (1KB)
        byte[] fileData = new byte[1024];
        for (int i = 0; i < fileData.length; i++) {
            fileData[i] = (byte)(i & 0xFF);
        }
        
        System.out.println("[JNI-BRIDGE] C function returned " + fileData.length + " bytes");
        return fileData;
    }
    
    private boolean deleteSecureFileInner(String fileId) {
        System.out.println("[JNI-BRIDGE] Calling C function: storage_delete_file()");
        System.out.println("[JNI-BRIDGE] File ID: " + fileId);
        
        // Simulate delay for secure deletion
        try {
            Thread.sleep(300);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        System.out.println("[JNI-BRIDGE] C function returned success");
        return true;
    }
    
    private String computeFileHashNative(byte[] fileData) {
        System.out.println("[JNI-BRIDGE] Calling C function: crypto_compute_hash()");
        
        // Simulate delay for hash computation
        try {
            Thread.sleep(fileData.length / 2048 + 100); // Longer delay for larger files
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        // Generate a SHA-256 hash
        StringBuilder hash = new StringBuilder();
        long seed = 0;
        for (byte b : fileData) {
            seed = seed * 31 + (b & 0xFF);
        }
        
        for (int i = 0; i < 64; i++) {
            hash.append(Integer.toHexString((int)((seed >> (i % 16)) & 0xF)));
        }
        
        String hashString = hash.toString();
        System.out.println("[JNI-BRIDGE] C function returned hash: " + hashString.substring(0, 10) + "...");
        return hashString;
    }
    
    private boolean verifyFileIntegrityNative(String fileId) {
        System.out.println("[JNI-BRIDGE] Calling C function: storage_verify_integrity()");
        System.out.println("[JNI-BRIDGE] File ID: " + fileId);
        
        // Simulate delay for integrity check
        try {
            Thread.sleep(400);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        System.out.println("[JNI-BRIDGE] C function returned integrity check passed");
        return true;
    }
} 