import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initializer for Gemini client
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Crisis / Emergency keyword checker for safety
function detectCrisis(text: string): boolean {
  const crisisTerms = [
    'suicide', 'suicidal', 'kill myself', 'end my life', 'want to die', 
    'self harm', 'cutting myself', 'hopeless', 'no reason to live', 'overdose'
  ];
  const lower = text.toLowerCase();
  return crisisTerms.some(term => lower.includes(term));
}

// 1. Health Endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 2. AI Chatbot Endpoint
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, history, currentMood } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    if (detectCrisis(message)) {
      return res.json({
        crisisDetected: true,
        reply: "I am deeply concerned about what you're sharing. You don't have to go through this alone. Please connect with a professional or reach out to a crisis helpline immediately. Help is available 24/7 free and confidentially.",
        emergencyContacts: [
          { name: "988 Suicide & Crisis Lifeline", number: "988", note: "Call or text 24/7 (US & Canada)" },
          { name: "Crisis Text Line", number: "Text HOME to 741741", note: "24/7 free crisis support" },
          { name: "International Emergency Hotlines", url: "https://findahelpline.com/", note: "Global support directories" }
        ]
      });
    }

    const ai = getGeminiClient();
    
    // Format conversation context
    const systemInstruction = `You are MoodBite AI, a warm, compassionate, and evidence-informed Mental Wellness and Nutrition Assistant.
Your goal is to offer empathetic conversation, active listening, stress relief techniques, and gentle science-backed nutrition suggestions that support emotional well-being.
Current User Mood Context: ${currentMood || 'Not specified'}.

Guidelines:
1. Be warm, non-judgmental, concise, and deeply supportive.
2. If appropriate, gently mention how nutrients (like Magnesium for calm, Complex Carbs for serotonin, Omega-3 for mood) can support emotional balance.
3. Keep responses structured, easy to read, with occasional supportive bullet points or markdown formatting.
4. If user asks for recipes or food suggestions, tailor them to comfort and nourish.`;

    // Reconstruct conversation history if provided
    const formattedHistory = Array.isArray(history) 
      ? history.slice(-6).map((item: { sender: string; text: string }) => ({
          role: item.sender === 'user' ? 'user' : 'model',
          parts: [{ text: item.text }]
        }))
      : [];

    const contents = [
      ...formattedHistory,
      { role: 'user', parts: [{ text: message }] }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: contents as any,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || "I'm here for you. How else can I support your wellness today?";

    res.json({
      crisisDetected: false,
      reply,
      suggestedFollowUps: [
        "What foods can boost my energy right now?",
        "Can you guide me through a 1-minute breathing exercise?",
        "Why do I feel anxious after eating certain foods?",
        "Give me a healthy recipe for my current mood."
      ]
    });

  } catch (error: any) {
    console.error('Error in /api/ai/chat:', error);
    res.status(500).json({ 
      error: 'Failed to generate AI chat response.',
      message: error.message || 'Unknown server error' 
    });
  }
});

