// ✅ Auto-format date: l'utilisateur tape juste des chiffres (14022024)
// et les "/" apparaissent automatiquement → 14/02/2024
export const formatDateInput = (text) => {
  // Ne garder que les chiffres
  const digits = text.replace(/\D/g, '');
  
  // ✅ Limiter jour à 31, mois à 12
  let day = digits.substring(0, 2);
  let month = digits.substring(2, 4);
  
  if (day.length === 2) {
    const d = parseInt(day, 10);
    if (d > 31) day = '31';
    if (d === 0 && day === '00') day = '01';
  }
  if (month.length === 2) {
    const m = parseInt(month, 10);
    if (m > 12) month = '12';
    if (m === 0 && month === '00') month = '01';
  }

  // Construire la date formatée
  let formatted = '';
  if (digits.length > 0) formatted += day; // JJ
  if (digits.length > 2) formatted += '/' + month; // MM
  if (digits.length > 4) formatted += '/' + digits.substring(4, 8); // AAAA
  
  return formatted;
};
