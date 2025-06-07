package com.alibou.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        return http
                .csrf().disable()
                .authorizeExchange(exchanges -> exchanges
                        .pathMatchers(HttpMethod.OPTIONS, "/**").permitAll() // allow preflight without auth
                        .anyExchange().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt()
                )
                .build();
    }

    @Bean
    public CorsWebFilter corsWebFilter(Environment env) {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        
        // Get active profiles to determine allowed origins
        String[] activeProfiles = env.getActiveProfiles();
        boolean isDevelopment = Arrays.asList(activeProfiles).contains("dev") || 
                               Arrays.asList(activeProfiles).contains("development");
        
        if (isDevelopment) {
            // Development: Allow multiple origins for testing
            config.setAllowedOriginPatterns(Arrays.asList(
                "http://82.29.168.17:*",     // Your main server with any port
                "http://localhost:*",         // Local development
                "http://127.0.0.1:*",        // Local IP
                "file://*",                   // Local HTML files
                "null"                        // For file:// protocol in some browsers
            ));
        } else {
            // Production: Restrict to specific origins
            config.setAllowedOrigins(Arrays.asList(
                "http://82.29.168.17:3000",
                "https://your-production-domain.com"  // Add your production domain
            ));
        }
        
        config.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"
        ));
        
        config.setAllowedHeaders(Arrays.asList(
            "Authorization",
            "Cache-Control",
            "Content-Type",
            "X-Requested-With",
            "Accept",
            "Origin",
            "Access-Control-Request-Method",
            "Access-Control-Request-Headers",
            "X-Forwarded-For",
            "X-Forwarded-Proto",
            "X-Forwarded-Host"
        ));
        
        config.setExposedHeaders(Arrays.asList(
            "Access-Control-Allow-Origin",
            "Access-Control-Allow-Credentials",
            "Access-Control-Allow-Methods",
            "Access-Control-Allow-Headers",
            "Content-Disposition",  // Useful for file downloads
            "Content-Length"
        ));
        
        config.setMaxAge(3600L); // 1 hour cache for preflight responses

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return new CorsWebFilter(source);
    }
}