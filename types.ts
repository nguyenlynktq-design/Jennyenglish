
export type QuizDifficulty = 'Easy' | 'Medium' | 'Hard';

// ===== VOCABULARY LEVEL (A1/A2/B1) =====
export type VocabularyLevel = 'A1' | 'A2' | 'B1';

export interface VocabularyItem {
  word: string;
  emoji: string;
  ipa: string;
  meaning: string;
  example: string;
  sentenceMeaning: string;
  type: string;
}

export interface GrammarSection {
  topic: string;
  explanation: string;
  examples: string[];
}

export interface ListeningQ {
  id: string;
  audioText: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface MultipleChoiceQ {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface SpeakingQ {
  id: string;
  question: string;
  suggestedAnswer: string;
}

export interface ScrambleQ {
  id: string;
  scrambled: string[];
  correctSentence: string;
  translation: string;
}

export interface FillInputQ {
  id: string;
  question: string;
  correctAnswer: string;
  clueEmoji: string;
}

// ===== NEW EXERCISE TYPES FOR 50-QUESTION MEGA CHALLENGE =====

// 1. Sentence Rewriting (5 questions)
export interface RewriteQ {
  id: string;
  type: 'rewrite';
  original_sentence: string;
  instruction: string;
  hint_sample?: string; // Optional hint
  rewritten_correct: string;
  allowed_variants?: string[];
  explanation_vi: string;
  level: VocabularyLevel;
}

// 2. Reading Comprehension MCQ (5 questions based on passage 1)
export interface ReadingMCQ {
  id: string;
  type: 'reading_mcq';
  question_text: string;
  choices: [string, string, string]; // A, B, C
  correct_choice: 'A' | 'B' | 'C';
  explanation_vi: string;
}

// 3. True/False Reading (5 questions based on passage 2)
export interface TrueFalseQ {
  id: string;
  type: 'true_false';
  statement: string;
  correct_answer: boolean; // true or false
  explanation_vi: string;
}

// 4. Fill-blank with Word Box (1 paragraph with 5 blanks)
export interface FillBlankBoxQ {
  paragraph: string; // Paragraph with blanks marked as (1) ____, (2) ____, etc.
  paragraph_translation: string; // Vietnamese translation
  word_box: string[]; // 6-8 words to choose from (includes distractors)
  blanks: {
    number: number; // 1, 2, 3, 4, 5
    correct_answer: string;
  }[];
}

// Combined 50-question test structure
export interface MegaTest50 {
  level: VocabularyLevel;

  // Reading passages (2 passages)
  passage_reading_mcq: string; // For Reading MCQ
  passage_reading_mcq_translation: string;
  passage_true_false: string; // For True/False
  passage_true_false_translation: string;

  // Exercise types (50 total)
  multipleChoice: MultipleChoiceQ[]; // 10 questions
  fillBlank: FillInputQ[];           // 10 questions
  scramble: ScrambleQ[];             // 10 questions
  rewrite: RewriteQ[];               // 5 questions
  readingMCQ: ReadingMCQ[];          // 5 questions  
  trueFalse: TrueFalseQ[];           // 5 questions
  fillBlankBox: FillBlankBoxQ;        // 1 paragraph with 5 blanks
}

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface ReadingAdventure {
  title: string;
  passage: string;
  translation: string;
  comprehension: MultipleChoiceQ[];
}

export interface HomeworkTask {
  title: string;
  description: string;
  instructions: string;
}

export interface PracticeContent {
  listening: ListeningQ[];
  megaTest: MegaTest50;
}

export interface LessonPlan {
  topic: string;
  level: VocabularyLevel;
  vocabulary: VocabularyItem[];
  grammar: GrammarSection;
  reading: ReadingAdventure;
  homework: HomeworkTask;
  practice: PracticeContent;
  teacherTips: string;
}

export enum AppMode {
  ANALYSIS = 'analysis',
  CREATIVE = 'creative'
}

export interface MindMapData {
  center: {
    title_en: string;
    title_vi: string;
    emoji?: string;
  };
  nodes: Array<{
    text_en: string;
    text_vi: string;
    emoji?: string;
    color?: string;
  }>;
}

export enum MindMapMode {
  TOPIC = 'TOPIC',
  TEXT = 'TEXT',
  IMAGE = 'IMAGE'
}

export interface FillBlankQuestion {
  sentence: string;
  answer: string;
  options: string[];
  explanation?: string;
}

export interface ContentResult {
  storyEnglish: string;
  translatedText: string;
  writingPromptEn: string;
  writingPromptVi: string;
  vocabulary: VocabularyItem[];
  imagePrompt: string;
  comprehensionQuestions: MultipleChoiceQ[];
  speakingQuestions: SpeakingQ[];
}

export interface PresentationScript {
  introduction: { english: string; vietnamese: string; };
  body: Array<{ keyword: string; script: string; }>;
  conclusion: { english: string; vietnamese: string; };
}

export interface SpeechEvaluation {
  scores: {
    pronunciation: number;
  };
  overallScore: number;
  feedback: string;
}

export enum LoadingStep {
  IDLE = 'Idle',
  ANALYZING = 'Analyzing content...',
  GENERATING_IMAGE = 'Generating magic image...',
  GENERATING_AUDIO = 'Creating Mrs. Dung\'s voice...',
  COMPLETED = 'Completed!'
}

export interface CharacterProfile {
  id: string;
  name: string;
  emoji: string;
  promptContext: string;
  stylePrompt: string;
  colorClass: string;
}

export type ImageRatio = '1:1' | '16:9' | '9:16';

export interface AppState {
  selectedCharacter: CharacterProfile;
  selectedMode: AppMode;
  selectedRatio: ImageRatio;
  customPrompt: string;
  originalImages: string[];
  generatedImage: string | null;
  audioUrl: string | null;
  contentResult: ContentResult | null;
  isLoading: boolean;
  loadingStep: LoadingStep;
  error: string | null;
}
