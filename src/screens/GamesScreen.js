import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Audio, Video as AvVideo, ResizeMode } from 'expo-av';
import { CLOUDINARY_CONFIG } from '../config/cloudinary';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useNotifyPartner } from '../hooks/useNotifyPartner';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "Quel est mon plat préféré ?",
    type: "open",
  },
  {
    id: 2,
    question: "Où avons-nous eu notre premier rendez-vous ?",
    type: "open",
  },
  {
    id: 3,
    question: "Quelle est ma couleur préférée ?",
    type: "choice",
    options: ["Rouge", "Bleu", "Vert", "Violet", "Rose", "Noir"],
  },
  {
    id: 4,
    question: "Quel est mon film préféré ?",
    type: "open",
  },
  {
    id: 5,
    question: "Qu'est-ce qui me fait le plus rire ?",
    type: "open",
  },
  {
    id: 6,
    question: "Où aimerais-je voyager le plus ?",
    type: "open",
  },
  {
    id: 7,
    question: "Quelle est ma plus grande peur ?",
    type: "open",
  },
  {
    id: 8,
    question: "Quel super-pouvoir je voudrais avoir ?",
    type: "choice",
    options: ["Voler", "Invisible", "Téléportation", "Lire les pensées", "Super force", "Contrôler le temps"],
  },
  {
    id: 9,
    question: "Quel est mon rêve le plus fou ?",
    type: "open",
  },
  {
    id: 10,
    question: "Qu'est-ce qui me rend le plus heureux/heureuse ?",
    type: "open",
  },
  {
    id: 11,
    question: "Quel est mon plus beau souvenir avec toi ?",
    type: "open",
  },
  {
    id: 12,
    question: "Quel artiste ou musicien j'aime le plus ?",
    type: "open",
  },
  {
    id: 13,
    question: "Quel type d'animal j'aimerais avoir ?",
    type: "choice",
    options: ["Chat", "Chien", "Oiseau", "Poisson", "Aucun", "Autre"],
  },
  {
    id: 14,
    question: "Quelle est ma saison préférée ?",
    type: "choice",
    options: ["Printemps", "Été", "Automne", "Hiver"],
  },
  {
    id: 15,
    question: "Quel est mon nombre porte-bonheur ?",
    type: "open",
  },
  {
    id: 16,
    question: "Quel hobby je pratique le plus souvent ?",
    type: "open",
  },
  {
    id: 17,
    question: "Quelle est ma plus grande qualité selon moi ?",
    type: "open",
  },
  {
    id: 18,
    question: "Si j'avais un jour de libre, je ferais quoi ?",
    type: "open",
  },
  {
    id: 19,
    question: "Quel est mon plus grand rêve professionnel ?",
    type: "open",
  },
  {
    id: 20,
    question: "Quel moment avec toi je voudrais revivre ?",
    type: "open",
  },
  // Nouvelles questions Quiz
  {
    id: 21,
    question: "Quelle est ma boisson favorite ?",
    type: "open",
  },
  {
    id: 22,
    question: "Quelle est ma série préférée ?",
    type: "open",
  },
  {
    id: 23,
    question: "Quelle est ma destination de voyage idéale ?",
    type: "open",
  },
  {
    id: 24,
    question: "Quelle matière j'aimais le plus à l'école ?",
    type: "open",
  },
  {
    id: 25,
    question: "Quelle matière je détestais le plus ?",
    type: "open",
  },
  {
    id: 26,
    question: "Quel est mon sport préféré ?",
    type: "open",
  },
  {
    id: 27,
    question: "Quel est mon plus grand défaut ?",
    type: "open",
  },
  {
    id: 28,
    question: "Quelle est ma plus grande fierté ?",
    type: "open",
  },
  {
    id: 29,
    question: "Quelle est mon habitude la plus étrange ?",
    type: "open",
  },
  {
    id: 30,
    question: "Quelle est ma plus grande faiblesse ?",
    type: "open",
  },
  {
    id: 31,
    question: "Quelle est ma plus grande passion ?",
    type: "open",
  },
  {
    id: 32,
    question: "Quelle était ma plus grande peur enfant ?",
    type: "open",
  },
  {
    id: 33,
    question: "Quelle est mon envie actuelle la plus forte ?",
    type: "open",
  },
  {
    id: 34,
    question: "Quelle est la surprise qui m'a le plus marqué ?",
    type: "open",
  },
  {
    id: 35,
    question: "Quelle est ma plus grande déception ?",
    type: "open",
  },
  {
    id: 36,
    question: "Quelle est ma plus grande réussite ?",
    type: "open",
  },
  {
    id: 37,
    question: "Quel est mon plus grand regret ?",
    type: "open",
  },
  {
    id: 38,
    question: "Quelle est ma première habitude le matin ?",
    type: "open",
  },
  {
    id: 39,
    question: "Quelle est ma dernière habitude le soir ?",
    type: "open",
  },
  {
    id: 40,
    question: "Quel est mon plat préféré au restaurant ?",
    type: "open",
  },
  {
    id: 41,
    question: "Quelle est ma chanson préférée ?",
    type: "open",
  },
  {
    id: 42,
    question: "Quelle est ma tenue préférée ?",
    type: "open",
  },
  {
    id: 43,
    question: "Quelle est ma plus grande habitude romantique ?",
    type: "open",
  },
  {
    id: 44,
    question: "Quelle est ma plus grande habitude de couple ?",
    type: "open",
  },
  {
    id: 45,
    question: "Quelle est ma plus grande habitude intime ?",
    type: "open",
  },
  {
    id: 46,
    question: "Quel est mon rêve secret ?",
    type: "open",
  },
  {
    id: 47,
    question: "Quelle est ma plus grande honte ?",
    type: "open",
  },
  {
    id: 48,
    question: "Quelle est ma manie la plus marquée ?",
    type: "open",
  },
  {
    id: 49,
    question: "Quelle est ma plus grande force ?",
    type: "open",
  },
  {
    id: 50,
    question: "Quelle est ma plus grosse dépense récente ?",
    type: "open",
  },
];

const TRUTH_OR_DARE = {
  truths: [
    // Vérités Classiques Couple
    "Qu'est-ce que tu préfères le plus chez moi ?",
    "Quel moment avec moi t'a le plus marqué ?",
    "C'est quoi ton souvenir le plus drôle de nous deux ?",
    "Qu'est-ce que je fais qui te fait craquer direct ?",
    "Si tu pouvais changer une chose dans notre couple, ce serait quoi ?",
    "Tu te souviens de notre premier moment gênant ?",
    "Quelle est ta plus grande peur dans notre relation ?",
    "Qu'est-ce que tu veux qu'on fasse ensemble cette année ?",
    "Quel surnom tu préfères que je te donne ?",
    "Tu es fier/fière de quoi chez moi ?",
    "Quel est ton moment préféré quand on est seuls ?",
    "Qu'est-ce que je fais mieux que tout le monde pour toi ?",
    "Tu préfères qu'on sorte ou qu'on reste à la maison ensemble ?",
    "Quel est ton rêve de couple idéal ?",
    "Qu'est-ce que tu aimerais que je fasse plus souvent ?",
    "Quel est le plus beau compliment que tu m'as jamais fait ?",
    "Si on partait demain, tu voudrais aller où avec moi ?",
    "Qu'est-ce qui te rassure le plus chez moi ?",
    "Tu te vois avec moi dans 5 ans ?",
    "Quelle est la chose la plus romantique que je pourrais faire ?",
    "C'est quoi ton moment préféré quand je suis jaloux/jalouse ?",
    "Tu préfères qu'on se taquine ou qu'on soit sérieux ?",
    "Quelle habitude chez moi te fait sourire ?",
    "Tu aimerais qu'on vive où ensemble ?",
    "Quel est ton plus grand objectif avec moi ?",
    // Vérités Intimes (18+)
    "Quel est ton fantasme secret avec moi ?",
    "Qu'est-ce qui t'excite le plus chez moi ?",
    "Quel est l'endroit le plus fou où tu voudrais qu'on soit intimes ?",
    "Quelle tenue tu voudrais me voir porter ?",
    "Quel est ton meilleur souvenir intime avec moi ?",
    "Qu'est-ce que tu n'as jamais osé me demander au lit ?",
    "Quel moment de la journée tu préfères pour les câlins intimes ?",
    "Tu préfères la tendresse ou la passion ?",
    "Qu'est-ce qui te fait le plus d'effet quand je te touche ?",
    "Quel est le geste intime que tu préfères que je fasse ?",
    "As-tu déjà pensé à moi de façon coquine au travail/en cours ?",
    "Quel est ton point sensible préféré ?",
    "Tu préfères les préliminaires longs ou aller droit au but ?",
    "Quelle est ta position préférée avec moi ?",
    "Qu'est-ce qui t'a le plus surpris(e) chez moi intimement ?",
  ],
  dares: [
    // Actions Classiques Couple
    "Fais-moi un câlin de 20 secondes.",
    "Dis-moi 3 choses que tu aimes chez moi.",
    "Fais-moi un bisou sur le front.",
    "Danse avec moi 30 secondes, même sans musique.",
    "Fais une déclaration d'amour version drôle.",
    "Donne-moi un surnom nouveau maintenant.",
    "Écris 'je t'aime' d'une manière originale.",
    "Fais-moi rire tout de suite.",
    "Regarde-moi dans les yeux 15 secondes sans parler.",
    "Fais un compliment très précis sur moi.",
    "Fais semblant de me demander en mariage (juste pour rire).",
    "Prends une photo de nous deux maintenant.",
    "Choisis notre prochaine sortie en amoureux.",
    "Fais-moi une promesse mignonne.",
    "Fais une imitation de moi.",
    "Dis-moi une phrase romantique comme dans un film.",
    "Donne-moi un bisou surprise.",
    "Chuchote-moi un truc gentil.",
    "Fais un petit massage des épaules 1 minute.",
    "Mets une chanson qui nous représente.",
    "Fais une mini scène 'couple de film' pendant 20 sec.",
    "Dis-moi ton meilleur souvenir de nous en 1 phrase.",
    "Fais un bisou sur la main.",
    "Dis 'je suis chanceux(se) de t'avoir' avec sérieux.",
    // Actions Intimes (18+)
    "Fais-moi un bisou dans le cou.",
    "Murmure-moi quelque chose de coquin à l'oreille.",
    "Enlève un vêtement au choix.",
    "Fais-moi un massage sensuel de 2 minutes.",
    "Embrasse-moi comme si c'était notre premier baiser.",
    "Caresse-moi le visage pendant 30 secondes.",
    "Dis-moi ce que tu vas me faire ce soir.",
    "Fais-moi un slow très collé-serré.",
    "Embrasse une partie de mon corps de ton choix.",
    "Déshabille-moi du regard pendant 20 secondes.",
    "Montre-moi comment tu aimes être embrassé(e).",
    "Fais-moi un câlin très serré en me caressant le dos.",
    "Dis-moi ton plus grand désir avec moi ce soir.",
    "Mordille-moi légèrement l'oreille.",
    "Guide ma main où tu veux.",
  ],
};

const DISTANCE_DARES = [
  // ── SELFIES & EXPRESSIONS ──
  "Fais ta plus belle grimace et envoie le selfie ! 📸",
  "Selfie avec ton plus grand sourire, les yeux plissés ! 📸",
  "Prends un selfie en faisant semblant d'embrasser ton téléphone ! 📸",
  "Selfie avec ton regard le plus séducteur possible ! 📸",
  "Fais une photo de toi avec tes cheveux tous ébouriffés ! 📸",
  "Selfie en imitant la tête d'un emoji au choix ! 📸",
  "Prends un selfie avec quelque chose de rouge sur le bout du nez ! 📸",
  "Photo de toi en train de faire les yeux doux à l'objectif ! 📸",
  "Selfie en faisant la pose la plus ridicule possible ! 📸",
  "Selfie avec tes mains formant un cœur devant ton visage ! 📸",
  "Fais semblant de pleurer de rire et prends le selfie ! 📸",
  "Selfie avec une couronne improvisée avec ce que tu as sous la main ! 📸",
  "Prends un selfie les yeux écarquillés comme si tu me voyais ! 📸",
  "Selfie en soufflant un bisou vers la caméra ! 📸",
  "Photo de toi avec ta plus belle tête de quelqu'un amoureux ! 📸",
  "Selfie avec quelque chose de bleu visible sur toi ! 📸",
  "Fais la pose d'une statue et prends un selfie ! 📸",
  "Selfie en te cachant à moitié derrière un coussin ou oreiller ! 📸",
  "Prends un selfie en imitant la jaquette d'un album musical ! 📸",
  "Selfie les pouces levés comme si tu validais notre relation ! 📸",

  // ── TEXTES & DESSINS ──
  "Écris 'je t'aime' sur ton bras et prends-le en photo ! 📸",
  "Dessine notre portrait de couple et envoie la photo ! 📸",
  "Écris 3 raisons pour lesquelles tu m'aimes sur un papier et envoie la photo ! 📸",
  "Dessine un cœur avec nos initiales et envoie la photo ! 📸",
  "Écris mon prénom de la plus belle façon possible et envoie la photo ! 📸",
  "Écris une promesse pour moi sur un papier et envoie la photo ! 📸",
  "Écris 'tu es à moi' en grand sur un papier et envoie la photo ! 📸",
  "Crée une liste de 5 choses que tu adorerais faire avec moi et prends-la en photo ! 📸",
  "Écris un haïku (3 lignes) sur nous et envoie la photo ! 📸",
  "Dessine ce que tu imagines qu'on ferait ensemble ce soir et envoie la photo ! 📸",
  "Écris la date de notre premier rendez-vous sur un papier et prends-le en photo ! 📸",
  "Dessine notre animal préféré avec nos prénoms et envoie la photo ! 📸",
  "Écris 'tu me manques' en autant de langues que possible sur un papier ! 📸",
  "Fais un dessin qui représente nos 5 ans ensemble (rêvé ou réel) ! 📸",
  "Écris ton plat préféré qu'on doit cuisiner ensemble, illustré ! 📸",

  // ── DANSES & MOUVEMENTS ──
  "Envoie une vidéo de 15 secondes en dansant ta danse préférée ! 🎥",
  "Fais une vidéo de toi qui danse sur notre chanson coup de cœur ! 🎥",
  "Vidéo de 10 secondes : danse en pyjama ou tenue de maison ! 🎥",
  "Imite un danseur professionnel pendant 15 secondes en vidéo ! 🎥",
  "Invente une danse spéciale dédiée à moi et envoie la vidéo ! 🎥",
  "Fais 10 secondes de ta danse la plus ridicule en vidéo ! 🎥",
  "Danse sur une musique classique pendant 15 secondes en vidéo ! 🎥",
  "Fais une chorégraphie de 20 secondes sur la chanson de ton choix ! 🎥",
  "Imite un robot qui danse pendant 15 secondes en vidéo ! 🎥",

  // ── CHANT & MUSIQUE ──
  "Chante le refrain d'une chanson qui te fait penser à moi en vidéo ! 🎥",
  "Siffle ou fredonne notre mélodie préférée en vidéo ! 🎥",
  "Chante 'je t'aime' dans 3 langues différentes en vidéo ! 🎥",
  "Invente une chanson sur nous de 20 secondes et envoie la vidéo ! 🎥",
  "Bats un rythme sur la table et chante quelque chose pour moi ! 🎥",
  "Imite ta chanteuse ou ton chanteur préféré en vidéo de 15 secondes ! 🎥",
  "Chante 'happy birthday' à notre relation en vidéo ! 🎥",

  // ── DÉCLARATIONS VIDÉO ──
  "Fais une vidéo de 20 secondes pour me dire pourquoi tu m'aimes ! 🎥",
  "Vidéo : raconte notre plus beau souvenir ensemble en 30 secondes ! 🎥",
  "Dis-moi en vidéo ce que tu ferais si j'étais là maintenant ! 🎥",
  "Envoie une vidéo de toi en train de me faire une déclaration d'amour ! 🎥",
  "Fais une vidéo de 15 secondes : parle-moi comme si tu me voyais pour la première fois ! 🎥",
  "Vidéo de 20 secondes : dis-moi ce qui me rend unique à tes yeux ! 🎥",
  "Fais une vidéo de 15 secondes en imitant ma façon de parler ! 🎥",
  "Vidéo : dis-moi ton endroit de rêve pour partir en vacances avec moi ! 🎥",
  "Fais une vidéo de 20 secondes pour me dire ce que tu ferais si tu avais une baguette magique ! 🎥",
  "Envoie une vidéo de toi en train de m'expliquer pourquoi tu es la/le meilleur(e) partenaire ! 🎥",
  "Raconte en vidéo ce que tu ressentais le jour où tu as compris que tu m'aimais ! 🎥",

  // ── DÉFIS CHEZ SOI ──
  "Prends en photo la vue depuis ta fenêtre pour moi ! 📸",
  "Photo de l'endroit le plus confortable de chez toi ! 📸",
  "Prends en photo ton plat ou boisson du moment ! 📸",
  "Photo de ton objet préféré chez toi ! 📸",
  "Prends en photo quelque chose qui te fait penser à moi chez toi ! 📸",
  "Photo d'un objet en forme de cœur que tu trouves autour de toi ! 📸",
  "Prends en photo la chose la plus mignonne que tu as chez toi ! 📸",
  "Photo de ta tasse ou verre préféré(e) ! 📸",
  "Prends en photo un objet qui a une valeur sentimentale pour toi ! 📸",
  "Selfie dans la pièce la plus lumineuse de chez toi ! 📸",
  "Photo de tes pieds dans ta position la plus confortable ! 📸",
  "Prends en photo ce que tu vois depuis là où tu es en ce moment ! 📸",
  "Photo du coin le plus sympa de ta chambre ou salon ! 📸",

  // ── DÉFIS CRÉATIFS ──
  "Arrange des objets pour former le mot AMOUR et prends une photo ! 📸",
  "Fais un bonhomme ou personnage avec de la nourriture et prends-le en photo ! 📸",
  "Fais une œuvre d'art avec ce que tu as autour de toi et envoie la photo ! 📸",
  "Crée un mini-autel avec des objets chez toi en mon honneur et prends-le en photo 😂 📸",
  "Range des objets de 5 couleurs différentes côte à côte et prends-les en photo ! 📸",
  "Fais une sculpture ou une tour avec tout ce que tu as à portée de main ! 📸",
  "Écris mon prénom avec des objets du quotidien et prends-le en photo ! 📸",
  "Crée un cadre photo imaginaire avec tes mains autour de quelque chose de beau ! 📸",

  // ── TENDRESSE VIRTUELLE ──
  "Enlace ton oreiller en t'imaginant que c'est moi et prends un selfie ! 📸",
  "Fais semblant que le téléphone c'est moi et souffles-lui un bisou en vidéo ! 🎥",
  "Prends un selfie au lit avec les couvertures remontées jusqu'au nez ! 📸",
  "Vidéo de 15 secondes : dis-moi comment tu m'imaginais avant qu'on se rencontre ! 🎥",
  "Fais la démonstration de comment tu réagirais si j'arrivais chez toi par surprise ! 🎥",

  // ── AMUSANTS & RIGOLOS ──
  "Imite un animal pendant 15 secondes en vidéo ! 🎥",
  "Fais semblant d'être un présentateur de journal télévisé et parle de notre couple ! 🎥",
  "Imite comment tu agis quand tu veux me convaincre de quelque chose en vidéo ! 🎥",
  "Raconte une blague qui te fait mourir de rire en vidéo ! 🎥",
  "Fais la démonstration de ta plus grande maladresse en 15 secondes de vidéo ! 🎥",
  "Imite le meilleur acteur ou actrice que tu connais en vidéo de 15 secondes ! 🎥",
  "Fais une publicité de 20 secondes pour notre couple comme si c'était un produit ! 🎥",
  "Imite comment tu réagirais si je t'annonçais que je suis en bas de chez toi là maintenant ! 🎥",
];

