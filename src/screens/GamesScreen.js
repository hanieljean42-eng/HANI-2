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
  // Nouvelles questions 18+ & intimes
  {
    id: 51,
    question: "Quel est l'endroit de mon corps que tu aimes caresser en secret ?",
    type: "open",
  },
  {
    id: 52,
    question: "Quelle est la chose que je fais qui t'excite sans que je le sache ?",
    type: "open",
  },
  {
    id: 53,
    question: "Quel est mon parfum ou mon odeur naturelle qui te plaît le plus ?",
    type: "open",
  },
  {
    id: 54,
    question: "Comment je réagis quand on se dispute et que tu as raison ?",
    type: "open",
  },
  {
    id: 55,
    question: "Quelle est la première chose que tu regardes chez moi le matin au réveil ?",
    type: "open",
  },
  {
    id: 56,
    question: "Quel est mon plus grand défaut que tu trouves mignon malgré tout ?",
    type: "open",
  },
  {
    id: 57,
    question: "Quelle est ma phrase préférée quand je veux quelque chose de toi ?",
    type: "open",
  },
  {
    id: 58,
    question: "Quel est le son ou la voix que je fais qui te fait fondre ?",
    type: "open",
  },
  {
    id: 59,
    question: "Quelle est mon heure préférée pour faire l'amour ?",
    type: "choice",
    options: ["Le matin", "L'après-midi", "Le soir", "La nuit", "N'importe quand"],
  },
  {
    id: 60,
    question: "Quel est le fantasme que tu penses que j'ai sans jamais te l'avoir dit ?",
    type: "open",
  },
  {
    id: 61,
    question: "Comment je me comporte quand je suis timide devant toi ?",
    type: "open",
  },
  {
    id: 62,
    question: "Quelle est ma position préférée pour dormir ?",
    type: "choice",
    options: ["Sur le dos", "Sur le ventre", "Sur le côté", "Collé(e) contre toi", "En étoile"],
  },
  {
    id: 63,
    question: "Quelle chose intime que j'aime et que tu n'aurais pas devinée ?",
    type: "open",
  },
  {
    id: 64,
    question: "Quel est mon geste affectueux préféré pendant l'intimité ?",
    type: "open",
  },
  {
    id: 65,
    question: "Qu'est-ce que je fais juste avant de m'endormir chaque soir ?",
    type: "open",
  },
  {
    id: 66,
    question: "Quel est mon film ou série que je peux regarder en boucle ?",
    type: "open",
  },
  {
    id: 67,
    question: "Quelle est ma réaction quand quelqu'un d'autre te regarde ?",
    type: "open",
  },
  {
    id: 68,
    question: "Quel est le compliment qui me touche le plus venant de toi ?",
    type: "open",
  },
  {
    id: 69,
    question: "Quelle est la chose que je dis toujours avant de t'embrasser ?",
    type: "open",
  },
  {
    id: 70,
    question: "Quel est mon type de musique pour l'ambiance intime ?",
    type: "choice",
    options: ["R&B / Soul", "Rap doux", "Jazz", "Pop romantique", "Silence total", "Peu importe"],
  },
  {
    id: 71,
    question: "Comment je me comporte après une nuit torride avec toi ?",
    type: "open",
  },
  {
    id: 72,
    question: "Quel est mon endroit préféré pour recevoir des bisous ?",
    type: "open",
  },
  {
    id: 73,
    question: "Quelle est ma façon d'exprimer que j'ai envie de toi sans le dire ?",
    type: "open",
  },
  {
    id: 74,
    question: "Quel est l'endroit le plus romantique où j'aimerais qu'on passe une nuit ?",
    type: "open",
  },
  {
    id: 75,
    question: "Quelle est la tenue chez moi qui te rend fou/folle ?",
    type: "open",
  },
  {
    id: 76,
    question: "Quel est mon rituel préféré après qu'on se réconcilie ?",
    type: "open",
  },
  {
    id: 77,
    question: "Qu'est-ce que je fais quand j'essaie de te séduire mais que tu résistes ?",
    type: "open",
  },
  {
    id: 78,
    question: "Quel est le mot doux que je te dis le plus souvent ?",
    type: "open",
  },
  {
    id: 79,
    question: "Quelle est ma plus grande addiction liée à toi ?",
    type: "open",
  },
  {
    id: 80,
    question: "Quel est le moment où tu me trouves le plus irrésistible ?",
    type: "open",
  },
  // ── Simples & romantiques (distance) ──
  {
    id: 81,
    question: "Quel est mon côté préféré du lit pour dormir ?",
    type: "choice",
    options: ["À gauche", "À droite", "Au milieu", "Je m'adapte selon toi"],
  },
  {
    id: 82,
    question: "Quelle est ma façon préférée de te montrer que je t'aime à distance ?",
    type: "open",
  },
  {
    id: 83,
    question: "Quel est le premier mot ou emoji que je t'envoie généralement le matin ?",
    type: "open",
  },
  {
    id: 84,
    question: "Quelle est la chose que tu fais à distance qui me rassure le plus ?",
    type: "open",
  },
  {
    id: 85,
    question: "Quel film ou série me fait toujours penser à toi ?",
    type: "open",
  },
  {
    id: 86,
    question: "Quelle est ma plus grande crainte dans notre relation à distance ?",
    type: "open",
  },
  {
    id: 87,
    question: "À quelle heure est-ce que je pense le plus à toi dans la journée ?",
    type: "choice",
    options: ["Le matin au réveil", "L'après-midi quand je m'ennuie", "Le soir avant de dormir", "En permanence"],
  },
  {
    id: 88,
    question: "Quel est l'endroit de ta maison qui me manquerait le plus ?",
    type: "open",
  },
  // ── Très intimes (adultes, sans label) ──
  {
    id: 89,
    question: "Quelle partie de ton corps est-ce que j'adore regarder en secret ?",
    type: "open",
  },
  {
    id: 90,
    question: "Est-ce que je préfère initier ou être celui/celle qui reçoit dans l'intimité ?",
    type: "choice",
    options: ["J'adore initier", "Je préfère recevoir", "Les deux selon l'humeur", "J'aime quand tu décides"],
  },
  {
    id: 91,
    question: "Quel moment de la journée je préfère pour nos moments intimes ?",
    type: "choice",
    options: ["Le matin au réveil", "L'après-midi", "Le soir avant de dormir", "En pleine nuit"],
  },
  {
    id: 92,
    question: "Est-ce que j'aime qu'on se chuchote des choses à l'oreille pendant nos moments intimes ?",
    type: "choice",
    options: ["Oui, ça me rend fou/folle", "Non, je préfère le silence", "Parfois oui", "Toujours, c'est ce qui me fait craquer"],
  },
  {
    id: 93,
    question: "Quelle tenue tu portes qui m'excite le plus ?",
    type: "open",
  },
  {
    id: 94,
    question: "Est-ce que je préfère des préliminaires longs ou aller droit au but ?",
    type: "choice",
    options: ["Préliminaires longs", "Aller droit au but", "Un équilibre parfait", "Ça dépend entièrement de toi"],
  },
  {
    id: 95,
    question: "Quel geste de ta part me fait perdre le contrôle immédiatement ?",
    type: "open",
  },
  {
    id: 96,
    question: "Dans nos moments intimes, est-ce que je préfère la lumière tamisée ou l'obscurité ?",
    type: "choice",
    options: ["Lumière tamisée", "Totalement dans le noir", "Lumière normale", "Je veux te voir clairement"],
  },
  {
    id: 97,
    question: "Quelle est la phrase ou le mot que tu prononces qui me trouble le plus ?",
    type: "open",
  },
  {
    id: 98,
    question: "Est-ce que je pense à nos moments intimes passés quand on est séparés ?",
    type: "choice",
    options: ["Tout le temps", "Souvent", "Parfois", "À chaque fois que je ferme les yeux"],
  },
  {
    id: 99,
    question: "Quel endroit (hors de la chambre) est-ce que j'imagine le plus pour qu'on soit intimes ?",
    type: "open",
  },
  {
    id: 100,
    question: "Est-ce que je préfère qu'on soit tendres et lents ou intenses et passionnés ?",
    type: "choice",
    options: ["Tendres et lents", "Intenses et passionnés", "Les deux selon l'envie", "Je veux que tu décides pour moi"],
  },
  {
    id: 101,
    question: "Quelle tenue me rend le plus séduisant(e) à tes yeux ?",
    type: "open",
  },
  {
    id: 102,
    question: "Est-ce que j'aime recevoir des messages ou photos coquins de ta part sans prévenir ?",
    type: "choice",
    options: ["Oui, j'adore les surprises", "Oui si on est seuls", "Ça dépend du moment", "Toujours, ne te retiens jamais"],
  },
  {
    id: 103,
    question: "Qu'est-ce que tu fais avec ta bouche qui me fait le plus craquer ?",
    type: "open",
  },
  {
    id: 104,
    question: "Quand j'ai envie de toi à distance, est-ce que je préfère t'appeler ou t'écrire ?",
    type: "choice",
    options: ["Appel vocal", "Message vocal (vocal)", "SMS/message coquin", "Appel vidéo pour te voir"],
  },
  {
    id: 105,
    question: "Quelle est la chose qu'on n'a pas encore osé faire et que j'ai secrètement envie d'essayer ?",
    type: "open",
  },
  {
    id: 106,
    question: "Est-ce que je serais à l'aise pour t'envoyer une photo intime si tu me le demandais ?",
    type: "choice",
    options: ["Oui sans hésiter", "Oui si tu me mets à l'aise", "Peut-être selon l'humeur", "Je l'ai déjà fait pour toi"],
  },
  {
    id: 107,
    question: "Quel est le souvenir intime avec toi que je revois le plus souvent dans ma tête ?",
    type: "open",
  },
  {
    id: 108,
    question: "Pour nos retrouvailles, est-ce que je préfèrerais un hôtel romantique ou rester chez toi ?",
    type: "choice",
    options: ["Hôtel romantique", "Chez toi dans ton lit", "Peu importe si c'est avec toi", "Une surprise totale"],
  },
  {
    id: 109,
    question: "Quelle partie de ton corps est-ce que je touche le plus instinctivement ?",
    type: "open",
  },
  {
    id: 110,
    question: "Est-ce que j'aime qu'on parle ouvertement de nos fantasmes ?",
    type: "choice",
    options: ["Oui j'adore ça", "Oui mais seulement à l'oral", "Parfois par écrit", "Toujours, sans tabou entre nous"],
  },
  {
    id: 111,
    question: "Quelle est la chose la plus coquine que j'aie jamais faite pour toi ?",
    type: "open",
  },
  {
    id: 112,
    question: "Est-ce que j'aurais plus envie de toi dans un moment de tendresse ou après une dispute ?",
    type: "choice",
    options: ["Dans un moment de tendresse", "Après une dispute (réconciliation)", "Les deux me donnent envie", "En permanence peu importe le contexte"],
  },
  {
    id: 113,
    question: "Quelle est la partie de mon corps dont je suis le plus fier/fière et que tu adores ?",
    type: "open",
  },
  // ── Très très intimes pour couples à distance ──
  {
    id: 114,
    question: "Quelle est la partie précise de mon corps que tu as le plus envie de toucher en ce moment ?",
    type: "open",
  },
  {
    id: 115,
    question: "Est-ce que j'aime que tu me touche avant même qu'on s'embrasse ?",
    type: "choice",
    options: ["Oui, j'adore les caresses d'abord", "Non, commence par m'embrasser", "Les deux en même temps", "J'aime que tu décides toi-même"],
  },
  {
    id: 116,
    question: "Quelle partie de mon corps devient la plus sensible quand tu me touches lentement ?",
    type: "open",
  },
  {
    id: 117,
    question: "Est-ce que je préfère qu'on se regarde dans les yeux pendant nos moments les plus intenses ?",
    type: "choice",
    options: ["Oui, le regard me fait tout perdre", "Non, je ferme les yeux pour ressentir", "Les deux selon l'intensité", "Je m'abandonne totalement, peu importe"],
  },
  {
    id: 118,
    question: "Est-ce que je préfère qu'on soit nus dès le départ ou garder certains vêtements au début ?",
    type: "choice",
    options: ["Nus dès le départ", "Quelques vêtements au début", "Tout enlever très lentement l'un l'autre", "Toi tu décides, j'aime la surprise"],
  },
  {
    id: 119,
    question: "Quelle est ma réaction exacte quand tu me susurres quelque chose à l'oreille au moment le plus intense ?",
    type: "open",
  },
  {
    id: 120,
    question: "Est-ce que j'aimerais recevoir une vidéo très intime de toi quand tu es seul(e) et que tu penses à moi ?",
    type: "choice",
    options: ["Oui, envoie sans hésiter", "Oui mais seulement quand je suis seul(e)", "Ça dépend de l'heure et du lieu", "Toujours, ne te retiens jamais pour moi"],
  },
  {
    id: 121,
    question: "Quel est l'endroit précis de ton corps où un simple baiser inattendu me fait perdre tout contrôle ?",
    type: "open",
  },
  {
    id: 122,
    question: "Est-ce que je préfère qu'on se parle ou qu'on soit silencieux pendant nos moments intimes ?",
    type: "choice",
    options: ["Je préfère qu'on se parle", "Le silence total me rend fou/folle", "Des chuchotements seulement", "Commence en silence puis laisse parler le désir"],
  },
  {
    id: 123,
    question: "Qu'est-ce que j'aime que tu fasses avec tes mains pendant qu'on s'embrasse ?",
    type: "open",
  },
  {
    id: 124,
    question: "Quel est mon rythme préféré dans l'intimité ?",
    type: "choice",
    options: ["Lent et sensuel du début à la fin", "Rapide et intense", "Lent au début, intense à la fin", "Je suis ton rythme et je m'adapte"],
  },
  {
    id: 125,
    question: "Serais-je à l'aise pour un appel vidéo intime sans aucun vêtement ?",
    type: "choice",
    options: ["Oui sans hésitation aucune", "Oui si c'est toi qui le proposes", "Peut-être selon l'humeur du soir", "Oui et j'attends que tu proposes"],
  },
  {
    id: 126,
    question: "Quelle est la chose précise que tu fais sur mon corps qui me rend complètement fou/folle à chaque fois ?",
    type: "open",
  },
  {
    id: 127,
    question: "Est-ce que j'aime qu'on s'envoie des messages ou photos très intimes pour anticiper nos retrouvailles ?",
    type: "choice",
    options: ["Oui, ça rend les retrouvailles explosive", "Oui mais modérément", "J'adore quand tu le fais sans prévenir", "Toujours, c'est ce qui me tient en vie à distance"],
  },
  {
    id: 128,
    question: "Quel est le fantasme précis que j'ai le plus souvent et que je n'ai pas encore réalisé avec toi ?",
    type: "open",
  },
  {
    id: 129,
    question: "Est-ce que j'aime qu'on se raconte en détail ce qu'on veut se faire avant de se retrouver ?",
    type: "choice",
    options: ["Oui, ça m'excite énormément", "Oui mais en vocal, pas en texte", "Parfois, selon notre humeur", "Toujours, les mots sont une forme d'intimité"],
  },
  {
    id: 130,
    question: "Quel endroit de mon corps tu n'as pas encore vraiment exploré et que j'aimerais que tu découvres ?",
    type: "open",
  },
  {
    id: 131,
    question: "Est-ce que j'aime les petites marques qui montrent que tu étais là (suçons, griffures légères) ?",
    type: "choice",
    options: ["Oui j'adore les petites marques", "Non, je préfère sans", "Seulement aux endroits cachés", "Oui, ça me rappelle toi tout la journée"],
  },
  {
    id: 132,
    question: "Dans quelle tenue exacte tu m'imagines le plus souvent de façon intime à distance ?",
    type: "open",
  },
  {
    id: 133,
    question: "Est-ce que j'ai déjà eu envie de toi dans un endroit ou moment totalement inapproprié ?",
    type: "choice",
    options: ["Oui, souvent et c'est gênant", "Oui une fois mémorable", "Pratiquement tout le temps", "Constamment, tu occupes mes pensées partout"],
  },
  {
    id: 134,
    question: "Est-ce que j'aime qu'on s'embrasse longtemps et tendrement juste avant ou juste après ?",
    type: "choice",
    options: ["Avant — les baisers mettent le feu", "Après — les baisers post-intimité sont les meilleurs", "Les deux absolument", "Je veux que ça dure toujours"],
  },
  {
    id: 135,
    question: "Qu'est-ce qui doit absolument se passer lors de notre prochaine nuit ensemble ?",
    type: "open",
  },
  {
    id: 136,
    question: "Est-ce que j'aimerais qu'on se prenne en photo lors d'un de nos moments les plus intimes ?",
    type: "choice",
    options: ["Oui, pour garder ce souvenir rien que pour nous", "Non, certains moments sont sacrés", "Peut-être, si l'ambiance est parfaite", "Oui, juste pour se les renvoyer après"],
  },
  {
    id: 137,
    question: "Quel est le geste de mon corps qui t'attire le plus instinctivement ?",
    type: "open",
  },
  {
    id: 138,
    question: "Si je t'envoyais un selfie très intime sans prévenir là maintenant, quelle serait ta réaction exacte ?",
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
    // Nouvelles vérités profondes
    "Quel est le moment exact où tu as su que tu étais amoureux/se de moi ?",
    "Qu'est-ce que je fais inconsciemment qui te rend fou/folle d'amour ?",
    "Quelle est la chose la plus courageuse que tu aies faite pour moi ?",
    "Si tu devais me décrire en 3 mots à quelqu'un qui ne me connaît pas, tu dirais quoi ?",
    "Quel est le secret que tu gardes sur toi et que tu n'as jamais osé me dire ?",
    "C'est quoi le plus beau rêve que tu as fait sur nous deux ?",
    "Quel geste de ma part t'a le plus touché(e) sans que je l'aie réalisé ?",
    "Si on devait rejouer notre première rencontre, tu changerais quoi ?",
    "Quelle est la jalousie que tu as ressentie à mon sujet et que tu n'as jamais avouée ?",
    "Quel est ton fantasme de couple que tu n'oses pas encore proposer ?",
    // Nouvelles vérités intimes 18+
    "Quelle est la partie de mon corps qui t'obsède le plus ?",
    "Qu'est-ce que tu voudrais qu'on essaie ensemble qu'on n'a pas encore fait ?",
    "Comment tu te sens quand on se frôle en public sans le montrer aux autres ?",
    "Quel est le message le plus coquin que tu m'as envoyé et dont tu es encore fier/fière ?",
    "C'est quoi l'endroit le plus excitant où tu voudrais qu'on soit intimes hors de la maison ?",
    "Qu'est-ce que tu fais ou penses quand tu es seul(e) et que tu penses à moi intimement ?",
    "Quel est le geste que je fais pendant l'intimité qui te fait perdre la tête ?",
    "Si tu pouvais contrôler notre prochaine nuit ensemble de A à Z, ce serait comment ?",
    "Quelle est la chose que j'ai portée (tenue, parfum...) qui t'a le plus excité(e) ?",
    "C'est quoi le souvenir intime avec moi que tu revois le plus souvent dans ta tête ?",
    "Qu'est-ce que tu murmures ou penses quand tu es à deux doigts de perdre le contrôle avec moi ?",
    // ── Vérités pour couples à distance (simples) ──
    "Comment tu gères le manque physique quand on est loin l'un de l'autre ?",
    "Qu'est-ce qui te fait sourire en secret quand tu penses à moi ?",
    "Quel souvenir de nous deux tu revois quand tu veux te sentir mieux ?",
    "Qu'est-ce que tu fais en premier quand tu reçois un message de moi ?",
    "Quelle est la chose qui te manque le plus de moi physiquement ?",
    // ── Vérités très intimes distance (adultes, sans label) ──
    "Qu'est-ce que tu penses en secret quand je t'envoie un selfie sensuel ?",
    "Décris exactement ce que tu ferais si j'arrivais chez toi là maintenant sans prévenir.",
    "Quelle est la chose intime que tu n'as jamais osé me demander à distance mais qui t'obsède ?",
    "Qu'est-ce que tu imagines en détail quand tu es seul(e) la nuit et tu penses à moi ?",
    "Quel est le message le plus coquin que tu aurais envie de m'envoyer mais que tu n'oses pas ?",
    "Si on avait une heure de temps libre ensemble en appel vidéo sans aucune limite, tu ferais quoi ?",
    "Qu'est-ce que tu ressens physiquement quand j'envoie ma voix dans un vocal intime ?",
    "Quelle est la tenue dans laquelle tu voudrais me voir la prochaine fois qu'on se retrouve ?",
    "Qu'est-ce que tu gardes en tête comme image de moi qui t'excite le plus ?",
    "Si tu devais me décrire notre prochaine nuit ensemble de A à Z, ce serait comment exactement ?",
    "Qu'est-ce que je pourrais dire ou écrire qui te ferait complètement perdre le contrôle ?",
    "Est-ce que tu te souviens de la dernière fois que tu as pensé à moi de façon vraiment intense la nuit ? C'était quoi ?",
    "Quelle est la chose que tu adores dans notre intimité et que tu n'oserais jamais dire à voix haute normalement ?",
    // ── Vérités très très intimes pour couples à distance ──
    "Quelle est la partie précise de mon corps que tu as le plus envie d'embrasser en ce moment même ?",
    "Décris exactement comment ton corps réagit quand tu reçois un message vocal sensuel de moi.",
    "Quel est le souvenir intime avec moi qui te revient le plus souvent le soir avant de t'endormir ?",
    "Qu'est-ce que tu fais seul(e) quand le manque physique de moi devient vraiment insupportable ?",
    "Si tu pouvais me voir une heure ce soir sans qu'on dorme, qu'est-ce qu'on ferait exactement ?",
    "Comment tu réagirais si je t'envoyais une photo de moi dans mon lit en sous-vêtements là maintenant ?",
    "Quelle est la position que tu veux absolument essayer lors de nos prochaines retrouvailles ?",
    "Décris en détail ce que tu ressentirais si je glissais ma main dans la tienne en ce moment.",
    "Quelle est la phrase la plus coquine que tu aimerais m'envoyer mais que tu n'oses toujours pas ?",
    "Comment tu te sens physiquement quand on parle tard la nuit et que nos voix deviennent plus douces ?",
    "Qu'est-ce que tu imagines exactement qu'on se fait lors de nos retrouvailles dans les premières minutes ?",
    "Est-ce qu'il t'arrive de t'imaginer dans mon lit en te réveillant ? Décris exactement ce que tu vois.",
    "Quelle est la chose la plus torride que tu aies jamais pensée de moi et que tu n'as jamais dite ?",
    "Si je t'appelais ce soir en chuchotant ton prénom, qu'est-ce que tu ressentirais physiquement ?",
    "Quelle est la partie de ton corps que tu aimerais que j'explore davantage et que je ne connais pas encore ?",
    "Qu'est-ce qui t'excite le plus chez moi : mon regard, ma voix, mes mains ou ma façon de t'embrasser ?",
    "Décris le baiser parfait que tu voudrais que je te fasse lors de notre prochaine rencontre.",
    "Comment tu réagis en secret quand tu reçois une photo de moi qui te plaît vraiment physiquement ?",
    "Si on pouvait se voir en appel vidéo maintenant en étant tous les deux au lit, tu ferais quoi ?",
    "Quelle est la phrase exacte que tu dirais pour me faire comprendre que tu as besoin de moi ce soir ?",
    "Qu'est-ce que tu rêves qu'on fasse ensemble qu'on n'a encore jamais osé essayer ?",
    "Si ton corps pouvait me parler directement en ce moment, qu'est-ce qu'il me dirait ?",
    "Quel est l'endroit exact où si je te touchais là maintenant par surprise, tu ne pourrais pas résister ?",
    "Quel est le rôle que tu aimes le plus tenir quand on est intimes : actif(ve) ou passif(ve) ?",
    "Si je t'envoyais un message à 2h du matin disant 'j'ai envie de toi', tu répondrais quoi exactement ?",
    "Quelle est la chose la plus intime que tu as faite seul(e) en pensant à moi sans me le dire ?",
    "Décris le moment exact où tu as réalisé que tu avais envie de moi pour la première fois.",
    "Qu'est-ce que je fais avec ma voix qui te touche le plus profondément ?",
    "Quelle est la chose que tu voudrais qu'on se dise à voix haute pendant nos moments les plus intenses ?",
    "Si on devait s'envoyer des messages intimes pendant une heure ce soir sans aucune limite, comment ça commencerait ?",
    // ── Vérités osées et très intimes (inspirées jeu Action/Vérité) ──
    "Tu préfères passer 2 ans sans sexe ou 2 ans sans internet ?",
    "Quelle célébrité tu trouves la plus attirante sexuellement et pourquoi ?",
    "À quel âge as-tu perdu ta virginité et c'était comment exactement ?",
    "T'as déjà eu une pensée très perverse sur moi dans un endroit totalement inapproprié ?",
    "Si je t'envoyais une photo très intime de moi là maintenant, tu ferais exactement quoi ?",
    "Quel est le truc le plus osé que tu aies jamais fait sexuellement ?",
    "Quel est le truc le plus pervers que tu aies jamais pensé de moi sans me le dire ?",
    "T'as déjà fait semblant de dormir pour éviter quelque chose avec quelqu'un ?",
    "T'as déjà regardé quelqu'un d'autre de façon très intime alors qu'on était ensemble ?",
    "Si tu devais me décrire en détail ton fantasme le plus honteux, tu dirais quoi ?",
    "Quel est le son ou la réaction que tu fais pendant l'amour que tu n'assumes pas toujours ?",
    "T'as déjà envoyé une photo ou vidéo intime à quelqu'un ? Décris le contexte.",
    "Si je te demandais de m'exciter uniquement avec des mots pendant 5 minutes, par où tu commencerais ?",
    "Quelle est la chose la plus folle que tu serais prêt(e) à faire pour me séduire ce soir à distance ?",
    "T'as déjà eu envie de quelqu'un que tu n'aurais pas dû désirer ? C'était qui et comment tu as géré ?",
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
    // Nouvelles actions classiques
    "Dis-moi ce que tu aimes le plus dans notre couple en une seule phrase.",
    "Fais-moi une bise sur chaque joue puis sur le nez.",
    "Écris un message doux et envoie-le à ma famille en mon nom.",
    "Fais semblant de m'interviewer sur 'comment être le/la meilleur(e) partenaire'.",
    "Chante 10 secondes d'une chanson qui te fait penser à moi.",
    "Raconte-moi un souvenir avec moi qui te fait encore sourire maintenant.",
    // Nouvelles actions intimes 18+
    "Embrasse-moi lentement dans le cou pendant 30 secondes.",
    "Dis-moi exactement ce que tu voudrais qu'on se fasse ce soir.",
    "Retire doucement un vêtement sans rien dire.",
    "Décris ma silhouette en me regardant droit dans les yeux.",
    "Pose ta main là où tu as envie de me toucher sans bouger pendant 20 secondes.",
    "Murmure à mon oreille le plus coquin que tu penses de moi en ce moment.",
    "Regarde-moi avec le regard le plus séducteur possible pendant 30 secondes.",
    "Trace lentement ton prénom sur ma peau avec ton doigt.",
    "Montre-moi comment tu veux être réveillé(e) demain matin.",
    "Fais-moi un bisou exactement là où tu sais que j'aime le plus.",
    "Dis-moi en 3 mots ce que tu ressentirais si on passait une nuit entière à s'aimer.",
    "Enlace-moi par derrière et chuchote quelque chose que tu n'as jamais osé dire.",
    "Montre-moi le geste que tu fais naturellement quand tu as envie de moi.",
  ],
};

