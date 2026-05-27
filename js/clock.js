function updateClock() {
	const clockElement = document.getElementById('nav-clock');
	if (!clockElement) return;
	
    const now = new Date();
    
    let hours = now.getHours().toString().padStart(2, '0');
    let minutes = now.getMinutes().toString().padStart(2, '0');
    let seconds = now.getSeconds().toString().padStart(2, '0');
    
    const timeString = `${hours}:${minutes}:${seconds}`;
    
    clockElement.textContent = timeString;
}

updateClock();
setInterval(updateClock, 1000);

async function getBackendMessage() {
    try {
        const response = await fetch(`${window.APP_CONFIG.BACKEND_URL}/api/data`, {
            credentials: 'include'
        });
        if (response.ok) {
            const data = await response.json();
        }
    } catch (err) {
        console.error("Background data logging connection offline:", err);
    }
}

getBackendMessage();