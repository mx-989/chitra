/**
 * Vue pour les photocard et le plein écran
 */
class PhotoView {
    constructor() {
        this.uploadModal = null;
        this.albumView = new AlbumView();
    }

    // Placeholder quand la Timeline charge
    showTimelineLoading() {
        const timelineContent = document.getElementById('timelineContent');
        if (timelineContent) {
            timelineContent.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <span>Chargement des photos...</span>
                </div>
            `;
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

    // Affiche les photos dans la timeline
    renderTimelinePhotos(photos) {
        const timelineContent = document.getElementById('timelineContent');
        if (!timelineContent) return;

        if (!photos || photos.length === 0) {
            timelineContent.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-images fa-4x text-muted-chitra mb-3"></i>
                    <h4>Aucune photo</h4>
                    <p class="text-muted-chitra">Importez vos premières photos pour commencer</p>
                </div>
            `;
            return;
        }

        const photosByDate = this.groupPhotosByDate(photos);
        
        let html = '';
        for (const [date, datePhotos] of Object.entries(photosByDate)) {
            html += `
                <div class="date-section">
                    <h6 class="date-title">${this.formatDateTitle(date)}</h6>
                </div>
                <div class="photo-grid">
                    ${datePhotos.map(photo => this.getPhotoItemHTML(photo)).join('')}
                </div>
            `;
        }

        timelineContent.innerHTML = html;
        this.attachPhotoEvents();
        
        requestAnimationFrame(() => {
            this.refreshFavoriteStates();
        });
    }

    //  Affiche les photos dans un album
    renderAlbumPhotos(photos, albumId) {
    this.hideLoading();
    
    const albumPhotosGrid = document.getElementById('albumPhotosGrid');
    if (!albumPhotosGrid) return;

    if (!photos || photos.length === 0) {
        albumPhotosGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-images fa-4x text-muted-chitra mb-3"></i>
                <h4>Aucune photo dans cet album</h4>
                <p class="text-muted-chitra">Ajoutez des photos pour commencer à organiser votre album</p>
                <button class="btn btn-primary mt-3" data-action="upload" data-album-id="${albumId}">
                    <i class="fas fa-plus me-1"></i>
                    Ajouter des photos
                </button>
            </div>
        `;
        
        const uploadBtn = albumPhotosGrid.querySelector('[data-action="upload"]');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => {
                this.albumView.showUploadModal(albumId);
            });
        }
        
        return;
    }

    albumPhotosGrid.innerHTML = photos.map(photo => this.getPhotoItemHTML(photo)).join('');
    this.attachPhotoEvents();
    
    requestAnimationFrame(() => {
        this.refreshFavoriteStates();
    });
}

    // Affiche les photos dans les favoris
    renderFavoritePhotos(photos) {
        this.hideLoading();
        
        const favoritesGrid = document.getElementById('favoritesGrid');
        if (!favoritesGrid) return;

        if (!photos || photos.length === 0) {
            favoritesGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-heart fa-4x text-muted-chitra mb-3"></i>
                    <h4>Aucune photo favorite</h4>
                    <p class="text-muted-chitra">Marquez vos photos préférées comme favorites</p>
                </div>
            `;
            return;
        }

        favoritesGrid.innerHTML = photos.map(photo => this.getPhotoItemHTML(photo)).join('');
        this.attachPhotoEvents();
        
        requestAnimationFrame(() => {
            this.refreshFavoriteStates();
        });
    }

    // Affiche les résultats de recherche
    renderSearchResults(photos, query) {
        this.hideLoading();
        
        const contentArea = document.getElementById('contentArea');
        if (!contentArea) return;

        let html = `
            <div class="search-results-section">
                <div class="search-header">
                    <h3>Résultats pour "${this.escapeHtml(query)}"</h3>
                    <span class="results-count">${photos.length} photo(s) trouvée(s)</span>
                </div>
        `;

        if (photos.length === 0) {
            html += `
                <div class="empty-state">
                    <i class="fas fa-search fa-4x text-muted-chitra mb-3"></i>
                    <h4>Aucun résultat</h4>
                    <p class="text-muted-chitra">Essayez avec d'autres termes de recherche</p>
                </div>
            `;
        } else {
            html += `
                <div class="photo-grid">
                    ${photos.map(photo => this.getPhotoItemHTML(photo)).join('')}
                </div>
            `;
        }

        html += '</div>';
        contentArea.innerHTML = html;
        
        if (photos.length > 0) {
            this.attachPhotoEvents();
            this.loadFavoriteStates(photos);
        }
    }

