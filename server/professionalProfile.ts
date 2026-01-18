/**
 * Professional Profile Extraction System
 * Extraction d'expérience professionnelle depuis CV (texte)
 */

import { invokeLLM } from "./_core/llm";

export interface Education {
  degree: string;
  field: string;
  institution: string;
  year?: number;
}

export interface Experience {
  title: string;
  company: string;
  duration: string;
  description?: string;
}

export interface ProfessionalProfile {
  linkedinUrl?: string;
  currentRole?: string;
  company?: string;
  yearsExperience?: number;
  industries: string[];
  skills: string[];
  education: Education[];
  experiences: Experience[];
  certifications: string[];
  languages: string[];
  source: 'linkedin' | 'cv' | 'manual';
  lastUpdated: string;
}

export interface ExtractionResult {
  success: boolean;
  profile?: ProfessionalProfile;
  error?: string;
  confidence: number;
}

export async function extractFromCVText(cvText: string): Promise<ExtractionResult> {
  if (!cvText || cvText.trim().length < 50) {
    return { success: false, error: "Le texte du CV est trop court ou vide", confidence: 0 };
  }

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Tu es un expert en extraction d'informations de CV. Analyse le texte fourni et extrais les informations structurées.
Retourne UNIQUEMENT un JSON valide avec cette structure :
{
  "currentRole": "Titre actuel",
  "company": "Entreprise actuelle",
  "yearsExperience": nombre,
  "industries": ["industrie1", "industrie2"],
  "skills": ["compétence1", "compétence2"],
  "education": [{"degree": "Diplôme", "field": "Domaine", "institution": "École", "year": 2020}],
  "experiences": [{"title": "Poste", "company": "Entreprise", "duration": "2020-2023", "description": "Description"}],
  "certifications": ["certification1"],
  "languages": ["Français", "Anglais"]
}`
        },
        { role: "user", content: `Analyse ce CV :\n\n${cvText.substring(0, 8000)}` }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "cv_extraction",
          strict: true,
          schema: {
            type: "object",
            properties: {
              currentRole: { type: ["string", "null"] },
              company: { type: ["string", "null"] },
              yearsExperience: { type: ["number", "null"] },
              industries: { type: "array", items: { type: "string" } },
              skills: { type: "array", items: { type: "string" } },
              education: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    degree: { type: "string" },
                    field: { type: "string" },
                    institution: { type: "string" },
                    year: { type: ["number", "null"] }
                  },
                  required: ["degree", "field", "institution"],
                  additionalProperties: false
                }
              },
              experiences: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    company: { type: "string" },
                    duration: { type: "string" },
                    description: { type: ["string", "null"] }
                  },
                  required: ["title", "company", "duration"],
                  additionalProperties: false
                }
              },
              certifications: { type: "array", items: { type: "string" } },
              languages: { type: "array", items: { type: "string" } }
            },
            required: ["industries", "skills", "education", "experiences", "certifications", "languages"],
            additionalProperties: false
          }
        }
      }
    });

    const messageContent = response.choices[0]?.message?.content;
    const content = typeof messageContent === 'string' ? messageContent : '';
    if (!content) {
      return { success: false, error: "Pas de réponse du LLM", confidence: 0 };
    }

    const extracted = JSON.parse(content);
    const profile: ProfessionalProfile = {
      currentRole: extracted.currentRole || undefined,
      company: extracted.company || undefined,
      yearsExperience: extracted.yearsExperience || undefined,
      industries: extracted.industries || [],
      skills: extracted.skills || [],
      education: extracted.education || [],
      experiences: extracted.experiences || [],
      certifications: extracted.certifications || [],
      languages: extracted.languages || [],
      source: 'cv',
      lastUpdated: new Date().toISOString()
    };

    // Calculer la confiance
    let confidence = 0;
    if (profile.currentRole) confidence += 15;
    if (profile.company) confidence += 10;
    if (profile.skills.length >= 5) confidence += 20;
    else if (profile.skills.length > 0) confidence += 10;
    if (profile.education.length > 0) confidence += 15;
    if (profile.experiences.length >= 2) confidence += 15;
    else if (profile.experiences.length > 0) confidence += 8;
    if (profile.languages.length > 0) confidence += 5;
    if (profile.yearsExperience) confidence += 10;

    return { success: true, profile, confidence: Math.min(95, confidence) };
  } catch (error) {
    console.error("[ProfessionalProfile] Extraction error:", error);
    return {
      success: false,
      error: `Erreur lors de l'extraction: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      confidence: 0
    };
  }
}

export function calculateProfileCompleteness(profile: ProfessionalProfile | null): number {
  if (!profile) return 0;
  let score = 0;
  if (profile.currentRole) score += 15;
  if (profile.company) score += 10;
  if (profile.yearsExperience) score += 10;
  if (profile.industries.length > 0) score += 10;
  if (profile.skills.length >= 3) score += 20;
  else if (profile.skills.length > 0) score += 10;
  if (profile.education.length > 0) score += 15;
  if (profile.experiences.length > 0) score += 15;
  if (profile.languages.length > 0) score += 5;
  return Math.round(score);
}
