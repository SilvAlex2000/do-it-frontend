window.getProfilePicUrl = function(path) {
    if (!path || path === 'null' || path === '/null') {
        return '/img/default-avatar.png';
    }
	
	if (path.includes('/img/default-avatar.png')) {
        return '/img/default-avatar.png';
    }

    if (path.startsWith('http')) return path;

    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${window.APP_CONFIG.BACKEND_URL}/${cleanPath}`;
};