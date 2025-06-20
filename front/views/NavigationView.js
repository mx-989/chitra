/**
 * Vue pour l'interface de navigation principale, la Timeline et la section Explorer
 */
class NavigationView {
    constructor() {
        this.mainContent = null;
        this.currentSection = 'timeline';
        this.statsController = new StatsController();
        this.notificationView = new NotificationView();
        this.stats = {
            photos: 0,
            albums: 0,
            favorites: 0,
            storage: '0 B'
            
        };
    }
    
    // S'occupe de l'affichage de la vue principale
    renderMainLayout() {
        document.body.innerHTML = '';
        document.body.className = 'authenticated';

        document.body.innerHTML = `
            ${this.getSidebarHTML()}
            <div class="main-content">
                ${this.getTopNavHTML()}
                <div class="content-area" id="contentArea">
                    <!-- Le contenu sera injecté ici -->
                </div>
            </div>
        `;

        this.mainContent = document.querySelector('.main-content');
        this.contentArea = document.getElementById('contentArea');
        
        this.initializeNavigation();
    }

    // Génère le HTML pour la barre latérale
    getSidebarHTML() {
        const user = window.app ? window.app.getCurrentUser() : null;
        
        return `
            <nav class="sidebar d-flex flex-column h-100">
            <div class="p-3 border-bottom border-chitra">
                <h4 class="text-white mb-0">
                <img src="chitra_logo.png" alt="Chitra Logo" class="me-2" style="height: 100px;">
                <span class="logo-accent">Chitra</span>
                </h4>
            </div>
            <ul class="nav flex-column">
                <li class="nav-item">
                <a class="nav-link ${this.currentSection === 'timeline' ? 'active' : ''}" href="#" data-section="timeline">
                    <i class="fas fa-clock"></i>
                    Timeline
                </a>
                </li>
                <li class="nav-item">
                <a class="nav-link ${this.currentSection === 'albums' ? 'active' : ''}" href="#" data-section="albums">
                    <i class="fas fa-images"></i>
                    Mes Albums
                </a>
                </li>
                <li class="nav-item">
                <a class="nav-link ${this.currentSection === 'favorites' ? 'active' : ''}" href="#" data-section="favorites">
                    <i class="fas fa-heart"></i>
                    Favoris
                </a>
                </li>
                <li class="nav-item">
                <a class="nav-link ${this.currentSection === 'shared' ? 'active' : ''}" href="#" data-section="shared">
                    <i class="fas fa-users"></i>
                    Albums Partagés
                </a>
                </li>
                <li class="nav-item">
                <a class="nav-link ${this.currentSection === 'explore' ? 'active' : ''}" href="#" data-section="explore">
                    <i class="fas fa-search"></i>
                    Explorer
                </a>
                </li>
            </ul>
            <div class="user-profile-container mt-auto p-3 border-top border-chitra">
                <div class="d-flex align-items-center text-light">
                <div class="user-avatar me-2" title="Menu utilisateur">
                    ${user ? this.getUserInitials(user.user?.name || user.name || 'U') : 'U'}
                </div>
                <div>
                    <div class="fw-semibold">${user ? (user.user?.name || user.name || 'Utilisateur') : 'Utilisateur'}</div>
                    <small class="text-muted-chitra">${user ? (user.user?.email || user.email || '') : ''}</small>
                </div>
                </div>
            </div>
            </nav>
        `;
    }

