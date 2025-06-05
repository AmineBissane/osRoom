package com.example.activitiesresponses;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class ActivitiesresponsesApplication {

	public static void main(String[] args) {
		SpringApplication.run(ActivitiesresponsesApplication.class, args);
	}

}
