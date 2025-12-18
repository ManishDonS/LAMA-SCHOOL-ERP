package main

import (
	"fmt"
	"os"
	"school-erp/auth/pkg/tenant"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: go run main.go <encrypted_password>")
		os.Exit(1)
	}

	encryptedPassword := os.Args[1]
	encryptionKey := os.Getenv("ENCRYPTION_KEY")

	if encryptionKey == "" {
		fmt.Println("Error: ENCRYPTION_KEY environment variable not set")
		os.Exit(1)
	}

	cipher, err := tenant.NewCipher(encryptionKey)
	if err != nil {
		fmt.Printf("Error creating cipher: %v\n", err)
		os.Exit(1)
	}

	decrypted, err := cipher.Decrypt(encryptedPassword)
	if err != nil {
		fmt.Printf("Error decrypting password: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Decrypted password: %s\n", decrypted)
}
