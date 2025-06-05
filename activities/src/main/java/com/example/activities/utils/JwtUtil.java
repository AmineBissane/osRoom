package com.example.activities.utils;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.util.Base64;
import java.util.Collections;
import java.util.List;

@Component
public class JwtUtil {

    private final ObjectMapper objectMapper;

    public JwtUtil(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /**
     * Extrae el ID del usuario (sub) del token JWT
     * @param token Token JWT
     * @return ID del usuario o null si no se puede extraer
     */
    public String extractUserId(String token) {
        try {
            String[] chunks = token.split("\\.");
            Base64.Decoder decoder = Base64.getUrlDecoder();
            
            String payload = new String(decoder.decode(chunks[1]));
            JsonNode payloadJson = objectMapper.readTree(payload);
            
            // Obtener el ID del usuario del campo sub, que es el estándar en JWT
            if (payloadJson.has("sub")) {
                return payloadJson.get("sub").asText();
            }
            
            return null;
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Extrae el nombre de usuario del token JWT
     * @param token Token JWT
     * @return Nombre de usuario
     */
    public String extractUsername(String token) {
        try {
            String[] chunks = token.split("\\.");
            Base64.Decoder decoder = Base64.getUrlDecoder();
            
            String payload = new String(decoder.decode(chunks[1]));
            JsonNode payloadJson = objectMapper.readTree(payload);
            
            // Intentar obtener el nombre del usuario de diferentes campos
            if (payloadJson.has("name")) {
                return payloadJson.get("name").asText();
            } else if (payloadJson.has("preferred_username")) {
                return payloadJson.get("preferred_username").asText();
            } else if (payloadJson.has("sub")) {
                return payloadJson.get("sub").asText();
            }
            
            return "Unknown User";
        } catch (Exception e) {
            return "Unknown User";
        }
    }
    
    /**
     * Verifica si el usuario tiene un rol específico
     * @param token Token JWT
     * @param role Rol a verificar
     * @return true si el usuario tiene el rol, false en caso contrario
     */
    public boolean hasRole(String token, String role) {
        try {
            String[] chunks = token.split("\\.");
            Base64.Decoder decoder = Base64.getUrlDecoder();
            
            String payload = new String(decoder.decode(chunks[1]));
            JsonNode payloadJson = objectMapper.readTree(payload);
            
            // Buscar roles en diferentes estructuras comunes de JWT
            List<String> roles = Collections.emptyList();
            
            if (payloadJson.has("realm_access") && payloadJson.get("realm_access").has("roles")) {
                JsonNode rolesNode = payloadJson.get("realm_access").get("roles");
                roles = objectMapper.convertValue(rolesNode, List.class);
            } else if (payloadJson.has("roles")) {
                JsonNode rolesNode = payloadJson.get("roles");
                roles = objectMapper.convertValue(rolesNode, List.class);
            }
            
            return roles.contains(role) || 
                   roles.contains("ROLE_" + role) || 
                   roles.contains(role.toUpperCase());
        } catch (Exception e) {
            return false;
        }
    }
} 