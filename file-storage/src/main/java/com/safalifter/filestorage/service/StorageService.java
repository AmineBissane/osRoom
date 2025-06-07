package com.safalifter.filestorage.service;

import com.safalifter.filestorage.exc.GenericErrorResponse;
import com.safalifter.filestorage.model.File;
import com.safalifter.filestorage.model.FileData;
import com.safalifter.filestorage.repository.FileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.*;
import java.nio.file.attribute.PosixFilePermission;
import java.util.Set;
import java.util.UUID;
import java.util.Map;
import java.util.HashMap;

@Service
@RequiredArgsConstructor
public class StorageService {

    private final FileRepository fileRepository;
    private Path folderPath;

    @PostConstruct
    public void init() {
        // Use Linux-style path for Docker containers
        folderPath = Paths.get("/data/attachments");

        // Log folder creation
        System.out.println("Storage folder path: " + folderPath.toString());

        // Create directory if it doesn't exist
        try {
            if (!Files.exists(folderPath)) {
                Files.createDirectories(folderPath);
                System.out.println("Created directory: " + folderPath.toString());
            } else {
                System.out.println("Directory already exists: " + folderPath.toString());
            }
        } catch (IOException e) {
            // Log error and provide more details
            System.err.println("Error creating directory: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Unable to create directories: " + folderPath.toString(), e);
        }
    }



    private void setDirectoryPermissions(Path folderPath) throws IOException {
        if (Files.isDirectory(folderPath)) {
            Set<PosixFilePermission> permissions = Files.getPosixFilePermissions(folderPath);

            // Adding write permissions for owner, group, and others
            permissions.add(PosixFilePermission.OWNER_WRITE);
            permissions.add(PosixFilePermission.GROUP_WRITE);
            permissions.add(PosixFilePermission.OTHERS_WRITE);

            Files.setPosixFilePermissions(folderPath, permissions);
            System.out.println("Permissions set for folder: " + folderPath);
        } else {
            System.err.println("Provided path is not a directory: " + folderPath);
        }
    }

    public String uploadFile(MultipartFile file) {
        String uuid = UUID.randomUUID().toString();
        String originalFileName = file.getOriginalFilename();
        String fileExtension = "";

        if (originalFileName != null && originalFileName.contains(".")) {
            fileExtension = originalFileName.substring(originalFileName.lastIndexOf('.'));
        }

        Path filePath = folderPath.resolve(uuid + fileExtension);

        // Log the file path to be saved
        System.out.println("Saving file to path: " + filePath.toString());

        try {
            // Try saving the file
            file.transferTo(filePath.toFile());
        } catch (IOException e) {
            System.err.println("Error during file transfer: " + e.getMessage());
            throw new RuntimeException("Unable to save file to storage", e);
        }

        // Save file info to repository
        fileRepository.save(File.builder()
                .id(uuid)
                .type(file.getContentType())
                .filePath(filePath.toString())
                .originalFileName(originalFileName)
                .build());

        return uuid;
    }

    public FileData downloadFile(String id) {
        File fileRecord = findFileById(id);

        Path filePath = Paths.get(fileRecord.getFilePath());

        try {
            byte[] fileContent = Files.readAllBytes(filePath);
            return new FileData(fileRecord.getOriginalFileName(), fileRecord.getType(), fileContent);
        } catch (IOException e) {
            System.err.println("Error reading file: " + e.getMessage());
            throw new RuntimeException("Unable to read file from storage", e);
        }
    }

    public void deleteFile(String id) {
        File fileRecord = findFileById(id);
        Path filePath = Paths.get(fileRecord.getFilePath());

        try {
            boolean deletionResult = Files.deleteIfExists(filePath);

            if (deletionResult) {
                fileRepository.deleteById(id);
            } else {
                System.err.println("File not found for deletion: " + filePath.toString());
                throw new RuntimeException("Unable to delete file from storage");
            }
        } catch (IOException e) {
            System.err.println("Error while deleting file: " + e.getMessage());
            throw new RuntimeException("Error while deleting file from storage", e);
        }
    }

    public File findFileById(String id) {
        return fileRepository.findById(id).orElseThrow(() ->
                new RuntimeException("File not found with id: " + id));
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
        
        // Check if the file exists on disk and get file size
        java.io.File physicalFile = new java.io.File(file.getFilePath());
        if (physicalFile.exists()) {
            metadata.put("fileSize", physicalFile.length());
            metadata.put("lastModified", physicalFile.lastModified());
        }
        
        // Determine content type more accurately
        String contentType = determineContentType(file.getOriginalFileName(), file.getType());
        metadata.put("detectedContentType", contentType);
        
        // Determine if file is previewable
        boolean isPreviewable = isPreviewableType(contentType);
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
}
