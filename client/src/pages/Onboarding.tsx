import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/lib/i18n";
import { useTranslation } from "@/lib/i18n";
import { Brain, CheckCircle2, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const BIG_FIVE_QUESTIONS = [
  {
    id: 1,
    trait: 'openness',
    text: {
      fr: 'J\'aime explorer de nouvelles idées et perspectives',
      en: 'I like to explore new ideas and perspectives',
    },
  },
  {
    id: 2,
    trait: 'openness',
    text: {
      fr: 'Je suis créatif et imaginatif',
      en: 'I am creative and imaginative',
    },
  },
  {
    id: 3,
    trait: 'conscientiousness',
    text: {
      fr: 'Je suis organisé et méthodique',
      en: 'I am organized and methodical',
    },
  },
  {
    id: 4,
    trait: 'conscientiousness',
    text: {
      fr: 'Je respecte les délais et les engagements',
      en: 'I meet deadlines and commitments',
    },
  },
  {
    id: 5,
    trait: 'extraversion',
    text: {
      fr: 'J\'aime interagir avec les autres',
      en: 'I enjoy interacting with others',
    },
  },
  {
    id: 6,
    trait: 'extraversion',
    text: {
      fr: 'Je suis énergique et enthousiaste',
      en: 'I am energetic and enthusiastic',
    },
  },
  {
    id: 7,
    trait: 'agreeableness',
    text: {
      fr: 'Je suis empathique et attentif aux autres',
      en: 'I am empathetic and attentive to others',
    },
  },
  {
    id: 8,
    trait: 'agreeableness',
    text: {
      fr: 'Je préfère la coopération au conflit',
      en: 'I prefer cooperation to conflict',
    },
  },
  {
    id: 9,
    trait: 'neuroticism',
    text: {
      fr: 'Je suis facilement stressé ou anxieux',
      en: 'I get stressed or anxious easily',
    },
  },
  {
    id: 10,
    trait: 'neuroticism',
    text: {
      fr: 'Je suis sensible aux critiques',
      en: 'I am sensitive to criticism',
    },
  },
  {
    id: 11,
    trait: 'openness',
    text: {
      fr: 'Je suis curieux et j\'aime apprendre',
      en: 'I am curious and like to learn',
    },
  },
  {
    id: 12,
    trait: 'conscientiousness',
    text: {
      fr: 'Je suis fiable et responsable',
      en: 'I am reliable and responsible',
    },
  },
  {
    id: 13,
    trait: 'extraversion',
    text: {
      fr: 'Je suis confiant en moi',
      en: 'I am confident in myself',
    },
  },
  {
    id: 14,
    trait: 'agreeableness',
    text: {
      fr: 'Je suis généreux et altruiste',
      en: 'I am generous and altruistic',
    },
  },
  {
    id: 15,
    trait: 'neuroticism',
    text: {
      fr: 'Je suis émotionnellement stable',
      en: 'I am emotionally stable',
    },
  },
];

export default function Onboarding() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [cvText, setCvText] = useState('');

  const updateProfileMutation = trpc.profile360.submitQuiz.useMutation({
    onSuccess: () => {
      toast.success(t('common.success'));
      setLocation('/dashboard');
    },
    onError: () => {
      toast.error(t('common.error'));
    },
  });

  const handleAnswer = (questionId: number, score: number) => {
    setAnswers({ ...answers, [questionId]: score });
  };

  const handleSkip = () => {
    setLocation('/dashboard');
  };

  const handleNext = () => {
    if (step === 1) {
      // Vérifier que toutes les questions sont répondues
      if (Object.keys(answers).length < 15) {
        toast.error('Veuillez répondre à toutes les questions');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      // Soumettre le profil
      const scores = {
        openness: (answers[1] + answers[2] + answers[11]) / 3,
        conscientiousness: (answers[3] + answers[4] + answers[12]) / 3,
        extraversion: (answers[5] + answers[6] + answers[13]) / 3,
        agreeableness: (answers[7] + answers[8] + answers[14]) / 3,
        neuroticism: (answers[9] + answers[10]) / 2,
      };

      // Submit quiz answers
      const quizAnswers = Object.entries(answers).map(([questionId, score]) => ({
        questionId,
        score,
      }));

      updateProfileMutation.mutate({
        answers: quizAnswers as any,
      });
    }
  };

  const progress = (step / 3) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-6 h-6" />
            <CardTitle>{t('onboarding.welcome')}</CardTitle>
          </div>
          <CardDescription className="text-blue-100">
            {t('onboarding.subtitle')}
          </CardDescription>
          <Progress value={progress} className="mt-4" />
        </CardHeader>

        <CardContent className="pt-8">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">{t('onboarding.step1')}</h3>
                <p className="text-gray-600 mb-6">{t('onboarding.quiz_description')}</p>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {BIG_FIVE_QUESTIONS.map((q) => (
                  <div key={q.id} className="border rounded-lg p-4">
                    <p className="font-medium mb-3">
                      {q.text[language as keyof typeof q.text]}
                    </p>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <Button
                          key={score}
                          variant={answers[q.id] === score ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleAnswer(q.id, score)}
                          className="flex-1"
                        >
                          {score}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">{t('onboarding.step2')}</h3>
                <p className="text-gray-600 mb-6">{t('onboarding.experience_description')}</p>
              </div>

              <textarea
                placeholder="Décrivez votre expérience professionnelle..."
                value={cvText}
                onChange={(e) => setCvText(e.target.value)}
                className="w-full h-48 p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
                <div>
                  <h3 className="text-lg font-semibold">{t('onboarding.step3')}</h3>
                  <p className="text-gray-600">{t('onboarding.verification_description')}</p>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700">
                  ✓ Quiz Big Five complété<br />
                  ✓ Expérience professionnelle {cvText ? 'fournie' : 'optionnelle'}<br />
                  ✓ Prêt à commencer !
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-4 mt-8">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1"
            >
              {t('onboarding.skip')}
            </Button>
            <Button
              onClick={handleNext}
              disabled={updateProfileMutation.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {step === 3 ? t('onboarding.finish') : t('onboarding.next')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
