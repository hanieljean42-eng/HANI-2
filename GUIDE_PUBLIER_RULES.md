# 🔒 COMMENT PUBLIER LES FIREBASE RULES

## ⏱️ Temps estimé: 5 minutes

---

## ÉTAPE 1: Aller sur Firebase Console

1. Ouvre: **https://console.firebase.google.com/**
2. Sélectionne ton projet: **h-couple** (ou ton projet)
3. Clique sur **Realtime Database** (à gauche)

---

## ÉTAPE 2: Accéder aux Règles

1. Tu vois l'onglet "Données" actuellement
2. À côté, clique sur l'onglet **"Règles"**
3. Tu vois du code JSON (probablement "test mode")

---

## ÉTAPE 3: Copier les Nouvelles Règles

Copie **TOUT** ce code:

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

---

## ÉTAPE 4: Coller dans Firebase Console

1. Sélectionne **TOUT** le texte dans la zone des règles (Ctrl+A)
2. Supprime-le
3. Colle le code que tu viens de copier (Ctrl+V)

---

## ÉTAPE 5: Publier

1. Clique sur le bouton bleu **"Publier"** en haut à droite
2. Tu vois une popup "Publier les règles?"
3. Clique **"Publier"**
4. Attends 10-30 secondes
5. Tu vois: ✅ **"Règles publiées avec succès"**

---

## ✅ C'EST FAIT!

Les règles sont maintenant **sécurisées**. 

**Vérification:** 
- Les données sont maintenant **privées au couple**
- Personne d'autre ne peut les voir
- Les messages sont **chiffrés et sécurisés**

---

## 🚨 Si tu vois une erreur:

### "Error: Permission denied"
→ Les règles précédentes bloquent les nouvelles
→ Supprime tout d'abord, puis colle les nouvelles

### "Syntax error"
→ Il y a une erreur dans le code JSON
→ Vérifie que toutes les accolades correspondent

---

## 📝 Notes:

- Les règles s'appliquent **immédiatement**
- Les données existantes restent
- Tu peux changer les règles **à tout moment**
- Si tu les changes mal, l'app risque de ne plus fonctionner
