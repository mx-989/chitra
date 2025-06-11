<?php
namespace App\Models;

class Comment extends SqlConnect {
    
    public function create($photoId, $userId, $content) {
        $query = "INSERT INTO comments (photo_id, user_id, content, created_at) 
                  VALUES (:photo_id, :user_id, :content, NOW())";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute([
            ':photo_id' => $photoId,
            ':user_id' => $userId,
            ':content' => $content
        ]);
        
        return $this->db->lastInsertId();
    }

    public function isPhotoOwner($photoId, $userId) {
        $query = "SELECT id FROM photos WHERE id = :photo_id AND uploaded_by = :user_id";
        $stmt = $this->db->prepare($query);
        $stmt->execute([
            ':photo_id' => $photoId,
            ':user_id' => $userId
        ]);
        
        return $stmt->fetch() !== false;
    }

    public function getPhotoPermissions($photoId, $userId) {
        $query = "select album_id from photos where id = :photo_id";
        $stmt = $this->db->prepare($query);
        $stmt->execute([':photo_id' => $photoId]);
        $album = $stmt->fetch(\PDO::FETCH_ASSOC);
        if (!$album) {
            return null; 
        }
        $query = "select permission from shares where album_id = :album_id and user_id = :user_id";

        
        $stmt = $this->db->prepare($query);
        $stmt->execute([':album_id' => $album['album_id'] , ':user_id' => $userId]);
        
        return $stmt->fetch(\PDO::FETCH_ASSOC);
    }
    
    public function getPhotoComments($photoId) {
        $query = "SELECT c.*, u.name as author_name 
                  FROM comments c
                  JOIN users u ON c.user_id = u.id
                  WHERE c.photo_id = :photo_id
                  ORDER BY c.created_at ASC";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute([':photo_id' => $photoId]);
        
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
    
    public function isOwner($commentId, $userId) {
        $query = "SELECT id FROM comments WHERE id = :id AND user_id = :user_id";
        $stmt = $this->db->prepare($query);
        $stmt->execute([
            ':id' => $commentId,
            ':user_id' => $userId
        ]);
        
        return $stmt->fetch() !== false;
    }
    
    public function update($commentId, $content) {
        $query = "UPDATE comments SET content = :content, updated_at = NOW() WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->execute([
            ':content' => $content,
            ':id' => $commentId
        ]);
    }
    
    public function delete($commentId) {
        $query = "DELETE FROM comments WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->execute([':id' => $commentId]);
    }
}

?>