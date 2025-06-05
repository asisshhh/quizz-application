
export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswers: number[];
  type: 'single' | 'multiple';
}

export interface UserAnswer {
  questionId: string;
  selectedAnswers: number[];
}

export interface QuizAttempt {
  questions: Question[];
  userAnswers: UserAnswer[];
  score: number;
  totalQuestions: number;
  completedAt: Date;
  timeSpent?: number;
}
