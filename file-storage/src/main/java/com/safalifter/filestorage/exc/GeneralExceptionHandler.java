package com.safalifter.filestorage.exc;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GeneralExceptionHandler extends ResponseEntityExceptionHandler {

    /**
     * Add CORS headers to all error responses
     */
    private HttpHeaders getCorsHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.add("Access-Control-Allow-Origin", "*");
        headers.add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD");
        headers.add("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
        headers.add("Access-Control-Max-Age", "3600");
        return headers;
    }

    @ExceptionHandler(Exception.class)
    public final ResponseEntity<?> handleAllException(Exception ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", ex.getMessage());
        error.put("status", HttpStatus.INTERNAL_SERVER_ERROR.toString());

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .headers(getCorsHeaders())
                .body(error);
    }

    @ExceptionHandler(GenericErrorResponse.class)
    public ResponseEntity<?> genericError(GenericErrorResponse exception) {
        Map<String, String> error = new HashMap<>();
        error.put("error", exception.getMessage());
        error.put("status", exception.getHttpStatus().toString());

        return ResponseEntity
                .status(exception.getHttpStatus())
                .headers(getCorsHeaders())
                .body(error);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<String> handleMaxSizeException(MaxUploadSizeExceededException exc) {
        return ResponseEntity
                .status(HttpStatus.PAYLOAD_TOO_LARGE)
                .headers(getCorsHeaders())
                .body("File too large, maximum size allowed is 10MB");
    }
    
    /**
     * Handle file not found exceptions with appropriate status
     */
    @ExceptionHandler(java.io.FileNotFoundException.class)
    public ResponseEntity<?> handleFileNotFoundException(java.io.FileNotFoundException exc) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "File not found: " + exc.getMessage());
        error.put("status", HttpStatus.NOT_FOUND.toString());
        
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .headers(getCorsHeaders())
                .body(error);
    }
}
