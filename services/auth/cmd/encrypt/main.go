package main

import (
	"fmt"
	"os"
	"school-erp/auth/pkg/tenant"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: go run main.go <password>")
		os.Exit(1)
	}

	password := os.Args[1]
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

	encrypted, err := cipher.Encrypt(password)
	if err != nil {
		fmt.Printf("Error encrypting password: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Encrypted password: %s\n", encrypted)
}
