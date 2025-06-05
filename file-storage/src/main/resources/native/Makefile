# Makefile for crypto library

# Compiler and flags
CC = gcc
CFLAGS = -Wall -Wextra -fPIC -O2 -g
LDFLAGS = -shared

# Java includes
JAVA_HOME ?= /usr/lib/jvm/default-java
INCLUDES = -I$(JAVA_HOME)/include -I$(JAVA_HOME)/include/linux

# Target library
TARGET = libcryptosec.so

# Source files
SRCS = crypto_core.c secure_storage.c jni_bridge.c
OBJS = $(SRCS:.c=.o)

# Default target
all: $(TARGET)

# Build shared library
$(TARGET): $(OBJS)
	$(CC) $(LDFLAGS) -o $@ $^

# Compile C files
%.o: %.c
	$(CC) $(CFLAGS) $(INCLUDES) -c $< -o $@

# JNI header generation (would be called from Maven/Gradle)
jni_headers:
	javac -h . ../../../java/com/safalifter/filestorage/service/SecureStorageService.java
	
# Clean up
clean:
	rm -f $(OBJS) $(TARGET)

# Install library
install: $(TARGET)
	mkdir -p /usr/local/lib
	cp $(TARGET) /usr/local/lib/
	ldconfig

.PHONY: all clean install jni_headers 