/*
 * Secure File Storage System
 * Implements a secure file storage mechanism with encryption and integrity verification
 */

#ifndef SECURE_STORAGE_H
#define SECURE_STORAGE_H

#include <stddef.h>

/**
 * Initialize secure storage system
 * 
 * @param storage_path Path to store encrypted files (NULL for default)
 * @return 1 on success, 0 on failure
 */
int storage_init(const char* storage_path);

/**
 * Clean up resources used by the secure storage system
 */
void storage_cleanup(void);

/**
 * Store file with encryption
 * 
 * @param file_data File data to encrypt and store
 * @param file_size Size of file data in bytes
 * @param original_name Original filename
 * @param security_level Security level (1-5)
 * @return Unique file ID on success, NULL on failure
 */
const char* storage_store_file(const unsigned char* file_data, size_t file_size,
                              const char* original_name, int security_level);

/**
 * Retrieve file with decryption
 * 
 * @param file_id File ID to retrieve
 * @param output_data Pointer to buffer pointer (will be allocated)
 * @param output_size Pointer to variable to receive size
 * @param original_name Buffer to receive original filename (can be NULL)
 * @param name_buffer_size Size of original_name buffer
 * @return 1 on success, 0 on failure
 */
int storage_retrieve_file(const char* file_id, unsigned char** output_data,
                         size_t* output_size, char* original_name, size_t name_buffer_size);

/**
 * Delete file from secure storage
 * 
 * @param file_id File ID to delete
 * @return 1 on success, 0 on failure
 */
int storage_delete_file(const char* file_id);

/**
 * Verify file integrity
 * 
 * @param file_id File ID to verify
 * @return 1 if integrity check passes, 0 if it fails
 */
int storage_verify_integrity(const char* file_id);

#endif /* SECURE_STORAGE_H */ 