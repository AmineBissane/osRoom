/*
 * Advanced Cryptographic Security Library
 * Core encryption and hashing functions
 */

#ifndef CRYPTO_CORE_H
#define CRYPTO_CORE_H

#include <stddef.h>

/* Security levels */
#define SECURITY_LEVEL_STANDARD    1
#define SECURITY_LEVEL_ENHANCED    2
#define SECURITY_LEVEL_MAXIMUM     3
#define SECURITY_LEVEL_CLASSIFIED  4
#define SECURITY_LEVEL_TOP_SECRET  5

/* Function prototypes */

/**
 * Initialize the cryptographic subsystem
 * Must be called before any other crypto functions
 * 
 * @return 1 on success, 0 on failure
 */
int crypto_init(void);

/**
 * Clean up resources used by the cryptographic subsystem
 * Should be called when application exits
 */
void crypto_cleanup(void);

/**
 * Encrypt data using AES-256 in CBC mode
 * 
 * @param input Data to encrypt
 * @param input_len Length of input data in bytes
 * @param output Buffer to store encrypted data (must be at least input_len + 16 bytes)
 * @param security_level Security level (1-5)
 * @return Length of encrypted data in bytes, or -1 on error
 */
int crypto_encrypt_data(const unsigned char* input, size_t input_len,
                       unsigned char* output, int security_level);

/**
 * Decrypt data encrypted with crypto_encrypt_data
 * 
 * @param input Encrypted data
 * @param input_len Length of encrypted data in bytes
 * @param output Buffer to store decrypted data (must be at least input_len - 16 bytes)
 * @param security_level Security level used for encryption (1-5)
 * @return Length of decrypted data in bytes, or -1 on error
 */
int crypto_decrypt_data(const unsigned char* input, size_t input_len,
                       unsigned char* output, int security_level);

/**
 * Compute SHA-256 hash of data
 * 
 * @param data Data to hash
 * @param data_len Length of data in bytes
 * @param hash Buffer to store hash (must be at least 32 bytes)
 */
void crypto_compute_hash(const unsigned char* data, size_t data_len,
                        unsigned char* hash);

/**
 * Generate cryptographically secure random data
 * 
 * @param buffer Buffer to store random data
 * @param length Number of random bytes to generate
 */
void crypto_generate_random(unsigned char* buffer, size_t length);

/**
 * Verify file integrity using hash
 * 
 * @param data File data
 * @param data_len Length of file data in bytes
 * @param stored_hash Previously computed hash to compare against
 * @return 1 if integrity check passes, 0 if it fails
 */
int crypto_verify_integrity(const unsigned char* data, size_t data_len,
                           const unsigned char* stored_hash);

/**
 * Convert binary hash to hex string
 * 
 * @param hash Binary hash (32 bytes for SHA-256)
 * @param output Buffer to store hex string (must be at least 65 bytes)
 */
void crypto_hash_to_string(const unsigned char* hash, char* output);

#endif /* CRYPTO_CORE_H */ 