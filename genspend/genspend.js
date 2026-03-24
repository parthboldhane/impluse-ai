function calculateGenspend(timeSpent, visits, price, incomePerHour) {
    let score = 40;

    // Time factor
    if (timeSpent < 30) score += 25;
    else if (timeSpent < 60) score += 15;

    // Visit factor
    if (visits > 3) score += 20;

    // Price vs income
    const hoursNeeded = price / incomePerHour;

    if (hoursNeeded > 5) score += 20;
    else if (hoursNeeded > 2) score += 10;

    return Math.min(score, 100);
}

// Example test
const score = calculateGenspend(20, 4, 2000, 250);
console.log("Genspend Score:", score);