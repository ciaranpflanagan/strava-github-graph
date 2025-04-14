import React from 'react';

const StravaLogin = () => {
    return (
        <a href="https://www.strava.com/oauth/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=YOUR_REDIRECT_URI&scope=read">
            <img 
                src="/btn_strava_connect_with_orange.png" 
                alt="Connect with Strava" 
            />
        </a>
    );
};

export default StravaLogin;