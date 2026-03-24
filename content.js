/**
 * GenSpend AI - Content Script
 * Handles page detection, price extraction, and intervention UI
 */

(function() {
    'use strict';

    // ============================================
    // CONFIGURATION & CONSTANTS
    // ============================================
    const CONFIG = {
        checkoutKeywords: ['buy', 'checkout', 'cart', 'payment', 'order', 'purchase', 'summary'],
        productKeywords: ['product', 'item', 'p/', 'dp/', 'pid', 'pd/', 'sp=', 'pdp'],
        priceSelectors: [
            '.a-price-whole', '#priceblock_ourprice', '#priceblock_dealprice', 
            '.a-price .a-offscreen', '[data-price]', '.product-price', 
            'span[class*="price"]', '._1kMS', '.pricebox', '.G-col',
            '[class*="Price"]', '.price-current', '[data-testid="price"]',
            '.final-price', '.sell-price', '.product__price'
        ],
        buyButtonSelectors: [
            'button:contains("Buy Now")', 'button:contains("Buy now")', 
            'button:contains("BUY NOW")', 'button:contains("Proceed to Checkout")',
            'button:contains("Place Order")', 'button:contains("Continue")',
            '#buy-now-button', '#buybox-buy-button', '#checkout-button',
            '[data-testid="buy-button"]', '.buy-button', '.add-to-cart',
            'button[type="submit"]', 'input[value*="Buy"]', '[id*="buy"]'
        ]
    };

    const AI_QUESTIONS = [
        "Do you really need this? 🤔",
        "Will you actually use this in 7 days?",
        "Is this a want or a need?",
        "Could you wait 24 hours before buying?",
        "Would you regret not buying this?",
        "Is this aligned with your financial goals?",
        "How many hours of work does this cost you?",
        "Would you rather save this money?"
    ];

    const AI_RESPONSES = [
        "Think about your long-term goals! 🎯",
        "A wise decision takes time. Wait a bit longer.",
        "Your future self will thank you for being careful.",
        "Impulse buys often become regret later.",
        "Consider if this fits your monthly budget.",
        "Let's think about this rationally for a moment.",
        "Great question! Pause and reflect.",
        "Your savings are building your freedom!"
    ];

    // ============================================
    // STATE MANAGEMENT
    // ============================================
    let state = {
        pageStartTime: Date.now(),
        productUrl: window.location.href,
        productPrice: 0,
        visitCount: 1,
        monthlyIncome: 50000,
        isInterventionActive: false,
        countdownSeconds: 0,
        blockedButton: null,
        countdownInterval: null,
        savedMoney: 0
    };

    // ============================================
    // INITIALIZATION
    // ============================================
    async function init() {
        console.log('🧠 GenSpend AI: Starting...');
        
        // Load user data
        await loadUserSettings();
        
        // Check if intervention already active
        const savedState = await chrome.storage.local.get(['interventionActive', 'interventionUrl']);
        if (savedState.interventionActive && savedState.interventionUrl === state.productUrl) {
            console.log('🔄 GenSpend AI: Resuming intervention');
            await loadSavedIntervention();
        }
        
        // Detect product page
        if (isProductPage() || isCheckoutPage()) {
            console.log('📦 Detected product/checkout page');
            detectProductPrice();
            await trackVisit();
            interceptBuyButtons();
            injectChatBubble();
        }

        // Listen for messages
        chrome.runtime.onMessage.addListener(handleMessages);
        
        // Periodic price check (for dynamic pages)
        setTimeout(detectProductPrice, 2000);
    }

    // ============================================
    // STORAGE HELPERS
    // ============================================
    async function loadUserSettings() {
        try {
            const result = await chrome.storage.local.get(['monthlyIncome', 'productVisits', 'blockedPurchase']);
            if (result.monthlyIncome) state.monthlyIncome = result.monthlyIncome;
            
            if (result.productVisits && result.productVisits[state.productUrl]) {
                state.visitCount = result.productVisits[state.productUrl] + 1;
            }
            
            if (result.blockedPurchase) {
                state.savedMoney = result.blockedPurchase.amount || 0;
            }
        } catch (e) {
            console.error('Error loading settings:', e);
        }
    }

    async function loadSavedIntervention() {
        const saved = await chrome.storage.local.get(['countdownRemaining', 'interventionStart']);
        if (saved.countdownRemaining) {
            const elapsed = Math.floor((Date.now() - saved.interventionStart) / 1000);
            state.countdownSeconds = Math.max(0, saved.countdownRemaining - elapsed);
            
            if (state.countdownSeconds > 0) {
                showRealityCheckUI();
            }
        }
    }

    async function trackVisit() {
        const result = await chrome.storage.local.get('productVisits');
        const visits = result.productVisits || {};
        visits[state.productUrl] = state.visitCount;
        await chrome.storage.local.set({ productVisits: visits });
    }

    // ============================================
    // PAGE DETECTION
    // ============================================
    function isProductPage() {
        const url = window.location.href.toLowerCase();
        return CONFIG.productKeywords.some(k => url.includes(k));
    }

    function isCheckoutPage() {
        const url = window.location.href.toLowerCase();
        return CONFIG.checkoutKeywords.some(k => url.includes(k));
    }

    // ============================================
    // PRICE DETECTION
    // ============================================
    function detectProductPrice() {
        for (const selector of CONFIG.priceSelectors) {
            try {
                const elements = document.querySelectorAll(selector);
                for (const el of elements) {
                    const text = el.textContent || el.innerText || '';
                    const price = parsePrice(text);
                    if (price > 0 && price < 100000) { // Reasonable range
                        state.productPrice = price;
                        console.log('💰 Price detected:', price);
                        return;
                    }
                }
            } catch (e) {}
        }
    }

    function parsePrice(text) {
        if (!text) return 0;
        // Remove currency symbols and commas
        const cleaned = text.replace(/[₹$,\s]/g, '').trim();
        // Extract first number
        const match = cleaned.match(/[\d,]+\.?\d*/);
        if (match) {
            return parseFloat(match[0].replace(/,/g, ''));
        }
        return 0;
    }

    // ============================================
    // GENDSPEND SCORE CALCULATION
    // ============================================
    function calculateGenspendScore() {
        const timeSpent = Math.floor((Date.now() - state.pageStartTime) / 1000);
        
        const score = Math.min(100, 
            (timeSpent / 60) * 0.25 + 
            (state.visitCount * 5) + 
            ((state.productPrice / state.monthlyIncome) * 100 * 0.5)
        );
        
        return Math.round(score);
    }

    function getDelayForScore(score) {
        if (score > 70) return 60;
        if (score > 40) return 30;
        return 10;
    }

    function calculateHoursOfWork() {
        // Assuming hourly rate based on monthly income (22 working days, 8 hours/day)
        const hourlyRate = state.monthlyIncome / (22 * 8);
        return (state.productPrice / hourlyRate).toFixed(1);
    }

    // ============================================
    // BUY BUTTON INTERCEPTION
    // ============================================
    function interceptBuyButtons() {
        // Use MutationObserver to catch dynamically added buttons
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        findAndInterceptButtons(node);
                    }
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
        findAndInterceptButtons(document.body);
    }

    function findAndInterceptButtons(root) {
        // Find all buttons and links that might be buy/checkout buttons
        const buttons = root.querySelectorAll('button, input[type="submit"], a, [role="button"]');
        
        buttons.forEach(btn => {
            if (btn.dataset.genspendIntercepted) return;
            
            const text = (btn.textContent || btn.value || '').toLowerCase();
            if (text.includes('buy') || text.includes('checkout') || 
                text.includes('order') || text.includes('payment') ||
                text.includes('proceed') || text.includes('place')) {
                
                btn.dataset.genspendIntercepted = 'true';
                btn.addEventListener('click', handleBuyClick);
            }
        });
    }

    function handleBuyClick(e) {
        if (state.isInterventionActive) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        
        state.isInterventionActive = true;
        showRealityCheckUI();
    }

    // ============================================
    // REALITY CHECK UI
    // ============================================
    function showRealityCheckUI() {
        const score = calculateGenspendScore();
        const delay = getDelayForScore(score);
        state.countdownSeconds = delay;
        
        // Save state
        chrome.storage.local.set({
            interventionActive: true,
            interventionUrl: state.productUrl,
            countdownRemaining: delay,
            interventionStart: Date.now()
        });

        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = 'genspend-overlay';
        overlay.innerHTML = `
            <div class="genspend-modal">
                <div class="genspend-header">
                    <div class="genspend-icon">🧠</div>
                    <h2>GenSpend AI</h2>
                </div>
                
                <div class="genspend-score-section">
                    <div class="genspend-score-circle" style="--score: ${score}">
                        <span class="score-value">${score}</span>
                    </div>
                    <p class="score-label">Impulse Score</p>
                </div>
                
                <div class="genspend-stats">
                    <div class="stat-item">
                        <span class="stat-icon">⏱️</span>
                        <span class="stat-label">Viewed for</span>
                        <span class="stat-value">${Math.floor((Date.now() - state.pageStartTime)/1000)}s</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-icon">🔄</span>
                        <span class="stat-label">Visits</span>
                        <span class="stat-value">${state.visitCount}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-icon">💰</span>
                        <span class="stat-label">Price</span>
                        <span class="stat-value">₹${state.productPrice}</span>
                    </div>
                </div>
                
                <div class="genspend-reality">
                    <p class="reality-text">"This purchase costs you <strong>${calculateHoursOfWork()} hours</strong> of work"</p>
                </div>
                
                <div class="genspend-timer">
                    <div class="timer-bar">
                        <div class="timer-fill" style="animation-duration: ${delay}s"></div>
                    </div>
                    <p class="timer-text">Wait <span id="genspend-countdown">${delay}</span> seconds to proceed</p>
                </div>
                
                <div class="genspend-actions">
                    <button class="genspend-cancel" id="genspend-cancel">❌ Cancel Purchase</button>
                    <button class="genspend-proceed" id="genspend-proceed" disabled>✅ Proceed in <span id="genspend-btn-timer">${delay}</span>s</button>
                </div>
                
                <div class="genspend-tip">
                    <p>💡 Tip: Set your monthly income in the extension popup for accurate calculations!</p>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        
        // Start countdown
        startCountdown(delay);

        // Bind button events
        document.getElementById('genspend-cancel').addEventListener('click', handleCancelPurchase);
        document.getElementById('genspend-proceed').addEventListener('click', handleProceed);
    }

    function startCountdown(delay) {
        let remaining = delay;
        
        state.countdownInterval = setInterval(() => {
            remaining--;
            
            // Update UI
            const countdownEl = document.getElementById('genspend-countdown');
            const btnTimerEl = document.getElementById('genspend-btn-timer');
            const proceedBtn = document.getElementById('genspend-proceed');
            
            if (countdownEl) countdownEl.textContent = remaining;
            if (btnTimerEl) btnTimerEl.textContent = remaining;
            
            // Save remaining time
            chrome.storage.local.set({ countdownRemaining: remaining });
            
            if (remaining <= 0) {
                clearInterval(state.countdownInterval);
                if (proceedBtn) {
                    proceedBtn.disabled = false;
                    proceedBtn.innerHTML = '✅ Proceed to Checkout';
                }
            }
        }, 1000);
    }

    function handleCancelPurchase() {
        // Record avoided purchase
        recordAvoidedPurchase();
        
        // Close modal
        closeIntervention();
        
        // Show thank you message
        showToast('🎉 Great decision! You saved ₹' + state.productPrice);
    }

    async function recordAvoidedPurchase() {
        const result = await chrome.storage.local.get(['savingsData', 'lastPurchase']);
        const savings = result.savingsData || {
            totalSaved: 0,
            avoidedPurchases: 0,
            weeklySaved: 0,
            monthlySaved: 0,
            streak: 0,
            lastActiveDate: null
        };
        
        savings.totalSaved += state.productPrice;
        savings.avoidedPurchases += 1;
        
        // Weekly/Monthly tracking
        const now = new Date();
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        if (new Date(savings.lastActiveDate || 0) >= weekStart) {
            savings.weeklySaved += state.productPrice;
        } else {
            savings.weeklySaved = state.productPrice;
        }
        
        if (new Date(savings.lastActiveDate || 0) >= monthStart) {
            savings.monthlySaved += state.productPrice;
        } else {
            savings.monthlySaved = state.productPrice;
        }
        
        // Update streak
        const today = new Date().toDateString();
        if (savings.lastActiveDate !== today) {
            const yesterday = new Date(Date.now() - 86400000).toDateString();
            if (savings.lastActiveDate === yesterday) {
                savings.streak += 1;
            } else {
                savings.streak = 1;
            }
        }
        
        savings.lastActiveDate = today;
        
        await chrome.storage.local.set({ 
            savingsData: savings,
            blockedPurchase: { amount: state.productPrice, date: Date.now() }
        });
        
        // Notify background script
        chrome.runtime.sendMessage({ type: 'purchaseAvoided', amount: state.productPrice });
    }

    function handleProceed() {
        closeIntervention();
        showToast('✅ Proceeding to checkout...');
        
        // Try to click original button
        const buttons = document.querySelectorAll('[data-genspend-intercepted]');
        buttons.forEach(btn => {
            btn.click();
        });
    }

    function closeIntervention() {
        state.isInterventionActive = false;
        clearInterval(state.countdownInterval);
        
        const overlay = document.getElementById('genspend-overlay');
        if (overlay) overlay.remove();
        
        chrome.storage.local.set({ 
            interventionActive: false,
            interventionUrl: null
        });
    }

    // ============================================
    // CHAT BUBBLE
    // ============================================
    function injectChatBubble() {
        if (document.getElementById('genspend-chat')) return;
        
        const bubble = document.createElement('div');
        bubble.id = 'genspend-chat';
        bubble.innerHTML = `
            <div class="chat-icon">💬</div>
            <div class="chat-content">
                <p class="chat-message">${AI_QUESTIONS[Math.floor(Math.random() * AI_QUESTIONS.length)]}</p>
                <div class="chat-input-area">
                    <input type="text" placeholder="Type a response..." id="genspend-chat-input">
                    <button id="genspend-chat-send">Send</button>
                </div>
                <div class="chat-responses" id="genspend-responses"></div>
            </div>
        `;
        
        document.body.appendChild(bubble);
        
        // Toggle chat
        document.querySelector('.chat-icon').addEventListener('click', () => {
            bubble.classList.toggle('active');
        });
        
        // Chat functionality
        document.getElementById('genspend-chat-send').addEventListener('click', handleChatSubmit);
        document.getElementById('genspend-chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleChatSubmit();
        });
    }

    function handleChatSubmit() {
        const input = document.getElementById('genspend-chat-input');
        const message = input.value.trim();
        if (!message) return;
        
        // Add user message
        addChatMessage('You', message, 'user');
        input.value = '';
        
        // Simulate AI response after delay
        setTimeout(() => {
            const response = AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)];
            addChatMessage('GenSpend AI', response, 'ai');
        }, 500);
    }

    function addChatMessage(sender, text, type) {
        const container = document.getElementById('genspend-responses');
        const msg = document.createElement('div');
        msg.className = `chat-msg ${type}`;
        msg.innerHTML = `<strong>${sender}:</strong> ${text}`;
        container.appendChild(msg);
        container.scrollTop = container.scrollHeight;
    }

    // ============================================
    // TOAST NOTIFICATIONS
    // ============================================
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'genspend-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ============================================
    // MESSAGE HANDLING
    // ============================================
    function handleMessages(message, sender, sendResponse) {
        if (message.type === 'updateIncome') {
            state.monthlyIncome = message.income;
            sendResponse({ success: true });
        }
        if (message.type === 'getPageData') {
            sendResponse({ 
                price: state.productPrice, 
                url: state.productUrl,
                score: calculateGenspendScore()
            });
        }
        return true;
    }

    // ============================================
    // START
    // ============================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();