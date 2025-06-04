import React from "react";

const Options = ({ options, sportTypeOptions, onChange }) => {
    return (
        <div className="mb-8 flex items-center gap-4">
            <label className="text-lg text-gray-600 font-medium">
                Sport Type:&nbsp;
                <select
                    className="px-3 py-2 rounded-lg border border-gray-300 bg-slate-50 text-gray-800 text-base focus:border-green-500 focus:outline-none"
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