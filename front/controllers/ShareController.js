/**
 * Contrôleur pour la gestion du partage d'albums
 * Gère le partage par email et les albums partagés
 */
class ShareController {
    constructor() {
        this.view = new ShareView();
        this.sharedAlbums = [];
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('sharedAlbum:show', (event) => {
            this.showSharedAlbum(event.detail.id);
        });

        document.addEventListener('share:byEmail', (event) => {
            this.shareByEmail(event.detail.albumId, event.detail.email, event.detail.permission);
        });

        document.addEventListener('share:revoke', (event) => {
        this.revokeShare(event.detail.albumId, event.detail.userId);
        });

        document.addEventListener('share:loadSharedAlbums', () => {
            this.loadSharedAlbums();
        });

    }

    // Partage un album avec un autre utilisateur
    async shareByEmail(albumId, email, permission) {
        if (!email || !email.trim()) {
            showNotification('Veuillez saisir une adresse email', 'error');
            return;
        }

        if (!this.isValidEmail(email)) {
            showNotification('Format d\'email invalide', 'error');
            return;
        }

        try {
            this.view.showLoading();

            const response = await fetch(`${window.app.config.API_URL}/shared/${albumId}/share`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    email: email.trim(),
                    permission: permission || 'view'
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showNotification(`Album partagé avec ${email} !`, 'success');
                this.view.clearEmailForm();
            } else {
                throw new Error(data.error || 'Erreur lors du partage');
            }
        } catch (error) {
            console.error('Erreur partage email:', error);
            showNotification(error.message, 'error');
        } finally {
            this.view.hideLoading();
        }
    }

    // Révoque un partage spécifique
    async revokeShare(albumId, userId) {
        try {
            const response = await fetch(`${window.app.config.API_URL}/shared/${albumId}/shares/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showNotification('Partage supprimé !', 'success');
                
                if (window.app?.controllers?.album?.view?.showShareModal) {
                    setTimeout(() => {
                        window.app.controllers.album.view.showShareModal(albumId);
                    }, 1000);
                }
            } else {
                throw new Error(data.error || 'Erreur lors de la suppression du partage');
            }
        } catch (error) {
            console.error('Erreur lors de la révocation du partage:', error);
            showNotification(error.message || 'Erreur lors de la suppression du partage', 'error');
            }
        }

    // Charge tous les albums partagés avec l'utilisateur
    async loadSharedAlbums() {
        try {
            this.view.showLoading();

            const response = await fetch(`${window.app.config.API_URL}/shared`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });
            const data = await response.json();

            if (response.ok) {
                this.sharedAlbums = data.albums || [];
                this.view.renderSharedAlbums(this.sharedAlbums);
            } else {
                throw new Error(data.error || 'Erreur lors du chargement des albums partagés');
            }
        } catch (error) {
            console.error('Erreur chargement albums partagés:', error);
            showNotification('Impossible de charger les albums partagés', 'error');
        }
    }

    // Affiche un album partagé en utilisant le contrôleur d'albums
    async showSharedAlbum(albumId) {
        try {
            this.view.showLoading();
            
            let album = this.sharedAlbums.find(a => a.id == albumId);
            
            if (!album) {
                const response = await fetch(`${window.app.config.API_URL}/shared/album/${albumId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include'
                });
                
                if (response.ok) {
                    const data = await response.json();
                    album = data.album;
                } else {
                    throw new Error('Album partagé non trouvé');
                }
            }
            
            if (window.app?.controllers?.album?.showAlbum) {
                window.app.controllers.album.showAlbum(albumId);
            } else {
                throw new Error('Impossible d\'afficher l\'album');
            }
            
        } catch (error) {
            console.error('Erreur affichage album partagé:', error);
            showNotification('Impossible d\'afficher l\'album partagé', 'error');
        } finally {
            this.view.hideLoading();
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    getSharedAlbums() {
        return this.sharedAlbums;
    }

    copyLinkToClipboard(link) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(link).then(() => {
                showNotification('Lien copié dans le presse-papiers !', 'success');
            }).catch(() => {
                showNotification('Impossible de copier le lien', 'error');
            });
        } 
    }
}