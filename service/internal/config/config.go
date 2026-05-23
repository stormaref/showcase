package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	AppEnv              string
	APIHost             string
	APIPort             string
	DatabaseURL         string
	MinioEndpoint       string
	MinioAccessKey      string
	MinioSecretKey      string
	MinioBucket         string
	MinioUseSSL         bool
	MediaPublicBaseURL  string
	JWTAccessSecret     string
	JWTRefreshSecret    string
	JWTAccessTTL        time.Duration
	JWTRefreshTTL       time.Duration
	CORSOrigins         []string
	CookieDomain        string
	BootstrapAdminEmail string
	BootstrapAdminPass  string
	MaxUploadBytes      int64
	RateLimitPerMinute  int
	LoginRateLimit      int
}

func Load() (*Config, error) {
	accessMin, _ := strconv.Atoi(getEnv("JWT_ACCESS_TTL_MINUTES", "15"))
	refreshDays, _ := strconv.Atoi(getEnv("JWT_REFRESH_TTL_DAYS", "7"))
	maxUploadMB, _ := strconv.Atoi(getEnv("MAX_UPLOAD_MB", "10"))
	rateLimit, _ := strconv.Atoi(getEnv("RATE_LIMIT_PER_MINUTE", "100"))
	loginLimit, _ := strconv.Atoi(getEnv("LOGIN_RATE_LIMIT_PER_MINUTE", "5"))

	cfg := &Config{
		AppEnv:              getEnv("APP_ENV", "development"),
		APIHost:             getEnv("API_HOST", "0.0.0.0"),
		APIPort:             getEnv("API_PORT", "8080"),
		DatabaseURL:         os.Getenv("DATABASE_URL"),
		MinioEndpoint:       getEnv("MINIO_ENDPOINT", "localhost:9000"),
		MinioAccessKey:      getEnv("MINIO_ACCESS_KEY", "showcase_minio"),
		MinioSecretKey:      getEnv("MINIO_SECRET_KEY", "showcase_minio_password"),
		MinioBucket:         getEnv("MINIO_BUCKET", "showcase-media"),
		MinioUseSSL:         getEnv("MINIO_USE_SSL", "false") == "true",
		MediaPublicBaseURL:  strings.TrimRight(getEnv("MEDIA_PUBLIC_BASE_URL", "http://localhost:9000/showcase-media"), "/"),
		JWTAccessSecret:     os.Getenv("JWT_ACCESS_SECRET"),
		JWTRefreshSecret:    os.Getenv("JWT_REFRESH_SECRET"),
		JWTAccessTTL:        time.Duration(accessMin) * time.Minute,
		JWTRefreshTTL:       time.Duration(refreshDays) * 24 * time.Hour,
		CORSOrigins:         splitCSV(getEnv("CORS_ORIGINS", "http://localhost:3000")),
		CookieDomain:        getEnv("COOKIE_DOMAIN", "localhost"),
		BootstrapAdminEmail: os.Getenv("BOOTSTRAP_ADMIN_EMAIL"),
		BootstrapAdminPass:  os.Getenv("BOOTSTRAP_ADMIN_PASSWORD"),
		MaxUploadBytes:      int64(maxUploadMB) * 1024 * 1024,
		RateLimitPerMinute:  rateLimit,
		LoginRateLimit:      loginLimit,
	}

	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}
	if len(cfg.JWTAccessSecret) < 32 || len(cfg.JWTRefreshSecret) < 32 {
		return nil, fmt.Errorf("JWT secrets must be at least 32 characters")
	}
	return cfg, nil
}

func (c *Config) ListenAddr() string {
	return c.APIHost + ":" + c.APIPort
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func splitCSV(s string) []string {
	parts := strings.Split(s, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			out = append(out, p)
		}
	}
	return out
}
