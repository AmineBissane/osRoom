package com.example.classrooms.models;

import lombok.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Activities {

    private String Title;
    private String Description;
    private Date CreationDate;
    private Date LimitDate;
    private MultipartFile file;
}
