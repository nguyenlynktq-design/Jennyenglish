
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { LessonPlan, MindMapData, MindMapMode, PresentationScript, ContentResult, CharacterProfile, AppMode, ImageRatio, SpeechEvaluation, VocabularyLevel, MegaTest50 } from "../types";
import { FIXED_PASSAGES } from "../utils/fixedPassages";

// ===== API KEY MANAGEMENT =====
// Priority: localStorage > environment variable
const API_KEY_STORAGE = 'mrs_dung_api_key';
const MODEL_STORAGE = 'mrs_dung_selected_model';

// Model fallback order as per AI_INSTRUCTIONS.md
// Default: gemini-3-pro-preview
// Fallback: gemini-3-flash-preview → gemini-3-pro-preview → gemini-2.5-flash
export const AVAILABLE_MODELS = [
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', isDefault: true },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
];

export const getApiKey = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(API_KEY_STORAGE);
  }
  return null;
};

export const setApiKey = (key: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(API_KEY_STORAGE, key);
  }
};

export const getSelectedModel = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(MODEL_STORAGE) || AVAILABLE_MODELS[0].id;
  }
  return AVAILABLE_MODELS[0].id;
};

export const setSelectedModel = (modelId: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MODEL_STORAGE, modelId);
  }
};

export const hasApiKey = (): boolean => {
  return !!getApiKey();
};

// Create AI instance with API key from localStorage
const getAI = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('API_KEY_REQUIRED: Vui lòng nhập API key để sử dụng ứng dụng');
  }
  return new GoogleGenAI({ apiKey });
};

// Retry with model fallback
export const callWithFallback = async <T>(
  fn: (model: string) => Promise<T>,
  startModelIndex: number = 0
): Promise<T> => {
  const models = AVAILABLE_MODELS.slice(startModelIndex);
  let lastError: Error | null = null;

  for (const model of models) {
    try {
      return await fn(model.id);
    } catch (error: any) {
      lastError = error;
      console.warn(`Model ${model.id} failed, trying next...`, error.message);
      // Continue to next model
    }
  }

  // All models failed
  throw lastError || new Error('Tất cả các model đều thất bại');
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
};

// ===== TTS SYSTEM: Mobile-First with IMMEDIATE Playback =====
// Uses Web Speech API with SYNCHRONOUS speak() for mobile compatibility
// CRITICAL: On Android, speak() MUST be called synchronously in the click handler

let currentUtterance: SpeechSynthesisUtterance | null = null;
let cachedVoice: SpeechSynthesisVoice | null = null;
let ttsInitialized = false;

// Get voices SYNCHRONOUSLY - do not await
const getVoicesSync = (): SpeechSynthesisVoice[] => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  return window.speechSynthesis.getVoices();
};

// Get the best English voice from available voices
const getBestVoice = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
  if (cachedVoice && voices.includes(cachedVoice)) return cachedVoice;
  if (!voices || voices.length === 0) return null;

  // Priority: Google > Microsoft > Native English
  const priorities = [
    (v: SpeechSynthesisVoice) => v.name.includes('Google') && v.lang.startsWith('en'),
    (v: SpeechSynthesisVoice) => v.name.includes('Microsoft') && v.lang.startsWith('en'),
    (v: SpeechSynthesisVoice) => v.lang === 'en-US',
    (v: SpeechSynthesisVoice) => v.lang.startsWith('en'),
  ];

  for (const check of priorities) {
    const voice = voices.find(check);
    if (voice) {
      cachedVoice = voice;
      return voice;
    }
  }

  cachedVoice = voices[0];
  return voices[0];
};

// Pre-load voices in background (non-blocking)
const preloadVoices = () => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  // Try to get voices immediately
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    getBestVoice(voices); // Cache the best voice
    return;
  }

  // Listen for voices to become available
  window.speechSynthesis.onvoiceschanged = () => {
    const v = window.speechSynthesis.getVoices();
    if (v.length > 0) {
      getBestVoice(v); // Cache the best voice
    }
  };
};

