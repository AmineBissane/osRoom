/*
 * Secure File Storage System
 * Implements a secure file storage mechanism with encryption and integrity verification
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include "crypto_core.h"
#include "secure_storage.h"

/* File metadata structure */
typedef struct {
    char file_id[37];              /* UUID */
    char original_name[256];       /* Original filename */
    size_t original_size;          /* Original file size */
    unsigned char hash[32];        /* SHA-256 hash */
    int security_level;            /* Security level used for encryption */
    time_t timestamp;              /* Encryption timestamp */
} FileMetadata;

/* Global storage path */
static char STORAGE_PATH[512] = {0};
static int STORAGE_INITIALIZED = 0;

/* Initialize secure storage system */
int storage_init(const char* storage_path) {
    if (STORAGE_INITIALIZED) return 1;
    
    printf("[C-STORAGE] Initializing secure storage system\n");
    
    /* Initialize crypto subsystem */
    if (!crypto_init()) {
        printf("[C-STORAGE] ERROR: Failed to initialize crypto subsystem\n");
        return 0;
    }
    
    /* Set storage path */
    if (storage_path) {
        strncpy(STORAGE_PATH, storage_path, sizeof(STORAGE_PATH) - 1);
    } else {
        strcpy(STORAGE_PATH, "/secure/storage");  /* Default path */
    }
    
    printf("[C-STORAGE] Storage path set to: %s\n", STORAGE_PATH);
    printf("[C-STORAGE] Secure storage system initialized successfully\n");
    
    STORAGE_INITIALIZED = 1;
    return 1;
}

/* Clean up resources */
void storage_cleanup() {
    if (!STORAGE_INITIALIZED) return;
    
    printf("[C-STORAGE] Cleaning up secure storage system\n");
    
    /* Clean up crypto subsystem */
    crypto_cleanup();
    
    STORAGE_INITIALIZED = 0;
    printf("[C-STORAGE] Secure storage system shutdown complete\n");
}

/* Generate a unique file ID (UUID-like) */
static void generate_file_id(char* id_buffer) {
    if (!id_buffer) return;
    
    /* Generate 16 random bytes */
    unsigned char random_bytes[16];
    crypto_generate_random(random_bytes, 16);
    
    /* Format as UUID string */
    sprintf(id_buffer, 
            "%02x%02x%02x%02x-%02x%02x-%02x%02x-%02x%02x-%02x%02x%02x%02x%02x%02x",
            random_bytes[0], random_bytes[1], random_bytes[2], random_bytes[3],
            random_bytes[4], random_bytes[5], random_bytes[6], random_bytes[7],
            random_bytes[8], random_bytes[9], random_bytes[10], random_bytes[11],
            random_bytes[12], random_bytes[13], random_bytes[14], random_bytes[15]);
}

/* Store file with encryption */
const char* storage_store_file(const unsigned char* file_data, size_t file_size,
                              const char* original_name, int security_level) {
    if (!STORAGE_INITIALIZED || !file_data || !original_name) return NULL;
    
    printf("[C-STORAGE] Storing file: %s (%lu bytes) at security level %d\n",
           original_name, (unsigned long)file_size, security_level);
    
    /* Allocate memory for encrypted data */
    size_t encrypted_size = file_size + 16;  /* Add space for IV */
    unsigned char* encrypted_data = (unsigned char*)malloc(encrypted_size);
    if (!encrypted_data) {
        printf("[C-STORAGE] ERROR: Memory allocation failed\n");
        return NULL;
    }
    
    /* Create metadata */
    FileMetadata metadata;
    memset(&metadata, 0, sizeof(metadata));
    generate_file_id(metadata.file_id);
    strncpy(metadata.original_name, original_name, sizeof(metadata.original_name) - 1);
    metadata.original_size = file_size;
    metadata.security_level = security_level;
    metadata.timestamp = time(NULL);
    
    /* Compute file hash */
    crypto_compute_hash(file_data, file_size, metadata.hash);
    
    /* Encrypt file data */
    int result = crypto_encrypt_data(file_data, file_size, encrypted_data, security_level);
    if (result < 0) {
        printf("[C-STORAGE] ERROR: Encryption failed\n");
        free(encrypted_data);
        return NULL;
    }
    
    /* In a real implementation, we would write the encrypted data and metadata to disk */
    printf("[C-STORAGE] File encrypted successfully\n");
    printf("[C-STORAGE] File ID: %s\n", metadata.file_id);
    
    /* Simulate writing to disk */
    printf("[C-STORAGE] Writing encrypted data to %s/%s\n", STORAGE_PATH, metadata.file_id);
    printf("[C-STORAGE] Writing metadata to %s/%s.meta\n", STORAGE_PATH, metadata.file_id);
    
    /* Clean up */
    free(encrypted_data);
    
    /* Return file ID (static buffer for demo) */
    static char return_id[37];
    strcpy(return_id, metadata.file_id);
    return return_id;
}

