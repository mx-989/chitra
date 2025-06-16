/**
 * Gère la navigation côté client et l'historique du navigateur
 */
class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.params = {};
        
        // Écouter les changements d'URL
        window.addEventListener('popstate', () => this.handleRoute());
        
        // Intercepter les clics sur les liens
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="/"]');
            if (link && !link.hasAttribute('target') && !link.hasAttribute('download')) {
                e.preventDefault();
                this.navigate(link.getAttribute('href'));
            }
        });

        // Intercepter les soumissions de formulaires avec data-navigate
        document.addEventListener('submit', (e) => {
            const form = e.target.closest('form[data-navigate]');
            if (form) {
                e.preventDefault();
                const url = form.getAttribute('data-navigate') || form.action;
                this.navigate(url);
            }
        });
    }

    /**
     * Ajouter une route
     * @param {string} path - Chemin de la route (ex: '/albums/:id')
     * @param {function} handler - Fonction à exécuter
     * @param {object} options - Options (middleware, etc.)
     */
    addRoute(path, handler, options = {}) {
        this.routes.set(path, {
            handler,
            middleware: options.middleware || [],
            meta: options.meta || {}
        });
    }

    /**
     * Naviguer vers une URL
     * @param {string} path - Chemin de destination
     * @param {boolean} replace - Remplacer l'entrée d'historique au lieu d'ajouter
     */
    navigate(path, replace = false) {
        if (replace) {
            window.history.replaceState({}, '', path);
        } else {
            window.history.pushState({}, '', path);
        }
        this.handleRoute();
    }

    /**
     * Rediriger (remplace l'entrée d'historique)
     * @param {string} path - Chemin de destination
     */
    redirect(path) {
        this.navigate(path, true);
    }

    /**
     * Revenir en arrière dans l'historique
     */
    back() {
        window.history.back();
    }

    /**
     * Avancer dans l'historique
     */
    forward() {
        window.history.forward();
    }

    /**
     * Gérer le routage
     */
    handleRoute() {
        const path = window.location.pathname;
        const query = new URLSearchParams(window.location.search);
        
        this.currentRoute = path;
        this.params = {};

        // Rechercher une route exacte
        if (this.routes.has(path)) {
            this.executeRoute(path, [], query);
            return;
        }

        // Rechercher une route avec paramètres
        for (const [routePath, routeConfig] of this.routes) {
            const params = this.matchRoute(routePath, path);
            if (params !== null) {
                this.params = params;
                this.executeRoute(routePath, params, query);
                return;
            }
        }

        // Route non trouvée - essayer la route par défaut
        if (this.routes.has('*')) {
            this.executeRoute('*', [], query);
        } else {
            console.warn('Route non trouvée:', path);
            // Rediriger vers la page d'accueil par défaut
            if (path !== '/') {
                this.redirect('/');
            }
        }
    }

    /**
     * Exécuter une route
     * @param {string} routePath - Chemin de la route
     * @param {array} params - Paramètres extraits
     * @param {URLSearchParams} query - Paramètres de requête
     */
    async executeRoute(routePath, params, query) {
        const routeConfig = this.routes.get(routePath);
        if (!routeConfig) return;

        try {
            // Exécuter les middlewares
            for (const middleware of routeConfig.middleware) {
                const result = await middleware(params, query);
                if (result === false) {
                    // Middleware a bloqué la route
                    return;
                }
            }

            // Exécuter le handler principal
            await routeConfig.handler(params, query);
            
            // Émettre un événement de changement de route
            this.emitRouteChange(routePath, params, query);
            
        } catch (error) {
            console.error('Erreur lors de l\'exécution de la route:', error);
            this.handleRouteError(error, routePath);
        }
    }

    /**
     * Vérifier si un chemin correspond à une route avec paramètres
     * @param {string} routePath - Modèle de route (ex: '/albums/:id')
     * @param {string} currentPath - Chemin actuel
     * @returns {Object|null} - Paramètres extraits ou null
     */
    matchRoute(routePath, currentPath) {
        // Convertir la route en regex
        const routeParts = routePath.split('/');
        const pathParts = currentPath.split('/');

        if (routeParts.length !== pathParts.length) {
            return null;
        }

        const params = {};
        
        for (let i = 0; i < routeParts.length; i++) {
            const routePart = routeParts[i];
            const pathPart = pathParts[i];

            if (routePart.startsWith(':')) {
                // Paramètre dynamique
                const paramName = routePart.substring(1);
                params[paramName] = decodeURIComponent(pathPart);
            } else if (routePart !== pathPart) {
                // Partie statique qui ne correspond pas
                return null;
            }
        }

        return params;
    }

    /**
     * Émettre un événement de changement de route
     */
    emitRouteChange(routePath, params, query) {
        const event = new CustomEvent('route:change', {
            detail: {
                path: this.currentRoute,
                route: routePath,
                params: params,
                query: Object.fromEntries(query)
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * Gérer les erreurs de route
     */
    handleRouteError(error, routePath) {
        const event = new CustomEvent('route:error', {
            detail: { error, route: routePath }
        });
        document.dispatchEvent(event);

        // Afficher une notification d'erreur
        if (window.NotificationView) {
            const notification = new NotificationView();
            notification.error('Erreur de navigation');
        }
    }

    /**
     * Obtenir les paramètres de la route actuelle
     * @returns {Object} - Paramètres de la route
     */
    getParams() {
        return { ...this.params };
    }

    /**
     * Obtenir les paramètres de requête
     * @returns {Object} - Paramètres de requête
     */
    getQuery() {
        const query = new URLSearchParams(window.location.search);
        return Object.fromEntries(query);
    }

    /**
     * Obtenir la route actuelle
     * @returns {string} - Chemin de la route actuelle
     */
    getCurrentRoute() {
        return this.currentRoute;
    }

    /**
     * Vérifier si une route est active
     * @param {string} path - Chemin à vérifier
     * @returns {boolean} - True si la route est active
     */
    isActive(path) {
        return this.currentRoute === path;
    }

    /**
     * Générer une URL avec des paramètres
     * @param {string} path - Chemin de base
     * @param {Object} params - Paramètres à injecter
     * @param {Object} query - Paramètres de requête
     * @returns {string} - URL générée
     */
    url(path, params = {}, query = {}) {
        let url = path;

        // Remplacer les paramètres dans l'URL
        for (const [key, value] of Object.entries(params)) {
            url = url.replace(`:${key}`, encodeURIComponent(value));
        }

        // Ajouter les paramètres de requête
        const queryString = new URLSearchParams(query).toString();
        if (queryString) {
            url += '?' + queryString;
        }

        return url;
    }

    /**
     * Démarrer le routeur
     */
    start() {
        // Traiter la route initiale
        this.handleRoute();
    }

    /**
     * Arrêter le routeur (nettoyage)
     */
    stop() {
        // Retirer les événements si nécessaire
        // (dans ce cas, les événements sont sur window/document donc pas besoin)
    }
}

// Middlewares utiles
const RouterMiddleware = {
    /**
     * Middleware d'authentification
     */
    requireAuth: (params, query) => {
        const isAuthenticated = window.app?.isAuthenticated();
        if (!isAuthenticated) {
            window.router?.redirect('/login');
            return false;
        }
        return true;
    },

    /**
     * Middleware pour les utilisateurs non authentifiés
     */
    requireGuest: (params, query) => {
        const isAuthenticated = window.app?.isAuthenticated();
        if (isAuthenticated) {
            window.router?.redirect('/');
            return false;
        }
        return true;
    },

    /**
     * Middleware de logging
     */
    log: (params, query) => {
        console.log('Navigation vers:', window.location.pathname, params, Object.fromEntries(query));
        return true;
    }
};

// Export global
window.Router = Router;
window.RouterMiddleware = RouterMiddleware;