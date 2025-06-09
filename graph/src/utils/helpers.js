// Pretty sure this helper is useless
export function getSportDivider(sportType) {
    switch (sportType.toLowerCase()) {
        case "ride":
        case "all":
        default:
            return 1000;
        case "run":
        case "walk":
        case "hike":
            return 1000;
    }
}

export function getColor (value, data, options) {
    if (value === -1) return '#ffffff'; // White for -1
    if (value === 0) return '#F2F2F2'; // Light grey for 0

    let activities = data;
    if (options.sportType.toLowerCase() !== "all") {
        activities = activities.filter(act => act.sport_type === options.sportType);
    }
    const divider = getSportDivider(options.sportType);
    const distances = activities.map(act => act.distance);
    const maxDistance = Math.max(...distances) / divider;
    const minDistance = Math.min(...distances) / divider;
    console.log('Max Distance:', maxDistance, 'Min Distance:', minDistance);

    const shades = [
        "#ebf7e4",
        "#d6f3c0",
        "#b7e99c",
        "#94d76a",
        "#6cc644",
        "#57a537",
        "#41882a",
        "#2e6a1e",
        "#1d4d12",
        "#0f3709"
    ];

    const range = maxDistance - minDistance;
    const normalizedValue = ((value / divider) - minDistance) / range;
    console.log('Normalized Value:', normalizedValue, 'Range:', range, 'Value:', value/divider);
    const shadeIndex = Math.floor(normalizedValue * (shades.length - 1));
    return shades[shadeIndex];
};