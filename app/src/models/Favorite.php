<?php
namespace App\Models;

class Favorite extends SqlConnect {
    
    public function addFavorite($userId, $photoId) {
        if (!$this->userCanAccessPhoto($userId, $photoId)) {
            throw new \Exception("Vous n'avez pas accès à cette photo");
        }
        
        $checkQuery = "SELECT id FROM favorites WHERE user_id = :user_id AND photo_id = :photo_id";
        $stmt = $this->db->prepare($checkQuery);
        $stmt->execute([
            ':user_id' => $userId,
            ':photo_id' => $photoId
        ]);
        
        if ($stmt->fetch()) {
            return ['already_favorite' => true];
        }
        
        $query = "INSERT INTO favorites (user_id, photo_id) VALUES (:user_id, :photo_id)";
        $stmt = $this->db->prepare($query);
        $stmt->execute([
            ':user_id' => $userId,
            ':photo_id' => $photoId
        ]);
        
        return ['success' => true, 'id' => $this->db->lastInsertId()];
    }
    
    public function removeFavorite($userId, $photoId) {
        $query = "DELETE FROM favorites WHERE user_id = :user_id AND photo_id = :photo_id";
        $stmt = $this->db->prepare($query);
        $stmt->execute([
            ':user_id' => $userId,
            ':photo_id' => $photoId
        ]);
        
        return ['success' => true, 'removed' => $stmt->rowCount() > 0];
    }
    
    public function isFavorite($userId, $photoId) {
        $query = "SELECT id FROM favorites WHERE user_id = :user_id AND photo_id = :photo_id";
        $stmt = $this->db->prepare($query);
        $stmt->execute([
            ':user_id' => $userId,
            ':photo_id' => $photoId
        ]);
        
        return $stmt->fetch() !== false;
    }

    public function getUserFavorites($userId) {
        $query = "SELECT p.*, a.title as album_title, a.visibility, u.name as uploader_name,
                  COUNT(c.id) as comment_count, 1 as is_favorite
                  FROM favorites f
                  JOIN photos p ON f.photo_id = p.id
                  JOIN albums a ON p.album_id = a.id
                  JOIN users u ON p.uploaded_by = u.id
                  LEFT JOIN comments c ON p.id = c.photo_id
                  WHERE f.user_id = :user_id
                  GROUP BY p.id
                  ORDER BY f.created_at DESC";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':user_id', $userId, \PDO::PARAM_INT);
        $stmt->execute();
        
        $photos = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        foreach ($photos as &$photo) {
            $photo['tags'] = json_decode($photo['tags'], true) ?? [];
        }
        
        return $photos;
    }
    
    public function getUserFavoritesCount($userId) {
        $query = "SELECT COUNT(*) as total FROM favorites WHERE user_id = :user_id";
        $stmt = $this->db->prepare($query);
        $stmt->execute([':user_id' => $userId]);
        
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $result['total'];
    }
    
    public function getUserFavoritesByAlbum($userId) {
        $query = "SELECT a.*, COUNT(f.id) as favorite_count
                  FROM favorites f
                  JOIN photos p ON f.photo_id = p.id
                  JOIN albums a ON p.album_id = a.id
                  WHERE f.user_id = :user_id
                  GROUP BY a.id
                  ORDER BY favorite_count DESC";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute([':user_id' => $userId]);
        
        $albums = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        foreach ($albums as &$album) {
            $album['tags'] = json_decode($album['tags'], true) ?? [];
        }
        
        return $albums;
    }
    
    private function userCanAccessPhoto($userId, $photoId) {
        $query = "SELECT p.id 
                  FROM photos p
                  JOIN albums a ON p.album_id = a.id
                  LEFT JOIN shares s ON a.id = s.album_id AND s.user_id = :user_id
                  WHERE p.id = :photo_id 
                  AND (a.user_id = :user_id OR a.visibility = 'public' OR s.id IS NOT NULL)";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute([
            ':user_id' => $userId,
            ':photo_id' => $photoId
        ]);
        
        return $stmt->fetch() !== false;
    }
    
}

?>