package com.osroom.gestionnap.client;

import feign.Logger;
import feign.Request;
import feign.Response;
import feign.codec.ErrorDecoder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.TimeUnit;

@Slf4j
public class KeycloakClientConfig {

    @Bean
    public Logger.Level feignLoggerLevel() {
        return Logger.Level.FULL;
    }

    @Bean
    public Request.Options requestOptions() {
        return new Request.Options(
                10, TimeUnit.SECONDS,  // connectTimeout
                30, TimeUnit.SECONDS,  // readTimeout
                true                  // followRedirects
        );
    }

    @Bean
    public ErrorDecoder errorDecoder() {
        return new KeycloakErrorDecoder();
    }

    public static class KeycloakErrorDecoder implements ErrorDecoder {
        private final ErrorDecoder defaultErrorDecoder = new Default();

        @Override
        public Exception decode(String methodKey, Response response) {
            Request request = response.request();
            log.error("Keycloak API error: method={}, url={}, status={}", 
                      request.httpMethod(), request.url(), response.status());
            
            try {
                if (response.body() != null) {
                    String responseBody = new String(response.body().asInputStream().readAllBytes(), StandardCharsets.UTF_8);
                    log.error("Response body: {}", responseBody);
                }
            } catch (IOException e) {
                log.error("Failed to read response body", e);
            }
            
            if (response.status() == 401 || response.status() == 403) {
                return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized access to Keycloak API");
            } else if (response.status() == 404) {
                return new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found in Keycloak");
            } else if (response.status() >= 500) {
                return new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Keycloak server error");
            }
            
            return defaultErrorDecoder.decode(methodKey, response);
        }
    }
} 