# Configuration Firebase pour HANI 2

---

## ✅ MODE GRATUIT ACTIVÉ (Plan Spark)

L'application est configurée pour fonctionner **100% gratuitement** avec Firebase.

### Ce qui fonctionne :
- ✅ Images (compressées automatiquement)
- ✅ Synchronisation en temps réel
- ✅ Jeux duo
- ✅ Messages
- ✅ Souvenirs avec photos

### Ce qui ne fonctionne PAS (nécessite plan Blaze) :
- ❌ Vidéos
- ❌ Images très haute résolution (> 10 MB)

---

## 🔒 Configurer les règles de sécurité (OBLIGATOIRE)

### Règles Realtime Database

1. Firebase Console → **Realtime Database** → **Règles**
2. Remplacez tout par :

```json
{
  "rules": {
    "couples": {
      "$coupleId": {
        ".read": "root.child('couplesMembers').child($coupleId).child(auth.uid).exists()",
        ".write": "root.child('couplesMembers').child($coupleId).child(auth.uid).exists()",
        
        "members": {
          "$userId": {
            ".read": "root.child('couplesMembers').child($coupleId).child(auth.uid).exists()",
            ".write": "$userId === auth.uid || root.child('couplesMembers').child($coupleId).child(auth.uid).exists()",
            "isOnline": {
              ".validate": "newData.isBoolean()"
            }
          }
        },
        
        "data": {
          ".read": "root.child('couplesMembers').child($coupleId).child(auth.uid).exists()",
          ".write": "root.child('couplesMembers').child($coupleId).child(auth.uid).exists()",
          
          "scheduledLetters": {
            "$letterId": {
              ".read": "root.child('couplesMembers').child($coupleId).child(auth.uid).exists()",
              ".write": "root.child('couplesMembers').child($coupleId).child(auth.uid).exists()"
            }
          }
        },
        
        "pushTokens": {
          ".read": "root.child('couplesMembers').child($coupleId).child(auth.uid).exists()",
          ".write": "$userId === auth.uid || root.child('couplesMembers').child($coupleId).child(auth.uid).exists()"
        },
        
        "chat": {
          "messages": {
            ".read": "root.child('couplesMembers').child($coupleId).child(auth.uid).exists()",
            ".write": "root.child('couplesMembers').child($coupleId).child(auth.uid).exists()"
          }
        }
      }
    },
    
    "couplesMembers": {
      "$coupleId": {
        "$userId": {
          ".read": "$userId === auth.uid",
          ".write": "$userId === auth.uid"
        }
      }
    }
  }
}
```

3. Cliquez **"Publier"**

---

## 📱 Configurer les notifications push (FCM)

### Activer Cloud Messaging

1. Firebase Console → **Paramètres du projet** (⚙️ en haut à gauche)
2. Onglet **"Cloud Messaging"**
3. Notez la **Clé de serveur** (Server Key) - utile pour tests

### 3.2 Configuration Android (obligatoire pour build)

1. Firebase Console → **Paramètres du projet** → **Général**
2. Descendez jusqu'à "Vos applications"
3. Si pas d'app Android :
   - Cliquez **"Ajouter une application"** → Android
   - Package name : `com.hani.app` (ou votre bundle ID)
   - Cliquez **"Enregistrer l'application"**
4. **Téléchargez google-services.json**
5. Placez-le à la racine de votre projet

### 3.3 Configuration iOS (optionnel)

1. Firebase Console → **Paramètres du projet** → **Général**
2. Ajoutez une app iOS si nécessaire
3. Bundle ID : `com.hani.app`
4. **Téléchargez GoogleService-Info.plist**

### 3.4 Configuration Expo (IMPORTANT)

Le fichier `app.json` doit contenir :

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#FF6B9D"
        }
      ]
    ],
    "android": {
      "googleServicesFile": "./google-services.json"
    },
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist"
    }
  }
}
```

### 3.5 Builder l'app pour les notifications

Les notifications **NE FONCTIONNENT PAS** dans Expo Go !

```bash
# Installer EAS CLI
npm install -g eas-cli

# Se connecter
eas login

# Configurer le build
eas build:configure

# Builder pour Android (APK de développement)
eas build --platform android --profile development

# OU Builder pour production
eas build --platform android --profile production
```

---

## ✅ Vérification

### Tester Storage
1. Ajoutez un souvenir avec une image > 3 MB
2. Vérifiez dans Firebase Console → Storage que le fichier apparaît
3. L'image doit être visible chez les 2 partenaires

### Tester les notifications
1. Ouvrez l'app sur 2 téléphones différents
2. Acceptez les permissions de notification
3. Envoyez un message ou lancez un jeu
4. Le partenaire doit recevoir une notification

### Tester la synchronisation
1. Créez un souvenir sur le téléphone A
2. Il doit apparaître sur le téléphone B en quelques secondes

---

## 📊 Limites du plan gratuit (Spark)

| Service | Limite |
|---------|--------|
| Realtime DB - Stockage | 1 GB |
| Realtime DB - Téléchargement | 10 GB/mois |
| Storage - Stockage | 5 GB |
| Storage - Téléchargement | 1 GB/jour |
| Notifications | Illimitées |

---

## 🐛 Dépannage

### ❌ "Storage not configured"
→ Vérifiez que Storage est activé dans la console Firebase

### ❌ Les images ne s'affichent pas
→ Vérifiez les règles Storage (doivent autoriser `read`)

### ❌ Pas de notifications
→ L'app doit être buildée avec EAS (pas Expo Go)
→ Vérifiez les permissions dans Paramètres → Applications → HANI

### ❌ Erreur "PERMISSION_DENIED" Firebase
→ Publiez les règles de sécurité (étape 2)

### ❌ Le partenaire ne voit pas les données
→ Vérifiez que les deux utilisateurs ont le même `coupleId`
→ Regardez les logs avec : `npx expo start --dev-client`
1. Vérifier que les deux partenaires ont le même coupleId
2. Vérifier la connexion Firebase
3. Regarder les logs pour "Session créée" / "Session trouvée"
4. S'assurer que Firebase est bien initialisé

## 7. Variables d'environnement (optionnel)

Pour plus de sécurité, vous pouvez utiliser des variables d'environnement:

```javascript
// Dans app.json > extra
{
  "extra": {
    "firebaseApiKey": process.env.FIREBASE_API_KEY,
    "firebaseProjectId": process.env.FIREBASE_PROJECT_ID,
    // ...
  }
}
```

Puis dans le code:
```javascript
import Constants from 'expo-constants';
const apiKey = Constants.expoConfig.extra.firebaseApiKey;
```
