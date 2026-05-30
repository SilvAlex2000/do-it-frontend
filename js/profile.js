async function loadProfilePosts(username) {
    const container = document.getElementById('user-posts-container');
    if (!container) return;

    try {
        const [response, templateReq] = await Promise.all([
            fetch(`${window.APP_CONFIG.BACKEND_URL}/api/posts?username=${username}`, {
                credentials: 'include'
            }),
            fetch('/templates/post_item.html')
        ]);

        if (!response.ok || !templateReq.ok) throw new Error("Could not fetch profile feed or template.");

        const posts = await response.json();
        const postCardTemplate = await templateReq.text();

        container.innerHTML = '';

        if (posts.length === 0) {
            container.innerHTML = '<p class="no-posts-msg">No posts shared yet.</p>';
            return;
        }

        posts.forEach(post => {
            const postEl = renderPost(postCardTemplate, post);
            container.appendChild(postEl);
        });
    } catch (e) {
        console.error(\"Failed to load profile posts\", e);
    }
}

async function uploadPic() {
    const fileInput = document.getElementById('pic-upload');
    if (!fileInput || fileInput.files.length === 0) {
        showToast("Please select an image first", 'error');
        return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    try {
        const response = await fetch(`${window.APP_CONFIG.BACKEND_URL}/api/upload-profile-pic`, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });

        const result = await response.json();
        if (response.ok) {
            showToast(result.message, "success");
            const currentAvatar = document.querySelector('.current-avatar');
            if (currentAvatar && result.newPath) {
                currentAvatar.src = `${window.APP_CONFIG.BACKEND_URL}${result.newPath}?t=${new Date().getTime()}`;
            }
        } else {
            showToast(result.message, "error");
        }
    } catch (e) {
        console.error("Profile picture upload failure sequence:", e);
        showToast("Upload failed.", "error");
    }
}