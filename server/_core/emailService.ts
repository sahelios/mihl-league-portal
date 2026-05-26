import nodemailer from 'nodemailer';

// Create transporter with SMTP configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '465'),
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Log email configuration on startup (without passwords)
console.log('[EMAIL CONFIG] Host:', process.env.EMAIL_HOST, 'Port:', process.env.EMAIL_PORT, 'User:', process.env.EMAIL_USER);

// Verify connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('[EMAIL] SMTP connection verification failed:', error);
  } else {
    console.log('[EMAIL] SMTP connection verified successfully');
  }
});

export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html?: string
) {
  try {
    console.log(`[EMAIL] Attempting to send email to ${to} with subject: ${subject}`);
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'registration@mihl.ca',
      to,
      subject,
      text,
      html: html || text,
    });

    console.log(`[EMAIL SENT] To: ${to}, Subject: ${subject}, Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send email to ${to}:`, error instanceof Error ? error.message : error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function sendRegistrationConfirmationEmail(
  playerEmail: string,
  playerName: string,
  language: 'en' | 'fr' = 'en'
) {
  const subject = language === 'en'
    ? 'MIHL Registration Received - Confirmation'
    : 'Inscription à la Ligue MIHL Reçue - Confirmation';

  const text = language === 'en'
    ? `Hi ${playerName},\n\nThank you for registering with the Mensches Ice Hockey League!\n\nWe have received your registration and it is currently pending approval. You will receive an email update once your registration has been reviewed.\n\nIf you have any questions, please contact registration@mihl.ca\n\nBest regards,\nMIHL Team`
    : `Bonjour ${playerName},\n\nMerci de vous être inscrit à la Ligue de Hockey Mensches!\n\nNous avons reçu votre inscription et elle est actuellement en attente d'approbation. Vous recevrez un courriel de mise à jour une fois votre inscription examinée.\n\nSi vous avez des questions, veuillez contacter registration@mihl.ca\n\nCordialement,\nÉquipe MIHL`;

  return sendEmail(playerEmail, subject, text);
}

export async function sendRegistrationAdminNotification(
  playerData: {
    firstName: string;
    lastName: string;
    email: string;
    registrationType: string;
    playerRating?: number;
    evaluationDate?: string;
  },
  language: 'en' | 'fr' = 'en'
) {
  const subject = language === 'en'
    ? 'New Player Registration - MIHL League'
    : 'Nouvelle Inscription de Joueur - Ligue MIHL';

  const text = language === 'en'
    ? `New registration received:\n\nName: ${playerData.firstName} ${playerData.lastName}\nEmail: ${playerData.email}\nType: ${playerData.registrationType}\nRating: ${playerData.playerRating || 'N/A'}\nEvaluation Date: ${playerData.evaluationDate || 'N/A'}`
    : `Nouvelle inscription reçue:\n\nNom: ${playerData.firstName} ${playerData.lastName}\nCourriel: ${playerData.email}\nType: ${playerData.registrationType}\nNiveau: ${playerData.playerRating || 'N/A'}\nDate d'évaluation: ${playerData.evaluationDate || 'N/A'}`;

  return sendEmail('registration@mihl.ca', subject, text);
}

export async function sendApprovalEmail(
  playerEmail: string,
  playerName: string,
  language: 'en' | 'fr' = 'en',
  evaluationGameInfo?: { date: string; team: string } | null
) {
  console.log(`[APPROVAL EMAIL] Starting sendApprovalEmail for ${playerEmail}, language: ${language}`);
  const subject = language === 'en'
    ? 'Your MIHL Registration Has Been Approved!'
    : 'Votre Inscription à la Ligue MIHL a été Approuvée!';

  let evaluationDetails = '';
  if (evaluationGameInfo) {
    evaluationDetails = language === 'en'
      ? `\n\nEvaluation Game Assignment:\nDate: ${evaluationGameInfo.date}\nTeam: ${evaluationGameInfo.team}`
      : `\n\nAssignation au Match d'Évaluation:\nDate: ${evaluationGameInfo.date}\nÉquipe: ${evaluationGameInfo.team}`;
  }

  const portalInstructions = language === 'en'
    ? `\n\nNext Steps:\n1. Log in to the MIHL Player Portal at https://mihl.ca/player-portal\n2. Use your email (${playerEmail}) to sign in\n3. View your evaluation game details and team assignment\n4. Mark your availability for upcoming games\n\nIf you have any questions, please contact registration@mihl.ca or call 514-965-2842.`
    : `\n\nProchaines Étapes:\n1. Connectez-vous au Portail des Joueurs MIHL à https://mihl.ca/player-portal\n2. Utilisez votre courriel (${playerEmail}) pour vous connecter\n3. Consultez les détails de votre match d'évaluation et votre assignation d'équipe\n4. Indiquez votre disponibilité pour les matchs à venir\n\nSi vous avez des questions, veuillez contacter registration@mihl.ca ou appeler 514-965-2842.`;

  const text = language === 'en'
    ? `Hi ${playerName},\n\nYour registration for the MIHL league has been approved!${evaluationDetails}${portalInstructions}`
    : `Bonjour ${playerName},\n\nVotre inscription à la ligue MIHL a été approuvée!${evaluationDetails}${portalInstructions}`;

  return sendEmail(playerEmail, subject, text);
}

export async function sendRejectionEmail(
  playerEmail: string,
  playerName: string,
  reason: string,
  language: 'en' | 'fr' = 'en'
) {
  const subject = language === 'en'
    ? 'MIHL Registration Status Update'
    : 'Mise à Jour du Statut d\'Inscription MIHL';

  const text = language === 'en'
    ? `Hi ${playerName},\n\nUnfortunately, your registration could not be approved at this time.\n\nReason: ${reason}\n\nPlease contact registration@mihl.ca for more information.`
    : `Bonjour ${playerName},\n\nMalheureusement, votre inscription n'a pas pu être approuvée à ce moment.\n\nRaison: ${reason}\n\nVeuillez contacter registration@mihl.ca pour plus d'informations.`;

  return sendEmail(playerEmail, subject, text);
}

export async function verifyEmailConnection() {
  try {
    await transporter.verify();
    console.log('[EMAIL] SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.error('[EMAIL] SMTP connection failed:', error);
    return false;
  }
}
