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

export async function sendAdminRegistrationEmail(
  playerEmail: string,
  playerName: string,
  magicLoginUrl: string,
  language: 'en' | 'fr' = 'en'
) {
  const subject = language === 'en'
    ? 'Welcome to MIHL - Your Login Link'
    : 'Bienvenue à la Ligue MIHL - Votre Lien de Connexion';

  const text = language === 'en'
    ? `Hi ${playerName},\n\nAn admin has registered you for the Mensches Ice Hockey League!\n\nClick the link below to log in and complete your profile:\n${magicLoginUrl}\n\nThis link will expire at the start of the season.\n\nIf you have any questions, please contact registration@mihl.ca or call 514-965-2842.\n\nBest regards,\nMIHL Team`
    : `Bonjour ${playerName},\n\nUn administrateur vous a inscrit à la Ligue de Hockey Mensches!\n\nCliquez sur le lien ci-dessous pour vous connecter et compléter votre profil:\n${magicLoginUrl}\n\nCe lien expirera au début de la saison.\n\nSi vous avez des questions, veuillez contacter registration@mihl.ca ou appeler 514-965-2842.\n\nCordialement,\nÉquipe MIHL`;

  const html = language === 'en'
    ? `<p>Hi ${playerName},</p><p>An admin has registered you for the Mensches Ice Hockey League!</p><p><a href="${magicLoginUrl}">Click here to log in and complete your profile</a></p><p>This link will expire at the start of the season.</p><p>If you have any questions, please contact <a href="mailto:registration@mihl.ca">registration@mihl.ca</a> or call 514-965-2842.</p><p>Best regards,<br/>MIHL Team</p>`
    : `<p>Bonjour ${playerName},</p><p>Un administrateur vous a inscrit à la Ligue de Hockey Mensches!</p><p><a href="${magicLoginUrl}">Cliquez ici pour vous connecter et compléter votre profil</a></p><p>Ce lien expirera au début de la saison.</p><p>Si vous avez des questions, veuillez contacter <a href="mailto:registration@mihl.ca">registration@mihl.ca</a> ou appeler 514-965-2842.</p><p>Cordialement,<br/>Équipe MIHL</p>`;

  return sendEmail(playerEmail, subject, text, html);
}


export async function sendStaffApplicationConfirmationEmail(
  email: string,
  firstName: string,
  language: 'en' | 'fr' = 'en'
) {
  const subject = language === 'en'
    ? 'Staff Application Received - MIHL'
    : 'Demande de Personnel Reçue - MIHL';

  const text = language === 'en'
    ? `Hi ${firstName},\n\nThank you for submitting your staff application to the Mensches Ice Hockey League!\n\nWe have received your application and will review it shortly. You will be notified of the status via email.\n\nIf you have any questions, please contact registration@mihl.ca or call 514-965-2842.\n\nBest regards,\nMIHL Team`
    : `Bonjour ${firstName},\n\nMerci d'avoir soumis votre demande de personnel à la Ligue de Hockey Mensches!\n\nNous avons reçu votre demande et l'examinerons bientôt. Vous serez notifié du statut par courriel.\n\nSi vous avez des questions, veuillez contacter registration@mihl.ca ou appeler 514-965-2842.\n\nCordialement,\nÉquipe MIHL`;

  const html = language === 'en'
    ? `<p>Hi ${firstName},</p><p>Thank you for submitting your staff application to the Mensches Ice Hockey League!</p><p>We have received your application and will review it shortly. You will be notified of the status via email.</p><p>If you have any questions, please contact <a href="mailto:registration@mihl.ca">registration@mihl.ca</a> or call 514-965-2842.</p><p>Best regards,<br/>MIHL Team</p>`
    : `<p>Bonjour ${firstName},</p><p>Merci d'avoir soumis votre demande de personnel à la Ligue de Hockey Mensches!</p><p>Nous avons reçu votre demande et l'examinerons bientôt. Vous serez notifié du statut par courriel.</p><p>Si vous avez des questions, veuillez contacter <a href="mailto:registration@mihl.ca">registration@mihl.ca</a> ou appeler 514-965-2842.</p><p>Cordialement,<br/>Équipe MIHL</p>`;

  return sendEmail(email, subject, text, html);
}

export async function sendStaffApplicationNotification(
  application: any,
  language: 'en' | 'fr' = 'en'
) {
  const subject = language === 'en'
    ? `New Staff Application Received - ${application.firstName} ${application.lastName}`
    : `Nouvelle Demande de Personnel Reçue - ${application.firstName} ${application.lastName}`;

  const roleText = application.registrationType === 'referee' 
    ? (language === 'en' ? 'Referee' : 'Arbitre')
    : (language === 'en' ? 'Scorekeeper' : 'Marqueur');

  const text = language === 'en'
    ? `A new staff application has been received:\n\nName: ${application.firstName} ${application.lastName}\nEmail: ${application.email}\nPhone: ${application.phone}\nRole: ${roleText}\nExperience: ${application.experience}\nAvailable Days: ${application.availableDays.join(', ')}\nNotes: ${application.notes || 'None'}\n\nPlease review this application in the admin panel.`
    : `Une nouvelle demande de personnel a été reçue:\n\nNom: ${application.firstName} ${application.lastName}\nCourriel: ${application.email}\nTéléphone: ${application.phone}\nRôle: ${roleText}\nExpérience: ${application.experience}\nJours Disponibles: ${application.availableDays.join(', ')}\nNotes: ${application.notes || 'Aucune'}\n\nVeuillez examiner cette demande dans le panneau d'administration.`;

  const html = language === 'en'
    ? `<p>A new staff application has been received:</p><ul><li><strong>Name:</strong> ${application.firstName} ${application.lastName}</li><li><strong>Email:</strong> ${application.email}</li><li><strong>Phone:</strong> ${application.phone}</li><li><strong>Role:</strong> ${roleText}</li><li><strong>Experience:</strong> ${application.experience}</li><li><strong>Available Days:</strong> ${application.availableDays.join(', ')}</li><li><strong>Notes:</strong> ${application.notes || 'None'}</li></ul><p>Please review this application in the admin panel.</p>`
    : `<p>Une nouvelle demande de personnel a été reçue:</p><ul><li><strong>Nom:</strong> ${application.firstName} ${application.lastName}</li><li><strong>Courriel:</strong> ${application.email}</li><li><strong>Téléphone:</strong> ${application.phone}</li><li><strong>Rôle:</strong> ${roleText}</li><li><strong>Expérience:</strong> ${application.experience}</li><li><strong>Jours Disponibles:</strong> ${application.availableDays.join(', ')}</li><li><strong>Notes:</strong> ${application.notes || 'Aucune'}</li></ul><p>Veuillez examiner cette demande dans le panneau d'administration.</p>`;

  return sendEmail('registration@mihl.ca', subject, text, html);
}
