/**
 * Vue pour la gestion des albums et la visualisation des photos.
 */
class AlbumView {
    constructor() {
        this.container = null;
        this.modal = null;
        this.currentTags = [];
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
            return null; 
        }
    }

    async getAlbumShares(albumId) {
        if (!albumId) return [];

        try {
            const response = await fetch(`${window.app.config.API_URL}/albums/${albumId}/shares`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                return data.shares || [];
            }
            return [];
        } catch (error) {
            console.error('Erreur récupération partages:', error);
            return [];
        }
    }

    async checkIfAlbumShared(albumId) {
        if (!albumId) return false;

        if (window.app?.controllers?.album) {
            const album = window.app.controllers.album.getAlbumById(albumId);
            if (album && typeof album.share_count !== 'undefined') {
                return album.share_count > 0;
            }
        }

        const shares = await this.getAlbumShares(albumId);
        return shares.length > 0;
    }

    formatSharesList(shares) {
        if (!shares || shares.length === 0) return '';
        
        if (shares.length === 1) {
            return shares[0].user_name || shares[0].user_email;
        } else if (shares.length === 2) {
            return `${shares[0].user_name || shares[0].user_email} et ${shares[1].user_name || shares[1].user_email}`;
        } else {
            return `${shares[0].user_name || shares[0].user_email} et ${shares.length - 1} autre${shares.length > 2 ? 's' : ''}`;
        }
    }

    async renderAlbums(albums) {
        window.inAlbumDetailView = false;
        
        const currentUrl = new URL(window.location.href);
        const baseUrl = currentUrl.origin + currentUrl.pathname;
        window.history.replaceState(null, '', baseUrl);
        
        this.hideLoading();
        
        const albumsGrid = document.getElementById('albumsGrid');
        if (!albumsGrid) return;

        if (!albums || albums.length === 0) {
            albumsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-images fa-4x text-muted-chitra mb-3"></i>
                    <h4>Aucun album</h4>
                    <p class="text-muted-chitra">Créez votre premier album pour commencer à organiser vos photos</p>
                </div>
            `;
            return;
        }

        let albumCardsHTML = '';
        for (let i = 0; i < albums.length; i++) {
            try {
                const cardHTML = await this.getAlbumCardHTML(albums[i]);
                albumCardsHTML += cardHTML;
            } catch (error) {
                console.error(`Erreur génération carte album ${albums[i].id}:`, error);
            }
        }
        
        albumsGrid.innerHTML = albumCardsHTML;
        this.attachAlbumEvents();
    }

    async getAlbumCardHTML(album) {
        const photoCount = album.photo_count || 0;
        const tags = album.tags ? (Array.isArray(album.tags) ? album.tags : JSON.parse(album.tags)) : [];
        
        const coverImage = await this.loadCoverImage(album.id);
        
        let isShared = false;
        let shareCount = 0;
        
        if (album.hasOwnProperty('share_count')) {
            shareCount = album.share_count;
            isShared = shareCount > 0;
        } else {
            try {
                const shares = await this.getAlbumShares(album.id);
                shareCount = shares.length;
                isShared = shareCount > 0;
            } catch (error) {
                console.warn(`Impossible de récupérer les partages pour l'album ${album.id}`);
                isShared = false;
                shareCount = 0;
            }
        }
        
        return `
            <div class="album-card" data-album-id="${album.id}">
                <div class="album-cover">
                    ${coverImage ? 
                        `<img src="/uploads/photos/${coverImage}" alt="${this.escapeHtml(album.title)}" loading="lazy">` :
                        `<div class="album-placeholder">
                            <i class="fas fa-images fa-3x"></i>
                        </div>`
                    }
                    <div class="album-overlay">
                        <div class="album-actions">
                            <button class="album-action" data-action="edit" title="Modifier">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="album-action" data-action="share" title="Partager">
                                <i class="fas fa-share"></i>
                            </button>
                            <button class="album-action" data-action="delete" title="Supprimer">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="album-info">
                    <h6 class="album-title">${this.escapeHtml(album.title)}</h6>
                    ${album.description ? 
                        `<p class="album-description">${this.escapeHtml(album.description)}</p>` : 
                        ''
                    }
                    <div class="album-meta">
                        <span class="photo-count">
                            <i class="fas fa-images me-1"></i>
                            ${photoCount} photo${photoCount > 1 ? 's' : ''}
                        </span>
                        ${isShared ? 
                            `<span class="album-visibility" title="Partagé avec ${shareCount} personne${shareCount > 1 ? 's' : ''}">
                                <i class="fas fa-share me-1"></i>
                                Partagé (${shareCount})
                            </span>` : 
                            ''
                        }
                    </div>
                    ${tags.length > 0 ? 
                        `<div class="album-tags">
                            ${tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                        </div>` : 
                        ''
                    }
                </div>
            </div>
        `;
    }

    attachAlbumEvents() {
        const albumCards = document.querySelectorAll('.album-card');
        
        albumCards.forEach(card => {
            const albumId = card.dataset.albumId;
            
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.album-action')) {
                    const showEvent = new CustomEvent('album:show', {
                        detail: { id: albumId }
                    });
                    document.dispatchEvent(showEvent);
                }
            });

            const actions = card.querySelectorAll('.album-action');
            actions.forEach(action => {
                action.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const actionType = action.dataset.action;
                    this.handleAlbumAction(albumId, actionType);
                });
            });
        });
    }

    handleAlbumAction(albumId, action) {
        switch (action) {
            case 'view':
                const showEvent = new CustomEvent('album:show', {
                    detail: { id: albumId }
                });
                document.dispatchEvent(showEvent);
                break;
                
            case 'edit':
                const album = window.app?.controllers?.album?.getAlbumById(albumId);
                if (album) {
                    this.showEditModal(album);
                }
                break;
                
            case 'share':
                this.showShareModal(albumId);
                break;
                
            case 'delete':
                const deleteEvent = new CustomEvent('album:delete', {
                    detail: { id: albumId }
                });
                document.dispatchEvent(deleteEvent);
                break;
        }
    }

    async renderAlbumDetail(album) {
        const contentArea = document.getElementById('contentArea');
        if (!contentArea) return;

        const tags = album.tags ? (Array.isArray(album.tags) ? album.tags : JSON.parse(album.tags)) : [];
        
        let isShared = false;
        let shareCount = 0;
        let sharesList = [];
        
        if (album.hasOwnProperty('share_count')) {
            shareCount = album.share_count;
            isShared = shareCount > 0;
            if (isShared) {
                sharesList = await this.getAlbumShares(album.id);
            }
        } else {
            sharesList = await this.getAlbumShares(album.id);
            shareCount = sharesList.length;
            isShared = shareCount > 0;
        }
        
        this.setupBackButtonHandler();

        contentArea.innerHTML = `
            <div id="album-detail-section" class="content-section">
                <div class="album-header">
                    <button class="btn btn-outline-secondary me-3" id="albumbackbutton" data-action="back">
                        <i class="fas fa-arrow-left me-1"></i>
                        Retour
                    </button>
                    
                    <div class="album-header-info">
                        <h2 class="album-detail-title">${this.escapeHtml(album.title)}</h2>
                        ${album.description ? 
                            `<p class="album-detail-description">${this.escapeHtml(album.description)}</p>` : 
                            ''
                        }
                        <div class="album-detail-meta">
                            <span class="creation-date">
                                <i class="fas fa-calendar me-1"></i>
                                Créé le ${this.formatDate(album.created_at)}
                            </span>
                            ${isShared ? 
                                `<span class="visibility">
                                    <i class="fas fa-share me-1"></i>
                                    Partagé avec ${shareCount} personne${shareCount > 1 ? 's' : ''}
                                </span>` : 
                                ''
                            }
                        </div>
                        ${tags.length > 0 ? 
                            `<div class="album-detail-tags">
                                ${tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                            </div>` : 
                            ''
                        }
                    </div>

                    <div class="album-header-actions">
                        <div style="display: flex; gap: 12px;">
                            <button class="btn btn-outline-secondary album-btn-custom" data-action="edit">
                                <i class="fas fa-edit me-1"></i>
                                Modifier
                            </button>
                            <button class="btn btn-outline-secondary album-btn-custom" data-action="share">
                                <i class="fas fa-share me-1"></i>
                                Partager
                            </button>
                        </div>
                        <button class="btn btn-primary" data-action="upload">
                            <i class="fas fa-plus me-1"></i>
                            Ajouter des photos
                        </button>
                    </div>
                </div>

                <div id="albumPhotosGrid" class="photo-grid">
                    <div class="loading-spinner">
                        <div class="spinner"></div>
                        <span>Chargement des photos...</span>
                    </div>
                </div>
            </div>
        `;

        this.attachAlbumDetailEvents(album);
        
        const loadPhotosEvent = new CustomEvent('photo:loadAlbumPhotos', {
            detail: { albumId: album.id }
        });
        document.dispatchEvent(loadPhotosEvent);
    }

    setupBackButtonHandler() {
        window.inAlbumDetailView = true;
        
        const currentUrl = new URL(window.location.href);
        const baseUrl = currentUrl.origin + currentUrl.pathname;
        
        window.history.pushState({ albumView: true }, '', baseUrl);
        
        window.onpopstate = (event) => {
            if (window.inAlbumDetailView) {
                if (window.comingFromSharedView) {
                    if (window.app?.controllers?.navigation?.showSharedAlbums) {
                        window.app.controllers.navigation.showSharedAlbums();
                        window.inAlbumDetailView = false;
                        window.comingFromSharedView = false;
                        return;
                    }
                }
                
                if (window.app?.controllers?.navigation?.showAlbums) {
                    window.app.controllers.navigation.showAlbums();
                    window.inAlbumDetailView = false;
                    return;
                }
            }
        };
    }

    attachAlbumDetailEvents(album) {
    const actions = document.querySelectorAll('[data-action]');
    
    actions.forEach(action => {
        action.addEventListener('click', () => {
            const actionType = action.dataset.action;
            
            switch (actionType) {
                case 'edit':
                    this.showEditModal(album);
                    break;
                case 'upload':
                    this.showUploadModal(album.id, album.title);
                    break;
                case 'share':
                    this.showShareModal(album.id);
                    break;
                case 'back':
                    if (window.app?.controllers?.navigation?.showAlbums) {
                        window.app.controllers.navigation.showAlbums();
                    }
                    break;
            }
        });
    });
}

    getPermissionLabel(permission) {
        switch (permission) {
            case 'view': return 'A le droit de voir';
            case 'comment': return 'A le droit de commenter';
            case 'add': return 'A le droit d\'ajouter';
            default: return permission;
        }
    }

    showCreateModal() {
        this.currentTags = [];
        this.modal = this.createModal('Créer un album', this.getAlbumFormHTML());
        this.attachModalEvents('create');
    }

    showEditModal(album) {
        this.currentTags = album?.tags ? (Array.isArray(album.tags) ? album.tags : JSON.parse(album.tags)) : [];
        this.modal = this.createModal('Modifier l\'album', this.getAlbumFormHTML(album));
        this.attachModalEvents('edit', album.id);
    }

    async showShareModal(albumId) {
        const shares = await this.getAlbumShares(albumId);
        this.modal = this.createModal('Partager l\'album', this.getShareFormHTML(shares));
        this.attachShareModalEvents(albumId);
    }

    showUploadModal(albumId, albumTitle = null) {
        if (!albumTitle) {
            const albums = window.app?.controllers?.album?.getAllAlbums() || [];
            const album = albums.find(a => a.id == albumId);
            albumTitle = album ? album.title : 'Album';
        }
        
        this.modal = this.createModal('Ajouter des photos', this.getUploadFormHTML(albumId, albumTitle));
        this.attachUploadModalEvents(albumId);
    }

    createModal(title, content) {
        this.hideModal();

        const overlay = document.createElement('div');
        overlay.className = 'album-modal-overlay';
        overlay.innerHTML = `
            <div class="album-modal-dialog">
                <div class="album-modal-header">
                    <h5 class="album-modal-title">${title}</h5>
                    <button class="album-modal-close" type="button">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="album-modal-body">
                    ${content}
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        requestAnimationFrame(() => {
            overlay.classList.add('show');
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.hideModal();
            }
        });

        const closeBtn = overlay.querySelector('.album-modal-close');
        closeBtn.addEventListener('click', () => {
            this.hideModal();
        });

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                this.hideModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        return overlay;
    }

    getAlbumFormHTML(album = null) {
        const isEdit = album !== null;

        return `
            <form class="album-form" id="albumForm">
                <div class="form-group">
                    <label class="form-label" for="albumTitle">Titre</label>
                    <input type="text" id="albumTitle" name="title" class="form-control" 
                           value="${isEdit ? this.escapeHtml(album.title) : ''}" 
                           placeholder="Nom de l'album" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label" for="albumDescription">Description</label>
                    <textarea id="albumDescription" name="description" class="form-control tag-input" 
                              placeholder="Description de l'album...">${isEdit ? this.escapeHtml(album.description || '') : ''}</textarea>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Tags</label>
                    <div class="tags-input-container" id="tagsContainer">
                        <input type="text" class="tag-input" placeholder="Ajouter un tag..." id="tagInput">
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="album-btn album-btn-secondary" id="cancelBtn">
                        Annuler
                    </button>
                    <button type="submit" class="album-btn album-btn-primary" id="submitBtn">
                        <i class="fas fa-${isEdit ? 'save' : 'plus'}"></i>
                        ${isEdit ? 'Modifier' : 'Créer'}
                    </button>
                </div>
            </form>
        `;
    }

    getShareFormHTML(shares = []) {
        const sharesList = shares.length > 0 ? shares.map(share => 
            `<div class="share-item">
                <div class="share-user-info">
                    <div class="user-avatar">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(share.user_name || share.user_email)}&background=d3869b&color=fff&size=40&bold=true" 
                             alt="Avatar" class="avatar-img">
                    </div>
                    <div class="user-details">
                        <span class="share-user">${this.escapeHtml(share.user_name || share.user_email)}</span>
                        <span class="share-email">(${this.escapeHtml(share.user_email)})</span>
                    </div>
                </div>
                <div class="share-permission-tag">${this.getPermissionLabel(share.permission)}</div>
                <button class="btn btn-sm btn-outline-danger revoke-share-btn" data-user-id="${share.user_id}" title="Supprimer ce partage">
                    <i class="fas fa-times me-1"></i>
                    Supprimer
                </button>
            </div>`
        ).join('') : '';

        return `
            <div class="share-form">
                ${shares.length > 0 ? `
                <div class="form-group">
                    <label class="form-label">Personnes ayant déjà accès</label>
                    <div class="current-shares">
                        ${sharesList}
                    </div>
                </div>
                ` : ''}
                
                <div class="form-group">
                    <label class="form-label">Partager à un utilisateur inscrit</label>
                    <div class="share-input-group">
                        <input type="email" class="form-control" id="shareEmail" 
                               placeholder="Email du destinataire">
                        <select class="form-control" id="sharePermission">
                            <option value="view">Droit de Lecture</option>
                            <option value="comment">Droit de Commenter</option>
                            <option value="add">Droit d'Ajouter</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="album-btn album-btn-secondary" id="closeBtn">
                        Annuler
                    </button>
                    <button type="button" class="album-btn album-btn-primary" id="shareByEmailBtn">
                        <i class="fas fa-share"></i>
                        Partager
                    </button>
                </div>
            </div>
        `;
    }

    getUploadFormHTML(albumId, albumTitle) {
        return `
            <div class="upload-form">
                <!-- Information sur l'album de destination -->
                <div class="album-destination-info">
                    <h6><i class="fas fa-folder me-2"></i>Album de destination</h6>
                    <p><strong>${this.escapeHtml(albumTitle)}</strong></p>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Fichiers</label>
                    <div class="upload-zone-modal" id="modalUploadZone">
                        <i class="fas fa-cloud-upload-alt fa-3x mb-3 text-muted-chitra"></i>
                        <h5>Glissez vos photos ici</h5>
                        <input type="file" class="d-none" id="modalFileInput" multiple accept="image/*">
                        <button type="button" class="album-btn album-btn-secondary" onclick="document.getElementById('modalFileInput').click()">
                            <i class="fas fa-folder-open"></i>
                            Choisir des fichiers
                        </button>
                    </div>
                </div>
                 <div id="selectedFiles" class="selected-files" style="display: none;">
                    <h6>Fichiers sélectionnés :</h6>
                    <div id="filesList"></div>
                </div>
                
                <!-- Champ caché contenant l'ID de l'album -->
                <input type="hidden" id="modalAlbumId" value="${albumId}">
                
                <div class="form-group">
                    <label class="form-label" for="modalUploadDescription">Description</label>
                    <textarea class="form-control" id="modalUploadDescription" rows="2" 
                              placeholder="Description des photos..."></textarea>
                </div>
                
                <div class="form-group">
                    <label class="form-label" for="modalUploadTags">Tags (séparés par des virgules)</label>
                    <input type="text" class="form-control" id="modalUploadTags" 
                           placeholder="vacances, famille, plage...">
                </div>
                
                <div id="modalUploadProgress" class="upload-progress" style="display: none;">
                    <div class="progress">
                        <div class="progress-bar" style="width: 0%"></div>
                    </div>
                    <span class="progress-text">0%</span>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="album-btn album-btn-secondary" id="uploadCancelBtn">
                        Annuler
                    </button>
                    <br>
                    <button type="button" class="album-btn album-btn-primary" id="modalUploadBtn" disabled>
                        <i class="fas fa-upload"></i>
                        Importer
                    </button>
                </div>
            </div>
        `;
    }

    attachUploadModalEvents(albumId) {
        const fileInput = document.getElementById('modalFileInput');
        const uploadZone = document.getElementById('modalUploadZone');
        const uploadBtn = document.getElementById('modalUploadBtn');
        const cancelBtn = document.getElementById('uploadCancelBtn');
        
        let selectedFiles = [];

        fileInput.addEventListener('change', (e) => {
            selectedFiles = Array.from(e.target.files);
            this.updateSelectedFiles(selectedFiles);
            this.updateUploadButton(selectedFiles.length > 0);
        });

        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('drag-over');
        });

        uploadZone.addEventListener('dragleave', (e) => {
            if (!uploadZone.contains(e.relatedTarget)) {
                uploadZone.classList.remove('drag-over');
            }
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('drag-over');
            selectedFiles = Array.from(e.dataTransfer.files);
            this.updateSelectedFiles(selectedFiles);
            this.updateUploadButton(selectedFiles.length > 0);
        });

        uploadBtn.addEventListener('click', () => {
            this.handleModalUpload(selectedFiles, albumId);
        });

        cancelBtn.addEventListener('click', () => {
            this.hideModal();
        });
    }

    updateSelectedFiles(files) {
        const selectedFilesDiv = document.getElementById('selectedFiles');
        const filesList = document.getElementById('filesList');

        if (files.length === 0) {
            selectedFilesDiv.style.display = 'none';
            return;
        }

        selectedFilesDiv.style.display = 'block';
        filesList.innerHTML = files.map(file => `
            <div class="file-item">
                <i class="fas fa-image"></i>
                <span class="file-name">${this.escapeHtml(file.name)}</span>
                <span class="file-size">${this.formatFileSize(file.size)}</span>
            </div>
        `).join('');
    }

    updateUploadButton(enabled) {
        const uploadBtn = document.getElementById('modalUploadBtn');
        uploadBtn.disabled = !enabled;
        
        if (enabled) {
            uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Importer';
        } else {
            uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Sélectionnez des fichiers';
        }
    }

    handleModalUpload(files, albumId) {
        const description = document.getElementById('modalUploadDescription').value;
        const tagsText = document.getElementById('modalUploadTags').value;
        const tags = tagsText ? tagsText.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

        if (files.length === 0) {
            showNotification('Veuillez sélectionner des fichiers', 'error');
            return;
        }

        const uploadEvent = new CustomEvent('photo:upload', {
            detail: { files, albumId, description, tags }
        });
        document.dispatchEvent(uploadEvent);
        
        showNotification('Upload en cours...', 'info');
        this.hideModal();
    }

    attachModalEvents(mode, albumId = null) {
        const form = document.getElementById('albumForm');
        const cancelBtn = document.getElementById('cancelBtn');
        const submitBtn = document.getElementById('submitBtn');
        
        this.setupTagsInput();

        cancelBtn.addEventListener('click', () => {
            this.hideModal();
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Traitement...';
            
            setTimeout(() => {
                this.handleFormSubmit(mode, albumId);
                submitBtn.disabled = false;
                submitBtn.innerHTML = mode === 'edit' ? 
                    '<i class="fas fa-save"></i> Modifier' : 
                    '<i class="fas fa-plus"></i> Créer';
            }, 500);
        });
    }

    attachShareModalEvents(albumId) {
        const shareByEmailBtn = document.getElementById('shareByEmailBtn');
        const closeBtn = document.getElementById('closeBtn');

        shareByEmailBtn.addEventListener('click', () => {
            this.handleShareByEmail(albumId);
        });

        closeBtn.addEventListener('click', () => {
            this.hideModal();
        });

        const revokeButtons = document.querySelectorAll('.revoke-share-btn');
        revokeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const userId = btn.dataset.userId;
                this.handleRevokeShare(albumId, userId);
            });
        });
    }

    setupTagsInput() {
        const container = document.getElementById('tagsContainer');
        const tagInput = document.getElementById('tagInput');

        this.renderTags();

        tagInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && tagInput.value.trim()) {
                e.preventDefault();
                this.addTag(tagInput.value.trim());
                tagInput.value = '';
            }
        });

        container.addEventListener('click', () => {
            tagInput.focus();
        });
    }

    renderTags() {
        const container = document.getElementById('tagsContainer');
        const tagInput = document.getElementById('tagInput');
        
        const existingTags = container.querySelectorAll('.tag-item');
        existingTags.forEach(tag => tag.remove());

        this.currentTags.forEach(tagText => {
            const tagElement = document.createElement('span');
            tagElement.className = 'tag-item';
            tagElement.innerHTML = `
                ${this.escapeHtml(tagText)}
                <button type="button" class="tag-remove" data-tag="${this.escapeHtml(tagText)}">×</button>
            `;
            
            const removeBtn = tagElement.querySelector('.tag-remove');
            removeBtn.addEventListener('click', () => {
                this.removeTag(tagText);
            });

            container.insertBefore(tagElement, tagInput);
        });
    }

    addTag(tagText) {
        if (this.currentTags.includes(tagText)) {
            showNotification('Ce tag existe déjà', 'error');
            return;
        }

        this.currentTags.push(tagText);
        this.renderTags();
    }

    removeTag(tagText) {
        this.currentTags = this.currentTags.filter(tag => tag !== tagText);
        this.renderTags();
    }

    handleFormSubmit(mode, albumId) {
        const formData = new FormData(document.getElementById('albumForm'));

        const data = {
            title: formData.get('title'),
            description: formData.get('description'),
            tags: this.currentTags
        };

        if (mode === 'create') {
            const createEvent = new CustomEvent('album:create', { detail: data });
            document.dispatchEvent(createEvent);
        } else if (mode === 'edit') {
            const updateEvent = new CustomEvent('album:update', { 
                detail: { id: albumId, data: data }
            });
            document.dispatchEvent(updateEvent);
        }

        this.hideModal();
    }

    handleShareByEmail(albumId) {
        const email = document.getElementById('shareEmail').value;
        const permission = document.getElementById('sharePermission').value;

        if (!email) {
            showNotification('Veuillez saisir une adresse email', 'error');
            return;
        }

        const shareEvent = new CustomEvent('share:byEmail', {
            detail: { albumId, email, permission }
        });
        document.dispatchEvent(shareEvent);
        
        this.hideModal();
    }

    handleRevokeShare(albumId, userId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce partage ?')) {
            return;
        }

        const revokeEvent = new CustomEvent('share:revoke', {
            detail: { albumId, userId }
        });
        document.dispatchEvent(revokeEvent);
    }

    hideModal() {
        if (this.modal) {
            this.modal.classList.remove('show');
            setTimeout(() => {
                if (this.modal && this.modal.parentNode) {
                    this.modal.parentNode.removeChild(this.modal);
                }
                this.modal = null;
            }, 300);
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}