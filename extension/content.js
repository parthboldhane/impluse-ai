let isPopupActive = false;

function detectBuyButtons() {
    const buttons = document.querySelectorAll("button, input[type='submit'], a");

    buttons.forEach(btn => {
        const text = btn.innerText?.toLowerCase() || btn.value?.toLowerCase() || "";

        if (
            text.includes("buy") ||
            text.includes("checkout") ||
            text.includes("place order") ||
            text.includes("proceed")
        ) {
            btn.addEventListener("click", (e) => {
                if (!isPopupActive) {
                    e.preventDefault();
                    showPopup();
                }
            });
        }
    });
}

function showPopup() {
    isPopupActive = true;

    const overlay = document.createElement("div");

    overlay.innerHTML = `
    <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
    ">
        <div style="
            background: white;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            width: 300px;
        ">
            <h2>⚠️ Think Again</h2>
            <p>This might be an impulsive purchase.</p>
            <button id="continueBtn">Continue Anyway</button>
        </div>
    </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById("continueBtn").onclick = () => {
        overlay.remove();
        isPopupActive = false;
    };
}

setInterval(detectBuyButtons, 2000);