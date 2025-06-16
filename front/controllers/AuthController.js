/**
 * Contrôleur pour l'authentification
 * Gère la connexion, l'inscription et la déconnexion des utilisateurs
 */
class AuthController {
    constructor() {
        this.view = new AuthView();
        this.setupEventListeners();
    }

    async setupEventListeners() {
        document.addEventListener('auth:login', (event) => {
            this.handleLogin(event.detail);
        });

        document.addEventListener('auth:register', (event) => {
            this.handleRegister(event.detail);
        });

        document.addEventListener('auth:logout', () => {
            this.handleLogout();
        });
    }

    renderAuthInterface(mode = 'login') {
        this.view.render(mode);
    }

    // Gère la connexion d'un utilisateur
    async handleLogin(credentials) {
        try {
            this.view.showLoading();
            const response = await fetch(`${window.app.config.API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(credentials)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                const loginEvent = new CustomEvent('user:login', {
                    detail: { user: data.user }
                });
                document.dispatchEvent(loginEvent);
                
                showNotification('Connexion réussie !', 'success');
            } else {
                showNotification(data.error || 'Erreur de connexion', 'error');
            }
        } catch (error) {
            console.error('Erreur login:', error);
            showNotification('Erreur de connexion au serveur', 'error');
        } finally {
            this.view.hideLoading();
        }
    }

    // Gère l'inscription d'un nouvel utilisateur
    async handleRegister(userData) {
        try {
            this.view.showLoading();

            const response = await fetch(`${window.app.config.API_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showNotification('Inscription réussie ! Vous pouvez maintenant vous connecter.', 'success');
                this.view.switchToLogin();
            } else {
                showNotification(data.error || 'Erreur lors de l\'inscription', 'error');
            }
        } catch (error) {
            console.error('Erreur register:', error);
            showNotification('Erreur de connexion au serveur', 'error');
        } finally {
            this.view.hideLoading();
        }
    }

    // Déconnecte l'utilisateur
    async handleLogout() {
        try {
            const response = await fetch(`${window.app.config.API_URL}/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (response.ok) {
                const logoutEvent = new CustomEvent('user:logout');
                document.dispatchEvent(logoutEvent);
            }
        } catch (error) {
            console.error('Erreur logout:', error);
            const logoutEvent = new CustomEvent('user:logout');
            document.dispatchEvent(logoutEvent);
        }
    }

    getCurrentUser() {
        return window.app ? window.app.getCurrentUser() : null;
    }

    isAuthenticated() {
        return window.app ? window.app.isAuthenticated() : false;
    }
}