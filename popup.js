/**
 * GenSpend AI - Popup Script
 * Dashboard logic and user interactions
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Load and display data
    await loadData();
    
    // Setup event listeners
    setupEventListeners();
    
    // Check and display badges
    updateBadges();
});

async function loadData() {
    try {
        const result = await chrome.storage.local.get([
            'savingsData',
            'monthlyIncome'
        ]);
        
        const savings = result.savingsData || {
            totalSaved: 0,
            avoidedPurchases: 0,
            weeklySaved: 0,
            monthlySaved: 0,
            streak: 0
        };
        
        // Update UI
        document.getElementById('totalSaved').textContent = `₹${formatNumber(savings.totalSaved)}`;
        document.getElementById('avoidedCount').textContent = savings.avoidedPurchases;
        document.getElementById('streakCount').textContent = savings.streak;
        document.getElementById('weeklySaved').textContent = `₹${formatNumber(savings.weeklySaved)}`;
        document.getElementById('monthlySaved').textContent = `₹${formatNumber(savings.monthlySaved)}`;
        
        // Calculate hours saved (assuming 22 working days, 8 hours)
        const hourlyRate = (result.monthlyIncome || 50000) / 176;
        const hoursSaved = (savings.totalSaved / hourlyRate).toFixed(1);
        document.getElementById('timeSaved').textContent = hoursSaved;
        
        // Set income input
        document.getElementById('monthlyIncome').value = result.monthlyIncome || 50000;
        
    } catch (e) {
        console.error('Error loading data:', e);
    }
}

function setupEventListeners() {
    // Save income button
    document.getElementById('saveIncome').addEventListener('click', async () => {
        const income = parseFloat(document.getElementById('monthlyIncome').value);
        
        if (isNaN(income) || income <= 0) {
            alert('Please enter a valid income amount');
            return;
        }
        
        await chrome.storage.local.set({ monthlyIncome: income });
        
        // Notify all tabs
        const tabs = await chrome.tabs.query({});
        for (const tab of tabs) {
            try {
                await chrome.tabs.sendMessage(tab.id, { 
                    type: 'updateIncome', 
                    income: income 
                });
            } catch (e) {}
        }
        
        // Show success
        showSaveSuccess();
        
        // Reload data
        await loadData();
    });
}

function showSaveSuccess() {
    const btn = document.getElementById('saveIncome');
    const originalText = btn.textContent;
    btn.textContent = '✓ Saved!';
    btn.style.background = '#10B981';
    
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
    }, 2000);
}

function updateBadges() {
    const savings = JSON.parse(localStorage.getItem('savingsData')) || { totalSaved: 0 };
    const container = document.getElementById('badgeContainer');
    const badges = [];
    
    // Define badges
    if (savings.totalSaved >= 5000) {
        badges.push({ name: 'Bronze', icon: '🥉', class: 'bronze' });
    }
    if (savings.totalSaved >= 10000) {
        badges.push({ name: 'Silver', icon: '🥈', class: 'silver' });
    }
    if (savings.totalSaved >= 20000) {
        badges.push({ name: 'Gold', icon: '🥇', class: 'gold' });
    }
    if (savings.totalSaved >= 50000) {
        badges.push({ name: 'Platinum', icon: '💎', class: 'platinum' });
    }
    if (savings.avoidedPurchases >= 10) {
        badges.push({ name: 'Mindful', icon: '🧘', class: 'mindful' });
    }
    if (savings.streak >= 7) {
        badges.push({ name: 'Consistent', icon: '⭐', class: 'consistent' });
    }
    
    // Render badges
    container.innerHTML = badges.map(badge => `
        <div class="badge ${badge.class}">
            <span class="badge-icon">${badge.icon}</span>
            <span class="badge-name">${badge.name}</span>
        </div>
    `).join('');
}

function formatNumber(num) {
    if (num >= 100000) {
        return (num / 100000).toFixed(1) + 'L';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Also load from chrome.storage since popup has its own scope
async function loadData() {
    try {
        const result = await chrome.storage.local.get(['savingsData', 'monthlyIncome']);
        
        const savings = result.savingsData || {
            totalSaved: 0,
            avoidedPurchases: 0,
            weeklySaved: 0,
            monthlySaved: 0,
            streak: 0
        };
        
        document.getElementById('totalSaved').textContent = `₹${formatNumber(savings.totalSaved)}`;
        document.getElementById('avoidedCount').textContent = savings.avoidedPurchases;
        document.getElementById('streakCount').textContent = savings.streak;
        document.getElementById('weeklySaved').textContent = `₹${formatNumber(savings.weeklySaved)}`;
        document.getElementById('monthlySaved').textContent = `₹${formatNumber(savings.monthlySaved)}`;
        
        const hourlyRate = (result.monthlyIncome || 50000) / 176;
        const hoursSaved = (savings.totalSaved / hourlyRate).toFixed(1);
        document.getElementById('timeSaved').textContent = hoursSaved;
        
        document.getElementById('monthlyIncome').value = result.monthlyIncome || 50000;
        
        // Update badges
        updateBadgesFromStorage(savings);
        
    } catch (e) {
        console.error('Error:', e);
    }
}

function updateBadgesFromStorage(savings) {
    const container = document.getElementById('badgeContainer');
    const badges = [];
    
    if (savings.totalSaved >= 5000) badges.push({ name: 'Bronze Saver', icon: '🥉', class: 'bronze' });
    if (savings.totalSaved >= 20000) badges.push({ name: 'Gold Saver', icon: '🥇', class: 'gold' });
    if (savings.totalSaved >= 50000) badges.push({ name: 'Platinum', icon: '💎', class: 'platinum' });
    if (savings.avoidedPurchases >= 10) badges.push({ name: 'Mindful Shopper', icon: '🧘', class: 'mindful' });
    if (savings.streak >= 7) badges.push({ name: 'Week Warrior', icon: '🔥', class: 'streak' });
    
    container.innerHTML = badges.map(b => `
        <div class="badge ${b.class}">
            <span class="badge-icon">${b.icon}</span>
            <span class="badge-name">${b.name}</span>
        </div>
    `).join('');
    
    if (badges.length === 0) {
        container.innerHTML = '<p class="no-badges">Keep saving to earn badges! 🎯</p>';
    }
}