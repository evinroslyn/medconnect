# Configuration MySQL pour Med-Connect

## Installation MySQL

### Windows
1. Téléchargez MySQL Community Server depuis https://dev.mysql.com/downloads/mysql/
2. Exécutez l'installateur et suivez les instructions
3. Notez le mot de passe root défini lors de l'installation

### macOS
```bash
# Avec Homebrew
brew install mysql
brew services start mysql

# Sécuriser l'installation
mysql_secure_installation
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo mysql_secure_installation
```

## Configuration de la Base de Données

1. **Connexion à MySQL**
```bash
mysql -u root -p
```

2. **Création de la base de données**
```sql
CREATE DATABASE medconnect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. **Création d'un utilisateur dédié (optionnel)**
```sql
CREATE USER 'medconnect_user'@'localhost' IDENTIFIED BY 'votre_mot_de_passe';
GRANT ALL PRIVILEGES ON medconnect.* TO 'medconnect_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## Configuration des Variables d'Environnement

Mettez à jour votre fichier `.env` :
```env
DATABASE_URL=mysql://medconnect_user:votre_mot_de_passe@localhost:3306/medconnect
DB_HOST=localhost
DB_PORT=3306
DB_USER=medconnect_user
DB_PASSWORD=votre_mot_de_passe
DB_NAME=medconnect
```

## Exécution des Migrations

```bash
# Générer les migrations
npm run db:generate

# Appliquer les migrations
npm run db:migrate
```

## Vérification

Démarrez le serveur pour vérifier la connexion :
```bash
npm run dev
```

Vous devriez voir : "✅ Connexion MySQL établie avec succès"