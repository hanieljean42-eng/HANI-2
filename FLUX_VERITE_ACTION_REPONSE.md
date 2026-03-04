# 🎮 FLUX COMPLET : COMMENT LE PARTENAIRE RÉPOND EN VÉRITÉ/ACTION

## 📊 ARCHITECTURE EN 4 PHASES

```
PHASE 1: JE CHOISIS (Joueur A)
    ↓
PHASE 2: PARTENAIRE REÇOIT LA QUESTION (Joueur B - Firebase sync)
    ↓
PHASE 3: PARTENAIRE RÉPOND (Joueur B)
    ↓
PHASE 4: AFFICHAGE RÉPONSE (Joueur A et B - Firebase sync)
```

---

## 🔍 DÉTAIL COMPLET

### PHASE 1️⃣ : JE CHOISIS (isMyTurnToAsk = true)

**Écran affiché** : [GamesScreen.js ligne 1340-1368](GamesScreen.js#L1340)

```
┌─────────────────────────────────────┐
│  🎯 C'est ton tour de poser une   │
│  question à Marie                   │
│  Tour 1                             │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Choisis pour Marie :               │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  💬 VÉRITÉ                  │    │
│  │ Marie devra répondre        │    │
│  │ honnêtement                 │    │
│  └─────────────────────────────┘    │
│                ou                   │
│  ┌─────────────────────────────┐    │
│  │  ⚡ ACTION                  │    │
│  │ Marie devra faire un défi   │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

**Code** : [GamesScreen.js ligne 435-475](GamesScreen.js#L435)

```javascript
const selectTruthOrDare = async (type) => {
  // 1. Choisir une question/action aléatoire
  const items = type === 'truth' ? TRUTH_OR_DARE.truths : TRUTH_OR_DARE.dares;
  const random = items[Math.floor(Math.random() * items.length)];
  
  // 2. Sauvegarder localement
  setTruthOrDare(selection);
  
  // 3. Déterminer les rôles
  if (isMyTurnToAsk) {
    // C'est MOI qui pose
    setTodAsker(myName);          // ← "Jean"
    setTodAnswerer(partnerName);  // ← "Marie"
    setTodPhase('waiting');       // ← J'attends la réponse
  }
  
  // 4. **IMPORTANT**: Envoyer la question à Firebase
  if (gameMode === 'online' && isFirebaseReady) {
    await submitAnswer(`tod_question_${todRound}`, {
      type,                              // 'truth' ou 'dare'
      text: random,                      // La question/action
      askedBy: myName,                   // "Jean"
      mustAnswerBy: partnerName,         // "Marie"
      round: todRound,                   // Tour 0, 1, 2...
      timestamp: Date.now()
    }, myName);
    // ↓↓↓ ÉCRIT DANS FIREBASE ↓↓↓
    // /games/{coupleId}/session/answers/tod_question_0/jean_id = {...}
  }
};
```

**Résultat Firebase** :
```javascript
// /games/{coupleId}/session/answers/
{
  "tod_question_0": {
    "jean_id": {
      "type": "truth",
      "text": "Quel est mon plat préféré ?",
      "askedBy": "Jean",
      "mustAnswerBy": "Marie",
      "round": 0,
      "timestamp": 1707000000000
    }
  }
}
```

---

### PHASE 2️⃣ : PARTENAIRE REÇOIT LA QUESTION (Firebase Listener)

**Listener** : [GameContext.js ligne 46-85](GameContext.js#L46)

```javascript
useEffect(() => {
  if (!coupleId || !isFirebaseReady || !database || !myPlayerId) return;
  
  const sessionRef = ref(database, `games/${coupleId}/session`);
  
  const unsubscribe = onValue(sessionRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      // ↓↓↓ MIS À JOUR EN TEMPS RÉEL ↓↓↓
      setGameData(data);
      // gameData.answers = {
      //   "tod_question_0": {
      //     "jean_id": { type, text, askedBy, mustAnswerBy, ... }
      //   }
      // }
    }
  });
  
  return () => unsubscribe();  // Cleanup
}, [coupleId, isFirebaseReady, myPlayerId]);
```

**Ce qui se passe sur l'écran de Marie** :

```javascript
// Marie voit que la question est arrivée via gameData
// Le listener Firebase a déclenché un re-render

