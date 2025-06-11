<?php

namespace App\Middlewares;

class AuthMiddleware {
    
    public function handle($request, $id = null) {
        session_start();
        
        // Vérifier si l'utilisateur est connecté
        if (!isset($_SESSION['user_id'])) {
            return false;
        }
        
        // Si un ID est fourni, on peut ajouter des vérifications supplémentaires
        // Par exemple, vérifier que l'utilisateur a accès à cette ressource
        
        return true;
    }
}

?>