// Initialize TTS - call this on first user interaction (e.g., page touch)
export const initTTSOnUserInteraction = (): void => {
  if (ttsInitialized) return;
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  ttsInitialized = true;

  // Warm up the speech synthesis engine with a silent utterance
  // This tricks mobile browsers into allowing future speech
  try {
    const warmup = new SpeechSynthesisUtterance('');
    warmup.volume = 0;
    warmup.rate = 10; // Fast to complete quickly
    window.speechSynthesis.speak(warmup);
    window.speechSynthesis.cancel(); // Cancel immediately
  } catch (e) {
    // Ignore errors during warmup
  }

  // Pre-cache voices
  preloadVoices();
};

// Pre-load voices on page load
if (typeof window !== 'undefined' && window.speechSynthesis) {
  preloadVoices();

  // Also try to init on first touch/click anywhere
  const initOnInteraction = () => {
    initTTSOnUserInteraction();
    document.removeEventListener('touchstart', initOnInteraction);
    document.removeEventListener('click', initOnInteraction);
  };
  document.addEventListener('touchstart', initOnInteraction, { passive: true });
  document.addEventListener('click', initOnInteraction, { passive: true });
}

// Main TTS function - FULLY SYNCHRONOUS for mobile compatibility
// NO AWAITS before speak() - this is critical for Android
export const playGeminiTTS = (text: string): void => {
  // Check availability
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn('Speech synthesis not available');
    return;
  }

  // Clean text - keep only speakable characters
  const cleanText = text.trim().replace(/[^\w\s.,!?'"-]/g, '');
  if (!cleanText) return;

  // CRITICAL: Cancel any existing speech FIRST
  window.speechSynthesis.cancel();
  currentUtterance = null;

  // Create utterance IMMEDIATELY - no delays
  try {
    const utterance = new SpeechSynthesisUtterance(cleanText);
    currentUtterance = utterance;

    // Get voices synchronously - use cached or whatever is available
    const voices = getVoicesSync();
    const voice = getBestVoice(voices);
    if (voice) {
      utterance.voice = voice;
    }

    // Settings for clear pronunciation
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Event handlers
    utterance.onend = () => {
      currentUtterance = null;
    };

    utterance.onerror = (e) => {
      // Don't log 'interrupted' errors - they're normal when canceling
      if (e.error !== 'interrupted') {
        console.warn('TTS error:', e.error);
      }
      currentUtterance = null;
    };

    // SPEAK IMMEDIATELY - NO DELAYS!
    window.speechSynthesis.speak(utterance);

    // Mobile Chrome/Safari fix: resume if browser pauses speech
    // Check every 100ms and resume if paused
    let resumeAttempts = 0;
    const mobileResumeFix = setInterval(() => {
      resumeAttempts++;

      // Stop checking after speech ends or 30 seconds
      if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
        clearInterval(mobileResumeFix);
        return;
      }

      if (resumeAttempts > 300) { // 30 seconds max
        clearInterval(mobileResumeFix);
        currentUtterance = null;
        return;
      }

      // Resume if paused (happens on some Android devices)
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }, 100);

  } catch (e) {
    console.error('TTS Error:', e);
  }
};

// Stop any playing audio
export const stopTTS = () => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  currentUtterance = null;
};

// Optional: Gemini TTS for high-quality audio (can be used as enhancement)
export const generateAudioFromContent = async (text: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' }
        }
      }
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
};

