<?php

namespace App\Controllers;

use App\Models\Album;
use App\Utils\Route;
use App\Middlewares\AuthMiddleware;

class AlbumController extends Controller {
    private Album $albumModel;

    public function __construct($params) {
        parent::__construct($params);
        $this->albumModel = new Album();
    }

    // Récupère tous les albums appartenant à l'utilisateur
    #[Route('GET', '/api/albums', [AuthMiddleware::class])]
    public function getAlbums() {
        session_start();
        $userId = $_SESSION['user_id'];
        $albums = $this->albumModel->getUserAlbums($userId);
        return ['albums' => $albums];
    }

    // Crée un nouvel album
    #[Route('POST', '/api/albums', [AuthMiddleware::class])]
    public function createAlbum() {
        session_start();
        $userId = $_SESSION['user_id'];
        
        $title = $this->body['title'] ?? '';
        $description = $this->body['description'] ?? '';
        $tags = $this->body['tags'] ?? [];
        $visibility = $this->body['visibility'] ?? 'private';

        if (empty($title)) {
            http_response_code(400);
            return ['error' => 'Le titre est requis'];
        }

        try {
            $albumId = $this->albumModel->create($userId, $title, $description, $tags, $visibility);
            return ['success' => true, 'albumId' => $albumId];
        } catch (\Exception $e) {
            http_response_code(500);
            return ['error' => $e->getMessage()];
        }
    }

    // Met à jour les informations d'un album
    #[Route('PUT', '/api/albums/:id', [AuthMiddleware::class])]
    public function updateAlbum($id) {
        session_start();
        $userId = $_SESSION['user_id'];
        
        if (!$this->albumModel->isOwner($id, $userId)) {
            http_response_code(403);
            return ['error' => 'Non autorisé'];
        }

        $updates = [
            'title' => $this->body['title'] ?? null,
            'description' => $this->body['description'] ?? null,
            'tags' => $this->body['tags'] ?? null,
            'visibility' => $this->body['visibility'] ?? null
        ];

        try {
            $this->albumModel->update($id, array_filter($updates));
            return ['success' => true];
        } catch (\Exception $e) {
            http_response_code(500);
            return ['error' => $e->getMessage()];
        }
    }

    // Supprime un album
    #[Route('DELETE', '/api/albums/:id', [AuthMiddleware::class])]
    public function deleteAlbum($id) {
        session_start();
        $userId = $_SESSION['user_id'];
        
        if (!$this->albumModel->isOwner($id, $userId)) {
            http_response_code(403);
            return ['error' => 'Non autorisé'];
        }

        try {
            $this->albumModel->delete($id);
            return ['success' => true];
        } catch (\Exception $e) {
            http_response_code(500);
            return ['error' => $e->getMessage()];
        }
    }

    // Récupère un album spécifique
    #[Route('GET', '/api/albums/:id', [AuthMiddleware::class])]
    public function getAlbum($id) {
        session_start();
        $userId = $_SESSION['user_id'];
        
        $album = $this->albumModel->getAlbumWithPermissions($id, $userId);
        if (!$album) {
            http_response_code(404);
            return ['error' => 'Album non trouvé ou non autorisé'];
        }

        return ['album' => $album];
    }

    // Récupère la liste des partages d'un album
    #[Route('GET', '/api/albums/:id/shares', [AuthMiddleware::class])]
    public function getAlbumShares($id) {
    session_start();
    $userId = $_SESSION['user_id'];
    
    if (!$this->albumModel->isOwner($id, $userId)) {
        http_response_code(403);
        return ['error' => 'Non autorisé'];
    }
    
    try {
        $query = "SELECT s.*, u.name as user_name, u.email as user_email 
                  FROM shares s 
                  JOIN users u ON s.user_id = u.id 
                  WHERE s.album_id = :album_id
                  ORDER BY s.created_at DESC";
        
        $stmt = $this->albumModel->db->prepare($query);
        $stmt->execute([':album_id' => $id]);
        $shares = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        return ['shares' => $shares];
    } catch (\Exception $e) {
        http_response_code(500);
        return ['error' => $e->getMessage()];
    }
    }
}

?>