/*
 * JNI Bridge for Crypto Library
 * Connects Java SecureStorageService with native C cryptographic functions
 */

#include <jni.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "crypto_core.h"
#include "secure_storage.h"

/* JNI method names would be generated by javac -h */
#define JNI_CLASS "com/safalifter/filestorage/service/SecureStorageService"

/*
 * Class:     com_safalifter_filestorage_service_SecureStorageService
 * Method:    initializeStorage
 * Signature: (Ljava/lang/String;)Z
 */
JNIEXPORT jboolean JNICALL Java_com_safalifter_filestorage_service_SecureStorageService_initializeStorage
  (JNIEnv *env, jobject obj, jstring storagePath) {
    
    printf("[JNI-BRIDGE] Initializing storage from JNI\n");
    
    // Convert Java string to C string
    const char *path = NULL;
    if (storagePath != NULL) {
        path = (*env)->GetStringUTFChars(env, storagePath, NULL);
    }
    
    // Call native initialization function
    int result = storage_init(path);
    
    // Release string
    if (path != NULL) {
        (*env)->ReleaseStringUTFChars(env, storagePath, path);
    }
    
    return (jboolean)(result != 0);
}

/*
 * Class:     com_safalifter_filestorage_service_SecureStorageService
 * Method:    cleanupStorage
 * Signature: ()V
 */
JNIEXPORT void JNICALL Java_com_safalifter_filestorage_service_SecureStorageService_cleanupStorage
  (JNIEnv *env, jobject obj) {
    
    printf("[JNI-BRIDGE] Cleaning up storage from JNI\n");
    
    // Call native cleanup function
    storage_cleanup();
}

/*
 * Class:     com_safalifter_filestorage_service_SecureStorageService
 * Method:    storeSecureFile
 * Signature: ([BLjava/lang/String;I)Ljava/lang/String;
 */
JNIEXPORT jstring JNICALL Java_com_safalifter_filestorage_service_SecureStorageService_storeSecureFile
  (JNIEnv *env, jobject obj, jbyteArray fileData, jstring originalName, jint securityLevel) {
    
    printf("[JNI-BRIDGE] Storing secure file from JNI\n");
    
    // Convert Java params to C
    jbyte *data = (*env)->GetByteArrayElements(env, fileData, NULL);
    jsize dataLen = (*env)->GetArrayLength(env, fileData);
    const char *fileName = (*env)->GetStringUTFChars(env, originalName, NULL);
    
    // Call native storage function
    const char *fileId = storage_store_file((const unsigned char*)data, (size_t)dataLen, 
                                           fileName, (int)securityLevel);
    
    // Release resources
    (*env)->ReleaseByteArrayElements(env, fileData, data, JNI_ABORT);
    (*env)->ReleaseStringUTFChars(env, originalName, fileName);
    
    // Convert result to Java string
    jstring result = NULL;
    if (fileId != NULL) {
        result = (*env)->NewStringUTF(env, fileId);
    }
    
    return result;
}

/*
 * Class:     com_safalifter_filestorage_service_SecureStorageService
 * Method:    retrieveSecureFile
 * Signature: (Ljava/lang/String;)[B
 */
JNIEXPORT jbyteArray JNICALL Java_com_safalifter_filestorage_service_SecureStorageService_retrieveSecureFile
  (JNIEnv *env, jobject obj, jstring fileId) {
    
    printf("[JNI-BRIDGE] Retrieving secure file from JNI\n");
    
    // Convert Java string to C
    const char *id = (*env)->GetStringUTFChars(env, fileId, NULL);
    
    // Variables for the retrieved data
    unsigned char *data = NULL;
    size_t dataSize = 0;
    char originalName[256] = {0};
    
    // Call native retrieval function
    int result = storage_retrieve_file(id, &data, &dataSize, originalName, sizeof(originalName));
    
    // Release string
    (*env)->ReleaseStringUTFChars(env, fileId, id);
    
    // Create Java byte array for result
    jbyteArray resultArray = NULL;
    if (result && data != NULL) {
        resultArray = (*env)->NewByteArray(env, (jsize)dataSize);
        (*env)->SetByteArrayRegion(env, resultArray, 0, (jsize)dataSize, (jbyte*)data);
        
        // Free the allocated data
        free(data);
    }
    
    return resultArray;
}

/*
 * Class:     com_safalifter_filestorage_service_SecureStorageService
 * Method:    deleteSecureFileNative
 * Signature: (Ljava/lang/String;)Z
 */
JNIEXPORT jboolean JNICALL Java_com_safalifter_filestorage_service_SecureStorageService_deleteSecureFileNative
  (JNIEnv *env, jobject obj, jstring fileId) {
    
    printf("[JNI-BRIDGE] Deleting secure file from JNI\n");
    
    // Convert Java string to C
    const char *id = (*env)->GetStringUTFChars(env, fileId, NULL);
    
    // Call native deletion function
    int result = storage_delete_file(id);
    
    // Release string
    (*env)->ReleaseStringUTFChars(env, fileId, id);
    
    return (jboolean)(result != 0);
}

/*
 * Class:     com_safalifter_filestorage_service_SecureStorageService
 * Method:    computeFileHash
 * Signature: ([B)Ljava/lang/String;
 */
JNIEXPORT jstring JNICALL Java_com_safalifter_filestorage_service_SecureStorageService_computeFileHash
  (JNIEnv *env, jobject obj, jbyteArray fileData) {
    
    printf("[JNI-BRIDGE] Computing file hash from JNI\n");
    
    // Convert Java byte array to C
    jbyte *data = (*env)->GetByteArrayElements(env, fileData, NULL);
    jsize dataLen = (*env)->GetArrayLength(env, fileData);
    
    // Compute hash
    unsigned char hash[32];
    crypto_compute_hash((const unsigned char*)data, (size_t)dataLen, hash);
    
    // Convert hash to string
    char hashString[65];
    crypto_hash_to_string(hash, hashString);
    
    // Release resources
    (*env)->ReleaseByteArrayElements(env, fileData, data, JNI_ABORT);
    
    // Convert to Java string
    jstring result = (*env)->NewStringUTF(env, hashString);
    
    return result;
}

/*
 * Class:     com_safalifter_filestorage_service_SecureStorageService
 * Method:    verifyFileIntegrity
 * Signature: (Ljava/lang/String;)Z
 */
JNIEXPORT jboolean JNICALL Java_com_safalifter_filestorage_service_SecureStorageService_verifyFileIntegrity
  (JNIEnv *env, jobject obj, jstring fileId) {
    
    printf("[JNI-BRIDGE] Verifying file integrity from JNI\n");
    
    // Convert Java string to C
    const char *id = (*env)->GetStringUTFChars(env, fileId, NULL);
    
    // Call native verification function
    int result = storage_verify_integrity(id);
    
    // Release string
    (*env)->ReleaseStringUTFChars(env, fileId, id);
    
    return (jboolean)(result != 0);
} 