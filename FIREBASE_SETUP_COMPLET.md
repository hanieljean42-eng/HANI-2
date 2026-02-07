# 🔥 FIREBASE - GUIDE COMPLET À COPIER-COLLER

⚠️ **IMPORTANT:** Les **Realtime Database Rules** et **Storage Rules** vont dans des places **DIFFÉRENTES** !

---

## 📍 ÉTAPE 1️⃣: REALTIME DATABASE RULES (JSON)

**Localisation:** Firebase Console → **Realtime Database** → **Règles**

**Copier-coller TOUT ça:**

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
          
          "memories": {
            "$memoryId": {
              ".read": "root.child('couplesMembers').child($coupleId).child(auth.uid).exists()",
              ".write": "root.child('couplesMembers').child($coupleId).child(auth.uid).exists()"
            }
          },
          
          "challenges": {
            "$challengeId": {
              ".read": "root.child('couplesMembers').child($coupleId).child(auth.uid).exists()",
              ".write": "root.child('couplesMembers').child($coupleId).child(auth.uid).exists()"
            }
          },
          
          "bucketList": {
            "$itemId": {
              ".read": "root.child('couplesMembers').child($coupleId).child(auth.uid).exists()",
              ".write": "root.child('couplesMembers').child($coupleId).child(auth.uid).exists()"
            }
          },
          
          "loveNotes": {
            "$noteId": {
              ".read": "root.child('couplesMembers').child($coupleId).child(auth.uid).exists()",
              ".write": "root.child('couplesMembers').child($coupleId).child(auth.uid).exists()"
            }
          },
          
          "timeCapsules": {
            "$capsuleId": {
              ".read": "root.child('couplesMembers').child($coupleId).child(auth.uid).exists()",
              ".write": "root.child('couplesMembers').child($coupleId).child(auth.uid).exists()"
            }
          },
          
          "scheduledLetters": {
            "$letterId": {
              ".read": "root.child('couplesMembers').child($coupleId).child(auth.uid).exists()",
              ".write": "root.child('couplesMembers').child($coupleId).child(auth.uid).exists()"
            }
          },
          
          "sharedDiary": {
            "$entryId": {
              ".read": "root.child('couplesMembers').child($coupleId).child(auth.uid).exists()",
              ".write": "root.child('couplesMembers').child($coupleId).child(auth.uid).exists()"
            }
          }
        },
        
        "pushTokens": {
          ".read": "root.child('couplesMembers').child($coupleId).child(auth.uid).exists()",
          ".write": "root.child('couplesMembers').child($coupleId).child(auth.uid).exists()"
        },
        
        "chat": {
          "messages": {
            ".read": "root.child('couplesMembers').child($coupleId).child(auth.uid).exists()",
            ".write": "root.child('couplesMembers').child($coupleId).child(auth.uid).exists()"
          },
          
          "typing": {
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

**Puis cliquer:** `Publier`

---

## 📍 ÉTAPE 2️⃣: FIREBASE STORAGE RULES (JavaScript)

**Localisation:** Firebase Console → **Storage** → **Règles**

**Copier-coller:**

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /couples/{coupleId}/{allPaths=**} {
      allow read, write: if request.auth != null && 
        exists(/databases/(default)/documents/couplesMembers/{coupleId}/{request.auth.uid});
      allow read, write: if request.auth != null;
    }
  }
}
```

**Puis cliquer:** `Publier`

---

## � ÉTAPE 3️⃣: INDEXATION (Optionnel)

**Localisation:** Firebase Console → **Realtime Database** → **Indexation**

Ajouter ces index:

### Index 1:
```
Collection: couples/{coupleId}/data/memories
Field: createdAt
Order: Descending
```

### Index 2:
```
Collection: couples/{coupleId}/data/loveNotes
Field: createdAt
Order: Descending
```

### Index 3:
```
Collection: couples/{coupleId}/chat/messages
Field: timestamp
Order: Ascending
```

---

## � ÉTAPE 4️⃣: CONFIGURATION FIREBASE (dans le code)

**Localisation:** `src/config/firebase.js`

**Vérifier qu'il contient:**

```javascript
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project.firebaseio.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const isConfigured = true;
```

---

## � ÉTAPE 5️⃣: CLÉS API

**Localisation:** Firebase Console → Project Settings → **Général**

Copier les clés et les mettre dans `src/config/firebase.js`:
- `apiKey`
- `projectId`
- `databaseURL`
- `messagingSenderId`
- `appId`

---

## 📍 ÉTAPE 6️⃣: STRUCTURE DES DONNÉES (Créée automatiquement)

Voici comment les données seront organisées:

```
firebase_project/
├── couples/
│   ├── couple_1707298800000/
│   │   ├── code: "LOVE-ABC123"
│   │   ├── name: "Notre Couple"
│   │   ├── anniversary: "14/02/2023"
│   │   ├── loveMeter: 75
│   │   ├── createdAt: "2026-02-07T10:00:00Z"
│   │   ├── updatedAt: "2026-02-07T10:00:00Z"
│   │   │
│   │   ├── members/
│   │   │   ├── user_123/
│   │   │   │   ├── name: "Alice"
│   │   │   │   ├── email: "alice@example.com"
│   │   │   │   ├── avatar: "💕"
│   │   │   │   ├── isOnline: true
│   │   │   │   ├── joinedAt: "2026-02-07T10:00:00Z"
│   │   │   │   └── isCreator: true
│   │   │   │
│   │   │   └── user_456/
│   │   │       ├── name: "Bob"
│   │   │       ├── email: "bob@example.com"
│   │   │       ├── avatar: "💕"
│   │   │       ├── isOnline: false
│   │   │       ├── joinedAt: "2026-02-07T10:30:00Z"
│   │   │       └── isCreator: false
│   │   │
│   │   ├── data/
│   │   │   ├── memories/
│   │   │   │   └── memory_1707298800000/
│   │   │   │       ├── id: "memory_1707298800000"
│   │   │   │       ├── title: "Première rencontre"
│   │   │   │       ├── date: "14/02/2023"
│   │   │   │       ├── imageUri: "..."
│   │   │   │       ├── addedBy: "Alice"
│   │   │   │       └── createdAt: "2026-02-07T10:00:00Z"
│   │   │   │
│   │   │   ├── challenges/
│   │   │   │   └── challenge_1707298800000/
│   │   │   │       ├── id: "challenge_1707298800000"
│   │   │   │       ├── title: "Compliment Surprise"
│   │   │   │       ├── completed: true
│   │   │   │       └── completedAt: "2026-02-07T10:00:00Z"
│   │   │   │
│   │   │   ├── bucketList/
│   │   │   │   └── item_1707298800000/
│   │   │   │       ├── id: "item_1707298800000"
│   │   │   │       ├── text: "Voyager en Italie"
│   │   │   │       ├── completed: false
│   │   │   │       └── createdAt: "2026-02-07T10:00:00Z"
│   │   │   │
│   │   │   ├── loveNotes/
│   │   │   │   └── note_1707298800000/
│   │   │   │       ├── id: "note_1707298800000"
│   │   │   │       ├── text: "U2FsdGVkX1..." (CHIFFRÉ)
│   │   │   │       ├── from: "Alice"
│   │   │   │       ├── read: true
│   │   │   │       └── createdAt: "2026-02-07T10:00:00Z"
│   │   │   │
│   │   │   ├── timeCapsules/
│   │   │   │   └── capsule_1707298800000/
│   │   │   │       ├── id: "capsule_1707298800000"
│   │   │   │       ├── title: "Nos promesses"
│   │   │   │       ├── openDate: "14/02/2030"
│   │   │   │       ├── content: "..."
│   │   │   │       └── createdAt: "2026-02-07T10:00:00Z"
│   │   │   │
│   │   │   ├── scheduledLetters/
│   │   │   │   └── letter_1707298800000/
│   │   │   │       ├── id: "letter_1707298800000"
│   │   │   │       ├── title: "Lettre d'amour"
│   │   │   │       ├── content: "..."
│   │   │   │       ├── deliveryDate: "14/02/2027"
│   │   │   │       ├── delivered: false
│   │   │   │       └── createdAt: "2026-02-07T10:00:00Z"
│   │   │   │
│   │   │   ├── sharedDiary/
│   │   │   │   └── entry_1707298800000/
│   │   │   │       ├── id: "entry_1707298800000"
│   │   │   │       ├── content: "..."
│   │   │   │       ├── authorId: "user_123"
│   │   │   │       ├── mood: "😊"
│   │   │   │       └── createdAt: "2026-02-07T10:00:00Z"
│   │   │   │
│   │   │   └── quizScores/
│   │   │       ├── user_123: 85
│   │   │       └── user_456: 92
│   │   │
│   │   ├── pushTokens/
│   │   │   ├── user_123: "ExponentPushToken[...]"
│   │   │   └── user_456: "ExponentPushToken[...]"
│   │   │
│   │   └── chat/
│   │       ├── messages/
│   │       │   └── msg_1707298800000/
│   │       │       ├── id: "msg_1707298800000"
│   │       │       ├── content: "U2FsdGVkX1..." (CHIFFRÉ)
│   │       │       ├── senderId: "user_123"
│   │       │       ├── senderName: "Alice"
│   │       │       ├── type: "text"
│   │       │       ├── timestamp: "2026-02-07T10:00:00Z"
│   │       │       ├── read: true
│   │       │       └── reactions: {}
│   │       │
│   │       └── typing/
│   │           └── user_123: "2026-02-07T10:00:00Z"
│   │
│   └── couple_1707298801000/
│       └── ... (même structure)
│
└── couplesMembers/
    ├── couple_1707298800000/
    │   ├── user_123: true
    │   └── user_456: true
    │
    └── couple_1707298801000/
        └── ...
