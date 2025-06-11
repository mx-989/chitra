<?php
namespace App\Models;

class Album extends SqlConnect {
    
    public function create($userId, $title, $description, $tags, $visibility = 'private') {
        $query = "INSERT INTO albums (user_id, title, description, tags, visibility, created_at) 
                  VALUES (:user_id, :title, :description, :tags, :visibility, NOW())";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute([
            ':user_id' => $userId,
            ':title' => $title,
            ':description' => $description,
            ':tags' => json_encode($tags),
            ':visibility' => $visibility
        ]);
        
        return $this->db->lastInsertId();
    }
    
    public function getUserAlbums($userId) {
        $query = "SELECT a.*, COUNT(p.id) as photo_count 
                  FROM albums a 
                  LEFT JOIN photos p ON a.id = p.album_id 
                  WHERE a.user_id = :user_id 
                  GROUP BY a.id 
                  ORDER BY a.created_at DESC";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute([':user_id' => $userId]);
        
        $albums = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        foreach ($albums as &$album) {
            $album['tags'] = json_decode($album['tags'], true) ?? [];
        }
        
        return $albums;
    }
    
    public function isOwner($albumId, $userId) {
        $query = "SELECT id FROM albums WHERE id = :id AND user_id = :user_id";
        $stmt = $this->db->prepare($query);
        $stmt->execute([
            ':id' => $albumId,
            ':user_id' => $userId
        ]);
        
        return $stmt->fetch() !== false;
    }
    
    public function update($albumId, $updates) {
        $fields = [];
        $params = [':id' => $albumId];
        
        foreach ($updates as $field => $value) {
            if ($value !== null) {
                $fields[] = "$field = :$field";
                $params[":$field"] = ($field === 'tags') ? json_encode($value) : $value;
            }
        }
        
        if (empty($fields)) {
            return;
        }
        
        $query = "UPDATE albums SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->execute($params);
    }
    
    public function delete($albumId) {
        $query = "DELETE FROM photos WHERE album_id = :album_id";
        $stmt = $this->db->prepare($query);
        $stmt->execute([':album_id' => $albumId]);
        
        $query = "DELETE FROM albums WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->execute([':id' => $albumId]);
    }
    
    public function getAlbumWithPermissions($albumId, $userId) {
        $query = "SELECT a.*, u.name as owner_name,
                  CASE 
                    WHEN a.user_id = :user_id THEN 'owner'
                    WHEN s.permission IS NOT NULL THEN s.permission
                    ELSE NULL
                  END as user_permission
                  FROM albums a
                  JOIN users u ON a.user_id = u.id
                  LEFT JOIN shares s ON a.id = s.album_id AND s.user_id = :user_id
                  WHERE a.id = :album_id";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute([
            ':album_id' => $albumId,
            ':user_id' => $userId
        ]);
        
        $album = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$album || !$album['user_permission']) {
            return null;
        }
        
        $album['tags'] = json_decode($album['tags'], true) ?? [];
        return $album;
    }
}

?>