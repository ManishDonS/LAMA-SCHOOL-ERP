package tenant

import (
	"strings"
	"testing"
)

func TestNewCipher(t *testing.T) {
	tests := []struct {
		name    string
		key     string
		wantErr bool
	}{
		{
			name:    "Valid 32-byte key",
			key:     "12345678901234567890123456789012",
			wantErr: false,
		},
		{
			name:    "Valid short key (will be derived to 32 bytes)",
			key:     "short-key",
			wantErr: false,
		},
		{
			name:    "Valid long key (will be derived to 32 bytes)",
			key:     "this-is-a-very-long-key-that-exceeds-32-bytes-but-should-work",
			wantErr: false,
		},
		{
			name:    "Empty key",
			key:     "",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cipher, err := NewCipher(tt.key)

			if tt.wantErr {
				if err == nil {
					t.Errorf("NewCipher() expected error but got none")
				}
				return
			}

			if err != nil {
				t.Errorf("NewCipher() unexpected error = %v", err)
				return
			}

			if cipher == nil {
				t.Error("NewCipher() returned nil cipher")
				return
			}

			// Verify key is 32 bytes (derived via PBKDF2)
			if len(cipher.key) != 32 {
				t.Errorf("NewCipher() key length = %v, want 32", len(cipher.key))
			}
		})
	}
}

