<?php 
namespace App\Models;

class Share extends SqlConnect {
    
    public function shareAlbum($albumId, $ownerId, $sharedWithEmail, $permission = 'view') {
        $albumModel = new Album();
        if (!$albumModel->isOwner($albumId, $ownerId)) {
            throw new \Exception("Non autorisé à partager cet album");
        }
        
        $userModel = new User();
        $sharedUser = $userModel->findByEmail($sharedWithEmail);
        
        if (!$sharedUser) {
            throw new \Exception("Utilisateur non trouvé");
        }
        
        if ($sharedUser['id'] == $ownerId) {
            throw new \Exception("Vous ne pouvez pas partager avec vous-même");
        }
        
        $query = "SELECT id FROM shares WHERE album_id = :album_id AND user_id = :user_id";
        $stmt = $this->db->prepare($query);
        $stmt->execute([
            ':album_id' => $albumId,
            ':user_id' => $sharedUser['id']
        ]);
        
        if ($stmt->fetch()) {
            $query = "UPDATE shares SET permission = :permission WHERE album_id = :album_id AND user_id = :user_id";
            $stmt = $this->db->prepare($query);
            $stmt->execute([
                ':permission' => $permission,
                ':album_id' => $albumId,
                ':user_id' => $sharedUser['id']
            ]);
            
            return $stmt->rowCount();
        } else {
            $query = "INSERT INTO shares (album_id, user_id, permission, created_at) 
                      VALUES (:album_id, :user_id, :permission, NOW())";
            
            $stmt = $this->db->prepare($query);
            $stmt->execute([
                ':album_id' => $albumId,
                ':user_id' => $sharedUser['id'],
                ':permission' => $permission
            ]);
            
            return $this->db->lastInsertId();
        }
    }
    
    public function getSharedWithUser($userId) {
        $query = "SELECT a.*, s.permission, u.name as owner_name, COUNT(p.id) as photo_count
                  FROM shares s
                  JOIN albums a ON s.album_id = a.id
                  JOIN users u ON a.user_id = u.id
                  LEFT JOIN photos p ON a.id = p.album_id
                  WHERE s.user_id = :user_id
                  GROUP BY a.id
                  ORDER BY s.created_at DESC";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute([':user_id' => $userId]);
        
        $albums = $stmt->fetchAll(\PDO::FETCH_ASSOC) ?? [];
        
        foreach ($albums as &$album) {
            $album['tags'] = json_decode($album['tags'], true) ?? [];
        }
        
        return $albums;
    }
    
    public function hasPermission($albumId, $userId, $requiredPermission) {
        $query = "SELECT permission FROM shares WHERE album_id = :album_id AND user_id = :user_id";
        $stmt = $this->db->prepare($query);
        $stmt->execute([
            ':album_id' => $albumId,
            ':user_id' => $userId
        ]);
        
        $share = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$share) {
            return false;
        }
        
        $permissions = ['view' => 1, 'comment' => 2, 'add' => 3];
        
        return $permissions[$share['permission']] >= $permissions[$requiredPermission];
    }

    public function revokeShare($albumId, $ownerId, $sharedUserId) {
    $albumModel = new Album();
    if (!$albumModel->isOwner($albumId, $ownerId)) {
        throw new \Exception("Non autorisé à révoquer ce partage");
    }
    
    $query = "SELECT id FROM shares WHERE album_id = :album_id AND user_id = :user_id";
    $stmt = $this->db->prepare($query);
    $stmt->execute([
        ':album_id' => $albumId,
        ':user_id' => $sharedUserId
    ]);
    
    if (!$stmt->fetch()) {
        throw new \Exception("Ce partage n'existe pas");
    }
    
    $query = "DELETE FROM shares WHERE album_id = :album_id AND user_id = :user_id";
    $stmt = $this->db->prepare($query);
    $stmt->execute([
        ':album_id' => $albumId,
        ':user_id' => $sharedUserId
    ]);
    
    return $stmt->rowCount() > 0;
    }
    
}

?>