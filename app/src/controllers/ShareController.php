<?php
namespace App\Controllers;
use App\Models\Share;
use App\Utils\Route;
use App\Middlewares\AuthMiddleware;

class ShareController extends Controller {
    private Share $shareModel;

    public function __construct($params) {
        parent::__construct($params);
        $this->shareModel = new Share();
    }

    // Partage un album avec un utilisateur
    #[Route('POST', '/api/shared/:albumId/share', [AuthMiddleware::class])]
    public function shareAlbum($albumId) {
        session_start();
        $userId = $_SESSION['user_id'];
       
        $sharedWithEmail = $this->body['email'] ?? '';
        $permission = $this->body['permission'] ?? 'view';
       
        try {
            $shareId = $this->shareModel->shareAlbum($albumId, $userId, $sharedWithEmail, $permission);
            return ['success' => true, 'shareId' => $shareId];
        } catch (\Exception $e) {
            http_response_code(400);
            return ['error' => $e->getMessage()];
        }
    }

    // Récupère tous les albums partagés avec l'utilisateur
    #[Route('GET', '/api/shared/', [AuthMiddleware::class])]
    public function getSharedAlbums() {
        session_start();
        $userId = $_SESSION['user_id'];
       
        try {
            $albums = $this->shareModel->getSharedWithUser($userId);
            return ['albums' => $albums];
        } catch (\Exception $e) {
            http_response_code(500);
            return ['error' => $e->getMessage()];
        }
    }

    // Révoque le partage d'un album à un utilisateur
    #[Route('DELETE', '/api/shared/:albumId/shares/:userId', [AuthMiddleware::class])]
    public function revokeShare($albumId, $userId) {
        session_start();
        $ownerId = $_SESSION['user_id'];
       
        try {
            $result = $this->shareModel->revokeShare($albumId, $ownerId, $userId);
            return ['success' => $result, 'message' => 'Partage révoqué'];
        } catch (\Exception $e) {
            http_response_code(400);
            return ['error' => $e->getMessage()];
        }
    }
}
?>