func TestEncryptDecrypt(t *testing.T) {
	key := "test-encryption-key"
	cipher, err := NewCipher(key)
	if err != nil {
		t.Fatalf("Setup: failed to create cipher: %v", err)
	}

	tests := []struct {
		name      string
		plaintext string
	}{
		{
			name:      "Simple text",
			plaintext: "Hello, World!",
		},
		{
			name:      "Database credentials",
			plaintext: "postgres://user:password@localhost:5432/dbname",
		},
		{
			name:      "Long text",
			plaintext: strings.Repeat("This is a long text string. ", 100),
		},
		{
			name:      "Special characters",
			plaintext: "P@ssw0rd!@#$%^&*()",
		},
		{
			name:      "Unicode characters",
			plaintext: "Hello 世界 🌍 مرحبا",
		},
		{
			name:      "Empty string",
			plaintext: "",
		},
		{
			name:      "JSON data",
			plaintext: `{"email":"user@example.com","password":"secret123"}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Encrypt
			ciphertext, err := cipher.Encrypt(tt.plaintext)
			if err != nil {
				t.Errorf("Encrypt() error = %v", err)
				return
			}

			// Verify ciphertext is not empty
			if ciphertext == "" {
				t.Error("Encrypt() returned empty ciphertext")
				return
			}

			// Verify ciphertext is different from plaintext
			if ciphertext == tt.plaintext {
				t.Error("Encrypt() returned plaintext as ciphertext")
				return
			}

			// Decrypt
			decrypted, err := cipher.Decrypt(ciphertext)
			if err != nil {
				t.Errorf("Decrypt() error = %v", err)
				return
			}

			// Verify decrypted matches original
			if decrypted != tt.plaintext {
				t.Errorf("Decrypt() = %v, want %v", decrypted, tt.plaintext)
			}
		})
	}
}

func TestEncryptDeterminism(t *testing.T) {
	key := "test-encryption-key"
	cipher, err := NewCipher(key)
	if err != nil {
		t.Fatalf("Setup: failed to create cipher: %v", err)
	}

	plaintext := "test-data"

	// Encrypt the same plaintext multiple times
	ciphertext1, err := cipher.Encrypt(plaintext)
	if err != nil {
		t.Fatalf("First encrypt failed: %v", err)
	}

	ciphertext2, err := cipher.Encrypt(plaintext)
	if err != nil {
		t.Fatalf("Second encrypt failed: %v", err)
	}

	// Ciphertexts should be different (due to random nonce)
	if ciphertext1 == ciphertext2 {
		t.Error("Encrypt() produced same ciphertext for same plaintext (should use random nonce)")
	}

	// But both should decrypt to the same plaintext
	decrypted1, err := cipher.Decrypt(ciphertext1)
	if err != nil {
		t.Fatalf("First decrypt failed: %v", err)
	}

	decrypted2, err := cipher.Decrypt(ciphertext2)
	if err != nil {
		t.Fatalf("Second decrypt failed: %v", err)
	}

	if decrypted1 != plaintext || decrypted2 != plaintext {
		t.Error("Decrypted values don't match original plaintext")
	}
}

func TestDecryptInvalidData(t *testing.T) {
	key := "test-encryption-key"
	cipher, err := NewCipher(key)
	if err != nil {
		t.Fatalf("Setup: failed to create cipher: %v", err)
	}

	tests := []struct {
		name       string
		ciphertext string
	}{
		{
			name:       "Invalid base64",
			ciphertext: "not-valid-base64!!!",
		},
		{
			name:       "Empty string",
			ciphertext: "",
		},
		{
			name:       "Tampered ciphertext",
			ciphertext: "YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXo=", // Valid base64 but invalid ciphertext
		},
		{
			name:       "Too short ciphertext",
			ciphertext: "YWJj",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := cipher.Decrypt(tt.ciphertext)
			if err == nil {
				t.Error("Decrypt() expected error for invalid data but got none")
			}
		})
	}
}

func TestEncryptDecryptWithDifferentKeys(t *testing.T) {
	key1 := "encryption-key-1"
	key2 := "encryption-key-2"

	cipher1, err := NewCipher(key1)
	if err != nil {
		t.Fatalf("Setup: failed to create cipher1: %v", err)
	}

	cipher2, err := NewCipher(key2)
	if err != nil {
		t.Fatalf("Setup: failed to create cipher2: %v", err)
	}

	plaintext := "secret-data"

	// Encrypt with cipher1
	ciphertext, err := cipher1.Encrypt(plaintext)
	if err != nil {
		t.Fatalf("Encrypt failed: %v", err)
	}

	// Try to decrypt with cipher2 (different key)
	_, err = cipher2.Decrypt(ciphertext)
	if err == nil {
		t.Error("Decrypt() should fail when using different key")
	}

	// Decrypt with correct cipher should work
	decrypted, err := cipher1.Decrypt(ciphertext)
	if err != nil {
		t.Errorf("Decrypt() with correct key failed: %v", err)
	}

	if decrypted != plaintext {
		t.Errorf("Decrypted = %v, want %v", decrypted, plaintext)
	}
}

func TestPBKDF2KeyDerivation(t *testing.T) {
	// Test that same key produces same derived key (deterministic)
	key := "my-encryption-key"

	cipher1, err := NewCipher(key)
	if err != nil {
		t.Fatalf("First cipher creation failed: %v", err)
	}

	cipher2, err := NewCipher(key)
	if err != nil {
		t.Fatalf("Second cipher creation failed: %v", err)
	}

	// Encrypt with cipher1
	plaintext := "test-data"
	ciphertext, err := cipher1.Encrypt(plaintext)
	if err != nil {
		t.Fatalf("Encrypt failed: %v", err)
	}

	// Decrypt with cipher2 (should work because same key derives to same value)
	decrypted, err := cipher2.Decrypt(ciphertext)
	if err != nil {
		t.Errorf("Decrypt with second cipher failed: %v", err)
	}

	if decrypted != plaintext {
		t.Errorf("Decrypted = %v, want %v", decrypted, plaintext)
	}
}

func TestCipherThreadSafety(t *testing.T) {
	key := "test-encryption-key"
	cipher, err := NewCipher(key)
	if err != nil {
		t.Fatalf("Setup: failed to create cipher: %v", err)
	}

	// Run multiple encryptions concurrently
	done := make(chan bool)
	for i := 0; i < 10; i++ {
		go func(id int) {
			plaintext := "concurrent-test-data"
			ciphertext, err := cipher.Encrypt(plaintext)
			if err != nil {
				t.Errorf("Concurrent encrypt %d failed: %v", id, err)
			}

			decrypted, err := cipher.Decrypt(ciphertext)
			if err != nil {
				t.Errorf("Concurrent decrypt %d failed: %v", id, err)
			}

			if decrypted != plaintext {
				t.Errorf("Concurrent test %d: decrypted = %v, want %v", id, decrypted, plaintext)
			}

			done <- true
		}(i)
	}

	// Wait for all goroutines to complete
	for i := 0; i < 10; i++ {
		<-done
	}
}

// Benchmark tests
func BenchmarkNewCipher(b *testing.B) {
	key := "benchmark-encryption-key"

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = NewCipher(key)
	}
}

func BenchmarkEncrypt(b *testing.B) {
	key := "benchmark-encryption-key"
	cipher, _ := NewCipher(key)
	plaintext := "This is a test plaintext for benchmarking encryption performance"

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = cipher.Encrypt(plaintext)
	}
}

func BenchmarkDecrypt(b *testing.B) {
	key := "benchmark-encryption-key"
	cipher, _ := NewCipher(key)
	plaintext := "This is a test plaintext for benchmarking decryption performance"
	ciphertext, _ := cipher.Encrypt(plaintext)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = cipher.Decrypt(ciphertext)
	}
}

func BenchmarkEncryptDecrypt(b *testing.B) {
	key := "benchmark-encryption-key"
	cipher, _ := NewCipher(key)
	plaintext := "This is a test plaintext for benchmarking full encryption and decryption"

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		ciphertext, _ := cipher.Encrypt(plaintext)
		_, _ = cipher.Decrypt(ciphertext)
	}
}
