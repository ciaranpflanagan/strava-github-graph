import './index.css';
import StravaLogin from './components/StravaLogin';
import Options from './components/Options';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { getColor } from './utils/helpers';

const Graph = ({ data, options }) => {
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
            let foundActivities;
            if (options.sportType.toLowerCase() !== "all") {
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
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        const codeFromParams = searchParams.get("code");
        console.log("Code from URL:", codeFromParams);
        if (codeFromParams) {
            setLoading(true);

            axios.post("/api/activities", { code: codeFromParams }) // Use relative path
            .then(res => {
                console.log("Activities:", res.data);
                const sortedData = res.data.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
                setData(sortedData);
            })
            .catch(err => {
                console.error("Getting activities failed:", err);
            })
            .finally(() => setLoading(false));
        }
    }, [searchParams]);

    // State for options
    const [options, setOptions] = useState({ sportType: "Ride" });
    const handleOptionsChange = (newOptions) => {
        setOptions(prev => ({ ...prev, ...newOptions }));
    };

    return (
        <div className="w-screen min-h-screen flex flex-col items-center bg-gradient-to-br from-slate-50 to-blue-100">
            <header className="mt-10 bg-white rounded-3xl shadow-2xl p-10 max-w-5xl w-full flex flex-col items-center">
                <h1 className="text-3xl font-bold text-gray-800 mb-6 tracking-wide">Strava Github Style Activity Graph 2025</h1>
                <Options
                    options={options}
                    sportTypeOptions={["All", "Run", "Ride", "Swim"]}
                    onChange={handleOptionsChange}
                />
                <Graph data={data} options={options} />
                {data.length === 0 && <StravaLogin loading={loading} />}
            </header>
        </div>
    );
}

export default App;
