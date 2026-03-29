import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const GUIDE_SECTIONS = [
  {
    id: 'welcome',
    icon: '💕',
    title: 'Bienvenue sur HANI 2',
    color: ['#FF6B9D', '#C44569'],
    content: [
      {
        subtitle: "C'est quoi HANI 2 ?",
        text: "HANI 2 est votre espace couple privé et sécurisé. Une application conçue pour renforcer votre lien amoureux à travers des jeux, des souvenirs, des défis et bien plus encore ! 💑",
      },
      {
        subtitle: "Comment ça marche ?",
        text: "1. Créez votre compte\n2. Créez ou rejoignez un espace couple avec le code unique\n3. Profitez de toutes les fonctionnalités ensemble, même à distance !",
      },
    ],
  },
  {
    id: 'home',
    icon: '🏠',
    title: 'Accueil',
    color: ['#8B5CF6', '#A855F7'],
    content: [
      {
        subtitle: "Le tableau de bord",
        text: "L'écran d'accueil affiche un résumé de votre couple :\n\n• 📅 Compteur de jours ensemble — voyez depuis combien de temps vous êtes en couple\n• 💖 Love Meter — une jauge d'amour qui évolue selon vos interactions\n• 🔥 Streak (flamme) — votre série de jours consécutifs de conversation",
      },
      {
        subtitle: "Messages rapides",
        text: "Envoyez des petits messages rapides à votre partenaire d'un simple tap : « Je t'aime ❤️ », « Tu me manques 🥰 », « Bisou 😘 », etc. Votre partenaire recevra une notification instantanée !",
      },
      {
        subtitle: "La flamme 🔥",
        text: "La flamme représente votre streak de communication. Échangez au moins un message par jour dans le chat pour la garder allumée !\n\n🕯️ 1-2 jours → petite flamme\n🔥 3-6 jours → flamme moyenne\n💥 7-13 jours → grande flamme\n🌟 14-29 jours → flamme étoile\n👑 30+ jours → flamme royale\n\n⚠️ Si vous passez 24h sans message, la flamme s'éteint !",
      },
    ],
  },
  {
    id: 'chat',
    icon: '💬',
    title: 'Chat',
    color: ['#10B981', '#059669'],
    content: [
      {
        subtitle: "Messagerie privée",
        text: "Accédez au chat depuis l'accueil ou le profil. C'est votre espace de conversation privé avec votre partenaire.",
      },
      {
        subtitle: "Fonctionnalités du chat",
        text: "• 📝 Messages texte — écrivez et envoyez vos messages\n• 📷 Photos — envoyez des images depuis votre galerie ou appareil photo\n• 🎤 Messages vocaux — maintenez le bouton micro pour enregistrer\n• 😍 Réactions — appuyez longuement sur un message pour réagir avec un emoji\n• 🔥 Flamme — visible dans l'en-tête du chat pour voir votre streak",
      },
      {
        subtitle: "Astuce",
        text: "💡 Chaque message envoyé dans le chat compte pour maintenir votre flamme 🔥. Un message par jour suffit !",
      },
    ],
  },
  {
    id: 'games',
    icon: '🎮',
    title: 'Jeux',
    color: ['#F59E0B', '#D97706'],
    content: [
      {
        subtitle: "4 jeux disponibles",
        text: "Accédez aux jeux depuis l'onglet Défis ou directement. Chaque jeu peut se jouer en mode local (même téléphone) ou en ligne (chacun sur son téléphone) !",
      },
      {
        subtitle: "🧠 Quiz Couple",
        text: "Testez à quel point vous connaissez votre partenaire !\n\n• Les questions alternent : une fois sur toi, une fois sur ton partenaire\n• Le « répondeur » donne sa vraie réponse\n• Le « devineur » doit deviner la réponse\n• Questions à choix : validation automatique ✅\n• Questions ouvertes : le répondeur valide avec ✅ Correct ou ❌ Incorrect\n• 10 questions par partie, 50 questions au total !",
      },
      {
        subtitle: "🎲 Action ou Vérité",
        text: "Le classique revisité pour les couples !\n\n• Choisissez entre mode classique (questions aléatoires) ou mode personnalisé (écrivez vos propres questions)\n• Vérités douces 💕 ou coquines 🔥\n• Actions tendres 💕 ou osées 🔥\n• Répondez tour à tour dans un fil de conversation\n• Réagissez aux réponses de votre partenaire !",
      },
      {
        subtitle: "🏆 Qui est le Plus...",
        text: "Qui est le plus romantique ? Le plus jaloux ? Le plus gourmand ?\n\n• Plus de 150 questions !\n• Chacun choisit qui correspond le plus\n• Voyez si vous êtes d'accord ou pas\n• Parfait pour se découvrir mutuellement !",
      },
      {
        subtitle: "🤔 Tu Préfères...",
        text: "Des choix impossibles pour les couples !\n\n• Plus de 65 dilemmes\n• Chacun fait son choix indépendamment\n• Découvrez si vous avez les mêmes préférences\n• Des questions romantiques, drôles et profondes",
      },
      {
        subtitle: "Mode en ligne 🌐",
        text: "Pour jouer à distance :\n1. Un joueur crée la partie\n2. Le partenaire reçoit une notification et rejoint\n3. Chacun joue sur son propre téléphone\n4. Les réponses sont synchronisées en temps réel via Firebase !",
      },
    ],
  },
  {
    id: 'wheel',
    icon: '🎰',
    title: 'Roue de la Fortune',
    color: ['#EC4899', '#DB2777'],
    content: [
      {
        subtitle: "Comment ça marche ?",
        text: "La roue vous propose des activités aléatoires à faire en couple ! Appuyez sur « Tourner la roue » et laissez le destin décider de votre prochaine activité.",
      },
      {
        subtitle: "Types d'activités",
        text: "• 🍽️ Restaurant — sortez manger ensemble\n• 🎬 Cinéma — regardez un film\n• 💆 Massage — offrez-vous un moment détente\n• 🎵 Karaoké — chantez ensemble\n• 🏖️ Balade — promenez-vous\n• 🎨 Activité créative — dessinez, cuisinez...\n• Et bien d'autres surprises !",
      },
      {
        subtitle: "Mode coquin 🔥",
        text: "La roue contient aussi des activités coquines pour pimenter votre relation. Ces activités apparaissent aléatoirement parmi les autres !",
      },
    ],
  },
  {
    id: 'challenges',
    icon: '⚡',
    title: 'Défis',
    color: ['#6366F1', '#4F46E5'],
    content: [
      {
        subtitle: "Système de défis",
        text: "Relevez des défis quotidiens et hebdomadaires pour gagner des points d'expérience (XP) et renforcer votre couple !",
      },
      {
        subtitle: "Défis quotidiens",
        text: "8 nouveaux défis chaque jour !\n\n• Envoyez un message d'amour\n• Partagez un souvenir\n• Faites un compliment\n• Et bien d'autres petites attentions...\n\nChaque défi complété rapporte des XP !",
      },
      {
        subtitle: "Défis hebdomadaires",
        text: "4 défis plus ambitieux par semaine :\n\n• Organisez une sortie surprise\n• Écrivez une lettre d'amour\n• Apprenez quelque chose de nouveau sur votre partenaire\n• Créez un nouveau souvenir ensemble",
      },
      {
        subtitle: "Mini-jeux intégrés",
        text: "Depuis l'onglet Défis, vous pouvez aussi lancer les 4 jeux couple directement (Quiz, Action/Vérité, Qui est le Plus, Tu Préfères) !",
      },
    ],
  },
  {
    id: 'memories',
    icon: '🫙',
    title: 'Souvenirs',
    color: ['#14B8A6', '#0D9488'],
    content: [
      {
        subtitle: "Votre jar à souvenirs",
        text: "L'onglet Souvenirs est votre espace pour conserver tous vos moments précieux en couple.",
      },
      {
        subtitle: "Types de souvenirs",
        text: "• 📷 Photos — importez vos plus belles photos de couple\n• 📝 Textes — écrivez des souvenirs marquants\n• 🎥 Vidéos — conservez vos vidéos préférées\n\nTous les médias sont sauvegardés en ligne via Cloudinary, vous ne les perdrez jamais !",
      },
      {
        subtitle: "Gérer vos souvenirs",
        text: "• Appuyez sur un souvenir pour le voir en grand\n• Utilisez les boutons ✏️ Modifier et 🗑️ Supprimer en bas de l'image\n• Ajoutez une légende à chaque photo",
      },
      {
        subtitle: "Capsule temporelle ⏰",
        text: "Créez des capsules temporelles ! Écrivez un message ou ajoutez une photo qui ne sera visible qu'à une date future que vous choisissez. Parfait pour les anniversaires !",
      },
      {
        subtitle: "Lettres programmées 💌",
        text: "Programmez des lettres d'amour qui seront délivrées à votre partenaire à une date spécifique. Une surprise automatique !",
      },
      {
        subtitle: "Journal partagé 📖",
        text: "Tenez un journal intime de couple. Chacun peut écrire ses pensées et vous pouvez relire ensemble vos entrées.",
      },
    ],
  },
  {
    id: 'secret',
    icon: '🔐',
    title: 'Espace Secret',
    color: ['#7C3AED', '#6D28D9'],
    content: [
      {
        subtitle: "Un espace 100% privé",
        text: "L'espace secret est protégé par un code PIN (et optionnellement par la biométrie). Seul vous pouvez y accéder !",
      },
      {
        subtitle: "Que peut-on y stocker ?",
        text: "• 📝 Notes secrètes — vos pensées les plus intimes\n• 📷 Images privées — photos que vous ne voulez pas dans la galerie principale\n\nTout est chiffré et protégé. Personne d'autre ne peut y accéder, même pas votre partenaire !",
      },
      {
        subtitle: "Configuration",
        text: "Pour activer l'espace secret :\n1. Allez dans Paramètres → Sécurité\n2. Configurez un code PIN à 4 chiffres\n3. Activez optionnellement la biométrie (Face ID / Empreinte)\n4. Accédez à l'onglet 🔐 Secret dans la barre de navigation",
      },
    ],
  },
  {
    id: 'profile',
    icon: '👤',
    title: 'Profil & Paramètres',
    color: ['#EF4444', '#DC2626'],
    content: [
      {
        subtitle: "Votre profil",
        text: "L'onglet Profil affiche vos informations de couple :\n\n• 🖼️ Photo de profil et photo de couple\n• 📅 Date d'anniversaire\n• 😊 Avatar personnalisable\n• 📊 Accès rapide aux statistiques, chat, rétrospective",
      },
      {
        subtitle: "💌 Love Notes",
        text: "Envoyez des petits mots d'amour à votre partenaire ! Chaque note est sauvegardée et votre partenaire reçoit une notification.",
      },
      {
        subtitle: "🪣 Bucket List",
        text: "Créez ensemble votre liste de choses à faire en couple :\n\n• Ajoutez des idées\n• Cochez celles que vous avez réalisées ✅\n• Modifiez ou supprimez à tout moment",
      },
      {
        subtitle: "⚙️ Paramètres",
        text: "Personnalisez votre expérience :\n\n• 🎨 Thème — changez les couleurs de l'app\n• 🔒 Sécurité — PIN et biométrie pour l'espace secret\n• 🔔 Notifications — activez/désactivez\n• 👤 Modifier profil — nom, avatar, photo\n• 📅 Date d'anniversaire\n• 📤 Inviter partenaire — partagez le code couple",
      },
    ],
  },
  {
    id: 'stats',
    icon: '📊',
    title: 'Statistiques & Rétrospective',
    color: ['#0EA5E9', '#0284C7'],
    content: [
      {
        subtitle: "📈 Statistiques",
        text: "Consultez les statistiques de votre couple :\n\n• 📅 Nombre de jours ensemble\n• 💬 Messages échangés\n• 🫙 Souvenirs créés\n• 💖 Évolution du Love Meter\n• 🔥 Meilleur streak\n\nAccessible depuis le profil → Actions rapides → Statistiques",
      },
      {
        subtitle: "✨ Rétrospective annuelle",
        text: "Comme le Spotify Wrapped, mais pour votre couple ! 🎉\n\nDes slides animées qui résument votre année ensemble : vos moments forts, vos statistiques, vos souvenirs préférés.\n\nAccessible depuis le profil → Actions rapides → Rétrospective",
      },
    ],
  },
  {
    id: 'tips',
    icon: '💡',
    title: 'Astuces & Conseils',
    color: ['#F97316', '#EA580C'],
    content: [
      {
        subtitle: "Gardez la flamme 🔥",
        text: "• Envoyez au moins 1 message par jour dans le chat\n• Votre flamme grandit avec les jours consécutifs\n• Après 30 jours, vous atteignez le niveau royale 👑",
      },
      {
        subtitle: "Boostez le Love Meter 💖",
        text: "• Envoyez des Love Notes depuis le profil\n• Complétez les défis quotidiens\n• Jouez aux jeux ensemble\n• Ajoutez des souvenirs régulièrement",
      },
      {
        subtitle: "Jouez ensemble 🎮",
        text: "• Le mode en ligne permet de jouer même à distance\n• Variez entre les 4 jeux pour ne pas vous lasser\n• Discutez de vos réponses après chaque partie !",
      },
      {
        subtitle: "Protégez votre intimité 🔐",
        text: "• Utilisez l'espace secret pour les contenus privés\n• Activez la biométrie pour plus de sécurité\n• Vos données sont chiffrées et synchronisées",
      },
      {
        subtitle: "Notifications 🔔",
        text: "• Activez les notifications pour ne rien manquer\n• Recevez des alertes quand votre partenaire :\n  - Vous envoie un message\n  - Vous invite à jouer\n  - Ajoute une Love Note\n  - Complète un défi\n  - Modifie le profil",
      },
    ],
  },
];

