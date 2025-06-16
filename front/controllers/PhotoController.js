/**
 * Contrôleur pour la gestion des photos
 * Gère l'upload, l'affichage, la recherche et les actions sur les photos
 */
class PhotoController {
    constructor() {
        this.view = new PhotoView();
        this.photos = [];
        this.currentPhoto = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('photo:loadAlbumPhotos', (event) => {
            this.loadAlbumPhotos(event.detail.albumId);
        });

        document.addEventListener('photo:loadFavorites', () => {
            this.loadFavoritePhotos();
        });

        document.addEventListener('photo:search', (event) => {
            this.searchPhotos(event.detail.query);
        });

        document.addEventListener('photo:upload', (event) => {
            this.uploadPhotos(event.detail);
        });

        document.addEventListener('photo:delete', (event) => {
            this.deletePhoto(event.detail.id);
        });

        document.addEventListener('photo:favorite', (event) => {
            this.toggleFavorite(event.detail.id);
        });

        document.addEventListener('photo:showUploadModal', (event) => {
            this.showUploadModal(event.detail?.albumId);
        });

        this.setupUploadEvents();
    }

    // événements pour l'upload de fichiers (drag & drop + sélection)
    setupUploadEvents() {
        document.addEventListener('change', (e) => {
            if (e.target.id === 'fileInput') {
                this.handleFileSelect(e.target.files);
            }
        });

        document.addEventListener('dragover', (e) => {
            const uploadZone = e.target.closest('.upload-zone');
            if (uploadZone) {
                e.preventDefault();
                uploadZone.classList.add('drag-over');
            }
        });

        document.addEventListener('dragleave', (e) => {
            const uploadZone = e.target.closest('.upload-zone');
            if (uploadZone && !uploadZone.contains(e.relatedTarget)) {
                uploadZone.classList.remove('drag-over');
            }
        });

        document.addEventListener('drop', (e) => {
            const uploadZone = e.target.closest('.upload-zone');
            if (uploadZone) {
                e.preventDefault();
                uploadZone.classList.remove('drag-over');
                this.handleFileSelect(e.dataTransfer.files);
            }
        });
    }

    // Charge toutes les photos d'un album spécifique
    async loadAlbumPhotos(albumId) {
        try {
            this.view.showLoading();

            const response = await fetch(`${window.app.config.API_URL}/albums/${albumId}/photos`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
            const data = await response.json();

            if (response.ok) {
                this.photos = data.photos || [];
                this.view.renderAlbumPhotos(this.photos, albumId);
            } else {
                throw new Error(data.error || 'Erreur lors du chargement des photos');
            }
        } catch (error) {
            console.error('Erreur chargement photos album:', error);
            showNotification('Impossible de charger les photos de l\'album', 'error');
        }
    }

    // Charge toutes les photos favorites de l'utilisateur
    async loadFavoritePhotos() {
        try {
            this.view.showLoading();
            const response = await fetch(`${window.app.config.API_URL}/favorites`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
            const data = await response.json();
            if (response.ok) {
                this.photos = data.photos || [];
                this.view.renderFavoritePhotos(this.photos);
            } else {
                throw new Error(data.error || 'Erreur lors du chargement des favoris');
            }

        } catch (error) {
            console.error('Erreur chargement favoris:', error);
            showNotification('Impossible de charger les favoris', 'error');
        }
    }

    // Recherche des photos selon une requête texte
    async searchPhotos(query) {
        try {
            this.view.showLoading();

            const searchParams = new URLSearchParams({
                q: query
            });

            const response = await fetch(`${window.app.config.API_URL}/search/photos?${searchParams}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
            const data = await response.json();

            if (response.ok) {
                this.photos = data.photos || [];
                this.view.renderSearchResults(this.photos, query);
            } else {
                throw new Error(data.error || 'Erreur lors de la recherche');
            }
        } catch (error) {
            console.error('Erreur recherche photos:', error);
            showNotification('Erreur lors de la recherche', 'error');
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

    // Upload plusieurs photos dans un album avec suivi de progression
    async uploadPhotos(uploadData) {
        try {
            const { files, albumId, tags, description } = uploadData;
            
            this.view.showUploadProgress(0);

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                
                const formData = new FormData();
                formData.append('photo', file);
                formData.append('description', description || '');
                formData.append('tags', JSON.stringify(tags || []));

                const response = await fetch(`${window.app.config.API_URL}/albums/${albumId}/photos`, {
                    method: 'POST',
                    credentials: 'include',
                    body: formData
                });

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data.error || `Erreur upload ${file.name}`);
                }

                const progress = ((i + 1) / files.length) * 100;
                this.view.showUploadProgress(progress);
            }

            showNotification(`${files.length} photo(s) uploadée(s) avec succès !`, 'success');
            this.view.hideUploadProgress();

            const currentAlbum = window.app?.controllers?.album?.getCurrentAlbum();
            if (currentAlbum && currentAlbum.id == albumId) {
                this.loadAlbumPhotos(albumId);
            }

        } catch (error) {
            console.error('Erreur upload photos:', error);
            showNotification(error.message, 'error');
            this.view.hideUploadProgress();
        }
    }

    // Supprime une photo après confirmation
    async deletePhoto(photoId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette photo ?')) {
            return;
        }

        try {
            const response = await fetch(`${window.app.config.API_URL}/photos/${photoId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showNotification('Photo supprimée !', 'success');
                this.view.removePhotoFromView(photoId);
            } else {
                throw new Error(data.error || 'Erreur lors de la suppression');
            }
        } catch (error) {
            console.error('Erreur suppression photo:', error);
            showNotification(error.message, 'error');
        }
    }

    async toggleFavorite(photoId) {
        try {
            this.view.toggleFavoriteIcon(photoId);
            showNotification('Favori mis à jour !', 'success');

        } catch (error) {
            console.error('Erreur toggle favori:', error);
            showNotification('Erreur lors de la mise à jour', 'error');
        }
    }

    // Traite les fichiers sélectionnés pour l'upload
    handleFileSelect(files) {
        if (!files || files.length === 0) return;

        const validFiles = Array.from(files).filter(file => {
            if (!file.type.startsWith('image/')) {
                showNotification(`${file.name} n'est pas une image valide`, 'error');
                return false;
            }
            
            if (file.size > 50 * 1024 * 1024) {
                showNotification(`${file.name} est trop volumineux (max 50MB)`, 'error');
                return false;
            }
            
            return true;
        });

        if (validFiles.length === 0) return;

        this.view.showSelectedFiles(validFiles);
    }

    showUploadModal(albumId = null) {
        this.view.showUploadModal(albumId);
    }

    // Met à jour les statistiques affichées de l'acceuil
    updateStats() {
        const photosCount = document.getElementById('photosCount');
        const albumsCount = document.getElementById('albumsCount');
        const favoritesCount = document.getElementById('favoritesCount');
        const storageUsed = document.getElementById('storageUsed');

        if (photosCount) photosCount.textContent = this.photos.length;
        if (albumsCount) albumsCount.textContent = '2';
        if (favoritesCount) favoritesCount.textContent = Math.floor(this.photos.length / 3);
        if (storageUsed) storageUsed.textContent = '2.28 GB';
    }

    getCurrentPhotos() {
        return this.photos;
    }

    getPhotoById(photoId) {
        return this.photos.find(photo => photo.id == photoId);
    }
}