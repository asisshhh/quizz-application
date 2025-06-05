
import React, { useState } from 'react';
import QuizCreator from '@/components/QuizCreator';
import QuizInterface from '@/components/QuizInterface';
import QuizResults from '@/components/QuizResults';
import { Question, QuizAttempt } from '@/types/quiz';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Plus, Play } from 'lucide-react';

const Index = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentView, setCurrentView] = useState<'home' | 'create' | 'quiz' | 'results'>('home');
  const [quizAttempt, setQuizAttempt] = useState<QuizAttempt | null>(null);

  const handleQuizComplete = (attempt: QuizAttempt) => {
    setQuizAttempt(attempt);
    setCurrentView('results');
  };

  const handleRetakeQuiz = () => {
    setQuizAttempt(null);
    setCurrentView('quiz');
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setQuizAttempt(null);
  };

  if (currentView === 'create') {
    return <QuizCreator questions={questions} setQuestions={setQuestions} onBack={handleBackToHome} />;
  }

  if (currentView === 'quiz') {
    return <QuizInterface questions={questions} onComplete={handleQuizComplete} onBack={handleBackToHome} />;
  }

  if (currentView === 'results') {
    return <QuizResults attempt={quizAttempt!} onRetake={handleRetakeQuiz} onBack={handleBackToHome} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-3">
            <BookOpen className="text-blue-600" size={48} />
            QuizMaster Pro
          </h1>
          <p className="text-xl text-gray-600">Create and take interactive quizzes with intelligent question detection</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => setCurrentView('create')}>
            <CardContent className="p-8 text-center">
              <Plus className="mx-auto mb-4 text-green-600 group-hover:scale-110 transition-transform" size={48} />
              <h2 className="text-2xl font-semibold mb-2">Create Quiz</h2>
              <p className="text-gray-600 mb-4">Add questions with automatic answer type detection</p>
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Start Creating
              </Button>
            </CardContent>
          </Card>

          <Card className={`hover:shadow-lg transition-shadow ${questions.length === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer group'}`} 
                onClick={() => questions.length > 0 && setCurrentView('quiz')}>
            <CardContent className="p-8 text-center">
              <Play className={`mx-auto mb-4 text-blue-600 ${questions.length > 0 ? 'group-hover:scale-110' : ''} transition-transform`} size={48} />
              <h2 className="text-2xl font-semibold mb-2">Take Quiz</h2>
              <p className="text-gray-600 mb-4">
                {questions.length === 0 ? 'Create questions first' : `${questions.length} questions ready`}
              </p>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700" 
                disabled={questions.length === 0}
              >
                Start Quiz
              </Button>
            </CardContent>
          </Card>
        </div>

        {questions.length > 0 && (
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Current Quiz Overview</h3>
              <div className="grid gap-2">
                {questions.map((question, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Question {index + 1}</span>
                    <span className="text-sm px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {question.type === 'single' ? 'Single Answer' : 'Multiple Answers'}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;
