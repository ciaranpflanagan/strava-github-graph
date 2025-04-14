import React from 'react';

const StravaLogin = () => {
    return (
        <a href="https://www.strava.com/oauth/authorize?client_id=44035&response_type=code&redirect_uri=http://localhost/exchange_token&approval_prompt=force&scope=activity:read_all">
            <img 
                src="/btn_strava_connect_with_orange.png" 
                alt="Connect with Strava" 
            />
        </a>
    );
};

export default StravaLogin;