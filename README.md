# 💕 HANI-2 - Application Couple

Une application mobile React Native pour les couples, offrant une expérience interactive complète avec des jeux, des souvenirs et des défis partagés.

## 🎯 À propos

HANI-2 est une application couple tout-en-un construite avec React Native et Expo. Elle permet aux couples de partager des moments spéciaux, de relever des défis ensemble et de créer des souvenirs durables.

## 📱 Fonctionnalités principales

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
### � Messages & Lettres
- Messages rapides prédéfinis
- Messages personnalisés
- Historique des notes
- ✉️ Lettres programmées (date/heure)

### 🪣 Bucket List
- Liste de rêves à réaliser
- Suggestions d'activités
- Système de validation

### 🎮 Jeux Couple
- Quiz Couple (10 questions)
- Action ou Vérité
- Qui est le Plus...
- Tu Préfères...

### 📊 Statistiques & Secrets
- Statistiques du couple
- Points et achèvements
- Espace secrets partagé

### 👤 Profil & Paramètres
- Informations personnelles
- Paramètres de l'app
- Code couple partageable
- Thème et préférences
- Déconnexion

## 🚀 Démarrage Rapide

### Prérequis
- Node.js (v18+)
- npm ou yarn
- Expo CLI
- Android Studio (pour émulateur) OU téléphone Android avec Expo Go

### Installation

1. **Cloner le dépôt**
```bash
git clone https://github.com/hanieljean42-eng/HANI-2.git
cd HANI-2
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Démarrer l'application**
```bash
npx expo start
```

4. **Tester sur votre appareil**
- Scannez le QR code avec l'app Expo Go
- OU appuyez sur `a` pour lancer sur émulateur Android

## 📦 Créer un APK

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

## 📂 Structure du Projet

```
HANI-2/
├── App.js                          # Point d'entrée
├── package.json                    # Dépendances
├── app.json                        # Configuration Expo
├── eas.json                        # Configuration EAS
├── assets/                         # Images et icônes
├── src/
│   ├── components/
│   │   └── AnimatedModal.js        # Modal animée
│   ├── config/
│   │   ├── firebase.js             # Config Firebase
│   │   └── cloudinary.js           # Config Cloudinary
│   ├── context/
│   │   ├── AuthContext.js          # Authentification
│   │   ├── GameContext.js          # État jeux
│   │   ├── DataContext.js          # Données globales
│   │   ├── ChatContext.js          # Messages
│   │   ├── NotificationContext.js  # Notifications
│   │   ├── SecurityContext.js      # Sécurité
│   │   ├── SyncContext.js          # Synchronisation
│   │   └── ThemeContext.js         # Thème
│   ├── hooks/
│   │   └── useNotifyPartner.js     # Notification partenaire
│   ├── navigation/
│   │   └── MainTabs.js             # Navigation principale
│   ├── screens/                    # Tous les écrans
│   └── utils/
│       ├── encryption.js           # Chiffrement
│       └── uploadToCloudinary.js   # Upload fichiers
└── README.md                       # Documentation
```

## 🔧 Technologies Utilisées

- **React Native** - Framework mobile cross-platform
- **Expo** - Plateforme développement
- **Firebase** - Backend & authentification
- **Cloudinary** - Stockage images
- **React Navigation** - Navigation
- **AsyncStorage** - Stockage local
- **Expo Linear Gradient** - Dégradés visuels
- **Expo Haptics** - Retour haptique
- **Expo Image Picker** - Sélection photos
- **Crypto-js** - Chiffrement des données

## 📋 Fonctionnalités en Développement

- [ ] Synchronisation temps réel (Firebase)
- [ ] Notifications push
- [ ] Widget écran d'accueil
- [ ] Mode sombre amélioré
- [ ] Plus de mini-jeux
- [ ] Partage réseaux sociaux
- [ ] Rappels d'anniversaires
- [ ] Playlist musicale partagée
- [ ] Recherche intelligente

## 👥 Contributeurs

- **haniel-afk** - Développeur principal
- **hanieljean42-eng** - Contributeur



## 📝 Licence

Ce projet est privé. Tous droits réservés © 2025

## 💬 Support

Pour toute question ou bug report, veuillez créer une issue sur GitHub.

---

**Fait avec ❤️ pour les couples**

**Version:** 1.0.0  
**Auteur:** Couple H Team 💕
