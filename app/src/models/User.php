<?php
namespace App\Models;

class User extends SqlConnect {
   
    public function create($email, $password, $name) {
        $checkQuery = "SELECT id FROM users WHERE email = :email";
        $stmt = $this->db->prepare($checkQuery);
        $stmt->execute([':email' => $email]);
       
        if ($stmt->fetch()) {
            throw new \Exception("Cet email est déjà utilisé par un autre utilisateur");
        }
       
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT); // Hash+salt avec BCRYPT
       
        $query = "INSERT INTO users (email, password, name, created_at) VALUES (:email, :password, :name, NOW())";
        $stmt = $this->db->prepare($query);
        $stmt->execute([
            ':email' => $email,
            ':password' => $hashedPassword,
            ':name' => $name
        ]);
       
        return $this->db->lastInsertId();
    }
   
    public function authenticate($email, $password) {
        $query = "SELECT id, email, name, password FROM users WHERE email = :email";
        $stmt = $this->db->prepare($query);
        $stmt->execute([':email' => $email]);
       
        $user = $stmt->fetch(\PDO::FETCH_ASSOC);
       
        if ($user && password_verify($password, $user['password'])) {
            unset($user['password']); 
            return $user;
        }
       
        return false;
    }
   
    public function findById($id) {
        $query = "SELECT id, email, name, created_at FROM users WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->execute([':id' => $id]);
       
        return $stmt->fetch(\PDO::FETCH_ASSOC);
    }
   
    public function findByEmail($email) {
    $query = "SELECT id, email, name FROM users WHERE email = :email";
    $stmt = $this->db->prepare($query);  
    $stmt->execute([':email' => $email]);
   
    return $stmt->fetch(\PDO::FETCH_ASSOC);
    }

    public function updateName($userId, $name) {
        $query = "UPDATE users SET name = :name WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $result = $stmt->execute([
            ':name' => $name,
            ':id' => $userId
        ]);
        
        return $result;
    }

    public function updateEmail($userId, $email) {
        $checkQuery = "SELECT id FROM users WHERE email = :email AND id != :user_id";
        $stmt = $this->db->prepare($checkQuery);
        $stmt->execute([
            ':email' => $email,
            ':user_id' => $userId
        ]);
       
        if ($stmt->fetch()) {
            throw new \Exception("Cet email est déjà utilisé par un autre utilisateur");
        }

        $query = "UPDATE users SET email = :email WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $result = $stmt->execute([
            ':email' => $email,
            ':id' => $userId
        ]);
        
        return $result;
    }

    public function updatePassword($userId, $currentPassword, $newPassword) {
        $query = "SELECT password FROM users WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->execute([':id' => $userId]);
        
        $user = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$user || !password_verify($currentPassword, $user['password'])) {
            throw new \Exception("Mot de passe actuel incorrect");
        }
        
        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT); // Hash+salt avec BCRYPT
        
        $updateQuery = "UPDATE users SET password = :password WHERE id = :id";
        $stmt = $this->db->prepare($updateQuery);
        $result = $stmt->execute([
            ':password' => $hashedPassword,
            ':id' => $userId
        ]);
        
        return $result;
    }
}

?>