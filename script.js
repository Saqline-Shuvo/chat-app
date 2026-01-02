// Check if Firebase is initialized
if (typeof firebase === 'undefined' || typeof auth === 'undefined') {
    console.error('Firebase not initialized! Check firebase-config.js');
    showAlert('Firebase configuration error. Please check console.', 'danger');
}

// Get DOM elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const resetForm = document.getElementById('resetForm');
const showRegisterLink = document.getElementById('showRegister');
const showLoginLink = document.getElementById('showLogin');
const forgotPasswordLink = document.getElementById('forgotPassword');
const backToLoginLink = document.getElementById('backToLogin');
const formTitle = document.getElementById('formTitle');
const alertContainer = document.getElementById('alertContainer');

// Button elements
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const resetBtn = document.getElementById('resetBtn');

// Toggle between forms
showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('d-none');
    registerForm.classList.remove('d-none');
    resetForm.classList.add('d-none');
    formTitle.textContent = 'Register';
    clearAlerts();
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.add('d-none');
    loginForm.classList.remove('d-none');
    resetForm.classList.add('d-none');
    formTitle.textContent = 'Login';
    clearAlerts();
});

forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('d-none');
    resetForm.classList.remove('d-none');
    formTitle.textContent = 'Reset Password';
    clearAlerts();
});

backToLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    resetForm.classList.add('d-none');
    loginForm.classList.remove('d-none');
    formTitle.textContent = 'Login';
    clearAlerts();
});

// Handle login with Firebase
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    if (!email || !password) {
        showAlert('Please fill in all fields', 'danger');
        return;
    }
    
    setLoading(loginBtn, 'loginSpinner', 'loginText', true);
    
    try {
        // Set persistence based on "Remember Me"
        const persistence = rememberMe 
            ? firebase.auth.Auth.Persistence.LOCAL 
            : firebase.auth.Auth.Persistence.SESSION;
        
        await auth.setPersistence(persistence);
        
        // Sign in user
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        showAlert(`Welcome back, ${user.email}!`, 'success');
        loginForm.reset();
        
        console.log('User logged in:', user);
        
        // Redirect to chat page after successful login
        setTimeout(() => {
            window.location.href = 'chat.html';
        }, 1500);
        
    } catch (error) {
        console.error('Login error:', error);
        handleAuthError(error);
    } finally {
        setLoading(loginBtn, 'loginSpinner', 'loginText', false);
    }
});

// Handle registration with Firebase
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;
    
    // Validation
    if (!name || !email || !password || !confirmPassword) {
        showAlert('Please fill in all fields', 'danger');
        return;
    }
    
    if (password.length < 6) {
        showAlert('Password must be at least 6 characters long', 'danger');
        return;
    }
    
    if (password !== confirmPassword) {
        showAlert('Passwords do not match', 'danger');
        return;
    }
    
    if (!agreeTerms) {
        showAlert('Please agree to the terms and conditions', 'danger');
        return;
    }
    
    setLoading(registerBtn, 'registerSpinner', 'registerText', true);
    
    try {
        // Create user with email and password
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Update user profile with name
        await user.updateProfile({
            displayName: name
        });
        
        // Store additional user data in Firestore
        await db.collection('users').doc(user.uid).set({
            name: name,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showAlert('Registration successful! Please login', 'success');
        registerForm.reset();
        
        // Switch to login form after 2 seconds
        setTimeout(() => {
            registerForm.classList.add('d-none');
            loginForm.classList.remove('d-none');
            formTitle.textContent = 'Login';
            clearAlerts();
        }, 2000);
        
    } catch (error) {
        console.error('Registration error:', error);
        handleAuthError(error);
    } finally {
        setLoading(registerBtn, 'registerSpinner', 'registerText', false);
    }
});

// Handle password reset
resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('resetEmail').value.trim();
    
    if (!email) {
        showAlert('Please enter your email address', 'danger');
        return;
    }
    
    setLoading(resetBtn, 'resetSpinner', 'resetText', true);
    
    try {
        await auth.sendPasswordResetEmail(email);
        showAlert('Password reset email sent! Check your inbox', 'success');
        resetForm.reset();
        
        setTimeout(() => {
            resetForm.classList.add('d-none');
            loginForm.classList.remove('d-none');
            formTitle.textContent = 'Login';
            clearAlerts();
        }, 3000);
        
    } catch (error) {
        console.error('Password reset error:', error);
        handleAuthError(error);
    } finally {
        setLoading(resetBtn, 'resetSpinner', 'resetText', false);
    }
});

// Check if user is already logged in (redirect to chat if true)
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log('User already logged in:', user);
        // Redirect to chat page if user is already logged in
        window.location.href = 'chat.html';
    }
});

// Handle Firebase authentication errors
function handleAuthError(error) {
    let message = 'An error occurred. Please try again.';
    
    switch (error.code) {
        case 'auth/email-already-in-use':
            message = 'This email is already registered';
            break;
        case 'auth/invalid-email':
            message = 'Invalid email address';
            break;
        case 'auth/weak-password':
            message = 'Password is too weak';
            break;
        case 'auth/user-not-found':
            message = 'No account found with this email';
            break;
        case 'auth/wrong-password':
            message = 'Incorrect password';
            break;
        case 'auth/too-many-requests':
            message = 'Too many failed attempts. Please try again later';
            break;
        case 'auth/network-request-failed':
            message = 'Network error. Please check your connection';
            break;
        case 'auth/user-disabled':
            message = 'This account has been disabled';
            break;
        default:
            message = error.message;
    }
    
    showAlert(message, 'danger');
}

// Show loading state on buttons
function setLoading(button, spinnerId, textId, isLoading) {
    const spinner = document.getElementById(spinnerId);
    const text = document.getElementById(textId);
    
    if (isLoading) {
        button.disabled = true;
        spinner.classList.remove('d-none');
        text.textContent = 'Please wait...';
    } else {
        button.disabled = false;
        spinner.classList.add('d-none');
        
        // Reset text based on button
        if (textId === 'loginText') text.textContent = 'Login';
        else if (textId === 'registerText') text.textContent = 'Register';
        else if (textId === 'resetText') text.textContent = 'Send Reset Link';
    }
}

// Show alert message
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 150);
    }, 5000);
}

// Clear all alerts
function clearAlerts() {
    alertContainer.innerHTML = '';
}