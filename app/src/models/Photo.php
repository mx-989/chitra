<?php
namespace App\Models;

class Photo extends SqlConnect {
   
    public function create($albumId, $userId, $filename, $description, $tags, $dateTaken, $fileSize = 0) {
        $albumModel = new Album();
        if (!$albumModel->isOwner($albumId, $userId)) {
            $shareModel = new Share();
            if (!$shareModel->hasPermission($albumId, $userId, 'add')) {
                throw new \Exception("Non autorisé à ajouter des photos à cet album");
            }
        }
       
        $query = "INSERT INTO photos (album_id, uploaded_by, filename, description, tags, date_taken, file_size, uploaded_at)
                  VALUES (:album_id, :uploaded_by, :filename, :description, :tags, :date_taken, :file_size, NOW())";
       
        $stmt = $this->db->prepare($query);
        $stmt->execute([
            ':album_id' => $albumId,
            ':uploaded_by' => $userId,
            ':filename' => $filename,
            ':description' => $description,
            ':tags' => json_encode($tags),
            ':date_taken' => $dateTaken,
            ':file_size' => $fileSize
        ]);
       
        return $this->db->lastInsertId();
    }

    public function getLastPhoto($albumId) {
        $query = "SELECT filename FROM photos WHERE album_id = :album_id ORDER BY date_taken DESC LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->execute([':album_id' => $albumId]);
        return $stmt->fetch(\PDO::FETCH_ASSOC);
    }

    public function canComment($photoId, $userId) {
    $query = "select album_id from photos where id = :photo_id";
    $stmt = $this->db->prepare($query);
    $stmt->execute([':photo_id' => $photoId]);
    $albumId = $stmt->fetch(\PDO::FETCH_ASSOC);
    
    $query = "select user_id from albums where id = :album_id";
    $stmt = $this->db->prepare($query);
    $stmt->execute([':album_id' => $albumId['album_id']]);
    $albumOwner = $stmt->fetch(\PDO::FETCH_ASSOC);
    
    if ($albumOwner['user_id'] == $userId) {
        return true; 
    }

    $query = "select permission from shares where album_id = :album_id and user_id = :user_id";
    $stmt = $this->db->prepare($query);
    $stmt->execute([':album_id' => $albumId['album_id'], ':user_id' => $userId]);
    $permission = $stmt->fetch(\PDO::FETCH_ASSOC);
    
    if (!$permission) {
        return false;
    }
    
    if ($permission['permission'] == 'comment' || $permission['permission'] == 'add') {
        return true;
    }
    
    return false;
    }
   
    public function getAlbumPhotos($albumId, $userId) {
        $albumModel = new Album();
        $album = $albumModel->getAlbumWithPermissions($albumId, $userId);
       
        if (!$album) {
            throw new \Exception("Non autorisé");
        }
       
        $query = "SELECT p.*, u.name as uploader_name, COUNT(c.id) as comment_count
                  FROM photos p
                  JOIN users u ON p.uploaded_by = u.id
                  LEFT JOIN comments c ON p.id = c.photo_id
                  WHERE p.album_id = :album_id
                  GROUP BY p.id
                  ORDER BY p.date_taken DESC";
       
        $stmt = $this->db->prepare($query);
        $stmt->execute([':album_id' => $albumId]);
       
        $photos = $stmt->fetchAll(\PDO::FETCH_ASSOC);
       
        foreach ($photos as &$photo) {
            $photo['tags'] = json_decode($photo['tags'], true) ?? [];
        }
       
        return $photos;
    }
   
    public function canDelete($photoId, $userId) {
        $query = "SELECT p.uploaded_by, a.user_id as album_owner
                  FROM photos p
                  JOIN albums a ON p.album_id = a.id
                  WHERE p.id = :photo_id";
       
        $stmt = $this->db->prepare($query);
        $stmt->execute([':photo_id' => $photoId]);
       
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);
       
        return $result && ($result['uploaded_by'] == $userId || $result['album_owner'] == $userId);
    }
   
    public function delete($photoId) {
        $query = "SELECT filename FROM photos WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->execute([':id' => $photoId]);
        $photo = $stmt->fetch(\PDO::FETCH_ASSOC);
       
        if ($photo) {
            $filepath = __DIR__ . '/../../uploads/photos/' . $photo['filename'];
            if (file_exists($filepath)) {
                unlink($filepath);
            }
           
            $query = "DELETE FROM photos WHERE id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->execute([':id' => $photoId]);
        }
    }
   
    public function search($userId, $query, $tags, $dateFrom, $dateTo, $albumId = null) {
        $sql = "SELECT DISTINCT p.*, a.title as album_title, u.name as uploader_name
                FROM photos p
                JOIN albums a ON p.album_id = a.id
                JOIN users u ON p.uploaded_by = u.id
                LEFT JOIN shares s ON a.id = s.album_id AND s.user_id = :user_id
                WHERE (a.user_id = :user_id OR a.visibility = 'public' OR s.id IS NOT NULL)";
       
        $params = [':user_id' => $userId];
       
        if (!empty($albumId)) {
            $sql .= " AND a.id = :album_id";
            $params[':album_id'] = $albumId;
        }
       
        if (!empty($query)) {
            $sql .= " AND (p.description LIKE :query)";
            $params[':query'] = '%' . $query . '%';
        }
       
        if (!empty($tags)) {
            $tagArray = array_map('trim', explode(',', $tags));
            $tagConditions = [];
            
            foreach ($tagArray as $index => $tag) {
                if (!empty($tag)) {
                    $tagParam = ":tag_{$index}";
                    $tagConditions[] = "p.tags LIKE {$tagParam}";
                    $params[$tagParam] = '%"' . $tag . '"%';
                }
            }
            
            if (!empty($tagConditions)) {
                $sql .= " AND (" . implode(' OR ', $tagConditions) . ")";
            }
        }
       
        if ($dateFrom) {
            $sql .= " AND p.date_taken >= :date_from";
            $params[':date_from'] = $dateFrom;
        }
       
        if ($dateTo) {
            $sql .= " AND p.date_taken <= :date_to";
            $params[':date_to'] = $dateTo;
        }
       
        $sql .= " ORDER BY p.date_taken DESC";
       
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
       
        $photos = $stmt->fetchAll(\PDO::FETCH_ASSOC);
       
        foreach ($photos as &$photo) {
            $photo['tags'] = json_decode($photo['tags'], true) ?? [];
        }
       
        return $photos;
    }

    
    public function getAllAccessiblePhotos($userId) {
        $query = "SELECT p.*, a.title as album_name, u.name as owner_name
                FROM photos p
                JOIN albums a ON p.album_id = a.id
                JOIN users u ON p.uploaded_by = u.id
                WHERE p.uploaded_by = :userId                                    
                OR a.user_id = :userId                                          
                OR a.id IN (SELECT album_id FROM shares WHERE user_id = :userId)
                ORDER BY p.date_taken DESC";
    
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':userId', $userId, \PDO::PARAM_INT);
        $stmt->execute();
    
        $photos = $stmt->fetchAll(\PDO::FETCH_ASSOC);
    
        foreach ($photos as &$photo) {
            $photo['tags'] = json_decode($photo['tags'], true) ?? [];
        }
    
        return $photos;
    }
}

?>