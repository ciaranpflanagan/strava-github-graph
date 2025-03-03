import './App.css';
import React, { useEffect, useState } from 'react';

const Graph = ({ data }) => {
    const getColor = (value) => {
      const shades = [
        '#b8f5c4', '#c6e48b', '#7bc96f', '#239a3b', '#196127',
        '#0f4c1f', '#0a3a17', '#062a10', '#041d0b', '#98c902'
      ];

      // Get index based on length, anything over 100k will be the last shade, 10k increments for the rest
      const index = Math.floor(value / 10000);
      if (index >= shades.length) {
        // Might have to adjust this to be a different color, or add more shades
        return shades[shades.length - 1];
      }
      return shades[index];
    };

    // Todo: Remove this function, it's only for testing
    const getRandomNumber = (min, max) => {
        min *= 10000;
        max *= 10000;

        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    const rows = [];
    for (let i = 0; i < 7; i++) {
        rows.push(data.slice(i * 10, (i + 1) * 10));

        // Push remaining empty rows, todo: fix this with actual date data
        let remaining = 52 - (data.length % 7);
        for (let j = 0; j < remaining; j++) {
            rows[i].push({ Distance: 0 });
        }
    }

    return (
        <div className="graph">
            {rows.map((row, rowIndex) => (
                <div key={rowIndex} className="row">
                    {row.map((activity, colIndex) => (
                        <div
                            key={colIndex}
                            className="activity"
                            style={{ backgroundColor: getColor(activity.Distance) }}
                            // style={{ backgroundColor: getColor(getRandomNumber(0, 10)) }}
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
            .then((data) => setData(data))
            .catch((error) => console.error('Error fetching data:', error));
    }, []);

    return (
        <div className="App" style={{ width: '100%' }}>
            <header className="App-header">
                <Graph data={data} />
            </header>
        </div>
    );
}

export default App;
