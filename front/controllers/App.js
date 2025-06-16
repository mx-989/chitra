/**
 * Application principale
 */
class App {
    constructor() {
        this.currentUser = null;
        this.controllers = {};
        
        this.router = new Router();
        this.config = {
            API_URL: 'http://localhost:81/api',
            UPLOADS_BASE_URL: 'http://localhost:81/uploads',
            FRONTEND_URL: 'http://localhost'
        };
        
        this.init();
    }

    async init() {
        try {
            this.updateLoadingState('Initialisation...');
            this.initControllers();
            
            this.updateLoadingState('Configuration...');
            this.setupRouting();
            
            this.updateLoadingState('Vérification de session...');
            await this.checkSession();
            
            this.updateLoadingState('Démarrage...');
            this.start();
            
            this.hideLoadingScreen();
            
        } catch (error) {
            console.error('Erreur lors de l\'initialisation:', error);
            showNotification('Erreur lors du chargement de l\'application', 'error');
            this.hideLoadingScreen();
        }
    }

    showNotification(message, type = 'info', duration = 5000) {
        return window.showNotification(message, type, duration);
    }

    updateLoadingState(message) {
        const loadingText = document.querySelector('.loading-text');
        if (loadingText) {
            loadingText.textContent = message;
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.querySelector('.app-loading');
        if (!loadingScreen) return;

        setTimeout(() => {
            loadingScreen.style.opacity = '0';
            loadingScreen.style.transition = 'opacity 0.5s ease';
            
            setTimeout(() => {
                loadingScreen.remove();
            }, 500);
        }, 800);
    }

    // Vérifie si l'utilisateur a une session active
    async checkSession() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(`${this.config.API_URL}/profile`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user || null;
            } else {
                this.currentUser = null;
            }
        } catch (error) {
            this.currentUser = null;
        }
    }

    // Lance tous les contrôleurs
    initControllers() {
        this.controllers = {
            auth: new AuthController(),
            navigation: new NavigationController(),
            album: new AlbumController(),
            photo: new PhotoController(),
            comment: new CommentController(),
            share: new ShareController(),
            favorite: new FavoriteController()
        };

        this.setupControllerEvents();
    }

    setupControllerEvents() {
        document.addEventListener('user:login', (event) => {
            this.currentUser = event.detail.user;
            this.showMainInterface();
            this.router.navigate('/');
        });

        document.addEventListener('user:logout', () => {
            document.body.innerHTML = '';
            document.body.className = '';
            
            if (window.notificationView) {
                window.notificationView.reset();
            }
            
            this.currentUser = null;
            this.showAuthInterface();
            this.router.navigate('/login');
            
            setTimeout(() => {
                this.showNotification('Vous avez été déconnecté.', 'success');
            }, 100);
        });
    }

    // Routes vers les URL
    setupRouting() {
        this.router.addRoute('/login', () => {
            this.showAuthInterface('login');
        }, { middleware: [RouterMiddleware.requireGuest] });

        this.router.addRoute('/register', () => {
            this.showAuthInterface('register');
        }, { middleware: [RouterMiddleware.requireGuest] });

        this.router.addRoute('/', () => {
            this.controllers.navigation.showTimeline();
        }, { middleware: [RouterMiddleware.requireAuth] });

        this.router.addRoute('/albums', () => {
            this.controllers.navigation.showAlbums();
        }, { middleware: [RouterMiddleware.requireAuth] });

        this.router.addRoute('/albums/:id', (params) => {
            this.controllers.album.showAlbum(params.id);
        }, { middleware: [RouterMiddleware.requireAuth] });

        this.router.addRoute('/favorites', () => {
            this.controllers.navigation.showFavorites();
        }, { middleware: [RouterMiddleware.requireAuth] });

        this.router.addRoute('/shared', () => {
            this.controllers.navigation.showShared();
        }, { middleware: [RouterMiddleware.requireAuth] });

        this.router.addRoute('/explore', () => {
            this.controllers.navigation.showExplore();
        }, { middleware: [RouterMiddleware.requireAuth] });

        this.router.addRoute('/upload', () => {
            this.controllers.navigation.showUploadSection();
        }, { middleware: [RouterMiddleware.requireAuth] });

        this.router.addRoute('/profile', () => {
            this.controllers.navigation.showProfile();
        }, { middleware: [RouterMiddleware.requireAuth] });

        this.router.addRoute('*', () => {
            if (this.isAuthenticated()) {
                this.router.redirect('/');
            } else {
                this.router.redirect('/login');
            }
        });
    }

    start() {
        this.router.start();
        
        const currentPath = window.location.pathname;
        
        if (this.currentUser) {
            this.showMainInterface();
            if (currentPath === '/login' || currentPath === '/register') {
                this.router.redirect('/');
            }
        } else {
            this.showAuthInterface();
            if (currentPath !== '/login' && currentPath !== '/register') {
                this.router.redirect('/login');
            }
        }
    }

    // Affiche l'interface principale
    showMainInterface() {
        document.body.className = 'authenticated';
        
        if (!document.querySelector('.sidebar')) {
            this.controllers.navigation.renderMainLayout();
        }
        
        if (this.currentUser) {
            this.controllers.navigation.updateUserInfo(this.currentUser.user || this.currentUser);
        }
    }

    showAuthInterface(mode = 'login') {
        document.body.className = 'authentication';
        this.controllers.auth.renderAuthInterface(mode);
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    navigate(path) {
        this.router.navigate(path);
    }

    redirect(path) {
        this.router.redirect(path);
    }

    back() {
        this.router.back();
    }

    // Gère la navigation entre les différentes sections
    handleNavigation(section) {
        const routes = {
            timeline: '/',
            albums: '/albums',
            favorites: '/favorites',
            shared: '/shared',
            explore: '/explore',
            profile: '/profile'
        };

        const route = routes[section];
        if (route) {
            this.navigate(route);
        }
    }
}

// Lance l'application quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

// Gestion des erreurs non-prévues pour tout le site
window.addEventListener('error', (event) => {
    console.error('Erreur globale:', event.error);
    
    if (window.showNotification) {
        window.showNotification('Une erreur inattendue s\'est produite', 'error');
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Promesse rejetée:', event.reason);
    
    if (window.showNotification) {
        window.showNotification('Une erreur de connexion s\'est produite', 'error');
    }
});