```

---

## 📍 ÉTAPE 7️⃣: AUTHENTIFICATION

**Localisation:** Firebase Console → **Authentication** → **Sign-in method**

Activer:
- ✅ **Email/Password**
- ✅ **Anonymous** (optionnel)

---

## 📍 ÉTAPE 8️⃣: VÉRIFIER LA SÉCURITÉ

**Localisation:** Firebase Console → **Realtime Database** → **Données**

Vérifier qu'on **NE PEUT PAS** accéder sans authentification:
```
❌ Anonymous access BLOQUÉ
❌ Read/Write sans auth BLOQUÉ
✅ Seulement les membres du couple peuvent lire/écrire
```

---

## � RÉSUMÉ DES ÉTAPES

1. ✅ **ÉTAPE 1** → Copier-coller les **Realtime Database Rules** (JSON) dans Firebase Console
2. ✅ **ÉTAPE 2** → Copier-coller les **Storage Rules** (JavaScript) dans Firebase Console  
3. ✅ **ÉTAPE 3** → Ajouter les **Indexations** (optionnel)
4. ✅ **ÉTAPE 4** → Vérifier **firebase.js** avec tes clés
5. ✅ **ÉTAPE 5** → Vérifier **Structure des données**
6. ✅ **ÉTAPE 6** → Activer **Email/Password** Authentication
7. ✅ **ÉTAPE 7** → Vérifier la sécurité

---

## ✅ CHECKLIST FINALE

- [ ] **Realtime Database Rules** publiées (JSON) ← ÉTAPE 1
- [ ] **Storage Rules** publiées (JavaScript) ← ÉTAPE 2
- [ ] **Indexations** ajoutées (optionnel) ← ÉTAPE 3
- [ ] **firebase.js** configuré avec tes clés ← ÉTAPE 5
- [ ] **Authentication** Email/Password activée ← ÉTAPE 7
- [ ] Authentication Email/Password activé
- [ ] firebase.js configuré avec VRAIES clés
- [ ] Chat réactivé dans ChatScreen.js ✅
- [ ] Chiffrement appliqué sur messages ✅
- [ ] crypto-js installé ✅
- [ ] Tests sur Android device
- [ ] Push notifications testées

✅ **PRÊT À LANCER!**
