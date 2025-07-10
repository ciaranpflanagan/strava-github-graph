import './index.css';
import StravaLogin from './components/StravaLogin';
import Options from './components/Options';
import LoadingSpinner from './components/LoadingSpinner';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { getColor } from './utils/helpers';

const Graph = ({ data, options }) => {
    const year = parseInt(options.year, 10) || new Date().getFullYear();
    // Find the first Monday on or before Jan 1st of the selected year
    const jan1 = new Date(Date.UTC(year, 0, 1));
    const dayOfWeek = jan1.getUTCDay(); // 0=Sunday, 1=Monday, ...
    // Calculate offset: if Jan 1 is not Monday, go back to previous Monday
    const offset = dayOfWeek === 1 ? 0 : (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
    const graphStartDate = new Date(jan1);
    graphStartDate.setUTCDate(jan1.getUTCDate() - offset);

    // Find the last day of the year
    const dec31 = new Date(Date.UTC(year, 11, 31));
    // Find the last Sunday on or after Dec 31st
    const lastDayOfWeek = dec31.getUTCDay();
    const endOffset = lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek;
    const graphEndDate = new Date(dec31);
    graphEndDate.setUTCDate(dec31.getUTCDate() + endOffset);

    // Calculate number of weeks
    const days = Math.round((graphEndDate - graphStartDate) / (1000 * 60 * 60 * 24)) + 1;
    const weeks = Math.ceil(days / 7);

    const rows = [];
    const currentDate = new Date(graphStartDate);
    for (let i = 0; i < weeks; i++) {
        rows[i] = [];
        for (let j = 0; j < 7; j++) {
            const squareDate = new Date(currentDate);
            // If not in the selected year, mark as -1
            if (squareDate.getUTCFullYear() !== year) {
                rows[i][j] = { distance: -1, Date: squareDate.toISOString().split('T')[0] };
                currentDate.setUTCDate(currentDate.getUTCDate() + 1);
                continue;
            }
            rows[i][j] = { total_distance: 0, Date: squareDate.toISOString().split('T')[0] };
            let foundActivities;
            if (options.sportType && options.sportType.toLowerCase() !== "all") {
                foundActivities = data.filter(
                    (act) =>
                        new Date(act.start_date).toISOString().split('T')[0] === squareDate.toISOString().split('T')[0] &&
                        act.sport_type === options.sportType
                );
            } else {
                foundActivities = data.filter(
                    (act) =>
                        new Date(act.start_date).toISOString().split('T')[0] === squareDate.toISOString().split('T')[0]
                );
            }
            for (let jj = 0; jj < foundActivities.length; jj++) {
                rows[i][j].total_distance += foundActivities[jj].distance;
            }
            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }
    }

    return (
        <div className="graph">
            {rows.map((row, rowIndex) => (
                <div key={rowIndex} className="row" style={{ flexDirection: 'column' }}>
                    {row.map((activity, colIndex) => (
                        <div
                            key={colIndex}
                            className="activity"
                            style={{ backgroundColor: getColor(activity.total_distance, data, options) }}
                            alt={activity.Date + ':' + (activity.total_distance / 1000) + 'km'}
                        ></div>
                    ))}
                </div>
            ))}
        </div>
    );
};

function App() {
    const [data, setData] = useState([]); 
    const [username, setUsername] = useState("");
    const [athleteId, setAthleteId] = useState(null);
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(false);

    // State for options
    const [options, setOptions] = useState({ sportType: "Ride", year: "2025" });
    const handleOptionsChange = (newOptions) => {
        setOptions(prev => ({ ...prev, ...newOptions }));
    };
    
    useEffect(() => {
        const codeFromParams = searchParams.get("code");

        // If athleteId is already set, then we don't use first access token
        if (athleteId) {
            setLoading(true);
            axios.post("/api/activities/year", {
                year: options.year,
                athleteId: athleteId,
            })
            .then(res => {
                const sortedData = res.data.activities.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
                setData(sortedData);
            })
            .catch(err => {
                console.error("Getting activities failed:", err);
            })
            .finally(() => setLoading(false));
            return;
        }

        // If we have a code from the URL, we fetch activities for the first time
        if (codeFromParams) {
            setLoading(true);

            axios.post("/api/activities", {
                code: codeFromParams,
                year: options.year,
            })
            .then(res => {
                const sortedData = res.data.activities.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
                setData(sortedData);
                setUsername(res.data.username);
                setAthleteId(res.data.athleteId);
            })
            .catch(err => {
                console.error("Getting activities failed:", err);
            })
            .finally(() => setLoading(false));
        }
    }, [searchParams, options]);

    return (
        <div className="w-screen min-h-screen flex flex-col items-center bg-gradient-to-br from-slate-50 to-blue-100">
            <header className="mt-10 bg-white rounded-3xl shadow-2xl p-10 max-w-5xl w-full flex flex-col items-center">
                <h1 className="text-3xl font-bold text-gray-800 mb-6 tracking-wide">Strava Commits {username && ( <span>- {username}</span>)}</h1>
                <Options
                    options={options}
                    sportTypeOptions={["All", "Run", "Ride", "Swim"]}
                    onChange={handleOptionsChange}
                />
                <Graph data={data} options={options} />
                {(data.length === 0 && !loading) && <StravaLogin />}
                {loading && <LoadingSpinner />}
            </header>
        </div>
    );
}

export default App;
