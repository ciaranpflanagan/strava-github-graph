package main

import (
    "encoding/json"
    "fmt"
    "io/ioutil"
    "log"
    "net/http"
    "time"
)

type Activity struct {
    Name       string
    Distance   float64
    MovingTime int       `json:"moving_time"`
    StartDate  time.Time `json:"start_date"`
}

const accessToken = ""
const test = true

func getActivities() {
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

        client := &http.Client{}
        resp, err := client.Do(req)
        if err != nil {
            log.Fatal(err)
        }
        defer resp.Body.Close()

        responseBody, _ := ioutil.ReadAll(resp.Body)
        body = string(responseBody)
    }

    activities := saveActivities(body)
    fmt.Println(activities)
}

func saveActivities(body string) []Activity {
    var activities []Activity
    err := json.Unmarshal([]byte(body), &activities)
    if err != nil {
        log.Fatal(err)
    }

    return activities
}

func main() {
    getActivities()
}