export const generateLessonPlan = async (topicInput?: string, textInput?: string, images: string[] = [], level: VocabularyLevel = 'A1'): Promise<LessonPlan> => {
  const ai = getAI();
  const imageParts = images.map(data => ({ inlineData: { data, mimeType: 'image/jpeg' } }));

  // Get fixed passage for the selected level
  const fixedPassage = FIXED_PASSAGES[level];

  const prompt = `MRS. DUNG AI - EXPERT PEDAGOGY MODE (CHUYÊN GIA TIẾNG ANH).
  TASK: Analyze the provided content and create a 50-QUESTION MEGATEST.
  
  ===== 📚 VOCABULARY LEVEL: ${level} =====
  
  🚨 CRITICAL: TEST STRUCTURE (EXACTLY 50 QUESTIONS) 🚨
  1. Sentence Rewriting: 40 questions - "Viết lại câu sao cho nghĩa không đổi"
  2. Reading Comprehension: 5 questions - Based on fixed passage
  3. Pronunciation Odd-One-Out: 5 questions - "Chọn từ có phần gạch chân phát âm khác"

  ===== 📝 FIXED READING PASSAGE FOR LEVEL ${level} =====
  Use this passage for the 5 Reading Comprehension questions:
  
  Title: "${fixedPassage.title}"
  "${fixedPassage.passage}"
  Translation: "${fixedPassage.translation}"
  
  ===== 📝 EXERCISE SPECIFICATIONS =====
  
  Extract vocabulary and grammar from source for REWRITE questions.
  
  1️⃣ SENTENCE REWRITING (40 questions) - "Viết lại câu sao cho nghĩa không đổi"
  Each question must include:
  - id: "rewrite_1" to "rewrite_40"
  - type: "rewrite"
  - original_sentence: The original English sentence
  - instruction: "Rewrite the sentence so that it means the same."
  - hint_sample: A helpful hint (e.g., "Start with: There is..." or "Use: because")
  - rewritten_correct: The correct rewritten sentence
  - allowed_variants: Array of acceptable alternative answers (optional)
  - explanation_vi: Vietnamese explanation of why the rewrite works
  - level: "${level}"
  
  REWRITE RULES:
  ✓ Use vocabulary and grammar from the input source
  ✓ Meaning must remain IDENTICAL (paraphrase only)
  ✓ Grammar must be 100% correct in both sentences
  ✓ Hint must be helpful but NOT reveal the full answer
  ✓ Use ${level}-appropriate structures
  
  2️⃣ READING COMPREHENSION (5 questions) - Based on fixed passage above
  Each question must include:
  - id: "reading_1" to "reading_5"
  - type: "reading_mcq"
  - question_text: Question about the passage
  - choices: Array of exactly 3 strings ["Answer A", "Answer B", "Answer C"]
  - correct_choice: "A" or "B" or "C"
  - explanation_vi: Vietnamese explanation
  - level: "${level}"
  
  READING RULES:
  ✓ Questions must be answerable ONLY from the passage text
  ✓ Mix of factual, inference, and vocabulary questions
  ✓ Distribute correct answers across A, B, C (not all the same)
  ✓ Wrong choices must be plausible (not obviously wrong)
  
  3️⃣ PRONUNCIATION ODD-ONE-OUT (5 questions) - "Chọn từ có phần gạch chân phát âm khác"
  Each question must include:
  - id: "pron_1" to "pron_5"
  - type: "pronunciation_mcq"
  - instruction: "Choose the word with a different sound."
  - choices: Array of 3 objects [{word, underlined}] where underlined part differs in pronunciation
  - correct_choice: "A" or "B" or "C" - the word with different pronunciation
  - explanation_vi: Vietnamese explanation of phonetic difference
  - level: "${level}"
  
  PRONUNCIATION EXAMPLES:
  - /e/ vs /iː/: head (̱e̱a = /e/) vs read (̱e̱a = /iː/)
  - /ʊ/ vs /uː/: good (̱o̱o = /ʊ/) vs food (̱o̱o = /uː/)
  - /s/ vs /z/: books (̱s̱ = /s/) vs dogs (̱s̱ = /z/)
  - /t/ vs /d/ vs /ɪd/: walked (̱eḏ = /t/) vs played (̱eḏ = /d/) vs wanted (̱eḏ = /ɪd/)
  
  PRONUNCIATION RULES:
  ✓ The underlined grapheme MUST exist in each word
  ✓ Exactly 1 word has different pronunciation
  ✓ Explanation must state which sounds differ (IPA)
  
  ===== ✅ MEGTEST OUTPUT FORMAT =====
  
  The megaTest object MUST include:
  {
    "level": "${level}",
    "passage": "${fixedPassage.passage}",
    "passage_translation": "${fixedPassage.translation}",
    "rewrite": [... 40 RewriteQ objects ...],
    "reading": [... 5 ReadingMCQ objects ...],
    "pronunciation": [... 5 PronunciationMCQ objects ...]
  }
  
  ===== VOCABULARY & GRAMMAR =====
  
  Extract ALL vocabulary from source exactly as provided.
  Grammar explanation must be in Vietnamese.
  
  ===== FINAL VALIDATION =====
  Before output, verify:
  ☐ Exactly 40 rewrite questions with valid hint_sample
  ☐ Exactly 5 reading questions based on fixed passage
  ☐ Exactly 5 pronunciation questions with underlined graphemes
  ☐ All grammar is 100% correct
  ☐ All explanations are in Vietnamese
  
  OUTPUT: Return valid JSON matching the schema.
  Do NOT include any text outside the JSON.`;

  const inputParts: any[] = [];
  if (textInput) inputParts.push({ text: `SOURCE TEXT: \n${textInput}` });
  if (topicInput) inputParts.push({ text: `TOPIC FOCUS: \n${topicInput} ` });
  inputParts.push(...imageParts);
  inputParts.push({ text: prompt });

  // Use fallback mechanism - automatically retry with next model if current fails
  return callWithFallback(async (modelId: string) => {
    console.log(`🤖 Đang thử với model: ${modelId}`);
    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts: inputParts },
      config: { responseMimeType: "application/json", responseSchema: lessonSchema }
    });
    return safeJsonParse<LessonPlan>(response.text);
  });
};



