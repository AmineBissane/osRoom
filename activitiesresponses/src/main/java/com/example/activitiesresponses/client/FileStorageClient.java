package com.example.activitiesresponses.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@FeignClient(name = "file-storage", url = "${app.file-storage.url:http://82.29.168.17:8090}", path = "/api/v1/file-storage")
public interface FileStorageClient {

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ResponseEntity<String> uploadFile(@RequestPart("file") MultipartFile file);

    @GetMapping("/download/{id}")
    ResponseEntity<byte[]> downloadFile(@PathVariable String id);

    @DeleteMapping("/delete/{id}")
    ResponseEntity<Void> deleteFile(@PathVariable String id);
} 