const WHO_IS_MORE = [
  "Qui est le/la plus romantique ?",
  "Qui ronfle le plus ?",
  "Qui est le/la plus jaloux/jalouse ?",
  "Qui fait le plus de bêtises ?",
  "Qui dit 'je t'aime' en premier ?",
  "Qui est le/la plus têtu(e) ?",
  "Qui cuisine le mieux ?",
  "Qui oublie le plus les dates importantes ?",
  "Qui est le/la plus drôle ?",
  "Qui est le/la plus câlin(e) ?",
  "Qui s'endort en premier ?",
  "Qui prend le plus de temps pour se préparer ?",
  "Qui est le/la plus désordre ?",
  "Qui est le/la plus sportif/sportive ?",
  "Qui est le/la plus stressé(e) ?",
  "Qui contrôle le plus la télécommande ?",
  "Qui est le/la plus emo ?",
  "Qui aime le plus les animaux ?",
  "Qui a le plus d'amis ?",
  "Qui est le/la plus heureux/heureuse maintenant ?",
  "Qui est le/la plus patient(e) ?",
  "Qui est le/la plus aventurier/aventurière ?",
  "Qui est le/la plus gourmand(e) ?",
  "Qui est le/la plus matinal(e) ?",
  "Qui est le/la plus extravagant(e) en dépenses ?",
  "Qui me connaît le mieux ?",
  "Qui est le/la plus jaloux/jalouse au lit ?",
  "Qui est le/la plus passionné(e) ?",
  "Qui est le/la plus attentionné(e) ?",
  "Qui nous aime le plus ?",
  // Nouvelles questions
  "Qui est le plus maladroit ?",
  "Qui est le plus romantique au quotidien ?",
  "Qui est le plus bavard ?",
  "Qui est le plus joueur dans l'intimité ?",
  "Qui est le plus ponctuel ?",
  "Qui est le plus susceptible de lancer un défi amoureux ?",
  "Qui est le plus rêveur ?",
  "Qui est le plus casanier ?",
  "Qui est le plus audacieux en couple ?",
  "Qui est le plus rancunier ?",
  "Qui est le plus susceptible de rougir facilement ?",
  "Qui est le plus curieux des envies de l'autre ?",
  "Qui est le plus généreux ?",
  "Qui est le plus susceptible de pardonner rapidement ?",
  "Qui est le plus accro aux séries ?",
  "Qui est le plus susceptible de proposer un week-end romantique ?",
  "Qui est le plus accro au café ?",
  "Qui est le plus susceptible de garder un secret amoureux ?",
  "Qui est le plus accro aux voyages ?",
  "Qui est le plus susceptible de dire « je t'aime » en premier ?",
  "Qui est le plus accro aux selfies ?",
  "Qui est le plus susceptible de surprendre l'autre avec un geste tendre ?",
  "Qui est le plus accro aux soirées entre amis ?",
  "Qui est le plus susceptible de rêver d'un mariage ?",
  "Qui est le plus accro aux fast-foods ?",
  "Qui est le plus susceptible de se vexer dans une dispute ?",
  "Qui est le plus accro aux câlins ?",
  "Qui est le plus susceptible de partager ses fantasmes ?",
  "Qui est le plus accro aux films d'action ?",
  "Qui est le plus susceptible de rêver d'avoir des enfants ?",
  "Qui est le plus accro aux discussions tardives ?",
  "Qui est le plus susceptible de parler de ses peurs en couple ?",
  "Qui est le plus accro aux desserts ?",
  "Qui est le plus susceptible de garder un souvenir sentimental ?",
  "Qui est le plus accro aux jeux vidéo ?",
  "Qui est le plus susceptible d'envoyer un message tendre en pleine nuit ?",
  "Qui est le plus accro aux sorties en famille ?",
  "Qui est le plus susceptible de parler de l'avenir du couple ?",
  "Qui est le plus accro aux surprises ?",
  "Qui est le plus susceptible de faire un compliment inattendu ?",
  "Qui est le plus accro aux pizzas ?",
  "Qui est le plus susceptible de vouloir tout contrôler dans la relation ?",
  "Qui est le plus accro aux films romantiques ?",
  "Qui est le plus susceptible de rire dans une situation sérieuse ?",
  "Qui est le plus accro aux restaurants ?",
  "Qui est le plus susceptible de raconter une histoire en exagérant ?",
  "Qui est le plus accro aux bisous ?",
  "Qui est le plus susceptible de se perdre dans son propre quartier ?",
  "Qui est le plus accro aux plats faits maison ?",
  "Qui est le plus susceptible de lancer une dispute pour une broutille ?",
  "Qui est le plus accro aux photos de couple ?",
  "Qui est le plus susceptible de chanter faux mais avec conviction ?",
  "Qui est le plus accro aux films d'horreur ?",
  "Qui est le plus susceptible de faire semblant de comprendre une explication compliquée ?",
  "Qui est le plus accro aux bonbons ?",
  "Qui est le plus susceptible de rêver d'une vie à l'étranger ?",
  "Qui est le plus accro aux réseaux sociaux ?",
  "Qui est le plus susceptible de garder rancune longtemps ?",
  "Qui est le plus accro aux plats épicés ?",
  "Qui est le plus susceptible de lancer un défi romantique ?",
  "Qui est le plus accro aux glaces ?",
  "Qui est le plus susceptible de surprendre avec un cadeau intime ?",
  "Qui est le plus accro aux chips ?",
  "Qui est le plus susceptible de dire « pardon » en premier ?",
  "Qui est le plus accro aux soirées Netflix ?",
  "Qui est le plus susceptible de rêver d'une maison ensemble ?",
  "Qui est le plus accro aux plats étrangers ?",
  "Qui est le plus susceptible de garder un souvenir d'un premier rendez-vous ?",
  "Qui est le plus accro aux plats traditionnels ?",
  "Qui est le plus susceptible de proposer un voyage improvisé ?",
  "Qui est le plus accro aux plats sucrés ?",
  "Qui est le plus susceptible de se projeter dans 10 ans ?",
  "Qui est le plus accro aux plats salés ?",
  "Qui est le plus susceptible de faire une déclaration publique ?",
  "Qui est le plus susceptible de rêver d'un grand mariage ?",
  "Qui est le plus susceptible de garder un secret longtemps ?",
  "Qui est le plus susceptible de lancer une surprise romantique ?",
  "Qui est le plus susceptible de rêver d'une lune de miel exotique ?",
  "Qui est le plus susceptible de faire un compliment intime ?",
  "Qui est le plus susceptible de rêver d'une grande famille ?",
  "Qui est le plus accro au chocolat ?",
  "Qui est le plus accro aux pâtisseries ?",
  "Qui est le plus accro aux crêpes ?",
  "Qui est le plus accro aux burgers ?",
  "Qui est le plus accro aux smoothies ?",
  "Qui est le plus accro aux fruits ?",
  "Qui est le plus susceptible de garder une lettre d'amour ?",
  "Qui est le plus susceptible de lancer une danse improvisée ?",
  "Qui est le plus susceptible de lancer un jeu amoureux ?",
  "Qui est le plus susceptible de garder un souvenir d'un baiser ?",
  "Qui est le plus susceptible de rêver de nous en train de faire l'amour ?",
];

const WOULD_YOU_RATHER = [
  {
    option1: "Voyager ensemble pour toujours sans maison fixe",
    option2: "Avoir la maison de nos rêves mais ne jamais voyager",
  },
  {
    option1: "Lire toutes les pensées de ton/ta partenaire",
    option2: "Que ton/ta partenaire lise toutes tes pensées",
  },
  {
    option1: "Revoir notre premier rendez-vous",
    option2: "Voir notre futur ensemble dans 10 ans",
  },
  {
    option1: "Ne jamais pouvoir se disputer",
    option2: "Toujours se réconcilier de la meilleure façon",
  },
  {
    option1: "Avoir un super-pouvoir mais le cacher",
    option2: "Être normal mais célèbre",
  },
  {
    option1: "Un petit-déjeuner au lit tous les matins",
    option2: "Un dîner romantique chaque semaine",
  },
  {
    option1: "Vivre 1000 ans sans ton/ta partenaire",
    option2: "Vivre 50 ans ensemble",
  },
  {
    option1: "Perdre tous nos souvenirs ensemble et recommencer",
    option2: "Garder nos souvenirs mais ne plus créer de nouveaux",
  },
  {
    option1: "Être incroyablement riche mais très occupé",
    option2: "Avoir peu d'argent mais tout le temps ensemble",
  },
  {
    option1: "Connaître la date exacte de notre mariage futur",
    option2: "Être surpris(e) quand ça arrivera",
  },
  // Nouvelles questions Tu préfères
  {
    option1: "Que je sois extrêmement drôle",
    option2: "Que je sois extrêmement romantique",
  },
  {
    option1: "Que je sois ultra sportif(ve)",
    option2: "Que je sois ultra intellectuel(le)",
  },
  {
    option1: "Que je cuisine tous les jours pour toi",
    option2: "Que je t'emmène au restaurant chaque soir",
  },
  {
    option1: "Que je sois très jaloux/jalouse mais passionné(e)",
    option2: "Que je sois totalement détaché(e) mais fidèle",
  },
  {
    option1: "Que je sois très câlin(e) en public",
    option2: "Que je sois réservé(e) en public mais très affectueux/se en privé",
  },
  {
    option1: "Que je t'écrive des lettres d'amour chaque semaine",
    option2: "Que je te fasse des surprises sans prévenir",
  },
  {
    option1: "Que je parle 10 langues",
    option2: "Que je joue 10 instruments",
  },
  {
    option1: "Que je sois célèbre",
    option2: "Que je sois très riche mais inconnu(e)",
  },
  {
    option1: "Que je sois toujours de bonne humeur",
    option2: "Que je sois toujours honnête même quand c'est dur",
  },
  {
    option1: "Que je t'envoie un message mignon chaque matin",
    option2: "Que je t'appelle chaque soir avant de dormir",
  },
  {
    option1: "Que je sois très protecteur/trice",
    option2: "Que je te laisse une liberté totale",
  },
  {
    option1: "Que je sois très aventurier/ère",
    option2: "Que je sois très casanier/ère",
  },
  {
    option1: "Que je sois un(e) excellent(e) danseur/euse",
    option2: "Que je sois un(e) excellent(e) chanteur/euse",
  },
  {
    option1: "Que je sois très organisé(e)",
    option2: "Que je sois très spontané(e)",
  },
  {
    option1: "Que je sois un génie en technologie",
    option2: "Que je sois un génie en bricolage",
  },
  {
    option1: "Que je te fasse rire tous les jours",
    option2: "Que je te fasse pleurer de bonheur une fois par mois",
  },
  {
    option1: "Que je sois très patient(e)",
    option2: "Que je sois très passionné(e)",
  },
  {
    option1: "Que je t'offre un voyage surprise",
    option2: "Que je t'organise une fête surprise avec tous tes proches",
  },
  {
    option1: "Que je sois très ambitieux/se",
    option2: "Que je sois très détendu(e) et zen",
  },
  {
    option1: "Que je te prépare un bain moussant après le travail",
    option2: "Que je te fasse un massage chaque soir",
  },
  {
    option1: "Que je sois un(e) artiste talentueux/se",
    option2: "Que je sois un(e) athlète accompli(e)",
  },
  {
    option1: "Que je sois toujours ponctuel(le)",
    option2: "Que je sois toujours bien habillé(e)",
  },
  {
    option1: "Que je sois très sociable avec plein d'amis",
    option2: "Que je sois réservé(e) mais avec des amitiés profondes",
  },
  {
    option1: "Que je te fasse le petit-déjeuner au lit chaque dimanche",
    option2: "Que je t'emmène en weekend surprise chaque mois",
  },
  {
    option1: "Que je sois incroyable en cuisine",
    option2: "Que je sois incroyable en pâtisserie",
  },
  {
    option1: "Que je sois très expressif(ve) avec mes émotions",
    option2: "Que je sois mystérieux/se et difficile à déchiffrer",
  },
  {
    option1: "Que je sois un(e) excellent(e) photographe",
    option2: "Que je sois un(e) excellent(e) vidéaste",
  },
  {
    option1: "Que je te dise je t'aime 100 fois par jour",
    option2: "Que je te le montre sans jamais le dire",
  },
  {
    option1: "Que je sois très matinal(e)",
    option2: "Que je sois un oiseau de nuit",
  },
  {
    option1: "Que je sache tout réparer à la maison",
    option2: "Que je sache tout décorer magnifiquement",
  },
  {
    option1: "Qu'on vive à la campagne ensemble",
    option2: "Qu'on vive en plein centre-ville",
  },
  {
    option1: "Que je sois un leader naturel",
    option2: "Que je sois un excellent coéquipier",
  },
  {
    option1: "Qu'on ait un animal de compagnie ensemble",
    option2: "Qu'on voyage léger sans attaches",
  },
  {
    option1: "Que je sois très tactile",
    option2: "Que je communique surtout avec des mots",
  },
  {
    option1: "Que je t'offre des fleurs chaque semaine",
    option2: "Que je t'écrive un poème chaque mois",
  },
  {
    option1: "Qu'on regarde un film ensemble chaque soir",
    option2: "Qu'on lise un livre ensemble chaque soir",
  },
  {
    option1: "Que je sois très compétitif(ve)",
    option2: "Que je sois très coopératif(ve)",
  },
  {
    option1: "Que je sois un cordon-bleu pour les dîners en amoureux",
    option2: "Que je sois un as de la réservation dans les meilleurs restaurants",
  },
  {
    option1: "Qu'on partage tous nos mots de passe",
    option2: "Qu'on garde chacun notre jardin secret",
  },
  {
    option1: "Que je te prépare une playlist personnalisée",
    option2: "Que je te chante une chanson en personne",
  },
  {
    option1: "Qu'on fasse du sport ensemble chaque jour",
    option2: "Qu'on fasse la cuisine ensemble chaque jour",
  },
  {
    option1: "Que je sois un grand rêveur / une grande rêveuse",
    option2: "Que je sois très terre-à-terre et pragmatique",
  },
  {
    option1: "Que je te défende toujours en public",
    option2: "Que je te dise honnêtement quand tu as tort en privé",
  },
  {
    option1: "Que je sois obsédé(e) par le fitness",
    option2: "Que je sois obsédé(e) par la nourriture",
  },
  {
    option1: "Qu'on ait une chanson 'à nous'",
    option2: "Qu'on ait un lieu secret 'à nous'",
  },
  {
    option1: "Que je sois un expert en road trip",
    option2: "Que je sois un expert en voyages à l'étranger",
  },
  {
    option1: "Qu'on s'endorme en se tenant la main chaque soir",
    option2: "Qu'on se réveille avec un bisou chaque matin",
  },
  {
    option1: "Que je puisse téléporter pour te rejoindre n'importe quand",
    option2: "Que je puisse arrêter le temps pour nos moments ensemble",
  },
  {
    option1: "Qu'on ait un carnet de souvenirs ensemble",
    option2: "Qu'on fasse un mur de photos chez nous",
  },
  {
    option1: "Que je sois très généreux/se avec tout le monde",
    option2: "Que je sois très attentionné(e) uniquement avec toi",
  },
  {
    option1: "Que je sois accro aux jeux vidéo",
    option2: "Que je sois accro aux réseaux sociaux",
  },
  {
    option1: "Qu'on ait un rituel du soir ensemble",
    option2: "Qu'on ait un rituel du matin ensemble",
  },
  {
    option1: "Que je sois très indépendant(e)",
    option2: "Que je sois toujours avec toi",
  },
  {
    option1: "Que je te fasse une déclaration devant tout le monde",
    option2: "Que je te murmure un secret d'amour à l'oreille",
  },
  {
    option1: "Qu'on apprenne une nouvelle langue ensemble",
    option2: "Qu'on apprenne un instrument ensemble",
  },
  {
    option1: "Que je sois quelqu'un du matin",
    option2: "Que je sois quelqu'un du soir",
  },
  {
    option1: "Qu'on se déguise ensemble pour Halloween",
    option2: "Qu'on fasse un costume coordonné pour le carnaval",
  },
];

