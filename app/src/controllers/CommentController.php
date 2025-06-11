<?php
namespace App\Controllers;
use App\Models\Comment;
use App\Models\Album;
use App\Models\Photo;
use App\Utils\Route;
use App\Middlewares\AuthMiddleware;

class CommentController extends Controller {
    private Comment $commentModel;

    public function __construct($params) {
        parent::__construct($params);
        $this->commentModel = new Comment();
    }

    // Ajoute un commentaire à une photo
    #[Route('POST', '/api/photos/:photoId/comments', [AuthMiddleware::class])]
    public function addComment($photoId) {
        session_start();
        $userId = $_SESSION['user_id'];
        $content = $this->body['content'] ?? '';
       
        $photoModel = new Photo();
        if (!$photoModel->canComment($photoId, $userId)) {
            http_response_code(403);
            return ['error' => 'Non autorisé à ajouter un commentaire'];
        }
       
        if (empty($content)) {
            http_response_code(400);
            return ['error' => 'Le commentaire ne peut pas être vide'];
        }
        try {
            $commentId = $this->commentModel->create($photoId, $userId, $content);
            return ['success' => true, 'commentId' => $commentId];
        } catch (\Exception $e) {
            http_response_code(500);
            return ['error' => $e->getMessage()];
        }
    }

    // Récupère les commentaires d'une photo 
    #[Route('GET', '/api/photos/:photoId/comments', [AuthMiddleware::class])]
    public function getComments($photoId) {
        try {
            $comments = $this->commentModel->getPhotoComments($photoId);
            return ['comments' => $comments];
        } catch (\Exception $e) {
            http_response_code(500);
            return ['error' => $e->getMessage()];
        }
    }

    // Modifie un commentaire
    #[Route('PUT', '/api/comments/:id', [AuthMiddleware::class])]
    public function updateComment($id) {
        session_start();
        $userId = $_SESSION['user_id'];
       
        if (!$this->commentModel->isOwner($id, $userId)) {
            http_response_code(403);
            return ['error' => 'Non autorisé'];
        }
        $content = $this->body['content'] ?? '';
       
        try {
            $this->commentModel->update($id, $content);
            return ['success' => true];
        } catch (\Exception $e) {
            http_response_code(500);
            return ['error' => $e->getMessage()];
        }
    }

    // Supprime un commentaire
    #[Route('DELETE', '/api/comments/:id', [AuthMiddleware::class])]
    public function deleteComment($id) {
        session_start();
        $userId = $_SESSION['user_id'];
       
        if (!$this->commentModel->isOwner($id, $userId)) {
            http_response_code(403);
            return ['error' => 'Non autorisé'];
        }
        try {
            $this->commentModel->delete($id);
            return ['success' => true];
        } catch (\Exception $e) {
            http_response_code(500);
            return ['error' => $e->getMessage()];
        }
    }
}
?>