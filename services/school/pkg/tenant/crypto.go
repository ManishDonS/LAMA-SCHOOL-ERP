package tenant

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"io"
)

// Cipher manages encryption and decryption of sensitive data
type Cipher struct {
	key []byte
}

// NewCipher creates a new cipher instance
func NewCipher(key string) (*Cipher, error) {
	// Ensure key is 32 bytes (256-bit)
	keyBytes := []byte(key)
	if len(keyBytes) < 32 {
		// Pad with zeros if too short (not recommended for production)
		for len(keyBytes) < 32 {
			keyBytes = append(keyBytes, 0)
		}
	} else if len(keyBytes) > 32 {
		keyBytes = keyBytes[:32]
	}

	return &Cipher{
		key: keyBytes,
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
