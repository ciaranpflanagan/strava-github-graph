package main

import (
    "fmt"
    "net/http"
    "io/ioutil"
    "log"
)

type Activity struct {
	Title string
	Distance  int
	Duration  int
}

const accessToken = "token"

func getActivities() {
    url := "https://www.strava.com/api/v3/athlete/activities"
    req, _ := http.NewRequest("GET", url, nil)

    req.Header.Set("Authorization", "Bearer "+accessToken)

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        log.Fatal(err)
    }
    defer resp.Body.Close()

    body, _ := ioutil.ReadAll(resp.Body)
    fmt.Println(string(body)) // Raw JSON response
}

func main() {
    getActivities()
}