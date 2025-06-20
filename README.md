# Chitra 🪷

**Chitra** _("image" en Sanskrit)_ est une application web pour uploader, gérer, et partager vos photos. 

[Documentation pour les utilisateurs](./usage.md)

## 📦 Fonctionnalités

- **Compte** : S'inscrire, se connecter. Modifier nom, email, mot de passe.
- **Albums** : Créer, visualiser, modifier, supprimer vos albums.
- **Photos** : Ajouter, voir, envoyer, des photos dans vos albums / les albums partagés avec vous. Mettre des descriptions et tags aux photos. Supprimer vos photos.
- **Favoris** : Ajouter vos photos ou des photos partagées avec vous à vos favoris. Retrouvez-les toutes facilement dans un espace dédié.
- **Partages** : Donner l'accès à certains albums à d'autres utilisateurs. Modifier ou supprimer les droits donnés. _Lecture seule / Droit de commenter / Droit d'ajouter des photos._
- **Commentaires** : Ajouter, modifier, supprimer des commentaires sur vos photos / photos partagées avec vous. Répondez aux autres commentaires.
- **Recherche** : Retrouvez des photos précises avec une recherche simple ou avancée.

## ⚙️ Technologies utilisées

- **Frontend** : JavaScript
- **Backend** : PHP 
- **Base de données** : MySQL (PhpMyAdmin)
- **Containerisation** : Docker 

## 📋 Prérequis

- Avoir [Docker 🐳](https://docs.docker.com/engine/install/) installé.  
- Avoir [Composer 🎼](https://getcomposer.org/download/) installé. 


## 🔧 Installation

### 1. Cloner le projet

```bash
git clone https://github.com/mx-989/chitra.git
cd chitra
```

### 2. Ajoutez vos variables d'environnement
Copiez le .env.sample en .env

```bash
cp .env.sample .env
```
renseignez les valeurs manquantes :

- `DB_USER`: L'utilisateur MySQL 
- `DB_PASSWORD`: Le mot de passe de l'utilisateur MySQL 
- `DB_ROOT_PASSWORD`: Le mot de passe root MySQL 

### 3. Initialisez Composer

```bash
cd app && composer install && cd ../ 
```

### 4. Lancez l'application via Docker

```bash
docker-compose up -d
```

### 5. Import de la base de données

Pour tester l'application, importez `example-db.sql` (version texte dispo [ici](https://raw.githubusercontent.com/mx-989/chitra/refs/heads/master/example-db.sql)) dans votre base de données, via le portail PhpMyAdmin. 
(par défaut : **http://localhost:8090**)

Quelques photos reliés à la db de démonstration sont  incluses dans le repository, sous `/app/uploads/photos`. Vous n'avez rien à faire, mais pouvez vider ce dossier pour revenir à une application vide.

Email/Mot de Passe des utilisateurs dans la db de démonstration :
`mathieu.alami@chitra.net`:`password` et `elodie.baker@chitra.net`:`motdepasse`

## ➡️ Accès à l'application

Une fois l'installation terminée, accédez à Chitra via : **http://localhost:80**

## 📁 Structure du projet

```
chitra/
├── app/                    # Backend PHP
│   ├── src/
│   │   ├── Controllers/    # Contrôleurs API
│   │   ├── Models/         # Modèles de données
│   │   ├── Middlewares/    
│   │   └── Utils/          
│   ├── uploads/            # Stockage des photos
│   ├── index.php
│   └── composer.json
│
├── front/                  # Frontend JavaScript
│   ├── controllers/        # Contrôleurs MVC
│   ├── views/              # Vues et interfaces
│   ├── router.js           
│   ├── index.html
│   └── style.css             
│                   
├── example-db.sql                
├── docker-compose.yml     
└── README.md
```

## 🐛 Dépannage

- Vérifiez que tous les container Docker sont démarrés : `docker-compose ps`
- Vérifiez qu'aucun autre service sur votre machine n'utilise les ports requis.


