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
        this.addStyles();
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
    
    addStyles() {
        if (document.querySelector('#notification-styles')) {
            return;
        }
        
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notifications-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                max-width: 400px;
                pointer-events: none;
            }
            .notification {
                background: var(--chitra-card, #1d2021);
                border: 1px solid var(--chitra-border, #3c3836);
                border-radius: 8px;
                padding: 16px 20px;
                margin-bottom: 12px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                display: flex;
                align-items: center;
                gap: 12px;
                transform: translateX(100%);
                transition: all 0.3s ease;
                pointer-events: auto;
                position: relative;
                overflow: hidden;
            }
            .notification.show {
                transform: translateX(0);
            }
            .notification.hide {
                transform: translateX(100%);
                opacity: 0;
            }
            .notification-icon {
                flex-shrink: 0;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                color: white;
            }
            .notification-content {
                flex: 1;
                color: var(--chitra-text, #ebdbb2);
                font-size: 14px;
                line-height: 1.4;
            }
            .notification-close {
                background: none;
                border: none;
                color: var(--chitra-text-muted, #a89984);
                cursor: pointer;
                padding: 2px;
                border-radius: 4px;
                transition: color 0.2s ease;
                flex-shrink: 0;
            }
            .notification-close:hover {
                color: var(--chitra-text, #ebdbb2);
            }
            .notification-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: rgba(255, 255, 255, 0.3);
                transition: width linear;
            }
            
            .notification.success {
                border-left: 4px solid #98971a;
            }
            .notification.success .notification-icon {
                background: #98971a;
            }
            .notification.error {
                border-left: 4px solid #fb4934;
            }
            .notification.error .notification-icon {
                background: #fb4934;
            }
            .notification.warning {
                border-left: 4px solid #d79921;
            }
            .notification.warning .notification-icon {
                background: #d79921;
            }
            .notification.info {
                border-left: 4px solid var(--chitra-primary, #8ec07c);
            }
            .notification.info .notification-icon {
                background: var(--chitra-primary, #8ec07c);
            }
            
            @media (max-width: 768px) {
                .notifications-container {
                    top: 10px;
                    right: 10px;
                    left: 10px;
                    max-width: none;
                }
                .notification {
                    transform: translateY(-100%);
                }
                .notification.show {
                    transform: translateY(0);
                }
                .notification.hide {
                    transform: translateY(-100%);
                }
            }
        `;
        document.head.appendChild(style);
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