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

    private File findFileById(String id) {
        return fileRepository.findById(id).orElseThrow(() ->
                new RuntimeException("File not found with id: " + id));
    }
}
