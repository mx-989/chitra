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

        document.addEventListener('favorite:add', (event) => {
            this.addFavorite(event.detail.photoId);
        });

        document.addEventListener('favorite:remove', (event) => {
            this.removeFavorite(event.detail.photoId);
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

    // Bascule le statut favori d'une photo (ajoute ou retire)
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

    // Ajoute une photo aux favoris
    async addFavorite(photoId) {
        try {
            const response = await fetch(`${window.app.config.API_URL}/favorites/${photoId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            const data = await response.json();

            if (response.ok) {
                if (data.already_favorite) {
                    this.view.showInfo('Cette photo est déjà dans vos favoris');
                } else {
                    const photoView = window.app?.controllers?.photo?.view;
                    if (photoView) {
                        photoView.updateFavoriteButton(photoId, true);
                        photoView.updatePhotoModalFavorite(photoId, true);
                    }
                    
                    this.view.updateFavoriteButton(photoId, true);
                    showNotification('Photo ajoutée aux favoris !', 'success');
                    this.updateFavoritesStats();
                }
            } else {
                throw new Error(data.error || 'Erreur lors de l\'ajout aux favoris');
            }
        } catch (error) {
            console.error('Erreur ajout favori:', error);
            showNotification(error.message, 'error');
        }
    }

    // Retire une photo des favoris
    async removeFavorite(photoId) {
        try {
            const response = await fetch(`${window.app.config.API_URL}/favorites/${photoId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            const data = await response.json();

            if (response.ok) {
                const photoView = window.app?.controllers?.photo?.view;
                if (photoView) {
                    photoView.updateFavoriteButton(photoId, false);
                    photoView.updatePhotoModalFavorite(photoId, false);
                }
                
                this.view.updateFavoriteButton(photoId, false);
                showNotification('Photo retirée des favoris !', 'success');
                this.updateFavoritesStats();

                if (this.isOnFavoritesPage()) {
                    this.loadFavorites();
                }
            } else {
                throw new Error(data.error || 'Erreur lors de la suppression des favoris');
            }
        } catch (error) {
            console.error('Erreur suppression favori:', error);
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
            const response = await fetch(`${window.app.config.API_URL}/favorites?limit=1`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });
            const data = await response.json();

            if (response.ok) {
                this.updateFavoritesCount(data.total || 0);
            }
        } catch (error) {
            console.error('Erreur mise à jour stats favoris:', error);
        }
    }

    updateFavoritesCount(count) {
        // Mettre à jour le compteur dans les statistiques
        const favoritesCount = document.getElementById('favoritesCount');
        if (favoritesCount) {
            favoritesCount.textContent = count;
        }
    }

    isOnFavoritesPage() {
        return window.location.pathname === '/favorites' || 
               document.querySelector('#favorites-section')?.style.display !== 'none';
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