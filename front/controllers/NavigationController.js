/**
 * Contrôleur pour la navigation et l'interface principale
 * Gère l'affichage des différentes sections de l'application
 */
class NavigationController {
    constructor() {
        this.view = new NavigationView();
        this.currentSection = 'timeline';
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('nav:change', (event) => {
            this.handleNavigation(event.detail.section);
        });
        document.addEventListener('nav:search', (event) => {
            this.handleSearch(event.detail.query);
        });
        document.addEventListener('nav:logout', () => {
            const logoutEvent = new CustomEvent('auth:logout');
            document.dispatchEvent(logoutEvent);
        });

        document.addEventListener('photo:advancedSearch', (event) => {
            this.handleAdvancedSearch(event.detail);
        });
    }

    renderMainLayout() {
        this.view.renderMainLayout();
        this.attachNavigationEvents();
        this.showTimeline();
    }

    // Configure tous les événements de navigation et d'interaction
    attachNavigationEvents() {
        const navLinks = document.querySelectorAll('.sidebar .nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.currentTarget.dataset.section;
                if (section) {
                    this.handleNavigation(section);
                }
            });
        });

        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelector('.sidebar').classList.toggle('show');
            });
        }

        document.addEventListener('click', (e) => {
            const sidebar = document.querySelector('.sidebar');
            const sidebarToggle = document.getElementById('sidebarToggle');
           
            if (sidebar && sidebar.classList.contains('show') &&
                !sidebar.contains(e.target) && e.target !== sidebarToggle) {
                sidebar.classList.remove('show');
            }
        });

        const searchInput = document.querySelector('.search-bar input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        const profileBtn = document.getElementById('profileBtn');
        if (profileBtn) {
            profileBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const section = profileBtn.getAttribute('data-section');
                if (section) {
                    this.handleNavigation(section);
                }
            });
        }
    }

    // Gère la navigation entre les différentes sections via le routeur
    handleNavigation(section) {
        if (window.app) {
            window.app.handleNavigation(section);
        } else {
            this.showSectionDirectly(section);
        }
    }

    // Affiche directement une section sans passer par le routeur
    showSectionDirectly(section) {
        this.currentSection = section;
        this.updateActiveNav(section);
        this.updatePageTitle(section);

        switch (section) {
            case 'timeline':
                this.showTimeline();
                break;
            case 'albums':
                this.showAlbums();
                break;
            case 'favorites':
                this.showFavorites();
                break;
            case 'shared':
                this.showShared();
                break;
            case 'explore':
                this.showExplore();
                break;
            case 'profile':
                this.showProfile();
                break;
            default:
                this.showTimeline();
        }

        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.remove('show');
        }
    }

    updateActiveNav(section) {
        const navLinks = document.querySelectorAll('.sidebar .nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.dataset.section === section) {
                link.classList.add('active');
            }
        });
    }

    updatePageTitle(section) {
        const titles = {
            timeline: 'Timeline',
            albums: 'Albums',
            favorites: 'Favoris',
            shared: 'Albums Partagés',
            explore: 'Explorer',
            profile: 'Mon Profil'
        };
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = titles[section] || 'Chitra';
        }
    }

    // Recherche en haut de page
    handleSearch(query) {
        if (!query || query.trim() === '') {
            this.clearSearchResults();
            return;
        }

        const searchEvent = new CustomEvent('photo:search', {
            detail: { query: query.trim() }
        });
        document.dispatchEvent(searchEvent);
    }

    clearSearchResults() {
        this.handleNavigation(this.currentSection);
    }

    showTimeline() {
        this.setActiveSection('timeline');
        this.view.showTimelineSection();
        const loadPhotosEvent = new CustomEvent('photo:loadRecent');
        document.dispatchEvent(loadPhotosEvent);
    }

    showAlbums() {
        this.setActiveSection('albums');
        this.view.showAlbumsSection();
        const loadAlbumsEvent = new CustomEvent('album:loadAll');
        document.dispatchEvent(loadAlbumsEvent);
    }

    showFavorites() {
        this.setActiveSection('favorites');
        this.view.showFavoritesSection();
        const loadFavoritesEvent = new CustomEvent('favorite:loadAll');
        document.dispatchEvent(loadFavoritesEvent);
    }

    showShared() {
        this.setActiveSection('shared');
        this.view.showSharedSection();
        const loadSharedEvent = new CustomEvent('share:loadSharedAlbums');
        document.dispatchEvent(loadSharedEvent);
    }

    showExplore() {
        this.setActiveSection('explore');
        this.view.showExploreSection();
    }

    showProfile() {
        this.setActiveSection('profile');
        this.view.showProfileSection();
    }

    getCurrentSection() {
        return this.currentSection;
    }

    updateUserInfo(user) {
        this.view.updateUserInfo(user);
    }

    updateActiveNavigation(section) {
        const navLinks = document.querySelectorAll('.nav-link[data-section]');
        navLinks.forEach(link => {
            link.classList.remove('active');
        });
       
        const activeLink = document.querySelector(`[data-section="${section}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }  

    setActiveSection(section) {
        this.updateActiveNavigation(section);
        this.currentSection = section;
    }

    // Recherche avancée de la section Explorer
    async handleAdvancedSearch(criteria) {
        try {
            const params = new URLSearchParams();
            
            if (criteria.tags && criteria.tags.length > 0) {
                params.append('tags', criteria.tags.join(','));
            }
            
            if (criteria.albumId) {
                params.append('album_id', criteria.albumId);
            }
            
            if (criteria.dateFrom) {
                params.append('date_from', criteria.dateFrom);
            }
            
            if (criteria.dateTo) {
                params.append('date_to', criteria.dateTo);
            }

            const response = await fetch(`${window.app.config.API_URL}/search/photos?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                this.view.displayExploreResults(data.photos || []);
            } else {
                throw new Error('Erreur lors de la recherche');
            }
        } catch (error) {
            console.error('Erreur recherche avancée:', error);
            this.view.showExploreMessage('Erreur lors de la recherche. Veuillez réessayer.', 'error');
        }
    }
}