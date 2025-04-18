import './App.css';
import StravaLogin from './components/StravaLogin';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from "react-router-dom";
import axios from "axios";

const Graph = ({ data }) => {
    const getColor = (value) => {
        if (value === -1) return '#ffffff'; // White for -1
        if (value === 0) return '#F2F2F2'; // Light grey for 0

        const shades = [
            '#b8f5c4', '#c6e48b', '#7bc96f', '#98c902', '#239a3b',
            '#196127', '#0f4c1f', '#0a3a17', '#062a10', '#041d0b', 
        ];

        let index = Math.floor(value / 1000);
        index = Math.floor(index / shades.length);
        console.log('Value:', value, 'Index:', index);
        if (index >= shades.length) {
            return shades[shades.length - 1];
        }
        return shades[index];
    };

    const rows = [];
    const weeks = 52 + 1; // 52 weeks + 1 to include all days of the year (First week isn't entirely 2025)
    const days = 7;
    const currentDate = new Date('2024-12-30');
    for (let i = 0; i < weeks; i++) {
        rows[i] = [];
        for (let j = 0; j < days; j++) {
            const squareDate = new Date(currentDate);

            if (squareDate.getFullYear() !== 2025) {
                rows[i][j] = { distance: -1, Date: squareDate.toISOString().split('T')[0] };
                currentDate.setUTCDate(currentDate.getUTCDate() + 1);
                continue;
            }

            rows[i][j] = { total_distance: 0, Date: squareDate.toISOString().split('T')[0] };
            let foundActivities = data.filter((act) => new Date(act.start_date).toISOString().split('T')[0] === squareDate.toISOString().split('T')[0]);
            if (foundActivities.length === 0) console.log('No activities found for date:', squareDate.toISOString().split('T')[0]);
            for (let jj = 0; jj < foundActivities.length; jj++) {
                console.log('Found activity on', squareDate.toISOString().split('T')[0], ':', foundActivities[jj]);
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
                            style={{ backgroundColor: getColor(activity.total_distance) }}
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
    const [searchParams] = useSearchParams();
    
    useEffect(() => {
        const codeFromParams = searchParams.get("code");
        console.log("Code from URL:", codeFromParams);
        if (codeFromParams) {
            axios.post("/api/activities", { code: codeFromParams }) // Use relative path
            .then(res => {
                console.log("Activities:", res.data);
                const sortedData = res.data.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
                setData(sortedData);
            })
            .catch(err => {
                console.error("Getting activities failed:", err);
            });
        }
    }, [searchParams]);

    return (
        <div className="App" style={{ width: '100%' }}>
            <header className="App-header">
                <h1>Strava Github Style Activity Graph</h1>
                {data.length > 0 ? <Graph data={data} /> : <StravaLogin />}
            </header>
        </div>
    );
}

export default App;
