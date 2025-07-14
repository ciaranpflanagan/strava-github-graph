package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"time"

	_ "github.com/denisenkom/go-mssqldb"
	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	_ "github.com/mattn/go-sqlite3"
)

type Activity struct {
	Name       string
	Distance   float64
	MovingTime int       `json:"moving_time"`
	StartDate  time.Time `json:"start_date"`
}

type TokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresAt    int64  `json:"expires_at"`
	ExpiresIn    int    `json:"expires_in"`
	Athlete      struct {
		ID       int    `json:"id"`
		Username string `json:"username"`
	} `json:"athlete"`
}

var clientID string
var clientSecret string
var authCode string

var dbConnStr string
var dbType string

func init() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	clientID = os.Getenv("STRAVA_CLIENT_ID")
	clientSecret = os.Getenv("STRAVA_CLIENT_SECRET")
	authCode = os.Getenv("STRAVA_AUTH_CODE")

	dbConnStr = os.Getenv("DB_CONN_STR")
	dbType = os.Getenv("DB_TYPE") // "sqlserver" for Azure SQL, "sqlite3" for local
	if dbConnStr == "" {
		// Default to local SQLite for dev
		dbConnStr = "./strava_tokens.db"
		dbType = "sqlite3"
	}

	if clientID == "" || clientSecret == "" || authCode == "" {
		log.Fatal("Missing required environment variables: STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_AUTH_CODE")
	}
}

func getAccessTokenFromCode(code string) []byte {
	urlStr := "https://www.strava.com/oauth/token"
	data := url.Values{}
	data.Set("client_id", clientID)
	data.Set("client_secret", clientSecret)
	data.Set("code", code)
	data.Set("grant_type", "authorization_code")

	resp, err := http.PostForm(urlStr, data)
	if err != nil {
		log.Fatal("Error fetching access token:", err)
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Fatal("Error reading response body:", err)
	}

	if resp.StatusCode != http.StatusOK {
		log.Printf("Failed to fetch access token: %s, Response body: %s", resp.Status, string(body))
		return body
	}

	return body
}

func storeTokenData(athleteId int, refreshToken string, expiresAt int64, accessToken string) error {
	db, err := sql.Open(dbType, dbConnStr)
	if err != nil {
		return err
	}
	defer db.Close()

	var createTableStmt, insertStmt string
	if dbType == "sqlserver" {
		createTableStmt = `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tokens' and xtype='U')
		CREATE TABLE tokens (
			id INT IDENTITY(1,1) PRIMARY KEY,
			athlete_id INT,
			refresh_token NVARCHAR(255),
			expires_at BIGINT,
			access_token NVARCHAR(255),
			created_at DATETIME DEFAULT GETDATE()
		)`
		insertStmt = `INSERT INTO tokens (athlete_id, refresh_token, expires_at, access_token) VALUES (@p1, @p2, @p3, @p4)`
	} else {
		createTableStmt = `CREATE TABLE IF NOT EXISTS tokens (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			athlete_id INTEGER,
			refresh_token TEXT,
			expires_at INTEGER,
			access_token TEXT,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`
		insertStmt = `INSERT INTO tokens (athlete_id, refresh_token, expires_at, access_token) VALUES (?, ?, ?, ?)`
	}

	_, err = db.Exec(createTableStmt)
	if err != nil {
		return err
	}

	_, err = db.Exec(insertStmt, athleteId, refreshToken, expiresAt, accessToken)
	return err
}