export const analyzeImageAndCreateContent = async (images: string[], mimeType: string, char: CharacterProfile, mode: AppMode, customPrompt?: string, topic?: string, text?: string): Promise<ContentResult> => {
  const ai = getAI();
  const imageParts = images.map(data => ({ inlineData: { data, mimeType } }));
  const prompt = `MRS.DUNG AI - CREATIVE STORYTELLER.
  
  Analyze the input and create:
1. A magical story featuring ${char.name}.
2. EXACTLY 10 Comprehension Quiz questions.
  3. EXACTLY 10 Speaking interaction prompts.
  4. A SCIENTIFIC WRITING PROMPT for the student in BOTH English and Vietnamese.
  
  Source material: Topic: ${topic || "N/A"}, Text: ${text || "N/A"}.
  Character context: ${char.promptContext}.`;

  const response = await ai.models.generateContent({
    model: getSelectedModel(),
    contents: { parts: [...imageParts, { text: prompt }] },
    config: { responseMimeType: "application/json", responseSchema: contentResultSchema }
  });
  return safeJsonParse<ContentResult>(response.text);
};

const safeJsonParse = <T>(text: string): T => {
  try {
    let cleanText = text.trim().replace(/^```(?: json) ?\s * /i, '').replace(/\s * ```$/i, '');
    const start = Math.min(cleanText.indexOf('{') === -1 ? Infinity : cleanText.indexOf('{'), cleanText.indexOf('[') === -1 ? Infinity : cleanText.indexOf('['));
    const end = Math.max(cleanText.lastIndexOf('}'), cleanText.lastIndexOf(']'));
    if (start !== Infinity && end !== -1) cleanText = cleanText.substring(start, end + 1);
    return JSON.parse(cleanText) as T;
  } catch (e) { throw new Error("Lỗi xử lý dữ liệu AI."); }
};

