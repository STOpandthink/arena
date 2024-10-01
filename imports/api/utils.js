
export function revCompareNumbers(a, b) {
    return b - a;
}

export function getRand(min, max) {
    return Math.random() * (max - min + 1) + min;
}

// Return random [min, max]
export function getRandInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}