// 3. AI Food Recommendation Endpoint
app.post('/api/ai/recommend-food', async (req, res) => {
  try {
    const { mood, preference, allergies, budget } = req.body;

    const ai = getGeminiClient();

    const prompt = `Generate a comprehensive, scientifically-backed 1-day mood-boosting meal plan for someone with:
- Current Mood: ${mood || 'Stressed'}
- Dietary Preference: ${preference || 'Vegetarian'}
- Allergies/Restrictions: ${allergies || 'None'}
- Budget Level: ${budget || 'Moderate'}

Explain the neuro-chemical relationship between these foods and mood improvement (e.g., serotonin synthesis, blood sugar stabilization, gut-brain axis, cortisol reduction).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING, description: "Catchy title for this mood meal plan" },
            moodSummary: { type: Type.STRING, description: "Brief explanation of how nutrition aids this mood" },
            mealPlan: {
              type: Type.OBJECT,
              properties: {
                breakfast: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    prepTime: { type: Type.STRING },
                    keyNutrients: { type: Type.ARRAY, items: { type: Type.STRING } },
                    moodBenefit: { type: Type.STRING }
                  },
                  required: ["title", "description", "prepTime", "keyNutrients", "moodBenefit"]
                },
                lunch: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    prepTime: { type: Type.STRING },
                    keyNutrients: { type: Type.ARRAY, items: { type: Type.STRING } },
                    moodBenefit: { type: Type.STRING }
                  },
                  required: ["title", "description", "prepTime", "keyNutrients", "moodBenefit"]
                },
                dinner: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    prepTime: { type: Type.STRING },
                    keyNutrients: { type: Type.ARRAY, items: { type: Type.STRING } },
                    moodBenefit: { type: Type.STRING }
                  },
                  required: ["title", "description", "prepTime", "keyNutrients", "moodBenefit"]
                },
                snack: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    prepTime: { type: Type.STRING },
                    keyNutrients: { type: Type.ARRAY, items: { type: Type.STRING } },
                    moodBenefit: { type: Type.STRING }
                  },
                  required: ["title", "description", "prepTime", "keyNutrients", "moodBenefit"]
                }
              },
              required: ["breakfast", "lunch", "dinner", "snack"]
            },
            keyNutrientsFocus: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  benefit: { type: Type.STRING },
                  sources: { type: Type.STRING }
                },
                required: ["name", "benefit", "sources"]
              }
            },
            hydrationAdvice: { type: Type.STRING },
            scienceInsight: { type: Type.STRING }
          },
          required: ["headline", "moodSummary", "mealPlan", "keyNutrientsFocus", "hydrationAdvice", "scienceInsight"]
        }
      }
    });

    const data = JSON.parse(response.text || '{}');
    res.json({ success: true, recommendation: data });

  } catch (error: any) {
    console.error('Error in /api/ai/recommend-food:', error);
    res.status(500).json({ 
      error: 'Failed to generate food recommendations.',
      message: error.message || 'Unknown server error'
    });
  }
});

// 4. AI Wellness Coach Endpoint (Daily Routine Routine & Affirmation)
app.post('/api/ai/wellness-coach', async (req, res) => {
  try {
    const { primaryGoal, moodState } = req.body;

    const ai = getGeminiClient();

    const prompt = `Design a tailored 1-day holistic mental wellness routine for someone whose goal is "${primaryGoal || 'Reduce Stress & Boost Energy'}" and current mood state is "${moodState || 'Slightly Overwhelmed'}".`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dailyTheme: { type: Type.STRING },
            affirmation: { type: Type.STRING },
            morning: {
              type: Type.OBJECT,
              properties: {
                activity: { type: Type.STRING },
                meditationMin: { type: Type.NUMBER },
                nutritionTip: { type: Type.STRING },
                exerciseTip: { type: Type.STRING }
              },
              required: ["activity", "meditationMin", "nutritionTip", "exerciseTip"]
            },
            afternoon: {
              type: Type.OBJECT,
              properties: {
                activity: { type: Type.STRING },
                mindfulnessTip: { type: Type.STRING },
                snackSuggestion: { type: Type.STRING },
                musicGenre: { type: Type.STRING }
              },
              required: ["activity", "mindfulnessTip", "snackSuggestion", "musicGenre"]
            },
            evening: {
              type: Type.OBJECT,
              properties: {
                windDownRoutine: { type: Type.STRING },
                journalPrompt: { type: Type.STRING },
                bedtimeTea: { type: Type.STRING },
                digitalDetoxTime: { type: Type.STRING }
              },
              required: ["windDownRoutine", "journalPrompt", "bedtimeTea", "digitalDetoxTime"]
            }
          },
          required: ["dailyTheme", "affirmation", "morning", "afternoon", "evening"]
        }
      }
    });

    const data = JSON.parse(response.text || '{}');
    res.json({ success: true, plan: data });

  } catch (error: any) {
    console.error('Error in /api/ai/wellness-coach:', error);
    res.status(500).json({ error: 'Failed to generate wellness routine.' });
  }
});

// 5. AI Journal Analyzer Endpoint
app.post('/api/ai/analyze-mood-entry', async (req, res) => {
  try {
    const { journalText } = req.body;
    if (!journalText) {
      return res.status(400).json({ error: 'Journal text is required.' });
    }

    if (detectCrisis(journalText)) {
      return res.json({
        crisisDetected: true,
        sentiment: 'High Distress',
        score: 15,
        summary: 'Immediate empathetic support needed.',
        advice: 'Please connect with a professional or crisis hotline immediately.'
      });
    }

    const ai = getGeminiClient();

    const prompt = `Analyze this mental wellness journal entry: "${journalText}". Return JSON analysis.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            primaryEmotion: { type: Type.STRING },
            moodScore: { type: Type.NUMBER, description: "Scale 0-100 where 100 is blissful and 0 is severe despair" },
            detectedTriggers: { type: Type.ARRAY, items: { type: Type.STRING } },
            positiveInsights: { type: Type.STRING },
            actionableRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendedFoodNutrients: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["primaryEmotion", "moodScore", "detectedTriggers", "positiveInsights", "actionableRecommendations", "recommendedFoodNutrients"]
        }
      }
    });

    const data = JSON.parse(response.text || '{}');
    res.json({ success: true, analysis: data });

  } catch (error: any) {
    console.error('Error in /api/ai/analyze-mood-entry:', error);
    res.status(500).json({ error: 'Failed to analyze journal entry.' });
  }
});

// 6. Gemini TTS Endpoint for Voice Audio Output
app.post('/api/ai/speech-tts', async (req, res) => {
  try {
    const { text, voiceName } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required for TTS.' });
    }

    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text: text.slice(0, 300) }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      res.json({ success: true, audioBase64: base64Audio });
    } else {
      res.status(500).json({ error: 'No audio data received.' });
    }
  } catch (error: any) {
    console.error('Error in /api/ai/speech-tts:', error);
    res.status(500).json({ error: 'Failed to generate speech audio.' });
  }
});

// Vite Middleware & Static Serving Setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MoodBite Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
