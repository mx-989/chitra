<?php

namespace App\Controllers;

use App\Models\Favorite;
use App\Utils\Route;
use App\Middlewares\AuthMiddleware;

class FavoriteController extends Controller {
    private Favorite $favoriteModel;

    public function __construct($params) {
        parent::__construct($params);
        $this->favoriteModel = new Favorite();
    }

    // Ajoute une photo aux favoris de l'utilisateur
    #[Route('POST', '/api/favorites/:photoId', [AuthMiddleware::class])]
    public function addFavorite($photoId) {
        session_start();
        $userId = $_SESSION['user_id'];
       
        try {
            $result = $this->favoriteModel->addFavorite($userId, $photoId);
            return $result;
        } catch (\Exception $e) {
            http_response_code(400);
            return ['error' => $e->getMessage()];
        }
    }

    // Retire une photo des favoris de l'utilisateur
    #[Route('DELETE', '/api/favorites/:photoId', [AuthMiddleware::class])]
    public function removeFavorite($photoId) {
        session_start();
        $userId = $_SESSION['user_id'];
       
        try {
            $result = $this->favoriteModel->removeFavorite($userId, $photoId);
            return $result;
        } catch (\Exception $e) {
            http_response_code(400);
            return ['error' => $e->getMessage()];
        }
    }

    // Récupère la liste des photos favorites (pour la liste des favoris)
    #[Route('GET', '/api/favorites', [AuthMiddleware::class])]
    public function getFavorites() {
        session_start();
        $userId = $_SESSION['user_id'];
       
        $limit = $this->params['limit'] ?? null; //limite car la fonction est appelée avec limit=1 pour obtenir le nombre de favoris
        $offset = $this->params['offset'] ?? 0;
        $groupBy = $this->params['group_by'] ?? null;
       
        try {
            if ($groupBy === 'album') {
                $favorites = $this->favoriteModel->getUserFavoritesByAlbum($userId);
                return ['favorites_by_album' => $favorites];
            } else {
                $favorites = $this->favoriteModel->getUserFavorites($userId, $limit, $offset);
                $total = $this->favoriteModel->getUserFavoritesCount($userId);
               
                return [
                    'favorites' => $favorites,
                    'total' => $total,
                    'limit' => $limit,
                    'offset' => $offset
                ];
            }
        } catch (\Exception $e) {
            http_response_code(500);
            return ['error' => $e->getMessage()];
        }
    }

    // Vérifie si une photo est dans les favoris de l'utilisateur (pour les vues individuelles)
    #[Route('GET', '/api/photos/:photoId/favorite-status', [AuthMiddleware::class])]
    public function checkFavoriteStatus($photoId) {
        session_start();
        $userId = $_SESSION['user_id'];
       
        try {
            $isFavorite = $this->favoriteModel->isFavorite($userId, $photoId);
            return ['is_favorite' => $isFavorite];
        } catch (\Exception $e) {
            http_response_code(500);
            return ['error' => $e->getMessage()];
        }
    }

    // Ajoute ou supprime une photo aux favoris
    #[Route('POST', '/api/favorites/toggle/:photoId', [AuthMiddleware::class])]
    public function toggleFavorite($photoId) {
        session_start();
        $userId = $_SESSION['user_id'];
       
        try {
            $isFavorite = $this->favoriteModel->isFavorite($userId, $photoId);
           
            if ($isFavorite) {
                $result = $this->favoriteModel->removeFavorite($userId, $photoId);
                return ['action' => 'removed', 'is_favorite' => false];
            } else {
                $result = $this->favoriteModel->addFavorite($userId, $photoId);
                return ['action' => 'added', 'is_favorite' => true];
            }
        } catch (\Exception $e) {
            http_response_code(400);
            return ['error' => $e->getMessage()];
        }
    }
}
?>