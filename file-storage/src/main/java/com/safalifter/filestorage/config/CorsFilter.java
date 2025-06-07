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
        
        // CRITICAL: Set CORS headers BEFORE any processing
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Credentials", "false");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH");
        response.setHeader("Access-Control-Max-Age", "3600");
        response.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, X-CSRF-Token");
        response.setHeader("Access-Control-Expose-Headers", "Content-Disposition, Content-Type, Content-Length, Accept-Ranges, Content-Range");
        
        // Debug headers - remove in production
        response.setHeader("X-Debug-CORS", "Applied");
        response.setHeader("X-Debug-Method", request.getMethod());
        response.setHeader("X-Debug-URI", request.getRequestURI());
        
        // Log for debugging
        System.out.println("=== CORS FILTER DEBUG ===");
        System.out.println("URI: " + request.getRequestURI());
        System.out.println("Method: " + request.getMethod());
        System.out.println("Origin: " + (origin != null ? origin : "null"));
        System.out.println("========================");
        
        // Handle preflight OPTIONS requests
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            System.out.println("OPTIONS request - returning 200");
            response.setStatus(HttpServletResponse.SC_OK);
            return; // Don't continue the filter chain for OPTIONS
        }
        
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

// Add this to your existing controller or create a new test controller
    
        
        // Test endpoint to verify CORS is working
        @GetMapping("/test")
        public ResponseEntity<String> testCors() {
            System.out.println("Test endpoint called");
            return ResponseEntity.ok()
                    .header("Content-Type", "text/plain")
                    .header("X-Test", "CORS-Working")
                    .body("CORS is working! Server time: " + new java.util.Date());
        }
        
        // Your existing download endpoint
        @GetMapping("/download/{fileId}")
        public ResponseEntity<?> downloadFile(@PathVariable String fileId, 
                                            @RequestParam(required = false) Boolean preview) {
            
            System.out.println("=== DOWNLOAD ENDPOINT ===");
            System.out.println("FileId: " + fileId);
            System.out.println("Preview: " + preview);
            System.out.println("========================");
            
            try {
                // FOR TESTING: Return a simple response first
                String testContent = "This is a test file content for fileId: " + fileId;
                
                return ResponseEntity.ok()
                        .header("Content-Type", "text/plain")
                        .header("Content-Disposition", preview != null && preview ? "inline" : "attachment; filename=\"test.txt\"")
                        .header("X-Debug-Endpoint", "Working")
                        .body(testContent);
                        
            } catch (Exception e) {
                System.err.println("Error in download endpoint: " + e.getMessage());
                e.printStackTrace();
                return ResponseEntity.status(500)
                        .header("Content-Type", "text/plain")
                        .body("Error: " + e.getMessage());
            }
        }        
    
}

