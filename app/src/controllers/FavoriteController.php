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

    // Récupère la liste des photos favorites (pour la liste des favoris)
    #[Route('GET', '/api/favorites', [AuthMiddleware::class])]
    public function getFavorites() {
        session_start();
        $userId = $_SESSION['user_id'];

        try {
            $favorites = $this->favoriteModel->getUserFavorites($userId);
            $total = $this->favoriteModel->getUserFavoritesCount($userId);

            return [
                'favorites' => $favorites,
                'total' => $total
            ];
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