func getActivitiesHandler(w http.ResponseWriter, r *http.Request) {
	// Parse the JSON body
	var requestBody struct {
		Code string `json:"code"`
		Year string `json:"year"`
	}
	err := json.NewDecoder(r.Body).Decode(&requestBody)
	if err != nil {
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	// Extract the 'code' parameter
	code := requestBody.Code
	if code == "" {
		http.Error(w, "Missing 'code' parameter", http.StatusBadRequest)
		return
	}

	tokenResponseBytes := getAccessTokenFromCode(code)
	var tokenResp TokenResponse
	err = json.Unmarshal(tokenResponseBytes, &tokenResp)
	if err != nil {
		http.Error(w, "Failed to parse access token response", http.StatusInternalServerError)
		return
	}
	accessToken := tokenResp.AccessToken
	if accessToken == "" {
		http.Error(w, "Failed to retrieve access token", http.StatusUnauthorized)
		return
	}

	// Store tokens in SQLite DB
	err = storeTokenData(tokenResp.Athlete.ID, tokenResp.RefreshToken, tokenResp.ExpiresAt, accessToken)
	if err != nil {
		log.Println("Failed to store token data:", err)
	}

	// Determine year and set after/before epochs
	after, before := getYearsEpoc(requestBody.Year)

	var url string
	if before > 0 {
		url = fmt.Sprintf("https://www.strava.com/api/v3/athlete/activities?after=%d&before=%d&per_page=%d", after, before, 200)
	} else {
		url = fmt.Sprintf("https://www.strava.com/api/v3/athlete/activities?after=%d&per_page=%d", after, 200)
	}

	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("Authorization", "Bearer "+accessToken)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil || resp.StatusCode != 200 {
		log.Println("Error fetching activities:", err)
		http.Error(w, "Error fetching activities", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	// Append athlete username to the response
	responseBody, _ := ioutil.ReadAll(resp.Body)
	var activities []map[string]interface{}
	json.Unmarshal(responseBody, &activities)
	response := map[string]interface{}{
		"activities": activities,
		"username":   tokenResp.Athlete.Username,
		"athleteId":  tokenResp.Athlete.ID,
	}
	responseBody, _ = json.Marshal(response)

	w.Header().Set("Content-Type", "application/json")
	w.Write(responseBody)
	return
}

func getActivitiesYearHandler(w http.ResponseWriter, r *http.Request) {
	// Parse the JSON body
	var requestBody struct {
		AthleteId int    `json:"athleteId"`
		Year      string `json:"year"`
	}
	err := json.NewDecoder(r.Body).Decode(&requestBody)
	if err != nil {
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	// Get access token from DB
	var accessToken string
	db, err := sql.Open(dbType, dbConnStr)
	if err != nil {
		http.Error(w, "Error connecting to database", http.StatusInternalServerError)
		return
	}
	defer db.Close()
	if dbType == "sqlserver" {
		err = db.QueryRow("SELECT TOP 1 access_token FROM tokens WHERE athlete_id = @p1 ORDER BY created_at DESC", requestBody.AthleteId).Scan(&accessToken)
	} else {
		err = db.QueryRow("SELECT access_token FROM tokens WHERE athlete_id = ? ORDER BY created_at DESC LIMIT 1", requestBody.AthleteId).Scan(&accessToken)
	}
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "No access token found for athlete", http.StatusNotFound)
			return
		}
		http.Error(w, "Error querying database", http.StatusInternalServerError)
		return
	}

	// Determine year and set after/before epochs
	after, before := getYearsEpoc(requestBody.Year)

	var url string
	if before > 0 {
		url = fmt.Sprintf("https://www.strava.com/api/v3/athlete/activities?after=%d&before=%d&per_page=%d", after, before, 200)
	} else {
		url = fmt.Sprintf("https://www.strava.com/api/v3/athlete/activities?after=%d&per_page=%d", after, 200)
	}

	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("Authorization", "Bearer "+accessToken)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil || resp.StatusCode != 200 {
		http.Error(w, "Error fetching activities", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	// Append athlete username to the response
	responseBody, _ := ioutil.ReadAll(resp.Body)
	var activities []map[string]interface{}
	json.Unmarshal(responseBody, &activities)
	response := map[string]interface{}{
		"activities": activities,
	}
	responseBody, _ = json.Marshal(response)

	w.Header().Set("Content-Type", "application/json")
	w.Write(responseBody)
	return
}

func getYearsEpoc(year string) (after int64, before int64) {
	switch year {
	case "2025":
		// 2025-01-01T00:00:00Z = 1735689600
		// 2025-12-31T23:59:59Z = 1767225599
		after = 1735689600
		before = 1767225599
	case "2024":
		// 2024-01-01T00:00:00Z = 1704067200
		// 2024-12-31T23:59:59Z = 1735689599
		after = 1704067200
		before = 1735689599
	case "2023":
		// 2023-01-01T00:00:00Z = 1672531200
		// 2023-12-31T23:59:59Z = 1704067199
		after = 1672531200
		before = 1704067199
	case "2022":
		// 2022-01-01T00:00:00Z = 1640995200
		// 2022-12-31T23:59:59Z = 1672531199
		after = 1640995200
		before = 1672531199
	case "2021":
		// 2021-01-01T00:00:00Z = 1609459200
		// 2021-12-31T23:59:59Z = 1640995199
		after = 1609459200
		before = 1640995199
	case "2020":
		// 2020-01-01T00:00:00Z = 1577836800
		// 2020-12-31T23:59:59Z = 1609459199
		after = 1577836800
		before = 1609459199
	default:
		// Default to 2025 and beyond
		after = 1735689600
		before = 0 // 0 means no upper bound
	}
	return
}

type spaHandler struct {
	staticPath string
	indexPath  string
}

func (h spaHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// Join internally call path.Clean to prevent directory traversal
	path := filepath.Join(h.staticPath, r.URL.Path)

	// check whether a file exists or is a directory at the given path
	fi, err := os.Stat(path)
	if os.IsNotExist(err) || fi.IsDir() {
		// file does not exist or path is a directory, serve index.html
		http.ServeFile(w, r, filepath.Join(h.staticPath, h.indexPath))
		return
	}

	if err != nil {
		// if we got an error (that wasn't that the file doesn't exist) stating the
		// file, return a 500 internal server error and stop
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// otherwise, use http.FileServer to serve the static file
	http.FileServer(http.Dir(h.staticPath)).ServeHTTP(w, r)
}

func parseDate(dateStr string) time.Time {
	parsedDate, err := time.Parse(time.RFC3339, dateStr)
	if err != nil {
		log.Println("Error parsing date:", err)
		return time.Time{}
	}
	return parsedDate
}

func main() {
	router := mux.NewRouter()

	// API routes
	router.HandleFunc("/api/activities", getActivitiesHandler).Methods("POST")
	router.HandleFunc("/api/activities/year", getActivitiesYearHandler).Methods("POST")

	// Serve React web app
	spa := spaHandler{staticPath: "./graph/build", indexPath: "index.html"}
	router.PathPrefix("/").Handler(spa)

	// Serve static assets like images
	router.PathPrefix("/public/").Handler(http.StripPrefix("/public/", http.FileServer(http.Dir("./graph/public"))))

	fmt.Println("Server is running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", router))
}