const lessonSchema = {
  type: Type.OBJECT,
  properties: {
    topic: { type: Type.STRING },
    level: { type: Type.STRING },
    vocabulary: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { word: { type: Type.STRING }, emoji: { type: Type.STRING }, ipa: { type: Type.STRING }, meaning: { type: Type.STRING }, example: { type: Type.STRING }, sentenceMeaning: { type: Type.STRING }, type: { type: Type.STRING } }, required: ["word", "ipa", "meaning", "example", "type", "emoji"] } },
    grammar: { type: Type.OBJECT, properties: { topic: { type: Type.STRING }, explanation: { type: Type.STRING }, examples: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["topic", "explanation", "examples"] },
    reading: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, passage: { type: Type.STRING }, translation: { type: Type.STRING }, comprehension: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correctAnswer: { type: Type.INTEGER }, explanation: { type: Type.STRING } }, required: ["id", "question", "options", "correctAnswer"] } } }, required: ["title", "passage", "translation", "comprehension"] },
    practice: {
      type: Type.OBJECT,
      properties: {
        listening: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, audioText: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correctAnswer: { type: Type.INTEGER }, explanation: { type: Type.STRING } }, required: ["id", "audioText", "options", "correctAnswer"] } },
        megaTest: {
          type: Type.OBJECT,
          properties: {
            level: { type: Type.STRING },
            passage: { type: Type.STRING },
            passage_translation: { type: Type.STRING },
            rewrite: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, type: { type: Type.STRING }, original_sentence: { type: Type.STRING }, instruction: { type: Type.STRING }, hint_sample: { type: Type.STRING }, rewritten_correct: { type: Type.STRING }, allowed_variants: { type: Type.ARRAY, items: { type: Type.STRING } }, explanation_vi: { type: Type.STRING }, level: { type: Type.STRING } }, required: ["id", "original_sentence", "hint_sample", "rewritten_correct", "explanation_vi", "level"] } },
            reading: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, type: { type: Type.STRING }, question_text: { type: Type.STRING }, choices: { type: Type.ARRAY, items: { type: Type.STRING } }, correct_choice: { type: Type.STRING }, explanation_vi: { type: Type.STRING }, level: { type: Type.STRING } }, required: ["id", "question_text", "choices", "correct_choice", "explanation_vi", "level"] } },
            pronunciation: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, type: { type: Type.STRING }, instruction: { type: Type.STRING }, choices: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { word: { type: Type.STRING }, underlined: { type: Type.STRING } } } }, correct_choice: { type: Type.STRING }, explanation_vi: { type: Type.STRING }, level: { type: Type.STRING } }, required: ["id", "instruction", "choices", "correct_choice", "explanation_vi", "level"] } }
          },
          required: ["level", "passage", "rewrite", "reading", "pronunciation"]
        }
      },
      required: ["listening", "megaTest"]
    },
    teacherTips: { type: Type.STRING }
  },
  required: ["topic", "level", "vocabulary", "grammar", "reading", "practice", "teacherTips"]
};


const contentResultSchema = {
  type: Type.OBJECT,
  properties: {
    storyEnglish: { type: Type.STRING },
    translatedText: { type: Type.STRING },
    writingPromptEn: { type: Type.STRING },
    writingPromptVi: { type: Type.STRING },
    vocabulary: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { word: { type: Type.STRING }, meaning: { type: Type.STRING }, emoji: { type: Type.STRING } } } },
    imagePrompt: { type: Type.STRING },
    comprehensionQuestions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correctAnswer: { type: Type.INTEGER }, explanation: { type: Type.STRING } } } },
    speakingQuestions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, question: { type: Type.STRING }, suggestedAnswer: { type: Type.STRING } } } }
  },
  required: ["storyEnglish", "translatedText", "writingPromptEn", "writingPromptVi", "vocabulary", "imagePrompt", "comprehensionQuestions", "speakingQuestions"]
};

