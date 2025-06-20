/**
 * Contrôleur pour la gestion des favoris
 * Gère l'ajout, la suppression et l'affichage des photos favorites
 */
class FavoriteController {
    constructor() {
        this.view = new FavoriteView();
        this.favorites = [];
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('favorite:toggle', (event) => {
            this.toggleFavorite(event.detail.photoId);
        });

        document.addEventListener('favorite:loadAll', () => {
            this.loadFavorites();
        });

        document.addEventListener('favorite:checkStatus', (event) => {
            this.checkFavoriteStatus(event.detail.photoId);
        });

        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="favorite"]')) {
                const photoId = e.target.closest('.photo-item')?.dataset.photoId;
                if (photoId) {
                    this.toggleFavorite(photoId);
                }
            }
        });
    }

    // Charge toutes les photos favorites de l'utilisateur
    async loadFavorites() {
        try {
            this.view.showLoading();

            const response = await fetch(`${window.app.config.API_URL}/favorites`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });
            const data = await response.json();

            if (response.ok) {
                this.favorites = data.favorites || [];
                this.view.renderFavorites(this.favorites, data.total || 0);
            } else {
                throw new Error(data.error || 'Erreur lors du chargement des favoris');
            }
        } catch (error) {
            console.error('Erreur chargement favoris:', error);
            showNotification('Impossible de charger les favoris', 'error');
        }
    }

    // Ajoute ou retire une photo des favoris
    async toggleFavorite(photoId) {
        try {
            const response = await fetch(`${window.app.config.API_URL}/favorites/toggle/${photoId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            const data = await response.json();

            if (response.ok) {
                const photoView = window.app?.controllers?.photo?.view;
                if (photoView) {
                    photoView.updateFavoriteButton(photoId, data.is_favorite);
                    photoView.updatePhotoModalFavorite(photoId, data.is_favorite);
                }
                
                this.view.updateFavoriteButton(photoId, data.is_favorite);
                
                if (data.action === 'added') {
                    showNotification('Photo ajoutée aux favoris !', 'success');
                } else {
                    showNotification('Photo retirée des favoris !', 'success');
                }

                this.updateFavoritesStats();

                if (this.isOnFavoritesPage()) {
                    this.loadFavorites();
                }
            } else {
                throw new Error(data.error || 'Erreur lors de la mise à jour des favoris');
            }
        } catch (error) {
            console.error('Erreur toggle favori:', error);
            showNotification(error.message, 'error');
        }
    }

    // Vérifie si une photo est dans les favoris et met à jour le coeur
    async checkFavoriteStatus(photoId) {
        try {
            const response = await fetch(`${window.app.config.API_URL}/photos/${photoId}/favorite-status`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });
            const data = await response.json();

            if (response.ok) {
                const photoView = window.app?.controllers?.photo?.view;
                if (photoView) {
                    photoView.updateFavoriteButton(photoId, data.is_favorite);
                }
                
                this.view.updateFavoriteButton(photoId, data.is_favorite);
                return data.is_favorite;
            } else {
                throw new Error(data.error || 'Erreur lors de la vérification du statut favori');
            }
        } catch (error) {
            console.error('Erreur vérification statut favori:', error);
            return false;
        }
    }

    // Met à jour le compteur de favoris
    async updateFavoritesStats() {
        try {
            const response = await fetch(`${window.app.config.API_URL}/stats`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });
            const data = await response.json();

            if (response.ok && data.success && data.stats) {
                const favoritesCount = document.getElementById('favoritesCount');
                if (favoritesCount) {
                    favoritesCount.textContent = data.stats.favorites || 0;
                }
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour du compteur de favoris:', error);
        }
    }

    isOnFavoritesPage() {
        return window.app?.controllers?.navigation?.getCurrentSection() === 'favorites';
    }

    getFavorites() {
        return this.favorites;
    }

    // Initialise les favoris au chargement (vérifie le statut de toutes les photos visibles)
    async initializeFavorites() {
    try {
        await this.loadFavorites();
        
        const visiblePhotos = document.querySelectorAll('.photo-item[data-photo-id]');
        
        const checkPromises = Array.from(visiblePhotos).map(photoElement => {
            const photoId = photoElement.dataset.photoId;
            return this.checkFavoriteStatus(photoId);
        });
        
        await Promise.all(checkPromises);
    } catch (error) {
        console.error('Erreur initialisation favoris:', error);
    }
}

    destroy() {
        this.favorites = [];
    }
}