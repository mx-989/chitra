<?php
namespace App\Models;

class Stats extends SqlConnect {
    
    public function getPhotoCount($userId) {
        $query = "SELECT COUNT(*) as count FROM photos p 
                  JOIN albums a ON p.album_id = a.id 
                  WHERE a.user_id = :user_id";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute([':user_id' => $userId]);
        
        return (int) $stmt->fetch(\PDO::FETCH_ASSOC)['count'];
    }
    
    public function getAlbumCount($userId) {
        $query = "SELECT COUNT(*) as count FROM albums WHERE user_id = :user_id";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute([':user_id' => $userId]);
        
        return (int) $stmt->fetch(\PDO::FETCH_ASSOC)['count'];
    }
    
    public function getFavoriteCount($userId) {
        $query = "SELECT COUNT(*) as count FROM favorites WHERE user_id = :user_id";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute([':user_id' => $userId]);
        
        return (int) $stmt->fetch(\PDO::FETCH_ASSOC)['count'];
    }
    
    public function getStorageStats($userId) {
        $query = "SELECT SUM(p.file_size) as total_size, COUNT(*) as file_count
                  FROM photos p 
                  JOIN albums a ON p.album_id = a.id 
                  WHERE a.user_id = :user_id";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute([':user_id' => $userId]);
        
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);
        $totalBytes = (int) ($result['total_size'] ?? 0);
        
        return $this->formatBytes($totalBytes);
    }
    
    private function formatBytes($bytes, $precision = 2) {
        if ($bytes == 0) return '0 B';
        
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, $precision) . ' ' . $units[$i];
    }
}

?>