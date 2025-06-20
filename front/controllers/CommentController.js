/**
 * Contrôleur pour la gestion des commentaires
 * Gère l'affichage, l'ajout, la modification et la suppression des commentaires
 */
class CommentController {
    constructor() {
        this.view = new CommentView();
        this.comments = [];
        this.currentPhotoId = null;
        this.$permission = false;
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('comment:showModal', (event) => {
            this.showCommentsModal(event.detail.photoId);
        });

        document.addEventListener('comment:add', (event) => {
            this.addComment(event.detail.photoId, event.detail.content);
        });

        document.addEventListener('comment:update', (event) => {
            this.updateComment(event.detail.id, event.detail.content);
        });

        document.addEventListener('comment:delete', (event) => {
            this.deleteComment(event.detail.id);
        });

        document.addEventListener('comment:load', (event) => {
            this.loadComments(event.detail.photoId);
        });
    }

    // Charge tous les commentaires d'une photo 
    async loadComments(photoId) {
        try {
            this.view.showLoading();

            const response = await fetch(`${window.app.config.API_URL}/photos/${photoId}/comments`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
            const data = await response.json();

            if (response.ok) {
                this.comments = data.comments || [];
                this.currentPhotoId = photoId;
                this.view.renderComments(this.comments);
            } else {
                throw new Error(data.error || 'Erreur lors du chargement des commentaires');
            }
        } catch (error) {
            console.error('Erreur chargement commentaires:', error);
            showNotification('Impossible de charger les commentaires', 'error');
        }
    }

    // Ajoute un nouveau commentaire 
    async addComment(photoId, content) {
        if (!content || !content.trim()) {
            showNotification('Le commentaire ne peut pas être vide', 'error');
            return;
        }

        try {
            this.view.showLoading();

            const response = await fetch(`${window.app.config.API_URL}/photos/${photoId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ content: content.trim() })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showNotification('Commentaire ajouté !', 'success');
                this.view.clearCommentForm();
                this.loadComments(photoId);
            } else {
                throw new Error(data.error || 'Erreur lors de l\'ajout du commentaire');
                this.loadComments(photoId);
            }
        } catch (error) {
            console.error('Erreur ajout commentaire:', error);
            showNotification(error.message, 'error');
        }
    }

    // Modifie un commentaire
    async updateComment(commentId, content) {
        if (!content || !content.trim()) {
            showNotification('Le commentaire ne peut pas être vide', 'error');
            return;
        }

        try {
            const response = await fetch(`${window.app.config.API_URL}/comments/${commentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ content: content.trim() })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showNotification('Commentaire mis à jour !', 'success');
                if (this.currentPhotoId) {
                    this.loadComments(this.currentPhotoId);
                }
            } else {
                throw new Error(data.error || 'Erreur lors de la mise à jour');
            }
        } catch (error) {
            console.error('Erreur mise à jour commentaire:', error);
            showNotification(error.message, 'error');
        }
    }

    // Vérifie le droit de commenter
    async getPermissions(photoId) {
    try {
        const response = await fetch(`${window.app.config.API_URL}/comment-permission/${photoId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include' 
        });

        const data = await response.json();

        if (response.ok) {
            return data.allowed === true;
        } else {
            console.log(`Permission refusée pour photo ${photoId}: ${data.error || 'Erreur inconnue'}`);
            return false;
        }
    } catch (error) {
        console.error('Erreur récupération permissions commentaire:', error);
        return false;
    }
    }

    // Supprime un commentaire 
    async deleteComment(commentId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) {
            return;
        }

        try {
            const response = await fetch(`${window.app.config.API_URL}/comments/${commentId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showNotification('Commentaire supprimé !', 'success');
                if (this.currentPhotoId) {
                    this.loadComments(this.currentPhotoId);
                }
            } else {
                throw new Error(data.error || 'Erreur lors de la suppression');
            }
        } catch (error) {
            console.error('Erreur suppression commentaire:', error);
            showNotification(error.message, 'error');
        }
    }

    // Affiche la modal des commentaires 
    async showCommentsModal(photoId) {
        this.currentPhotoId = photoId;
        this.permission = await this.getPermissions(this.currentPhotoId);
        this.view.showCommentsModal(photoId, this.permission);
        this.loadComments(photoId);
    }
}