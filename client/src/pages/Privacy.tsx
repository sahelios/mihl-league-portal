import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Privacy() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage() || { language: 'en' };

  const content = {
    en: {
      title: 'Privacy Policy',
      lastUpdated: 'Last updated: June 1, 2026',
      sections: [
        {
          heading: '1. Introduction',
          content: 'The Mensches Ice Hockey League (MIHL) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.'
        },
        {
          heading: '2. Information We Collect',
          content: 'We collect information in the following ways:\n\nRegistration Information:\n• Full name, email address, and phone number\n• Player rating (1-10) and position (Forward, Defense, Goalie)\n• Team preference and availability (Tuesday/Thursday)\n• Player type (Individual, Team, Spare, Referee, Scorekeeper)\n\nPayment Information:\n• Payment method (eTransfer, Cash, Arrangement)\n• Payment status and transaction records\n\nAccount Information:\n• Login credentials (email and password for email/password authentication)\n• Google account information (if using Google OAuth)\n• Account creation and modification dates\n\nGame and Performance Data:\n• Game attendance and results\n• Statistics (goals, assists, points)\n• Evaluation game assignments\n• Suspension records'
        },
        {
          heading: '3. How We Use Your Information',
          content: 'We use your information for:\n• Processing player registrations and league participation\n• Managing team assignments and game scheduling\n• Communicating game schedules, results, and league updates\n• Sending approval/rejection notifications and evaluation game details\n• Processing payments and managing payment records\n• Enforcing league rules and managing suspensions\n• Improving our website and services\n• Complying with legal obligations'
        },
        {
          heading: '4. Email Communications',
          content: 'We send emails for:\n• Registration confirmations and status updates\n• Game schedules and venue information\n• Approval or rejection notifications\n• Evaluation game assignments\n• League announcements and updates\n• Payment reminders and receipts\n• Account-related notifications\n\nYou can manage your email preferences by contacting registration@mihl.ca. We do not sell or share your email address with third parties for marketing purposes.'
        },
        {
          heading: '5. Payment Information',
          content: 'Payment information is handled securely:\n• We do not store full credit card or banking details\n• Payment methods (eTransfer, Cash, Arrangement) are recorded for administrative purposes\n• Payment status is tracked to manage player eligibility\n• Payment records are retained for accounting and league management\n• All payment communications are encrypted and secure'
        },
        {
          heading: '6. Third-Party Integrations',
          content: 'Google OAuth:\n• We use Google OAuth for secure authentication\n• When you sign in with Google, we receive your email, name, and Google ID\n• Google\'s privacy policy governs their data collection: https://policies.google.com/privacy\n• We do not store your Google password\n• You can revoke MIHL\'s access to your Google account at any time through your Google account settings\n\nNo other third-party integrations collect personal data.'
        },
        {
          heading: '7. Data Security',
          content: 'We implement security measures to protect your information:\n• Passwords are hashed using bcryptjs\n• Session cookies are encrypted and marked as HttpOnly\n• All data is transmitted over HTTPS (secure connection)\n• Database access is restricted and monitored\n• We regularly review our security practices\n\nHowever, no security system is completely secure. We cannot guarantee absolute security of your information.'
        },
        {
          heading: '8. Data Retention',
          content: 'We retain your information as follows:\n• Active player registration data: Retained for the duration of the season and 1 year after\n• Game statistics and performance data: Retained indefinitely for league history\n• Payment records: Retained for 7 years for accounting purposes\n• Suspension records: Retained for the duration specified in the suspension\n• Deleted account data: Permanently deleted within 30 days of account deletion request\n\nYou can request deletion of your account and associated data by contacting registration@mihl.ca.'
        },
        {
          heading: '9. GDPR Compliance',
          content: 'For users in the European Union or with GDPR rights:\n• You have the right to access your personal data\n• You have the right to correct inaccurate data\n• You have the right to request deletion of your data\n• You have the right to data portability (receive your data in a structured format)\n• You have the right to withdraw consent for data processing\n\nTo exercise these rights, contact registration@mihl.ca with your request. We will respond within 30 days.'
        },
        {
          heading: '10. Children\'s Privacy',
          content: 'MIHL services are not directed to children under 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected information from a child under 13, we will delete such information immediately. Parents or guardians who believe their child\'s information has been collected should contact us immediately.'
        },
        {
          heading: '11. Sharing Your Information',
          content: 'We do not sell or rent your personal information. We may share your information:\n• With league administrators for management and scheduling purposes\n• With game officials and referees (limited to game-relevant information)\n• With other players only as necessary for team assignments and game participation\n• With legal authorities if required by law\n• With service providers who assist us (e.g., email service providers)\n\nAll third parties are bound by confidentiality agreements.'
        },
        {
          heading: '12. Public Information',
          content: 'The following information may be displayed publicly on the MIHL website:\n• Player name and team assignment\n• Player position and rating\n• Game statistics and standings\n• Team rosters and schedules\n\nYou can request to opt out of public display by contacting registration@mihl.ca.'
        },
        {
          heading: '13. Changes to Privacy Policy',
          content: 'We may update this Privacy Policy at any time. Changes will be posted on this page with an updated date. Continued use of our services constitutes acceptance of the updated Privacy Policy. We encourage you to review this policy periodically.'
        },
        {
          heading: '14. Contact Information',
          content: 'For questions about this Privacy Policy or to exercise your privacy rights, contact:\nEmail: registration@mihl.ca\nPhone: 514-965-2842\n\nWe will respond to all privacy inquiries within 30 days.'
        }
      ]
    },
    fr: {
      title: 'Politique de confidentialité',
      lastUpdated: 'Dernière mise à jour : 1er juin 2026',
      sections: [
        {
          heading: '1. Introduction',
          content: 'La Ligue de hockey sur glace Mensches (MIHL) s\'engage à protéger votre vie privée. Cette Politique de confidentialité explique comment nous collectons, utilisons, divulguons et protégeons vos informations lorsque vous visitez notre site Web et utilisez nos services.'
        },
        {
          heading: '2. Informations que nous collectons',
          content: 'Nous collectons des informations de la manière suivante :\n\nInformations d\'inscription :\n• Nom complet, adresse e-mail et numéro de téléphone\n• Classement du joueur (1-10) et position (Avant, Défense, Gardien)\n• Préférence d\'équipe et disponibilité (mardi/jeudi)\n• Type de joueur (Individuel, Équipe, Remplaçant, Arbitre, Marqueur)\n\nInformations de paiement :\n• Méthode de paiement (virement électronique, argent comptant, arrangement)\n• Statut de paiement et dossiers de transactions\n\nInformations de compte :\n• Identifiants de connexion (e-mail et mot de passe pour l\'authentification par e-mail/mot de passe)\n• Informations du compte Google (si vous utilisez Google OAuth)\n• Dates de création et de modification du compte\n\nDonnées de jeu et de performance :\n• Présence aux matchs et résultats\n• Statistiques (buts, passes, points)\n• Assignations aux matchs d\'évaluation\n• Dossiers de suspension'
        },
        {
          heading: '3. Comment nous utilisons vos informations',
          content: 'Nous utilisons vos informations pour :\n• Traiter les inscriptions des joueurs et la participation à la ligue\n• Gérer les assignations d\'équipe et la programmation des matchs\n• Communiquer les calendriers des matchs, les résultats et les mises à jour de la ligue\n• Envoyer des notifications d\'approbation/rejet et les détails des matchs d\'évaluation\n• Traiter les paiements et gérer les dossiers de paiement\n• Appliquer les règles de la ligue et gérer les suspensions\n• Améliorer notre site Web et nos services\n• Respecter les obligations légales'
        },
        {
          heading: '4. Communications par e-mail',
          content: 'Nous envoyons des e-mails pour :\n• Les confirmations d\'inscription et les mises à jour de statut\n• Les calendriers des matchs et les informations sur les lieux\n• Les notifications d\'approbation ou de rejet\n• Les assignations aux matchs d\'évaluation\n• Les annonces et les mises à jour de la ligue\n• Les rappels de paiement et les reçus\n• Les notifications liées au compte\n\nVous pouvez gérer vos préférences de courrier électronique en contactant registration@mihl.ca. Nous ne vendons ni ne partageons votre adresse e-mail avec des tiers à des fins de marketing.'
        },
        {
          heading: '5. Informations de paiement',
          content: 'Les informations de paiement sont traitées de manière sécurisée :\n• Nous ne stockons pas les détails complets des cartes de crédit ou bancaires\n• Les méthodes de paiement (virement électronique, argent comptant, arrangement) sont enregistrées à des fins administratives\n• Le statut de paiement est suivi pour gérer l\'admissibilité des joueurs\n• Les dossiers de paiement sont conservés à des fins comptables et de gestion de la ligue\n• Toutes les communications de paiement sont chiffrées et sécurisées'
        },
        {
          heading: '6. Intégrations tierces',
          content: 'Google OAuth :\n• Nous utilisons Google OAuth pour une authentification sécurisée\n• Lorsque vous vous connectez avec Google, nous recevons votre e-mail, votre nom et votre ID Google\n• La politique de confidentialité de Google régit leur collecte de données : https://policies.google.com/privacy\n• Nous ne stockons pas votre mot de passe Google\n• Vous pouvez révoquer l\'accès de la MIHL à votre compte Google à tout moment via les paramètres de votre compte Google\n\nAucune autre intégration tierce ne collecte de données personnelles.'
        },
        {
          heading: '7. Sécurité des données',
          content: 'Nous mettons en œuvre des mesures de sécurité pour protéger vos informations :\n• Les mots de passe sont hachés à l\'aide de bcryptjs\n• Les cookies de session sont chiffrés et marqués comme HttpOnly\n• Toutes les données sont transmises via HTTPS (connexion sécurisée)\n• L\'accès à la base de données est restreint et surveillé\n• Nous examinons régulièrement nos pratiques de sécurité\n\nCependant, aucun système de sécurité n\'est complètement sûr. Nous ne pouvons pas garantir la sécurité absolue de vos informations.'
        },
        {
          heading: '8. Conservation des données',
          content: 'Nous conservons vos informations comme suit :\n• Données d\'inscription des joueurs actifs : conservées pendant la durée de la saison et 1 an après\n• Statistiques de jeu et données de performance : conservées indéfiniment pour l\'historique de la ligue\n• Dossiers de paiement : conservés pendant 7 ans à des fins comptables\n• Dossiers de suspension : conservés pendant la durée spécifiée dans la suspension\n• Données de compte supprimé : supprimées définitivement dans les 30 jours suivant la demande de suppression du compte\n\nVous pouvez demander la suppression de votre compte et des données associées en contactant registration@mihl.ca.'
        },
        {
          heading: '9. Conformité au RGPD',
          content: 'Pour les utilisateurs dans l\'Union européenne ou ayant des droits RGPD :\n• Vous avez le droit d\'accéder à vos données personnelles\n• Vous avez le droit de corriger les données inexactes\n• Vous avez le droit de demander la suppression de vos données\n• Vous avez le droit à la portabilité des données (recevoir vos données dans un format structuré)\n• Vous avez le droit de retirer votre consentement au traitement des données\n\nPour exercer ces droits, contactez registration@mihl.ca avec votre demande. Nous répondrons dans les 30 jours.'
        },
        {
          heading: '10. Confidentialité des enfants',
          content: 'Les services de la MIHL ne sont pas destinés aux enfants de moins de 13 ans. Nous ne collectons pas sciemment d\'informations personnelles auprès d\'enfants de moins de 13 ans. Si nous découvrons que nous avons collecté des informations auprès d\'un enfant de moins de 13 ans, nous supprimerons immédiatement ces informations. Les parents ou tuteurs qui croient que les informations de leur enfant ont été collectées doivent nous contacter immédiatement.'
        },
        {
          heading: '11. Partage de vos informations',
          content: 'Nous ne vendons ni ne louons vos informations personnelles. Nous pouvons partager vos informations :\n• Avec les administrateurs de la ligue à des fins de gestion et de programmation\n• Avec les officiels de jeu et les arbitres (limité aux informations pertinentes au jeu)\n• Avec d\'autres joueurs uniquement si nécessaire pour les assignations d\'équipe et la participation aux matchs\n• Avec les autorités légales si requis par la loi\n• Avec les prestataires de services qui nous aident (par exemple, les fournisseurs de services de courrier électronique)\n\nTous les tiers sont liés par des accords de confidentialité.'
        },
        {
          heading: '12. Informations publiques',
          content: 'Les informations suivantes peuvent être affichées publiquement sur le site Web de la MIHL :\n• Nom du joueur et assignation d\'équipe\n• Position et classement du joueur\n• Statistiques de jeu et classements\n• Effectifs d\'équipe et calendriers\n\nVous pouvez demander à ne pas être affiché publiquement en contactant registration@mihl.ca.'
        },
        {
          heading: '13. Modifications de la politique de confidentialité',
          content: 'Nous pouvons mettre à jour cette Politique de confidentialité à tout moment. Les modifications seront affichées sur cette page avec une date mise à jour. L\'utilisation continue de nos services constitue une acceptation de la Politique de confidentialité mise à jour. Nous vous encourageons à examiner cette politique régulièrement.'
        },
        {
          heading: '14. Informations de contact',
          content: 'Pour des questions sur cette Politique de confidentialité ou pour exercer vos droits en matière de confidentialité, veuillez contacter :\nCourriel : registration@mihl.ca\nTéléphone : 514-965-2842\n\nNous répondrons à toutes les demandes de confidentialité dans les 30 jours.'
        }
      ]
    }
  };

  const currentContent = language === 'fr' ? content.fr : content.en;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white py-8">
        <div className="container max-w-4xl">
          <button
            onClick={() => setLocation('/')}
            className="flex items-center gap-2 text-sm mb-4 hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="w-4 h-4" />
            {language === 'fr' ? 'Retour' : 'Back'}
          </button>
          <h1 className="text-4xl font-bold">{currentContent.title}</h1>
          <p className="text-slate-300 mt-2">{currentContent.lastUpdated}</p>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-4xl py-12">
        <div className="space-y-8">
          {currentContent.sections.map((section, index) => (
            <section key={index} className="space-y-3">
              <h2 className="text-2xl font-bold text-foreground">{section.heading}</h2>
              <p className="text-foreground/80 whitespace-pre-line leading-relaxed">
                {section.content}
              </p>
            </section>
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {language === 'fr'
              ? 'Cette Politique de confidentialité s\'applique à tous les utilisateurs du site Web et des services de la MIHL. En utilisant nos services, vous acceptez cette politique.'
              : 'This Privacy Policy applies to all users of the MIHL website and services. By using our services, you accept this policy.'}
          </p>
        </div>
      </div>
    </div>
  );
}