const DISTANCE_DARES = [
  // ── SELFIES SÉDUISANTS & INTIMES ──
  "Selfie avec ton regard le plus séducteur — celui que tu me fais quand tu me veux ! 📸",
  "Photo de tes lèvres légèrement entrouvertes, comme si tu allais m'embrasser ! 📸",
  "Selfie allongé(e) sur ton lit, draps froissés, regard ensommeillé et désirable ! 📸",
  "Photo de ta nuque et de ton épaule dénudée — ma partie préférée de toi ! 📸",
  "Selfie dans ta tenue la plus légère du moment — sois honnête(e) ! 📸",
  "Photo de tes mains posées sur ton ventre — celles qui me manquent tant ! 📸",
  "Selfie en mordant légèrement tes lèvres en regardant l'objectif ! 📸",
  "Photo de toi dans ton lit, couverture à mi-corps, regard provocateur vers la caméra ! 📸",
  "Selfie avec l'expression exacte que tu fais quand tu penses à moi la nuit ! 📸",
  "Photo de ta silhouette en contre-jour depuis ton miroir ! 📸",
  "Selfie avec les cheveux complètement défaits et le regard chaud — comme au réveil ! 📸",
  "Photo de tes doigts posés sur tes lèvres — imagine que c'est ma main ! 📸",
  "Selfie avec une main posée sur ta poitrine — là où je te manque le plus ! 📸",
  "Photo de toi en sous-vêtements depuis ton reflet dans le miroir ! 📸",
  "Selfie avec le regard que tu me lancerais si j'étais là en ce moment précis ! 📸",
  "Photo de ton cou légèrement incliné — cette partie que j'adore embrasser ! 📸",
  "Selfie en te soulevant les cheveux pour m'offrir ta nuque ! 📸",
  "Photo de tes pieds nus dans ton lit — une intimité simple qui m'appartient ! 📸",
  "Selfie les yeux à demi-fermés, comme si tu te perdais dans mes bras ! 📸",
  "Photo de toi allongé(e) sur le ventre, regard caméra — pose lente et sensuelle ! 📸",
  "Selfie dans ta tenue de nuit — celle que tu portes quand tu t'endors ! 📸",
  "Photo de ta main posée sur ta cuisse — là où j'aimerais poser la mienne ! 📸",
  "Selfie avec le sourire légèrement coquin de quelqu'un qui vient de penser à quelque chose d'interdit ! 📸",
  "Photo depuis ton lit en regardant l'objectif — comme si tu me regardais rentrer ! 📸",
  "Selfie avec tes cheveux mouillés juste après la douche — si naturel et si excitant ! 📸",

  // ── VOCAUX SENSUELS & SECRETS ──
  "Vocal de 20 secondes : chuchote-moi exactement ce que tu ferais si j'étais dans ton lit là maintenant ! (envoie dans la discussion 🎤)",
  "Envoie un vocal en prononçant mon prénom de la façon la plus tendre et désirante possible ! (discussion 🎤)",
  "Vocal de 15 secondes : dis tout haut ton fantasme le plus secret que tu n'as jamais encore avoué ! (discussion 🎤)",
  "Enregistre ta façon de soupirer quand tu penses à moi intensément — juste ça ! (discussion 🎤)",
  "Vocal de 20 secondes : décris en détail ce que tu aimerais qu'on se fasse cette nuit ! (discussion 🎤)",
  "Envoie un vocal en murmurant 'je te veux' de la façon la plus sincère et troublante possible ! (discussion 🎤)",
  "Vocal de 15 secondes : raconte le souvenir intime avec moi que tu revois le plus souvent dans ta tête ! (discussion 🎤)",
  "Enregistre-toi en train de dire tout bas ce que tu ressentirais si je te touchais là maintenant ! (discussion 🎤)",
  "Vocal de 20 secondes : dis-moi ce que tu imagines quand tu es seul(e) la nuit et tu penses à moi ! (discussion 🎤)",
  "Envoie un vocal de 15 secondes où tu décris exactement où et comment tu aimerais que je te touche ! (discussion 🎤)",
  "Vocal de 20 secondes : décris la façon dont je t'embrasse qui te fait perdre le contrôle ! (discussion 🎤)",
  "Enregistre-toi en murmurant les 3 choses que tu adores dans notre intimité ! (discussion 🎤)",
  "Vocal de 15 secondes : dis-moi le plus coquin que tu aies jamais pensé de moi sans me le dire ! (discussion 🎤)",
  "Envoie un vocal en décrivant le fantasme que tu n'as encore jamais osé me proposer ! (discussion 🎤)",
  "Vocal de 20 secondes : décris notre prochaine nuit ensemble avec tous les détails que tu imagines ! (discussion 🎤)",
  "Enregistre-toi en train de dire 'tu me manques dans mon lit' — laisse les émotions parler ! (discussion 🎤)",
  "Vocal de 15 secondes : chuchote mon prénom 3 fois — tendre, passionné(e), puis désespéré(e) ! (discussion 🎤)",
  "Enregistre ce que tu aimerais que je te fasse en premier si j'arrivais chez toi maintenant ! (discussion 🎤)",

  // ── VIDÉOS SENSUELLES & PROVOCANTES ──
  "Vidéo de 15 secondes : glisse lentement les mains dans tes cheveux en me regardant dans les yeux ! 🎥",
  "Vidéo de 15 secondes : décoiffe-toi lentement face à la caméra sans rien dire ! 🎥",
  "Vidéo de 15 secondes : enlève un vêtement lentement — juste un — en regardant l'objectif ! 🎥",
  "Vidéo de 20 secondes : chuchote tout ce que tu veux qu'on se fasse la prochaine fois qu'on est ensemble ! 🎥",
  "Vidéo de 10 secondes : mords-toi les lèvres en me regardant dans la caméra ! 🎥",
  "Vidéo de 15 secondes : glisse doucement la bretelle de ton haut ou dégrafe quelque chose lentement ! 🎥",
  "Vidéo de 20 secondes : décris exactement ce que tu ressentirais si je te touchais là maintenant ! 🎥",
  "Vidéo de 15 secondes : montre-moi comment tu t'endors quand tu imagines que je suis à côté de toi ! 🎥",
  "Vidéo de 15 secondes : passe lentement tes mains dans ton cou comme si c'était moi ! 🎥",
  "Vidéo de 20 secondes : dis-moi ce que tu aimerais me faire si j'arrivais chez toi là maintenant ! 🎥",
  "Vidéo de 20 secondes : allongé(e) sur ton lit, yeux fermés, laisse-toi aller en imaginant que je suis là ! 🎥",
  "Vidéo de 15 secondes : montre-moi le geste exact que tu ferais pour m'attirer vers toi ! 🎥",
  "Vidéo de 20 secondes : décris la partie de mon corps que tu as le plus envie de toucher là maintenant ! 🎥",
  "Vidéo de 15 secondes : imite la façon dont tu m'embrasses — contre ton oreiller ! 🎥",
  "Vidéo de 20 secondes : caresse-toi lentement le visage comme si c'était ma main ! 🎥",
  "Vidéo de 15 secondes : danse contre moi — seul(e), mais comme si j'étais dans tes bras ! 🎥",
  "Vidéo de 20 secondes : montre-moi comment tu réagirais si je te réveillais avec des bisous partout ! 🎥",
  "Vidéo de 20 secondes : montre-moi ce que tu fais quand tu as vraiment envie de moi et que je ne suis pas là ! 🎥",
  "Vidéo de 15 secondes : regarde-toi dans le miroir et dis-moi à voix haute ce que tu penses de toi quand tu sais que je te regarde ! 🎥",
  "Vidéo de 20 secondes : montre-moi ta façon la plus sensuelle de t'habiller ou de te déshabiller lentement ! 🎥",

  // ── PHOTOS & MESSAGES INTIMES ──
  "Écris sur ton bras ou ta main là où tu voudrais que je t'embrasse — et prends une photo ! 📸",
  "Photo de ton oreiller que tu sers contre toi en imaginant que c'est moi ! 📸",
  "Photo du vêtement exact que tu portes en ce moment — pour que j'imagine comment tu es ! 📸",
  "Écris ce que tu voudrais me faire sur un papier, tiens-le sur ta peau — prends la photo ! 📸",
  "Écris ton fantasme le plus secret sur un papier, pose-le contre ta bouche — et prends la photo ! 📸",
  "Photo de toi depuis ton miroir en sous-vêtements ou dans la tenue la plus légère du moment ! 📸",
  "Écris 'j'ai besoin de toi' avec ton doigt sur la buée du miroir ou une vitre — prends-le en photo ! 📸",
  "Photo de la partie de ton corps que tu voudrais que je touche en premier si j'arrivais ! 📸",
  "Photo de ton côté du lit vide avec le message 'ta place m'attend' — pour que j'y pense ! 📸",
  "Écris ce que tu ressentirais si on se retrouvait là maintenant — sur papier, et prends en photo ! 📸",
  "Photo de toi en position exactement comme tu es quand tu penses à moi de façon intime ! 📸",
  "Photo de tes jambes croisées sur ton lit — une partie de toi qui m'appartient ! 📸",
  "Écris la phrase que je dis qui te trouble le plus sur ta peau et prends-la en photo ! 📸",
  "Photo de toi allongé(e), un seul vêtement légèrement décalé, regard vers l'objectif ! 📸",
  "Photo de notre dernière photo ensemble sur ton téléphone — rappelle-moi pourquoi tu me manques ! 📸",
  // ── Défis très très intimes distance ──
  "Photo de ton corps vu de haut depuis ton lit — pour que j'imagine être là au-dessus de toi ! 📸",
  "Selfie en trempant légèrement tes lèvres avec ta langue, regard fixé dans l'objectif ! 📸",
  "Photo de ton ventre légèrement découvert — juste une partie, à moi d'imaginer le reste ! 📸",
  "Vidéo de 15 secondes : montre-moi comment tu te déhanches lentement quand tu penses à moi ! 🎥",
  "Vocal de 20 secondes : dis-moi en détail ce que tu aimerais que je te fasse avec ma bouche ce soir ! (discussion 🎤)",
  "Photo de ta main posée sur ton ventre, légèrement sous la ceinture — juste l'indication... ! 📸",
  "Selfie allongé(e) sur le dos vue de haut, regard vers le plafond comme si tu attendais que j'arrive ! 📸",
  "Vidéo de 15 secondes : montre-moi comment tu te retournes dans ton lit vers moi — comme si j'étais là ! 🎥",
  "Vocal de 20 secondes : lis-moi à voix haute le message intime le plus fort que tu m'aies jamais envoyé ! (discussion 🎤)",
  "Photo de ton dos légèrement nu depuis le miroir — la partie que j'adore toucher ! 📸",
  "Selfie avec un doigt posé sur tes lèvres et le regard qui dit tout ce que tu ne dis pas ! 📸",
  "Vidéo de 15 secondes : montre-moi comment tu réagirais si je t'embrassais dans le cou sans prévenir ! 🎥",
  "Vocal de 20 secondes : dis-moi le fantasme que tu n'oses jamais écrire mais que tu peux chuchoter ! (discussion 🎤)",
  "Photo de toi avec les draps remontés à mi-corps, comme si tu m'attendais dans ton lit ! 📸",
  "Selfie en mordant légèrement ta lèvre inférieure avec le regard le plus provocateur que tu aies ! 📸",
  "Vidéo de 20 secondes : décris ce que tu ressens à l'endroit exact de ton corps où tu me manques le plus ! 🎥",
  "Photo du bas de ton dos légèrement découvert — la partie que mes mains connaissent le mieux ! 📸",
  "Selfie tête légèrement rejetée en arrière, yeux fermés comme si tu vivais un moment intense ! 📸",
  "Vocal de 15 secondes : dis mon prénom 3 fois de suite — de plus en plus bas, de plus en plus intense ! (discussion 🎤)",
  "Photo de tes mains sur ta poitrine en te regardant dans les yeux à travers la caméra ! 📸",
  "Vidéo de 15 secondes : montre-moi ton étirement au réveil — celui que j'adorerais voir en vrai ! 🎥",
  "Photo de toi à genoux sur ton lit regard vers l'objectif — exactement comme dans ma tête ! 📸",
  "Vocal de 20 secondes : décris ce que tu ferais si tu avais mes mains disponibles là maintenant ! (discussion 🎤)",
  "Selfie en te passant lentement la langue sur les lèvres en fixant la caméra ! 📸",
  "Vidéo de 20 secondes : montre-moi comment tu te prépares pour aller au lit comme si j'allais arriver ! 🎥",
  "Photo de ta cuisse légèrement exposée depuis ton lit — là où j'aimerais poser ma main ! 📸",
  "Vocal de 20 secondes : dis-moi exactement à quel endroit de ton corps tu voudrais sentir mes lèvres là maintenant ! (discussion 🎤)",
  "Vidéo de 15 secondes : allongé(e), tire les draps sur toi lentement comme si tu te blottissais contre moi ! 🎥",
  "Selfie en posant ta main sur ta hanche dans le miroir — pour que je ne rêve que de ça cette nuit ! 📸",
  "Photo de toi depuis l'angle exact que tu aurais si je te regardais de mon côté du lit ! 📸",
  // ── Défis osés et très intimes (inspirés jeu Action/Vérité) ──
  "Habille-toi de la façon la plus sexy et provocante possible — envoie un selfie complet dans la discussion ! 📸",
  "Fais le bruit exact que tu fais quand tu atteins le plaisir — enregistre-le en vocal et envoie-le moi ! (discussion 🎤)",
  "Drague-moi uniquement avec des mots pendant 3 minutes dans la discussion — commence MAINTENANT ! 💬",
  "Écris mon prénom sur la partie de ton corps que tu préfères et envoie la photo ! 📸",
  "Mets ta tenue la plus coquine et fais une vidéo de 20 secondes en te montrant sous tous les angles ! 🎥",
  "Ordonne-moi de faire quelque chose de très intime — c'est toi qui commandes, j'obéis ! 🔥",
  "Fais-moi une déclaration d'amour très intense et très intime en vocal comme si c'était la dernière fois ! (discussion 🎤)",
  "Excite-moi uniquement en 5 messages dans la discussion — tu as 5 minutes, GO ! 💬",
  "Écris mon prénom sur ton ventre et envoie la photo ! 📸",
  "Enregistre un vocal de 30 secondes où tu me décris exactement ce que tu me ferais si j'étais là maintenant ! (discussion 🎤)",
  "Pose dans ta tenue la plus légère ou la plus sexy — selfie miroir complet ! 📸",
  "Fais une vidéo de 15 secondes en portant uniquement ce que tu mets pour dormir — montre-moi ! 🎥",
  "Drague-moi comme si on ne se connaissait pas, tu dois absolument me conquérir en 3 messages ! 💬",
  "Écris sur un papier la chose la plus perverse que tu veux me faire — tiens-le et prends la photo ! 📸",
  "Fais le son que tu fais quand tu reçois un baiser dans le cou — en vocal ! (discussion 🎤)",
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
  // Nouvelles questions 18+ & intimes
  "Qui initie le plus souvent l'intimité ?",
  "Qui est le plus expressif/ve pendant un baiser passionné ?",
  "Qui est le plus susceptible de rougir pendant un moment intime ?",
  "Qui prend le plus son temps pendant les préliminaires ?",
  "Qui est le plus joueur/joueuse au lit ?",
  "Qui est le plus susceptible de proposer quelque chose de nouveau intimement ?",
  "Qui est le plus difficile à satisfaire ?",
  "Qui est le plus susceptible de câliner après l'amour ?",
  "Qui a le plus de self-control face à l'autre ?",
  "Qui est le plus accro aux bisous dans le cou ?",
  "Qui est le plus bruyant/bruyante pendant l'intimité ?",
  "Qui serait le plus à l'aise pour parler ouvertement de ses désirs ?",
  "Qui est le plus susceptible d'envoyer un message coquin en pleine journée ?",
  "Qui a plus de mal à résister quand l'autre est séducteur/séductrice ?",
  "Qui est le plus tendre après une nuit torride ?",
  "Qui est le plus susceptible d'avoir un fantasme inavoué ?",
  "Qui est le plus à l'aise pour parler de sexualité ouvertement ?",
  "Qui est le plus susceptible d'attirer le regard des autres dans la rue ?",
  "Qui est le plus attachant/attachante émotionnellement ?",
  "Qui est le plus susceptible de pleurer de bonheur pendant un moment fort entre nous ?",
  "Qui est le plus tactile dans les moments de tendresse ?",
  "Qui est le plus curieux/curieuse des préférences intimes de l'autre ?",
  // ── Simples & romantiques ──
  "Qui dit 'je t'aime' le plus souvent ?",
  "Qui est le plus patient(e) dans notre relation ?",
  "Qui envoie le plus de messages dans la journée ?",
  "Qui s'endort le plus vite après les câlins ?",
  "Qui est le plus protecteur/protectrice de l'autre ?",
  // ── Très intimes (adultes, sans label) ──
  "Qui a les plus belles lèvres selon l'autre ?",
  "Qui ose le plus envoyer des messages coquins en pleine journée ?",
  "Qui est le plus à l'initiative dans l'intimité ?",
  "Qui a le regard le plus séducteur ?",
  "Qui est le plus difficile à résister quand il/elle veut quelque chose ?",
  "Qui donne les meilleurs baisers ?",
  "Qui a le plus de fantasmes secrets non avoués ?",
  "Qui est le plus expressif/expressive dans les moments intimes ?",
  "Qui devient le plus nostalgique de nos moments intimes quand on est séparés ?",
  "Qui est le plus à l'aise pour dire ouvertement ce qu'il/elle veut au lit ?",
  "Qui pense le plus à l'autre de façon intime pendant la journée ?",
  "Qui enverrait une photo intime en premier sans hésiter ?",
  "Qui est le plus capable de faire craquer l'autre avec un seul regard ?",
  "Qui aurait le plus du mal à se retenir lors d'un appel vidéo sensuel ?",
  "Qui a le plus de patience lors de longs préliminaires ?",
  // ── Très très intimes distance ──
  "Qui aime le plus se faire embrasser dans le cou ?",
  "Qui a la réaction la plus intense quand l'autre touche son point sensible ?",
  "Qui prendrait l'initiative d'un appel vidéo sensuel en premier ?",
  "Qui supporterait le moins longtemps sans toucher l'autre ?",
  "Qui a le regard le plus troublant au moment du désir ?",
  "Qui serait le plus à l'aise nu(e) devant l'autre sans complexe ?",
  "Qui aime le plus se faire masser lentement dans le silence ?",
  "Qui est le plus capable de faire perdre la tête à l'autre avec ses seules mains ?",
  "Qui ose le plus envoyer une photo très intime spontanément ?",
  "Qui est le plus capable de rendre l'autre fou/folle avec juste un regard ?",
  "Qui serait le plus insatiable lors de nos prochaines retrouvailles ?",
  "Qui a le plus envie de l'autre en ce moment précis ?",
  "Qui est le plus capable d'exciter l'autre uniquement avec des mots ou des vocaux ?",
  "Qui aurait le plus de mal à rester habillé(e) si l'autre commençait à le/la séduire ?",
  "Qui pense le plus souvent à nos futurs moments intimes quand on est séparés ?",
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
  // Nouvelles questions romantiques & 18+
  {
    option1: "Qu'on passe une nuit torride mais courte",
    option2: "Qu'on passe une longue nuit de tendresse et de câlins",
  },
  {
    option1: "Que je te réveille avec des bisous partout",
    option2: "Que je te prépare le petit-déjeuner parfait au lit",
  },
  {
    option1: "Qu'on soit inséparables même en public",
    option2: "Qu'on garde notre complicité secrète pour nous deux",
  },
  {
    option1: "Que je te dise exactement ce que je veux au lit",
    option2: "Que tu devines tout ce que je veux sans que je le dise",
  },
  {
    option1: "Qu'on passe une nuit dans un hôtel 5 étoiles",
    option2: "Qu'on dorme sous les étoiles ensemble en camping",
  },
  {
    option1: "Que je sois totalement passionné(e) mais imprévisible",
    option2: "Que je sois attentionné(e) et toujours prévisible",
  },
  {
    option1: "Qu'on ait des moments intimes courts mais intenses chaque jour",
    option2: "Qu'on ait de longs moments passionnés chaque semaine",
  },
  {
    option1: "Que je sois le genre à t'embrasser devant tout le monde",
    option2: "Que je réserve mes baisers uniquement pour toi en privé",
  },
  {
    option1: "Qu'on explore un nouveau fantasme ensemble",
    option2: "Qu'on perfectionne ce qu'on sait déjà que l'on aime",
  },
  {
    option1: "Que je sois audacieux/audacieuse et prenne toujours l'initiative",
    option2: "Que tu prennes toujours l'initiative et je suis toujours partant(e)",
  },
  {
    option1: "Qu'on parle ouvertement de nos désirs les plus secrets",
    option2: "Qu'on se découvre mutuellement par surprise",
  },
  {
    option1: "Que notre intimité soit douce et romantique",
    option2: "Que notre intimité soit passionnée et sauvage",
  },
  {
    option1: "Qu'on fasse l'amour en plein air en toute discrétion",
    option2: "Qu'on s'enferme chez nous tout un week-end",
  },
  {
    option1: "Que je te surprenne avec un massage sensuel un soir",
    option2: "Que tu me surprennes avec un moment complètement inattendu",
  },
  {
    option1: "Qu'on partage tous nos fantasmes sans tabou",
    option2: "Qu'on garde chacun un petit jardin secret qui pimente les choses",
  },
  {
    option1: "Que notre vie intime reste toujours aussi intense qu'au début",
    option2: "Qu'elle évolue avec le temps vers quelque chose de plus profond",
  },
  {
    option1: "Qu'on joue à un jeu de séduction inventé par nous deux",
    option2: "Qu'on suive les règles d'un jeu de couple classique",
  },
  {
    option1: "Que je sois accro à ton regard",
    option2: "Que je sois accro à ton toucher",
  },
  {
    option1: "Qu'on se fasse des massages mutuels chaque dimanche",
    option2: "Qu'on se fasse un bain chaud ensemble chaque samedi",
  },
  {
    option1: "Que notre première fois ait été encore plus mémorable",
    option2: "Que notre prochaine fois soit la plus belle qu'on ait jamais vécue",
  },
  // ── Simples & romantiques (distance) ──
  {
    option1: "Qu'on s'endorme ensemble au téléphone chaque soir",
    option2: "Qu'on se réveille ensemble en appel vidéo chaque matin",
  },
  {
    option1: "Que tu m'envoies un vocal chaque jour en te levant",
    option2: "Que tu m'envoies une photo de toi chaque soir avant de dormir",
  },
  {
    option1: "Qu'on se retrouve dans 1 semaine pour une soirée romantique",
    option2: "Qu'on ait une semaine entière ensemble sans contraintes",
  },
  {
    option1: "Qu'on se fasse une date virtuelle avec dîner aux chandelles chacun chez soi",
    option2: "Qu'on se fasse une soirée film synchronisée ensemble",
  },
  {
    option1: "Que tu m'écrives une lettre manuscrite et que tu me l'envoies",
    option2: "Que tu m'enregistres un long vocal de 5 minutes en parlant de nous",
  },
  // ── Très intimes (adultes, sans label) ──
  {
    option1: "Qu'on s'envoie des photos intimes par surprise",
    option2: "Qu'on fasse un appel vidéo sensuel quand l'envie se fait sentir",
  },
  {
    option1: "Qu'on se chuchote nos fantasmes au téléphone dans le noir",
    option2: "Qu'on se les écrive en détail dans un long message",
  },
  {
    option1: "Une nuit entière de tendresse et de câlins sans rien d'autre",
    option2: "Une heure intense et inoubliable de passion pure",
  },
  {
    option1: "Que je sois dominant(e) lors de notre prochaine nuit",
    option2: "Que tu sois dominant(e) et que je me laisse guider complètement",
  },
  {
    option1: "Me voir arriver chez toi à l'improviste en tenue séduisante",
    option2: "Recevoir une surprise intime par message que tu n'attendais pas",
  },
  {
    option1: "Que notre prochaine nuit commence par un massage sensuel",
    option2: "Qu'elle commence par un long baiser sans rien dire",
  },
  {
    option1: "Qu'on explore ensemble quelque chose qu'on n'a jamais osé essayer",
    option2: "Qu'on revive notre meilleur souvenir intime à l'identique",
  },
  {
    option1: "Que je te déshabille lentement moi-même",
    option2: "Que tu arrives déjà dans la tenue minimale",
  },
  {
    option1: "Que j'enregistre un vocal intime juste pour toi ce soir",
    option2: "Que je t'envoie une photo que personne d'autre ne verra jamais",
  },
  {
    option1: "Qu'on se dise exactement ce qu'on veut faire l'un à l'autre lors des retrouvailles",
    option2: "Que tout reste une surprise et qu'on improvise au moment où on se voit",
  },
  // ── Très très intimes distance ──
  {
    option1: "Que je te fasse un massage du corps entier dans le noir sans un mot",
    option2: "Qu'on reste sous les draps à se chuchoter des choses toute la nuit",
  },
  {
    option1: "Recevoir un vocal intime de moi à 2h du matin",
    option2: "Me voir en appel vidéo en sous-vêtements sans prévenir",
  },
  {
    option1: "Que je t'embrasse partout sauf les lèvres pendant 10 minutes entières",
    option2: "Qu'on s'embrasse passionnément sur les lèvres pendant 10 minutes sans jamais s'arrêter",
  },
  {
    option1: "Que je glisse un message très intime dans ta poche sans te le dire",
    option2: "Que je t'envoie une vidéo de moi que personne d'autre ne verra jamais",
  },
  {
    option1: "Que tu découvres ce que je veux cette nuit et que tu l'exécutes parfaitement",
    option2: "Que je t'obéisse complètement sans poser de questions pendant une nuit",
  },
  {
    option1: "Qu'on fasse un appel vidéo entièrement nus ensemble pour la première fois",
    option2: "Qu'on passe une nuit de messages intimes écrits sans aucun appel",
  },
  {
    option1: "Que je te réveille avec mes mains qui te caressent doucement",
    option2: "Que je te réveille avec mes lèvres posées sur ton cou en silence",
  },
  {
    option1: "Qu'on soit lents, qu'on s'arrête pour se regarder dans les yeux",
    option2: "Qu'on soit intenses et qu'on ne s'arrête que quand on n'en peut vraiment plus",
  },
  {
    option1: "Que je t'envoie une photo de moi dans la position que tu préfères",
    option2: "Que tu m'envoies une vidéo de ce que tu ferais si j'étais là en ce moment",
  },
  {
    option1: "Qu'on se dise nos fantasmes les plus secrets pendant 1 heure",
    option2: "Qu'on se montre silencieusement ce qu'on veut à travers l'écran pendant 1 heure",
  },
  {
    option1: "Que je te touche exactement là où tu le veux le plus",
    option2: "Que tu ne saches pas où je vais te toucher et que tu te laisses surprendre",
  },
  {
    option1: "Qu'on reste enlacés toute la nuit sans rien faire d'autre",
    option2: "Qu'on passe une nuit entière à tout explorer sans aucune limite",
  },
  {
    option1: "Que notre prochaine nuit soit filmée juste pour nous deux",
    option2: "Que notre prochaine nuit reste un secret absolu que personne ne saura jamais",
  },
  {
    option1: "Que je t'enregistre un vocal très intime juste pour toi cette nuit",
    option2: "Que je t'envoie une photo de moi que tu gardes précieusement rien que pour toi",
  },
  {
    option1: "Qu'on se fasse une déclaration très intime au téléphone dans le noir complet",
    option2: "Qu'on s'écrive un long message vocal de 5 minutes sur ce qu'on ressent physiquement l'un pour l'autre",
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
  const { notifyGame, notifyGameAnswer, notifyGameWin, notifyProofSent, notifyProofReaction, notifyDiscussMessage } = useNotifyPartner();
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
  const [todPartnerProofReceived, setTodPartnerProofReceived] = useState(false);
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
    setTodPartnerProofReceived(false);
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
      notifyDiscussMessage('text').catch(() => {});
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
          notifyDiscussMessage('image').catch(() => {});
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
        notifyDiscussMessage('audio').catch(() => {});
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
        // Vérité ou passe → ouvrir la discussion immédiatement des 2 côtés
        if (responseData.actionChoice !== 'fait') {
          setDiscussOpen(true);
        }
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
    if (readyData && !alreadyProcessed(`ready_${todRound}`)) {
      if (todWaitingNextSync) {
        // Je suis le questioner qui attendait la confirmation du répondeur → avancer
        console.log('✅ Partenaire prêt pour le tour suivant → on avance');
        advanceToNextTodRound();
      } else if (todWaitingReaction) {
        // Le questioner a sauté sa réaction (nextTodRound) sans réagir → débloquer le répondeur
        console.log('✅ Questioner a sauté la réaction → répondeur avance aussi');
        setTodWaitingReaction(false);
        setTimeout(() => advanceToNextTodRound(), 400);
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
      // Preuve reçue → ouvrir la discussion des 2 côtés
      setTodPartnerProofReceived(true);
      setDiscussOpen(true);
    }
  }, [activeGame, gameMode, isFirebaseReady, gameData, todRound, todPhase, myPlayerId, user?.name, truthOrDare, todGameMode, todWaitingReaction, todWaitingNextSync, todPartnerProofReceived]);

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
    setTodPartnerProofReceived(false);
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
              <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
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
              </ScrollView>
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
                <TouchableOpacity
                  style={styles.backToDiscussBtn}
                  onPress={() => { setWyrPhase('reveal'); setOnlineReadyForNext(false); setOnlineWaitingNextPartner(false); setDiscussOpen(true); }}
                >
                  <Text style={styles.backToDiscussBtnText}>💬 Retour à la discussion</Text>
                </TouchableOpacity>
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
                <TouchableOpacity
                  style={styles.backToDiscussBtn}
                  onPress={() => { setQuizPhase('reveal'); setOnlineReadyForNext(false); setOnlineWaitingNextPartner(false); setDiscussOpen(true); }}
                >
                  <Text style={styles.backToDiscussBtnText}>💬 Retour à la discussion</Text>
                </TouchableOpacity>
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
                  {truthOrDare?.type === 'truth'
                    ? `💬 ${partnerName} a répondu !`
                    : (todPartnerResponse?.actionChoice === 'passe'
                        ? `😅 ${partnerName} a passé cette action`
                        : `✅ ${partnerName} a décidé de relever le défi !`)
                  }
                </Text>

                {/* Discussion — dare+fait sans preuve → attente ; sinon panneau actif */}
                {truthOrDare?.type === 'dare' && todPartnerResponse?.actionChoice === 'fait' && !todPartnerProofReceived ? (
                  <View style={styles.todBottomWait}>
                    <ActivityIndicator size="small" color="#FF6B9D" />
                    <Text style={styles.todBottomWaitText}>
                      {`👀 ${partnerName} prépare les preuves...\nPatiente, ça va arriver !`}
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.discussPanel, { marginBottom: 8 }]}>
                    <View style={styles.discussPanelHeader}>
                      <Text style={styles.discussPanelTitle}>💬 Discussion</Text>
                    </View>
                    <ScrollView ref={discussScrollRef} style={styles.discussMsgList} contentContainerStyle={{ paddingBottom: 6 }} nestedScrollEnabled onContentSizeChange={() => discussScrollRef.current?.scrollToEnd({ animated: true })}>
                      {discussMessages.length === 0 && <Text style={styles.discussMsgEmpty}>Discutez ensemble... 💕</Text>}
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

                {/* Réactions + tour suivant — vérité : toujours visibles
                                                   dare+passe : toujours visibles
                                                   dare+fait : uniquement après preuve reçue */}
                {!(truthOrDare?.type === 'dare' && todPartnerResponse?.actionChoice === 'fait' && !todPartnerProofReceived) && (
                  <>
                    <View style={styles.todReactionRow}>
                      {['👍', '😂', '😱', '🥰', '🔥', '💀', '👏', '😏'].map((emoji) => (
                        <TouchableOpacity key={emoji} style={styles.todReactionBtn} onPress={() => reactAndNextRound(emoji)}>
                          <Text style={styles.todReactionEmoji}>{emoji}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <TouchableOpacity style={styles.todSkipReactBtn} onPress={nextTodRound}>
                      <Text style={styles.todSkipReactText}>➡️ Tour suivant</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}

            {/* PHASE: WAIT REACTION — Le répondeur attend la réaction du questioner (online) */}
            {todPhase === 'waitReaction' && (
              <View style={styles.todBottomBar}>
                {/* ── Status header ── */}
                {todActionChoice === 'passe' ? (
                  <View style={styles.todBottomWait}>
                    <Text style={{ fontSize: 28 }}>😅</Text>
                    <Text style={styles.todBottomWaitText}>{`Tu as passé cette action\nEn attente de la réaction de ${partnerName}...`}</Text>
                  </View>
                ) : truthOrDare?.type === 'truth' ? (
                  <View style={styles.todBottomWait}>
                    <ActivityIndicator size="small" color="#FF6B9D" />
                    <Text style={styles.todBottomWaitText}>{`💬 Ta réponse est envoyée !\nEn attente de la réaction de ${partnerName}...`}</Text>
                  </View>
                ) : todProofSent ? (
                  <View style={styles.todBottomWait}>
                    <ActivityIndicator size="small" color="#FF6B9D" />
                    <Text style={styles.todBottomWaitText}>{`✅ Preuve envoyée !\nEn attente de la réaction de ${partnerName}...`}</Text>
                  </View>
                ) : (
                  <View style={styles.todBottomWait}>
                    <ActivityIndicator size="small" color="#FF6B9D" />
                    <Text style={styles.todBottomWaitText}>{`💪 Envoie la preuve de ton action !`}</Text>
                  </View>
                )}

                {/* ── Boutons preuve — uniquement dare+fait avant envoi ── */}
                {truthOrDare?.type === 'dare' && !todProofSent && todActionChoice === 'fait' && (
                  <View style={styles.todProofContainer}>
                    <Text style={styles.todProofLabel}>📸 Envoie une preuve !</Text>
                    <View style={styles.todProofButtons}>
                      <TouchableOpacity style={styles.todProofBtn} onPress={() => sendTodProof(true)} disabled={todProofUploading}>
                        {todProofUploading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.todProofBtnText}>📷 Prendre</Text>}
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.todProofBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]} onPress={() => sendTodProof(false)} disabled={todProofUploading}>
                        <Text style={styles.todProofBtnText}>🖼️ Galerie</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* ── Panneau discussion — vérité / passe / preuve déjà envoyée ── */}
                {(truthOrDare?.type === 'truth' || todActionChoice === 'passe' || (todActionChoice === 'fait' && todProofSent)) && (
                  <View style={[styles.discussPanel, { marginBottom: 4 }]}>
                    <View style={styles.discussPanelHeader}>
                      <Text style={styles.discussPanelTitle}>💬 Discussion</Text>
                    </View>
                    <ScrollView ref={discussScrollRef} style={styles.discussMsgList} contentContainerStyle={{ paddingBottom: 6 }} nestedScrollEnabled onContentSizeChange={() => discussScrollRef.current?.scrollToEnd({ animated: true })}>
                      {discussMessages.length === 0 && <Text style={styles.discussMsgEmpty}>Discutez ensemble... 💕</Text>}
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
                <TouchableOpacity
                  style={styles.backToDiscussBtn}
                  onPress={() => { setTodWaitingNextSync(false); setTodPhase('react'); setDiscussOpen(true); }}
                >
                  <Text style={styles.backToDiscussBtnText}>💬 Retour à la discussion</Text>
                </TouchableOpacity>
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
              <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
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
              </ScrollView>
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
                <TouchableOpacity
                  style={styles.backToDiscussBtn}
                  onPress={() => { setWimPhase('reveal'); setOnlineReadyForNext(false); setOnlineWaitingNextPartner(false); setDiscussOpen(true); }}
                >
                  <Text style={styles.backToDiscussBtnText}>💬 Retour à la discussion</Text>
                </TouchableOpacity>
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
  backToDiscussBtn: {
    marginTop: 16,
    backgroundColor: 'rgba(255,107,157,0.25)',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,107,157,0.5)',
  },
  backToDiscussBtnText: {
    color: '#FF6B9D',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
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
  discussMsgList: { height: 130, paddingHorizontal: 10 },
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
