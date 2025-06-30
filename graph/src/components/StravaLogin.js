import React from 'react';

const StravaLogin = ({ loading }) => {
    if (loading) {
        return (
            <div className="flex justify-center items-center h-16">
                <svg className="animate-spin h-10 w-10 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
            </div>
        );
    }

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