package com.example.classrooms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class ClassroomsApplication {

	public static void main(String[] args) {
		SpringApplication.run(ClassroomsApplication.class, args);
	}

}