// Affichage : [GamesScreen.js ligne 1390-1410]
{truthOrDare && (
  <View>
    {/* Qui pose à qui */}
    <Text>Jean demande à Marie :</Text>
    
    {/* Type */}
    <Text>💬 VÉRITÉ</Text>
    
    {/* La question */}
    <Text>Quel est mon plat préféré ?</Text>
    
    {/* Champ réponse APPARAÎT si c'est mon tour de répondre */}
    {todAnswerer === myName && !todSubmitted && (
      <TextInput
        placeholder="Tape ta réponse ici..."
      />
    )}
  </View>
)}
```

**Écran de Marie** :

```
┌─────────────────────────────────────┐
│ ⏳ C'est au tour de Jean de te      │
│ poser une question                  │
│ Tour 1                              │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Jean demande à Marie :             │
│                                     │
│  💬 VÉRITÉ                          │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ Quel est mon plat préféré?  │    │
│  └─────────────────────────────┘    │
│                                     │
│  📝 Écris ta réponse pour Jean :    │
│  ┌─────────────────────────────┐    │
│  │ Tape ta réponse ici...      │    │
│  │ [                        ]  │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌──────────────────────────────┐   │
│  │ Envoyer ma réponse à Jean ✓  │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Timeline** :
- T=0: Jean envoie la question
- T=50-200ms: Firebase propage le changement
- T=50-500ms: Listener de Marie déclenche
- T=50-500ms: gameData se met à jour
- T=50-500ms: Marie voit la question à l'écran

---

### PHASE 3️⃣ : PARTENAIRE RÉPOND

