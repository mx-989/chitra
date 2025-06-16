/**
 * Contrôleur JavaScript pour les statistiques de l'acceuil
 */
class StatsController {
    constructor() {
    }

    // Récupère les statistiques de l'utilisateur depuis l'API
    async getUserStats() {
        try {
            const response = await fetch(`${window.app.config.API_URL}/stats`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
           
            if (data.success) {
                return data.stats;
            } else {
                throw new Error(data.error || 'Erreur lors du chargement des statistiques');
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques:', error);
            throw error;
        }
    }

    // Met à jour les tailles de fichiers pour recalculer l'espace de stockage utilisé
    async updateFileSizes() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/update-file-sizes`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Erreur lors de la mise à jour des tailles:', error);
            throw error;
        }
    }
}