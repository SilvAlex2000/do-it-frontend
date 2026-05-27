let cachedDropdownHtml = null;
let cachedEmptyHtml = null;
let cachedItemHtml = null;

document.addEventListener("DOMContentLoaded", () => {
    updateNotificationBadge();
    setInterval(updateNotificationBadge, 30000);
});

async function toggleNotificationDropdown(event) {
    if (event) event.stopPropagation();

    const dropdown = document.getElementById('notification-dropdown');
    if (!dropdown) return;

    if (dropdown.style.display === 'none') {
        if (!cachedDropdownHtml) {
            try {
                const response = await fetch('/templates/notification_dropdown.html');
                if (response.ok) {
                    cachedDropdownHtml = await response.text();
                }
            } catch (error) {
                console.error("Error setting up dropdown skeleton:", error);
            }
        }

        if (cachedDropdownHtml) {
            dropdown.innerHTML = cachedDropdownHtml;
        }

        dropdown.style.display = 'flex';
        await loadUserNotifications();
    } else {
        dropdown.style.display = 'none';
    }
}

async function loadUserNotifications() {
    const listContainer = document.getElementById('notification-items-list');
    if (!listContainer) return;

    try {
        const dataResponse = await fetch(`${window.APP_CONFIG.BACKEND_URL}/api/notifications`, {
            credentials: 'include'
        });
        if (!dataResponse.ok) return;
        const notifications = await dataResponse.json();

        if (notifications.length === 0) {
            if (!cachedEmptyHtml) {
                const res = await fetch('/templates/notification_empty.html');
                if (res.ok) cachedEmptyHtml = await res.text();
            }
            listContainer.innerHTML = cachedEmptyHtml || '<p class="padding-md">No notifications</p>';
            return;
        }

        if (!cachedItemHtml) {
            const res = await fetch('/templates/notification_item.html');
            if (res.ok) cachedItemHtml = await res.text();
        }

        listContainer.innerHTML = '';
        notifications.forEach(notif => {
            let html = cachedItemHtml;
            const unreadClass = notif.isRead ? '' : 'unread';
            
            const avatarUrl = notif.actorProfilePic 
                ? `${window.APP_CONFIG.BACKEND_URL}/${notif.actorProfilePic}` 
                : '/img/default-avatar.png';

            html = html.replace(/{unread-class}/g, unreadClass)
                       .replace(/{id}/g, notif.id)
                       .replace(/{target-url}/g, notif.targetUrl)
                       .replace(/{avatar-url}/g, avatarUrl)
                       .replace(/{username}/g, notif.actorUsername)
                       .replace(/{comment-text}/g, notif.messageSnippet || '')
                       .replace(/{time-ago}/g, formatTimeAgo(notif.createdAt));

            const wrapper = document.createElement('div');
            wrapper.innerHTML = html.trim();
            listContainer.appendChild(wrapper.firstChild);
        });
    } catch (error) {
        console.error("Error executing layout generation loop:", error);
    }
}

async function updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    if (!badge) return;

    try {
        const response = await fetch(`${window.APP_CONFIG.BACKEND_URL}/api/notifications/unread-count`, {
            credentials: 'include'
        });
        if (response.ok) {
            const count = await response.json();
            if (count > 0) {
                badge.textContent = count;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }
    } catch (error) {
        console.error("Error connecting with badge synchronization routine:", error);
    }
}

async function handleNotificationClick(targetUrl, id) {
    try {
        await fetch(`${window.APP_CONFIG.BACKEND_URL}/api/notifications/${id}/read`, { 
            method: 'POST',
            credentials: 'include'
        });
        
        const dropdown = document.getElementById('notification-dropdown');
        if (dropdown) dropdown.style.display = 'none';

        navigateTo(targetUrl);
    } catch (error) {
       console.error("Error executing notification redirection sequence:", error);
    }
}

async function markAllNotificationsRead(event) {
    if (event) event.stopPropagation();
    try {
        const response = await fetch(`${window.APP_CONFIG.BACKEND_URL}/api/notifications/mark-all-read`, { 
            method: 'POST',
            credentials: 'include'
        });
        if (response.ok) {
            updateNotificationBadge();
            loadUserNotifications();
        }
    } catch (error) {
        console.error("Error execution bulk read operation:", error);
    }
}

function formatTimeAgo(dateTimeString) {
    const now = new Date();
    const past = new Date(dateTimeString);
    const msPerMinute = 60 * 1000;
    const msPerHour = msPerMinute * 60;
    const msPerDay = msPerHour * 24;
    const elapsed = now - past;

    if (elapsed < msPerMinute) return 'Just now';
    if (elapsed < msPerHour) return Math.round(elapsed / msPerMinute) + ' mins ago';
    if (elapsed < msPerDay) return Math.round(elapsed / msPerHour) + ' hours ago';
    return Math.round(elapsed / msPerDay) + ' days ago';
}

window.addEventListener('click', (event) => {
    const dropdown = document.getElementById('notification-dropdown');
    const bellButton = document.getElementById('btn-notifications');

    if (dropdown && dropdown.style.display !== 'none') {
        if (!dropdown.contains(event.target) && !bellButton.contains(event.target)) {
            dropdown.style.display = 'none';
        }
    }
});