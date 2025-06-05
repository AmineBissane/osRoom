package com.osroom.gestionnap.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.List;
import java.util.Map;

@FeignClient(name = "classrooms", url = "${app.services.classrooms-url:http://classrooms:8000}")
public interface ClassroomClient {
    
    @GetMapping("/api/v1/classrooms")
    List<Map<String, Object>> getAllClassrooms(
            @RequestHeader("Authorization") String authHeader);
    
    @GetMapping("/api/v1/classrooms/{id}")
    Map<String, Object> getClassroomById(@PathVariable("id") Long id, @RequestHeader("Authorization") String authHeader);
    
    @GetMapping("/api/v1/classrooms/my-classrooms")
    List<Map<String, Object>> getMyClassrooms(
            @RequestHeader("Authorization") String authHeader);
            
    @GetMapping("/api/v1/classrooms/student/{studentId}")
    List<Map<String, Object>> getClassroomsByStudentId(
            @PathVariable("studentId") String studentId, 
            @RequestHeader("Authorization") String authHeader);
            
    @GetMapping("/api/v1/classrooms/{id}/students")
    List<Map<String, Object>> getStudentsByClassroomId(
            @PathVariable("id") Long id,
            @RequestHeader("Authorization") String authHeader);
} 