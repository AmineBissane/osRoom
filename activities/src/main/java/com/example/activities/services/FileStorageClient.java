package com.example.activities.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Component
public class FileStorageClient {

    private final RestTemplate restTemplate;

    private final String fileStorageUrl = "http://host.docker.internal:8030/api/v1/file-storage/upload";

    @Autowired
    public FileStorageClient(RestTemplateBuilder builder) {
        this.restTemplate = builder.build();
    }

    public String uploadFile(MultipartFile file) throws IOException {
        var headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        var body = new LinkedMultiValueMap<String, Object>();
        body.add("file", new MultipartInputStreamFileResource(file.getInputStream(), file.getOriginalFilename()));

        var requestEntity = new HttpEntity<>(body, headers);
        var response = restTemplate.postForEntity(fileStorageUrl, requestEntity, String.class);

        return response.getBody();
    }
}