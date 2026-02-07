// Hook simple pour envoyer des invitations de jeu via Firebase
import { useAuth } from '../context/AuthContext';
import { database, isConfigured } from '../config/firebase';
import { ref, set, get } from 'firebase/database';

export const useGameInvites = () => {
  const { user, couple, partner } = useAuth();

  // Envoyer une invitation de jeu simple
  const sendGameInvite = async (gameType, gameData = {}) => {
    if (!user?.id || !couple?.id) {
      console.log('❌ Pas d\'utilisateur ou de couple');
      return { success: false };
    }

    try {
      // Si Firebase est disponible, sauvegarder l'invitation
      if (isConfigured && database) {
        const inviteRef = ref(
          database,
          `couples/${couple.id}/gameInvites/${user.id}`
        );
        
        const invite = {
          from: user.id,
          fromName: user.name,
          gameType: gameType,
          createdAt: new Date().toISOString(),
          status: 'pending',
        };

        await set(inviteRef, invite);
        console.log('✅ Invitation sauvegardée sur Firebase');
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Erreur invitation:', error);
      return { success: false };
    }
  };

  return { sendGameInvite };
};