**Code** : [GamesScreen.js ligne 475-490](GamesScreen.js#L475)

```javascript
const submitTodResponse = async () => {
  // 1. Vérifier que la réponse n'est pas vide
  if (!todResponse.trim()) {
    Alert.alert('Oops', 'Écris ta réponse avant de soumettre !');
    return;
  }
  
  // 2. Marquer comme soumis localement
  setTodSubmitted(true);
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  
  // 3. **IMPORTANT**: Envoyer la réponse à Firebase
  if (gameMode === 'online' && isFirebaseReady) {
    await submitAnswer(`tod_response_${todRound}`, {
      response: todResponse.trim(),        // "Pâtes carbonara"
      respondedBy: user?.name || 'Moi',    // "Marie"
      question: truthOrDare,               // La question complète
      round: todRound,                     // Tour 0
      timestamp: Date.now()
    }, user?.name);
    // ↓↓↓ ÉCRIT DANS FIREBASE ↓↓↓
    // /games/{coupleId}/session/answers/tod_response_0/marie_id = {...}
  }
};
```

**Ce que Marie tape** :

```
Input: "Pâtes carbonara"
↓
Click: "Envoyer ma réponse à Jean ✓"
↓
Firebase: /games/{coupleId}/session/answers/tod_response_0/marie_id = {
  response: "Pâtes carbonara",
  respondedBy: "Marie",
  question: { type: 'truth', text: 'Quel est mon plat préféré?' },
  round: 0,
  timestamp: 1707000000100
}
↓
Screen update: todSubmitted = true
```

**Écran de Marie après envoi** :

```
┌─────────────────────────────────────┐
│  ✅ Réponse de Marie :              │
│  ┌─────────────────────────────┐    │
│  │ Pâtes carbonara             │    │
│  └─────────────────────────────┘    │
│                                     │
│  💕 En attente de la réponse de    │
│  Jean...                           │
│  🔄 (chargement)                    │
│                                     │
│  ┌──────────────────────────────┐   │
│  │ Tour Suivant →               │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

---

### PHASE 4️⃣ : AFFICHAGE RÉPONSE (Synchronisation Firebase)

**Fonction de Récupération** : [GamesScreen.js ligne 540-553](GamesScreen.js#L540)

```javascript
const getPartnerTodResponse = useCallback(() => {
  if (!gameData?.answers) return null;
  
  // Clé où la réponse du partenaire est stockée
  const responseKey = `tod_response_${todRound}`;
  
  // Récupérer toutes les réponses pour ce tour
  const responses = gameData.answers[responseKey];
  if (!responses) return null;
  
  // Trouver la réponse qui n'est PAS la mienne
  for (const [playerId, data] of Object.entries(responses)) {
    if (data.respondedBy !== user?.name) {  // ← Si ce n'est pas moi
      return data;                          // ← Retourner la réponse du partenaire
    }
  }
  return null;
}, [gameData, todRound, user?.name]);
```

**Affichage Réponse Partenaire** : [GamesScreen.js ligne 1515-1540](GamesScreen.js#L1515)

```javascript
{gameMode === 'online' && (
  <View style={styles.todPartnerSection}>
    {(() => {
      // Récupérer la réponse du partenaire
      const partnerResponse = getPartnerTodResponse();
      
      if (partnerResponse) {
        // ✅ Réponse reçue
        return (
          <>
            <Text style={styles.todPartnerLabel}>
              💕 Réponse de {partnerResponse.respondedBy} :
            </Text>
            <View style={styles.todPartnerAnswerBox}>
              <Text style={styles.todPartnerAnswerText}>
                {partnerResponse.response}
              </Text>
            </View>
          </>
        );
      } else {
        // ⏳ En attente
        return (
          <View style={styles.todWaitingPartner}>
            <ActivityIndicator size="small" color="#FF6B9D" />
            <Text style={styles.todWaitingText}>
              En attente de la réponse de {partnerName}...
            </Text>
          </View>
        );
      }
    })()}
  </View>
)}
```

**Écran de Jean après que Marie répond** :

```
┌─────────────────────────────────────┐
│  Jean demande à Marie :             │
│                                     │
│  💬 VÉRITÉ                          │
│  Quel est mon plat préféré ?        │
│                                     │
│  ✅ Réponse de Jean :               │
│  ┌─────────────────────────────┐    │
│  │ Pâtes                       │    │
│  └─────────────────────────────┘    │
│                                     │
│  💕 Réponse de Marie :              │
│  ┌─────────────────────────────┐    │
│  │ Pâtes carbonara             │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌──────────────────────────────┐   │
│  │ Tour Suivant →               │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

---

## 🔄 FLUX TEMPS RÉEL COMPLET (Timeline)

```
INSTANT T=0:00
├─ Jean: Clique "VÉRITÉ"
├─ App: selectTruthOrDare('truth')
├─ App: Sélectionne "Quel est mon plat préféré ?"
├─ Firebase: Écrit dans /answers/tod_question_0/jean_id
└─ Jean's Screen: Affiche "Vérité" + "En attente de Marie..."

INSTANT T=0:05 (Listener Firebase)
├─ Listener de Marie: Déclenché par le changement Firebase
├─ gameData: Mis à jour localement
├─ Marie's Screen: Re-render
└─ Marie voit: "Jean demande: Quel est mon plat préféré ?" + Champ réponse

INSTANT T=0:10
├─ Marie: Tape "Pâtes carbonara"
├─ Marie: Clique "Envoyer ma réponse à Jean ✓"
├─ App: submitTodResponse()
├─ todSubmitted: true (local)
├─ Firebase: Écrit dans /answers/tod_response_0/marie_id
└─ Marie's Screen: "En attente de la réponse de Jean..."

INSTANT T=0:15 (Listener Firebase)
├─ Listener de Jean: Déclenché par le nouveau fichier Firebase
├─ gameData: Mis à jour avec tod_response_0
├─ getPartnerTodResponse(): Trouve "Pâtes carbonara"
├─ Jean's Screen: Re-render
└─ Jean voit: "Réponse de Marie: Pâtes carbonara" ✅

INSTANT T=0:20
├─ Marie ou Jean: Clique "Tour Suivant →"
├─ nextTodRound():
│  ├─ setTodHistory([..., { question, response, asker, answerer }])
│  ├─ setTruthOrDare(null)
│  ├─ setTodRound(1)
│  ├─ setTodPhase('choose')
│  └─ setIsMyTurnToAsk(prev => !prev)  // ← ALTERNÉ!
└─ Retour au PHASE 1 avec isMyTurnToAsk = false (c'est Marie qui pose)
```

---

## 📊 FIREBASE STRUCTURE (TOUR 0)

```javascript
/games/{coupleId}/session/answers/
{
  "tod_question_0": {
    "jean_id": {
      type: "truth",
      text: "Quel est mon plat préféré ?",
      askedBy: "Jean",
      mustAnswerBy: "Marie",
      round: 0,
      timestamp: 1707000000000
    }
  },
  "tod_response_0": {
    "jean_id": {
      response: "Pâtes",
      respondedBy: "Jean",
      question: { type: "truth", text: "..." },
      round: 0,
      timestamp: 1707000000050
    },
    "marie_id": {
      response: "Pâtes carbonara",
      respondedBy: "Marie",
      question: { type: "truth", text: "..." },
      round: 0,
      timestamp: 1707000000100
    }
  }
}
```

---

## ⚠️ CAS PARTICULIERS

### Cas 1: MODE LOCAL (pas online)

```javascript
// Si gameMode === 'local' ou Firebase non configuré:

// La question n'est PAS envoyée à Firebase
// Les deux joueurs doivent se passer le téléphone manuellement

// Écran Phase 1 (Jean):
// "Passe le téléphone à Marie pour qu'elle choisisse"

// Écran Attente (Jean):
// Bouton: "👋 Marie est prête à choisir"
// → Jean clique → setIsMyTurnToAsk(true)

// Pas de synchronisation temps réel
```

### Cas 2: ACTION (pas de texte)

```javascript
// Au lieu de TextInput, deux boutons:

const confirmActionDone = async () => {
  setTodResponse('✅ Action réalisée !');
  
  if (gameMode === 'online' && isFirebaseReady) {
    await submitAnswer(`tod_response_${todRound}`, {
      response: '✅ Action réalisée !',  // ← Confirmation
      respondedBy: user?.name,
      question: truthOrDare,
      round: todRound,
      timestamp: Date.now()
    }, user?.name);
  }
};

// Bouton: "✅ J'ai fait l'action !"
// Bouton: "😅 Je passe..."
```

### Cas 3: PARTENAIRE DISPARAÎT (timeout)

```javascript
// Si la réponse du partenaire n'arrive pas dans 60s:

const waitForPartnerAnswer = async (questionIndex, timeoutMs = 60000) => {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      if (checkBothAnswered(questionIndex)) {
        resolve(true);  // ✅ Les deux ont répondu
      } else if (Date.now() - startTime > timeoutMs) {
        resolve(false); // ❌ Timeout
        // → Afficher "Partenaire n'a pas répondu"
      }
    }, 500);
  });
};
```

---

## 🎯 RÉSUMÉ : 4 ÉTAPES

| Étape | Action | Stockage | Sync Firebase |
|-------|--------|----------|---------------|
| 1 | Je choisis Vérité/Action | Local state | ✅ Oui |
| 2 | Partenaire reçoit | Listener Firebase | ✅ Automatic |
| 3 | Partenaire répond | Local state | ✅ Oui |
| 4 | Affichage réponse | Via getPartnerTodResponse() | ✅ Automatic |

---

## 🔮 AMÉLIORATIONS POSSIBLES

1. **Indicateur "Partenaire en train de taper"** (typing indicator)
2. **Limite de temps** : "45 secondes pour répondre"
3. **Réactions** : "👍 😂 ❤️" aux réponses
4. **Sauvegarde Historique** : Accès aux anciennes parties
5. **Notification Push** : "Jean t'a posé une question!"

---

**Dernière mise à jour** : 7 février 2026
