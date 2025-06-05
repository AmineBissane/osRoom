package com.safalifter.filestorage.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FileData {
    private String fileName;
    private String contentType;
    private byte[] data;
}
