/**
 * Vue pour l'affichage des notifications
 */
class NotificationView {
    constructor() {
        if (window.notificationView) {
            return window.notificationView;
        }
        
        this.container = null;
        this.notifications = [];
        this.init();
        
        window.notificationView = this;
        return this;
    }
    
    init() {
        this.createContainer();
    }
    
    createContainer() {
        const existingContainer = document.getElementById('notifications-container');
        if (existingContainer) {
            existingContainer.remove();
        }
        
        this.container = document.createElement('div');
        this.container.id = 'notifications-container';
        this.container.className = 'notifications-container';
        document.body.appendChild(this.container);
    }
    
    show(message, type = 'info', duration = 5000) {
        if (!this.container || !this.container.parentNode) {
            this.createContainer();
        }
        
        const notification = this.createNotification(message, type, duration);
        this.container.appendChild(notification);
        this.notifications.push(notification);
        
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });
        
        if (duration > 0) {
            this.scheduleAutoClose(notification, duration);
        }
        
        this.limitNotifications();
        
        return notification;
    }
    
    createNotification(message, type, duration) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const iconClass = this.getIconClass(type);
        
        notification.innerHTML = `
            <div class="notification-icon">
                ${this.getIconHtml(iconClass)}
            </div>
            <div class="notification-content">
                ${this.escapeHtml(message)}
            </div>
            <button class="notification-close" type="button">
                ×
            </button>
            ${duration > 0 ? '<div class="notification-progress"></div>' : ''}
        `;
        
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.close(notification);
        });
        
        return notification;
    }
    
    getIconClass(type) {
        switch (type) {
            case 'success': return 'fa-check';
            case 'error': return 'fa-exclamation-triangle';
            case 'warning': return 'fa-exclamation';
            case 'info': return 'fa-info';
            default: return 'fa-info';
        }
    }
    
    getIconHtml(iconClass) {
        return `<i class="fas ${iconClass}"></i>`;
    }
    
    scheduleAutoClose(notification, duration) {
        const progressBar = notification.querySelector('.notification-progress');
        
        if (progressBar) {
            progressBar.style.width = '100%';
            progressBar.style.transition = `width ${duration}ms linear`;
            
            setTimeout(() => {
                progressBar.style.width = '0%';
            }, 50);
        }
        
        setTimeout(() => {
            if (notification.parentNode) {
                this.close(notification);
            }
        }, duration);
    }
    
    close(notification) {
        if (!notification || !notification.parentNode) return;
        
        notification.classList.remove('show');
        notification.classList.add('hide');
        
        const index = this.notifications.indexOf(notification);
        if (index > -1) {
            this.notifications.splice(index, 1);
        }
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
    
    closeAll() {
        [...this.notifications].forEach(notification => {
            this.close(notification);
        });
    }
    
    limitNotifications(maxCount = 5) {
        while (this.notifications.length > maxCount) {
            const oldest = this.notifications[0];
            this.close(oldest);
        }
    }
    
    // Méthodes de base
    success(message, duration = 5000) {
        return this.show(message, 'success', duration);
    }
    
    error(message, duration = 7000) {
        return this.show(message, 'error', duration);
    }
    
    warning(message, duration = 6000) {
        return this.show(message, 'warning', duration);
    }
    
    info(message, duration = 5000) {
        return this.show(message, 'info', duration);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    reset() {
        this.closeAll();
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.init();
    }
}

window.showNotification = function(message, type = 'info', duration = 5000) {
    if (!window.notificationView) {
        window.notificationView = new NotificationView();
    }
    return window.notificationView.show(message, type, duration);
};