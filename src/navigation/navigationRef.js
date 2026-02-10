import { createNavigationContainerRef } from '@react-navigation/native';

// ✅ Référence globale de navigation
// Permet de naviguer depuis n'importe où (même hors des composants React)
// Utilisé notamment par NotificationContext pour rediriger au clic sur une notification
export const navigationRef = createNavigationContainerRef();

/**
 * Naviguer vers un écran depuis n'importe où dans l'app
 * @param {string} name - Nom de l'écran (ex: 'Chat', 'MainTabs', 'Games')
 * @param {object} params - Paramètres de navigation (ex: { screen: 'Memories' })
 */
export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  } else {
    console.warn('⚠️ Navigation pas encore prête, impossible de naviguer vers:', name);
  }
}
