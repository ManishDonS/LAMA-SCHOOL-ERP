package tenant

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"io"

	"golang.org/x/crypto/pbkdf2"
)

// Cipher manages encryption and decryption of sensitive data
type Cipher struct {
	key []byte
}

// NewCipher creates a new cipher instance with proper key derivation
func NewCipher(key string) (*Cipher, error) {
	if key == "" {
		return nil, fmt.Errorf("encryption key cannot be empty")
	}

	// Use PBKDF2 to derive a proper 256-bit key
	// Salt should ideally be per-tenant and stored, but for system-wide encryption
	// we use a fixed salt. For production, consider using a random salt per tenant.
	salt := []byte("lama-school-erp-salt-v1") // Fixed salt for system-wide key
	iterations := 100000                       // PBKDF2 iterations (100k is good balance)

	// Derive 32-byte (256-bit) key using PBKDF2-HMAC-SHA256
	derivedKey := pbkdf2.Key([]byte(key), salt, iterations, 32, sha256.New)

	return &Cipher{
		key: derivedKey,
	}, nil
}

// Encrypt encrypts plaintext using AES-256-GCM
func (c *Cipher) Encrypt(plaintext string) (string, error) {
	block, err := aes.NewCipher(c.key)
	if err != nil {
		return "", fmt.Errorf("failed to create cipher block: %w", err)
	}

	// Create GCM
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("failed to create GCM: %w", err)
	}

	// Create nonce
	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", fmt.Errorf("failed to generate nonce: %w", err)
	}

	// Encrypt
	ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)

	// Encode to base64
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

// Decrypt decrypts ciphertext using AES-256-GCM
func (c *Cipher) Decrypt(ciphertext string) (string, error) {
	// Decode from base64
	ct, err := base64.StdEncoding.DecodeString(ciphertext)
	if err != nil {
		return "", fmt.Errorf("failed to decode base64: %w", err)
	}

	block, err := aes.NewCipher(c.key)
	if err != nil {
		return "", fmt.Errorf("failed to create cipher block: %w", err)
	}

	// Create GCM
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("failed to create GCM: %w", err)
	}

	// Extract nonce
	nonceSize := gcm.NonceSize()
	if len(ct) < nonceSize {
		return "", fmt.Errorf("ciphertext too short")
	}

	nonce, ct := ct[:nonceSize], ct[nonceSize:]

	// Decrypt
	plaintext, err := gcm.Open(nil, nonce, ct, nil)
	if err != nil {
		return "", fmt.Errorf("decryption failed: %w", err)
	}

	return string(plaintext), nil
}
