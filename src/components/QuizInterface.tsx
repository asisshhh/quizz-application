
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Question, QuizAttempt, UserAnswer } from '@/types/quiz';
import { ArrowLeft, Clock, CheckSquare, Square } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

interface QuizInterfaceProps {
  questions: Question[];
  onComplete: (attempt: QuizAttempt) => void;
  onBack: () => void;
}

const QuizInterface: React.FC<QuizInterfaceProps> = ({ questions, onComplete, onBack }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(10800); // 3 hours
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const [startTime] = useState(new Date());

  // Shuffle options for each question
  const shuffleOptions = (question: Question): Question => {
    const optionIndexMap = question.options.map((_, index) => index);
    const shuffledIndexMap = [...optionIndexMap].sort(() => Math.random() - 0.5);
    
    const shuffledOptions = shuffledIndexMap.map(index => question.options[index]);
    const newCorrectAnswers = question.correctAnswers.map(correctIndex => 
      shuffledIndexMap.indexOf(correctIndex)
    );

    return {
      ...question,
      options: shuffledOptions,
      correctAnswers: newCorrectAnswers
    };
  };

  useEffect(() => {
    const shuffled = questions.map(shuffleOptions);
    setShuffledQuestions(shuffled);
    setUserAnswers(shuffled.map(q => ({ questionId: q.id, selectedAnswers: [] })));
  }, [questions]);

  useEffect(() => {
    if (!timerEnabled || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, timerEnabled]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: string, optionIndex: number, isMultiple: boolean) => {
    setUserAnswers(prev => 
      prev.map(answer => {
        if (answer.questionId === questionId) {
          if (isMultiple) {
            const newAnswers = answer.selectedAnswers.includes(optionIndex)
              ? answer.selectedAnswers.filter(index => index !== optionIndex)
              : [...answer.selectedAnswers, optionIndex];
            return { ...answer, selectedAnswers: newAnswers };
          } else {
            return { ...answer, selectedAnswers: [optionIndex] };
          }
        }
        return answer;
      })
    );
  };

  const calculateScore = () => {
    let correctAnswers = 0;
    
    shuffledQuestions.forEach(question => {
      const userAnswer = userAnswers.find(answer => answer.questionId === question.id);
      if (userAnswer) {
        const userSelected = [...userAnswer.selectedAnswers].sort();
        const correctSelected = [...question.correctAnswers].sort();
        
        if (JSON.stringify(userSelected) === JSON.stringify(correctSelected)) {
          correctAnswers++;
        }
      }
    });

    return correctAnswers;
  };

  const handleSubmitQuiz = () => {
    const score = calculateScore();
    const endTime = new Date();
    const timeSpent = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    const attempt: QuizAttempt = {
      questions: shuffledQuestions,
      userAnswers,
      score,
      totalQuestions: shuffledQuestions.length,
      completedAt: endTime,
      timeSpent
    };

    onComplete(attempt);
  };

  const getCurrentAnswer = (questionId: string) => {
    return userAnswers.find(answer => answer.questionId === questionId)?.selectedAnswers || [];
  };

  const isAnswered = (questionId: string) => {
    const answer = userAnswers.find(answer => answer.questionId === questionId);
    return answer && answer.selectedAnswers.length > 0;
  };

  const getAnsweredCount = () => {
    return userAnswers.filter(answer => answer.selectedAnswers.length > 0).length;
  };

  if (shuffledQuestions.length === 0) {
    return <div>Loading...</div>;
  }

  const progress = (getAnsweredCount() / shuffledQuestions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
              <ArrowLeft size={20} />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-gray-800">Quiz</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {timerEnabled && (
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow">
                <Clock size={20} className={timeRemaining < 60 ? 'text-red-500' : 'text-blue-500'} />
                <span className={`font-mono ${timeRemaining < 60 ? 'text-red-500' : 'text-gray-700'}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            )}
            
            <Button
              variant="outline"
              onClick={() => setShowAllQuestions(!showAllQuestions)}
            >
              {showAllQuestions ? 'One at a Time' : 'Show All'}
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              Progress: {getAnsweredCount()} of {shuffledQuestions.length} answered
            </span>
            <span className="text-sm text-gray-600">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {showAllQuestions ? (
          <div className="space-y-6">
            {shuffledQuestions.map((question, index) => (
              <Card key={question.id} className={`${isAnswered(question.id) ? 'ring-2 ring-green-200' : ''}`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Question {index + 1}</span>
                    <span className={`text-sm px-2 py-1 rounded ${
                      question.type === 'single' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {question.type === 'single' ? 'Single Answer' : 'Multiple Answers'}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg mb-4">{question.question}</p>
                  <div className="space-y-3">
                    {question.options.map((option, optionIndex) => (
                      <label
                        key={optionIndex}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type={question.type === 'single' ? 'radio' : 'checkbox'}
                          name={`question_${question.id}`}
                          checked={getCurrentAnswer(question.id).includes(optionIndex)}
                          onChange={() => handleAnswerChange(question.id, optionIndex, question.type === 'multiple')}
                          className="w-4 h-4"
                        />
                        <span className="flex-1">{option}</span>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <div className="text-center">
              <Button
                onClick={handleSubmitQuiz}
                size="lg"
                className="bg-green-600 hover:bg-green-700 px-8"
                disabled={getAnsweredCount() === 0}
              >
                Submit Quiz ({getAnsweredCount()}/{shuffledQuestions.length} answered)
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <Card className={`${isAnswered(shuffledQuestions[currentQuestionIndex].id) ? 'ring-2 ring-green-200' : ''}`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Question {currentQuestionIndex + 1} of {shuffledQuestions.length}</span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    shuffledQuestions[currentQuestionIndex].type === 'single' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {shuffledQuestions[currentQuestionIndex].type === 'single' ? 'Single Answer' : 'Multiple Answers'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg mb-6">{shuffledQuestions[currentQuestionIndex].question}</p>
                <div className="space-y-3">
                  {shuffledQuestions[currentQuestionIndex].options.map((option, optionIndex) => (
                    <label
                      key={optionIndex}
                      className="flex items-center gap-3 p-4 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type={shuffledQuestions[currentQuestionIndex].type === 'single' ? 'radio' : 'checkbox'}
                        name={`question_${shuffledQuestions[currentQuestionIndex].id}`}
                        checked={getCurrentAnswer(shuffledQuestions[currentQuestionIndex].id).includes(optionIndex)}
                        onChange={() => handleAnswerChange(shuffledQuestions[currentQuestionIndex].id, optionIndex, shuffledQuestions[currentQuestionIndex].type === 'multiple')}
                        className="w-4 h-4"
                      />
                      <span className="flex-1 text-lg">{option}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>

              <div className="flex gap-2">
                {shuffledQuestions.map((_, index) => (
                  <button
                    key={index}
                    className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                      index === currentQuestionIndex
                        ? 'bg-blue-600 text-white'
                        : isAnswered(shuffledQuestions[index].id)
                        ? 'bg-green-200 text-green-800'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                    onClick={() => setCurrentQuestionIndex(index)}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              {currentQuestionIndex === shuffledQuestions.length - 1 ? (
                <Button
                  onClick={handleSubmitQuiz}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={getAnsweredCount() === 0}
                >
                  Submit Quiz
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentQuestionIndex(Math.min(shuffledQuestions.length - 1, currentQuestionIndex + 1))}
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizInterface;
