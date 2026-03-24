function calculateGenspend(timeSpent, visits, price, incomePerHour) {
    let score = 40;

    if (timeSpent < 30) score += 25;
    else if (timeSpent < 60) score += 15;

    if (visits > 3) score += 20;

    const hoursNeeded = price / incomePerHour;

    if (hoursNeeded > 5) score += 20;
    else if (hoursNeeded > 2) score += 10;

    return Math.min(score, 100);
}

// Test in Node
console.log("Genspend Score:", calculateGenspend(45, 4, 500, 50));