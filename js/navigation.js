async function updateNavigation(forceData = null) {
    try {
        const response = await fetch(`${window.APP_CONFIG.BACKEND_URL}/api/check-auth`, {
            credentials: 'include'
        });

        if (!response.ok) {
            console.error("Auth check failed with status:", response.status);
            return;
        }

        const text = await response.text();
        
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error("Failed to parse JSON. Raw response:", text);
            return;
        }

        const loggedInNav = document.getElementById('logged-in-nav') || document.getElementById('loggedInNav');
        const userBtn = document.getElementById('btn-user');

        if (data.is_logged_in) {
            document.body.dataset.currentUser = data.user;
            if (loggedInNav) loggedInNav.style.display = 'block';
            if (userBtn) {
                userBtn.title = "User Center";
                userBtn.innerHTML = "<i class=\"fas fa-cog\"></i>";
            }
        } else {
            if (loggedInNav) loggedInNav.style.display = 'none';
            if (userBtn) {
                userBtn.title = "Login";
                userBtn.innerHTML = "<i id=\"user-btn-icon\" class=\"fas fa-sign-in-alt\"></i>";
            }
        }
    } catch (error) {
        console.error("Auth check network error:", error);
    }
}

async function navigateTo(pageName) {
    const main = document.getElementById('main-content');
    if (!main) return;

    const authCheck = await fetch(`${window.APP_CONFIG.BACKEND_URL}/api/check-auth`, {
        credentials: 'include'
    });
    const auth = await authCheck.json();

    if (!auth.is_logged_in && pageName !== 'user') {
        pageName = 'user';
    }

    const displayPath = `/${pageName}`;
    if (window.location.pathname !== displayPath) {
        window.history.pushState({ page: pageName }, "", displayPath);
    }

    try {
        main.innerHTML = ''; 

        if (pageName.includes('profile/')) {
            const username = pageName.split('/').pop();
            
			setTimeout(() => {
				if (typeof window.loadProfilePosts === 'function') {
					window.loadProfilePosts(username);
				}
			}, 50);
			
            try {
                const dataRes = await fetch(`${window.APP_CONFIG.BACKEND_URL}/api/profile/${username}`);
                if (!dataRes.ok) throw new Error("Profile data not found");
                const userData = await dataRes.json();

                const templateRes = await fetch('/templates/user_profile_public.html');
                if (!templateRes.ok) throw new Error("Profile template layout not found");
                const templateHtml = await templateRes.text();
				const avatar = document.getElementById('profile-avatar-header');

                main.innerHTML = templateHtml;
                document.getElementById('profile-username-header').innerText = userData.username;
                avatar.src = window.getProfilePicUrl(userData.profile_pic);
				if (avatar.src.includes('/img/default-avatar.png')) {
					avatar.src = '/img/default-avatar.png';
				}
                
                if (typeof loadProfilePosts === 'function') loadProfilePosts(username);
                
            } catch (err) {
                console.error("Error loading profile:", err);
                main.innerHTML = "<p>Error loading profile.</p>";
            }
        }

        else if (pageName.includes('post/')) {
			const postId = pageName.split('/')[1];
			
			fetch('/templates/post_view.html')
				.then(res => res.text())
				.then(html => {
					document.getElementById('main-content').innerHTML = html;
					
					loadSinglePost(postId);
				})
				.catch(err => console.error("Error loading view shell:", err));
		}

        else {
            const response = await fetch(`${window.APP_CONFIG.BACKEND_URL}/api/content/${pageName}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const templateName = await response.text(); 

            const htmlResponse = await fetch(`/templates/${templateName}.html`);
            if (!htmlResponse.ok) throw new Error(`HTML File not found: ${templateName}`);
            const html = await htmlResponse.text();

            if (pageName === 'user') {
                main.innerHTML = `<div class="auth-wrapper"><div id="auth-container"></div></div>`;
                if (typeof loadLoginView === 'function') await loadLoginView();
            } else {
                main.innerHTML = html;
            }

            if (pageName === 'user_center') {
				fetch(`${window.APP_CONFIG.BACKEND_URL}/api/data`, {
					credentials: 'include'
				})
				.then(res => res.json())
				.then(data => {
					const userField = document.getElementById('display-username');
					const picField = document.getElementById('display-profile-pic');
					
					if (userField) userField.innerText = data.user;
					
					if (picField) {
						const picPath = data.profile_pic;
						const cleanPath = picPath.startsWith('/') ? picPath.substring(1) : picPath;
						
						picField.src = window.getProfilePicUrl(data.profile_pic);
					}
				})
				.catch(err => console.error("Failed to load user center data:", err));
			}
            else if (pageName === 'home') {
                if (typeof loadHomeFeed === 'function') loadHomeFeed();
            }
        }

        await updateNavigation(auth);

    } catch (e) {
        console.error("Navigation error:", e);
        main.innerHTML = `<div class="error">Failed to load ${pageName}</div>`;
    }
}

async function loadPostsIntoContainer(apiUrl, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
        const [postsReq, templateReq] = await Promise.all([
            fetch(apiUrl, { credentials: 'include' }),
            fetch('/templates/post_item.html')
        ]);

        if (!postsReq.ok || !templateReq.ok) {
            throw new Error("Failed to fetch posts or template");
        }

        const posts = await postsReq.json();
        const templateHtml = await templateReq.text();

        container.innerHTML = posts.length === 0 ? '<p>No posts found.</p>' : '';
        
        posts.forEach(post => {
            container.appendChild(renderPost(templateHtml, post));
        });
    } catch (e) { 
        console.error("Failed to load posts", e); 
    }
}

async function loadSinglePost(postId) {
    const container = document.getElementById('single-post-target');
    if (!container) {
        console.error("Target container not found!");
        return;
    }

    try {
        const [postRes, templateRes] = await Promise.all([
            fetch(`${window.APP_CONFIG.BACKEND_URL}/api/posts/${postId}`, { credentials: 'include' }),
            fetch('/templates/post_item.html')
        ]);

        if (!postRes.ok || !templateRes.ok) throw new Error("Failed to fetch post data");

        const postData = await postRes.json();
        const templateHtml = await templateRes.text();

        container.innerHTML = '';
        container.appendChild(renderPost(templateHtml, postData));
    } catch (err) {
        console.error("Error loading single post:", err);
        container.innerHTML = "<p>Error loading post.</p>";
    }
}

function loadHomeFeed() {
    loadPostsIntoContainer(`${window.APP_CONFIG.BACKEND_URL}/api/posts`, 'posts-container');
}

async function goToMyPublicProfile() {
    const res = await fetch(`${window.APP_CONFIG.BACKEND_URL}/api/check-auth`, {
		credentials: 'include'
	});
    const data = await res.json();
    if (data.is_logged_in) {
        navigateTo(`profile/${data.user}`);
    } else {
        navigateTo('user');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-user')?.addEventListener('click', () => navigateTo('user_center'));

    document.getElementById('btn-my-profile')?.addEventListener('click', (e) => {
        e.preventDefault();
        goToMyPublicProfile();
    });

    const path = window.location.pathname.replace(/^\/+/g, '') || 'home';
    navigateTo(path);
});

window.addEventListener('popstate', () => {
    const path = window.location.pathname.substring(1) || 'home';
    navigateTo(path);
});