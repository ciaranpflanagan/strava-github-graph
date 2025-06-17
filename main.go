package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"time"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
)

type Activity struct {
	Name       string
	Distance   float64
	MovingTime int       `json:"moving_time"`
	StartDate  time.Time `json:"start_date"`
}

type TokenResponse struct {
	AccessToken string `json:"access_token"`
}

var clientID string
var clientSecret string
var authCode string

const test = false

func init() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	clientID = os.Getenv("STRAVA_CLIENT_ID")
	clientSecret = os.Getenv("STRAVA_CLIENT_SECRET")
	authCode = os.Getenv("STRAVA_AUTH_CODE")

	if clientID == "" || clientSecret == "" || authCode == "" {
		log.Fatal("Missing required environment variables: STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_AUTH_CODE")
	}
}

func getAccessTokenFromCode(code string) string {
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

	if resp.StatusCode != http.StatusOK {
		body, _ := ioutil.ReadAll(resp.Body)
		log.Println("Failed to fetch access token: %s, Response body: %s", resp.Status, string(body))
		return ""
	}

	var tokenResponse TokenResponse
	body, _ := ioutil.ReadAll(resp.Body)
	err = json.Unmarshal(body, &tokenResponse)
	if err != nil {
		log.Fatal("Error parsing token response:", err)
	}

	return tokenResponse.AccessToken
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

	accessToken := getAccessTokenFromCode(code)
	if accessToken == "" {
		http.Error(w, "Failed to retrieve access token", http.StatusUnauthorized)
		return
	}

	// Determine year and set after/before epochs
	var after, before int64
	if requestBody.Year == "2024" {
		// 2024-01-01T00:00:00Z = 1704067200
		// 2024-12-31T23:59:59Z = 1735689599
		after = 1704067200
		before = 1735689599
	} else {
		// Default to 2025 and beyond
		// 2025-01-01T00:00:00Z = 1735689600
		after = 1735689600
		before = 0 // 0 means no upper bound
	}
	// log.Printf("Fetching activities with after=%d, before=%d", after, before)

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

	responseBody, _ := ioutil.ReadAll(resp.Body)
	w.Header().Set("Content-Type", "application/json")
	w.Write(responseBody)
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

func saveActivities(body string) []Activity {
	var activities []struct {
		Name       string  `json:"name"`
		Distance   float64 `json:"distance"`
		MovingTime int     `json:"moving_time"`
		StartDate  string  `json:"start_date"`
	}

	err := json.Unmarshal([]byte(body), &activities)
	if err != nil {
		log.Fatal("Error unmarshalling JSON:", err)
	}

	var filteredActivities []Activity
	for _, act := range activities {
		filteredActivities = append(filteredActivities, Activity{
			Name:       act.Name,
			Distance:   act.Distance,
			MovingTime: act.MovingTime,
			StartDate:  parseDate(act.StartDate),
		})
	}

	return filteredActivities
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

	// Serve React web app
	spa := spaHandler{staticPath: "./graph/build", indexPath: "index.html"}
	router.PathPrefix("/").Handler(spa)

	// Serve static assets like images
	router.PathPrefix("/public/").Handler(http.StripPrefix("/public/", http.FileServer(http.Dir("./graph/public"))))

	fmt.Println("Server is running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", router))
}
