<?php
namespace App\Controllers;

use App\Models\User;
use App\Utils\Route;

class UserController extends Controller {
    private User $userModel;

    public function __construct($params) {
        parent::__construct($params);
        $this->userModel = new User();
    }

    // Crée un nouveau compte
    #[Route('POST', '/api/register')]
    public function register() {
        $email = $this->body['email'] ?? '';
        $password = $this->body['password'] ?? '';
        $name = $this->body['name'] ?? '';

        if (empty($email) || empty($password) || empty($name)) {
            http_response_code(400);
            return ['error' => 'Tous les champs sont requis'];
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        return ['error' => 'Veuillez fournir un email valide'];
        }

        try {
            $userId = $this->userModel->create($email, $password, $name);
            return ['success' => true, 'userId' => $userId, 'message' => 'Compte créé avec succès! Vous pouvez maintenant vous connecter.'];
        } catch (\Exception $e) {
            http_response_code(400);
            return ['error' => $e->getMessage()];
        }
    }

    // Authentifie un utilisateur (démarre sa session)
    #[Route('POST', '/api/login')]
    public function login() {
        $email = $this->body['email'] ?? '';
        $password = $this->body['password'] ?? '';

        if (empty($email) || empty($password)) {
            http_response_code(400);
            return ['error' => 'Email et mot de passe requis'];
        }

        $user = $this->userModel->authenticate($email, $password);

        if ($user) {
            session_start();
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_email'] = $user['email'];
            return ['success' => true, 'user' => $user];
        } else {
            http_response_code(401);
            return ['error' => 'Identifiants invalides'];
        }
    }

    // Déconnecte l'utilisateur (détruit sa session)
    #[Route('POST', '/api/logout')]
    public function logout() {
        session_start();
        session_destroy();
        return ['success' => true];
    }

    // Récupère les infos de profil de l'utilisateur
    #[Route('GET', '/api/profile')]
    public function getProfile() {
        session_start();
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            return ['error' => 'Non authentifié'];
        }

        $user = $this->userModel->findById($_SESSION['user_id']);
        return ['user' => $user];
    }

    // Met à jour le nom de l'utilisateur
    #[Route('PUT', '/api/profile/name')]
    public function updateName() {
        session_start();
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            return ['error' => 'Non authentifié'];
        }

        $name = $this->body['name'] ?? '';
        
        if (empty($name) || strlen(trim($name)) < 2) {
            http_response_code(400);
            return ['error' => 'Le nom doit contenir au moins 2 caractères'];
        }

        try {
            $result = $this->userModel->updateName($_SESSION['user_id'], trim($name));
            
            if ($result) {
                $updatedUser = $this->userModel->findById($_SESSION['user_id']);
                return ['success' => true, 'user' => $updatedUser];
            } else {
                http_response_code(500);
                return ['error' => 'Erreur lors de la mise à jour du nom'];
            }
        } catch (\Exception $e) {
            http_response_code(400);
            return ['error' => $e->getMessage()];
        }
    }

    // Met à jour l'email de l'utilisateur
    #[Route('PUT', '/api/profile/email')]
    public function updateEmail() {
        session_start();
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            return ['error' => 'Non authentifié'];
        }

        $email = $this->body['email'] ?? '';
        
        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            return ['error' => 'Email invalide'];
        }

        try {
            $result = $this->userModel->updateEmail($_SESSION['user_id'], $email);
            
            if ($result) {
                $_SESSION['user_email'] = $email;
                $updatedUser = $this->userModel->findById($_SESSION['user_id']);
                return ['success' => true, 'user' => $updatedUser];
            } else {
                http_response_code(500);
                return ['error' => 'Erreur lors de la mise à jour de l\'email'];
            }
        } catch (\Exception $e) {
            http_response_code(400);
            return ['error' => $e->getMessage()];
        }
    }

    // Change le mot de passe
    #[Route('PUT', '/api/profile/password')]
    public function updatePassword() {
        session_start();
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            return ['error' => 'Non authentifié'];
        }

        $currentPassword = $this->body['current_password'] ?? '';
        $newPassword = $this->body['new_password'] ?? '';
        
        if (empty($currentPassword) || empty($newPassword)) {
            http_response_code(400);
            return ['error' => 'Mot de passe actuel et nouveau mot de passe requis'];
        }

        try {
            $result = $this->userModel->updatePassword(
                $_SESSION['user_id'], 
                $currentPassword, 
                $newPassword
            );
            
            if ($result) {
                return ['success' => true, 'message' => 'Mot de passe mis à jour avec succès'];
            } else {
                http_response_code(500);
                return ['error' => 'Erreur lors de la mise à jour du mot de passe'];
            }
        } catch (\Exception $e) {
            http_response_code(400);
            return ['error' => $e->getMessage()];
        }
    }
}
?>