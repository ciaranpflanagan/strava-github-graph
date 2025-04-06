import './App.css';
import React, { useEffect, useState } from 'react';

const Graph = ({ data }) => {
    const getColor = (value) => {
        if (value === -1) return '#ffffff'; // White for -1
        if (value === 0) return '#F2F2F2'; // Light grey for 0

        const shades = [
            '#b8f5c4', '#c6e48b', '#7bc96f', '#239a3b', '#196127',
            '#0f4c1f', '#0a3a17', '#062a10', '#041d0b', '#98c902'
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
                currentDate.setDate(currentDate.getDate() + 1);
                continue;
            }

            let activity = data.find((act) => new Date(act.start_date).toISOString().split('T')[0] === squareDate.toISOString().split('T')[0]);
            if (activity) {
                console.log('Found activity:', activity);
                rows[i][j] = { distance: activity.distance, Date: squareDate.toISOString().split('T')[0] };
            } else {
                console.log('No activity found for date:', squareDate.toISOString().split('T')[0]);
                rows[i][j] = { distance: 0, Date: squareDate.toISOString().split('T')[0] };
            }

            currentDate.setDate(currentDate.getDate() + 1);
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
                            style={{ backgroundColor: getColor(activity.distance) }}
                            alt={activity.Date + ':' + activity.distance + 'km'}
                        ></div>
                    ))}
                </div>
            ))}
        </div>
    );
};

function App() {
    const [data, setData] = useState([]); 
    useEffect(() => {
        fetch(process.env.PUBLIC_URL + '/test.json')
            .then((response) => response.json())
            .then((data) => data.sort((a, b) => new Date(a.start_date) - new Date(b.start_date)))
            .then((data) => setData(data))
            .catch((error) => console.error('Error fetching data:', error));
    }, []);

    return (
        <div className="App" style={{ width: '100%' }}>
            <header className="App-header">
                <h1>Strava Github Style Activity Graph</h1>
                {data.length > 0 ? <Graph data={data} /> : <p>Loading...</p>}
            </header>
        </div>
    );
}

export default App;
