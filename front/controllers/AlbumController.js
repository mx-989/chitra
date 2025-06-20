/**
 * Contrôleur pour la gestion des albums
 * Gère la création, modification, suppression et affichage des albums
 */
class AlbumController {
    constructor() {
        this.view = new AlbumView();
        this.albums = [];
        this.currentAlbum = null;
        this.coverImage = null;
        this.uploadButtonObserver = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('album:loadAll', () => {
            this.loadAlbums();
        });

        document.addEventListener('album:create', (event) => {
            this.createAlbum(event.detail);
        });
        
        document.addEventListener('album:update', (event) => {
            this.updateAlbum(event.detail.id, event.detail.data);
        });

        document.addEventListener('album:delete', (event) => {
            this.deleteAlbum(event.detail.id);
        });

        document.addEventListener('album:show', (event) => {
            this.showAlbum(event.detail.id);
        });

        document.addEventListener('click', (e) => {
            if (e.target.id === 'createAlbumBtn' || e.target.closest('#createAlbumBtn')) {
                this.showCreateModal();
            }
        });
    }

    // Charge tous les albums de l'utilisateur depuis l'API
    async loadAlbums() {
        try {
            this.view.showLoading();

            const response = await fetch(`${window.app.config.API_URL}/albums`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include' 
            });
            const data = await response.json();

            if (response.ok) {
                this.albums = data.albums || [];
                this.view.renderAlbums(this.albums , this.coverImage);
            } else {
                throw new Error(data.error || 'Erreur lors du chargement des albums');
            }
        } catch (error) {
            console.error('Erreur chargement albums:', error);
            showNotification('Impossible de charger les albums', 'error');
        }
    }

    // Crée un nouvel album via le modal
    async createAlbum(albumData) {
        try {
            this.view.showLoading();

            const response = await fetch(`${window.app.config.API_URL}/albums`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', 
                body: JSON.stringify(albumData)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showNotification('Album créé avec succès !', 'success');
                this.view.hideModal();
                this.loadAlbums();
            } else {
                throw new Error(data.error || 'Erreur lors de la création');
            }
        } catch (error) {
            console.error('Erreur création album:', error);
            showNotification(error.message, 'error');
        }
    }

    // Met à jour les détails d'un album existant via le modal
    async updateAlbum(albumId, updateData) {
        try {
            const response = await fetch(`${window.app.config.API_URL}/albums/${albumId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(updateData)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showNotification('Album mis à jour !', 'success');
                this.loadAlbums();
            } else {
                throw new Error(data.error || 'Erreur lors de la mise à jour');
            }
        } catch (error) {
            console.error('Erreur mise à jour album:', error);
            showNotification(error.message, 'error');
        }
    }

    // Supprime un album 
    async deleteAlbum(albumId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet album ?')) {
            return;
        }

        try {
            const response = await fetch(`${window.app.config.API_URL}/albums/${albumId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showNotification('Album supprimé !', 'success');
                this.loadAlbums();
            } else {
                throw new Error(data.error || 'Erreur lors de la suppression');
            }
        } catch (error) {
            console.error('Erreur suppression album:', error);
            showNotification(error.message, 'error');
        }
    }

    // Affiche les détails d'un album spécifique et charge ses photos, avec logique pour cacher le boutton d'upload si pas de permissions
    async showAlbum(albumId) {
    try {
        this.view.showLoading();

        if (this.uploadButtonObserver) {
            this.uploadButtonObserver.disconnect();
            this.uploadButtonObserver = null;
        }

        const response = await fetch(`${window.app.config.API_URL}/albums/${albumId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
        const data = await response.json();

        if (response.ok) {
            this.currentAlbum = data.album;
            this.view.renderAlbumDetail(this.currentAlbum);
            
            const album = this.currentAlbum;
            const canAdd = album.user_permission === 'add' || album.user_permission === 'owner';
            
            let killTimer = null;
            
            this.uploadButtonObserver = new MutationObserver(() => {
                const uploadButtons = document.querySelectorAll('[data-action="upload"]');
                
                if (uploadButtons.length > 0) {
                    uploadButtons.forEach(button => {
                        button.style.visibility = canAdd ? 'visible' : 'hidden';
                    });
                    
                    clearTimeout(killTimer);
                    killTimer = setTimeout(() => {
                        if (this.uploadButtonObserver) {
                            this.uploadButtonObserver.disconnect();
                            this.uploadButtonObserver = null;
                        }
                    }, 500);
                }
            });
            
            this.uploadButtonObserver.observe(document.body, { childList: true, subtree: true });
            
            setTimeout(() => {
                if (this.uploadButtonObserver) {
                    this.uploadButtonObserver.disconnect();
                    this.uploadButtonObserver = null;
                }
            }, 2000);
            
            const photosEvent = new CustomEvent('photo:loadAlbumPhotos', {
                detail: { albumId: albumId }
            });
            document.dispatchEvent(photosEvent);
        } else {
            throw new Error(data.error || 'Album non trouvé');
        }
    } catch (error) {
        console.error('Erreur chargement album:', error);
        showNotification(error.message, 'error');
    }
    }

    showCreateModal() {
        this.view.showCreateModal();
    }

    showEditModal(album) {
        this.view.showEditModal(album);
    }

    getAlbumById(albumId) {
        return this.albums.find(album => album.id == albumId);
    }

    getCurrentAlbum() {
        return this.currentAlbum;
    }

    getAllAlbums() {
        return this.albums;
    }

}