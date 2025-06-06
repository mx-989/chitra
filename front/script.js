// Sample photo data
const samplePhotos = [
    'https://picsum.photos/400/400?random=1',
    'https://picsum.photos/400/600?random=2',
    'https://picsum.photos/600/400?random=3',
    'https://picsum.photos/400/400?random=4',
    'https://picsum.photos/500/500?random=5',
    'https://picsum.photos/400/600?random=6',
    'https://picsum.photos/600/600?random=7',
    'https://picsum.photos/400/400?random=8',
    'https://picsum.photos/500/400?random=9',
    'https://picsum.photos/400/500?random=10',
    'https://picsum.photos/600/400?random=11',
    'https://picsum.photos/400/400?random=12'
];

// Generate photo grid
function generatePhotoGrid() {
    const photoGrid = document.getElementById('photoGrid');
    photoGrid.innerHTML = '';
    
    samplePhotos.forEach((src, index) => {
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item';
        photoItem.innerHTML = `
            <img src="${src}" alt="Photo ${index + 1}" loading="lazy">
            <div class="photo-overlay">
                <div class="photo-actions">
                    <button class="photo-action" title="Ajouter aux favoris">
                        <i class="fas fa-heart"></i>
                    </button>
                    <button class="photo-action" title="Partager">
                        <i class="fas fa-share"></i>
                    </button>
                    <button class="photo-action" title="Plus d'options">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                </div>
            </div>
        `;
        
        photoItem.addEventListener('click', () => {
            // Simulate photo viewer
            alert('Ouverture de la photo en grand format');
        });
        
        photoGrid.appendChild(photoItem);
    });
}

// Navigation handling
document.querySelectorAll('.sidebar .nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Update active nav
        document.querySelectorAll('.sidebar .nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        // Update page title
        const section = link.dataset.section;
        const titles = {
            timeline: 'Timeline',
            albums: 'Albums',
            favorites: 'Favoris',
            people: 'Personnes',
            places: 'Lieux',
            explore: 'Explorer',
            archive: 'Archive',
            trash: 'Corbeille'
        };
        
        document.getElementById('pageTitle').textContent = titles[section] || 'Chitra';
        
        // Show/hide sections
        document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
        const targetSection = document.getElementById(section + '-section');
        if (targetSection) {
            targetSection.style.display = 'block';
        }
    });
});

// View toggle
document.getElementById('gridView').addEventListener('click', () => {
    document.getElementById('gridView').classList.add('active');
    document.getElementById('listView').classList.remove('active');
});

document.getElementById('listView').addEventListener('click', () => {
    document.getElementById('listView').classList.add('active');
    document.getElementById('gridView').classList.remove('active');
});

// Sidebar toggle for mobile
document.getElementById('sidebarToggle').addEventListener('click', () => {
    document.querySelector('.sidebar').classList.toggle('show');
});

// File upload handling
document.getElementById('fileInput').addEventListener('change', (e) => {
    const files = e.target.files;
    if (files.length > 0) {
        alert(`${files.length} fichier(s) sélectionné(s) pour l'upload`);
    }
});

// Search functionality
document.querySelector('input[placeholder="Rechercher des photos..."]').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    console.log('Recherche:', searchTerm);
});

// Initialize
generatePhotoGrid();

// Simulate real-time updates
setInterval(() => {
    const badge = document.querySelector('.notification-badge');
    if (badge) {
        const count = parseInt(badge.textContent);
        badge.textContent = Math.max(0, count + Math.floor(Math.random() * 3) - 1);
    }
}, 30000);

// Drag and drop for upload
const uploadZone = document.querySelector('.upload-zone');
if (uploadZone) {
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = 'var(--chitra-primary)';
        uploadZone.style.backgroundColor = '#3c3836';
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.style.borderColor = 'var(--chitra-border)';
        uploadZone.style.backgroundColor = 'var(--chitra-card)';
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = 'var(--chitra-border)';
        uploadZone.style.backgroundColor = 'var(--chitra-card)';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            alert(`${files.length} fichier(s) déposé(s) pour l'upload`);
        }
    });
}