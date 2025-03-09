/**
 * Auth Service
 * Handles user authentication and session management
 */
const Auth = (function() {
    // Constants
    const AUTH_MODAL_ID = 'auth-modal';
    
    /**
     * Initialize the auth service
     * @param {String} loginBtnId - ID of the login button element
     * @param {String} logoutBtnId - ID of the logout button element (optional)
     * @param {String} usernameLabelId - ID of the username label element (optional)
     */
    const initialize = (loginBtnId, logoutBtnId, usernameLabelId) => {
        // Set up login button
        const loginBtn = document.getElementById(loginBtnId);
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                openAuthModal();
            });
        }
        
        // Set up logout button
        const logoutBtn = document.getElementById(logoutBtnId);
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                logout();
            });
        }
    };
    
    /**
     * Open the authentication modal
     */
    const openAuthModal = () => {
        // Create the modal
        Modal.createModal(AUTH_MODAL_ID, 'Sign In / Sign Up');
        
        // Set up the modal content
        const content = `
            <div class="auth-tabs">
                <button class="auth-tab active" data-tab="signin">Sign In</button>
                <button class="auth-tab" data-tab="signup">Sign Up</button>
            </div>
            
            <div class="auth-tab-content" id="signin-tab">
                <form id="signin-form">
                    <div class="form-group">
                        <label for="signin-username">Username</label>
                        <input type="text" id="signin-username" required>
                    </div>
                    <div class="form-group">
                        <label for="signin-password">Password</label>
                        <input type="password" id="signin-password" required>
                    </div>
                </form>
            </div>
            
            <div class="auth-tab-content" id="signup-tab" style="display: none;">
                <form id="signup-form">
                    <div class="form-group">
                        <label for="signup-username">Username</label>
                        <input type="text" id="signup-username" required minlength="3">
                        <div class="form-help">Must be at least 3 characters</div>
                    </div>
                    <div class="form-group">
                        <label for="signup-password">Password</label>
                        <input type="password" id="signup-password" required minlength="8">
                        <div class="form-help">Must be at least 8 characters</div>
                    </div>
                    <div class="form-group">
                        <label for="signup-confirm-password">Confirm Password</label>
                        <input type="password" id="signup-confirm-password" required>
                    </div>
                </form>
            </div>
        `;
        
        Modal.setModalContent(AUTH_MODAL_ID, content);
        Modal.setModalSaveHandler(AUTH_MODAL_ID, handleAuthSubmit);
        Modal.showModal(AUTH_MODAL_ID);
        
        // Set up tab switching
        setupAuthTabs();
    };
    
    /**
     * Set up the auth tabs event listeners
     */
    const setupAuthTabs = () => {
        const tabButtons = document.querySelectorAll('.auth-tab');
        const tabContents = document.querySelectorAll('.auth-tab-content');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons
                tabButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                button.classList.add('active');
                
                // Hide all tab contents
                tabContents.forEach(content => content.style.display = 'none');
                
                // Show selected tab content
                const tabName = button.dataset.tab;
                document.getElementById(`${tabName}-tab`).style.display = 'block';
            });
        });
    };
    
    /**
     * Handle form submission from the auth modal
     */
    const handleAuthSubmit = () => {
        // Determine which tab is active
        const activeTab = document.querySelector('.auth-tab.active').dataset.tab;
        
        if (activeTab === 'signin') {
            handleSignIn();
        } else if (activeTab === 'signup') {
            handleSignUp();
        }
    };
    
    /**
     * Handle sign in form submission
     */
    const handleSignIn = async () => {
        const username = document.getElementById('signin-username').value;
        const password = document.getElementById('signin-password').value;
        
        // Validate form
        if (!username) {
            Modal.showFieldError(AUTH_MODAL_ID, 'signin-username', 'Username is required');
            return;
        }
        
        if (!password) {
            Modal.showFieldError(AUTH_MODAL_ID, 'signin-password', 'Password is required');
            return;
        }
        
        try {
            await API.signIn({ username, password });
            
            // Close modal and reload page
            Modal.closeModal(AUTH_MODAL_ID);
            window.location.href = '/plants';
        } catch (error) {
            console.error('Sign in error:', error);
            
            // Show error message
            if (error.status === 401) {
                alert('Invalid username or password. Please try again.');
            } else if (error.status === 429) {
                alert('Too many login attempts. Please try again later.');
            } else {
                alert('An error occurred during sign in. Please try again.');
            }
        }
    };
    
    /**
     * Handle sign up form submission
     */
    const handleSignUp = async () => {
        const username = document.getElementById('signup-username').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;
        
        // Validate form
        Modal.clearErrors(AUTH_MODAL_ID);
        
        if (!username) {
            Modal.showFieldError(AUTH_MODAL_ID, 'signup-username', 'Username is required');
            return;
        }
        
        if (username.length < 3) {
            Modal.showFieldError(AUTH_MODAL_ID, 'signup-username', 'Username must be at least 3 characters');
            return;
        }
        
        if (!password) {
            Modal.showFieldError(AUTH_MODAL_ID, 'signup-password', 'Password is required');
            return;
        }
        
        if (password.length < 8) {
            Modal.showFieldError(AUTH_MODAL_ID, 'signup-password', 'Password must be at least 8 characters');
            return;
        }
        
        if (password !== confirmPassword) {
            Modal.showFieldError(AUTH_MODAL_ID, 'signup-confirm-password', 'Passwords do not match');
            return;
        }
        
        try {
            await API.signUp({ username, password });
            
            // Show success message and switch to sign in tab
            alert('Account created successfully! You can now sign in.');
            
            // Switch to sign in tab
            document.querySelector('.auth-tab[data-tab="signin"]').click();
            
            // Pre-fill username
            document.getElementById('signin-username').value = username;
        } catch (error) {
            console.error('Sign up error:', error);
            
            // Show error message
            if (error.status === 409) {
                Modal.showFieldError(AUTH_MODAL_ID, 'signup-username', 'Username already exists');
            } else {
                alert('An error occurred during sign up. Please try again.');
            }
        }
    };
    
    /**
     * Log out the current user
     */
    const logout = async () => {
        try {
            await API.logOut();
            
            // Redirect to home page
            window.location.href = '/';
        } catch (error) {
            console.error('Logout error:', error);
            alert('An error occurred during logout. Please try again.');
        }
    };
    
    // Public API
    return {
        initialize,
        openAuthModal,
        logout
    };
})();