    initializeNavigation() {
        const navLinks = document.querySelectorAll('.nav-link[data-section]');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                this.navigateToSection(section);
            });
        });

        const profileBtn = document.getElementById('profileBtn');
        if (profileBtn) {
            profileBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const section = profileBtn.getAttribute('data-section');
                this.navigateToSection(section);
            });
        }

        const logoutBtn = document.getElementById('logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }
    }

    async handleLogout() {
        const confirmLogout = confirm('Êtes-vous sûr de vouloir vous déconnecter ?');
        
        if (!confirmLogout) {
            return;
        }

        try {
            const response = await fetch(`${window.app.config.API_URL}/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (response.ok) {
                const logoutEvent = new CustomEvent('user:logout');
                document.dispatchEvent(logoutEvent);
            } else {
                console.error('Erreur lors de la déconnexion');
                const logoutEvent = new CustomEvent('user:logout');
                document.dispatchEvent(logoutEvent);
            }
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
            const logoutEvent = new CustomEvent('user:logout');
            document.dispatchEvent(logoutEvent);
        }
    }

    navigateToSection(section) {
        this.currentSection = section;
        this.updateActiveNavigation();
        
        switch(section) {
            case 'timeline':
                this.showTimelineSection();
                break;
            case 'albums':
                this.showAlbumsSection();
                break;
            case 'favorites':
                this.showFavoritesSection();
                break;
            case 'shared':
                this.showSharedSection();
                break;
            case 'explore':
                this.showExploreSection();
                break;
            case 'profile':               
                this.showProfileSection();
                break;
            default:
                this.showTimelineSection();
        }
    }

    updateActiveNavigation() {
        const navLinks = document.querySelectorAll('.nav-link[data-section]');
        navLinks.forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[data-section="${this.currentSection}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    // Génère le HTML pour la barre supérieure
    getTopNavHTML() {
        return `
            <div class="top-nav">
                <div class="d-flex align-items-center">
                    <button class="btn btn-outline-secondary d-md-none me-2 btn-outline-chitra" id="sidebarToggle">
                        <i class="fas fa-bars"></i>
                    </button>
                </div>
                
                <div class="search-bar">
                    <div class="input-group">
                        <span class="input-group-text input-chitra">
                            <i class="fas fa-search"></i>
                        </span>
                        <input type="text" class="form-control input-chitra" placeholder="Rechercher des photos...">
                    </div>
                </div>

                <div class="d-flex align-items-center gap-3">
                    <button class="profile-btn" id="profileBtn" title="Profil" data-section="profile">
                        <i class="fas fa-user"></i>
                        <span class="btn-text ms-1">Mon Profil</span>
                    </button>
                    
                    <button class="btn btn-outline-chitra" id="logout" title="Déconnexion">
                        <i class="fas fa-sign-out-alt"></i>
                        <span class="btn-text ms-1">Déconnexion</span>
                    </button>
                </div>
            </div>
        `;
    }

    getUserInitials(name) {
        return name.split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }

    
    updateUserInfo(user) {
        const userAvatar = document.querySelector('.user-avatar');
        const userName = document.querySelector('.fw-semibold');
        const userEmail = document.querySelector('.text-muted-chitra');

        if (userAvatar && user) {
            userAvatar.textContent = this.getUserInitials(user.name || 'U');
        }

        if (userName && user) {
            userName.textContent = user.name || 'Utilisateur';
        }

        if (userEmail && user) {
            userEmail.textContent = user.email || '';
        }
    }

    async loadAllStats() {
        try {
            this.stats = await this.statsController.getUserStats();
            this.updateStatsDisplay();
        } catch (error) {
            console.error('Erreur lors du chargement des statistiques:', error);
            this.updateStatsDisplay();
        }
    }

    updateStatsDisplay() {
        const photosCount = document.getElementById('photosCount');
        const albumsCount = document.getElementById('albumsCount');
        const favoritesCount = document.getElementById('favoritesCount');
        const storageUsed = document.getElementById('storageUsed');

        if (photosCount) photosCount.textContent = this.stats.photos;
        if (albumsCount) albumsCount.textContent = this.stats.albums;
        if (favoritesCount) favoritesCount.textContent = this.stats.favorites;
        if (storageUsed) storageUsed.textContent = this.stats.storage;
    }

    async loadTimelinePhotos() {
    try {
        const response = await fetch(`${window.app.config.API_URL}/photos`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            const allPhotos = data.photos || [];

            allPhotos.sort((a, b) => {
                const dateA = new Date(a.date_taken || a.created_at);
                const dateB = new Date(b.date_taken || b.created_at);
                return dateB - dateA;
            });

            this.renderTimelinePhotos(allPhotos);
        } else {
            this.showTimelineError();
        }

    } catch (error) {
        console.error('Erreur chargement timeline:', error);
        this.showTimelineError();
    }
}

renderTimelinePhotos(photos) {
    const timelineContent = document.getElementById('timelineContent');
    if (!timelineContent) return;
    
    if (!photos || photos.length === 0) {
        timelineContent.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-images fa-4x text-muted-chitra mb-3"></i>
                <h4>Aucune photo</h4>
                <p class="text-muted-chitra">Importez vos premières photos ou consultez les albums partagés</p>
            </div>
        `;
        return;
    }
    
    const photosByDate = this.groupPhotosByDate(photos);
   
    let html = '';
    for (const [date, datePhotos] of Object.entries(photosByDate)) {
        html += `
            <div class="timeline-date-section">
                <div class="date-separator">
                    <h6 class="date-title">${this.formatTimelineDate(date)}</h6>
                    <div class="date-line"></div>
                </div>
                <div class="photo-grid">
                    ${datePhotos.map(photo => this.getTimelinePhotoHTML(photo)).join('')}
                </div>
            </div>
        `;
    }
    
    timelineContent.innerHTML = html;
    this.attachTimelinePhotoEvents(photos); 
    this.loadTimelineFavorites();
}

async loadTimelineFavorites() {
    try {
        const response = await fetch(`${window.app.config.API_URL}/favorites`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            const favoriteIds = new Set((data.favorites || []).map(f => f.id || f.photo_id));
            
            favoriteIds.forEach(photoId => {
                this.updateFavoriteButton(photoId, true);
            });
        }
    } catch (error) {
        console.error('Erreur chargement favoris timeline:', error);
    }
}

groupPhotosByDate(photos) {
    const groups = {};
    
    photos.forEach(photo => {
        const photoDate = new Date(photo.date_taken || photo.created_at);
        const dateKey = photoDate.toDateString();
        
        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }
        groups[dateKey].push(photo);
    });

    const sortedGroups = Object.keys(groups)
        .sort((a, b) => new Date(b) - new Date(a))
        .reduce((acc, key) => {
            acc[key] = groups[key];
            return acc;
        }, {});

    return sortedGroups;
}

formatTimelineDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Aujourd\'hui';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Hier';
    } else {
        return date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

formatPhotoTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

attachTimelinePhotoEvents(photos) {
    const photoItems = document.querySelectorAll('.photo-item');
    
    photoItems.forEach(item => {
        const photoId = item.dataset.photoId;
        const photoData = photos.find(p => p.id == photoId);

        item.addEventListener('click', (e) => {
            if (!e.target.closest('.photo-action')) {
                this.showPhotoModal(photoData);
            }
        });

        const actions = item.querySelectorAll('.photo-action');
        actions.forEach(action => {
            action.addEventListener('click', (e) => {
                e.stopPropagation();
                const actionType = action.dataset.action;
                this.handlePhotoAction(photoData, actionType, action);
            });
        });
    });
}

getTimelinePhotoHTML(photo) {
    const photoUrl = `/uploads/photos/${photo.filename}`;
    const isFavorite = photo.is_favorite || false;
    
    const currentUserId = window.app?.currentUser?.id || window.app?.currentUser?.user?.id;
    const showDelete = photo.uploaded_by === currentUserId;
    
    return `
        <div class="photo-item favorite-photo-item" data-photo-id="${photo.id}">
            <div class="favorite-photo-cover">
                <img src="${photoUrl}" alt="${this.escapeHtml(photo.filename)}" loading="lazy">
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
        </div>
    `;
}

async showTimelineSection() {
    this.contentArea.innerHTML = `
        <div id="timeline-section" class="content-section">
            <div class="stats-container">
                <div class="stats-card" data-tooltip="(Seulement vos uploads)">
                    <div class="stats-icon photos">
                        <i class="fas fa-images"></i>
                    </div>
                    <div class="stats-number" id="photosCount">${this.stats.photos}</div>
                    <div class="stats-label">Photos</div>
                </div>
                
                <div class="stats-card" data-tooltip="(Seulement vos albums)">
                    <div class="stats-icon albums">
                        <i class="fas fa-folder"></i>
                    </div>
                    <div class="stats-number" id="albumsCount">${this.stats.albums}</div>
                    <div class="stats-label">Albums</div>
                </div>
                
                <div class="stats-card">
                    <div class="stats-icon favorites">
                        <i class="fas fa-heart"></i>
                    </div>
                    <div class="stats-number" id="favoritesCount">${this.stats.favorites}</div>
                    <div class="stats-label">Favoris</div>
                </div>
                
                <div class="stats-card" data-tooltip="(Seulement vos uploads)">
                    <div class="stats-icon storage">
                        <i class="fas fa-hdd"></i>
                    </div>
                    <div class="stats-number" id="storageUsed">${this.stats.storage}</div>
                    <div class="stats-label">Stockage</div>
                </div>
            </div>

            <div id="timelineContent">
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <span>Chargement des photos...</span>
                </div>
            </div>
        </div>
    `;

    this.loadAllStats();
    this.loadTimelinePhotos();
}

    showAlbumsSection() {
        this.contentArea.innerHTML = `
            <div id="albums-section" class="content-section">
                <div class="section-header">
                    <h3>Mes Albums</h3>
                    <button class="btn btn-primary" id="createAlbumBtn">
                        <i class="fas fa-plus me-2"></i>
                        Créer un album
                    </button>
                </div>
                
                <div id="albumsGrid" class="albums-grid">
                    <div class="loading-spinner">
                        <div class="spinner"></div>
                        <span>Chargement des albums...</span>
                    </div>
                </div>
            </div>
        `;
    }

    showFavoritesSection() {
        this.contentArea.innerHTML = `
            <div id="favorites-section" class="content-section">
                <div class="section-header">
                    <h3>Mes Photos Favorites</h3>
                </div>
                
                <div id="favoritesGrid" class="photo-grid">
                    <div class="loading-spinner">
                        <div class="spinner"></div>
                        <span>Chargement des favoris...</span>
                    </div>
                </div>
            </div>
        `;
    }

    showSharedSection() {
        this.contentArea.innerHTML = `
            <div id="shared-section" class="content-section">
                <div class="section-header">
                    <h3>Albums Partagés</h3>
                </div>
                
                <div id="sharedGrid" class="albums-grid">
                    <div class="loading-spinner">
                        <div class="spinner"></div>
                        <span>Chargement des albums partagés...</span>
                    </div>
                </div>
            </div>
        `;
    }

    showExploreSection() {
        this.contentArea.innerHTML = `
            <div id="explore-section" class="content-section">
                <div class="section-header">
                    <h3>Explorer</h3>
                </div>
                
                <div class="explore-content">
                    <div class="search-filters">
                        <div class="filter-group">
                            <label>Tags (séparés par une virgule)</label>
                            <input type="text" class="form-control input-chitra" placeholder="Ex: vacances, famille..." id="tagsFilter">
                        </div>
                        
                        <div class="filter-group">
                            <label>Album</label>
                            <select class="form-control input-chitra" id="albumFilter">
                                <option value="">Tous les albums</option>
                            </select>
                        </div>
                        
                        <div class="filter-group">
                            <label>Date de début</label>
                            <input type="date" class="form-control" id="dateFromFilter">
                        </div>
                        
                        <div class="filter-group">
                            <label>Date de fin</label>
                            <input type="date" class="form-control" id="dateToFilter">
                        </div>
                    </div>
                    
                    <div id="exploreResults" class="photo-grid">
                        <div class="explore-placeholder">
                            <i class="fas fa-search fa-3x text-muted-chitra mb-3"></i>
                            <h5>Utilisez les filtres ci-dessus pour rechercher vos photos</h5>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.loadAlbumsForFilter();
    }

    async loadAlbumsForFilter() {
        try {
            const albumsResponse = await fetch(`${window.app.config.API_URL}/albums`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            let allAlbums = [];

            if (albumsResponse.ok) {
                const albumsData = await albumsResponse.json();
                const personalAlbums = (albumsData.albums || []).map(album => ({
                    ...album,
                    displayTitle: album.title
                }));
                allAlbums = [...personalAlbums];
            }

            const sharedResponse = await fetch(`${window.app.config.API_URL}/shared/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (sharedResponse.ok) {
                const sharedData = await sharedResponse.json();
                const sharedAlbums = (sharedData.albums || []).map(album => ({
                    ...album,
                    displayTitle: album.title
                }));
                allAlbums = [...allAlbums, ...sharedAlbums];
            }

            this.populateAlbumsFilter(allAlbums);
        } catch (error) {
            console.error('Erreur chargement albums pour filtre:', error);
        }

        this.initializeExploreEvents();
    }

    populateAlbumsFilter(albums) {
        const albumFilter = document.getElementById('albumFilter');
        if (!albumFilter) return;

        albumFilter.innerHTML = '<option value="">Tous les albums</option>';

        albums.forEach(album => {
            const option = document.createElement('option');
            option.value = album.id;
            if (album.owner_name || album.owner_email) {
                option.textContent = `${album.title} (partagé par ${album.owner_name || album.owner_email})`;
            } else {
                option.textContent = album.title;
            }
            albumFilter.appendChild(option);
        });
    }

    initializeExploreEvents() {
        const tagsFilter = document.getElementById('tagsFilter');
        const albumFilter = document.getElementById('albumFilter');
        const dateFromFilter = document.getElementById('dateFromFilter');
        const dateToFilter = document.getElementById('dateToFilter');

        if (tagsFilter) {
            let searchTimeout;
            tagsFilter.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.performExploreSearch();
                }, 500);
            });

            tagsFilter.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.performExploreSearch();
                }
            });
        }

        if (albumFilter) {
            albumFilter.addEventListener('change', () => {
                this.performExploreSearch();
            });
        }

        if (dateFromFilter) {
            dateFromFilter.addEventListener('change', () => {
                this.performExploreSearch();
            });
        }

        if (dateToFilter) {
            dateToFilter.addEventListener('change', () => {
                this.performExploreSearch();
            });
        }
    }

    performExploreSearch() {
        const tagsFilter = document.getElementById('tagsFilter');
        const albumFilter = document.getElementById('albumFilter');
        const dateFromFilter = document.getElementById('dateFromFilter');
        const dateToFilter = document.getElementById('dateToFilter');
        const resultsContainer = document.getElementById('exploreResults');

        if (!resultsContainer) return;

        const tags = tagsFilter ? tagsFilter.value.trim() : '';
        const albumId = albumFilter ? albumFilter.value : '';
        const dateFrom = dateFromFilter ? dateFromFilter.value : '';
        const dateTo = dateToFilter ? dateToFilter.value : '';

        if (!tags && !albumId && !dateFrom && !dateTo) {
            resultsContainer.innerHTML = `
                <div class="explore-placeholder">
                    <i class="fas fa-search fa-3x text-muted-chitra mb-3"></i>
                    <h5>Utilisez les filtres ci-dessus pour rechercher vos photos</h5>
                </div>
            `;
            return;
        }

        resultsContainer.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <span>Recherche en cours...</span>
            </div>
        `;

        const searchCriteria = {
            tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
            albumId: albumId || null,
            dateFrom: dateFrom || null,
            dateTo: dateTo || null
        };

        const searchEvent = new CustomEvent('photo:advancedSearch', {
            detail: searchCriteria
        });
        document.dispatchEvent(searchEvent);
    }

    showExploreMessage(message, type = 'info') {
        const resultsContainer = document.getElementById('exploreResults');
        if (!resultsContainer) return;

        const iconClass = type === 'warning' ? 'fa-exclamation-triangle' : 
                         type === 'error' ? 'fa-times-circle' : 'fa-info-circle';
        
        resultsContainer.innerHTML = `
            <div class="explore-message">
                <i class="fas ${iconClass} fa-2x text-muted-chitra mb-3"></i>
                <p>${message}</p>
            </div>
        `;
    }

    displayExploreResults(photos) {
        const resultsContainer = document.getElementById('exploreResults');
        if (!resultsContainer) return;

        if (!photos || photos.length === 0) {
            resultsContainer.innerHTML = `
                <div class="explore-message">
                    <i class="fas fa-images fa-3x text-muted-chitra mb-3"></i>
                    <h5>Aucune photo trouvée</h5>
                </div>
            `;
            return;
        }

        resultsContainer.innerHTML = photos.map(photo => this.getExplorePhotoHTML(photo)).join('');
        this.attachPhotoEvents(photos);
        
        requestAnimationFrame(() => {
            this.loadFavoriteStates(photos);
        });
    }

    getExplorePhotoHTML(photo) {
        const photoUrl = `/uploads/photos/${photo.filename}`;
        const isFavorite = photo.is_favorite || false;
        
        const currentUserId = window.app?.currentUser?.id || window.app?.currentUser?.user?.id;
        const showDelete = photo.uploaded_by === currentUserId;
        
        return `
            <div class="photo-item" data-photo-id="${photo.id}">
                <div class="photo-cover">
                    <img src="${photoUrl}" alt="${this.escapeHtml(photo.filename)}" loading="lazy">
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
            </div>
        `;
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    attachPhotoEvents(photos) {
        const photoItems = document.querySelectorAll('.photo-item');
        
        photoItems.forEach(item => {
            const photoId = item.dataset.photoId;
            const photoData = photos.find(p => p.id == photoId);

            item.addEventListener('click', (e) => {
                if (!e.target.closest('.photo-action')) {
                    this.showPhotoModal(photoData);
                }
            });

            const actions = item.querySelectorAll('.photo-action');
            actions.forEach(action => {
                action.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const actionType = action.dataset.action;
                    this.handlePhotoAction(photoData, actionType, action);
                });
            });
        });
    }

    handlePhotoAction(photoData, action, button) {
        switch (action) {
            case 'favorite':
                const favoriteEvent = new CustomEvent('favorite:toggle', {
                    detail: { photoId: photoData.id }
                });
                document.dispatchEvent(favoriteEvent);
                break;
                
            case 'share':
                this.showShareModal(photoData);
                break;
                
            case 'comment':
                this.showCommentsModal(photoData);
                break;
                
            case 'delete':
                const deleteEvent = new CustomEvent('photo:delete', {
                    detail: { id: photoData.id }
                });
                document.dispatchEvent(deleteEvent);
                break;
        }
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

    showPhotoModal(photoData) {
    
    if (!photoData || !window.app?.controllers?.photo) return;
    
    const photo = {
        id: photoData.id,
        url: `/uploads/photos/${photoData.filename}`,
        filename: photoData.filename,
        description: photoData.description || '',
        created_at: photoData.created_at,
        date_taken: photoData.date_taken || photoData.created_at,
        uploaded_by: photoData.uploaded_by,
        uploader_name: photoData.uploader_name || photoData.uploaded_by_name || photoData.owner_name || photoData.user_name || 'Utilisateur inconnu',
        tags: photoData.tags || [],
        album_title: photoData.album_title
    };
    
    
    if (!window.app.controllers.photo.photos) {
        window.app.controllers.photo.photos = [];
    }
    
    const existingIndex = window.app.controllers.photo.photos.findIndex(p => p.id == photoData.id);
    if (existingIndex !== -1) {
        window.app.controllers.photo.photos[existingIndex] = photo;
    } else {
        window.app.controllers.photo.photos.push(photo);
    }
    
    window.app.controllers.photo.view.showPhotoModal(photoData.id);
}

    showShareModal(photoData) {
        if (!photoData || !window.app?.controllers?.photo) return;
        
        const photo = {
            id: photoData.id,
            url: `/uploads/photos/${photoData.filename}`,
            filename: photoData.filename,
            description: photoData.description || 'Photo',
            uploader_name: photoData.uploader_name || 'Utilisateur inconnu'
        };
        
        if (!window.app.controllers.photo.photos) {
            window.app.controllers.photo.photos = [];
        }
        
        const existingIndex = window.app.controllers.photo.photos.findIndex(p => p.id == photoData.id);
        if (existingIndex !== -1) {
            window.app.controllers.photo.photos[existingIndex] = photo;
        } else {
            window.app.controllers.photo.photos.push(photo);
        }
        
        window.app.controllers.photo.view.showShareModal(photoData.id);
    }

    showCommentsModal(photoData) {
        if (!photoData || !window.app?.controllers?.photo) return;
        
        const photo = {
            id: photoData.id,
            url: `/uploads/photos/${photoData.filename}`,
            filename: photoData.filename,
            description: photoData.description || 'Photo',
            uploader_name: photoData.uploader_name || 'Utilisateur inconnu'
        };
        
        if (!window.app.controllers.photo.photos) {
            window.app.controllers.photo.photos = [];
        }
        
        const existingIndex = window.app.controllers.photo.photos.findIndex(p => p.id == photoData.id);
        if (existingIndex !== -1) {
            window.app.controllers.photo.photos[existingIndex] = photo;
        } else {
            window.app.controllers.photo.photos.push(photo);
        }
        
        window.app.controllers.photo.view.showCommentsModal(photoData.id);
    }

    showProfileSection() {
        const user = window.app ? window.app.getCurrentUser() : null;
        const userData = user?.user || user || {};
        
        this.contentArea.innerHTML = `
            <div id="profile-section" class="content-section" style="padding-top: 2rem;">
                <div class="section-header mb-4 text-center">
                    <h3>Mon Profil</h3>
                </div>
                
                <div class="profile-content">
                    <div class="container" style="max-width: 900px;">
                        <div class="row justify-content-center mb-4">
                            <div class="col-12">
                                <div class="card">
                                    <div class="card-header">
                                        <h5 class="mb-0">
                                            <i class="fas fa-user me-2"></i>
                                            Informations du compte
                                        </h5>
                                    </div>
                                    <div class="card-body">
                                        <div class="row align-items-center">
                                            <div class="col-md-2 text-center mb-3 mb-md-0">
                                                <div class="profile-photo-summary">
                                                    <div class="profile-initials-summary">
                                                        ${this.getUserInitials(userData.name || 'U')}
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-md-10">
                                                <div class="row">
                                                    <div class="col-md-6">
                                                        <strong>Nom :</strong> ${userData.name || 'Non défini'}
                                                    </div>
                                                    <div class="col-md-6">
                                                        <strong>Email :</strong> ${userData.email || 'Non défini'}
                                                    </div>
                                                </div>
                                                <div class="row mt-2">
                                                    <div class="col-12">
                                                        <small class="text-muted">Membre depuis le ${this.formatDate(userData.created_at)}</small>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="row justify-content-center mb-4">
                            <div class="col-12">
                                <div class="card">
                                    <div class="card-header">
                                        <h5 class="mb-0">
                                            <i class="fas fa-edit me-2"></i>
                                            Changer le nom
                                        </h5>
                                    </div>
                                    <div class="card-body">
                                        <div class="row align-items-end">
                                            <div class="col-md-8 mb-3 mb-md-0">
                                                <label for="newName" class="form-label">Nouveau nom</label>
                                                <input type="text" class="form-control input-chitra" id="newName" 
                                                       value="${userData.name || ''}" placeholder="Votre nouveau nom">
                                            </div>
                                            <div class="col-md-4 mb-3 mb-md-0">
                                                <button class="btn btn-primary w-100" id="changeNameBtn">
                                                    <i class="fas fa-save me-2"></i>
                                                    Modifier le nom
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="row justify-content-center mb-4">
                            <div class="col-12">
                                <div class="card">
                                    <div class="card-header">
                                        <h5 class="mb-0">
                                            <i class="fas fa-envelope me-2"></i>
                                            Changer l'email
                                        </h5>
                                    </div>
                                    <div class="card-body">
                                        <div class="row align-items-end">
                                            <div class="col-md-8 mb-3 mb-md-0">
                                                <label for="newEmail" class="form-label">Nouvel email</label>
                                                <input type="email" class="form-control input-chitra" id="newEmail" 
                                                       value="${userData.email || ''}" placeholder="votre.nouveau@email.com">
                                            </div>
                                            <div class="col-md-4 mb-3 mb-md-0">
                                                <button class="btn btn-primary w-100" id="changeEmailBtn">
                                                    <i class="fas fa-save me-2"></i>
                                                    Modifier l'email
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="row justify-content-center mb-4">
                            <div class="col-12">
                                <div class="card">
                                    <div class="card-header">
                                        <h5 class="mb-0">
                                            <i class="fas fa-lock me-2"></i>
                                            Changer le mot de passe
                                        </h5>
                                    </div>
                                    <div class="card-body">
                                        <div class="row mb-3">
                                            <div class="col-md-4 mb-3">
                                                <label for="currentPassword" class="form-label">Mot de passe actuel</label>
                                                <input type="password" class="form-control input-chitra" id="currentPassword" 
                                                       placeholder="Mot de passe actuel">
                                            </div>
                                            <div class="col-md-4 mb-3">
                                                <label for="newPassword" class="form-label">Nouveau mot de passe</label>
                                                <input type="password" class="form-control input-chitra" id="newPassword" 
                                                       placeholder="Nouveau mot de passe">
                                            </div>
                                            <div class="col-md-4 mb-3">
                                                <label for="confirmPassword" class="form-label">Confirmer le mot de passe</label>
                                                <input type="password" class="form-control input-chitra" id="confirmPassword" 
                                                       placeholder="Confirmer le mot de passe">
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-md-4 col-12">
                                                <button class="btn btn-warning w-100" id="changePasswordBtn">
                                                    <i class="fas fa-key me-2"></i>
                                                    Changer le mot de passe
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.initializeProfileEvents();
    }

    initializeProfileEvents() {
        const changeNameBtn = document.getElementById('changeNameBtn');
        const changeEmailBtn = document.getElementById('changeEmailBtn');
        const changePasswordBtn = document.getElementById('changePasswordBtn');
        
        if (changeNameBtn) {
            changeNameBtn.addEventListener('click', () => this.changeName());
        }
        
        if (changeEmailBtn) {
            changeEmailBtn.addEventListener('click', () => this.changeEmail());
        }
        
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', () => this.changePassword());
        }
    }

    async changeName() {
    const newName = document.getElementById('newName').value.trim();
    const user = window.app ? window.app.getCurrentUser() : null;
    const currentName = user?.user?.name || user?.name || '';

    if (!newName) {
        showNotification('Veuillez saisir un nom', 'error');
        return;
    }

    if (newName === currentName) {
        showNotification('Le nom est identique à l\'actuel', 'error');
        return;
    }

    try {
        const response = await fetch(`${window.app.config.API_URL}/profile/name`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: newName }),
            credentials: 'include'
        });

        if (response.ok) {
            if (window.app.currentUser) {
                if (window.app.currentUser.user) {
                    window.app.currentUser.user.name = newName;
                } else {
                    window.app.currentUser.name = newName;
                }
            }
            
            showNotification('Nom modifié avec succès', 'success');
            this.updateUserInfo(window.app.currentUser.user || window.app.currentUser);
            this.updateProfileDisplay();
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Erreur lors de la modification du nom');
        }
    } catch (error) {
        console.error('Erreur changement nom:', error);
        showNotification(error.message, 'error');
    }
}

    async changeEmail() {
    const newEmail = document.getElementById('newEmail').value.trim();
    const user = window.app ? window.app.getCurrentUser() : null;
    const currentEmail = user?.user?.email || user?.email || '';

    if (!newEmail) {
        showNotification('Veuillez saisir un email', 'error');
        return;
    }

    if (!this.isValidEmail(newEmail)) {
        showNotification('Veuillez saisir un email valide', 'error');
        return;
    }

    if (newEmail === currentEmail) {
        showNotification('L\'email est identique à l\'actuel', 'error');
        return;
    }

    try {
        const response = await fetch(`${window.app.config.API_URL}/profile/email`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: newEmail }),
            credentials: 'include'
        });

        if (response.ok) {
            if (window.app.currentUser) {
                if (window.app.currentUser.user) {
                    window.app.currentUser.user.email = newEmail;
                } else {
                    window.app.currentUser.email = newEmail;
                }
            }
            
            showNotification('Email modifié avec succès', 'success');
            this.updateUserInfo(window.app.currentUser.user || window.app.currentUser);
            this.updateProfileDisplay();
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Erreur lors de la modification de l\'email');
        }
    } catch (error) {
        console.error('Erreur changement email:', error);
        showNotification(error.message, 'error');
    }
}

    async changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!currentPassword || !newPassword || !confirmPassword) {
        showNotification('Veuillez remplir tous les champs', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showNotification('Les mots de passe ne correspondent pas', 'error');
        return;
    }

    try {
        const response = await fetch(`${window.app.config.API_URL}/profile/password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword
            }),
            credentials: 'include'
        });

        if (response.ok) {
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
            
            showNotification('Mot de passe modifié avec succès', 'success');
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Erreur lors du changement de mot de passe');
        }
    } catch (error) {
        console.error('Erreur changement mot de passe:', error);
        showNotification(error.message, 'error');
    }
}

    updateProfileDisplay() {
        const user = window.app ? window.app.getCurrentUser() : null;
        const userData = user?.user || user || {};
        
        const nameDisplay = document.querySelector('.card-body .row .col-md-6:first-child');
        const emailDisplay = document.querySelector('.card-body .row .col-md-6:last-child');
        
        if (nameDisplay) {
            nameDisplay.innerHTML = `<strong>Nom :</strong> ${userData.name || 'Non défini'}`;
        }
        
        if (emailDisplay) {
            emailDisplay.innerHTML = `<strong>Email :</strong> ${userData.email || 'Non défini'}`;
        }
        
        const profileInitials = document.querySelector('.profile-initials-summary');
        if (profileInitials) {
            profileInitials.textContent = this.getUserInitials(userData.name || 'U');
        }
        
        const nameInput = document.getElementById('newName');
        const emailInput = document.getElementById('newEmail');
        
        if (nameInput) {
            nameInput.value = userData.name || '';
        }
        
        if (emailInput) {
            emailInput.value = userData.email || '';
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    formatDate(dateString) {
        if (!dateString) return 'Inconnue';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}