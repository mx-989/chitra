// Configuration du serveur frontend avec Express.js
const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Renvoie tous les fichiers statiques du répertoire
app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`Frontend server running at http://localhost:${PORT}`);
});