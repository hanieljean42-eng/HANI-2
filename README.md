# 💕 Couple H - Application Couple

Une application mobile romantique pour les couples, avec de nombreuses fonctionnalités interactives !

## 📱 Fonctionnalités

### 🔐 Authentification Couple
- Inscription individuelle avec avatar personnalisé
- Création d'espace couple avec code unique
- Système de code partagé pour rejoindre un couple
- Connexion sécurisée

### 🏠 Accueil
- Compteur de jours ensemble
- Love Meter (jauge d'amour)
- Actions rapides vers toutes les fonctionnalités
- Citation du jour
- Statistiques du couple

### 🎰 Roue des Dates
- Roue animée avec 12 activités
- Haptic feedback
- Historique des activités
- Détails pour chaque activité

### ⚡ Défis
- Défi quotidien
- Défis hebdomadaires
- Système XP et niveaux
- Streak (série de jours)
- Jeux à deux intégrés

### 🫙 Souvenirs
- Jar à souvenirs visuel
- Timeline chronologique
- Capsules temporelles *(l'utilisateur peut choisir la **date et l'heure**)*
- Ajout de photos *(**non disponible pour le moment**)* et notes
- Souvenirs avec dates
### 📔 Journal Intime *(non disponible pour le moment)*
*La fonctionnalité du journal intime n'est **pas disponible pour le moment**.*

### 💌 Love Notes
- Messages rapides prédéfinis
- Messages personnalisés
- Historique des notes

### 🪣 Bucket List
- Liste de rêves à réaliser
- Suggestions d'activités
- Système de validation

### 🎮 Jeux Couple
- Quiz Couple (10 questions)
- Action ou Vérité
- Qui est le Plus...
- Tu Préfères...
### 💬 Chat *(non disponible pour le moment)*
*La fonctionnalité d'envoi de messages dans le chat n'est **pas disponible pour le moment**.*
### ✉️ Lettres programmées
L'utilisateur peut choisir la **date et l'heure** d'envoi de la lettre.

### 👤 Profil
- Informations personnelles
- Paramètres de l'app
- Code couple partageable
- Déconnexion

## 🚀 Installation

### Prérequis
- Node.js (v18+)
- npm ou yarn
- Expo CLI
- Android Studio (pour émulateur) ou téléphone Android

### Étapes

1. **Installer les dépendances**
```bash
cd COUPLE
npm install
```

2. **Lancer l'application**
```bash
npx expo start
```

3. **Tester sur appareil**
- Scannez le QR code avec l'app Expo Go sur votre téléphone
- OU appuyez sur `a` pour lancer sur émulateur Android

## 📦 Créer l'APK

### Avec EAS Build (recommandé)

1. **Installer EAS CLI**
```bash
npm install -g eas-cli
```

2. **Se connecter à Expo**
```bash
eas login
```

3. **Configurer le build**
```bash
eas build:configure
```

4. **Créer l'APK**
```bash
eas build -p android --profile preview
```

### Avec Expo (méthode classique)

```bash
expo build:android -t apk
```

## 🎨 Personnalisation

### Changer les couleurs
Modifiez les couleurs dans chaque écran :
- `#FF6B9D` - Rose principal
- `#C44569` - Rose foncé
- `#8B5CF6` - Violet

### Ajouter des activités à la roue
Modifiez le tableau `WHEEL_ITEMS` dans `src/screens/WheelScreen.js`

### Ajouter des défis
Modifiez les tableaux dans `src/screens/ChallengesScreen.js`

## 📂 Structure du Projet

```
COUPLE/
├── App.js                    # Point d'entrée
├── package.json              # Dépendances
├── app.json                  # Configuration Expo
├── assets/                   # Images et icônes
└── src/
    ├── context/
    │   ├── AuthContext.js    # Gestion authentification
    │   └── DataContext.js    # Gestion données
    ├── navigation/
    │   └── MainTabs.js       # Navigation principale
    └── screens/
        ├── WelcomeScreen.js  # Écran d'accueil
        ├── RegisterScreen.js # Inscription
        ├── LoginScreen.js    # Connexion
        ├── JoinCoupleScreen.js # Rejoindre couple
        ├── HomeScreen.js     # Accueil
        ├── WheelScreen.js    # Roue des dates
        ├── ChallengesScreen.js # Défis
        ├── MemoriesScreen.js # Souvenirs
        ├── ProfileScreen.js  # Profil
        └── GamesScreen.js    # Jeux
```

## 🔧 Technologies Utilisées

- **React Native** - Framework mobile
- **Expo** - Plateforme de développement
- **React Navigation** - Navigation
- **AsyncStorage** - Stockage local
- **Expo Linear Gradient** - Dégradés
- **Expo Haptics** - Retour haptique
- **Expo Image Picker** - Sélection photos

## 💡 Idées d'Améliorations

- [ ] Synchronisation cloud entre les deux téléphones
- [ ] Notifications push
- [ ] Widget écran d'accueil
- [ ] Mode sombre
- [ ] Plus de jeux
- [ ] Partage sur réseaux sociaux
- [ ] Rappels d'anniversaires
- [ ] Playlist musicale partagée
- [ ] Ajout de photos dans les souvenirs
- [ ] Envoi de messages dans le chat
- [ ] Journal intime

## ❤️ Fait avec amour

Cette application a été créée pour renforcer les liens entre amoureux !

---

**Version:** 1.0.0  
**Auteur:** Couple H Team 💕
