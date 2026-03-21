// ✅ Auto-format date: l'utilisateur tape juste des chiffres (14022024)
// et les "/" apparaissent automatiquement → 14/02/2024
export const formatDateInput = (text) => {
  // Ne garder que les chiffres
  const digits = text.replace(/\D/g, '');
  
  // Construire la date formatée
  let formatted = '';
  if (digits.length > 0) formatted += digits.substring(0, 2); // JJ
  if (digits.length > 2) formatted += '/' + digits.substring(2, 4); // MM
  if (digits.length > 4) formatted += '/' + digits.substring(4, 8); // AAAA
  
  return formatted;
};
