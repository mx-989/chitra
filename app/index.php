<?php

require 'vendor/autoload.php';

use App\Router;
use App\Controllers\{ Dogs };

$controllers = [
    Dogs::class
];

$router = new Router();
$router->registerControllers($controllers);
$router->run();