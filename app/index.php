<?php

require 'vendor/autoload.php';

use App\Router;
use App\Controllers\{ 
    UserController,
    AlbumController,
    PhotoController,
    CommentController,
    ShareController,
    FavoriteController,
    StatsController
};

//CORS
header('Access-Control-Allow-Origin: http://localhost');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');

// Gére les requêtes OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Liste des contrôleurs
$controllers = [
    UserController::class,
    AlbumController::class,
    PhotoController::class,
    CommentController::class,
    ShareController::class,
    FavoriteController::class,
    StatsController::class
];

// Initialise et exécute le routeur
$router = new Router();
$router->registerControllers($controllers);
$router->run();

?>