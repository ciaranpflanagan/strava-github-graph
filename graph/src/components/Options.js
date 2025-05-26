import React from "react";

const Options = ({ options, sportTypeOptions, onChange }) => {
    return (
        <div className="options">
            <label>
                Sport Type:&nbsp;
                <select
                    value={options.sportType}
                    onChange={e => onChange({ sportType: e.target.value })}
                >
                    {sportTypeOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            </label>
        </div>
    );
};

export default Options;