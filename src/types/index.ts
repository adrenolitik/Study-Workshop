export interface SourcePage {
  pageNumber: number;
  text: string;
}

export interface SummarySection {
  id: string;
  heading: string;
  content: string;
  keyPoints: string[];
  sourceCitation: string;
  sourcePage?: number;
}

export interface KeyTerm {
  term: string;
  definition: string;
  sourceCitation: string;
  sourcePage?: number;
}

export interface KitSummary {
  title: string;
  brief: string;
  sections: SummarySection[];
  keyTerms: KeyTerm[];
  mustRemember: string[];
  generatedAt: string;
}

export interface KitPodcast {
  script: string;
  originalScript: string;
  isEdited: boolean;
  audioUrl?: string;
  durationSeconds?: number;
  audioStatus: 'not_generated' | 'generating' | 'ready' | 'failed';
  generatedAt?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  sourceCitation: string;
  sourcePage?: number;
  topicTag?: string;
}

export interface QuizAttempt {
  id: string;
  date: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  userAnswers: Record<string, number>;
}

export interface KitQuiz {
  questions: QuizQuestion[];
  attempts: QuizAttempt[];
  generatedAt: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  topic?: string;
  sourceCitation: string;
  sourcePage?: number;
  status: 'unseen' | 'known' | 'repeat';
}

export interface KitFlashcards {
  cards: Flashcard[];
  generatedAt: string;
}

export interface ChatCitation {
  page?: number;
  excerpt: string;
  label: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  citations?: ChatCitation[];
}

export interface KitSource {
  fileName?: string;
  fileType: 'pdf' | 'txt' | 'text';
  charCount: number;
  pageCount: number;
  rawText: string;
  pages: SourcePage[];
  extractedAt: string;
}

export type ProcessingStatus = 
  | 'extracting' 
  | 'waiting_confirmation' 
  | 'generating' 
  | 'partially_ready' 
  | 'ready' 
  | 'error';

export interface StudyKit {
  id: string;
  userId: string;
  title: string;
  subject?: string;
  section?: string;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt: string;
  status: ProcessingStatus;
  statusMessage?: string;
  source: KitSource;
  summary?: KitSummary;
  podcast?: KitPodcast;
  quiz?: KitQuiz;
  flashcards?: KitFlashcards;
  chatMessages: ChatMessage[];
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'admin';
  createdAt: string;
  quotas: {
    kitsCreated: number;
    kitsLimit: number;
    audioGenerations: number;
    audioLimit: number;
    chatQueriesToday: number;
    chatLimit: number;
  };
}

export interface BackgroundTask {
  id: string;
  kitId: string;
  kitTitle: string;
  taskType: 'summary' | 'podcast' | 'quiz' | 'flashcards' | 'audio' | 'full';
  status: 'in_progress' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  error?: string;
}

export interface SystemErrorLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  source: string;
  message: string;
  details?: string;
}

export interface AdminSystemSettings {
  maxKitsPerUser: number;
  maxAudioGenerations: number;
  maxChatQueriesPerDay: number;
  maxRegenerationsPerDay: number;
}
