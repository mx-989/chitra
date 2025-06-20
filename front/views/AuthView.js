/**
 * Vue qui initiliase les notifications et gère l'authentification
 */

class AuthView {
    constructor() {
        this.container = null;
        this.currentMode = 'login';
        
        this.ensureNotificationView();
    }

    ensureNotificationView() {
        if (window.notificationView) {
            this.notificationView = window.notificationView;
        } else if (window.app && window.app.notificationView) {
            this.notificationView = window.app.notificationView;
        } else {
            this.notificationView = new NotificationView();
            window.notificationView = this.notificationView;
        }
    }

    render(mode = 'login') {
        this.currentMode = mode;
        
        this.ensureNotificationView();
       
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
       
        this.container = document.createElement('div');
        this.container.className = 'auth-container';
        this.container.innerHTML = this.getAuthHTML();
        document.body.appendChild(this.container);
       
        this.attachEvents();
    }

    getAuthHTML() {
        return `
            <div class="auth-wrapper">
                <div class="auth-card">
                    <div class="auth-header">
                        <img src="chitra_logo.png" alt="Chitra Logo" class="auth-logo">
                        <h1 class="auth-title">
                            <span class="logo-accent">Chitra</span>
                        </h1>
                        <p class="auth-subtitle">Gestionnaire de photos personnelles</p>
                    </div>
                    <div class="auth-tabs">
                        <button class="auth-tab ${this.currentMode === 'login' ? 'active' : ''}" data-mode="login">
                            Connexion
                        </button>
                        <button class="auth-tab ${this.currentMode === 'register' ? 'active' : ''}" data-mode="register">
                            Inscription
                        </button>
                    </div>
                    <div class="auth-content">
                        ${this.currentMode === 'login' ? this.getLoginForm() : this.getRegisterForm()}
                    </div>
                    <div class="auth-loading" style="display: none;">
                        <div class="spinner"></div>
                        <span>Chargement...</span>
                    </div>
                </div>
            </div>
        `;
    }

    getLoginForm() {
        return `
            <form class="auth-form" id="loginForm">
                <div class="form-group">
                    <label class="form-label" for="loginEmail">Adresse email</label>
                    <input type="email" id="loginEmail" name="email" class="form-input" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="loginPassword">Mot de passe</label>
                    <input type="password" id="loginPassword" name="password" class="form-input" required>
                </div>
                <button type="submit" class="form-submit">Se connecter</button>
            </form>
        `;
    }

    getRegisterForm() {
        return `
            <form class="auth-form" id="registerForm">
                <div class="form-group">
                    <label class="form-label" for="registerName">Nom complet</label>
                    <input type="text" id="registerName" name="name" class="form-input" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="registerEmail">Adresse email</label>
                    <input type="email" id="registerEmail" name="email" class="form-input" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="registerPassword">Mot de passe</label>
                    <input type="password" id="registerPassword" name="password" class="form-input" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="confirmPassword">Confirmer le mot de passe</label>
                    <input type="password" id="confirmPassword" name="confirmPassword" class="form-input" required>
                </div>
                <button type="submit" class="form-submit">S'inscrire</button>
            </form>
        `;
    }

    attachEvents() {
        const tabs = this.container.querySelectorAll('.auth-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const mode = e.target.dataset.mode;
                this.switchMode(mode);
            });
        });

        const loginForm = this.container.querySelector('#loginForm');
        const registerForm = this.container.querySelector('#registerForm');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLoginSubmit(e.target);
            });
        }

        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegisterSubmit(e.target);
            });
        }
    }

    switchMode(mode) {
        if (this.currentMode !== mode) {
            this.render(mode);
        }
    }

    switchToLogin() {
        this.switchMode('login');
    }

    handleLoginSubmit(form) {
        const formData = new FormData(form);
        const data = {
            email: formData.get('email'),
            password: formData.get('password')
        };

        const loginEvent = new CustomEvent('auth:login', { detail: data });
        document.dispatchEvent(loginEvent);
    }

    handleRegisterSubmit(form) {
        this.ensureNotificationView();
        
        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword')
        };

        if (data.password !== data.confirmPassword) {
            showNotification('Les mots de passe ne correspondent pas.', 'error');
            return;
        }

        const registerEvent = new CustomEvent('auth:register', { detail: data });
        document.dispatchEvent(registerEvent);
    }

    showLoading() {
        const loading = this.container?.querySelector('.auth-loading');
        const content = this.container?.querySelector('.auth-content');
       
        if (loading && content) {
            content.style.display = 'none';
            loading.style.display = 'block';
        }
    }

    hideLoading() {
        const loading = this.container?.querySelector('.auth-loading');
        const content = this.container?.querySelector('.auth-content');
       
        if (loading && content) {
            loading.style.display = 'none';
            content.style.display = 'block';
        }
    }
}