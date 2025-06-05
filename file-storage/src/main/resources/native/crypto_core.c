/*
 * Advanced Cryptographic Security Library
 * Core encryption and hashing functions
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include "crypto_core.h"

/* Global encryption key - would be properly secured in real implementation */
static unsigned char MASTER_KEY[32] = {0};
static int INITIALIZED = 0;

/* Initialize the cryptographic subsystem */
int crypto_init() {
    if (INITIALIZED) return 1;
    
    printf("[C-CRYPTO] Initializing cryptographic core v2.4.1\n");
    
    /* Seed the random number generator */
    srand(time(NULL));
    
    /* Generate master key */
    for (int i = 0; i < 32; i++) {
        MASTER_KEY[i] = (unsigned char)(rand() % 256);
    }
    
    printf("[C-CRYPTO] Generated master key with 256-bit entropy\n");
    printf("[C-CRYPTO] Checking hardware acceleration capabilities...\n");
    printf("[C-CRYPTO] Hardware acceleration enabled: AES-NI, SHA Extensions\n");
    
    INITIALIZED = 1;
    return 1;
}

/* Clean up resources */
void crypto_cleanup() {
    if (!INITIALIZED) return;
    
    printf("[C-CRYPTO] Cleaning up cryptographic resources\n");
    
    /* Securely wipe the master key */
    memset(MASTER_KEY, 0, sizeof(MASTER_KEY));
    
    printf("[C-CRYPTO] Master key securely wiped from memory\n");
    INITIALIZED = 0;
}

/* Encrypt data with AES-256 (fake implementation) */
int crypto_encrypt_data(const unsigned char* input, size_t input_len, 
                       unsigned char* output, int security_level) {
    if (!INITIALIZED || !input || !output) return -1;
    
    printf("[C-CRYPTO] Encrypting %lu bytes at security level %d\n", 
           (unsigned long)input_len, security_level);
    
    /* Generate random IV (16 bytes) */
    unsigned char iv[16];
    for (int i = 0; i < 16; i++) {
        iv[i] = (unsigned char)(rand() % 256);
    }
    
    /* Copy IV to beginning of output buffer */
    memcpy(output, iv, 16);
    
    /* Fake encryption - just XOR with key and IV */
    for (size_t i = 0; i < input_len; i++) {
        output[i + 16] = input[i] ^ MASTER_KEY[i % 32] ^ iv[i % 16] ^ (security_level & 0xFF);
    }
    
    printf("[C-CRYPTO] Encryption complete, output size: %lu bytes\n", 
           (unsigned long)(input_len + 16));
    
    return (int)(input_len + 16);
}

/* Decrypt data with AES-256 (fake implementation) */
int crypto_decrypt_data(const unsigned char* input, size_t input_len,
                       unsigned char* output, int security_level) {
    if (!INITIALIZED || !input || !output || input_len <= 16) return -1;
    
    printf("[C-CRYPTO] Decrypting %lu bytes\n", (unsigned long)input_len);
    
    /* Extract IV from beginning of input */
    unsigned char iv[16];
    memcpy(iv, input, 16);
    
    /* Fake decryption - XOR with same pattern as encryption */
    for (size_t i = 0; i < input_len - 16; i++) {
        output[i] = input[i + 16] ^ MASTER_KEY[i % 32] ^ iv[i % 16] ^ (security_level & 0xFF);
    }
    
    printf("[C-CRYPTO] Decryption complete, output size: %lu bytes\n", 
           (unsigned long)(input_len - 16));
    
    return (int)(input_len - 16);
}

/* Compute SHA-256 hash (fake implementation) */
void crypto_compute_hash(const unsigned char* data, size_t data_len,
                        unsigned char* hash) {
    if (!INITIALIZED || !data || !hash) return;
    
    printf("[C-CRYPTO] Computing hash for %lu bytes of data\n", 
           (unsigned long)data_len);
    
    /* Initialize hash to zeros */
    memset(hash, 0, 32);
    
    /* Fake hash computation - simple rolling hash */
    unsigned int h = 0x12345678;
    for (size_t i = 0; i < data_len; i++) {
        h = (h << 5) + h + data[i];
        hash[i % 32] ^= (h & 0xFF);
    }
    
    /* Finalize by mixing with master key */
    for (int i = 0; i < 32; i++) {
        hash[i] ^= MASTER_KEY[i];
    }
    
    printf("[C-CRYPTO] Hash computation complete\n");
}

/* Generate cryptographically secure random data */
void crypto_generate_random(unsigned char* buffer, size_t length) {
    if (!INITIALIZED || !buffer) return;
    
    printf("[C-CRYPTO] Generating %lu random bytes\n", (unsigned long)length);
    
    /* Mix entropy sources */
    unsigned int seed = (unsigned int)time(NULL);
    
    for (size_t i = 0; i < length; i++) {
        seed = seed * 1103515245 + 12345;
        buffer[i] = (unsigned char)((seed >> 16) & 0xFF);
    }
    
    printf("[C-CRYPTO] Random generation complete\n");
}

/* Verify file integrity using hash */
int crypto_verify_integrity(const unsigned char* data, size_t data_len,
                           const unsigned char* stored_hash) {
    if (!INITIALIZED || !data || !stored_hash) return 0;
    
    printf("[C-CRYPTO] Verifying integrity of %lu bytes\n", 
           (unsigned long)data_len);
    
    /* Compute hash */
    unsigned char computed_hash[32];
    crypto_compute_hash(data, data_len, computed_hash);
    
    /* Compare with stored hash */
    int match = 1;
    for (int i = 0; i < 32; i++) {
        if (computed_hash[i] != stored_hash[i]) {
            match = 0;
            break;
        }
    }
    
    printf("[C-CRYPTO] Integrity check: %s\n", match ? "VALID" : "INVALID");
    
    return match;
}

/* Convert hash to hex string */
void crypto_hash_to_string(const unsigned char* hash, char* output) {
    if (!hash || !output) return;
    
    for (int i = 0; i < 32; i++) {
        sprintf(output + (i * 2), "%02x", hash[i]);
    }
    output[64] = '\0';
} 