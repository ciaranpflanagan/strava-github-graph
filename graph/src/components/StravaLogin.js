import React from 'react';

const StravaLogin = () => {
    const redirectUri =
        process.env.NODE_ENV === 'production'
            ? 'https://stravacommits.com/exchange_token'
            : 'http://localhost:8080/exchange_token';

    return (
        <a href={`https://www.strava.com/oauth/authorize?client_id=44035&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&approval_prompt=force&scope=activity:read_all`}>
            <img
                src="/btn_strava_connect_with_orange.png"
                alt="Connect with Strava"
            />
        </a>
    );
};

export default StravaLogin;