export default function GuideScreen({ navigation }) {
  const [expandedSection, setExpandedSection] = useState(null);
  const scrollRef = useRef(null);
  const animatedValues = useRef(
    GUIDE_SECTIONS.reduce((acc, section) => {
      acc[section.id] = new Animated.Value(0);
      return acc;
    }, {})
  ).current;

  const toggleSection = (sectionId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (expandedSection === sectionId) {
      // Fermer
      Animated.timing(animatedValues[sectionId], {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
      setExpandedSection(null);
    } else {
      // Fermer la section précédente
      if (expandedSection) {
        Animated.timing(animatedValues[expandedSection], {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }
      // Ouvrir la nouvelle
      setExpandedSection(sectionId);
      Animated.timing(animatedValues[sectionId], {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }).start();
    }
  };

  const renderSection = (section) => {
    const isExpanded = expandedSection === section.id;
    const animValue = animatedValues[section.id];
    
    const rotateArrow = animValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '180deg'],
    });

    return (
      <View key={section.id} style={styles.sectionCard}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => toggleSection(section.id)}
        >
          <LinearGradient
            colors={isExpanded ? section.color : ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)']}
            style={styles.sectionHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.sectionIcon}>{section.icon}</Text>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Animated.Text style={[styles.sectionArrow, { transform: [{ rotate: rotateArrow }] }]}>
              ▼
            </Animated.Text>
          </LinearGradient>
        </TouchableOpacity>

        {isExpanded && (
          <Animated.View
            style={[
              styles.sectionContent,
              {
                opacity: animValue,
              },
            ]}
          >
            {section.content.map((item, index) => (
              <View key={index} style={styles.contentItem}>
                <Text style={styles.contentSubtitle}>{item.subtitle}</Text>
                <Text style={styles.contentText}>{item.text}</Text>
                {index < section.content.length - 1 && <View style={styles.contentDivider} />}
              </View>
            ))}
          </Animated.View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>📖 Guide d'utilisation</Text>
          <Text style={styles.headerSubtitle}>Tout savoir sur HANI 2</Text>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Intro */}
          <View style={styles.introCard}>
            <Text style={styles.introEmoji}>📱💑</Text>
            <Text style={styles.introTitle}>Bienvenue dans le guide !</Text>
            <Text style={styles.introText}>
              Appuyez sur chaque section pour découvrir toutes les fonctionnalités de HANI 2. 
              Que vous soyez nouveau ou utilisateur régulier, vous trouverez tout ce qu'il faut savoir ici !
            </Text>
          </View>

          {/* Table des matières rapide */}
          <View style={styles.tocContainer}>
            <Text style={styles.tocTitle}>📋 Sommaire rapide</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.tocRow}>
                {GUIDE_SECTIONS.map((section) => (
                  <TouchableOpacity
                    key={section.id}
                    style={[
                      styles.tocItem,
                      expandedSection === section.id && styles.tocItemActive,
                    ]}
                    onPress={() => toggleSection(section.id)}
                  >
                    <Text style={styles.tocItemIcon}>{section.icon}</Text>
                    <Text style={styles.tocItemText}>{section.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Sections */}
          {GUIDE_SECTIONS.map(renderSection)}

          {/* Footer */}
          <View style={styles.footerCard}>
            <Text style={styles.footerEmoji}>❤️</Text>
            <Text style={styles.footerTitle}>Bonne utilisation !</Text>
            <Text style={styles.footerText}>
              HANI 2 est fait avec amour pour votre couple. Si vous avez des questions, 
              n'hésitez pas à nous contacter via la section « À propos » dans les paramètres.
            </Text>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  // Intro
  introCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  introEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  introText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  // TOC
  tocContainer: {
    marginBottom: 20,
  },
  tocTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  tocRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tocItem: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  tocItemActive: {
    backgroundColor: 'rgba(255,107,157,0.3)',
    borderColor: '#FF6B9D',
  },
  tocItemIcon: {
    fontSize: 16,
  },
  tocItemText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  // Sections
  sectionCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
  },
  sectionIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  sectionArrow: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  sectionContent: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginTop: -8,
  },
  contentItem: {
    marginBottom: 16,
  },
  contentSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B9D',
    marginBottom: 8,
  },
  contentText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 22,
  },
  contentDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginTop: 16,
  },
  // Footer
  footerCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  footerEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  footerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  footerText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
  footerVersion: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 12,
  },
});