/* Retrieve file with decryption */
int storage_retrieve_file(const char* file_id, unsigned char** output_data,
                         size_t* output_size, char* original_name, size_t name_buffer_size) {
    if (!STORAGE_INITIALIZED || !file_id || !output_data || !output_size) return 0;
    
    printf("[C-STORAGE] Retrieving file with ID: %s\n", file_id);
    
    /* In a real implementation, we would read the metadata and encrypted data from disk */
    /* Simulate reading from disk */
    printf("[C-STORAGE] Reading metadata from %s/%s.meta\n", STORAGE_PATH, file_id);
    printf("[C-STORAGE] Reading encrypted data from %s/%s\n", STORAGE_PATH, file_id);
    
    /* Fake metadata and encrypted data for demo */
    FileMetadata metadata;
    strcpy(metadata.file_id, file_id);
    strcpy(metadata.original_name, "example.pdf");
    metadata.original_size = 1024;  /* 1 KB */
    metadata.security_level = SECURITY_LEVEL_ENHANCED;
    metadata.timestamp = time(NULL) - 3600;  /* 1 hour ago */
    
    /* Allocate memory for fake encrypted data */
    size_t encrypted_size = metadata.original_size + 16;  /* Add space for IV */
    unsigned char* encrypted_data = (unsigned char*)malloc(encrypted_size);
    if (!encrypted_data) {
        printf("[C-STORAGE] ERROR: Memory allocation failed\n");
        return 0;
    }
    
    /* Fill with dummy data */
    for (size_t i = 0; i < encrypted_size; i++) {
        encrypted_data[i] = (unsigned char)(i & 0xFF);
    }
    
    /* Allocate memory for decrypted data */
    *output_size = metadata.original_size;
    *output_data = (unsigned char*)malloc(*output_size);
    if (!*output_data) {
        printf("[C-STORAGE] ERROR: Memory allocation failed\n");
        free(encrypted_data);
        return 0;
    }
    
    /* Decrypt data */
    int result = crypto_decrypt_data(encrypted_data, encrypted_size, *output_data, metadata.security_level);
    if (result < 0) {
        printf("[C-STORAGE] ERROR: Decryption failed\n");
        free(encrypted_data);
        free(*output_data);
        *output_data = NULL;
        *output_size = 0;
        return 0;
    }
    
    /* Copy original filename if requested */
    if (original_name && name_buffer_size > 0) {
        strncpy(original_name, metadata.original_name, name_buffer_size - 1);
        original_name[name_buffer_size - 1] = '\0';
    }
    
    printf("[C-STORAGE] File retrieved successfully\n");
    printf("[C-STORAGE] Original name: %s\n", metadata.original_name);
    printf("[C-STORAGE] Original size: %lu bytes\n", (unsigned long)metadata.original_size);
    
    /* Clean up */
    free(encrypted_data);
    
    return 1;
}

/* Delete file from secure storage */
int storage_delete_file(const char* file_id) {
    if (!STORAGE_INITIALIZED || !file_id) return 0;
    
    printf("[C-STORAGE] Deleting file with ID: %s\n", file_id);
    
    /* In a real implementation, we would delete the file and metadata from disk */
    /* Simulate deleting from disk */
    printf("[C-STORAGE] Deleting metadata file %s/%s.meta\n", STORAGE_PATH, file_id);
    printf("[C-STORAGE] Deleting encrypted file %s/%s\n", STORAGE_PATH, file_id);
    
    printf("[C-STORAGE] File deleted successfully\n");
    
    return 1;
}

/* Verify file integrity */
int storage_verify_integrity(const char* file_id) {
    if (!STORAGE_INITIALIZED || !file_id) return 0;
    
    printf("[C-STORAGE] Verifying integrity of file with ID: %s\n", file_id);
    
    /* In a real implementation, we would read the file and metadata from disk */
    /* Simulate integrity check */
    printf("[C-STORAGE] Reading metadata from %s/%s.meta\n", STORAGE_PATH, file_id);
    printf("[C-STORAGE] Reading encrypted data from %s/%s\n", STORAGE_PATH, file_id);
    printf("[C-STORAGE] Performing integrity check...\n");
    
    /* Fake successful integrity check */
    printf("[C-STORAGE] Integrity check passed\n");
    
    return 1;
} 