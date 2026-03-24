# 🛒 GenSpend AI - Mindful Checkout Extension

**GenSpend AI** is a Chrome Extension (Manifest V3) designed to help users combat impulsive online shopping. By introducing "intelligent friction" exactly when a user clicks "Buy Now" on e-commerce sites like Amazon and Flipkart, it forces a moment of reflection. 

This project was built as a hackathon-ready MVP to demonstrate behavior tracking, decision friction, and positive user financial impact.

---

## ✨ Core Features

* **🧠 Smart Checkout Detection:** Automatically detects when you are on a product or checkout page and intercepts the "Buy Now" or "Proceed to Checkout" buttons.
* **📊 The GenSpend Score (Impulse Score):** Calculates a real-time score (0–100) based on your browsing behavior. The higher the score, the higher the likelihood that the purchase is impulsive.
* **⏱️ Adaptive Cooling-Off Timer:** Disables the checkout button temporarily based on your GenSpend score:
  * **Score > 70:** 60-second delay
  * **Score > 40:** 30-second delay
  * **Score < 40:** 10-second delay
* **💡 Reality Check UI:** Injects a modern, centered popup overlay that translates the product's price into the actual **hours of your life you have to work** to afford it.
* **💬 Simulated AI Coach:** A floating chat bubble interrupts with thought-provoking questions like *"Do you really need this?"* or *"Will you use this in 7 days?"*
* **🏆 Gamification & Dashboard:** Features an extension popup (`popup.html`) that tracks:
  * Total money saved
  * Number of avoided impulsive purchases
  * Unlockable badges (e.g., Bronze Saver for ₹5,000 saved, Gold Saver for ₹20,000 saved).

---

## 🧮 How the GenSpend Score Works

The extension calculates an impulse score using the following metrics, which are tracked locally:
1. **Time Spent:** How long you looked at the product (in seconds).
2. **Visit Count:** How many times you've visited this exact product URL.
3. **Financial Impact:** The product price relative to your monthly income (stored securely in `chrome.storage`).

**The Formula:**
`Genspend Score = min(100, (timeSpent / 60) * 0.25 + (visitCount * 5) + ((price / income) * 100 * 0.5))`

---

## 🛠️ Tech Stack

* **Plain JavaScript (Vanilla JS):** For lightweight, fast DOM manipulation without external dependencies.
* **Chrome Extension Manifest V3:** Ensuring compliance with the latest web store standards.
* **Chrome Storage API (`chrome.storage.local`):** For secure, persistent local data tracking (no backend required).
* **HTML5 & CSS3:** Modern card-style UI, dark/light mode friendly overlays.

---
🚀 Installation Instructions (Developer Mode)
Since this is an MVP, you can run it directly in Chrome using Developer Mode.

Clone or download this repository to your local machine.

Open Google Chrome and navigate to chrome://extensions/ in your address bar.

In the top right corner, toggle Developer mode to ON.

Click the Load unpacked button in the top left corner.

Select the GenSpend-AI folder you downloaded.

Setup: Click the GenSpend AI puzzle piece icon in your Chrome toolbar, enter your monthly income, and click "Save Settings".

Test it out: Go to Amazon or Flipkart, find a product, and click "Buy Now"!

🔒 Privacy
GenSpend AI runs 100% locally in your browser. It does not use external APIs, and your financial data (income, money saved) never leaves your device.
