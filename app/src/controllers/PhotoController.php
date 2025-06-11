<?php
namespace App\Controllers;
use App\Models\Photo;
use App\Models\Album;
use App\Utils\Route;
use App\Middlewares\AuthMiddleware;

class PhotoController extends Controller {
    private Photo $photoModel;
    
    public function __construct($params) {
        parent::__construct($params);
        $this->photoModel = new Photo();
        $this->AlbumModel = new Album();
    }

    // Upload une photo dans un album 
    #[Route('POST', '/api/albums/:albumId/photos', [AuthMiddleware::class])]
    public function uploadPhoto($albumId) {
        session_start();
        $userId = $_SESSION['user_id'];
       
        if (!isset($_FILES['photo'])) {
            http_response_code(400);
            return ['error' => 'Aucun fichier envoyé'];
        }
        
        $album = $this->AlbumModel->getAlbumWithPermissions($albumId, $userId);
        if (
            !$album ||
            ($album['user_id'] !== $userId && $album['user_permission'] !== "add")
        ) {
            http_response_code(403);
            return ['error' => 'Non autorisé à ajouter des photos dans cet album'];
        }
        
        $file = $_FILES['photo'];
        $description = $_POST['description'] ?? '';
        $tags = json_decode($_POST['tags'] ?? '[]', true);
        $dateTaken = $_POST['date_taken'] ?? date('Y-m-d H:i:s');
        
        $validationResult = $this->validateImageFile($file);
        if ($validationResult !== true) {
            http_response_code(400);
            return ['error' => $validationResult];
        }
        
        try {
            $uploadDir = __DIR__ . '/../../uploads/photos/';
            if (!file_exists($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
           
            $originalExtension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            $finalExtension = ($originalExtension === 'webp') ? 'png' : $originalExtension;
            $filename = uniqid() . '_' . time() . '.' . $finalExtension;
            $filepath = $uploadDir . $filename;
            
            if (move_uploaded_file($file['tmp_name'], $filepath)) {
                $fileSize = filesize($filepath);
               
                $photoId = $this->photoModel->create(
                    $albumId,
                    $userId,
                    $filename,
                    $description,
                    $tags,
                    $dateTaken,
                    $fileSize
                );
               
                return ['success' => true, 'photoId' => $photoId, 'filename' => $filename, 'userId' => $userId, 'album' => $album];
            } else {
                throw new \Exception('Erreur lors de l\'upload');
            }
        } catch (\Exception $e) {
            http_response_code(500);
            return ['error' => $e->getMessage()];
        }
    }

    // Vérifie qu'un fichier uploadé est bien une image acceptable
    private function validateImageFile($file) {
        if ($file['error'] !== UPLOAD_ERR_OK) {
            return match($file['error']) {
                UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'Fichier trop volumineux (max 50MB)',
                UPLOAD_ERR_PARTIAL => 'Upload interrompu',
                UPLOAD_ERR_NO_FILE => 'Aucun fichier envoyé',
                UPLOAD_ERR_NO_TMP_DIR => 'Dossier temporaire manquant',
                UPLOAD_ERR_CANT_WRITE => 'Erreur d\'écriture',
                UPLOAD_ERR_EXTENSION => 'Extension PHP a arrêté l\'upload',
                default => 'Erreur d\'upload inconnue'
            };
        }
        
        if ($file['size'] > 50 * 1024 * 1024) {
            return 'Fichier trop volumineux (max 50MB)';
        }
        
        if (!file_exists($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
            return 'Fichier temporaire invalide';
        }
        
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'tif'];
        $fileExtension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
       
        if (!in_array($fileExtension, $allowedExtensions)) {
            return 'Extension de fichier non supportée. Formats acceptés : ' . implode(', ', $allowedExtensions);
        }
        
        $allowedMimeTypes = [
            'image/jpeg',
            'image/pjpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/bmp',
            'image/x-ms-bmp',
            'image/x-windows-bmp',
            'image/tiff',
            'image/x-tiff'
        ];
        
        $realMimeType = null;
        if (function_exists('finfo_open')) {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $realMimeType = finfo_file($finfo, $file['tmp_name']);
            finfo_close($finfo);
           
            if ($realMimeType && !in_array($realMimeType, $allowedMimeTypes)) {
                return 'Type de fichier non supporté détecté : ' . $realMimeType;
            }
        }
       
        if (!$realMimeType && !in_array($file['type'], $allowedMimeTypes)) {
            return 'Type de fichier déclaré non supporté : ' . $file['type'];
        }
        
        $imageInfo = @getimagesize($file['tmp_name']);
        if ($imageInfo === false) {
            return 'Le fichier n\'est pas une image valide ou est corrompu';
        }
        
        $allowedImageTypes = [
            IMAGETYPE_JPEG,
            IMAGETYPE_PNG,
            IMAGETYPE_GIF,
            IMAGETYPE_WEBP,
            IMAGETYPE_BMP,
            IMAGETYPE_TIFF_II,
            IMAGETYPE_TIFF_MM
        ];
        
        if (!in_array($imageInfo[2], $allowedImageTypes)) {
            return 'Format d\'image non supporté par le système';
        }
        
        if ($imageInfo[0] < 1 || $imageInfo[1] < 1) {
            return 'Dimensions d\'image invalides';
        }
        
        if ($imageInfo[0] > 10000 || $imageInfo[1] > 10000) {
            return 'Image trop grande (max 10000x10000 pixels)';
        }
        
        return true;
    }

    // Récupère toutes les photos accessibles à l'utilisateur
    #[Route('GET', '/api/photos', [AuthMiddleware::class])]
    public function getAllPhotos() {
        session_start();
        $userId = $_SESSION['user_id'];
        
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
        
        try {
            $photos = $this->photoModel->getAllAccessiblePhotos($userId, $page, $limit);
            return ['photos' => $photos];
        } catch (\Exception $e) {
            http_response_code(500);
            return ['error' => $e->getMessage()];
        }
    }

    // Récupère toutes les photos d'un album 
    #[Route('GET', '/api/albums/:albumId/photos', [AuthMiddleware::class])]
    public function getAlbumPhotos($albumId) {
        session_start();
        $userId = $_SESSION['user_id'];
       
        try {
            $photos = $this->photoModel->getAlbumPhotos($albumId, $userId);
            return ['photos' => $photos];
        } catch (\Exception $e) {
            http_response_code(403);
            return ['error' => 'Non autorisé'];
        }
    }

    // Récupère la dernière photo ajoutée dans un album (pour thumbnail)
    #[Route('GET', '/api/lastphoto/:id', [AuthMiddleware::class])]
    public function getLastPhoto($id) {
        session_start();
        $userId = $_SESSION['user_id'];
       
        try {
            $photo = $this->photoModel->getLastPhoto($id, $userId);
            if (!$photo) {
                return ['error' => 'Photo non trouvée'];
            }
            return ['photo' => $photo];
        } catch (\Exception $e) {
            http_response_code(500);
            return ['error' => $e->getMessage()];
        }
    }

    // Supprime une photo 
    #[Route('DELETE', '/api/photos/:id', [AuthMiddleware::class])]
    public function deletePhoto($id) {
        session_start();
        $userId = $_SESSION['user_id'];
       
        if (!$this->photoModel->canDelete($id, $userId)) {
            http_response_code(403);
            return ['error' => "Cette photo ne t'appartient pas, tu ne peux pas la supprimer."];
        }
        
        try {
            $this->photoModel->delete($id);
            return ['success' => true];
        } catch (\Exception $e) {
            http_response_code(500);
            return ['error' => $e->getMessage()];
        }
    }

    // Vérifie si l'utilisateur peut commenter une photo
    #[Route('GET', '/api/comment-permission/:id', [AuthMiddleware::class])]
    public function getCommentPermissions($id) {
        session_start();
        $userId = $_SESSION['user_id'];
        $allowed = $this->photoModel->canComment($id, $userId);
        return ['allowed' => $allowed];
    }

    // Recherche de photos avec filtres multiples (texte, tags, date, album)
    #[Route('GET', '/api/search/photos', [AuthMiddleware::class])]
    public function searchPhotos() {
        session_start();
        $userId = $_SESSION['user_id'];
       
        $query = $this->params['q'] ?? $_GET['q'] ?? '';
        $tags = $this->params['tags'] ?? $_GET['tags'] ?? '';
        $albumId = $this->params['album_id'] ?? $_GET['album_id'] ?? null;
        $dateFrom = $this->params['date_from'] ?? $_GET['date_from'] ?? null;
        $dateTo = $this->params['date_to'] ?? $_GET['date_to'] ?? null;
        
        try {
            $photos = $this->photoModel->search($userId, $query, $tags, $dateFrom, $dateTo, $albumId);
            return ['photos' => $photos];
        } catch (\Exception $e) {
            http_response_code(500);
            return ['error' => $e->getMessage()];
        }
    }

    // Sert le fichier image d'une photo 
    #[Route('GET', '/api/photos/:id/image', [AuthMiddleware::class])]
    public function serveImage($id) {
        session_start();
        $userId = $_SESSION['user_id'];
       
        $query = "SELECT p.filename, a.user_id as album_owner, a.visibility
                  FROM photos p
                  JOIN albums a ON p.album_id = a.id
                  WHERE p.id = :photo_id";
       
        $stmt = $this->photoModel->db->prepare($query);
        $stmt->execute([':photo_id' => $id]);
        $photo = $stmt->fetch(\PDO::FETCH_ASSOC);
       
        if (!$photo) {
            http_response_code(404);
            return ['error' => 'Photo non trouvée'];
        }
       
        $hasAccess = false;
        if ($photo['album_owner'] == $userId || $photo['visibility'] == 'public') {
            $hasAccess = true;
        } else {
            $shareQuery = "SELECT id FROM shares s
                           JOIN photos p ON s.album_id = p.album_id
                           WHERE p.id = :photo_id AND s.user_id = :user_id";
            $shareStmt = $this->photoModel->db->prepare($shareQuery);
            $shareStmt->execute([':photo_id' => $id, ':user_id' => $userId]);
            if ($shareStmt->fetch()) {
                $hasAccess = true;
            }
        }
       
        if (!$hasAccess) {
            http_response_code(403);
            return ['error' => 'Accès non autorisé'];
        }
       
        $filepath = __DIR__ . '/../../uploads/photos/' . $photo['filename'];
       
        if (!file_exists($filepath)) {
            http_response_code(404);
            return ['error' => 'Fichier non trouvé'];
        }
       
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $filepath);
        finfo_close($finfo);
       
        header('Content-Type: ' . $mimeType);
        header('Content-Length: ' . filesize($filepath));
        header('Cache-Control: private, max-age=86400');
       
        readfile($filepath);
        exit();
    }
}
?>