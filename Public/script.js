document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const modal = document.getElementById('universal-modal');
    const modalTitle = document.getElementById('modal-title');
    const formFields = document.getElementById('form-fields');
    const modalForm = document.getElementById('modal-form');
    const modalSubmit = document.getElementById('modal-submit');
    const modalClose = document.getElementById('modal-close');
    const toggleSignup = document.getElementById('toggle-signup');
    const authBtn = document.getElementById('auth-btn');
    const errorMessage = document.getElementById('error-message');

    function showError(message) {
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
        }
    }

    function clearError() {
        if (errorMessage) {
            errorMessage.textContent = '';
            errorMessage.style.display = 'none';
        }
    }

    function validateInputs() {
        const username = document.getElementById('username')?.value.trim();
        const password = document.getElementById('password')?.value;

        if (!username || !password) {
            showError('Username and password are required.');
            return false;
        }

        if (username.length < 3) {
            showError('Username must be at least 3 characters long.');
            return false;
        }

        if (password.length < 8) {
            showError('Password must be at least 8 characters long.');
            return false;
        }

        return true;
    }

    function openModal(type) {
        if (!modal || !formFields || !modalTitle || !modalSubmit) return;

        modal.classList.remove('hidden');
        clearError();

        const isSignIn = type === 'signin';
        modalTitle.textContent = isSignIn ? 'Sign In' : 'Sign Up';
        modalSubmit.textContent = isSignIn ? 'Sign In' : 'Sign Up';

        formFields.innerHTML = `
            <div class="form-group">
                <label for="username">Username</label>
                <input type="text" 
                    id="username" 
                    name="username" 
                    placeholder="Enter username" 
                    required 
                    minlength="3" 
                    maxlength="191"
                    autocomplete="${isSignIn ? 'username' : 'new-username'}">
            </div>
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" 
                    id="password" 
                    name="password" 
                    placeholder="Enter password" 
                    required 
                    minlength="8" 
                    maxlength="191"
                    autocomplete="${isSignIn ? 'current-password' : 'new-password'}">
            </div>
        `;

        setTimeout(() => {
            const usernameInput = document.getElementById('username');
            if (usernameInput) usernameInput.focus();
        }, 100);
    }

    function closeModal() {
        if (modal) {
            modal.classList.add('hidden');
            clearError();
        }
    }

    function getCsrfToken() {
        // First try to get from cookie
        const token = document.cookie
            .split('; ')
            .find(row => row.startsWith('XSRF-TOKEN='));

        if (token) {
            // Decode the URI component as cookies are often encoded
            return decodeURIComponent(token.split('=')[1]);
        }

        // If not found in cookie, try to get from meta tag
        const metaToken = document.querySelector('meta[name="csrf-token"]');
        if (metaToken) {
            return metaToken.getAttribute('content');
        }

        console.error('CSRF token not found in cookies or meta tags');
        return null;
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        clearError();

        if (!validateInputs()) return;

        const isSignIn = modalTitle.textContent === 'Sign In';
        const endpoint = isSignIn ? '/signin' : '/signup';

        if (!modalSubmit) return;

        modalSubmit.disabled = true;
        const originalButtonText = modalSubmit.textContent;
        modalSubmit.textContent = isSignIn ? 'Signing In...' : 'Signing Up...';

        try {
            const token = getCsrfToken();
            console.log('CSRF Token found:', !!token); // Debug log

            if (!token) {
                throw new Error('Security token not found. Please refresh the page.');
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': token,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    username: document.getElementById('username')?.value.trim(),
                    password: document.getElementById('password')?.value
                })
            });

            // Log response status for debugging
            console.log('Response status:', response.status);

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.message || `${isSignIn ? 'Sign In' : 'Sign Up'} failed`);
            }

            if (isSignIn) {
                window.location.href = '/plants';
            } else {
                showError('Sign up successful! Please sign in.');
                setTimeout(() => openModal('signin'), 1500);
            }
        } catch (error) {
            console.error('Auth error:', error);
            showError(error.message || 'An error occurred. Please try again.');
        } finally {
            modalSubmit.disabled = false;
            modalSubmit.textContent = originalButtonText;
        }
    }

    // Set up event listeners
    if (authBtn) {
        authBtn.addEventListener('click', () => openModal('signin'));
    }

    if (modalForm) {
        modalForm.addEventListener('submit', handleFormSubmit);
    }

    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }

    if (toggleSignup) {
        toggleSignup.addEventListener('click', (e) => {
            e.preventDefault();
            const isCurrentlySignIn = modalTitle.textContent === 'Sign In';
            openModal(isCurrentlySignIn ? 'signup' : 'signin');
        });
    }

    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
            closeModal();
        }
    });
});