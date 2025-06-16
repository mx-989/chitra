/**
 * Vue pour les albums partagés
 */
class ShareView {
    constructor() {
        this.modal = null;
        this.setupBackNavigationHandler();
        this.setupLocationBasedButtonHiding();
    }

    setupLocationBasedButtonHiding() {
        this.injectLocationBasedCSS();
        this.observeLocationChanges();
    }

    injectLocationBasedCSS() {
        if (document.querySelector('#shared-location-hide-buttons')) return;
        
        const style = document.createElement('style');
        style.id = 'shared-location-hide-buttons';
        style.textContent = `
            /* Masquer les boutons edit/share des albums uniquement quand l'URL contient /shared */
            body[data-location*="/shared"] .album-header-actions [data-action="edit"],
            body[data-location*="/shared"] .album-header-actions [data-action="share"],
            body[data-location*="/shared"] .album-header-actions > div[style*="display: flex"] {
                display: none !important;
            }
            
            /* Mais garder visible le bouton partager des photos */
            body[data-location*="/shared"] .photo-action[data-action="share"] {
                display: flex !important;
            }
        `;
        document.head.appendChild(style);
    }

    // les 3 prochaines fonctions servent a bien rediriger la navigation vers la liste d'albums partagés
    observeLocationChanges() {
        const updateLocationAttribute = () => {
            document.body.setAttribute('data-location', window.location.pathname);
        };

        updateLocationAttribute();

        window.addEventListener('popstate', updateLocationAttribute);

        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;

        history.pushState = function(...args) {
            originalPushState.apply(history, args);
            setTimeout(updateLocationAttribute, 0);
        };

        history.replaceState = function(...args) {
            originalReplaceState.apply(history, args);
            setTimeout(updateLocationAttribute, 0);
        };

        const observer = new MutationObserver(() => {
            if (!document.body.hasAttribute('data-location') || 
                document.body.getAttribute('data-location') !== window.location.pathname) {
                updateLocationAttribute();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    setupBackNavigationHandler() {
        window.addEventListener('popstate', (event) => {
            if (window.location.pathname.startsWith('/shared')) {
                event.preventDefault();
                event.stopPropagation();
                
                setTimeout(() => {
                    this.forceSharedNavigation();
                }, 10);
            }
        });

        document.addEventListener('click', (event) => {
            if (window.location.pathname.startsWith('/shared')) {
                const isAlbumBackButton = event.target.closest('#albumbackbutton');
                
                if (isAlbumBackButton) {
                    event.preventDefault();
                    event.stopPropagation();
                    
                    this.forceSharedNavigation();
                }
            }
        });
    }

    forceSharedNavigation() {
        if (window.app?.controllers?.navigation) {
            window.app.controllers.navigation.showShared();
            return;
        }
    }

    // Charge la miniature de l'album
    async loadCoverImage(albumId) {
        try {
            const response = await fetch(`${window.app.config.API_URL}/lastphoto/${albumId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (!data.photo) {
                    return null
                }
                return data.photo.filename
            } else {
                throw new Error('Erreur lors du chargement de l\'image de couverture');
            }
        } catch (error) {
            console.error('Erreur chargement image de couverture:', error);
        }
    }

    // Affiche la liste d'albums partagés
    async renderSharedAlbums(albums) {
        this.hideLoading();
        
        const sharedGrid = document.getElementById('sharedGrid');
        if (!sharedGrid) return;

        if (!albums || albums.length === 0) {
            sharedGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users fa-4x text-muted-chitra mb-3"></i>
                    <h4>Aucun album partagé</h4>
                    <p class="text-muted-chitra">Les albums que d'autres utilisateurs ont partagé avec vous apparaîtront ici</p>
                </div>
            `;
            return;
        }

        const albumCards = await Promise.all(
            albums.map(album => this.getSharedAlbumCardHTML(album))
        );
        sharedGrid.innerHTML = albumCards.join('');
        this.attachSharedAlbumEvents();
    }

    // Génère le HTML pour une carte d'album partagé
    async getSharedAlbumCardHTML(album) {
        const photoCount = album.photo_count || 0;
        const coverImage = await this.loadCoverImage(album.id) || null;
        const sharedBy = album.shared_by || album.owner_name || 'Utilisateur';
        const permission = album.permission || 'view';
        
        return `
            <div class="shared-album-card album-card" data-album-id="${album.id}">
                <div class="album-cover">
                    ${coverImage ? 
                        `<img src="/uploads/photos/${coverImage}" alt="${album.title}" loading="lazy">` :
                        `<div class="album-placeholder">
                            <i class="fas fa-images fa-3x"></i>
                        </div>`
                    }
                    <div class="shared-badge">
                        <i class="fas fa-${this.getPermissionIcon(permission)}"></i>
                        ${this.getPermissionLabel(permission)}
                    </div>
                </div>
                
                <div class="album-info">
                    <h6 class="album-title">${this.escapeHtml(album.title)}</h6>
                    <p class="shared-by">Partagé par ${this.escapeHtml(sharedBy)}</p>
                    ${album.description ? 
                        `<p class="album-description">${this.escapeHtml(album.description)}</p>` : 
                        ''
                    }
                    <div class="album-meta">
                        <span class="photo-count">
                            <i class="fas fa-images me-1"></i>
                            ${photoCount} photo${photoCount > 1 ? 's' : ''}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    attachSharedAlbumEvents() {
        const albumCards = document.querySelectorAll('.shared-album-card');
        
        albumCards.forEach(card => {
            const albumId = card.dataset.albumId;
            
            card.addEventListener('click', () => {
                const showEvent = new CustomEvent('sharedAlbum:show', {
                    detail: { id: albumId }
                });
                document.dispatchEvent(showEvent);
            });
        });
    }

    clearEmailForm() {
        const shareEmail = document.getElementById('shareEmail');
        if (shareEmail) {
            shareEmail.value = '';
        }
    }

    showLoading() {
        const loadingSpinner = document.querySelector('.loading-spinner');
        if (loadingSpinner) {
            loadingSpinner.style.display = 'block';
        }
    }

    hideLoading() {
        const loadingSpinner = document.querySelector('.loading-spinner');
        if (loadingSpinner) {
            loadingSpinner.style.display = 'none';
        }
    }

    getPermissionIcon(permission) {
        switch (permission) {
            case 'add': return 'plus-circle';
            case 'comment': return 'comment';
            default: return 'eye';
        }
    }

    getPermissionLabel(permission) {
        switch (permission) {
            case 'add': return 'Ajouter';
            case 'comment': return 'Commenter';
            default: return 'Lecture';
        }
    }

    // Formate la date en format lisible
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;

        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            if (hours === 0) {
                const minutes = Math.floor(diff / 60000);
                return minutes === 0 ? 'À l\'instant' : `Il y a ${minutes} min`;
            }
            return `Il y a ${hours}h`;
        }

        if (diff < 604800000) {
            const days = Math.floor(diff / 86400000);
            return `Il y a ${days}j`;
        }

        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}