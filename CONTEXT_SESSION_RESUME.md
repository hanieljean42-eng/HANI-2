# 📋 RÉSUMÉ DE SESSION - CORRECTIONS DE NOTIFICATIONS

## 🎯 OBJECTIF
Corriger TOUS les 6 bugs de notifications pour passer en production.

## 🐛 LES 6 BUGS À CORRIGER

### 1. ❌ sendPushNotification() appelle scheduleLocalNotification en cascade
- **Fichier**: [src/context/NotificationContext.js](src/context/NotificationContext.js)
- **Problème**: Chaque fois que sendPushNotification() appelle scheduleLocalNotification(), on reçoit 2 fois la notification
- **Solution**: Réorganiser la logique pour avoir sendPushNotification() OU scheduleLocalNotification(), pas les deux
- **Status**: À corriger

### 2. ❌ Listener partnerToken race condition  
- **Fichier**: [src/context/NotificationContext.js](src/context/NotificationContext.js)
- **Problème**: Si listener partnerToken se déclenche avant que sendTokenToFirebase() finisse, le token n'existe pas encore
- **Solution**: Attendre que le token soit sauvé AVANT de s'abonner au partnerToken
- **Status**: À corriger

### 3. ❌ saveTokenToFirebase() double appel
- **Fichier**: [src/context/NotificationContext.js](src/context/NotificationContext.js)
- **Problème**: Appelée 2 fois (useEffect cleanup + manuelle)
- **Solution**: Deduplicate avec flag `isTokenSaved`
- **Status**: À corriger

### 4. ❌ notifyGameInvite() pas appelée à chaque tour
- **Fichier**: [src/hooks/useNotifyPartner.js](src/hooks/useNotifyPartner.js) + écrans
- **Problème**: Les notifications ne sont envoyées qu'à la création du jeu, pas à chaque tour/phase
- **Solution**: Ajouter appels manquants dans ChallengesScreen et GamesScreen
- **Status**: À corriger

### 5. ❌ off() cleanup peut échouer  
- **Fichier**: [src/context/NotificationContext.js](src/context/NotificationContext.js)
- **Problème**: Appel à off() sans vérifier si listener existe
- **Solution**: Stocker référence du listener, utiliser cleanup propre
- **Status**: À corriger

### 6. ❌ Wheel spin notifications jamais intégrées
- **Fichier**: [src/screens/WheelScreen.js](src/screens/WheelScreen.js) (si existe)
- **Problème**: Aucun appel à notifyWheelSpin() trouvé
- **Solution**: Ajouter appel après chaque tour de roue
- **Status**: À vérifier

## 📁 FICHIERS PRINCIPAUX À MODIFIER

1. **src/context/NotificationContext.js** - Corriger 5 bugs
2. **src/hooks/useNotifyPartner.js** - Vérifier implémentation
3. **src/screens/ChallengesScreen.js** - Ajouter notifications manquantes
4. **src/screens/GamesScreen.js** - Ajouter notifications manquantes
5. **src/screens/WheelScreen.js** - Intégrer notifications Wheel

## 🔍 ÉLÉMENTS CLÉS IDENTIFIÉS

### Notifications disponibles:
```javascript
// Dans useNotifyPartner
- notifyGame(gameName)           // Inviter au jeu
- notifyGameAnswer(gameName)     // Partenaire a répondu
- notifyGameWin(playerName)      // Partenaire a gagné
- notifyGameTurn()               // Ton tour
- notifyChallenge(challengeName) // Défi complété
- notifyWheelSpin(result)        // Roue tournée
```

### Flux des jeux:
- **ChallengesScreen**: Quiz couple en temps réel (Firebase) ✅ Notifs OK
- **GamesScreen**: Games locale + Truth or Dare ❌ Notifs manquantes
- **WheelScreen**: Spin roue ❌ Notifs manquantes

## ⚙️ COMMANDES POUR CORRIGER

```bash
# 1. Lire NotificationContext complet
# 2. Lire useNotifyPartner complet  
# 3. Vérifier ChallengesScreen pour modèle
# 4. Corriger les 6 bugs dans l'ordre
# 5. Tester que chaque notification s'envoie 1 SEULE FOIS
```

## 📊 PROGRESSION

- [x] Identification des 6 bugs
- [x] Localisation des fichiers
- [ ] Correction bug #1 (cascade notifications)
- [ ] Correction bug #2 (race condition token)
- [ ] Correction bug #3 (double appel)
- [ ] Correction bug #4 (notifications manquantes)
- [ ] Correction bug #5 (cleanup off())
- [ ] Correction bug #6 (Wheel spin)
- [ ] Test complet
- [ ] Ready for production

**Dernière mise à jour**: Avant session termine
