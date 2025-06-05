
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QuizAttempt } from '@/types/quiz';
import { ArrowLeft, RotateCcw, Download, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface QuizResultsProps {
  attempt: QuizAttempt;
  onRetake: () => void;
  onBack: () => void;
}

const QuizResults: React.FC<QuizResultsProps> = ({ attempt, onRetake, onBack }) => {
  const [showDetails, setShowDetails] = useState(true);

  const getScorePercentage = () => {
    return Math.round((attempt.score / attempt.totalQuestions) * 100);
  };

  const getScoreGrade = () => {
    const percentage = getScorePercentage();
    if (percentage >= 90) return { grade: 'A+', color: 'text-green-600' };
    if (percentage >= 80) return { grade: 'A', color: 'text-green-600' };
    if (percentage >= 70) return { grade: 'B', color: 'text-blue-600' };
    if (percentage >= 60) return { grade: 'C', color: 'text-yellow-600' };
    return { grade: 'F', color: 'text-red-600' };
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isQuestionCorrect = (questionId: string) => {
    const question = attempt.questions.find(q => q.id === questionId);
    const userAnswer = attempt.userAnswers.find(a => a.questionId === questionId);
    
    if (!question || !userAnswer) return false;
    
    const userSelected = [...userAnswer.selectedAnswers].sort();
    const correctSelected = [...question.correctAnswers].sort();
    
    return JSON.stringify(userSelected) === JSON.stringify(correctSelected);
  };

  const exportResults = () => {
    const resultsData = {
      score: `${attempt.score}/${attempt.totalQuestions}`,
      percentage: `${getScorePercentage()}%`,
      grade: getScoreGrade().grade,
      timeSpent: attempt.timeSpent ? formatTime(attempt.timeSpent) : 'N/A',
      completedAt: attempt.completedAt.toLocaleDateString(),
      details: attempt.questions.map((question, index) => {
        const userAnswer = attempt.userAnswers.find(a => a.questionId === question.id);
        const isCorrect = isQuestionCorrect(question.id);
        
        return {
          question: question.question,
          userAnswers: userAnswer?.selectedAnswers.map(i => question.options[i]) || [],
          correctAnswers: question.correctAnswers.map(i => question.options[i]),
          isCorrect
        };
      })
    };

    const dataStr = JSON.stringify(resultsData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `quiz_results_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Results Exported",
      description: "Quiz results have been downloaded as JSON file.",
    });
  };

  const scoreGrade = getScoreGrade();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft size={20} />
            Back to Home
          </Button>
          <h1 className="text-3xl font-bold text-gray-800">Quiz Results</h1>
        </div>

        {/* Score Overview */}
        <Card className="mb-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="text-6xl font-bold mb-2 flex items-center justify-center gap-4">
                <span className={scoreGrade.color.replace('text-', 'text-white ')}>
                  {scoreGrade.grade}
                </span>
                <span>{getScorePercentage()}%</span>
              </div>
              <p className="text-xl mb-4">
                You scored {attempt.score} out of {attempt.totalQuestions} questions correctly
              </p>
              
              <div className="flex justify-center items-center gap-6 text-sm opacity-90">
                {attempt.timeSpent && (
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    <span>Time: {formatTime(attempt.timeSpent)}</span>
                  </div>
                )}
                <div>
                  Completed: {attempt.completedAt.toLocaleDateString()} at {attempt.completedAt.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6 justify-center">
          <Button onClick={onRetake} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
            <RotateCcw size={20} />
            Retake Quiz
          </Button>
          <Button variant="outline" onClick={exportResults} className="flex items-center gap-2">
            <Download size={20} />
            Export Results
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2"
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </Button>
        </div>

        {/* Detailed Results */}
        {showDetails && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Detailed Results</h2>
            
            {attempt.questions.map((question, index) => {
              const userAnswer = attempt.userAnswers.find(a => a.questionId === question.id);
              const isCorrect = isQuestionCorrect(question.id);
              
              return (
                <Card key={question.id} className={`${isCorrect ? 'ring-2 ring-green-200' : 'ring-2 ring-red-200'}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        {isCorrect ? (
                          <CheckCircle className="text-green-600" size={24} />
                        ) : (
                          <XCircle className="text-red-600" size={24} />
                        )}
                        Question {index + 1}
                        <span className={`text-sm px-2 py-1 rounded ${
                          isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      </span>
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
                    <p className="text-lg font-medium mb-4">{question.question}</p>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Your Answer(s):</h4>
                        <div className="space-y-2">
                          {userAnswer && userAnswer.selectedAnswers.length > 0 ? (
                            userAnswer.selectedAnswers.map(answerIndex => (
                              <div 
                                key={answerIndex}
                                className={`p-2 rounded text-sm ${
                                  question.correctAnswers.includes(answerIndex)
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {question.options[answerIndex]}
                              </div>
                            ))
                          ) : (
                            <div className="p-2 rounded text-sm bg-gray-100 text-gray-600">
                              No answer selected
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Correct Answer(s):</h4>
                        <div className="space-y-2">
                          {question.correctAnswers.map(correctIndex => (
                            <div 
                              key={correctIndex}
                              className="p-2 rounded text-sm bg-green-100 text-green-800"
                            >
                              {question.options[correctIndex]}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Summary Stats */}
        <Card className="mt-6 bg-gray-50">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Summary Statistics</h3>
            <div className="grid md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">{attempt.score}</div>
                <div className="text-sm text-gray-600">Correct</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{attempt.totalQuestions - attempt.score}</div>
                <div className="text-sm text-gray-600">Incorrect</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{getScorePercentage()}%</div>
                <div className="text-sm text-gray-600">Score</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{scoreGrade.grade}</div>
                <div className="text-sm text-gray-600">Grade</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuizResults;