export const generateMindMap = async (content: any, mode: MindMapMode): Promise<MindMapData> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Create a professional Mind Map following Tony Buzan's principles for: ${JSON.stringify(content)}. 
Structure: Root node is the main topic.Child nodes are key sub - concepts with emojis. 
    Output strictly in JSON format matching the schema.`,
    config: { responseMimeType: "application/json", responseSchema: mindMapSchema }
  });
  return safeJsonParse<MindMapData>(response.text);
};

export const evaluateSpeech = async (base64Audio: string): Promise<SpeechEvaluation> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts: [{ inlineData: { data: base64Audio, mimeType: 'audio/wav' } }, { text: "Evaluate the student's speaking performance on a scale of 0-10. Provide encouraging feedback in Vietnamese." }] },
    config: { responseMimeType: "application/json", responseSchema: speechEvaluationSchema }
  });
  return safeJsonParse<SpeechEvaluation>(response.text);
};

export const generateStoryImage = async (prompt: string, style: string, ratio: ImageRatio): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: `A high - quality educational illustration for kids: ${prompt}. Artistic Style: ${style}. High resolution, 8k, vibrant colors.` }] },
    config: { imageConfig: { aspectRatio: ratio } }
  });
  for (const part of response.candidates[0].content.parts) { if (part.inlineData) return `data: image / png; base64, ${part.inlineData.data} `; }
  throw new Error("Image generation failed");
};

export const correctWriting = async (userText: string, creativePrompt: string): Promise<any> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Evaluate and correct this student writing: "${userText}".The topic was: "${creativePrompt}".Provide a score(0 - 10), feedback, fixed text, and detailed error list.`,
    config: { responseMimeType: "application/json", responseSchema: writingCorrectionSchema }
  });
  return safeJsonParse<any>(response.text);
};

export const generatePresentation = async (data: MindMapData): Promise<PresentationScript> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Create a professional English presentation script for a student based on this Mind Map data: ${JSON.stringify(data)}. 
    Include a warm introduction, body sections for each node, and a polite conclusion. 
    Provide both English script and Vietnamese translation.`,
    config: { responseMimeType: "application/json", responseSchema: presentationSchema }
  });
  return safeJsonParse<PresentationScript>(response.text);
};

export const generateMindMapPrompt = async (content: any, mode: MindMapMode): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `TASK: Generate a single, highly detailed English prompt for drawing a professional Tony Buzan Mind Map using AI art tools (like Midjourney or DALL - E). 
    CONTENT SOURCE: ${JSON.stringify(content)}. 
    
    PROMPT SPECIFICATIONS:
- Style: 3D Organic Tony Buzan Mind Map, Pixar - style animation render.
    - Central Theme: A clear 3D icon representing the lesson topic at the center.
    - Branches: Curvy, organic, thick - to - thin colorful branches spreading outwards.
    - Elements: Floating keywords in English, cute 3D emojis / icons next to branches.
    - Environment: Clean bright studio background, 8k resolution, cinematic lighting, vibrant pedagogical colors.
    - Exclude: No text other than the keywords. 
    
    JUST PROVIDE THE RAW PROMPT STRING.`
  });
  return response.text;
};

const mindMapSchema = { type: Type.OBJECT, properties: { center: { type: Type.OBJECT, properties: { title_en: { type: Type.STRING }, title_vi: { type: Type.STRING }, emoji: { type: Type.STRING } } }, nodes: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { text_en: { type: Type.STRING }, text_vi: { type: Type.STRING }, emoji: { type: Type.STRING } } } } } };
const presentationSchema = { type: Type.OBJECT, properties: { introduction: { type: Type.OBJECT, properties: { english: { type: Type.STRING }, vietnamese: { type: Type.STRING } } }, body: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { keyword: { type: Type.STRING }, script: { type: Type.STRING } } } }, conclusion: { type: Type.OBJECT, properties: { english: { type: Type.STRING }, vietnamese: { type: Type.STRING } } } } };
const speechEvaluationSchema = { type: Type.OBJECT, properties: { scores: { type: Type.OBJECT, properties: { pronunciation: { type: Type.NUMBER } } }, overallScore: { type: Type.NUMBER }, feedback: { type: Type.STRING } } };
const writingCorrectionSchema = { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, feedback: { type: Type.STRING }, fixedText: { type: Type.STRING }, breakdown: { type: Type.OBJECT, properties: { vocabulary: { type: Type.NUMBER }, grammar: { type: Type.NUMBER } } }, errors: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { original: { type: Type.STRING }, fixed: { type: Type.STRING }, reason: { type: Type.STRING } } } }, suggestions: { type: Type.STRING } } };
