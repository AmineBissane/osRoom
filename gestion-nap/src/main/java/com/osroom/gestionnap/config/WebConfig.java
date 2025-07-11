package com.osroom.gestionnap.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.format.FormatterRegistry;
import org.springframework.format.datetime.standard.DateTimeFormatterRegistrar;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addFormatters(FormatterRegistry registry) {
        DateTimeFormatterRegistrar registrar = new DateTimeFormatterRegistrar();
        registrar.setUseIsoFormat(true);
        registrar.registerFormatters(registry);
    }

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration corsConfiguration = new CorsConfiguration();
        corsConfiguration.setAllowCredentials(true);
        corsConfiguration.setAllowedOrigins(Arrays.asList("http://82.29.168.17:3000"));
        corsConfiguration.setAllowedHeaders(Arrays.asList(
                "Origin", 
                "Access-Control-Allow-Origin", 
                "Content-Type",
                "Accept", 
                "Authorization", 
                "Origin, Accept", 
                "X-Requested-With",
                "Access-Control-Request-Method", 
                "Access-Control-Request-Headers"
        ));
        corsConfiguration.setExposedHeaders(Arrays.asList(
                "Origin", 
                "Content-Type", 
                "Accept", 
                "Authorization",
                "Access-Control-Allow-Origin", 
                "Access-Control-Allow-Credentials",
                "Content-Disposition"
        ));
        corsConfiguration.setAllowedMethods(Arrays.asList(
                "GET", 
                "POST", 
                "PUT", 
                "DELETE", 
                "OPTIONS", 
                "PATCH"
        ));
        corsConfiguration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource urlBasedCorsConfigurationSource = new UrlBasedCorsConfigurationSource();
        urlBasedCorsConfigurationSource.registerCorsConfiguration("/**", corsConfiguration);
        
        return new CorsFilter(urlBasedCorsConfigurationSource);
    }
} 