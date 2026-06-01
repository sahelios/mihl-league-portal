import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Terms() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage() || { language: 'en' };

  const content = {
    en: {
      title: 'Terms of Service',
      lastUpdated: 'Last updated: June 1, 2026',
      sections: [
        {
          heading: '1. Acceptance of Terms',
          content: 'By accessing and using the MIHL (Mensches Ice Hockey League) website and services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.'
        },
        {
          heading: '2. User Responsibilities',
          content: 'As a user of MIHL services, you agree to:\n• Provide accurate and complete information during registration\n• Maintain the confidentiality of your account credentials\n• Use the platform only for legitimate league activities\n• Comply with all applicable laws and regulations\n• Respect the rights and dignity of other players, staff, and officials\n• Not engage in harassment, discrimination, or abusive behavior'
        },
        {
          heading: '3. Player Conduct and Code of Conduct',
          content: 'All players must adhere to the MIHL Code of Conduct:\n• Play fairly and with respect for opponents\n• Follow all game rules and referee decisions\n• Maintain appropriate behavior on and off the ice\n• Avoid violent or aggressive conduct\n• Do not use offensive language or gestures\n• Respect league officials and staff\n• Violations may result in suspension or removal from the league'
        },
        {
          heading: '4. League Rules and Game Participation',
          content: 'Players must:\n• Register before the registration deadline\n• Provide accurate rating and position information\n• Attend scheduled games or notify the league in advance\n• Wear appropriate safety equipment as required\n• Follow all venue rules and regulations\n• Participate in evaluation games if assigned\n• The league reserves the right to adjust team assignments based on skill level and availability'
        },
        {
          heading: '5. Payment and Fees',
          content: 'Registration fees are non-refundable except in cases of league cancellation. Payment methods accepted include eTransfer, cash, and special arrangements. Fees must be paid before or upon approval. The league is not responsible for payment processing errors; contact registration@mihl.ca for payment inquiries.'
        },
        {
          heading: '6. Liability Disclaimer',
          content: 'PARTICIPATION IN ICE HOCKEY IS A PHYSICALLY DEMANDING ACTIVITY WITH INHERENT RISKS OF INJURY. By registering and participating in MIHL, you acknowledge and assume all risks associated with ice hockey, including but not limited to:\n• Collisions and contact with other players\n• Falls and impacts with the ice or boards\n• Equipment-related injuries\n• Concussions and head injuries\n\nThe MIHL, its organizers, officials, and venue operators are not liable for any injuries, damages, or losses resulting from participation. Players participate entirely at their own risk.'
        },
        {
          heading: '7. Waiver of Liability',
          content: 'All players must sign a digital waiver before participation. This waiver releases MIHL, its organizers, officials, venues, and sponsors from liability for injuries or damages sustained during league activities. By signing the waiver, you agree that you are physically fit to play and have no medical conditions that would prevent safe participation.'
        },
        {
          heading: '8. Suspension and Removal',
          content: 'The league reserves the right to suspend or remove any player who:\n• Violates the Code of Conduct\n• Engages in unsportsmanlike behavior\n• Accumulates excessive penalties or suspensions\n• Fails to pay registration fees\n• Violates league rules or venue policies\n\nSuspensions will be communicated via email with details and duration.'
        },
        {
          heading: '9. Intellectual Property',
          content: 'All content on the MIHL website, including logos, team names, schedules, and statistics, is the property of MIHL. You may not reproduce, distribute, or use this content without permission.'
        },
        {
          heading: '10. Limitation of Liability',
          content: 'MIHL is provided "as is" without warranties. MIHL is not liable for:\n• Service interruptions or technical issues\n• Loss of data or account information\n• Indirect or consequential damages\n• Third-party actions or content'
        },
        {
          heading: '11. Changes to Terms',
          content: 'MIHL reserves the right to modify these Terms of Service at any time. Changes will be posted on this page with an updated date. Continued use of the platform constitutes acceptance of the modified terms.'
        },
        {
          heading: '12. Contact Information',
          content: 'For questions about these Terms of Service, contact:\nEmail: registration@mihl.ca\nPhone: 514-965-2842'
        }
      ]
    },
    fr: {
      title: 'Conditions d\'utilisation',
      lastUpdated: 'Dernière mise à jour : 1er juin 2026',
      sections: [
        {
          heading: '1. Acceptation des conditions',
          content: 'En accédant et en utilisant le site Web et les services de la MIHL (Mensches Ice Hockey League), vous acceptez d\'être lié par ces Conditions d\'utilisation. Si vous n\'acceptez pas ces conditions, veuillez ne pas utiliser nos services.'
        },
        {
          heading: '2. Responsabilités de l\'utilisateur',
          content: 'En tant qu\'utilisateur des services MIHL, vous acceptez de :\n• Fournir des informations exactes et complètes lors de l\'inscription\n• Maintenir la confidentialité de vos identifiants de compte\n• Utiliser la plateforme uniquement pour les activités légitimes de la ligue\n• Respecter toutes les lois et réglementations applicables\n• Respecter les droits et la dignité des autres joueurs, du personnel et des arbitres\n• Ne pas vous engager dans du harcèlement, de la discrimination ou un comportement abusif'
        },
        {
          heading: '3. Conduite des joueurs et code de conduite',
          content: 'Tous les joueurs doivent respecter le Code de conduite de la MIHL :\n• Jouer équitablement et avec respect pour les adversaires\n• Suivre toutes les règles du jeu et les décisions des arbitres\n• Maintenir un comportement approprié sur et hors de la glace\n• Éviter la violence ou l\'agressivité\n• Ne pas utiliser de langage ou de gestes offensants\n• Respecter les officiels et le personnel de la ligue\n• Les violations peuvent entraîner une suspension ou une exclusion de la ligue'
        },
        {
          heading: '4. Règles de la ligue et participation aux matchs',
          content: 'Les joueurs doivent :\n• S\'inscrire avant la date limite d\'inscription\n• Fournir des informations exactes sur leur classement et leur position\n• Assister aux matchs programmés ou notifier la ligue à l\'avance\n• Porter l\'équipement de sécurité approprié selon les exigences\n• Respecter toutes les règles et réglementations du lieu\n• Participer aux matchs d\'évaluation s\'ils sont assignés\n• La ligue se réserve le droit d\'ajuster les assignations d\'équipe en fonction du niveau de compétence et de la disponibilité'
        },
        {
          heading: '5. Paiement et frais',
          content: 'Les frais d\'inscription sont non remboursables sauf en cas d\'annulation de la ligue. Les méthodes de paiement acceptées incluent les virements électroniques, l\'argent comptant et les arrangements spéciaux. Les frais doivent être payés avant ou lors de l\'approbation. La ligue n\'est pas responsable des erreurs de traitement des paiements ; contactez registration@mihl.ca pour les questions de paiement.'
        },
        {
          heading: '6. Clause de non-responsabilité',
          content: 'LA PARTICIPATION AU HOCKEY SUR GLACE EST UNE ACTIVITÉ PHYSIQUEMENT EXIGEANTE PRÉSENTANT DES RISQUES INHÉRENTS DE BLESSURE. En vous inscrivant et en participant à la MIHL, vous reconnaissez et acceptez tous les risques associés au hockey sur glace, y compris mais sans s\'y limiter :\n• Les collisions et les contacts avec d\'autres joueurs\n• Les chutes et les impacts avec la glace ou les bandes\n• Les blessures liées à l\'équipement\n• Les commotions cérébrales et les blessures à la tête\n\nLa MIHL, ses organisateurs, arbitres et exploitants de lieux ne sont pas responsables des blessures, dommages ou pertes résultant de la participation. Les joueurs participent entièrement à leurs propres risques.'
        },
        {
          heading: '7. Renonciation à la responsabilité',
          content: 'Tous les joueurs doivent signer une renonciation numérique avant de participer. Cette renonciation libère la MIHL, ses organisateurs, arbitres, lieux et commanditaires de toute responsabilité pour les blessures ou dommages subis lors des activités de la ligue. En signant la renonciation, vous acceptez que vous êtes physiquement apte à jouer et que vous n\'avez aucune condition médicale qui vous empêcherait de participer en toute sécurité.'
        },
        {
          heading: '8. Suspension et exclusion',
          content: 'La ligue se réserve le droit de suspendre ou d\'exclure tout joueur qui :\n• Viole le Code de conduite\n• S\'engage dans un comportement antisportif\n• Accumule des pénalités ou suspensions excessives\n• Omet de payer les frais d\'inscription\n• Viole les règles de la ligue ou les politiques du lieu\n\nLes suspensions seront communiquées par courrier électronique avec les détails et la durée.'
        },
        {
          heading: '9. Propriété intellectuelle',
          content: 'Tout le contenu du site Web de la MIHL, y compris les logos, les noms d\'équipes, les calendriers et les statistiques, est la propriété de la MIHL. Vous ne pouvez pas reproduire, distribuer ou utiliser ce contenu sans permission.'
        },
        {
          heading: '10. Limitation de responsabilité',
          content: 'La MIHL est fournie « telle quelle » sans garanties. La MIHL n\'est pas responsable de :\n• Les interruptions de service ou les problèmes techniques\n• La perte de données ou d\'informations de compte\n• Les dommages indirects ou consécutifs\n• Les actions ou contenus tiers'
        },
        {
          heading: '11. Modifications des conditions',
          content: 'La MIHL se réserve le droit de modifier ces Conditions d\'utilisation à tout moment. Les modifications seront affichées sur cette page avec une date mise à jour. L\'utilisation continue de la plateforme constitue une acceptation des conditions modifiées.'
        },
        {
          heading: '12. Informations de contact',
          content: 'Pour des questions sur ces Conditions d\'utilisation, veuillez contacter :\nCourriel : registration@mihl.ca\nTéléphone : 514-965-2842'
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
              ? 'Ces conditions d\'utilisation s\'appliquent à tous les utilisateurs du site Web et des services de la MIHL. En utilisant nos services, vous acceptez ces conditions.'
              : 'These Terms of Service apply to all users of the MIHL website and services. By using our services, you accept these terms.'}
          </p>
        </div>
      </div>
    </div>
  );
}
