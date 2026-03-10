// Authentication Functions
const API_URL = 'http://localhost:3000/api';

// Tab switching
function showTab(tabName) {
    const forms = document.querySelectorAll('.auth-form');
    const buttons = document.querySelectorAll('.tab-btn');
    
    forms.forEach(form => form.classList.remove('active-form'));
    buttons.forEach(btn => btn.classList.remove('active'));
    
    if (tabName === 'login') {
        document.getElementById('loginForm').classList.add('active-form');
        buttons[0].classList.add('active');
    } else {
        document.getElementById('registerForm').classList.add('active-form');
        buttons[1].classList.add('active');
    }
}

// Login handler
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const messageDiv = document.getElementById('loginMessage');
            
            try {
                const response = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    messageDiv.textContent = 'Login successful! Redirecting...';
                    messageDiv.className = 'form-message success';
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1000);
                } else {
                    messageDiv.textContent = data.message || 'Login failed';
                    messageDiv.className = 'form-message error';
                }
            } catch (error) {
                messageDiv.textContent = 'Connection error. Make sure the server is running.';
                messageDiv.className = 'form-message error';
            }
        });
    }
    
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('regUsername').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('regConfirm').value;
            const messageDiv = document.getElementById('registerMessage');
            
            if (password !== confirmPassword) {
                messageDiv.textContent = 'Passwords do not match!';
                messageDiv.className = 'form-message error';
                return;
            }
            
            try {
                const response = await fetch(`${API_URL}/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, email, password })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    messageDiv.textContent = 'Registration successful! You can now login.';
                    messageDiv.className = 'form-message success';
                    setTimeout(() => {
                        showTab('login');
                        document.getElementById('registerForm').reset();
                    }, 1000);
                } else {
                    messageDiv.textContent = data.message || 'Registration failed';
                    messageDiv.className = 'form-message error';
                }
            } catch (error) {
                messageDiv.textContent = 'Connection error. Make sure the server is running.';
                messageDiv.className = 'form-message error';
            }
        });
    }
});

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Check authorization
function getAuthToken() {
    return localStorage.getItem('token');
}

function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

// Require authentication
function requireAuth() {
    const token = getAuthToken();
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Fetch with auth
async function fetchWithAuth(url, options = {}) {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
        ...options,
        headers
    });
    
    if (response.status === 401) {
        logout();
        return null;
    }
    
    return response;
}

// Update auth menu on all pages
function updateAuthMenu() {
    const token = getAuthToken();
    const userMenus = document.querySelectorAll('.user-menu');
    const authMenus = document.querySelectorAll('.auth-menu');
    
    userMenus.forEach(menu => {
        menu.style.display = token ? 'flex' : 'none';
    });
    
    authMenus.forEach(menu => {
        menu.style.display = token ? 'none' : 'flex';
    });
}

// Initialize auth menu
document.addEventListener('DOMContentLoaded', function() {
    updateAuthMenu();
});
