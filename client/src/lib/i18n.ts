// Système de traduction multilingue (FR/EN)
export type Language = 'fr' | 'en';

export const translations = {
  fr: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.teams': 'Équipes',
    'nav.memory': 'Memory Explorer',
    'nav.profile': 'Profil',
    'nav.profile360': 'Profil 360°',
    
    // Dashboard
    'dashboard.title': 'TeamPlay Dashboard',
    'dashboard.diversity': 'Indice de Diversité',
    'dashboard.critical_thinking': 'Pensée Critique',
    'dashboard.bias_risk': 'Risque de Biais',
    'dashboard.decision_quality': 'Qualité Décisionnelle',
    'dashboard.metrics_evolution': 'Évolution des Métriques',
    'dashboard.cognitive_profile': 'Profil Cognitif',
    'dashboard.recent_alerts': 'Alertes Récentes',
    'dashboard.cognitive_map': 'Carte Cognitive Interactive',
    'dashboard.your_teams': 'Vos Équipes',
    'dashboard.create_team': 'Créer une équipe',
    
    // Profile 360
    'profile360.title': 'Profil 360°',
    'profile360.completion': 'Complétude',
    'profile360.overview': 'Vue d\'ensemble',
    'profile360.bigfive': 'Big Five',
    'profile360.experience': 'Expérience',
    'profile360.quiz': 'Quiz',
    'profile360.take_quiz': 'Faire le quiz',
    'profile360.import_cv': 'Importer CV',
    'profile360.personality': 'Profil Big Five / OCEAN',
    'profile360.professional': 'Profil professionnel',
    'profile360.incomplete': 'incomplet',
    'profile360.information': 'Informations',
    
    // Big Five Traits
    'bigfive.openness': 'Ouverture',
    'bigfive.conscientiousness': 'Conscienciosité',
    'bigfive.extraversion': 'Extraversion',
    'bigfive.agreeableness': 'Agréabilité',
    'bigfive.neuroticism': 'Névrosisme',
    
    // Onboarding
    'onboarding.welcome': 'Bienvenue sur AI TeamPlay Engine',
    'onboarding.subtitle': 'Créons votre profil pour une meilleure expérience',
    'onboarding.step1': 'Étape 1: Votre Profil Psychologique',
    'onboarding.step2': 'Étape 2: Votre Expérience',
    'onboarding.step3': 'Étape 3: Vérification',
    'onboarding.start_quiz': 'Commencer le quiz',
    'onboarding.skip': 'Passer',
    'onboarding.next': 'Suivant',
    'onboarding.finish': 'Terminer',
    'onboarding.quiz_description': 'Répondez à 15 questions rapides pour déterminer votre profil psychologique',
    'onboarding.experience_description': 'Parlez-nous de votre expérience professionnelle',
    'onboarding.verification_description': 'Vérifiez vos informations avant de continuer',
    
    // Common
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.edit': 'Modifier',
    'common.delete': 'Supprimer',
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    'common.logout': 'Déconnexion',
    'common.language': 'Langue',
  },
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.teams': 'Teams',
    'nav.memory': 'Memory Explorer',
    'nav.profile': 'Profile',
    'nav.profile360': 'Profile 360°',
    
    // Dashboard
    'dashboard.title': 'TeamPlay Dashboard',
    'dashboard.diversity': 'Diversity Index',
    'dashboard.critical_thinking': 'Critical Thinking',
    'dashboard.bias_risk': 'Bias Risk',
    'dashboard.decision_quality': 'Decision Quality',
    'dashboard.metrics_evolution': 'Metrics Evolution',
    'dashboard.cognitive_profile': 'Cognitive Profile',
    'dashboard.recent_alerts': 'Recent Alerts',
    'dashboard.cognitive_map': 'Interactive Cognitive Map',
    'dashboard.your_teams': 'Your Teams',
    'dashboard.create_team': 'Create Team',
    
    // Profile 360
    'profile360.title': 'Profile 360°',
    'profile360.completion': 'Completion',
    'profile360.overview': 'Overview',
    'profile360.bigfive': 'Big Five',
    'profile360.experience': 'Experience',
    'profile360.quiz': 'Quiz',
    'profile360.take_quiz': 'Take Quiz',
    'profile360.import_cv': 'Import CV',
    'profile360.personality': 'Big Five / OCEAN Profile',
    'profile360.professional': 'Professional Profile',
    'profile360.incomplete': 'incomplete',
    'profile360.information': 'Information',
    
    // Big Five Traits
    'bigfive.openness': 'Openness',
    'bigfive.conscientiousness': 'Conscientiousness',
    'bigfive.extraversion': 'Extraversion',
    'bigfive.agreeableness': 'Agreeableness',
    'bigfive.neuroticism': 'Neuroticism',
    
    // Onboarding
    'onboarding.welcome': 'Welcome to AI TeamPlay Engine',
    'onboarding.subtitle': 'Let\'s create your profile for a better experience',
    'onboarding.step1': 'Step 1: Your Psychological Profile',
    'onboarding.step2': 'Step 2: Your Experience',
    'onboarding.step3': 'Step 3: Verification',
    'onboarding.start_quiz': 'Start Quiz',
    'onboarding.skip': 'Skip',
    'onboarding.next': 'Next',
    'onboarding.finish': 'Finish',
    'onboarding.quiz_description': 'Answer 15 quick questions to determine your psychological profile',
    'onboarding.experience_description': 'Tell us about your professional experience',
    'onboarding.verification_description': 'Verify your information before continuing',
    
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.logout': 'Logout',
    'common.language': 'Language',
  },
};

// Hook pour utiliser les traductions
export function useTranslation(language: Language) {
  return {
    t: (key: string) => {
      const keys = key.split('.');
      let value: any = translations[language];
      
      for (const k of keys) {
        value = value?.[k];
      }
      
      return value || key;
    },
    language,
  };
}

// Contexte pour la langue globale
import { createContext, useContext } from 'react';

export const LanguageContext = createContext<{
  language: Language;
  setLanguage: (lang: Language) => void;
}>({
  language: 'fr',
  setLanguage: () => {},
});

export function useLanguage() {
  return useContext(LanguageContext);
}
