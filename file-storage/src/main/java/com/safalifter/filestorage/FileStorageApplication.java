package com.safalifter.filestorage;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@SpringBootApplication
@EnableEurekaClient
public class FileStorageApplication {

    public static void main(String[] args) {
        SpringApplication.run(FileStorageApplication.class, args);
    }
    
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                // First, add a permissive configuration for direct browser access
                registry.addMapping("/api/v1/file-storage/download/**")
                        .allowedOrigins("*")
                        .allowedMethods("GET", "HEAD", "OPTIONS")
                        .allowedHeaders("*")
                        .exposedHeaders("Content-Disposition", "Content-Type", "Content-Length")
                        .allowCredentials(false)
                        .maxAge(3600);
                
                // Then, add a more strict configuration for authenticated requests
                registry.addMapping("/**")
                        .allowedOriginPatterns("*")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD")
                        .allowedHeaders("*")
                        .exposedHeaders("Content-Disposition", "Content-Type", "Content-Length")
                        .allowCredentials(true)
                        .maxAge(3600);
                
                System.out.println("CORS configuration applied to all endpoints");
            }
        };
    }
}