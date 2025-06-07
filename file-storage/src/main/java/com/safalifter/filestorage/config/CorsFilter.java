package com.safalifter.filestorage.config;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorsFilter implements Filter {

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletResponse response = (HttpServletResponse) res;
        HttpServletRequest request = (HttpServletRequest) req;
        
        String origin = request.getHeader("Origin");
        String authHeader = request.getHeader("Authorization");
        
        System.out.println("=== CORS FILTER DEBUG ===");
        System.out.println("URI: " + request.getRequestURI());
        System.out.println("Method: " + request.getMethod());
        System.out.println("Origin: " + (origin != null ? origin : "null"));
        System.out.println("Auth Header Present: " + (authHeader != null ? "yes" : "no"));
        
        // For direct browser requests (no origin header), be permissive
        if (origin != null) {
            // For requests with Origin header, reflect the origin
            System.out.println("Origin header found, reflecting: " + origin);
            response.setHeader("Access-Control-Allow-Origin", origin);
            
            // If auth header is present, credentials might be needed
            if (authHeader != null) {
                System.out.println("Auth header present, enabling credentials");
                response.setHeader("Access-Control-Allow-Credentials", "true");
            } else {
                System.out.println("No auth header, disabling credentials");
                response.setHeader("Access-Control-Allow-Credentials", "false");
            }
        } else {
            // For direct browser access without Origin header
            System.out.println("No origin header, using wildcard for direct browser access");
            response.setHeader("Access-Control-Allow-Origin", "*");
            response.setHeader("Access-Control-Allow-Credentials", "false");
        }
        
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH");
        response.setHeader("Access-Control-Max-Age", "3600");
        response.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, X-CSRF-Token");
        response.setHeader("Access-Control-Expose-Headers", "Content-Disposition, Content-Type, Content-Length, Accept-Ranges, Content-Range");
        
        // Remove X-Frame-Options: DENY to allow embedding in iframes
        // Instead, use a more permissive approach for embedding content
        response.setHeader("X-Frame-Options", "SAMEORIGIN");
        
        // Add these headers to improve browser compatibility
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("X-XSS-Protection", "1; mode=block");
        
        // Debug headers - remove in production
        response.setHeader("X-Debug-CORS", "Applied");
        response.setHeader("X-Debug-Method", request.getMethod());
        response.setHeader("X-Debug-URI", request.getRequestURI());
        
        // Print all request headers for debugging
        java.util.Enumeration<String> headerNames = request.getHeaderNames();
        System.out.println("------ All Request Headers ------");
        while (headerNames.hasMoreElements()) {
            String headerName = headerNames.nextElement();
            System.out.println("Header: " + headerName + " = " + request.getHeader(headerName));
        }
        System.out.println("------ End Headers ------");
        
        // Handle preflight OPTIONS requests
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            System.out.println("OPTIONS request - returning 200");
            response.setStatus(HttpServletResponse.SC_OK);
            return; // Don't continue the filter chain for OPTIONS
        }
        
        System.out.println("Continuing filter chain for " + request.getMethod() + " request");
        System.out.println("========================");
        
        // Continue with the request
        chain.doFilter(req, res);
    }

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        System.out.println("CORS Filter initialized");
    }

    @Override
    public void destroy() {
        System.out.println("CORS Filter destroyed");
    } 
    
}

