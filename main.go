package main

import (
    "encoding/json"
    "fmt"
    "io/ioutil"
    "log"
    "net/http"
    "net/url"
    "os"
    "time"
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

func getAccessToken() string {
    urlStr := "https://www.strava.com/oauth/token"
    data := url.Values{}
    data.Set("client_id", clientID)
    data.Set("client_secret", clientSecret)
    data.Set("code", authCode)
    data.Set("grant_type", "authorization_code")

    resp, err := http.PostForm(urlStr, data)
    if err != nil {
        log.Fatal("Error fetching access token:", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        log.Fatalf("Failed to fetch access token: %s", resp.Status)
    }

    var tokenResponse TokenResponse
    body, _ := ioutil.ReadAll(resp.Body)
    err = json.Unmarshal(body, &tokenResponse)
    if err != nil {
        log.Fatal("Error parsing token response:", err)
    }

    // log
    fmt.Println("Access Token:", tokenResponse.AccessToken) // For debugging purposes
    return tokenResponse.AccessToken
}

func getActivitiesHandler(w http.ResponseWriter, r *http.Request) {
    accessToken := getAccessToken()
    var body string
    if test {
        data, err := ioutil.ReadFile("./data/test.json")
        if err != nil {
            http.Error(w, "Error reading test data", http.StatusInternalServerError)
            return
        }
        body = string(data)
    } else {
        url := "https://www.strava.com/api/v3/athlete/activities"
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
        body = string(responseBody)
    }

    activities := saveActivities(body)
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(activities)
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
    http.HandleFunc("/activities", getActivitiesHandler)
    fmt.Println("Server is running on http://localhost:8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}