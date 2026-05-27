const IS_PRODUCTION = true;

window.APP_CONFIG = {
    BACKEND_URL: IS_PRODUCTION
        ? 'https://do-it-backend-6a5i.onrender.com'
        : 'http://localhost:8080'
};