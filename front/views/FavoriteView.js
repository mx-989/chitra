/**
 * Vue pour la sections favoris
 */
class FavoriteView {
    constructor() {
        this.photoView = new PhotoView();
    }

    showLoading() {
        const favoritesContent = document.querySelector('.favorites-content');
        if (favoritesContent) {
            favoritesContent.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <span>Chargement des favoris...</span>
                </div>
            `;
        }
    }

    hideLoading() {
        const loadingSpinner = document.querySelector('.loading-spinner');
        if (loadingSpinner) {
            loadingSpinner.style.display = 'none';
        }
    }

    renderFavorites(favorites, total = 0) {
        this.hideLoading();
        
        const favoritesGrid = document.getElementById('favoritesGrid');
        if (!favoritesGrid) return;

        if (!favorites || favorites.length === 0) {
            favoritesGrid.innerHTML = this.getEmptyStateHTML();
            return;
        }

        favoritesGrid.innerHTML = favorites.map(photo => this.getFavoritePhotoHTML(photo)).join('');
        this.attachFavoriteEvents();
    }

    getFavoritePhotoHTML(photo) {
        const photoUrl = photo.url || `/uploads/photos/${photo.filename}`;
        const albumName = photo.album_title || 'Sans album';
        const favoriteDate = new Date(photo.created_at).toLocaleDateString('fr-FR');
        const isFavorite = photo.is_favorite || true; 
        
        const currentUserId = window.app?.currentUser?.id;
        const showDelete = photo.uploaded_by === currentUserId;
        
        return `
            <div class="photo-item favorite-photo-item" data-photo-id="${photo.id}">
                <div class="favorite-photo-cover">
                    <img src="${photoUrl}" alt="${this.escapeHtml(photo.description || ' ')}" loading="lazy">
                    <div class="photo-overlay">
                        <div class="photo-actions">
                            <button class="photo-action ${isFavorite ? 'active' : ''}" data-action="favorite" title="Favori">
                                <i class="fas fa-heart"></i>
                            </button>
                            <button class="photo-action" data-action="share" title="Partager">
                                <i class="fas fa-share"></i>
                            </button>
                            <button class="photo-action" data-action="comment" title="Commenter">
                                <i class="fas fa-comment"></i>
                            </button>
                            ${showDelete ? `
                                <button class="photo-action" data-action="delete" title="Supprimer">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
                
                <div class="favorite-info">
                    <h6 class="favorite-title">${this.escapeHtml(photo.description || '')}</h6>
                    <div class="favorite-meta">
                        <div class="album-name">
                            <i class="fas fa-folder"></i>
                            ${this.escapeHtml(albumName)}
                        </div>
                        <div class="favorite-date">${favoriteDate}</div>
                    </div>
                    ${photo.tags && photo.tags.length > 0 ? 
                        `<div class="favorite-tags">
                            ${photo.tags.map(tag => `<span class="favorite-tag">${this.escapeHtml(tag)}</span>`).join('')}
                        </div>` : 
                        ''
                    }
                </div>
            </div>
        `;
    }

    getEmptyStateHTML(title = 'Aucun favori', subtitle = 'Marquez vos photos préférées avec ♥ pour les retrouver ici') {
        return `
            <div class="favorites-empty">
                <i class="fas fa-heart"></i>
                <h3>${title}</h3>
                <p>${subtitle}</p>
            </div>
        `;
    }

    attachFavoriteEvents() {
        const photoItems = document.querySelectorAll('.favorite-photo-item');
        
        photoItems.forEach(item => {
            const photoId = item.dataset.photoId;

            item.addEventListener('click', (e) => {
                if (!e.target.closest('.photo-action')) {
                    this.showPhotoModal(photoId);
                }
            });

            const actions = item.querySelectorAll('.photo-action');
            actions.forEach(action => {
                action.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const actionType = action.dataset.action;
                    this.handlePhotoAction(photoId, actionType, action);
                });
            });
        });
    }

    handlePhotoAction(photoId, action, button) {
        switch (action) {
            case 'favorite':
                const favoriteEvent = new CustomEvent('favorite:toggle', {
                    detail: { photoId: photoId }
                });
                document.dispatchEvent(favoriteEvent);
                break;
                
            case 'share':
                this.showShareModal(photoId);
                break;
                
            case 'comment':
                this.showCommentsModal(photoId);
                break;
                
            case 'delete':
                const deleteEvent = new CustomEvent('photo:delete', {
                    detail: { id: photoId }
                });
                document.dispatchEvent(deleteEvent);
                break;
        }
    }

    showPhotoModal(photoId) {
    const photoElement = document.querySelector(`[data-photo-id="${photoId}"]`);
    const img = photoElement?.querySelector('img');
    
    if (img) {
        const favoritePhotos = window.app?.controllers?.favorite?.favorites || [];
        const originalPhoto = favoritePhotos.find(p => p.id == photoId);
        
        const photo = {
            id: photoId,
            url: img.src,
            filename: img.src.split('/').pop(),
            description: img.alt || 'Photo',
            date_taken: originalPhoto?.date_taken || originalPhoto?.created_at || new Date().toISOString(),
            created_at: originalPhoto?.created_at || new Date().toISOString(),
            uploaded_by: originalPhoto?.uploaded_by,
            uploader_name: originalPhoto?.uploader_name,
            tags: originalPhoto?.tags || []
        };
        
        if (!window.app.controllers.photo.photos) {
            window.app.controllers.photo.photos = [];
        }
        
        const existingIndex = window.app.controllers.photo.photos.findIndex(p => p.id == photoId);
        if (existingIndex !== -1) {
            window.app.controllers.photo.photos[existingIndex] = photo;
        } else {
            window.app.controllers.photo.photos.push(photo);
        }
        
        this.photoView.showPhotoModal(photoId);
    } else {
        showNotification('Photo introuvable', 'error');
    }
}

    showShareModal(photoId) {
        this.photoView.showShareModal(photoId);
    }

    showCommentsModal(photoId) {
        this.photoView.showCommentsModal(photoId);
    }

    updateFavoriteButton(photoId, isFavorite) {
        const photoItems = document.querySelectorAll(`[data-photo-id="${photoId}"]`);
        
        photoItems.forEach(item => {
            const favoriteBtn = item.querySelector('[data-action="favorite"]');
            if (favoriteBtn) {
                if (isFavorite) {
                    favoriteBtn.classList.add('active');
                } else {
                    favoriteBtn.classList.remove('active');
                }
                
                favoriteBtn.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    favoriteBtn.style.transform = 'scale(1)';
                }, 200);
            }
        });

        if (!isFavorite && window.app.controllers.favorite.isOnFavoritesPage()) {
            const favoriteItem = document.querySelector(`.favorite-photo-item[data-photo-id="${photoId}"]`);
            if (favoriteItem) {
                favoriteItem.style.transition = 'all 0.3s ease';
                favoriteItem.style.transform = 'scale(0)';
                favoriteItem.style.opacity = '0';
                
                setTimeout(() => {
                    favoriteItem.remove();
                    
                    const remainingFavorites = document.querySelectorAll('.favorite-photo-item');
                    if (remainingFavorites.length === 0) {
                        const favoritesGrid = document.getElementById('favoritesGrid');
                        if (favoritesGrid) {
                            favoritesGrid.innerHTML = this.getEmptyStateHTML();
                        }
                    }
                }, 300);
            }
        }
    }

    showInfo(message) {
        const notification = new NotificationView();
        notification.show(message, 'info');
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}