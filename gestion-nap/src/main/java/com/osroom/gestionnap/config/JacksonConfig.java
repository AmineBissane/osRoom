package com.osroom.gestionnap.config;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.Module;
import com.fasterxml.jackson.databind.module.SimpleModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

@Configuration
public class JacksonConfig {

    @Bean
    public Module localDateTimeModule() {
        SimpleModule module = new SimpleModule();
        module.addDeserializer(LocalDateTime.class, new LocalDateTimeDeserializer());
        return module;
    }

    /**
     * Custom deserializer for LocalDateTime that handles both date-time and date-only strings
     */
    public static class LocalDateTimeDeserializer extends JsonDeserializer<LocalDateTime> {
        
        @Override
        public LocalDateTime deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
            String dateStr = p.getText().trim();
            
            try {
                // First try to parse as a standard ISO date-time
                return LocalDateTime.parse(dateStr, DateTimeFormatter.ISO_DATE_TIME);
            } catch (DateTimeParseException e) {
                try {
                    // If that fails, try to parse as a date only, and set time to end of day
                    LocalDate date = LocalDate.parse(dateStr, DateTimeFormatter.ISO_DATE);
                    return LocalDateTime.of(date, LocalTime.of(23, 59, 59));
                } catch (DateTimeParseException e2) {
                    throw new IOException("Cannot deserialize LocalDateTime from: " + dateStr, e2);
                }
            }
        }
    }
} 