    // Affiche les photocards
    getPhotoItemHTML(photo) {
        const photoUrl = photo.url || `/uploads/photos/${photo.filename}`;
        const isFavorite = photo.is_favorite || false;
        
        const currentUserId = window.app.currentUser.id;


        const showDelete = photo.uploaded_by === currentUserId;

        return `
            <div class="photo-item" data-photo-id="${photo.id}">
            <img src="${photoUrl}" alt="${this.escapeHtml(photo.description || photo.filename)}" loading="lazy">
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
        `;
    }

    attachPhotoEvents() {
        const photoItems = document.querySelectorAll('.photo-item');
        
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

    // Ouvre l'image en grand
    async showPhotoModal(photoId) {
    let photo = window.app?.controllers?.photo?.getPhotoById(photoId);
    
    if (!photo) {
        try {
            const response = await fetch(`${window.app.config.API_URL}/photos/${photoId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                photo = data.photo || data;
            } else {
                throw new Error('Photo non trouvée');
            }
        } catch (error) {
            console.error('Erreur chargement photo:', error);
            showNotification('Impossible de charger la photo', 'error');
            return;
        }
    }
    
    if (!photo) {
        showNotification('Photo introuvable', 'error');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'photo-modal';
    modal.innerHTML = `
        <div class="photo-modal-overlay">
            <div class="photo-modal-content">
                <button class="photo-modal-close" id="photoModalClose">
                    <i class="fas fa-times"></i>
                </button>
                
                <div class="photo-modal-image" id="photoModalImage">
                    <img src="${photo.url || `/uploads/photos/${photo.filename}`}" alt="${this.escapeHtml(photo.description || photo.filename)}">
                </div>
                
                <div class="photo-modal-info" id="photoModalInfo">
                    ${photo.description ? `<h4>${this.escapeHtml(photo.description)}</h4>` : ''}
                    <p class="photo-date">${this.formatDate(photo.date_taken || photo.created_at)}</p>
                    ${photo.tags && photo.tags.length > 0 ? 
                        `<div class="photo-tags">
                            ${photo.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                        </div>` : ''
                    }
                    ${
                        (window.app?.currentUser?.id !== photo.uploaded_by)
                        ? `<div class="uploader-name">
                            <p>Photo ajoutée par <strong>${this.escapeHtml(photo.uploader_name || 'un utilisateur inconnu')}</strong></p>
                           </div>`
                        : ''
                    }
                </div>
            </div>
        </div>
        
        <div class="photo-modal-hint">
            Cliquez sur l'image pour activer la pleine vue.
        </div>
    `;

    document.body.appendChild(modal);

    const photoImage = modal.querySelector('#photoModalImage');
    const photoInfo = modal.querySelector('#photoModalInfo');
    const closeBtn = modal.querySelector('#photoModalClose');
    const hint = modal.querySelector('.photo-modal-hint');
    let infoVisible = true;

    photoImage.addEventListener('click', (e) => {
        e.stopPropagation();
        
        if (infoVisible) {
            photoInfo.style.transition = 'opacity 0.3s ease';
            closeBtn.style.transition = 'opacity 0.3s ease';
            hint.style.transition = 'opacity 0.3s ease';
            
            photoInfo.style.opacity = '0';
            closeBtn.style.opacity = '0';
            hint.style.opacity = '0';
            
            setTimeout(() => {
                photoInfo.style.display = 'none';
                closeBtn.style.display = 'none';
                hint.style.display = 'none';
            }, 300);
            
            infoVisible = false;
        } else {
            photoInfo.style.display = 'block';
            closeBtn.style.display = 'block';
            hint.style.display = 'block';
            
            requestAnimationFrame(() => {
                photoInfo.style.opacity = '1';
                closeBtn.style.opacity = '1';
                hint.style.opacity = '1';
            });
            
            infoVisible = true;
        }
    });

    const overlay = modal.querySelector('.photo-modal-overlay');
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            modal.remove();
        }
    });

    closeBtn.addEventListener('click', () => {
        modal.remove();
    });

    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
}

    // Formulaire d'importation de photos
    showUploadModal(albumId = null) {
        const albums = window.app?.controllers?.album?.getAllAlbums() || [];

        this.uploadModal = document.createElement('div');
        this.uploadModal.className = 'modal-overlay';
        this.uploadModal.innerHTML = `
            <div class="modal-dialog upload-modal-dialog">
                <div class="modal-header">
                    <h5 class="modal-title">Importer des photos</h5>
                    <button class="modal-close" type="button">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="upload-modal-content">
                        <div class="upload-zone" id="modalUploadZone">
                            <i class="fas fa-cloud-upload-alt fa-3x mb-3 text-muted-chitra"></i>
                            <h5>Glissez vos photos ici</h5>
                            <p class="text-muted-chitra">ou cliquez pour sélectionner</p>
                            <input type="file" class="d-none" id="modalFileInput" multiple accept="image/*">
                            <button class="btn btn-primary" onclick="document.getElementById('modalFileInput').click()">
                                Choisir des fichiers
                            </button>
                        </div>
                        
                        <div class="upload-options">
                            <div class="form-group">
                                <label for="modalAlbumSelect">Album de destination *</label>
                                <select class="form-control" id="modalAlbumSelect" required>
                                    <option value="">Sélectionner un album...</option>
                                    ${albums.map(album => 
                                        `<option value="${album.id}" ${albumId == album.id ? 'selected' : ''}>
                                            ${this.escapeHtml(album.title)}
                                        </option>`
                                    ).join('')}
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="modalUploadDescription">Description</label>
                                <textarea class="form-control" id="modalUploadDescription" rows="2" 
                                          placeholder="Description des photos..."></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label for="modalUploadTags">Tags (séparés par des virgules)</label>
                                <input type="text" class="form-control" id="modalUploadTags" 
                                       placeholder="vacances, famille, plage...">
                            </div>
                        </div>
                        
                        <div id="selectedFiles" class="selected-files" style="display: none;">
                            <h6>Fichiers sélectionnés :</h6>
                            <div id="filesList"></div>
                        </div>
                        
                        <div id="modalUploadProgress" class="upload-progress" style="display: none;">
                            <div class="progress">
                                <div class="progress-bar" style="width: 0%"></div>
                            </div>
                            <span class="progress-text">0%</span>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn-modal btn-secondary" id="modalCancelBtn">Annuler</button>
                            <button type="button" class="btn-modal btn-primary" id="modalUploadBtn" disabled>
                                Importer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.uploadModal);
        this.attachUploadModalEvents();
    }

    attachUploadModalEvents() {
        const fileInput = document.getElementById('modalFileInput');
        const uploadZone = document.getElementById('modalUploadZone');
        const uploadBtn = document.getElementById('modalUploadBtn');
        const cancelBtn = document.getElementById('modalCancelBtn');
        
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
            this.handleModalUpload(selectedFiles);
        });

        cancelBtn.addEventListener('click', () => {
            this.hideUploadModal();
        });

        this.uploadModal.addEventListener('click', (e) => {
            if (e.target === this.uploadModal || e.target.closest('.modal-close')) {
                this.hideUploadModal();
            }
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
        const albumSelect = document.getElementById('modalAlbumSelect');
        
        const canUpload = enabled && albumSelect.value;
        uploadBtn.disabled = !canUpload;
        
        if (canUpload) {
            uploadBtn.textContent = `Importer ${enabled ? uploadBtn.dataset.fileCount || '0' : '0'} fichier(s)`;
        } else {
            uploadBtn.textContent = 'Importer';
        }
    }

    handleModalUpload(files) {
        const albumId = document.getElementById('modalAlbumSelect').value;
        const description = document.getElementById('modalUploadDescription').value;
        const tagsText = document.getElementById('modalUploadTags').value;
        const tags = tagsText ? tagsText.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

        if (!albumId) {
            showNotification('Veuillez sélectionner un album', 'error');
            return;
        }

        if (files.length === 0) {
            showNotification('Veuillez sélectionner des fichiers', 'error');
            return;
        }

        const uploadEvent = new CustomEvent('photo:upload', {
            detail: { files, albumId, description, tags }
        });
        document.dispatchEvent(uploadEvent);
    }

    hideUploadModal() {
        if (this.uploadModal) {
            this.uploadModal.remove();
            this.uploadModal = null;
        }
    }

    showSelectedFiles(files) {
        const uploadZone = document.querySelector('.upload-zone');
        if (!uploadZone) return;

        let filesList = document.getElementById('uploadFilesList');
        if (!filesList) {
            filesList = document.createElement('div');
            filesList.id = 'uploadFilesList';
            filesList.className = 'upload-files-list';
            uploadZone.parentNode.insertBefore(filesList, uploadZone.nextSibling);
        }

        filesList.innerHTML = `
            <h5>Fichiers sélectionnés (${files.length})</h5>
            <div class="files-grid">
                ${Array.from(files).map(file => `
                    <div class="file-preview">
                        <div class="file-preview-image">
                            <i class="fas fa-image"></i>
                        </div>
                        <div class="file-info">
                            <span class="file-name">${this.escapeHtml(file.name)}</span>
                            <span class="file-size">${this.formatFileSize(file.size)}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    showUploadProgress(progress) {
        const progressDiv = document.getElementById('modalUploadProgress') || document.getElementById('uploadProgress');
        if (!progressDiv) return;

        progressDiv.style.display = 'block';
        const progressBar = progressDiv.querySelector('.progress-bar');
        const progressText = progressDiv.querySelector('.progress-text');

        if (progressBar) {
            progressBar.style.width = progress + '%';
        }
        if (progressText) {
            progressText.textContent = Math.round(progress) + '%';
        }

        const uploadBtn = document.getElementById('modalUploadBtn');
        const cancelBtn = document.getElementById('modalCancelBtn');
        
        if (uploadBtn) uploadBtn.disabled = true;
        if (cancelBtn) cancelBtn.disabled = true;
    }

    hideUploadProgress() {
        const progressDiv = document.getElementById('modalUploadProgress') || document.getElementById('uploadProgress');
        if (progressDiv) {
            progressDiv.style.display = 'none';
        }

        const uploadBtn = document.getElementById('modalUploadBtn');
        const cancelBtn = document.getElementById('modalCancelBtn');
        
        if (uploadBtn) uploadBtn.disabled = false;
        if (cancelBtn) cancelBtn.disabled = false;
    }

    removePhotoFromView(photoId) {
        const photoItem = document.querySelector(`[data-photo-id="${photoId}"]`);
        if (photoItem) {
            photoItem.style.transition = 'all 0.3s ease';
            photoItem.style.transform = 'scale(0)';
            photoItem.style.opacity = '0';
            
            setTimeout(() => {
                photoItem.remove();
                this.updatePhotosCount();
            }, 300);
        }
    }

    toggleFavoriteIcon(photoId) {
        const photoItem = document.querySelector(`[data-photo-id="${photoId}"]`);
        if (photoItem) {
            const favoriteBtn = photoItem.querySelector('[data-action="favorite"]');
            if (favoriteBtn) {
                favoriteBtn.classList.toggle('active');
                
                favoriteBtn.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    favoriteBtn.style.transform = 'scale(1)';
                }, 200);
            }
        }
    }

    // Met à jour le coeur
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
    }

    async loadFavoriteStates(photos) {
        if (!photos || photos.length === 0) return;
        
        for (const photo of photos) {
            if (photo.is_favorite === undefined || photo.is_favorite === null) {
                const checkEvent = new CustomEvent('favorite:checkStatus', {
                    detail: { photoId: photo.id }
                });
                document.dispatchEvent(checkEvent);
            } else {
                this.updateFavoriteButton(photo.id, photo.is_favorite);
            }
        }
    }

    async refreshFavoriteStates() {
        const photoItems = document.querySelectorAll('.photo-item[data-photo-id]');
        
        photoItems.forEach(item => {
            const photoId = item.dataset.photoId;
            if (photoId) {
                const checkEvent = new CustomEvent('favorite:checkStatus', {
                    detail: { photoId: photoId }
                });
                document.dispatchEvent(checkEvent);
            }
        });
    }

    updatePhotoModalFavorite(photoId, isFavorite) {
        const photoModal = document.querySelector('.photo-modal');
        if (photoModal) {
            const favoriteBtn = photoModal.querySelector('[data-action="favorite"]');
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
        }
    }

    // Appelle le modal de commentaires
    showCommentsModal(photoId) {
    const commentsEvent = new CustomEvent('comment:showModal', {
        detail: { 
            photoId: photoId,
        }
    });
    document.dispatchEvent(commentsEvent);
    }

    // Affiche le modal de partage
    showShareModal(photoId) {
        const existingModals = document.querySelectorAll('.photo-share-modal');
        existingModals.forEach(modal => modal.remove());

        const modal = document.createElement('div');
        modal.className = 'modal-overlay photo-share-modal'; 
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-header">
                    <h5 class="modal-title">Partager la photo</h5>
                    <button class="modal-close" type="button">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="share-options">
                        <button class="share-option" data-action="copy-link">
                            <i class="fas fa-link"></i>
                            Copier le lien
                        </button>
                        <button class="share-option" data-action="twitter">
                            <i class="fab fa-twitter"></i>
                            Twitter
                        </button>
                        <button class="share-option" data-action="download">
                            <i class="fas fa-download"></i>
                            Télécharger
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        requestAnimationFrame(() => {
            modal.classList.add('show');
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideShareModal(modal);
            }
        });

        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => {
            this.hideShareModal(modal);
        });

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                this.hideShareModal(modal);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        const shareOptions = modal.querySelectorAll('.share-option');
        shareOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation(); 
                const action = option.dataset.action;
                this.handlePhotoShare(photoId, action);
                this.hideShareModal(modal);
            });
        });
    }

    hideShareModal(modal) {
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                if (modal && modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 300);
        }
    }

    handlePhotoShare(photoId, action) {
        const photo = window.app?.controllers?.photo?.getPhotoById(photoId);
        if (!photo) return;

        const photoUrl = window.location.origin + (photo.url || `/uploads/photos/${photo.filename}`);
        const shareText = `Regardez cette photo : ${photo.description || 'Photo'}`;

        switch (action) {
            case 'copy-link':
                navigator.clipboard.writeText(photoUrl).then(() => {
                    showNotification('Lien copié dans le presse-papiers !', 'success');
                }).catch(() => {
                    showNotification('Impossible de copier le lien', 'error');
                });
                break;
                
            case 'twitter':
                const tweetText = `${shareText} #photo #chitra`;
                const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(photoUrl)}`;
                window.open(twitterUrl, 'twitter-share', 'width=600,height=400');
                break;
                
            case 'download':
                this.downloadPhoto(photo);
                break;
        }
    }

    downloadPhoto(photo) {
        const photoUrl = photo.url || `/uploads/photos/${photo.filename}`;
        const link = document.createElement('a');
        link.href = photoUrl;
        link.download = photo.filename || 'photo.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showSuccess('Téléchargement démarré !', 'success');
    }

    groupPhotosByDate(photos) {
        const groups = {};
        
        photos.forEach(photo => {
            const date = new Date(photo.date_taken).toDateString();
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(photo);
        });

        const sortedGroups = Object.keys(groups)
            .sort((a, b) => new Date(b) - new Date(a))
            .reduce((acc, key) => {
                acc[key] = groups[key];
                return acc;
            }, {});

        return sortedGroups;
    }

    formatDateTitle(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Aujourd\'hui - ' + date.toLocaleDateString('fr-FR');
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Hier - ' + date.toLocaleDateString('fr-FR');
        } else {
            return date.toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    updatePhotosCount() {
        const photosCount = document.getElementById('photosCount');
        if (photosCount) {
            const currentPhotos = document.querySelectorAll('.photo-item').length;
            photosCount.textContent = currentPhotos;
        }
    }

    async searchWithFilters(filters) {
        try {
            this.view.showLoading();

            const searchParams = new URLSearchParams();
            
            if (filters.query) searchParams.append('q', filters.query);
            if (filters.tags) searchParams.append('tags', filters.tags);
            if (filters.dateFrom) searchParams.append('date_from', filters.dateFrom);
            if (filters.dateTo) searchParams.append('date_to', filters.dateTo);

            const response = await fetch(`${window.app.config.API_URL}/search/photos?${searchParams}`);
            const data = await response.json();

            if (response.ok) {
                this.photos = data.photos || [];
                this.view.renderSearchResults(this.photos, filters.query || 'Recherche avancée');
            } else {
                throw new Error(data.error || 'Erreur lors de la recherche');
            }
        } catch (error) {
            console.error('Erreur recherche avec filtres:', error);
            showNotification('Erreur lors de la recherche', 'error');
        }
    }

    validateFile(file) {
        const maxSize = 10 * 1024 * 1024; 
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

        if (!allowedTypes.includes(file.type)) {
            showNotification(`${file.name} : Format non supporté`, 'error');
            return false;
        }

        if (file.size > maxSize) {
            showNotification(`${file.name} : Fichier trop volumineux (max 50MB)`, 'error');
            return false;
        }

        return true;
    }

    setLoadingState(isLoading) {
        const loadingElements = document.querySelectorAll('.loading-spinner');
        const contentElements = document.querySelectorAll('.photo-grid, .albums-grid');

        if (isLoading) {
            loadingElements.forEach(el => el.style.display = 'block');
            contentElements.forEach(el => el.style.opacity = '0.5');
        } else {
            loadingElements.forEach(el => el.style.display = 'none');
            contentElements.forEach(el => el.style.opacity = '1');
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    destroy() {
        this.photos = [];
        this.currentPhoto = null;
        
        if (this.uploadModal) {
            this.uploadModal.remove();
            this.uploadModal = null;
        }
    }
}