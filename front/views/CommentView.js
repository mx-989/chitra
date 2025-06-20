/**
 * Vue pour le modal des commentaires
 */
class CommentView {
    constructor() {
        this.modal = null;
    }

    showCommentsModal(photoId, permission) {
        const photo = window.app?.controllers?.photo?.getPhotoById(photoId);
        const photoTitle = photo ? (photo.description || 'Photo sans titre') : 'Photo';

        this.modal = document.createElement('div');
        this.modal.className = 'modal-overlay comments-modal'; 
        this.modal.innerHTML = `
            <div class="modal-dialog comments-modal-dialog">
            <div class="modal-header">
                <h5 class="modal-title">
                <i class="fas fa-comments me-2"></i>
                Commentaires - ${this.escapeHtml(photoTitle)}
                </h5>
                <button class="modal-close" type="button">
                <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="comments-container">
                <div id="commentsList" class="comments-list">
                    <div class="loading-spinner">
                    <div class="spinner"></div>
                    <span>Chargement des commentaires...</span>
                    </div>
                </div>
                ${permission ? `
                <div class="comment-form">
                    <div class="comment-input-container">
                    <textarea class="form-control input-chitra" id="commentTextarea" 
                          placeholder="Ajouter un commentaire..." rows="3"></textarea>
                    <button class="btn btn-primary" id="addCommentBtn">
                        <i class="fas fa-paper-plane me-1"></i>
                        Publier
                    </button>
                    </div>
                </div>
                ` : ''}
                </div>
            </div>
            </div>
        `;

        document.body.appendChild(this.modal);

        requestAnimationFrame(() => {
            this.modal.classList.add('show');
        });

        this.attachCommentsModalEvents(photoId);
    }

    attachCommentsModalEvents(photoId) {
        const addCommentBtn = document.getElementById('addCommentBtn');
        const commentTextarea = document.getElementById('commentTextarea');
        const closeBtn = this.modal.querySelector('.modal-close');

        if (addCommentBtn && commentTextarea) {
            addCommentBtn.addEventListener('click', () => {
                const content = commentTextarea.value.trim();
                if (content) {
                    const addEvent = new CustomEvent('comment:add', {
                        detail: { photoId, content }
                    });
                    document.dispatchEvent(addEvent);
                }
            });

            commentTextarea.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'Enter') {
                    addCommentBtn.click();
                }
            });
        }

        closeBtn.addEventListener('click', () => {
            this.hideModal();
        });

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) { 
                this.hideModal();
            }
        });

        const modalDialog = this.modal.querySelector('.modal-dialog');
        modalDialog.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                this.hideModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    renderComments(comments) {
        this.hideLoading();
        
        const commentsList = document.getElementById('commentsList');
        if (!commentsList) return;

        if (!comments || comments.length === 0) {
            commentsList.innerHTML = `
                <div class="comment-empty">
                    <i class="fas fa-comments fa-3x mb-3"></i>
                    <h5>Aucun commentaire</h5>
                </div>
            `;
            return;
        }

        commentsList.innerHTML = comments.map(comment => this.getCommentHTML(comment)).join('');
        this.attachCommentEvents();
    }

    getCommentHTML(comment) {
        const currentUser = window.app?.getCurrentUser();
        const isOwner = currentUser && (currentUser.id == comment.user_id || currentUser.user?.id == comment.user_id);
        
        return `
            <div class="comment-item" data-comment-id="${comment.id}">
                <div class="comment-avatar">
                    ${this.getUserInitials(comment.user_name || comment.author_name || 'U')}
                </div>
                <div class="comment-content">
                    <div class="comment-header">
                        <span class="comment-author">${this.escapeHtml(comment.user_name || comment.author_name || 'Utilisateur')}</span>
                        <span class="comment-date">${this.formatDate(comment.created_at)}</span>
                    </div>
                    <div class="comment-text" id="commentText-${comment.id}">
                        ${this.escapeHtml(comment.content)}
                    </div>
                    <div class="comment-actions">
                        ${isOwner ? `
                            <button class="comment-action" data-action="edit" data-comment-id="${comment.id}">
                                <i class="fas fa-edit me-1"></i>Modifier
                            </button>
                            <button class="comment-action" data-action="delete" data-comment-id="${comment.id}">
                                <i class="fas fa-trash me-1"></i>Supprimer
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    attachCommentEvents() {
        const commentActions = document.querySelectorAll('.comment-action');
        
        commentActions.forEach(action => {
            action.addEventListener('click', (e) => {
                const actionType = action.dataset.action;
                const commentId = action.dataset.commentId;
                
                switch (actionType) {
                    case 'edit':
                        this.showEditForm(commentId);
                        break;
                    case 'delete':
                        const deleteEvent = new CustomEvent('comment:delete', {
                            detail: { id: commentId }
                        });
                        document.dispatchEvent(deleteEvent);
                        break;
                }
            });
        });
    }

    showEditForm(commentId) {
        const commentItem = document.querySelector(`[data-comment-id="${commentId}"]`);
        const commentText = document.getElementById(`commentText-${commentId}`);
        
        if (!commentItem || !commentText) return;

        const currentText = commentText.textContent;
        
        const editForm = document.createElement('div');
        editForm.className = 'comment-edit-form';
        editForm.innerHTML = `
            <textarea id="editTextarea-${commentId}" rows="3">${this.escapeHtml(currentText)}</textarea>
            <div class="comment-edit-actions">
                <button class="comment-edit-cancel" data-comment-id="${commentId}">Annuler</button>
                <button class="comment-edit-save" data-comment-id="${commentId}">Sauvegarder</button>
            </div>
        `;

        commentText.style.display = 'none';
        commentText.parentNode.insertBefore(editForm, commentText.nextSibling);

        const cancelBtn = editForm.querySelector('.comment-edit-cancel');
        const saveBtn = editForm.querySelector('.comment-edit-save');
        const textarea = editForm.querySelector('textarea');

        cancelBtn.addEventListener('click', () => {
            editForm.remove();
            commentText.style.display = 'block';
        });

        saveBtn.addEventListener('click', () => {
            const newContent = textarea.value.trim();
            if (newContent && newContent !== currentText) {
                const updateEvent = new CustomEvent('comment:update', {
                    detail: { id: commentId, content: newContent }
                });
                document.dispatchEvent(updateEvent);
            } else {
                editForm.remove();
                commentText.style.display = 'block';
            }
        });

        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    }

    clearCommentForm() {
        const commentTextarea = document.getElementById('commentTextarea');
        if (commentTextarea) {
            commentTextarea.value = '';
        }
    }

    hideModal() {
        if (this.modal) {
            this.modal.classList.remove('show');
            setTimeout(() => {
                if (this.modal && this.modal.parentNode) {
                    this.modal.remove();
                }
                this.modal = null;
            }, 300);
        }
    }

    showLoading() {
        const commentsList = document.getElementById('commentsList');
        if (commentsList) {
            commentsList.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <span>Chargement des commentaires...</span>
                </div>
            `;
        }
    }

    hideLoading() {
    }

    getUserInitials(name) {
        return name.split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) {
            return 'À l\'instant';
        }

        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
        }

        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
        }

        if (diff < 604800000) {
            const days = Math.floor(diff / 86400000);
            return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
        }

        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}