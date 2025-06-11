<?php
namespace App\Controllers;

use App\Models\Stats;
use App\Utils\Route;
use App\Middlewares\AuthMiddleware;

class StatsController extends Controller {
    
    private Stats $statsModel;
    
    public function __construct($params) {
        parent::__construct($params);
        $this->statsModel = new Stats();
    }

    // Récupère les stats de l'utilitaseur
    #[Route('GET', '/api/stats', [AuthMiddleware::class])]
    public function getUserStats() {
        session_start();
        $userId = $_SESSION['user_id'];
        
        if (!$userId || !is_numeric($userId)) {
            http_response_code(401);
            return ['error' => 'Utilisateur non authentifié'];
        }
        
        try {
            $stats = [
                'photos' => $this->statsModel->getPhotoCount($userId),
                'albums' => $this->statsModel->getAlbumCount($userId),
                'favorites' => $this->statsModel->getFavoriteCount($userId),
                'storage' => $this->statsModel->getStorageStats($userId)
            ];
            
            return [
                'success' => true,
                'stats' => $stats
            ];
        } catch (\Exception $e) {
            error_log("Erreur stats pour user $userId: " . $e->getMessage());
            http_response_code(500);
            return ['error' => 'Erreur lors du chargement des statistiques'];
        }
    }
}