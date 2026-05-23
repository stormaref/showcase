package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/stormaref/showcase/service/internal/domain/model"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	_ = godotenv.Load()
	_ = godotenv.Load("../.env")
	_ = godotenv.Load("../../.env")

	email := flag.String("email", "", "admin email (login username)")
	password := flag.String("password", "", "plain password (min 8 characters; or set CREATE_ADMIN_PASSWORD)")
	flag.Parse()

	if *email == "" && flag.NArg() >= 1 {
		*email = flag.Arg(0)
	}
	if *password == "" && flag.NArg() >= 2 {
		*password = flag.Arg(1)
	}
	if *password == "" {
		*password = os.Getenv("CREATE_ADMIN_PASSWORD")
	}

	if *email == "" {
		fmt.Fprintln(os.Stderr, "usage: create-admin --email <email> --password <password>")
		fmt.Fprintln(os.Stderr, "   or: create-admin <email> <password>")
		os.Exit(2)
	}
	if len(*password) < 8 {
		log.Fatal("password must be at least 8 characters")
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL is required (set in environment or .env)")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(*password), 12)
	if err != nil {
		log.Fatalf("hash password: %v", err)
	}

	db, err := gorm.Open(postgres.Open(dbURL), &gorm.Config{})
	if err != nil {
		log.Fatalf("database: %v", err)
	}

	ctx := context.Background()
	admin := &model.Admin{
		Email:        *email,
		PasswordHash: string(hash),
		IsActive:     true,
	}
	if err := db.WithContext(ctx).Create(admin).Error; err != nil {
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			log.Fatalf("admin with email %q already exists", *email)
		}
		log.Fatalf("create admin: %v", err)
	}

	fmt.Printf("Created admin %s (id %s)\n", admin.Email, admin.ID)
}
