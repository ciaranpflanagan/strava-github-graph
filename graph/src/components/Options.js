import React from "react";

const Options = ({ options, sportTypeOptions, onChange }) => {
    return (
        <div className="mb-8 flex items-center gap-4">
            <label className="font-medium text-gray-700">Sport Type:</label>
                <select
                    className="rounded-lg border border-gray-300 px-4 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    value={options.sportType}
                    onChange={e => onChange({ sportType: e.target.value })}
                >
                    {sportTypeOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>

            <label htmlFor="year-select" className="font-medium text-gray-700">Year:</label>
                <select
                    id="year-select"
                    value={options.year}
                    onChange={e => onChange({ year: e.target.value })}
                    className="rounded-lg border border-gray-300 px-4 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                    <option value={"2025"}>2025</option>
                    <option value={"2024"}>2024</option>
                    <option value={"2023"}>2023</option>
                </select>
        </div>
    );
};

export default Options;