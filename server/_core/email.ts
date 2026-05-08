export async function sendRefereeApprovalEmail(
  email: string, 
  name: string, 
  role: string, 
  paymentAmount: number, 
  interacEmail: string
) {
  const subject = `MIHL - ${role === 'referee' ? 'Referee' : 'Scorekeeper'} Application Approved / Candidature Approuvée`;
  
  const textBody = `
    Hi ${name},

    Your application to be a ${role} for the MIHL has been approved!
    
    Payment Rate: $${paymentAmount} per game.
    E-transfers will be sent to: ${interacEmail}.

    Next Steps:
    Please log in to the MIHL portal using this email address and visit the 'Game Selection' page to choose your availability.

    Contact us at registration@mihl.ca or 514-965-2842 if you have any questions.
    
    ---

    Bonjour ${name},

    Votre candidature pour être ${role === 'referee' ? 'arbitre' : 'marqueur'} pour la LHM (MIHL) a été approuvée !
    
    Taux de paiement : ${paymentAmount} $ par match.
    Les virements électroniques seront envoyés à : ${interacEmail}.

    Prochaines étapes :
    Veuillez vous connecter au portail MIHL avec cette adresse courriel et visiter la page 'Sélection de matchs' pour choisir vos disponibilités.

    Contactez-nous à registration@mihl.ca ou au 514-965-2842 si vous avez des questions.
  `;

  // Use your existing email transport mechanism here
  // await transporter.sendMail({ to: email, subject, text: textBody });
  console.log('Approval email simulated for:', email);
}