/**
 * GenSpend AI - Background Service Worker
 * Handles extension lifecycle, storage sync, and notifications
 */

// Initialize default data on install
chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('🎯 GenSpend AI: Extension installed');
    
    // Set default values
    await chrome.storage.local.set({
        monthlyIncome: 50000,
        productVisits: {},
        savingsData: {
            totalSaved: 0,
            avoidedPurchases: 0,
            weeklySaved: 0,
            monthlySaved: 0,
            streak: 0,
            lastActiveDate: null
        },
        interventionActive: false,
        blockedPurchase: null
    });

    // Show welcome notification
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.svg',
        title: 'GenSpend AI 🧠',
        message: 'Extension installed! Set your monthly income in the popup for accurate calculations.'
    });
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'purchaseAvoided') {
        console.log('💰 Purchase avoided:', message.amount);
        updateBadge();
    }
    return true;
});

// Update badge with savings count
async function updateBadge() {
    const result = await chrome.storage.local.get('savingsData');
    const savings = result.savingsData;
    
    if (savings && savings.avoidedPurchases > 0) {
        chrome.action.setBadgeText({ text: savings.avoidedPurchases.toString() });
        chrome.action.setBadgeBackgroundColor({ color: '#10B981' });
    }
}

// Check for daily streak update
chrome.alarms.create('dailyStreak', { periodInMinutes: 1440 }); // 24 hours

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'dailyStreak') {
        const result = await chrome.storage.local.get('savingsData');
        const savings = result.savingsData;
        
        if (savings) {
            const today = new Date().toDateString();
            const yesterday = new Date(Date.now() - 86400000).toDateString();
            
            // If user was active yesterday, increment streak
            if (savings.lastActiveDate === yesterday) {
                savings.streak += 1;
            } else if (savings.lastActiveDate !== today) {
                // Missed a day, reset streak
                savings.streak = 0;
            }
            
            await chrome.storage.local.set({ savingsData: savings });
        }
    }
});

// Load saved data on startup
chrome.runtime.onStartup.addListener(async () => {
    updateBadge();
});

console.log('🎯 GenSpend AI: Background service worker loaded');