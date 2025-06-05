package com.safalifter.filestorage.controller;

import com.safalifter.filestorage.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.safalifter.filestorage.model.FileData;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("api/v1/file-storage")
@RequiredArgsConstructor
public class StorageController {
    private final StorageService storageService;

    @PostMapping("/upload")
    public ResponseEntity<String> uploadFileToFileSystem(@RequestPart("file") MultipartFile file) {
        return ResponseEntity.ok().body(storageService.uploadFile(file));
    }

    @GetMapping("/download/{id}")
    public ResponseEntity<byte[]> downloadFile(@PathVariable String id, @RequestParam(required = false, defaultValue = "false") boolean preview) {
        var fileData = storageService.downloadFile(id);
        
        HttpHeaders headers = new HttpHeaders();
        if (preview) {
            // For preview, use inline disposition to display in browser
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileData.getFileName() + "\"");
        } else {
            // For download, use attachment disposition
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileData.getFileName() + "\"");
        }

        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.parseMediaType(fileData.getContentType()))
                .body(fileData.getData());
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteFileFromFileSystem(@PathVariable String id) {
        storageService.deleteFile(id);
        return ResponseEntity.ok().build();
    }
}
