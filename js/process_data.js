function attachRegisterListener() {
    const form = document.getElementById('user-form');
    if (!form) return;

    form.removeEventListener('submit', handleRegistration);
    form.addEventListener('submit', handleRegistration);
}

async function handleRegistration(e) {
    e.preventDefault();
    
    const messageDiv = document.getElementById('form-message');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const password = document.getElementById('password').value;
    const confirm = document.getElementById('confirm_password').value;
    
    if (password !== confirm) {
        messageDiv.style.color = "red";
        messageDiv.innerText = "Error: Passwords do not match!";
        return; 
    }

    submitBtn.disabled = true;
    submitBtn.innerText = "Registering...";
    messageDiv.style.color = "blue";
    messageDiv.innerText = "Please wait... (If the server is waking up, this may take 30-60s)";

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch(`${window.APP_CONFIG.BACKEND_URL}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            credentials: 'include'
        });

        const result = await response.json();

        if (response.ok) {
            messageDiv.style.color = "green";
            messageDiv.innerText = "Success! Account created. Please check your email to verify your account.";
            e.target.reset();
        } else {
            messageDiv.style.color = "red";
            messageDiv.innerText = result.message || "Registration failed. Please try again.";
        }
    } catch (error) {
        console.error("Registration request transaction failure:", error);
        messageDiv.style.color = "red";
        messageDiv.innerText = "Server unreachable. Please try again in a moment.";
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = "Register";
    }
}