// Fonction utilitaire: sélectionner N questions aléatoires parmi un tableau
const shuffleAndPick = (array, count, seed = null) => {
  if (seed !== null) {
    // Shuffle déterministe avec seed (même résultat sur les 2 appareils)
    const seededRandom = (s) => {
      let x = Math.sin(s) * 10000;
      return x - Math.floor(x);
    };
    const arr = [...array];
    let currentSeed = seed;
    for (let i = arr.length - 1; i > 0; i--) {
      currentSeed++;
      const j = Math.floor(seededRandom(currentSeed) * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, count);
  }
  // Shuffle aléatoire (mode local)
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

export default function GamesScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user, couple, partner } = useAuth();
  const { notifyGame, notifyGameAnswer, notifyGameWin, notifyProofSent, notifyProofReaction } = useNotifyPartner();
  const { recordInteraction } = useData();

  // Quiz: utiliser TOUTES les questions disponibles (mélangées aléatoirement)
  const [shuffledQuizQuestions, setShuffledQuizQuestions] = useState(() => shuffleAndPick(QUIZ_QUESTIONS, QUIZ_QUESTIONS.length));
  const totalQuizQuestions = shuffledQuizQuestions.length;
  const { 
    createGameSession, 
    joinGameSession, 
    gameSession, 
    waitingForPartner, 
    partnerOnline,
    endGameSession,
    clearGameAnswers,
    submitAnswer,
    checkBothAnswered,
    getBothAnswers,
    getMyAnswer,
    hasMyAnswer,
    gameData,
    nextQuestion: nextGameQuestion,
    isFirebaseReady,
    firebaseError,
    pendingGameInvite,
    hasActiveSession,
    updateCoupleId,
    coupleId,
    myPlayerId,
  } = useGame();

  // États principaux des jeux
  const [activeGame, setActiveGame] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [showResult, setShowResult] = useState(false);
  const [truthOrDare, setTruthOrDare] = useState(null);
  const [wyrChoice, setWyrChoice] = useState(null);
  const [gameMode, setGameMode] = useState(null); // 'online'
  
  // États pour "Qui est le Plus" TOUR PAR TOUR
  const [wimPhase, setWimPhase] = useState('player1'); // 'player1', 'passPhone', 'player2', 'reveal'
  const [wimPlayer1Answer, setWimPlayer1Answer] = useState(null);
  const [wimPlayer2Answer, setWimPlayer2Answer] = useState(null);
  
  // États pour "Tu Préfères" TOUR PAR TOUR
  const [wyrPhase, setWyrPhase] = useState('player1'); // 'player1', 'passPhone', 'player2', 'reveal'
  const [wyrPlayer1Choice, setWyrPlayer1Choice] = useState(null);
  const [wyrPlayer2Choice, setWyrPlayer2Choice] = useState(null);
  
  // États pour Quiz
  const [quizPhase, setQuizPhase] = useState('player1'); // 'player1', 'player2', 'reveal'
  const [player1Answer, setPlayer1Answer] = useState(null);
  const [player2Answer, setPlayer2Answer] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [quizOpenAnswer, setQuizOpenAnswer] = useState(''); // Réponse texte libre pour questions open
  const [quizValidated, setQuizValidated] = useState(false); // Si le point a été validé/refusé dans cette question
  const [quizLastValidationResult, setQuizLastValidationResult] = useState(null); // true = correct, false = incorrect, null = pas encore validé

  // États pour Action/Vérité — FIL DE CONVERSATION
  const [todResponse, setTodResponse] = useState('');
  const [todSubmitted, setTodSubmitted] = useState(false);
  const [todRound, setTodRound] = useState(0);
  // Phases: 'modeSelect' → 'choose' → 'writeQuestion' → 'waitQuestion' → 'answer' → 'waitAnswer' → 'react' → 'next'
  const [todPhase, setTodPhase] = useState('modeSelect');
  const [todAsker, setTodAsker] = useState(null);
  const [todAnswerer, setTodAnswerer] = useState(null);
  const [todThread, setTodThread] = useState([]); // Fil de conversation complet
  const [isMyTurnToAsk, setIsMyTurnToAsk] = useState(true);
  const [todPartnerResponse, setTodPartnerResponse] = useState(null);
  const [todGameMode, setTodGameMode] = useState(null); // 'classic' or 'custom'
  const [todCustomQuestion, setTodCustomQuestion] = useState('');
  const [todChosenType, setTodChosenType] = useState(null);
  const [todWaitingReaction, setTodWaitingReaction] = useState(false); // Le répondeur attend la réaction du questioner
  const [todWaitingNextSync, setTodWaitingNextSync] = useState(false); // Attend que le partenaire soit prêt pour le tour suivant
  const todScrollRef = useRef(null); // Ref pour auto-scroll du fil
  const processedTodKeys = useRef(new Set()); // Clés Firebase déjà traitées (éviter doublons)
  const gameStartedRef = useRef(false); // Guard: empêcher le double-démarrage de jeu
  
  // États pour le mode multijoueur à distance
  const [showLobby, setShowLobby] = useState(false);
  const [selectedGameForLobby, setSelectedGameForLobby] = useState(null);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [isJoiningGame, setIsJoiningGame] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Synchroniser le coupleId avec le couple de l'AuthContext
  useEffect(() => {
    if (couple?.id && couple.id !== coupleId) {
      console.log('🔄 Synchronisation coupleId:', couple.id);
      updateCoupleId(couple.id);
    }
  }, [couple?.id, coupleId, updateCoupleId]);

  // Détecter les invitations de jeu du partenaire
  useEffect(() => {
    if (pendingGameInvite && !activeGame && !showLobby) {
      console.log('📨 Affichage invitation:', pendingGameInvite);
      setShowInviteModal(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [pendingGameInvite, activeGame, showLobby]);

  // Surveiller les changements de session pour le mode en ligne
  useEffect(() => {
    if (gameSession && gameMode === 'online') {
      if (gameSession.status === 'ready' && !waitingForPartner && !activeGame) {
        // Guard: ne démarrer qu'une seule fois
        if (gameStartedRef.current) return;
        gameStartedRef.current = true;
        
        // Les deux joueurs sont là, démarrer le jeu
        setShowLobby(false);
        setShowInviteModal(false);
        // Reset propre avant de démarrer
        resetAllGameStates();
        // ✅ En mode online: utiliser le timestamp de création comme seed pour que
        // les 2 appareils aient les mêmes questions dans le même ordre
        if (gameSession.gameType === 'quiz' && gameSession.createdAt) {
          setShuffledQuizQuestions(shuffleAndPick(QUIZ_QUESTIONS, QUIZ_QUESTIONS.length, gameSession.createdAt));
          console.log('🎲 Quiz seed partagé:', gameSession.createdAt);
        }
        // Re-setter gameMode après reset (resetAllGameStates ne le touche pas)
        setActiveGame(gameSession.gameType);
        console.log('🎮 Jeu démarré via session watcher:', gameSession.gameType);
      }
    }
    // Reset le guard quand on quitte un jeu
    if (!activeGame && !gameSession) {
      gameStartedRef.current = false;
    }
  }, [gameSession, waitingForPartner, gameMode, activeGame]);

  // ✅ Fonction centralisée de reset de TOUS les états de jeu
  const resetAllGameStates = () => {
    setCurrentQuestion(0);
    setScores({ player1: 0, player2: 0 });
    setShowResult(false);
    // Quiz
    setQuizPhase('player1');
    setPlayer1Answer(null);
    setPlayer2Answer(null);
    setCurrentPlayer(1);
    setQuizOpenAnswer('');
    setQuizValidated(false);
    setQuizLastValidationResult(null);
    // Who is More
    setWimPhase('player1');
    setWimPlayer1Answer(null);
    setWimPlayer2Answer(null);
    // Would You Rather
    setWyrPhase('player1');
    setWyrPlayer1Choice(null);
    setWyrPlayer2Choice(null);
    setWyrChoice(null);
    // Truth or Dare
    setTruthOrDare(null);
    setTodResponse('');
    setTodSubmitted(false);
    setTodRound(0);
    setTodPhase('modeSelect');
    setTodAsker(null);
    setTodAnswerer(null);
    setTodThread([]);
    setIsMyTurnToAsk(true);
    setTodPartnerResponse(null);
    setTodGameMode(null);
    setTodCustomQuestion('');
    setTodChosenType(null);
    setTodWaitingReaction(false);
    setTodWaitingNextSync(false);
    processedTodKeys.current = new Set();
    // Online states
    setOnlineAnswerSent(false);
    setOnlinePartnerAnswer(null);
    setOnlineWaitingPartner(false);
    setOnlineReadyForNext(false);
    setOnlinePartnerReady(false);
    setOnlineWaitingNextPartner(false);
    processedOnlineKeys.current = new Set();
    advancingRef.current = false;
    setDiscussEmoji(null);
  };

  // ═══════════════════════════════════════════════════════
  // ✅ ÉTATS MODE ONLINE POUR QUIZ, WIM, WYR
  // ═══════════════════════════════════════════════════════
  const [onlineAnswerSent, setOnlineAnswerSent] = useState(false);
  const [onlinePartnerAnswer, setOnlinePartnerAnswer] = useState(null);
  const [onlineWaitingPartner, setOnlineWaitingPartner] = useState(false);
  // ✅ SYNC: Attendre que les deux joueurs cliquent "Suivant" avant d'avancer
  const [onlineReadyForNext, setOnlineReadyForNext] = useState(false);
  const [onlinePartnerReady, setOnlinePartnerReady] = useState(false);
  const [onlineWaitingNextPartner, setOnlineWaitingNextPartner] = useState(false);
  // ✅ DÉDUPLICATION: Éviter de re-traiter les mêmes données
  const processedOnlineKeys = useRef(new Set());
  const advancingRef = useRef(false); // Guard contre double-avance
  const [discussEmoji, setDiscussEmoji] = useState(null); // Réaction émoji dans les phases de révélation
  const [discussOpen, setDiscussOpen] = useState(false);
  const [discussInput, setDiscussInput] = useState('');
  const [discussMessages, setDiscussMessages] = useState([]);
  const [discussIsRecording, setDiscussIsRecording] = useState(false);
  const [discussUploading, setDiscussUploading] = useState(false);
  const discussRecordingRef = useRef(null);
  const [todProofUploading, setTodProofUploading] = useState(false);
  const [todProofSent, setTodProofSent] = useState(false);
  const [todActionChoice, setTodActionChoice] = useState(null); // 'fait' | 'passe' | null
  const [fullScreenImg, setFullScreenImg] = useState(null);
  const [playingAudioUri, setPlayingAudioUri] = useState(null);
  const discussPlaybackRef = useRef(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef(null);
  const discussScrollRef = useRef(null);

  // ✅ Auto-scoring pour questions choice online (sorti du render pour éviter side-effects)
  useEffect(() => {
    if (activeGame !== 'quiz' || gameMode !== 'online') return;
    if (quizPhase !== 'reveal' || quizValidated) return;
    const question = shuffledQuizQuestions[currentQuestion];
    if (!question || question.type !== 'choice') return;
    
    const iAmCreatorForScoring = gameSession?.createdBy === myPlayerId;
    const iAmResponder = (currentQuestion % 2 === 0) === iAmCreatorForScoring;
    const responderAnswer = iAmResponder ? player1Answer : onlinePartnerAnswer;
    const guesserAnswer = iAmResponder ? onlinePartnerAnswer : player1Answer;
    const isChoiceCorrect = responderAnswer === guesserAnswer;
    
    if (isChoiceCorrect) {
      const scoringPlayer = iAmResponder ? 'player2' : 'player1';
      setScores(prev => ({
        ...prev,
        [scoringPlayer]: prev[scoringPlayer] + 1,
      }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setQuizValidated(true);
  }, [quizPhase, quizValidated, activeGame, gameMode, currentQuestion, player1Answer, onlinePartnerAnswer, gameSession, myPlayerId]);

  // ✅ LISTENER ROBUSTE: Détecte les réponses du partenaire pour Quiz/WIM/WYR en mode online
  useEffect(() => {
    if (!activeGame || activeGame === 'truthordare') return;
    if (gameMode !== 'online' || !isFirebaseReady) return;
    if (!gameData?.answers) return;

    const answerKey = `${activeGame}_${currentQuestion}`;
    const dedupKey = `answer_${answerKey}`;
    
    // Déjà traité ET révélé ? On ne re-traite plus
    if (processedOnlineKeys.current.has(dedupKey)) return;
    
    const answers = gameData.answers[answerKey];
    if (!answers) return;

    // Chercher la réponse du partenaire (pas la mienne)
    const partnerEntry = Object.entries(answers).find(
      ([playerId, data]) => playerId !== myPlayerId && !playerId.startsWith('partner_')
    );

    if (partnerEntry) {
      const [, partnerData] = partnerEntry;
      console.log(`📥 Réponse partenaire reçue pour ${answerKey}:`, partnerData.answer);
      setOnlinePartnerAnswer(partnerData.answer);
      setOnlineWaitingPartner(false);
      
      // Si j'ai déjà répondu, passer en phase reveal ET marquer comme traité
      if (onlineAnswerSent) {
        processedOnlineKeys.current.add(dedupKey); // ✅ Marquer SEULEMENT quand on passe en reveal
        if (activeGame === 'quiz') setQuizPhase('reveal');
        if (activeGame === 'whoismore') setWimPhase('reveal');
        if (activeGame === 'wouldyourather') setWyrPhase('reveal');
      }
      // Sinon: on NE marque PAS comme traité → le useEffect re-vérifiera quand onlineAnswerSent deviendra true
    }
  }, [activeGame, gameMode, isFirebaseReady, gameData, currentQuestion, onlineAnswerSent, myPlayerId]);

  // Helper: Soumettre ma réponse online pour Quiz/WIM/WYR
  const submitOnlineAnswer = async (answer) => {
    const answerKey = `${activeGame}_${currentQuestion}`;
    // ✅ Marquer comme envoyé AVANT l'appel Firebase pour éviter la race condition
    // Le useEffect listener se re-déclenchera automatiquement quand onlineAnswerSent change
    setOnlineAnswerSent(true);
    setOnlineWaitingPartner(true);
    
    await submitAnswer(answerKey, {
      answer,
      questionIndex: currentQuestion,
      playerName: user?.name || 'Joueur',
    }, user?.name);
    
    // ✅ PAS de vérification ici - le listener useEffect gère la détection
    // quand Firebase notifie que la réponse du partenaire existe
  };

  // ✅ LISTENER: Détecte la validation quiz du partenaire (pour questions open en mode online)
  useEffect(() => {
    if (activeGame !== 'quiz' || gameMode !== 'online' || !isFirebaseReady) return;
    if (!gameData?.answers) return;

    const validationKey = `quiz_validation_${currentQuestion}`;
    const dedupKey = `validation_${validationKey}`;
    
    if (processedOnlineKeys.current.has(dedupKey)) return;
    
    const validationData = gameData.answers[validationKey];
    if (!validationData) return;

    // Chercher la validation du partenaire (le répondeur)
    const partnerValidation = Object.entries(validationData).find(
      ([playerId]) => playerId !== myPlayerId && !playerId.startsWith('partner_')
    );

    if (partnerValidation) {
      const [, data] = partnerValidation;
      processedOnlineKeys.current.add(dedupKey);
      console.log(`📥 Validation quiz reçue:`, data.isCorrect);
      
      setQuizValidated(true);
      setQuizLastValidationResult(data.isCorrect);
      if (data.isCorrect) {
        // En mode online, le devineur est celui qui n'est PAS répondeur
        // Si je reçois la validation, c'est que je suis le devineur (le répondeur est le partenaire)
        const iAmCreatorForValidation = gameSession?.createdBy === myPlayerId;
        const iAmResponder = (currentQuestion % 2 === 0) === iAmCreatorForValidation;
        // Si je reçois la validation, je suis le devineur (l'autre joueur est le répondeur)
        const scoringPlayer = iAmResponder ? 'player2' : 'player1';
        setScores(prev => ({
          ...prev,
          [scoringPlayer]: prev[scoringPlayer] + 1,
        }));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  }, [activeGame, gameMode, isFirebaseReady, gameData, currentQuestion, myPlayerId, gameSession]);

  // ✅ LISTENER ROBUSTE: Détecte quand le partenaire clique "Suivant" pour synchroniser
  useEffect(() => {
    if (!activeGame || activeGame === 'truthordare') return;
    if (gameMode !== 'online' || !isFirebaseReady) return;
    if (!gameData?.answers) return;

    const readyKey = `ready_next_${activeGame}_${currentQuestion}`;
    const dedupKey = `ready_${readyKey}`;
    
    // Déjà avancé ? On ne re-traite plus
    if (processedOnlineKeys.current.has(dedupKey)) return;
    
    const readyData = gameData.answers[readyKey];
    if (!readyData) return;

    const partnerReady = Object.entries(readyData).find(
      ([playerId]) => playerId !== myPlayerId && !playerId.startsWith('partner_')
    );

    if (partnerReady) {
      console.log(`✅ Partenaire prêt pour question suivante (${readyKey})`);
      setOnlinePartnerReady(true);
      setOnlineWaitingNextPartner(false);
      
      // Si moi aussi je suis prêt, avancer automatiquement ET marquer comme traité
      if (onlineReadyForNext) {
        processedOnlineKeys.current.add(dedupKey); // ✅ Marquer SEULEMENT quand on avance
        console.log('🚀 Les deux joueurs sont prêts, passage à la question suivante');
        advanceToNextQuestion();
      }
      // Sinon: on NE marque PAS → le useEffect re-vérifiera quand onlineReadyForNext deviendra true
    }
  }, [activeGame, gameMode, isFirebaseReady, gameData, currentQuestion, onlineReadyForNext, myPlayerId]);

  // ✅ Helper PROTÉGÉ: Avancer effectivement à la question suivante (appelé quand les 2 sont prêts)
  const advanceToNextQuestion = useCallback(() => {
    // Guard contre double-appel
    if (advancingRef.current) {
      console.log('⚠️ advanceToNextQuestion déjà en cours, ignoré');
      return;
    }
    advancingRef.current = true;
    
    // Reset tous les états online
    setOnlineAnswerSent(false);
    setOnlinePartnerAnswer(null);
    setOnlineWaitingPartner(false);
    setOnlineReadyForNext(false);
    setOnlinePartnerReady(false);
    setOnlineWaitingNextPartner(false);
    // NE PAS reset processedOnlineKeys à new Set() — les anciennes clés doivent rester pour éviter re-traitement
    // Les nouvelles clés (avec le nouvel index) seront naturellement différentes

    // ✅ Utiliser les valeurs actuelles via les setters fonctionnels
    setCurrentQuestion(prevQ => {
      // Lire activeGame depuis la closure mais c'est OK car ce useCallback a activeGame en dep
      if (activeGame === 'quiz') {
        if (prevQ < totalQuizQuestions - 1) {
          setQuizPhase('player1');
          setPlayer1Answer(null);
          setPlayer2Answer(null);
          setQuizOpenAnswer('');
          setQuizValidated(false);
          setQuizLastValidationResult(null);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          return prevQ + 1;
        } else {
          setShowResult(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          notifyGameWin('Quiz Couple');
          return prevQ;
        }
      } else if (activeGame === 'whoismore') {
        if (prevQ < WHO_IS_MORE.length - 1) {
          setWimPhase('player1');
          setWimPlayer1Answer(null);
          setWimPlayer2Answer(null);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          return prevQ + 1;
        } else {
          setShowResult(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          notifyGameWin('Qui est le Plus');
          return prevQ;
        }
      } else if (activeGame === 'wouldyourather') {
        if (prevQ < WOULD_YOU_RATHER.length - 1) {
          setWyrPhase('player1');
          setWyrPlayer1Choice(null);
          setWyrPlayer2Choice(null);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          return prevQ + 1;
        } else {
          setShowResult(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          notifyGameWin('Tu Préfères');
          return prevQ;
        }
      }
      return prevQ;
    });
    
    // Relâcher le guard après un tick pour laisser les states se propager
    setTimeout(() => { advancingRef.current = false; }, 500);
  }, [activeGame, notifyGameWin]);

  // Reset la zone discussion quand on change de question ou de jeu
  useEffect(() => {
    setDiscussEmoji(null);
    setDiscussOpen(false);
    setDiscussInput('');
    setDiscussMessages([]);
    setDiscussIsRecording(false);
  }, [currentQuestion, activeGame]);

  // Reset preuves TOD quand on change de round
  useEffect(() => {
    setTodProofSent(false);
    setTodProofUploading(false);
  }, [todRound]);

  // Écouter les messages de discussion du partenaire (mode online)
  useEffect(() => {
    if (!activeGame || gameMode !== 'online' || !isFirebaseReady || !gameData?.answers) return;
    const myName = user?.name || 'Moi';
    const prefix = `discuss_q${currentQuestion}_`;
    Object.entries(gameData.answers).forEach(([key, val]) => {
      if (!key.startsWith(prefix) || typeof val !== 'object') return;
      Object.entries(val).forEach(([pid, data]) => {
        if (pid === myPlayerId) return;
        if (!data?.player || data.player === myName) return;
        const msgId = `${key}_${pid}`;
        setDiscussMessages(prev => {
          if (prev.find(m => m._id === msgId)) return prev;
          return [...prev, { ...data, _id: msgId }];
        });
      });
    });
  }, [activeGame, gameMode, isFirebaseReady, gameData, currentQuestion, myPlayerId]);

  // Helper: Signaler que je suis prêt pour la question suivante (envoie signal Firebase + attend partenaire)
  const signalReadyForNext = async () => {
    const readyKey = `ready_next_${activeGame}_${currentQuestion}`;
    // ✅ Marquer comme prêt AVANT l'appel Firebase pour éviter la race condition
    // Le useEffect listener ready se re-déclenchera automatiquement quand onlineReadyForNext change
    setOnlineReadyForNext(true);
    setOnlineWaitingNextPartner(true);
    
    await submitAnswer(readyKey, {
      ready: true,
      playerName: user?.name || 'Joueur',
      timestamp: Date.now(),
    }, user?.name);
    
    // ✅ PAS de vérification ici - le listener useEffect gère la détection
    // quand Firebase notifie que le partenaire est prêt
  };

  // Helper: Reset les états online (pour "Rejouer")
  const nextOnlineQuestion = () => {
    setOnlineAnswerSent(false);
    setOnlinePartnerAnswer(null);
    setOnlineWaitingPartner(false);
    setOnlineReadyForNext(false);
    setOnlinePartnerReady(false);
    setOnlineWaitingNextPartner(false);
    processedOnlineKeys.current = new Set();
    advancingRef.current = false;
  };

  // ══════ CLOUDINARY + DISCUSSION + PREUVE HELPERS ══════

  // Insère des paramètres de transformation Cloudinary pour alléger les médias affichés
  const optimizeCloudinaryUrl = (url, type = 'image') => {
    if (!url || !url.includes('cloudinary.com')) return url;
    const parts = url.split('/upload/');
    if (parts.length !== 2) return url;
    const transform = type === 'video'
      ? 'w_640,h_480,c_limit,q_auto:good,vc_auto,f_mp4'
      : 'w_800,h_800,c_limit,q_auto:good,f_auto';
    return `${parts[0]}/upload/${transform}/${parts[1]}`;
  };

  const uploadToCloudinary = async (uri, resourceType = 'image') => {
    const raw = uri.split('?')[0];
    const ext = raw.split('.').pop().toLowerCase() || 'jpg';
    let mimeType;
    if (resourceType === 'video') {
      mimeType = ext === 'mov' ? 'video/quicktime' : ext === 'webm' ? 'video/webm' : 'video/mp4';
    } else if (resourceType === 'audio') {
      mimeType = ext === 'caf' ? 'audio/x-caf' : ext === '3gp' ? 'audio/3gpp' : 'audio/m4a';
    } else {
      mimeType = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : 'image/jpeg';
    }
    const cloudExt = resourceType === 'audio' ? (ext || 'm4a') : (ext || (resourceType === 'video' ? 'mp4' : 'jpg'));
    const data = new FormData();
    data.append('file', { uri, type: mimeType, name: `upload.${cloudExt}` });
    data.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    const cloudEndpoint = resourceType === 'image' ? 'image' : 'video';
    const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/${cloudEndpoint}/upload`;
    const res = await fetch(endpoint, { method: 'POST', body: data });
    const json = await res.json();
    if (!json.secure_url) throw new Error(`Upload Cloudinary échoué: ${json.error?.message || 'inconnu'}`);
    return json.secure_url;
  };

  const sendDiscussMessage = async () => {
    if (!discussInput.trim()) return;
    const myName = user?.name || 'Moi';
    const ts = Date.now();
    const msg = { _id: `local_${ts}`, player: myName, type: 'text', text: discussInput.trim(), timestamp: ts };
    setDiscussMessages(prev => [...prev, msg]);
    setDiscussInput('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (gameMode === 'online' && isFirebaseReady) {
      await submitAnswer(`discuss_q${currentQuestion}_${ts}`, { player: myName, type: 'text', text: msg.text, timestamp: ts }, myName);
    }
  };

  const pickDiscussImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission refusée', "Autorise l'accès aux photos."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.4,
      exif: false,
      base64: false,
    });
    if (!result.canceled && result.assets[0]) {
      const myName = user?.name || 'Moi';
      const ts = Date.now();
      setDiscussUploading(true);
      try {
        const url = await uploadToCloudinary(result.assets[0].uri, 'image');
        const displayUrl = optimizeCloudinaryUrl(url, 'image');
        const msg = { _id: `local_${ts}`, player: myName, type: 'image', uri: displayUrl, timestamp: ts };
        setDiscussMessages(prev => [...prev, msg]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (gameMode === 'online' && isFirebaseReady) {
          await submitAnswer(`discuss_q${currentQuestion}_${ts}`, { player: myName, type: 'image', uri: displayUrl, timestamp: ts }, myName);
        }
      } catch (e) { Alert.alert('Erreur', "Impossible d'envoyer la photo"); }
      finally { setDiscussUploading(false); }
    }
  };

  const startDiscussRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) { Alert.alert('Permission refusée', 'Autorise le micro pour enregistrer.'); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      discussRecordingRef.current = recording;
      setDiscussIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => setRecordingSeconds(s => s + 1), 1000);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) { console.log('Erreur record discuss:', e); }
  };

  const stopDiscussRecording = async () => {
    if (!discussRecordingRef.current) return;
    setDiscussIsRecording(false);
    clearInterval(recordingTimerRef.current);
    setRecordingSeconds(0);
    const myName = user?.name || 'Moi';
    const ts = Date.now();
    try {
      await discussRecordingRef.current.stopAndUnloadAsync();
      const uri = discussRecordingRef.current.getURI();
      discussRecordingRef.current = null;
      setDiscussUploading(true);
      const url = await uploadToCloudinary(uri, 'video');
      const msg = { _id: `local_${ts}`, player: myName, type: 'audio', uri: url, timestamp: ts };
      setDiscussMessages(prev => [...prev, msg]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (gameMode === 'online' && isFirebaseReady) {
        await submitAnswer(`discuss_q${currentQuestion}_${ts}`, { player: myName, type: 'audio', uri: url, timestamp: ts }, myName);
      }
    } catch (e) { Alert.alert('Erreur', "Impossible d'envoyer le vocal"); }
    finally { setDiscussUploading(false); }
  };

  const playDiscussAudio = async (uri) => {
    try {
      if (discussPlaybackRef.current) {
        await discussPlaybackRef.current.unloadAsync();
        discussPlaybackRef.current = null;
      }
      if (playingAudioUri === uri) { setPlayingAudioUri(null); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      discussPlaybackRef.current = sound;
      setPlayingAudioUri(uri);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) { setPlayingAudioUri(null); sound.unloadAsync(); }
      });
    } catch (e) { console.log('Erreur lecture audio:', e); }
  };

  const sendTodProof = async (useCamera = true) => {
    try {
      const perm = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { Alert.alert('Permission refusée', "Autorise l'accès à la caméra/photos."); return; }
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            quality: 0.4,
            videoMaxDuration: 15,
            exif: false,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            quality: 0.4,
            exif: false,
            base64: false,
          });
      if (!result.canceled && result.assets[0]) {
        const myName = user?.name || 'Moi';
        const isVideo = result.assets[0].type === 'video';
        setTodProofUploading(true);
        const url = await uploadToCloudinary(result.assets[0].uri, isVideo ? 'video' : 'image');
        const displayUrl = optimizeCloudinaryUrl(url, isVideo ? 'video' : 'image');
        setTodProofSent(true);
        addToThread({ type: 'proof', player: myName, proofType: isVideo ? 'video' : 'image', uri: displayUrl, round: todRound });
        if (gameMode === 'online' && isFirebaseReady) {
          await submitAnswer(`tod_proof_${todRound}`, { proofType: isVideo ? 'video' : 'image', uri: displayUrl, sentBy: myName, round: todRound, timestamp: Date.now() }, myName);
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (gameMode === 'online') await notifyProofSent();
      }
    } catch (e) { Alert.alert('Erreur', "Impossible d'envoyer la preuve"); }
    finally { setTodProofUploading(false); }
  };

  // ✅ LISTENER ROBUSTE: Écouter les données du partenaire en Action/Vérité
  useEffect(() => {
    if (activeGame !== 'truthordare' || !isFirebaseReady) return;
    if (gameMode !== 'online') return;
    
    const myName = user?.name || 'Moi';
    const partnerName = partner?.name || 'Partenaire';
    
    // Helper: vérifier si une clé a déjà été traitée (éviter doublons)
    const alreadyProcessed = (key) => {
      if (processedTodKeys.current.has(key)) return true;
      processedTodKeys.current.add(key);
      return false;
    };
    
    // Helper: trouver les données du partenaire dans une clé Firebase
    const findPartnerData = (key) => {
      const entries = gameData?.answers?.[key];
      if (!entries) return null;
      const found = Object.entries(entries).find(
        ([playerId]) => playerId !== myPlayerId && !playerId.startsWith('partner_')
      );
      return found ? found[1] : null;
    };
    
    // 1. Écouter le choix Action/Vérité du partenaire (mode personnalisé uniquement)
    const choiceKey = `tod_choice_${todRound}`;
    const choiceData = findPartnerData(choiceKey);
    if (choiceData && todGameMode === 'custom' && !alreadyProcessed(`choice_${todRound}`)) {
      if (choiceData.chosenBy !== myName) {
        console.log('📨 Partenaire a choisi:', choiceData.type);
        setTodChosenType(choiceData.type);
        addToThread({
          type: 'choice',
          player: choiceData.chosenBy,
          choice: choiceData.type,
          text: choiceData.type === 'truth' ? '💬 Vérité' : '⚡ Action',
          round: todRound,
        });
        // Le partenaire (questioner) a choisi le type, il va écrire la question
        // Moi (répondeur) j'attends qu'il l'envoie
        setTodPhase('waitQuestion');
      }
    }
    
    // 2. Écouter la question posée par le partenaire
    const questionKey = `tod_question_${todRound}`;
    const questionData = findPartnerData(questionKey);
    if (questionData && !alreadyProcessed(`question_${todRound}`)) {
      if (questionData.mustAnswerBy === myName) {
        console.log('📨 Question du partenaire reçue:', questionData);
        setTruthOrDare({ type: questionData.type, text: questionData.text, round: questionData.round });
        setTodAsker(questionData.askedBy);
        setTodAnswerer(questionData.mustAnswerBy);
        setTodChosenType(questionData.type);
        addToThread({
          type: 'question',
          player: questionData.askedBy,
          questionType: questionData.type,
          text: questionData.text,
          round: todRound,
        });
        // En mode classique, le choix est inclus dans la question — ajouter aussi la bulle choix
        if (questionData.mode === 'classic') {
          // Insérer la bulle choix AVANT la question (si pas déjà fait)
          if (!processedTodKeys.current.has(`choice_classic_${todRound}`)) {
            processedTodKeys.current.add(`choice_classic_${todRound}`);
            // On l'ajoute en tant que system message
            addToThread({
              type: 'choice',
              player: questionData.askedBy,
              choice: questionData.type,
              text: questionData.type === 'truth' ? '💬 Vérité' : '⚡ Action',
              round: todRound,
            });
          }
        }
        setTodPhase('answer');
      }
    }

    // 3. Écouter la réponse du partenaire (SANS restriction de phase — on la capture dès qu'elle arrive)
    const responseKey = `tod_response_${todRound}`;
    const responseData = findPartnerData(responseKey);
    if (responseData && !alreadyProcessed(`response_${todRound}`)) {
      if (responseData.respondedBy !== myName) {
        console.log('✅ Réponse du partenaire reçue:', responseData);
        setTodPartnerResponse(responseData);
        addToThread({
          type: 'response',
          player: responseData.respondedBy || partnerName,
          text: responseData.response,
          round: todRound,
        });
        // Je suis le questioner → je passe en phase react pour réagir
        setTodPhase('react');
      }
    }
    
    // 4. Écouter la réaction du partenaire
    const reactionKey = `tod_reaction_${todRound}`;
    const reactionData = findPartnerData(reactionKey);
    if (reactionData && !alreadyProcessed(`reaction_${todRound}`)) {
      if (reactionData.reactedBy !== myName) {
        console.log('✅ Réaction du partenaire reçue:', reactionData.reaction);
        addReactionToThread(reactionData.reaction);
        addToThread({
          type: 'reaction',
          player: reactionData.reactedBy || partnerName,
          text: reactionData.reaction,
          round: todRound,
        });
        // Je suis le répondeur, j'attendais la réaction → on peut avancer maintenant
        if (todWaitingReaction) {
          setTodWaitingReaction(false);
          // ✅ Signaler au questioner que je suis prêt pour le tour suivant
          submitAnswer(`ready_next_tod_${todRound}`, {
            ready: true,
            playerName: myName,
            timestamp: Date.now(),
          }, myName);
          // Auto-avancer au tour suivant après un court délai
          setTimeout(() => {
            advanceToNextTodRound();
          }, 1200);
        }
      }
    }
    
    // 5. Écouter le signal "prêt pour le tour suivant" du partenaire
    const readyKey = `ready_next_tod_${todRound}`;
    const readyData = findPartnerData(readyKey);
    if (readyData) {
      if (todWaitingNextSync && !alreadyProcessed(`ready_${todRound}`)) {
        console.log('✅ Partenaire prêt pour le tour suivant → on avance');
        advanceToNextTodRound();
      }
    }

    // 6. Écouter la preuve envoyée par le partenaire
    const proofKey = `tod_proof_${todRound}`;
    const proofData = findPartnerData(proofKey);
    if (proofData && !alreadyProcessed(`proof_${todRound}`)) {
      console.log('📸 Preuve partenaire reçue:', proofData.proofType);
      addToThread({
        type: 'proof',
        player: proofData.sentBy || partnerName,
        proofType: proofData.proofType,
        uri: proofData.uri,
        round: todRound,
      });
    }
  }, [activeGame, gameMode, isFirebaseReady, gameData, todRound, todPhase, myPlayerId, user?.name, truthOrDare, todGameMode, todWaitingReaction, todWaitingNextSync]);

  // ✅ Synchroniser le tour de question en mode online via gameSession
  useEffect(() => {
    if (activeGame === 'truthordare' && gameMode === 'online' && gameSession) {
      // Le créateur de la session commence à poser
      const iAmCreator = gameSession.createdBy === myPlayerId;
      // Tour pair = créateur pose, tour impair = l'autre pose
      const creatorAsks = todRound % 2 === 0;
      setIsMyTurnToAsk(iAmCreator ? creatorAsks : !creatorAsks);
    }
  }, [activeGame, gameMode, gameSession, todRound, myPlayerId]);

  const openGameLobby = (gameType) => {
    setSelectedGameForLobby(gameType);
    setShowLobby(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleCreateGame = async () => {
    setIsCreatingGame(true);
    const session = await createGameSession(selectedGameForLobby, user?.name || 'Joueur 1');
    setIsCreatingGame(false);
    
    if (session && !session.error) {
      setGameMode('online');
      // ✅ Plus besoin d'appeler listenToGameSession() - le listener permanent dans GameContext gère tout
      
      // Envoyer une notification push au partenaire
      const gameTitle = getGameTitle(selectedGameForLobby);
      await notifyGame(gameTitle);
      
      Alert.alert(
        '🎮 Partie créée !',
        'En attente de votre partenaire...\n\nVotre partenaire doit appuyer sur "Rejoindre la partie" dans le même jeu.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Erreur', session?.error || 'Impossible de créer la partie');
    }
  };

  const handleJoinGame = async () => {
    setIsJoiningGame(true);
    const result = await joinGameSession(user?.name || 'Joueur 2');
    setIsJoiningGame(false);
    
    // Vérifier si c'est une erreur
    if (result && result.error) {
      Alert.alert(
        '❌ Impossible de rejoindre',
        result.error,
        [{ text: 'OK' }]
      );
      return;
    }
    
    if (result && !result.error) {
      setGameMode('online');
      // Le session watcher (useEffect) détectera status='ready' et démarrera le jeu automatiquement
      setShowLobby(false);
      gameStartedRef.current = false; // Reset pour permettre au watcher de démarrer
      Alert.alert('🎉 Connecté !', 'La partie va commencer !');
    } else {
      Alert.alert(
        'Aucune partie trouvée',
        'Votre partenaire n\'a pas encore créé de partie.\nDemandez-lui de créer une partie d\'abord.',
        [{ text: 'OK' }]
      );
    }
  };

  const startGameLocal = (game) => {
    resetAllGameStates();
    setGameMode('local');
    setActiveGame(game);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // 🔥 Compter comme interaction pour les flammes
    recordInteraction();
  };

  const startGameOnline = (game) => {
    openGameLobby(game);
    // 🔥 Compter comme interaction pour les flammes
    recordInteraction();
  };

  const nextQuestion = () => {
    if (currentQuestion < totalQuizQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      setShowResult(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // ⛔ Pas de notification ici : mode local, les deux joueurs sont côte à côte
    }
  };

  // Helper: ajouter un message dans le fil de conversation
  const addToThread = (entry) => {
    setTodThread(prev => [...prev, { ...entry, id: Date.now(), timestamp: new Date().toISOString() }]);
    setTimeout(() => todScrollRef.current?.scrollToEnd?.({ animated: true }), 200);
  };

  // Helper: ajouter une réaction à la dernière entrée du fil
  const addReactionToThread = (emoji) => {
    setTodThread(prev => {
      const updated = [...prev];
      // Trouver la dernière réponse
      for (let i = updated.length - 1; i >= 0; i--) {
        if (updated[i].type === 'response') {
          updated[i] = { ...updated[i], reaction: emoji };
          break;
        }
      }
      return updated;
    });
  };

  const selectTruthOrDare = async (type) => {
    const myName = user?.name || 'Moi';
    const partnerName = partner?.name || 'Partenaire';
    
    setTodChosenType(type);
    setTodResponse('');
    setTodSubmitted(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Ajouter le choix dans le fil — C'est MOI qui choisis quand isMyTurnToAsk est true
    const chooserName = isMyTurnToAsk ? myName : partnerName;
    addToThread({
      type: 'choice',
      player: chooserName,
      choice: type,
      text: type === 'truth' ? '💬 Vérité' : '⚡ Action',
      round: todRound,
    });
    
    if (todGameMode === 'custom') {
      // MODE PERSONNALISÉ
      setTodAsker(isMyTurnToAsk ? myName : partnerName);
      setTodAnswerer(isMyTurnToAsk ? partnerName : myName);
      
      if (gameMode === 'online' && isFirebaseReady) {
        await submitAnswer(`tod_choice_${todRound}`, {
          type,
          chosenBy: myName,
          round: todRound,
          timestamp: Date.now()
        }, myName);
      }
      
      if (isMyTurnToAsk) {
        setTodPhase('writeQuestion');
      } else {
        setTodPhase('waitQuestion');
      }
    } else {
      // MODE CLASSIQUE: Question aléatoire
      const items = type === 'truth' ? TRUTH_OR_DARE.truths
        : (gameMode === 'online' && isFirebaseReady ? DISTANCE_DARES : TRUTH_OR_DARE.dares);
      const random = items[Math.floor(Math.random() * items.length)];
      const selection = { type, text: random, round: todRound };
      setTruthOrDare(selection);
      
      const asker = isMyTurnToAsk ? myName : partnerName;
      const answerer = isMyTurnToAsk ? partnerName : myName;
      setTodAsker(asker);
      setTodAnswerer(answerer);
      
      // Ajouter la question dans le fil
      addToThread({
        type: 'question',
        player: asker,
        questionType: type,
        text: random,
        round: todRound,
      });
      
      if (isMyTurnToAsk) {
        setTodPhase('waitAnswer');
      } else {
        setTodPhase('answer');
      }
      
      if (gameMode === 'online' && isFirebaseReady) {
        await submitAnswer(`tod_question_${todRound}`, { 
          type, text: random, 
          askedBy: asker, mustAnswerBy: answerer,
          round: todRound, mode: 'classic',
          timestamp: Date.now()
        }, myName);
        // Notifier le partenaire qu'il doit répondre
        if (isMyTurnToAsk) {
          await notifyGameAnswer();
        }
      }
    }
  };

  // Envoyer une question personnalisée au partenaire
  const submitCustomQuestion = async () => {
    if (!todCustomQuestion.trim()) {
      Alert.alert('Oops', 'Écris une question ou un défi pour ton partenaire !');
      return;
    }
    
    const myName = user?.name || 'Moi';
    const partnerName = partner?.name || 'Partenaire';
    const questionText = todCustomQuestion.trim();
    const selection = { type: todChosenType, text: questionText, round: todRound };
    setTruthOrDare(selection);
    
    // Ajouter la question dans le fil
    addToThread({
      type: 'question',
      player: myName,
      questionType: todChosenType,
      text: questionText,
      round: todRound,
    });
    
    setTodPhase('waitAnswer');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (gameMode === 'online' && isFirebaseReady) {
      await submitAnswer(`tod_question_${todRound}`, {
        type: todChosenType, text: questionText,
        askedBy: myName, mustAnswerBy: partnerName,
        round: todRound, mode: 'custom',
        timestamp: Date.now()
      }, myName);
      // Notifier le partenaire que sa question perso est arrivée
      await notifyGameAnswer();
    }
  };

  // Soumettre la réponse à une Action/Vérité
  const submitTodResponse = async () => {
    if (!todResponse.trim()) {
      Alert.alert('Oops', 'Écris ta réponse avant de soumettre !');
      return;
    }
    
    const myName = user?.name || 'Moi';
    const responseText = todResponse.trim();
    
    // Ajouter la réponse dans le fil
    addToThread({
      type: 'response',
      player: myName,
      text: responseText,
      round: todRound,
    });
    
    setTodSubmitted(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    if (gameMode === 'online' && isFirebaseReady) {
      // En mode online, le répondeur attend la réaction du questioner
      setTodWaitingReaction(true);
      setTodPhase('waitReaction');
      await submitAnswer(`tod_response_${todRound}`, {
        response: responseText,
        respondedBy: myName,
        question: truthOrDare,
        round: todRound,
        timestamp: Date.now()
      }, myName);
      await notifyGameAnswer();
    } else {
      // En mode local, le répondeur peut réagir lui-même (pas de séparation)
      setTodPhase('react');
    }
  };

  // Confirmer qu'une Action a été réalisée
  const confirmActionDone = async () => {
    const myName = user?.name || 'Moi';
    const responseText = '✅ Action réalisée !';
    
    addToThread({
      type: 'response',
      player: myName,
      text: responseText,
      round: todRound,
    });
    
    setTodSubmitted(true);
    setTodResponse(responseText);
    setTodActionChoice('fait');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    if (gameMode === 'online' && isFirebaseReady) {
      setTodWaitingReaction(true);
      setTodPhase('waitReaction');
      await submitAnswer(`tod_response_${todRound}`, {
        response: responseText,
        respondedBy: myName,
        question: truthOrDare,
        round: todRound,
        actionChoice: 'fait',
        timestamp: Date.now()
      }, myName);
      await notifyGameAnswer();
    } else {
      setTodPhase('react');
    }
  };

  // ✅ Fonction centralisée: Avancer au tour suivant d'Action/Vérité
  const advanceToNextTodRound = () => {
    setTruthOrDare(null);
    setTodResponse('');
    setTodSubmitted(false);
    setTodRound(prev => prev + 1);
    setTodPhase('choose');
    setTodCustomQuestion('');
    setTodChosenType(null);
    setTodPartnerResponse(null);
    setTodWaitingReaction(false);
    setTodWaitingNextSync(false);
    setTodActionChoice(null);
    setDiscussOpen(false);
    setDiscussMessages([]);
    setDiscussInput('');
    // isMyTurnToAsk sera recalculé automatiquement par le useEffect basé sur todRound
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Réagir avec un emoji et passer au tour suivant
  const reactAndNextRound = async (emoji) => {
    const myName = user?.name || 'Moi';
    
    // Ajouter la réaction dans le fil
    addReactionToThread(emoji);
    addToThread({
      type: 'reaction',
      player: myName,
      text: emoji,
      round: todRound,
    });
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Synchroniser la réaction en mode online
    if (gameMode === 'online' && isFirebaseReady) {
      // ✅ Set waiting AVANT d'envoyer à Firebase pour éviter la race condition
      setTodWaitingNextSync(true);
      await notifyProofReaction(emoji === '✅' || emoji === '👍' ? 'approved' : 'rejected');
      await submitAnswer(`tod_reaction_${todRound}`, {
        reaction: emoji,
        reactedBy: myName,
        round: todRound,
        timestamp: Date.now()
      }, myName);
      
      // Signaler "prêt pour le tour suivant" et attendre le partenaire
      await submitAnswer(`ready_next_tod_${todRound}`, {
        ready: true,
        playerName: myName,
        timestamp: Date.now(),
      }, myName);
      
      // ✅ NE PAS vérifier gameData ici — c'est une closure stale après await
      // Le listener useEffect (section 5) détectera le signal du partenaire
    } else {
      // Mode local: avancer directement après un délai
      setTimeout(() => advanceToNextTodRound(), 800);
    }
  };

  // Passer au tour suivant d'Action/Vérité sans réagir
  const nextTodRound = async () => {
    const myName = user?.name || 'Moi';
    
    if (gameMode === 'online' && isFirebaseReady) {
      // ✅ Set waiting AVANT d'envoyer à Firebase pour éviter la race condition
      setTodWaitingNextSync(true);
      
      // Signaler "prêt pour le tour suivant" et attendre le partenaire
      await submitAnswer(`ready_next_tod_${todRound}`, {
        ready: true,
        playerName: myName,
        timestamp: Date.now(),
      }, myName);
      
      // ✅ NE PAS vérifier gameData ici — c'est une closure stale après await
      // Le listener useEffect (section 5) détectera le signal du partenaire
    } else {
      // Mode local: avancer directement
      advanceToNextTodRound();
    }
  };

  // Obtenir la réponse du partenaire pour le tour actuel
  const getPartnerTodResponse = useCallback(() => {
    if (!gameData?.answers) return null;
    const responseKey = `tod_response_${todRound}`;
    const responses = gameData.answers[responseKey];
    if (!responses) return null;
    
    // Trouver la réponse qui n'est pas la mienne
    for (const [playerId, data] of Object.entries(responses)) {
      if (data.respondedBy !== user?.name) {
        return data;
      }
    }
    return null;
  }, [gameData, todRound, user?.name]);

  const addScore = (player) => {
    setScores({
      ...scores,
      [player]: scores[player] + 1,
    });
    nextQuestion();
  };

  const selectWyrOption = (option) => {
    setWyrChoice(option);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const nextWyrQuestion = () => {
    if (currentQuestion < WOULD_YOU_RATHER.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setWyrChoice(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      setShowResult(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // ⛔ Pas de notification ici : mode local, les deux joueurs sont côte à côte
    }
  };

  const renderWouldYouRather = () => {
    const myName = user?.name || 'Moi';
    const partnerName = partner?.name || 'Partenaire';
    const currentQ = WOULD_YOU_RATHER[currentQuestion];
    const isOnline = gameMode === 'online';

    // ══════ MODE ONLINE ══════
    const handleWyrAnswerOnline = async (choice) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setWyrPlayer1Choice(choice);
      setWyrPhase('waitingPartner');
      await submitOnlineAnswer(choice);
    };

    // ══════ MODE LOCAL ══════
    const handleWyrAnswer = (choice) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      if (wyrPhase === 'player1') {
        setWyrPlayer1Choice(choice);
        setWyrPhase('passPhone');
      } else if (wyrPhase === 'player2') {
        setWyrPlayer2Choice(choice);
        setWyrPhase('reveal');
      }
    };

    const handleWyrNext = () => {
      // ✅ MODE ONLINE: Signaler qu'on est prêt et attendre le partenaire
      if (isOnline) {
        setWyrPhase('waitingNext');
        signalReadyForNext();
        return;
      }
      // MODE LOCAL: Avancer directement
      if (currentQuestion < WOULD_YOU_RATHER.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setWyrPhase('player1');
        setWyrPlayer1Choice(null);
        setWyrPlayer2Choice(null);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        setShowResult(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // ⛔ Pas de notification ici : mode local
      }
    };

    // Options partagées
    const renderWyrOptions = (onAnswer) => (
      <>
        <TouchableOpacity
          style={styles.wyrOption}
          onPress={() => onAnswer(1)}
        >
          <Text style={styles.wyrOptionText}>{currentQ.option1}</Text>
        </TouchableOpacity>

        <Text style={styles.wyrOr}>OU</Text>

        <TouchableOpacity
          style={styles.wyrOption}
          onPress={() => onAnswer(2)}
        >
          <Text style={styles.wyrOptionText}>{currentQ.option2}</Text>
        </TouchableOpacity>
      </>
    );

    // Déterminer la réponse du partenaire (online vs local)
    const partnerChoice = isOnline ? onlinePartnerAnswer : wyrPlayer2Choice;

    return (
      <View style={styles.gameContainer}>
        {!showResult ? (
          <>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${((currentQuestion + 1) / WOULD_YOU_RATHER.length) * 100}%` }]} />
            </View>
            <Text style={styles.questionNumber}>{currentQuestion + 1}/{WOULD_YOU_RATHER.length}</Text>
            
            <Text style={styles.wyrTitle}>Tu préfères...</Text>

            {/* ══════ MODE ONLINE: Chaque joueur choisit sur son tel ══════ */}
            {isOnline && wyrPhase === 'player1' && (
              <View style={styles.wyrPhaseContainer}>
                <Text style={styles.wyrPhaseTitle}>🌐 Fais ton choix !</Text>
                {renderWyrOptions(handleWyrAnswerOnline)}
              </View>
            )}

            {/* MODE ONLINE: En attente */}
            {isOnline && wyrPhase === 'waitingPartner' && (
              <View style={styles.onlineWaitingContainer}>
                <Text style={styles.onlineWaitingEmoji}>⏳</Text>
                <Text style={styles.onlineWaitingTitle}>Choix envoyé !</Text>
                <ActivityIndicator size="large" color="#fff" style={{ marginVertical: 15 }} />
                <Text style={styles.onlineWaitingText}>
                  En attente du choix de {partnerName}...
                </Text>
              </View>
            )}

            {/* ══════ MODE LOCAL: Phase 1 ══════ */}
            {!isOnline && wyrPhase === 'player1' && (
              <View style={styles.wyrPhaseContainer}>
                <Text style={styles.wyrPhaseTitle}>🎯 C'est au tour de {myName}</Text>
                {renderWyrOptions(handleWyrAnswer)}
              </View>
            )}

            {/* MODE LOCAL: Passer le téléphone */}
            {!isOnline && wyrPhase === 'passPhone' && (
              <View style={styles.passPhoneContainer}>
                <Text style={styles.passPhoneEmoji}>📱</Text>
                <Text style={styles.passPhoneTitle}>Passe le téléphone !</Text>
                <Text style={styles.passPhoneText}>
                  {myName} a fait son choix. Maintenant passe le téléphone à {partnerName} !
                </Text>
                <Text style={styles.passPhoneWarning}>⚠️ {partnerName} ne doit pas voir le choix de {myName} !</Text>
                <TouchableOpacity
                  style={styles.passPhoneButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setWyrPhase('player2');
                  }}
                >
                  <Text style={styles.passPhoneButtonText}>👋 {partnerName} est prêt(e)</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* MODE LOCAL: Phase 2 */}
            {!isOnline && wyrPhase === 'player2' && (
              <View style={styles.wyrPhaseContainer}>
                <Text style={styles.wyrPhaseTitle}>🎯 C'est au tour de {partnerName}</Text>
                {renderWyrOptions(handleWyrAnswer)}
              </View>
            )}

            {/* ══════ REVEAL (online + local) ══════ */}
            {wyrPhase === 'reveal' && (
              <View style={styles.quizRevealContainer}>
                <Text style={styles.quizRevealTitle}>🔮 Révélation !</Text>
                
                <View style={styles.quizRevealAnswers}>
                  <View style={styles.quizRevealAnswer}>
                    <Text style={styles.quizRevealLabel}>{myName} préfère :</Text>
                    <Text style={styles.quizRevealValue}>
                      {wyrPlayer1Choice === 1 ? currentQ.option1 : currentQ.option2}
                    </Text>
                  </View>
                  <View style={styles.quizRevealAnswer}>
                    <Text style={styles.quizRevealLabel}>{partnerName} préfère :</Text>
                    <Text style={styles.quizRevealValue}>
                      {partnerChoice === 1 ? currentQ.option1 : currentQ.option2}
                    </Text>
                  </View>
                  
                  {wyrPlayer1Choice === partnerChoice ? (
                    <Text style={styles.quizMatch}>✨ Vous êtes d'accord !</Text>
                  ) : (
                    <Text style={styles.wimDisagree}>🤔 Goûts différents !</Text>
                  )}
                </View>

                {/* ══════ ZONE DISCUSSION ══════ */}
                {!discussOpen ? (
                  <TouchableOpacity style={styles.discussBanner} onPress={() => { setDiscussOpen(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}>
                    <Text style={styles.discussBannerText}>💬 Discuter avant de continuer ?</Text>
                    <Text style={styles.discussBannerArrow}>▾</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.discussPanel}>
                    <View style={styles.discussPanelHeader}>
                      <Text style={styles.discussPanelTitle}>💬 Discussion</Text>
                      <TouchableOpacity onPress={() => setDiscussOpen(false)}><Text style={styles.discussPanelClose}>✕ Fermer</Text></TouchableOpacity>
                    </View>
                    <ScrollView ref={discussScrollRef} style={styles.discussMsgList} contentContainerStyle={{ paddingBottom: 6 }} nestedScrollEnabled onContentSizeChange={() => discussScrollRef.current?.scrollToEnd({ animated: true })}>
                      {discussMessages.length === 0 && <Text style={styles.discussMsgEmpty}>Dites quelque chose... 💕</Text>}
                      {discussMessages.map((msg, i) => (
                        <View key={msg._id || i} style={[styles.discussMsgBubble, msg.player === (user?.name || 'Moi') ? styles.discussMsgMine : styles.discussMsgTheirs]}>
                          <Text style={styles.discussMsgName}>{msg.player}</Text>
                          {msg.type === 'text' && <Text style={styles.discussMsgText}>{msg.text}</Text>}
                          {msg.type === 'image' && (
                            <Pressable onPress={() => setFullScreenImg(msg.uri)} style={styles.discussMsgImgWrapper}>
                              <Image source={{ uri: msg.uri }} style={styles.discussMsgImg} resizeMode="cover" />
                              <View style={styles.discussMsgImgBadge}><Text style={styles.discussMsgImgBadgeText}>🔍</Text></View>
                            </Pressable>
                          )}
                          {msg.type === 'audio' && (
                            <TouchableOpacity style={styles.discussAudioBtn} onPress={() => playDiscussAudio(msg.uri)}>
                              <Text style={styles.discussAudioBtnText}>{playingAudioUri === msg.uri ? '⏹ Stop' : '▶ Écouter le vocal'}</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
                    </ScrollView>
                    <View style={styles.discussInputBar}>
                      <TextInput style={styles.discussTextInput} value={discussInput} onChangeText={setDiscussInput} placeholder="Écris quelque chose..." placeholderTextColor="rgba(255,255,255,0.5)" multiline maxLength={300} />
                      <TouchableOpacity style={styles.discussSendBtn} onPress={sendDiscussMessage} disabled={!discussInput.trim() || discussUploading}><Text style={styles.discussSendBtnText}>→</Text></TouchableOpacity>
                      <TouchableOpacity style={[styles.discussVoiceBtn, discussIsRecording && styles.discussVoiceBtnRec]} onPress={discussIsRecording ? stopDiscussRecording : startDiscussRecording} disabled={discussUploading}><Text style={styles.discussVoiceBtnText}>{discussIsRecording ? `⏹ ${recordingSeconds}s` : '🎤'}</Text></TouchableOpacity>
                      <TouchableOpacity style={styles.discussImgBtn} onPress={pickDiscussImage} disabled={discussUploading}><Text style={styles.discussImgBtnText}>📸</Text></TouchableOpacity>
                    </View>
                    {discussUploading && <ActivityIndicator size="small" color="#fff" style={{ marginVertical: 4 }} />}
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.quizNextButton, { marginTop: 20 }]}
                  onPress={handleWyrNext}
                >
                  <Text style={styles.quizNextButtonText}>
                    {currentQuestion < WOULD_YOU_RATHER.length - 1 ? 'Suivant →' : 'Terminer ✓'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ══════ MODE ONLINE: En attente que le partenaire clique Suivant ══════ */}
            {isOnline && wyrPhase === 'waitingNext' && (
              <View style={styles.onlineWaitingContainer}>
                <Text style={styles.onlineWaitingEmoji}>⏳</Text>
                <Text style={styles.onlineWaitingTitle}>Prêt !</Text>
                <ActivityIndicator size="large" color="#fff" style={{ marginVertical: 15 }} />
                <Text style={styles.onlineWaitingText}>
                  En attente de {partnerName} pour continuer...
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.resultContainer}>
            <Text style={styles.resultEmoji}>🎉</Text>
            <Text style={styles.resultTitle}>Bravo {myName} & {partnerName} !</Text>
            <Text style={styles.resultScore}>Vous avez terminé le jeu "Tu préfères" !</Text>
            <Text style={styles.wyrResultHint}>Discutez de vos choix différents 💕</Text>
            <TouchableOpacity
              style={styles.playAgainButton}
              onPress={async () => {
                if (isOnline) {
                  await clearGameAnswers(); // Nettoyer Firebase avant de rejouer
                  nextOnlineQuestion();
                }
                setCurrentQuestion(0);
                setWyrChoice(null);
                setWyrPhase('player1');
                setWyrPlayer1Choice(null);
                setWyrPlayer2Choice(null);
                setShowResult(false);
              }}
            >
              <Text style={styles.playAgainText}>🔄 Rejouer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quitGameButton}
              onPress={() => {
                setActiveGame(null);
                endGameSession();
                setGameMode(null);
                resetAllGameStates();
              }}
            >
              <Text style={styles.quitGameText}>🚪 Quitter</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const getGameTitle = (gameType) => {
    const titles = {
      'quiz': '🧠 Quiz Couple',
      'truthordare': '🎲 Action ou Vérité',
      'whoismore': '🏆 Qui est le Plus...',
      'wouldyourather': '🤔 Tu Préfères...',
    };
    return titles[gameType] || 'Jeu';
  };

  const renderLobbyModal = () => (
    <Modal
      visible={showLobby}
      transparent
      animationType="slide"
      onRequestClose={() => {
        setShowLobby(false);
        endGameSession();
      }}
    >
      <View style={styles.lobbyOverlay}>
        <View style={styles.lobbyContent}>
          <Text style={styles.lobbyTitle}>{getGameTitle(selectedGameForLobby)}</Text>
          <Text style={styles.lobbySubtitle}>Mode à distance — chacun sur son téléphone</Text>

          {/* Indicateur partenaire */}
          {partner && (
            <View style={styles.partnerIndicator}>
              <Text style={styles.partnerIndicatorText}>
                {partnerOnline ? '🟢' : '⚪'} {partner.name} {partnerOnline ? 'est connecté(e)' : ''}
              </Text>
            </View>
          )}

          {/* Créer une partie */}
          <TouchableOpacity
            style={[styles.lobbyOption, waitingForPartner && styles.lobbyOptionActive]}
            onPress={handleCreateGame}
            disabled={isCreatingGame || waitingForPartner}
          >
            <LinearGradient 
              colors={waitingForPartner ? ['#F59E0B', '#D97706'] : ['#8B5CF6', '#A855F7']} 
              style={styles.lobbyOptionGradient}
            >
              {isCreatingGame ? (
                <ActivityIndicator color="#fff" size="large" />
              ) : waitingForPartner ? (
                <>
                  <ActivityIndicator color="#fff" size="small" style={{ marginRight: 15 }} />
                  <View style={styles.lobbyOptionTextContainer}>
                    <Text style={styles.lobbyOptionTitle}>En attente de {partner?.name || 'partenaire'}...</Text>
                    <Text style={styles.lobbyOptionDesc}>La partie commencera automatiquement</Text>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.lobbyOptionIcon}>🎮</Text>
                  <View style={styles.lobbyOptionTextContainer}>
                    <Text style={styles.lobbyOptionTitle}>Créer une partie</Text>
                    <Text style={styles.lobbyOptionDesc}>{partner?.name || 'Partenaire'} recevra une notification</Text>
                  </View>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Rejoindre une partie */}
          <TouchableOpacity
            style={styles.lobbyOption}
            onPress={handleJoinGame}
            disabled={isJoiningGame || waitingForPartner}
          >
            <LinearGradient colors={['#10B981', '#059669']} style={styles.lobbyOptionGradient}>
              {isJoiningGame ? (
                <ActivityIndicator color="#fff" size="large" />
              ) : (
                <>
                  <Text style={styles.lobbyOptionIcon}>🤝</Text>
                  <View style={styles.lobbyOptionTextContainer}>
                    <Text style={styles.lobbyOptionTitle}>Rejoindre la partie</Text>
                    <Text style={styles.lobbyOptionDesc}>Si {partner?.name || 'partenaire'} a déjà créé une partie</Text>
                  </View>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Bouton Annuler */}
          <TouchableOpacity
            style={styles.lobbyCancelButton}
            onPress={() => {
              setShowLobby(false);
              endGameSession();
            }}
          >
            <Text style={styles.lobbyCancelText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Modal pour afficher les invitations de jeu du partenaire
  const renderInviteModal = () => {
    if (!pendingGameInvite) return null;
    
    return (
      <Modal
        visible={showInviteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.lobbyOverlay}>
          <View style={styles.inviteContent}>
            <Text style={styles.inviteEmoji}>🎮</Text>
            <Text style={styles.inviteTitle}>Invitation de jeu !</Text>
            <Text style={styles.inviteText}>
              {partner?.name || pendingGameInvite.creatorName} vous invite à jouer à
            </Text>
            <Text style={styles.inviteGameName}>
              {getGameTitle(pendingGameInvite.gameType)}
            </Text>
            
            <TouchableOpacity
              style={styles.inviteAcceptButton}
              onPress={async () => {
                setShowInviteModal(false);
                setIsJoiningGame(true);
                const session = await joinGameSession(user?.name || 'Joueur 2');
                setIsJoiningGame(false);
                
                if (session && !session.error) {
                  setGameMode('online');
                  gameStartedRef.current = false; // Permettre au watcher de démarrer le jeu
                  // Le session watcher détectera status='ready' et démarrera automatiquement
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
              }}
            >
              <LinearGradient colors={['#10B981', '#059669']} style={styles.inviteAcceptGradient}>
                {isJoiningGame ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.inviteAcceptText}>🎉 Rejoindre la partie !</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.inviteDeclineButton}
              onPress={() => setShowInviteModal(false)}
            >
              <Text style={styles.inviteDeclineText}>Plus tard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const renderGameSelector = () => (
    <ScrollView contentContainerStyle={styles.gamesGrid}>
      {/* ═══ Bannière invitation en attente ═══ */}
      {pendingGameInvite && !showInviteModal && (
        <TouchableOpacity 
          style={styles.inviteBanner}
          onPress={() => setShowInviteModal(true)}
        >
          <LinearGradient colors={[theme.secondary, theme.accent]} style={styles.inviteBannerGradient}>
            <Text style={styles.inviteBannerEmoji}>🎮</Text>
            <View style={styles.inviteBannerTextContainer}>
              <Text style={styles.inviteBannerTitle}>
                {partner?.name || 'Partenaire'} vous attend !
              </Text>
              <Text style={styles.inviteBannerDesc}>
                Touchez pour rejoindre {getGameTitle(pendingGameInvite.gameType)}
              </Text>
            </View>
            <Text style={styles.inviteBannerArrow}>→</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* ═══ SECTION 1 : JOUER À DISTANCE ═══ */}
      {/* ═══════════════════════════════════════════════════ */}
      <View style={styles.distanceSection}>
        <Text style={styles.distanceSectionTitle}>🌐 JOUER À DISTANCE</Text>
        <Text style={styles.distanceSectionDesc}>
          Chacun sur son téléphone, jouez où que vous soyez !
        </Text>

        {/* 4 cartes de jeux à distance */}
        <View style={styles.onlineGamesGrid}>
          <TouchableOpacity 
            style={styles.onlineGameCard}
            onPress={() => startGameOnline('quiz')}
          >
            <LinearGradient colors={[theme.secondary, theme.accent]} style={styles.onlineGameGradient}>
              <Text style={styles.onlineGameIcon}>🧠</Text>
              <Text style={styles.onlineGameTitle}>Quiz</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.onlineGameCard}
            onPress={() => startGameOnline('truthordare')}
          >
            <LinearGradient colors={['#8B5CF6', '#A855F7']} style={styles.onlineGameGradient}>
              <Text style={styles.onlineGameIcon}>🎲</Text>
              <Text style={styles.onlineGameTitle}>Action/Vérité</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.onlineGameCard}
            onPress={() => startGameOnline('whoismore')}
          >
            <LinearGradient colors={['#10B981', '#059669']} style={styles.onlineGameGradient}>
              <Text style={styles.onlineGameIcon}>🏆</Text>
              <Text style={styles.onlineGameTitle}>Qui est le +</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.onlineGameCard}
            onPress={() => startGameOnline('wouldyourather')}
          >
            <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.onlineGameGradient}>
              <Text style={styles.onlineGameIcon}>🤔</Text>
              <Text style={styles.onlineGameTitle}>Tu Préfères</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Bouton Rejoindre si une partie existe */}
        {hasActiveSession && gameSession && gameSession.createdBy !== myPlayerId && (
          <TouchableOpacity
            style={styles.joinActiveButton}
            onPress={async () => {
              setIsJoiningGame(true);
              const result = await joinGameSession(user?.name || 'Joueur 2');
              setIsJoiningGame(false);
              
              if (result && !result.error) {
                setGameMode('online');
                gameStartedRef.current = false; // Permettre au watcher de démarrer le jeu
                // Le session watcher détectera status='ready' et démarrera automatiquement
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } else {
                Alert.alert('Erreur', result?.error || 'Impossible de rejoindre');
              }
            }}
            disabled={isJoiningGame}
          >
            <LinearGradient colors={['#10B981', '#059669']} style={styles.joinActiveGradient}>
              {isJoiningGame ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.joinActiveText}>
                  🤝 Rejoindre {getGameTitle(gameSession.gameType)} de {partner?.name || 'Partenaire'}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Session active indicator */}
        {hasActiveSession && gameSession && gameSession.createdBy === myPlayerId && waitingForPartner && (
          <View style={styles.activeSessionBanner}>
            <ActivityIndicator size="small" color="#fff" style={{ marginBottom: 5 }} />
            <Text style={styles.activeSessionText}>
              ⏳ En attente de {partner?.name || 'Partenaire'} pour {getGameTitle(gameSession.gameType)}
            </Text>
            <TouchableOpacity
              style={styles.cancelSessionButton}
              onPress={() => endGameSession()}
            >
              <Text style={styles.cancelSessionText}>✕ Annuler</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ═══ Séparateur ═══ */}
      <View style={styles.sectionSeparator}>
        <View style={styles.separatorLine} />
        <Text style={styles.separatorText}>📱 MÊME TÉLÉPHONE</Text>
        <View style={styles.separatorLine} />
      </View>

      {/* ═══════════════════════════════════════════════════ */}
      {/* ═══ SECTION 2 : JEUX EN LOCAL ═══ */}
      {/* ═══════════════════════════════════════════════════ */}
      <Text style={styles.gamesSectionTitle}>Passez-vous le téléphone pour jouer ensemble</Text>

      <TouchableOpacity style={styles.gameCard} onPress={() => startGameLocal('quiz')}>
        <LinearGradient colors={[theme.secondary, theme.accent]} style={styles.gameGradient}>
          <Text style={styles.gameIcon}>🧠</Text>
          <Text style={styles.gameTitle}>Quiz Couple</Text>
          <Text style={styles.gameDesc}>Testez votre complicité !</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity style={styles.gameCard} onPress={() => startGameLocal('truthordare')}>
        <LinearGradient colors={['#8B5CF6', '#A855F7']} style={styles.gameGradient}>
          <Text style={styles.gameIcon}>🎲</Text>
          <Text style={styles.gameTitle}>Action ou Vérité</Text>
          <Text style={styles.gameDesc}>Version couple épicée</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity style={styles.gameCard} onPress={() => startGameLocal('whoismore')}>
        <LinearGradient colors={['#10B981', '#059669']} style={styles.gameGradient}>
          <Text style={styles.gameIcon}>🏆</Text>
          <Text style={styles.gameTitle}>Qui est le Plus...</Text>
          <Text style={styles.gameDesc}>Pointez l'un vers l'autre !</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity style={styles.gameCard} onPress={() => startGameLocal('wouldyourather')}>
        <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.gameGradient}>
          <Text style={styles.gameIcon}>🤔</Text>
          <Text style={styles.gameTitle}>Tu Préfères...</Text>
          <Text style={styles.gameDesc}>Des choix impossibles !</Text>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderQuizGame = () => {
    const question = shuffledQuizQuestions[currentQuestion];
    const myName = user?.name || 'Joueur 1';
    const partnerName = partner?.name || 'Joueur 2';
    const isOnline = gameMode === 'online';
    
    // ✅ ALTERNANCE: Le créateur de la session est répondeur sur les questions paires,
    // le joiner est répondeur sur les questions impaires.
    // "Répondeur" = celui dont la question parle (il connaît la vraie réponse)
    // "Devineur" = l'autre joueur (il doit deviner)
    const iAmCreator = gameSession?.createdBy === myPlayerId;
    const iAmResponder = isOnline
      ? (currentQuestion % 2 === 0) === iAmCreator
      : currentQuestion % 2 === 0;
    const responderName = iAmResponder ? myName : partnerName;
    const guesserName = iAmResponder ? partnerName : myName;

    // ✅ ALTERNANCE MODE LOCAL: Questions paires → myName répond, partnerName devine
    //                           Questions impaires → partnerName répond, myName devine
    const localResponder = currentQuestion % 2 === 0 ? myName : partnerName;
    const localGuesser = currentQuestion % 2 === 0 ? partnerName : myName;

    // ══════ MODE ONLINE ══════
    const handleQuizAnswerOnline = async (answer) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setPlayer1Answer(answer);
      setQuizPhase('waitingPartner');
      await submitOnlineAnswer(answer);
    };

    // ══════ MODE LOCAL (passe le téléphone) ══════
    const handleQuizAnswer = (answer) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      if (quizPhase === 'player1') {
        setPlayer1Answer(answer);
        setQuizPhase('passPhone1');
      } else if (quizPhase === 'player2') {
        setPlayer2Answer(answer);
        // Pour les questions 'choice', on peut auto-valider
        if (question.type === 'choice') {
          // Vérifier si la réponse du devineur correspond à celle du répondeur
          if (answer === player1Answer) {
            // Le devineur a trouvé ! +1 point pour le devineur
            // Questions paires → partnerName devine (player2), questions impaires → myName devine (player1)
            const scoringPlayer = currentQuestion % 2 === 0 ? 'player2' : 'player1';
            setScores(prev => ({
              ...prev,
              [scoringPlayer]: prev[scoringPlayer] + 1,
            }));
            setQuizValidated(true);
          } else {
            setQuizValidated(true);
          }
        }
        setQuizPhase('reveal');
      }
    };

    const handleQuizNext = () => {
      // ✅ MODE ONLINE: Signaler qu'on est prêt et attendre le partenaire
      if (isOnline) {
        setQuizPhase('waitingNext');
        signalReadyForNext();
        return;
      }
      // MODE LOCAL: Avancer directement
      if (currentQuestion < totalQuizQuestions - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setQuizPhase('player1');
        setPlayer1Answer(null);
        setPlayer2Answer(null);
        setQuizOpenAnswer('');
        setQuizValidated(false);
        setQuizLastValidationResult(null);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        setShowResult(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // ⛔ Pas de notification ici : mode local
      }
    };

    // ✅ Valider la réponse du devineur (appelé par le répondeur pour les questions open)
    const handleValidateAnswer = async (isCorrect) => {
      if (quizValidated) return; // Empêcher double-validation
      setQuizValidated(true);
      setQuizLastValidationResult(isCorrect);
      
      // En mode online: envoyer la validation via Firebase pour que le devineur voie le résultat
      if (isOnline) {
        const validationKey = `quiz_validation_${currentQuestion}`;
        await submitAnswer(validationKey, {
          isCorrect,
          responderName: responderName,
          guesserName: guesserName,
          timestamp: Date.now(),
        }, user?.name);
        
        if (isCorrect) {
          // En mode online, le devineur est celui qui n'est PAS répondeur
          const scoringPlayer = iAmResponder ? 'player2' : 'player1';
          setScores(prev => ({
            ...prev,
            [scoringPlayer]: prev[scoringPlayer] + 1,
          }));
        }
      } else {
        // En mode local: alterner le devineur selon la question
        // Questions paires → partnerName devine (player2), questions impaires → myName devine (player1)
        if (isCorrect) {
          const scoringPlayer = currentQuestion % 2 === 0 ? 'player2' : 'player1';
          setScores(prev => ({
            ...prev,
            [scoringPlayer]: prev[scoringPlayer] + 1,
          }));
        }
      }
      
      if (isCorrect) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    };

    // Afficher les options de réponse (partagé)
    const renderQuizOptions = (onAnswer, isResponder) => (
      question.type === 'choice' ? (
        <View style={styles.quizOptions}>
          {question.options.map((option, idx) => (
            <TouchableOpacity
              key={`opt-${idx}`}
              style={styles.quizOptionButton}
              onPress={() => onAnswer(option)}
            >
              <Text style={styles.quizOptionText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.quizOpenContainer}
        >
          <Text style={styles.quizOpenLabel}>
            {isResponder ? '📝 Écris ta vraie réponse :' : '🤔 Devine la réponse :'}
          </Text>
          <TextInput
            style={styles.quizOpenInput}
            value={quizOpenAnswer}
            onChangeText={setQuizOpenAnswer}
            placeholder={isResponder ? 'Ta vraie réponse...' : 'Devine...'}
            placeholderTextColor="#999"
            multiline
            maxLength={200}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[
              styles.quizOpenSubmitButton,
              !quizOpenAnswer.trim() && styles.quizOpenSubmitDisabled
            ]}
            onPress={() => {
              if (quizOpenAnswer.trim()) {
                onAnswer(quizOpenAnswer.trim());
                setQuizOpenAnswer('');
              }
            }}
            disabled={!quizOpenAnswer.trim()}
          >
            <Text style={styles.quizOpenSubmitText}>
              {quizOpenAnswer.trim() ? 'Envoyer ✓' : 'Écris ta réponse...'}
            </Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      )
    );

    return (
      <View style={styles.gameContainer}>
        {!showResult ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${((currentQuestion + 1) / totalQuizQuestions) * 100}%` }]} />
            </View>
            
            <View style={styles.quizScoreBoard}>
              <View style={styles.quizPlayerScore}>
                <Text style={styles.quizPlayerLabel}>{myName}</Text>
                <Text style={styles.quizPlayerPoints}>{scores.player1} pts</Text>
              </View>
              <Text style={styles.quizVs}>VS</Text>
              <View style={styles.quizPlayerScore}>
                <Text style={styles.quizPlayerLabel}>{partnerName}</Text>
                <Text style={styles.quizPlayerPoints}>{scores.player2} pts</Text>
              </View>
            </View>

            <Text style={styles.questionNumber}>Question {currentQuestion + 1}/{totalQuizQuestions}</Text>
            
            <View style={styles.questionCard}>
              <Text style={styles.questionText}>{question.question}</Text>
            </View>

            {/* ══════ MODE ONLINE: Chaque joueur a son rôle ══════ */}
            {isOnline && quizPhase === 'player1' && (
              <View style={styles.quizPhaseContainer}>
                {iAmResponder ? (
                  <>
                    <Text style={styles.quizPhaseTitle}>📝 Cette question parle de toi !</Text>
                    <Text style={styles.quizPhaseHint}>Donne ta vraie réponse. {partnerName} doit deviner !</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.quizPhaseTitle}>🤔 Devine la réponse de {partnerName} !</Text>
                    <Text style={styles.quizPhaseHint}>{partnerName} donne sa vraie réponse de son côté</Text>
                  </>
                )}
                {renderQuizOptions(handleQuizAnswerOnline, iAmResponder)}
              </View>
            )}

            {/* MODE ONLINE: En attente du partenaire */}
            {isOnline && quizPhase === 'waitingPartner' && (
              <View style={styles.onlineWaitingContainer}>
                <Text style={styles.onlineWaitingEmoji}>⏳</Text>
                <Text style={styles.onlineWaitingTitle}>Réponse envoyée !</Text>
                <ActivityIndicator size="large" color="#fff" style={{ marginVertical: 15 }} />
                <Text style={styles.onlineWaitingText}>
                  En attente de la réponse de {partnerName}...
                </Text>
              </View>
            )}

            {/* ══════ MODE LOCAL: Phase 1 — Le répondeur donne sa vraie réponse ══════ */}
            {!isOnline && quizPhase === 'player1' && (
              <View style={styles.quizPhaseContainer}>
                <Text style={styles.quizPhaseTitle}>📝 {localResponder}, cette question parle de toi !</Text>
                <Text style={styles.quizPhaseHint}>Donne ta vraie réponse. {localGuesser} devra deviner ensuite !</Text>
                {renderQuizOptions(handleQuizAnswer, true)}
              </View>
            )}

            {/* MODE LOCAL: Passer le téléphone */}
            {!isOnline && quizPhase === 'passPhone1' && (
              <View style={styles.passPhoneContainer}>
                <Text style={styles.passPhoneEmoji}>📱</Text>
                <Text style={styles.passPhoneTitle}>Passe le téléphone !</Text>
                <Text style={styles.passPhoneText}>
                  {localResponder} a donné sa réponse. Maintenant {localGuesser} doit deviner !
                </Text>
                <Text style={styles.passPhoneWarning}>⚠️ {localGuesser} ne doit pas voir la réponse !</Text>
                <TouchableOpacity
                  style={styles.passPhoneButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setQuizPhase('player2');
                  }}
                >
                  <Text style={styles.passPhoneButtonText}>👋 {localGuesser} est prêt(e)</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* MODE LOCAL: Phase 2 — Le devineur devine */}
            {!isOnline && quizPhase === 'player2' && (
              <View style={styles.quizPhaseContainer}>
                <Text style={styles.quizPhaseTitle}>🤔 {localGuesser}, devine la réponse !</Text>
                <Text style={styles.quizPhaseHint}>Quelle est la réponse de {localResponder} selon toi ?</Text>
                {renderQuizOptions(handleQuizAnswer, false)}
              </View>
            )}

            {/* ══════ REVEAL (online + local) ══════ */}
            {quizPhase === 'reveal' && (() => {
              // Déterminer les réponses du répondeur et du devineur
              const currentResponderName = isOnline ? responderName : localResponder;
              const currentGuesserName = isOnline ? guesserName : localGuesser;
              const responderAnswer = isOnline
                ? (iAmResponder ? player1Answer : onlinePartnerAnswer)
                : player1Answer;
              const guesserAnswer = isOnline
                ? (iAmResponder ? onlinePartnerAnswer : player1Answer)
                : player2Answer;
              
              // Pour les questions choice: auto-validation
              const isChoiceCorrect = question.type === 'choice' && responderAnswer === guesserAnswer;

              return (
                <View style={styles.quizRevealContainer}>
                  {/* ✅ Grand feedback visuel immédiat pour les questions choice */}
                  {question.type === 'choice' && (
                    <View style={[styles.quizBigFeedback, { backgroundColor: isChoiceCorrect ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)' }]}>
                      <Text style={{ fontSize: 60 }}>{isChoiceCorrect ? '🎉' : '😅'}</Text>
                      <Text style={[styles.quizBigFeedbackText, { color: isChoiceCorrect ? '#10B981' : '#EF4444' }]}>
                        {isChoiceCorrect
                          ? `${currentGuesserName} a trouvé !`
                          : `${currentGuesserName} s'est trompé(e) !`
                        }
                      </Text>
                    </View>
                  )}

                  <Text style={styles.quizRevealTitle}>🎯 Révélation !</Text>
                  
                  <View style={styles.quizRevealAnswers}>
                    {/* Réponse du répondeur (la vraie réponse) */}
                    <View style={question.type === 'open' ? styles.quizRevealAnswerOpen : styles.quizRevealAnswer}>
                      <Text style={styles.quizRevealLabel}>✅ {currentResponderName} (vraie réponse) :</Text>
                      <Text style={question.type === 'open' ? styles.quizRevealValueOpen : styles.quizRevealValue}>
                        {responderAnswer}
                      </Text>
                    </View>
                    {/* Réponse du devineur */}
                    <View style={question.type === 'open' ? styles.quizRevealAnswerOpen : styles.quizRevealAnswer}>
                      <Text style={styles.quizRevealLabel}>🤔 {currentGuesserName} (a deviné) :</Text>
                      <Text style={question.type === 'open' ? styles.quizRevealValueOpen : styles.quizRevealValue}>
                        {guesserAnswer}
                      </Text>
                    </View>

                    {/* Résultat pour questions CHOICE: automatique */}
                    {question.type === 'choice' && (
                      isChoiceCorrect ? (
                        <Text style={styles.quizMatch}>✅ {currentGuesserName} a trouvé la bonne réponse ! +1 point</Text>
                      ) : (
                        <Text style={styles.wimDisagree}>❌ Mauvaise réponse ! La bonne réponse était : {responderAnswer}</Text>
                      )
                    )}

                    {/* Résultat pour questions OPEN: le répondeur valide */}
                    {question.type === 'open' && !quizValidated && (
                      <View>
                        <Text style={styles.quizRevealQuestion}>
                          {isOnline 
                            ? (iAmResponder 
                              ? `${myName}, est-ce que ${currentGuesserName} a bien deviné ?`
                              : `⏳ ${currentResponderName} vérifie ta réponse...`)
                            : `${currentResponderName}, est-ce que ${currentGuesserName} a bien deviné ?`
                          }
                        </Text>
                        {/* Afficher les boutons seulement si je suis le répondeur (online) ou toujours (local) */}
                        {(!isOnline || iAmResponder) && (
                          <View style={styles.quizRevealButtons}>
                            <TouchableOpacity
                              style={[styles.quizRevealBtn, { backgroundColor: '#10B981' }]}
                              onPress={() => handleValidateAnswer(true)}
                            >
                              <Text style={styles.quizRevealBtnText}>✅ Correct !</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.quizRevealBtn, { backgroundColor: '#EF4444' }]}
                              onPress={() => handleValidateAnswer(false)}
                            >
                              <Text style={[styles.quizRevealBtnText, { color: '#fff' }]}>❌ Incorrect</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                        {isOnline && !iAmResponder && (
                          <ActivityIndicator size="small" color="#fff" style={{ marginTop: 10 }} />
                        )}
                      </View>
                    )}

                    {/* Résultat affiché après validation pour les questions open */}
                    {question.type === 'open' && quizValidated && (
                      <View>
                        <View style={[styles.quizBigFeedback, { backgroundColor: quizLastValidationResult ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)' }]}>
                          <Text style={{ fontSize: 50 }}>{quizLastValidationResult ? '🎉' : '😅'}</Text>
                          <Text style={[styles.quizBigFeedbackText, { color: quizLastValidationResult ? '#10B981' : '#EF4444' }]}>
                            {quizLastValidationResult 
                              ? `${currentGuesserName} a bien deviné !`
                              : `${currentGuesserName} s'est trompé(e) !`
                            }
                          </Text>
                        </View>
                        <Text style={quizLastValidationResult ? styles.quizMatch : styles.wimDisagree}>
                          {quizLastValidationResult 
                            ? `✅ Bonne réponse ! ${currentGuesserName} gagne 1 point !`
                            : `❌ Pas tout à fait... Pas de point cette fois !`
                          }
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* ══════ ZONE DISCUSSION ══════ */}
                  {(question.type === 'choice' || quizValidated) && (
                    !discussOpen ? (
                      <TouchableOpacity style={styles.discussBanner} onPress={() => { setDiscussOpen(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}>
                        <Text style={styles.discussBannerText}>💬 Discuter avant de continuer ?</Text>
                        <Text style={styles.discussBannerArrow}>▾</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.discussPanel}>
                        <View style={styles.discussPanelHeader}>
                          <Text style={styles.discussPanelTitle}>💬 Discussion</Text>
                          <TouchableOpacity onPress={() => setDiscussOpen(false)}><Text style={styles.discussPanelClose}>✕ Fermer</Text></TouchableOpacity>
                        </View>
                        <ScrollView ref={discussScrollRef} style={styles.discussMsgList} contentContainerStyle={{ paddingBottom: 6 }} nestedScrollEnabled onContentSizeChange={() => discussScrollRef.current?.scrollToEnd({ animated: true })}>
                          {discussMessages.length === 0 && <Text style={styles.discussMsgEmpty}>Dites quelque chose... 💕</Text>}
                          {discussMessages.map((msg, i) => (
                            <View key={msg._id || i} style={[styles.discussMsgBubble, msg.player === (user?.name || 'Moi') ? styles.discussMsgMine : styles.discussMsgTheirs]}>
                              <Text style={styles.discussMsgName}>{msg.player}</Text>
                              {msg.type === 'text' && <Text style={styles.discussMsgText}>{msg.text}</Text>}
                              {msg.type === 'image' && (
                                <Pressable onPress={() => setFullScreenImg(msg.uri)} style={styles.discussMsgImgWrapper}>
                                  <Image source={{ uri: msg.uri }} style={styles.discussMsgImg} resizeMode="cover" />
                                  <View style={styles.discussMsgImgBadge}><Text style={styles.discussMsgImgBadgeText}>🔍</Text></View>
                                </Pressable>
                              )}
                              {msg.type === 'audio' && (
                                <TouchableOpacity style={styles.discussAudioBtn} onPress={() => playDiscussAudio(msg.uri)}>
                                  <Text style={styles.discussAudioBtnText}>{playingAudioUri === msg.uri ? '⏹ Stop' : '▶ Écouter le vocal'}</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          ))}
                        </ScrollView>
                        <View style={styles.discussInputBar}>
                          <TextInput style={styles.discussTextInput} value={discussInput} onChangeText={setDiscussInput} placeholder="Écris quelque chose..." placeholderTextColor="rgba(255,255,255,0.5)" multiline maxLength={300} />
                          <TouchableOpacity style={styles.discussSendBtn} onPress={sendDiscussMessage} disabled={!discussInput.trim() || discussUploading}><Text style={styles.discussSendBtnText}>→</Text></TouchableOpacity>
                          <TouchableOpacity style={[styles.discussVoiceBtn, discussIsRecording && styles.discussVoiceBtnRec]} onPress={discussIsRecording ? stopDiscussRecording : startDiscussRecording} disabled={discussUploading}><Text style={styles.discussVoiceBtnText}>{discussIsRecording ? `⏹ ${recordingSeconds}s` : '🎤'}</Text></TouchableOpacity>
                          <TouchableOpacity style={styles.discussImgBtn} onPress={pickDiscussImage} disabled={discussUploading}><Text style={styles.discussImgBtnText}>📸</Text></TouchableOpacity>
                        </View>
                        {discussUploading && <ActivityIndicator size="small" color="#fff" style={{ marginVertical: 4 }} />}
                      </View>
                    )
                  )}

                  {/* Bouton suivant : visible seulement après validation */}
                  {(question.type === 'choice' || quizValidated) && (
                    <TouchableOpacity style={styles.quizNextButton} onPress={handleQuizNext}>
                      <Text style={styles.quizNextButtonText}>
                        {currentQuestion < totalQuizQuestions - 1 ? 'Question suivante →' : 'Voir résultats 🏆'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })()}

            {/* ══════ MODE ONLINE: En attente que le partenaire clique Suivant ══════ */}
            {isOnline && quizPhase === 'waitingNext' && (
              <View style={styles.onlineWaitingContainer}>
                <Text style={styles.onlineWaitingEmoji}>⏳</Text>
                <Text style={styles.onlineWaitingTitle}>Prêt !</Text>
                <ActivityIndicator size="large" color="#fff" style={{ marginVertical: 15 }} />
                <Text style={styles.onlineWaitingText}>
                  En attente de {partnerName} pour continuer...
                </Text>
              </View>
            )}
          </ScrollView>
        ) : (
          <View style={styles.resultContainer}>
            <Text style={styles.resultEmoji}>🏆</Text>
            <Text style={styles.resultTitle}>Résultats du Quiz !</Text>
            <Text style={styles.resultScore}>
              {scores.player1 > scores.player2 
                ? `${myName} gagne ${scores.player1}-${scores.player2} !`
                : scores.player2 > scores.player1
                ? `${partnerName} gagne ${scores.player2}-${scores.player1} !`
                : `Égalité ${scores.player1}-${scores.player2} !`
              }
            </Text>
            <Text style={styles.quizResultHint}>Vous vous connaissez {Math.round((scores.player1 + scores.player2) / totalQuizQuestions * 100)}% 💕</Text>
            <TouchableOpacity
              style={styles.playAgainButton}
              onPress={async () => {
                if (isOnline) {
                  await clearGameAnswers(); // Nettoyer Firebase avant de rejouer
                  nextOnlineQuestion();
                }
                setShuffledQuizQuestions(shuffleAndPick(QUIZ_QUESTIONS, QUIZ_QUESTIONS.length));
                setCurrentQuestion(0);
                setScores({ player1: 0, player2: 0 });
                setShowResult(false);
                setQuizPhase('player1');
                setPlayer1Answer(null);
                setPlayer2Answer(null);
                setQuizOpenAnswer('');
                setQuizValidated(false);
                setQuizLastValidationResult(null);
              }}
            >
              <Text style={styles.playAgainText}>🔄 Rejouer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quitGameButton}
              onPress={() => {
                setActiveGame(null);
                endGameSession();
                setGameMode(null);
                resetAllGameStates();
              }}
            >
              <Text style={styles.quitGameText}>🚪 Quitter</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderTruthOrDare = () => {
    const myName = user?.name || 'Moi';
    const partnerName = partner?.name || 'Partenaire';
    
    // Rendu d'une bulle dans le fil de conversation
    const renderThreadBubble = (item, index) => {
      const isMe = item.player === myName;
      
      if (item.type === 'choice') {
        return (
          <View key={item.id || index} style={styles.todBubbleRow}>
            <View style={[styles.todBubbleSystem]}>
              <Text style={styles.todBubbleSystemText}>
                {item.player} choisit → {item.text}
              </Text>
            </View>
          </View>
        );
      }
      
      if (item.type === 'question') {
        return (
          <View key={item.id || index} style={[styles.todBubbleRow, isMe ? styles.todBubbleRowRight : styles.todBubbleRowLeft]}>
            <View style={styles.todBubbleName}>
              <Text style={styles.todBubbleNameText}>{item.player}</Text>
            </View>
            <View style={[styles.todBubble, styles.todBubbleQuestion]}>
              <Text style={styles.todBubbleTypeTag}>
                {item.questionType === 'truth' ? '💬 Vérité' : '⚡ Action'}
              </Text>
              <Text style={styles.todBubbleQuestionText}>{item.text}</Text>
            </View>
          </View>
        );
      }
      
      if (item.type === 'response') {
        return (
          <View key={item.id || index} style={[styles.todBubbleRow, isMe ? styles.todBubbleRowRight : styles.todBubbleRowLeft]}>
            <View style={styles.todBubbleName}>
              <Text style={styles.todBubbleNameText}>{item.player}</Text>
            </View>
            <View style={[styles.todBubble, styles.todBubbleResponse]}>
              <Text style={styles.todBubbleResponseLabel}>Réponse :</Text>
              <Text style={styles.todBubbleResponseText}>{item.text}</Text>
              {item.reaction && (
                <View style={styles.todBubbleReactionBadge}>
                  <Text style={styles.todBubbleReactionBadgeText}>{item.reaction}</Text>
                </View>
              )}
            </View>
          </View>
        );
      }
      
      if (item.type === 'reaction') {
        return (
          <View key={item.id || index} style={[styles.todBubbleRow, isMe ? styles.todBubbleRowRight : styles.todBubbleRowLeft]}>
            <View style={styles.todReactionInline}>
              <Text style={styles.todReactionInlineText}>{item.player} → {item.text}</Text>
            </View>
          </View>
        );
      }

      if (item.type === 'proof') {
        return (
          <View key={item.id || index} style={[styles.todBubbleRow, isMe ? styles.todBubbleRowRight : styles.todBubbleRowLeft]}>
            <View style={styles.todBubbleName}><Text style={styles.todBubbleNameText}>{item.player}</Text></View>
            <View style={[styles.todBubble, styles.todBubbleProof]}>
              <Text style={styles.todBubbleProofLabel}>📸 Preuve envoyée !</Text>
              {item.proofType === 'image' && (
                <Pressable onPress={() => setFullScreenImg(item.uri)} style={styles.todProofImgWrapper}>
                  <Image source={{ uri: item.uri }} style={styles.todProofImage} resizeMode="cover" />
                  <View style={styles.todProofImgOverlay}><Text style={styles.todProofImgOverlayText}>🔍 Agrandir</Text></View>
                </Pressable>
              )}
              {item.proofType === 'video' && (
                <View style={styles.todProofVideoWrapper}>
                  <AvVideo
                    source={{ uri: item.uri }}
                    style={styles.todProofVideo}
                    useNativeControls
                    resizeMode={ResizeMode.CONTAIN}
                    shouldPlay={false}
                  />
                </View>
              )}
            </View>
          </View>
        );
      }

      return null;
    };
    
    return (
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.gameContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 80}
      >
        {/* Header */}
        <View style={styles.todTurnIndicator}>
          <Text style={styles.todTurnText}>
            {todGameMode 
              ? (todGameMode === 'custom' ? '✍️ Mode Personnalisé' : '🎲 Mode Classique')
              : '🎭 Action ou Vérité'}
          </Text>
          <Text style={styles.todRoundText}>Tour {todRound + 1}</Text>
        </View>

        {/* ===================== PHASE: MODE SELECT ===================== */}
        {todPhase === 'modeSelect' && (
          <View style={styles.todChoice}>
            <Text style={[styles.todTitle, { fontSize: 22 }]}>Choisis un mode :</Text>
            
            <TouchableOpacity
              style={styles.todButton}
              onPress={() => {
                setTodGameMode('classic');
                setTodPhase('choose');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
            >
              <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.todButtonGradient}>
                <Text style={styles.todButtonIcon}>🎲</Text>
                <Text style={styles.todButtonText}>CLASSIQUE</Text>
                <Text style={styles.todButtonHint}>Questions aléatoires du jeu</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <Text style={styles.todOr}>ou</Text>
            
            <TouchableOpacity
              style={styles.todButton}
              onPress={() => {
                setTodGameMode('custom');
                setTodPhase('choose');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
            >
              <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.todButtonGradient}>
                <Text style={styles.todButtonIcon}>✍️</Text>
                <Text style={styles.todButtonText}>PERSONNALISÉ</Text>
                <Text style={styles.todButtonHint}>Écrivez vos propres questions !</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* ================ FIL DE CONVERSATION (visible après modeSelect) ================ */}
        {todPhase !== 'modeSelect' && (
          <>
            {/* Le fil de discussion scrollable */}
            <ScrollView 
              ref={todScrollRef}
              style={styles.todThreadContainer}
              contentContainerStyle={styles.todThreadContent}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => todScrollRef.current?.scrollToEnd?.({ animated: true })}
            >
              {/* Séparateur de début */}
              {todThread.length === 0 && (
                <View style={styles.todThreadEmpty}>
                  <Text style={styles.todThreadEmptyText}>
                    {isMyTurnToAsk 
                      ? `C'est ton tour ! Choisis Action ou Vérité pour ${partnerName}` 
                      : `C'est le tour de ${partnerName}. En attente...`}
                  </Text>
                </View>
              )}
              
              {/* Toutes les bulles */}
              {todThread.map((item, index) => renderThreadBubble(item, index))}
              
              {/* Indicateur d'attente si nécessaire */}
              {(todPhase === 'waitAnswer' || todPhase === 'waitQuestion' || todPhase === 'waitReaction') && (
                <View style={styles.todThreadWaiting}>
                  <ActivityIndicator size="small" color="#FF6B9D" />
                  <Text style={styles.todThreadWaitingText}>
                    {todPhase === 'waitAnswer' 
                      ? `${todAnswerer || partnerName} écrit sa réponse...`
                      : todPhase === 'waitReaction'
                      ? `${partnerName} réagit à ta réponse... 🎭`
                      : `${partnerName} écrit la question...`}
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* ===================== ZONE D'ACTION (en bas) ===================== */}
            
            {/* PHASE: CHOOSE — Boutons Action/Vérité */}
            {todPhase === 'choose' && (
              <View style={styles.todBottomBar}>
                {isMyTurnToAsk ? (
                  <>
                    <Text style={styles.todBottomLabel}>
                      {todGameMode === 'custom' 
                        ? `Choisis pour ${partnerName} :`
                        : `Choisis pour ${partnerName} :`}
                    </Text>
                    <View style={styles.todBottomButtons}>
                      <TouchableOpacity
                        style={[styles.todBottomBtn, { backgroundColor: '#3B82F6' }]}
                        onPress={() => selectTruthOrDare('truth')}
                      >
                        <Text style={styles.todBottomBtnText}>💬 VÉRITÉ</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.todBottomBtn, { backgroundColor: '#EF4444' }]}
                        onPress={() => selectTruthOrDare('dare')}
                      >
                        <Text style={styles.todBottomBtnText}>⚡ ACTION</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <View style={styles.todBottomWait}>
                    <ActivityIndicator size="small" color="#FF6B9D" />
                    <Text style={styles.todBottomWaitText}>
                      {partnerName} choisit Action ou Vérité...
                    </Text>
                    {gameMode !== 'online' && (
                      <TouchableOpacity
                        style={styles.todBottomLocalBtn}
                        onPress={() => setIsMyTurnToAsk(true)}
                      >
                        <Text style={styles.todBottomLocalBtnText}>👋 C'est mon tour</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* PHASE: WRITE QUESTION — Input pour écrire la question */}
            {todPhase === 'writeQuestion' && (
              <View style={styles.todBottomBar}>
                <Text style={styles.todBottomLabel}>
                  {todChosenType === 'truth' ? '💬 Écris ta question :' : '⚡ Écris ton défi :'}
                </Text>
                <View style={styles.todInputRow}>
                  <TextInput
                    style={styles.todBottomInput}
                    value={todCustomQuestion}
                    onChangeText={setTodCustomQuestion}
                    placeholder={todChosenType === 'truth' 
                      ? "Pose ta question..." 
                      : "Décris le défi..."}
                    placeholderTextColor="#999"
                    multiline
                    maxLength={300}
                    autoFocus
                  />
                  <TouchableOpacity
                    style={[styles.todSendBtn, !todCustomQuestion.trim() && styles.todSendBtnDisabled]}
                    onPress={submitCustomQuestion}
                    disabled={!todCustomQuestion.trim()}
                  >
                    <Text style={styles.todSendBtnText}>✉️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* PHASE: WAIT QUESTION — En attente de la question */}
            {todPhase === 'waitQuestion' && (
              <View style={styles.todBottomBar}>
                <View style={styles.todBottomWait}>
                  <ActivityIndicator size="small" color="#FF6B9D" />
                  <Text style={styles.todBottomWaitText}>
                    {partnerName} écrit {todChosenType === 'truth' ? 'une question' : 'un défi'} pour toi...
                  </Text>
                </View>
              </View>
            )}

            {/* PHASE: ANSWER — Input pour répondre */}
            {todPhase === 'answer' && truthOrDare && (
              <View style={styles.todBottomBar}>
                {truthOrDare.type === 'truth' ? (
                  <>
                    <Text style={styles.todBottomLabel}>📝 Ta réponse :</Text>
                    <View style={styles.todInputRow}>
                      <TextInput
                        style={styles.todBottomInput}
                        value={todResponse}
                        onChangeText={setTodResponse}
                        placeholder="Écris ta réponse..."
                        placeholderTextColor="#999"
                        multiline
                        maxLength={500}
                        autoFocus
                      />
                      <TouchableOpacity
                        style={[styles.todSendBtn, !todResponse.trim() && styles.todSendBtnDisabled]}
                        onPress={submitTodResponse}
                        disabled={!todResponse.trim()}
                      >
                        <Text style={styles.todSendBtnText}>✓</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={styles.todBottomLabel}>⚡ As-tu fait l'action ?</Text>
                    <View style={styles.todBottomButtons}>
                      <TouchableOpacity
                        style={[styles.todBottomBtn, { backgroundColor: '#10B981' }]}
                        onPress={confirmActionDone}
                      >
                        <Text style={styles.todBottomBtnText}>✅ Fait !</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.todBottomBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                        onPress={async () => {
                          const responseText = '😅 A choisi de passer cette action';
                          addToThread({ type: 'response', player: myName, text: responseText, round: todRound });
                          setTodSubmitted(true);
                          setTodResponse(responseText);
                          setTodActionChoice('passe');
                          if (gameMode === 'online' && isFirebaseReady) {
                            setTodWaitingReaction(true);
                            setTodPhase('waitReaction');
                            await submitAnswer(`tod_response_${todRound}`, {
                              response: responseText, respondedBy: myName,
                              question: truthOrDare, round: todRound, actionChoice: 'passe', timestamp: Date.now()
                            }, myName);
                          } else {
                            setTodPhase('react');
                          }
                        }}
                      >
                        <Text style={styles.todBottomBtnText}>😅 Passe</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            )}

            {/* PHASE: WAIT ANSWER — En attente de la réponse */}
            {todPhase === 'waitAnswer' && (
              <View style={styles.todBottomBar}>
                <View style={styles.todBottomWait}>
                  <ActivityIndicator size="small" color="#FF6B9D" />
                  <Text style={styles.todBottomWaitText}>
                    En attente de la réponse de {todAnswerer || partnerName}...
                  </Text>
                </View>
                {gameMode !== 'online' && (
                  <TouchableOpacity
                    style={styles.todBottomLocalBtn}
                    onPress={() => setTodPhase('answer')}
                  >
                    <Text style={styles.todBottomLocalBtnText}>📱 Téléphone passé à {todAnswerer}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* PHASE: REACT — Discussion + Réactions emoji */}
            {todPhase === 'react' && !todWaitingNextSync && (
              <View style={styles.todBottomBar}>
                {/* Résumé du choix du partenaire */}
                <Text style={styles.todBottomLabel}>
                  {todPartnerResponse?.includes('passer') ? `😅 ${partnerName} a passé cette action` : `✅ ${partnerName} a fait l'action !`}
                </Text>

                {/* Zone discussion */}
                {!discussOpen ? (
                  <TouchableOpacity style={styles.discussBanner} onPress={() => { setDiscussOpen(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}>
                    <Text style={styles.discussBannerText}>💬 Discuter avant de réagir ?</Text>
                    <Text style={styles.discussBannerArrow}>▾</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.discussPanel, { marginBottom: 8 }]}>
                    <View style={styles.discussPanelHeader}>
                      <Text style={styles.discussPanelTitle}>💬 Discussion</Text>
                      <TouchableOpacity onPress={() => setDiscussOpen(false)}><Text style={styles.discussPanelClose}>✕</Text></TouchableOpacity>
                    </View>
                    <ScrollView ref={discussScrollRef} style={styles.discussMsgList} contentContainerStyle={{ paddingBottom: 6 }} nestedScrollEnabled onContentSizeChange={() => discussScrollRef.current?.scrollToEnd({ animated: true })}>
                      {discussMessages.length === 0 && <Text style={styles.discussMsgEmpty}>Dites quelque chose... 💕</Text>}
                      {discussMessages.map((msg, i) => (
                        <View key={msg._id || i} style={[styles.discussMsgBubble, msg.player === (user?.name || 'Moi') ? styles.discussMsgMine : styles.discussMsgTheirs]}>
                          <Text style={styles.discussMsgName}>{msg.player}</Text>
                          {msg.type === 'text' && <Text style={styles.discussMsgText}>{msg.text}</Text>}
                          {msg.type === 'image' && (
                            <Pressable onPress={() => setFullScreenImg(msg.uri)} style={styles.discussMsgImgWrapper}>
                              <Image source={{ uri: msg.uri }} style={styles.discussMsgImg} resizeMode="cover" />
                            </Pressable>
                          )}
                          {msg.type === 'audio' && (
                            <TouchableOpacity style={styles.discussAudioBtn} onPress={() => playDiscussAudio(msg.uri)}>
                              <Text style={styles.discussAudioBtnText}>{playingAudioUri === msg.uri ? '⏹ Stop' : '▶ Écouter'}</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
                    </ScrollView>
                    <View style={styles.discussInputBar}>
                      <TextInput style={styles.discussTextInput} value={discussInput} onChangeText={setDiscussInput} placeholder="Écris quelque chose..." placeholderTextColor="rgba(255,255,255,0.5)" multiline maxLength={300} />
                      <TouchableOpacity style={styles.discussSendBtn} onPress={sendDiscussMessage} disabled={!discussInput.trim() || discussUploading}><Text style={styles.discussSendBtnText}>→</Text></TouchableOpacity>
                      <TouchableOpacity style={[styles.discussVoiceBtn, discussIsRecording && styles.discussVoiceBtnRec]} onPress={discussIsRecording ? stopDiscussRecording : startDiscussRecording} disabled={discussUploading}><Text style={styles.discussVoiceBtnText}>{discussIsRecording ? `⏹ ${recordingSeconds}s` : '🎤'}</Text></TouchableOpacity>
                      <TouchableOpacity style={styles.discussImgBtn} onPress={pickDiscussImage} disabled={discussUploading}><Text style={styles.discussImgBtnText}>📸</Text></TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Réactions emoji */}
                <View style={styles.todReactionRow}>
                  {['👍', '😂', '😱', '🥰', '🔥', '💀', '👏', '😏'].map((emoji) => (
                    <TouchableOpacity key={emoji} style={styles.todReactionBtn} onPress={() => { setDiscussOpen(false); reactAndNextRound(emoji); }}>
                      <Text style={styles.todReactionEmoji}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={styles.todSkipReactBtn} onPress={() => { setDiscussOpen(false); nextTodRound(); }}>
                  <Text style={styles.todSkipReactText}>➡️ Tour suivant</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* PHASE: WAIT REACTION — Le répondeur attend la réaction du questioner (online) */}
            {todPhase === 'waitReaction' && (
              <View style={styles.todBottomBar}>
                {todActionChoice === 'passe' ? (
                  <View style={styles.todBottomWait}>
                    <Text style={{ fontSize: 28 }}>😅</Text>
                    <Text style={styles.todBottomWaitText}>{`Tu as passé cette action\nEn attente de la réaction de ${partnerName}...`}</Text>
                  </View>
                ) : (
                  <View style={styles.todBottomWait}>
                    <ActivityIndicator size="small" color="#FF6B9D" />
                    <Text style={styles.todBottomWaitText}>
                      {todProofSent ? '✅ Preuve envoyée ! En attente de la réaction...' : `💪 Envoie la preuve de ton action !`}
                    </Text>
                  </View>
                )}
                {/* Boutons preuve (action à distance — uniquement si FAIT) */}
                {truthOrDare?.type === 'dare' && !todProofSent && todActionChoice === 'fait' && (
                  <View style={styles.todProofContainer}>
                    <Text style={styles.todProofLabel}>📸 Envoie une preuve !</Text>
                    <View style={styles.todProofButtons}>
                      <TouchableOpacity
                        style={styles.todProofBtn}
                        onPress={() => sendTodProof(true)}
                        disabled={todProofUploading}
                      >
                        {todProofUploading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.todProofBtnText}>📷 Prendre</Text>}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.todProofBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
                        onPress={() => sendTodProof(false)}
                        disabled={todProofUploading}
                      >
                        <Text style={styles.todProofBtnText}>🖼️ Galerie</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* PHASE: WAITING NEXT SYNC — En attente du partenaire pour le tour suivant (online) */}
            {todWaitingNextSync && (
              <View style={styles.todBottomBar}>
                <View style={styles.todBottomWait}>
                  <ActivityIndicator size="small" color="#FF6B9D" />
                  <Text style={styles.todBottomWaitText}>
                    En attente de {partnerName} pour le tour suivant... ⏳
                  </Text>
                </View>
              </View>
            )}
          </>
        )}

        {/* Boutons Rejouer / Quitter (toujours visibles) */}
        {todPhase !== 'modeSelect' && (
          <View style={styles.todEndButtons}>
            <TouchableOpacity
              style={styles.todReplayButton}
              onPress={async () => {
                if (gameMode === 'online') {
                  await clearGameAnswers();
                }
                resetAllGameStates();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
            >
              <Text style={styles.todReplayText}>🔄 Recommencer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.todQuitButton}
              onPress={() => {
                setActiveGame(null);
                endGameSession();
                setGameMode(null);
                resetAllGameStates();
              }}
            >
              <Text style={styles.todQuitText}>🚪 Quitter</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    );
  };

  const renderWhoIsMore = () => {
    const myName = user?.name || 'Moi';
    const partnerName = partner?.name || 'Partenaire';
    const isOnline = gameMode === 'online';

    // ══════ MODE ONLINE ══════
    const handleWimAnswerOnline = async (answer) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setWimPlayer1Answer(answer);
      setWimPhase('waitingPartner');
      await submitOnlineAnswer(answer);
    };

    // ══════ MODE LOCAL ══════
    const handleWimAnswer = (answer) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      if (wimPhase === 'player1') {
        setWimPlayer1Answer(answer);
        setWimPhase('passPhone');
      } else if (wimPhase === 'player2') {
        setWimPlayer2Answer(answer);
        setWimPhase('reveal');
      }
    };

    const handleWimNext = () => {
      // ✅ MODE ONLINE: Signaler qu'on est prêt et attendre le partenaire
      if (isOnline) {
        setWimPhase('waitingNext');
        signalReadyForNext();
        return;
      }
      // MODE LOCAL: Avancer directement
      if (currentQuestion < WHO_IS_MORE.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setWimPhase('player1');
        setWimPlayer1Answer(null);
        setWimPlayer2Answer(null);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        setShowResult(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // ⛔ Pas de notification ici : mode local
      }
    };

    const handleWimScore = (bothAgree, who) => {
      if (bothAgree) {
        if (who === 'player1') {
          setScores(prev => ({ ...prev, player1: prev.player1 + 1 }));
        } else {
          setScores(prev => ({ ...prev, player2: prev.player2 + 1 }));
        }
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      handleWimNext();
    };

    // Boutons partagés
    const renderWimButtons = (onAnswer) => (
      <View style={styles.whoIsMoreButtons}>
        <TouchableOpacity
          style={styles.whoButton}
          onPress={() => onAnswer('player1')}
        >
          <Text style={styles.whoButtonEmoji}>👈</Text>
          <Text style={styles.whoButtonText}>{myName}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.whoButton}
          onPress={() => onAnswer('player2')}
        >
          <Text style={styles.whoButtonEmoji}>👉</Text>
          <Text style={styles.whoButtonText}>{partnerName}</Text>
        </TouchableOpacity>
      </View>
    );

    // Déterminer la réponse du partenaire
    // ✅ En mode online, inverser la réponse du partenaire:
    // Quand partenaire dit "player1" (= lui-même), pour moi c'est "player2" (= le partenaire)
    const invertAnswer = (a) => a === 'player1' ? 'player2' : a === 'player2' ? 'player1' : a;
    const partnerAnswer = isOnline ? invertAnswer(onlinePartnerAnswer) : wimPlayer2Answer;

    return (
      <View style={styles.gameContainer}>
        {!showResult ? (
          <>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${((currentQuestion + 1) / WHO_IS_MORE.length) * 100}%` }]} />
            </View>
            <Text style={styles.questionNumber}>{currentQuestion + 1}/{WHO_IS_MORE.length}</Text>
            
            <View style={styles.questionCard}>
              <Text style={styles.questionText}>{WHO_IS_MORE[currentQuestion]}</Text>
            </View>

            {/* ══════ MODE ONLINE: Chaque joueur pointe sur son tel ══════ */}
            {isOnline && wimPhase === 'player1' && (
              <View style={styles.wimPhaseContainer}>
                <Text style={styles.wimPhaseTitle}>🌐 Qui est le plus... ?</Text>
                <Text style={styles.wimPhaseHint}>{partnerName} répond aussi de son côté</Text>
                {renderWimButtons(handleWimAnswerOnline)}
              </View>
            )}

            {/* MODE ONLINE: En attente */}
            {isOnline && wimPhase === 'waitingPartner' && (
              <View style={styles.onlineWaitingContainer}>
                <Text style={styles.onlineWaitingEmoji}>⏳</Text>
                <Text style={styles.onlineWaitingTitle}>Réponse envoyée !</Text>
                <ActivityIndicator size="large" color="#fff" style={{ marginVertical: 15 }} />
                <Text style={styles.onlineWaitingText}>
                  En attente de la réponse de {partnerName}...
                </Text>
              </View>
            )}

            {/* ══════ MODE LOCAL: Phase 1 ══════ */}
            {!isOnline && wimPhase === 'player1' && (
              <View style={styles.wimPhaseContainer}>
                <Text style={styles.wimPhaseTitle}>🎯 C'est au tour de {myName}</Text>
                <Text style={styles.wimPhaseHint}>Qui correspond le plus à cette question ?</Text>
                {renderWimButtons(handleWimAnswer)}
              </View>
            )}

            {/* MODE LOCAL: Passer le téléphone */}
            {!isOnline && wimPhase === 'passPhone' && (
              <View style={styles.passPhoneContainer}>
                <Text style={styles.passPhoneEmoji}>📱</Text>
                <Text style={styles.passPhoneTitle}>Passe le téléphone !</Text>
                <Text style={styles.passPhoneText}>
                  {myName} a fait son choix. Maintenant passe le téléphone à {partnerName} pour qu'il/elle réponde aussi !
                </Text>
                <Text style={styles.passPhoneWarning}>⚠️ {partnerName} ne doit pas voir le choix de {myName} !</Text>
                <TouchableOpacity
                  style={styles.passPhoneButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setWimPhase('player2');
                  }}
                >
                  <Text style={styles.passPhoneButtonText}>👋 {partnerName} est prêt(e)</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* MODE LOCAL: Phase 2 */}
            {!isOnline && wimPhase === 'player2' && (
              <View style={styles.wimPhaseContainer}>
                <Text style={styles.wimPhaseTitle}>🎯 C'est au tour de {partnerName}</Text>
                <Text style={styles.wimPhaseHint}>Qui correspond le plus à cette question ?</Text>
                {renderWimButtons(handleWimAnswer)}
              </View>
            )}

            {/* ══════ REVEAL (online + local) ══════ */}
            {wimPhase === 'reveal' && (
              <View style={styles.quizRevealContainer}>
                <Text style={styles.quizRevealTitle}>🔮 Révélation !</Text>
                
                <View style={styles.quizRevealAnswers}>
                  <View style={styles.quizRevealAnswer}>
                    <Text style={styles.quizRevealLabel}>{myName} a pointé :</Text>
                    <Text style={styles.quizRevealValue}>
                      {wimPlayer1Answer === 'player1' ? `👈 ${myName}` : `👉 ${partnerName}`}
                    </Text>
                  </View>
                  <View style={styles.quizRevealAnswer}>
                    <Text style={styles.quizRevealLabel}>{partnerName} a pointé :</Text>
                    <Text style={styles.quizRevealValue}>
                      {partnerAnswer === 'player1' ? `👈 ${myName}` : `👉 ${partnerName}`}
                    </Text>
                  </View>
                  
                  {wimPlayer1Answer === partnerAnswer ? (
                    <Text style={styles.quizMatch}>✨ Vous êtes d'accord !</Text>
                  ) : (
                    <Text style={styles.wimDisagree}>🤔 Vous n'êtes pas d'accord !</Text>
                  )}
                </View>

                {/* ══════ ZONE DISCUSSION ══════ */}
                {!discussOpen ? (
                  <TouchableOpacity style={styles.discussBanner} onPress={() => { setDiscussOpen(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}>
                    <Text style={styles.discussBannerText}>💬 Discuter avant de continuer ?</Text>
                    <Text style={styles.discussBannerArrow}>▾</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.discussPanel}>
                    <View style={styles.discussPanelHeader}>
                      <Text style={styles.discussPanelTitle}>💬 Discussion</Text>
                      <TouchableOpacity onPress={() => setDiscussOpen(false)}><Text style={styles.discussPanelClose}>✕ Fermer</Text></TouchableOpacity>
                    </View>
                    <ScrollView ref={discussScrollRef} style={styles.discussMsgList} contentContainerStyle={{ paddingBottom: 6 }} nestedScrollEnabled onContentSizeChange={() => discussScrollRef.current?.scrollToEnd({ animated: true })}>
                      {discussMessages.length === 0 && <Text style={styles.discussMsgEmpty}>Dites quelque chose... 💕</Text>}
                      {discussMessages.map((msg, i) => (
                        <View key={msg._id || i} style={[styles.discussMsgBubble, msg.player === (user?.name || 'Moi') ? styles.discussMsgMine : styles.discussMsgTheirs]}>
                          <Text style={styles.discussMsgName}>{msg.player}</Text>
                          {msg.type === 'text' && <Text style={styles.discussMsgText}>{msg.text}</Text>}
                          {msg.type === 'image' && (
                            <Pressable onPress={() => setFullScreenImg(msg.uri)} style={styles.discussMsgImgWrapper}>
                              <Image source={{ uri: msg.uri }} style={styles.discussMsgImg} resizeMode="cover" />
                              <View style={styles.discussMsgImgBadge}><Text style={styles.discussMsgImgBadgeText}>🔍</Text></View>
                            </Pressable>
                          )}
                          {msg.type === 'audio' && (
                            <TouchableOpacity style={styles.discussAudioBtn} onPress={() => playDiscussAudio(msg.uri)}>
                              <Text style={styles.discussAudioBtnText}>{playingAudioUri === msg.uri ? '⏹ Stop' : '▶ Écouter le vocal'}</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
                    </ScrollView>
                    <View style={styles.discussInputBar}>
                      <TextInput style={styles.discussTextInput} value={discussInput} onChangeText={setDiscussInput} placeholder="Écris quelque chose..." placeholderTextColor="rgba(255,255,255,0.5)" multiline maxLength={300} />
                      <TouchableOpacity style={styles.discussSendBtn} onPress={sendDiscussMessage} disabled={!discussInput.trim() || discussUploading}><Text style={styles.discussSendBtnText}>→</Text></TouchableOpacity>
                      <TouchableOpacity style={[styles.discussVoiceBtn, discussIsRecording && styles.discussVoiceBtnRec]} onPress={discussIsRecording ? stopDiscussRecording : startDiscussRecording} disabled={discussUploading}><Text style={styles.discussVoiceBtnText}>{discussIsRecording ? `⏹ ${recordingSeconds}s` : '🎤'}</Text></TouchableOpacity>
                      <TouchableOpacity style={styles.discussImgBtn} onPress={pickDiscussImage} disabled={discussUploading}><Text style={styles.discussImgBtnText}>📸</Text></TouchableOpacity>
                    </View>
                    {discussUploading && <ActivityIndicator size="small" color="#fff" style={{ marginVertical: 4 }} />}
                  </View>
                )}

                <View style={styles.quizRevealButtons}>
                  {wimPlayer1Answer === partnerAnswer ? (
                    <TouchableOpacity
                      style={[styles.quizRevealBtn, styles.quizRevealBtnBoth]}
                      onPress={() => handleWimScore(true, wimPlayer1Answer)}
                    >
                      <Text style={styles.quizRevealBtnText}>
                        +1 point pour {wimPlayer1Answer === 'player1' ? myName : partnerName} !
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.quizRevealBtn}
                      onPress={() => handleWimScore(false, null)}
                    >
                      <Text style={styles.quizRevealBtnText}>Question suivante →</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* ══════ MODE ONLINE: En attente que le partenaire clique Suivant ══════ */}
            {isOnline && wimPhase === 'waitingNext' && (
              <View style={styles.onlineWaitingContainer}>
                <Text style={styles.onlineWaitingEmoji}>⏳</Text>
                <Text style={styles.onlineWaitingTitle}>Prêt !</Text>
                <ActivityIndicator size="large" color="#fff" style={{ marginVertical: 15 }} />
                <Text style={styles.onlineWaitingText}>
                  En attente de {partnerName} pour continuer...
                </Text>
              </View>
            )}

            <View style={styles.scoresContainer}>
              <Text style={styles.scoreText}>{myName}: {scores.player1}</Text>
              <Text style={styles.scoreText}>{partnerName}: {scores.player2}</Text>
            </View>
          </>
        ) : (
          <View style={styles.resultContainer}>
            <Text style={styles.resultEmoji}>🏆</Text>
            <Text style={styles.resultTitle}>Résultats !</Text>
            <Text style={styles.resultScore}>
              {scores.player1 > scores.player2 
                ? `${myName} gagne ${scores.player1}-${scores.player2} !`
                : scores.player2 > scores.player1
                ? `${partnerName} gagne ${scores.player2}-${scores.player1} !`
                : `Égalité ${scores.player1}-${scores.player2} !`
              }
            </Text>
            <Text style={styles.wyrResultHint}>
              {scores.player1 > scores.player2 
                ? `${myName} est vraiment unique ! 💕`
                : scores.player2 > scores.player1
                ? `${partnerName} est vraiment unique ! 💕`
                : `Vous êtes tous les deux incroyables ! 💕`
              }
            </Text>
            <TouchableOpacity
              style={styles.playAgainButton}
              onPress={async () => {
                if (isOnline) {
                  await clearGameAnswers(); // Nettoyer Firebase avant de rejouer
                  nextOnlineQuestion();
                }
                setCurrentQuestion(0);
                setScores({ player1: 0, player2: 0 });
                setShowResult(false);
                setWimPhase('player1');
                setWimPlayer1Answer(null);
                setWimPlayer2Answer(null);
              }}
            >
              <Text style={styles.playAgainText}>🔄 Rejouer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quitGameButton}
              onPress={() => {
                setActiveGame(null);
                endGameSession();
                setGameMode(null);
                resetAllGameStates();
              }}
            >
              <Text style={styles.quitGameText}>🚪 Quitter</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <LinearGradient
      colors={theme.primary}
      style={styles.container}
    >
      <View style={styles.header}>
        {activeGame ? (
          <TouchableOpacity onPress={() => {
            setActiveGame(null);
            endGameSession();
            setGameMode(null);
            resetAllGameStates();
          }}>
            <Text style={styles.backButton}>← Retour</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 15 }}>
              <Text style={styles.backButton}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>🎮 Jeux Couple</Text>
          </View>
        )}
      </View>

      {/* ⚠️ Bandeau d'erreur Firebase */}
      {firebaseError && !activeGame && (
        <View style={{ backgroundColor: '#FF4444', padding: 12, marginHorizontal: 16, borderRadius: 10, marginBottom: 8 }}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13, textAlign: 'center' }}>
            ⚠️ Connexion Firebase impossible
          </Text>
          <Text style={{ color: '#FFD4D4', fontSize: 11, textAlign: 'center', marginTop: 4 }}>
            Les jeux en ligne ne fonctionneront pas. Vérifiez les règles Firebase.
          </Text>
        </View>
      )}

      {!activeGame && renderGameSelector()}
      {activeGame === 'quiz' && renderQuizGame()}
      {activeGame === 'truthordare' && renderTruthOrDare()}
      {activeGame === 'whoismore' && renderWhoIsMore()}
      {activeGame === 'wouldyourather' && renderWouldYouRather()}

      {/* Modal Lobby */}
      {renderLobbyModal()}
      
      {/* Modal Invitation */}
      {renderInviteModal()}

      {/* Modal Plein écran image */}
      <Modal visible={!!fullScreenImg} transparent animationType="fade" onRequestClose={() => setFullScreenImg(null)}>
        <View style={styles.fsOverlay}>
          <Pressable style={styles.fsImageArea} onPress={() => setFullScreenImg(null)}>
            <Image source={{ uri: fullScreenImg || '' }} style={styles.fsImage} resizeMode="contain" />
          </Pressable>
          <TouchableOpacity style={styles.fsCloseBtn} onPress={() => setFullScreenImg(null)}>
            <Text style={styles.fsCloseBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.fsTapHint}>Appuie pour fermer</Text>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  backButton: {
    fontSize: 18,
    color: '#fff',
  },
  gamesGrid: {
    padding: 20,
    paddingBottom: 120,
  },
  gameCard: {
    marginBottom: 20,
    borderRadius: 25,
    overflow: 'hidden',
  },
  gameGradient: {
    padding: 30,
    alignItems: 'center',
  },
  gameIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  gameTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  gameDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  gameContainer: {
    flex: 1,
    padding: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    marginBottom: 15,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  questionNumber: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  questionCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 25,
    padding: 40,
    alignItems: 'center',
    marginBottom: 30,
  },
  questionText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    lineHeight: 32,
  },
  quizActions: {
    alignItems: 'center',
  },
  quizButton: {
    backgroundColor: '#fff',
    paddingVertical: 18,
    paddingHorizontal: 50,
    borderRadius: 30,
  },
  quizButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#C44569',
  },
  todChoice: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todTurnIndicator: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
  },
  todTurnText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  todRoundText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
  },
  todTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 40,
    textAlign: 'center',
  },
  todButton: {
    width: width * 0.7,
    borderRadius: 25,
    overflow: 'hidden',
  },
  todButtonGradient: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  todButtonIcon: {
    fontSize: 50,
    marginBottom: 15,
  },
  todButtonText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  todButtonHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },
  todOr: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.7)',
    marginVertical: 20,
  },
  todWaitingTurn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  todWaitingIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  todWaitingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  todWaitingHint: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  todReadyButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  todReadyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  todQuestionHeader: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
  },
  todAskerText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  todResult: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 10,
  },
  todResultType: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  todResultCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 25,
    padding: 30,
    width: '100%',
    marginBottom: 20,
  },
  todResultText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    lineHeight: 28,
  },
  todWaitingResponse: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    marginVertical: 15,
  },
  todWaitingResponseText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  todWaitingResponseHint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
  todPassPhoneButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 20,
    marginTop: 15,
  },
  todPassPhoneText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  todNextButton: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginTop: 15,
  },
  todNextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B5CF6',
    textAlign: 'center',
  },
  todHistoryContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 15,
    marginTop: 20,
    width: '100%',
  },
  todHistoryTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  todHistoryScroll: {
    flexDirection: 'row',
  },
  todHistoryItem: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    padding: 10,
    marginRight: 10,
    width: 120,
    alignItems: 'center',
  },
  todHistoryRound: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  todHistoryType: {
    fontSize: 20,
    marginVertical: 5,
  },
  todHistoryAnswer: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    textAlign: 'center',
  },
  whoIsMoreButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  whoButton: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    paddingVertical: 25,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  whoButtonEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  whoButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  scoresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  scoreText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  resultContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  resultScore: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 40,
  },
  playAgainButton: {
    backgroundColor: '#fff',
    paddingVertical: 18,
    paddingHorizontal: 50,
    borderRadius: 30,
    marginBottom: 12,
  },
  playAgainText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#C44569',
  },
  quitGameButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  quitGameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  todEndButtons: {
    marginTop: 20,
    alignItems: 'center',
    gap: 10,
    paddingBottom: 20,
  },
  todReplayButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  todReplayText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#C44569',
  },
  todQuitButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  todQuitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // ===== STYLES FIL DE CONVERSATION =====
  todThreadContainer: {
    flex: 1,
    marginBottom: 5,
  },
  todThreadContent: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  todThreadEmpty: {
    alignItems: 'center',
    padding: 30,
    opacity: 0.7,
  },
  todThreadEmptyText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  todThreadWaiting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 10,
    opacity: 0.8,
  },
  todThreadWaitingText: {
    color: '#fff',
    fontSize: 14,
    fontStyle: 'italic',
  },
  // Bulles
  todBubbleRow: {
    marginBottom: 8,
  },
  todBubbleRowLeft: {
    alignItems: 'flex-start',
  },
  todBubbleRowRight: {
    alignItems: 'flex-end',
  },
  todBubbleName: {
    marginBottom: 3,
    paddingHorizontal: 8,
  },
  todBubbleNameText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  todBubbleSystem: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginVertical: 5,
  },
  todBubbleSystemText: {
    color: '#fff',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  todBubble: {
    maxWidth: '85%',
    borderRadius: 18,
    padding: 14,
  },
  todBubbleQuestion: {
    backgroundColor: 'rgba(139, 92, 246, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.8)',
  },
  todBubbleTypeTag: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#E0D4FF',
    marginBottom: 6,
  },
  todBubbleQuestionText: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 22,
  },
  todBubbleResponse: {
    backgroundColor: 'rgba(16, 185, 129, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.7)',
  },
  todBubbleResponseLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    marginBottom: 4,
  },
  todBubbleResponseText: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 22,
  },
  todBubbleReactionBadge: {
    position: 'absolute',
    bottom: -8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  todBubbleReactionBadgeText: {
    fontSize: 16,
  },
  todReactionInline: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignSelf: 'center',
    marginVertical: 2,
  },
  todReactionInlineText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },
  // Barre du bas (input/boutons)
  todBottomBar: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    padding: 12,
    borderRadius: 15,
    marginHorizontal: 5,
  },
  todBottomLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  todBottomButtons: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  todBottomBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 15,
    alignItems: 'center',
  },
  todBottomBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  todBottomWait: {
    alignItems: 'center',
    padding: 10,
    gap: 8,
  },
  todBottomWaitText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  todBottomLocalBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 8,
  },
  todBottomLocalBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  todInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  todBottomInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#fff',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  todSendBtn: {
    backgroundColor: '#10B981',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todSendBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  todSendBtnText: {
    fontSize: 20,
    color: '#fff',
  },
  todReactionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  todReactionBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 25,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todReactionEmoji: {
    fontSize: 24,
  },
  todSkipReactBtn: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  todSkipReactText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  wyrTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
  },
  wyrOption: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 25,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  wyrOptionSelected: {
    backgroundColor: '#F59E0B',
    borderColor: '#fff',
  },
  wyrOptionText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    lineHeight: 26,
  },
  wyrOptionTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  wyrOr: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginVertical: 15,
  },
  wyrNextButton: {
    backgroundColor: '#fff',
    paddingVertical: 18,
    paddingHorizontal: 50,
    borderRadius: 30,
    alignSelf: 'center',
    marginTop: 30,
  },
  wyrNextButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  wyrResultHint: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 30,
    textAlign: 'center',
  },
  quizScoreBoard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
  },
  quizPlayerScore: {
    alignItems: 'center',
  },
  quizPlayerLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  quizPlayerPoints: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  quizVs: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quizPhaseContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  quizPhaseTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  quizPhaseHint: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 25,
  },
  quizOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  quizOptionButton: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 20,
    margin: 5,
  },
  quizOptionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  quizReadyButton: {
    backgroundColor: '#10B981',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  quizReadyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Styles pour les questions ouvertes du Quiz
  quizOpenContainer: {
    width: '100%',
    marginTop: 10,
  },
  quizOpenLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  quizOpenInput: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    padding: 15,
    fontSize: 16,
    color: '#fff',
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 12,
  },
  quizOpenSubmitButton: {
    backgroundColor: '#10B981',
    borderRadius: 15,
    paddingVertical: 16,
    alignItems: 'center',
  },
  quizOpenSubmitDisabled: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  quizOpenSubmitText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  quizRevealAnswerOpen: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  quizRevealValueOpen: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
    fontStyle: 'italic',
  },
  quizOpenCompareHint: {
    fontSize: 16,
    color: '#8B5CF6',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 15,
  },
  quizRevealContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  quizRevealTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  quizRevealAnswers: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    marginBottom: 20,
  },
  quizRevealAnswer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  quizRevealLabel: {
    fontSize: 16,
    color: '#666',
  },
  quizRevealValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  quizMatch: {
    fontSize: 18,
    color: '#10B981',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 15,
  },
  quizBigFeedback: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
  },
  quizBigFeedbackText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
  },
  quizRevealQuestion: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 15,
  },
  quizRevealButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  quizRevealBtn: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 20,
    margin: 5,
  },
  quizRevealBtnBoth: {
    backgroundColor: '#F59E0B',
  },
  quizRevealBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  quizNextButton: {
    backgroundColor: '#fff',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginTop: 10,
  },
  quizNextButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#C44569',
  },
  quizResultHint: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 30,
  },
  // Styles Lobby
  lobbyOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  lobbyContent: {
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 25,
    alignItems: 'center',
  },
  lobbyTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  lobbySubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 25,
  },
  lobbyOption: {
    width: '100%',
    marginBottom: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  lobbyOptionActive: {
    borderWidth: 3,
    borderColor: '#F59E0B',
  },
  lobbyOptionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  lobbyOptionIcon: {
    fontSize: 40,
    marginRight: 15,
  },
  lobbyOptionTextContainer: {
    flex: 1,
  },
  lobbyOptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  lobbyOptionDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  lobbySeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 15,
  },
  lobbySeparatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  lobbySeparatorText: {
    marginHorizontal: 15,
    color: '#666',
    fontSize: 14,
  },
  partnerIndicator: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 15,
    marginTop: 10,
    marginBottom: 5,
  },
  partnerIndicatorText: {
    fontSize: 14,
    color: '#666',
  },
  syncInfo: {
    backgroundColor: '#e8f4f8',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginTop: 8,
    alignItems: 'center',
  },
  syncInfoText: {
    fontSize: 11,
    color: '#0891b2',
    fontFamily: 'monospace',
  },
  lobbyCancelButton: {
    marginTop: 15,
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  lobbyCancelText: {
    fontSize: 16,
    color: '#999',
  },
  
  // Styles pour l'invitation
  inviteContent: {
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 30,
    width: width * 0.85,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  inviteEmoji: {
    fontSize: 60,
    marginBottom: 15,
  },
  inviteTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  inviteText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
  inviteGameName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B9D',
    marginBottom: 25,
  },
  inviteAcceptButton: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 15,
  },
  inviteAcceptGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  inviteAcceptText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  inviteDeclineButton: {
    paddingVertical: 10,
  },
  inviteDeclineText: {
    fontSize: 16,
    color: '#999',
  },
  
  // Bannière d'invitation
  inviteBanner: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  inviteBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  inviteBannerEmoji: {
    fontSize: 30,
    marginRight: 12,
  },
  inviteBannerTextContainer: {
    flex: 1,
  },
  inviteBannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  inviteBannerDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },
  inviteBannerArrow: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  
  // Indicateur de connexion
  connectionStatus: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 15,
    marginBottom: 20,
    alignSelf: 'stretch',
    marginHorizontal: 0,
  },
  connectionStatusText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginVertical: 2,
  },
  
  // Section jouer à distance
  distanceSection: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  distanceSectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 5,
  },
  distanceSectionDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 15,
  },
  // Grille 2x2 des jeux en ligne
  onlineGamesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  onlineGameCard: {
    width: '47%',
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  onlineGameGradient: {
    paddingVertical: 20,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineGameIcon: {
    fontSize: 36,
    marginBottom: 6,
  },
  onlineGameTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  // Bouton rejoindre partie active
  joinActiveButton: {
    marginTop: 15,
    borderRadius: 18,
    overflow: 'hidden',
  },
  joinActiveGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinActiveText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  // Bouton annuler session
  cancelSessionButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 15,
    marginTop: 8,
  },
  cancelSessionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  distanceButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  distanceButton: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  distanceButtonGradient: {
    paddingVertical: 25,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  distanceButtonIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  distanceButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  distanceButtonSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  activeSessionBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 15,
    padding: 15,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#F59E0B',
    alignItems: 'center',
  },
  activeSessionText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Séparateur
  sectionSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  separatorLine: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  separatorText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginHorizontal: 15,
  },
  gamesSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  
  // ===== STYLES ACTION/VÉRITÉ AVEC RÉPONSES =====
  todResponseContainer: {
    width: '100%',
    marginTop: 20,
    paddingHorizontal: 10,
  },
  todResponseLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  todResponseInput: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    padding: 15,
    fontSize: 16,
    color: '#fff',
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 15,
  },
  todSubmitButton: {
    backgroundColor: '#10B981',
    borderRadius: 15,
    paddingVertical: 15,
    alignItems: 'center',
  },
  todSubmitButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  todSubmitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  todActionButtons: {
    gap: 12,
  },
  todActionDoneButton: {
    backgroundColor: '#10B981',
    borderRadius: 15,
    paddingVertical: 18,
    alignItems: 'center',
  },
  todActionDoneText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  todActionSkipButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  todActionSkipText: {
    fontSize: 15,
    color: '#fff',
  },
  todAnswerContainer: {
    width: '100%',
    marginTop: 20,
    paddingHorizontal: 10,
  },
  todAnswerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  todAnswerBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  todAnswerText: {
    fontSize: 15,
    color: '#fff',
  },
  todPartnerSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  todPartnerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B9D',
    marginBottom: 8,
  },
  todPartnerAnswerBox: {
    backgroundColor: 'rgba(255, 107, 157, 0.2)',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#FF6B9D',
  },
  todPartnerAnswerText: {
    fontSize: 15,
    color: '#fff',
  },
  todWaitingPartner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    gap: 10,
  },
  todWaitingText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontStyle: 'italic',
  },
  // ===== NOUVEAUX STYLES TOUR PAR TOUR =====
  passPhoneContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 25,
    marginVertical: 20,
  },
  passPhoneEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  passPhoneTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  passPhoneText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 24,
  },
  passPhoneWarning: {
    fontSize: 14,
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 25,
    fontWeight: '600',
  },
  passPhoneButton: {
    backgroundColor: '#10B981',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  passPhoneButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  wimPhaseContainer: {
    alignItems: 'center',
    padding: 20,
  },
  wimPhaseTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  wimPhaseHint: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 25,
    textAlign: 'center',
  },
  wimDisagree: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginTop: 15,
    textAlign: 'center',
  },
  wyrPhaseContainer: {
    alignItems: 'center',
    width: '100%',
  },
  wyrPhaseTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  // ===== STYLES MODE ONLINE ATTENTE =====
  onlineWaitingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 25,
    marginVertical: 20,
  },
  onlineWaitingEmoji: {
    fontSize: 60,
    marginBottom: 10,
  },
  onlineWaitingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
    textAlign: 'center',
  },
  onlineWaitingText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  // ===== ZONE DISCUSSION INTERACTIVE =====
  discussBanner: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  discussBannerText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  discussBannerArrow: { color: '#fff', fontSize: 18 },
  discussPanel: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 14,
    marginVertical: 10,
    width: '100%',
    overflow: 'hidden',
  },
  discussPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
  },
  discussPanelTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  discussPanelClose: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  discussMsgList: { maxHeight: 220, paddingHorizontal: 10 },
  discussMsgEmpty: { color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center', paddingVertical: 10, fontStyle: 'italic' },
  discussMsgBubble: {
    maxWidth: '80%',
    borderRadius: 10,
    padding: 8,
    marginVertical: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  discussMsgMine: { alignSelf: 'flex-end', backgroundColor: 'rgba(255,107,157,0.4)' },
  discussMsgTheirs: { alignSelf: 'flex-start' },
  discussMsgName: { color: 'rgba(255,255,255,0.6)', fontSize: 10, marginBottom: 2 },
  discussMsgText: { color: '#fff', fontSize: 13 },
  discussMsgImgWrapper: {
    position: 'relative',
    marginTop: 6,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  discussMsgImg: { width: 160, height: 120, borderRadius: 8 },
  discussMsgImgBadge: {
    position: 'absolute',
    bottom: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    paddingHorizontal: 5, paddingVertical: 2,
  },
  discussMsgImgBadgeText: { fontSize: 12 },
  discussAudioBtn: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  discussAudioBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  discussInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  discussTextInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: '#fff',
    fontSize: 13,
    maxHeight: 80,
  },
  discussSendBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#FF6B9D',
    justifyContent: 'center', alignItems: 'center',
  },
  discussSendBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  discussVoiceBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  discussVoiceBtnRec: { backgroundColor: '#EF4444' },
  discussVoiceBtnText: { fontSize: 18 },
  discussImgBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  discussImgBtnText: { fontSize: 18 },
  // ===== TOD PROOF =====
  todBubbleProof: { backgroundColor: 'rgba(255,107,157,0.2)', borderWidth: 1.5, borderColor: 'rgba(255,107,157,0.6)', borderRadius: 14, padding: 10 },
  todBubbleProofLabel: { color: '#fff', fontSize: 13, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  todProofImgWrapper: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,107,157,0.7)',
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  todProofImage: { width: 220, height: 165, borderRadius: 10 },
  todProofImgOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingVertical: 5,
    alignItems: 'center',
  },
  todProofImgOverlayText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  todProofVideoWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,107,157,0.7)',
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  todProofVideo: { width: 220, height: 165, borderRadius: 10, backgroundColor: '#000' },
  todProofContainer: {
    marginTop: 10,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  todProofLabel: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  todProofButtons: { flexDirection: 'row', gap: 10 },
  todProofBtn: {
    backgroundColor: '#FF6B9D',
    borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 20,
  },
  todProofBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  todProofSentText: { color: '#10B981', fontSize: 13, fontWeight: '600', marginTop: 8, textAlign: 'center' },
  // ===== FULLSCREEN IMAGE MODAL =====
  fsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.93)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  fsImageArea: {
    width: '95%',
    height: '75%',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,107,157,0.55)',
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 18,
    elevation: 18,
  },
  fsImage: { width: '100%', height: '100%' },
  fsCloseBtn: {
    marginTop: 20,
    width: 52, height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  fsCloseBtnText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  fsTapHint: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 10 },
});
