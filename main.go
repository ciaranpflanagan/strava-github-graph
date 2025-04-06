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
    data.Set("grant_type", "authorization_code") // can only be used once -> need to actually get this from the user

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

    // Obviously, this is not a good idea to print the access token in production code
    fmt.Println("Access Token:", tokenResponse.AccessToken)
    return tokenResponse.AccessToken
}

func getActivities() {
    // accessToken := getAccessToken() // Fetch the access token dynamically
    var body string
    if test {
        data, err := ioutil.ReadFile("./data/test.json")
        if err != nil {
            log.Fatal(err)
        }
        body = string(data)
    } else {
        url := "https://www.strava.com/api/v3/athlete/activities"
        req, _ := http.NewRequest("GET", url, nil)

        req.Header.Set("Authorization", "Bearer "+accessToken)

        // Print the request URL
        fmt.Println("Request URL:", req.URL.String())

        client := &http.Client{}
        resp, err := client.Do(req)
        if err != nil || resp.StatusCode != 200 {
            fmt.Println("Error:", resp)
            log.Fatal(err)
        }
        defer resp.Body.Close()

        responseBody, _ := ioutil.ReadAll(resp.Body)
        body = string(responseBody)
    }

    // Print the response body
    fmt.Println("Response Body:", body)
    activities := saveActivities(body)
    fmt.Println(activities)
}

func saveActivities(body string) []Activity {
    // Define a struct with only the fields you want
    var activities []struct {
        Name       string  `json:"name"`
        Distance   float64 `json:"distance"`
        MovingTime int     `json:"moving_time"`
        StartDate  string  `json:"start_date"`
    }

    // Unmarshal the JSON response into the custom struct
    err := json.Unmarshal([]byte(body), &activities)
    if err != nil {
        log.Fatal("Error unmarshalling JSON:", err)
    }

    // Convert the filtered data into the desired Activity struct
    var filteredActivities []Activity
    for _, act := range activities {
        filteredActivities = append(filteredActivities, Activity{
            Name:       act.Name,
            Distance:   act.Distance,
            MovingTime: act.MovingTime,
            StartDate:  parseDate(act.StartDate),
        })
    }

    // Marshal the filtered activities into JSON
    data, err := json.Marshal(filteredActivities)
    if err != nil {
        log.Fatal("Error marshalling filtered activities:", err)
    }

    // Save the filtered JSON to a file
    err = ioutil.WriteFile("./data/output.json", data, 0644)
    if err != nil {
        log.Fatal("Error writing to file:", err)
    }

    return filteredActivities
}

// Helper function to parse the date string into a time.Time object
func parseDate(dateStr string) time.Time {
    parsedDate, err := time.Parse(time.RFC3339, dateStr)
    if err != nil {
        log.Println("Error parsing date:", err)
        return time.Time{}
    }
    return parsedDate
}

func main() {
    getActivities()
}