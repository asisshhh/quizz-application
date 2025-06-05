
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Question } from '@/types/quiz';
import { ArrowLeft, Plus, Trash2, Eye, Upload } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

interface QuizCreatorProps {
  questions: Question[];
  setQuestions: (questions: Question[]) => void;
  onBack: () => void;
}

const QuizCreator: React.FC<QuizCreatorProps> = ({ questions, setQuestions, onBack }) => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  const parseQuestionText = (text: string): Question | null => {
    const lines = text.trim().split('\n').filter(line => line.trim() !== '');
    
    if (lines.length < 4) {
      return null;
    }

    // Find question text (skip question number line if present)
    let questionStartIndex = 0;
    let questionText = '';
    
    // Look for the main question text (may span multiple lines until we hit options)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip question number line
      if (line.match(/^Question\s+\d+/i)) {
        continue;
      }
      
      // If we hit an option line (A. B. C. etc.), stop collecting question text
      if (line.match(/^[A-Z]\.\s/)) {
        break;
      }
      
      // If we hit an answer line, stop collecting question text
      if (line.match(/^Answer\s+[A-Z]/i)) {
        break;
      }
      
      // Add to question text
      if (questionText) {
        questionText += ' ' + line;
      } else {
        questionText = line;
        questionStartIndex = i;
      }
    }

    if (!questionText) {
      return null;
    }

    // Find options (A. B. C. etc.)
    const options: string[] = [];
    let answerLine = '';
    
    for (let i = questionStartIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if this is an answer line
      if (line.match(/^Answer\s+[A-Z]/i)) {
        answerLine = line;
        break;
      }
      
      // Check if this is an option line
      const optionMatch = line.match(/^([A-Z])\.\s*(.+)$/);
      if (optionMatch) {
        options.push(optionMatch[2].trim());
      }
    }

    if (options.length < 2) {
      return null;
    }

    if (!answerLine) {
      return null;
    }

    // Parse correct answers from answer line
    const answerMatch = answerLine.match(/^Answer\s+([A-Z\s]+)/i);
    if (!answerMatch) {
      return null;
    }

    const answerLetters = answerMatch[1].trim().split(/\s+/);
    const correctAnswers: number[] = [];
    
    for (const letter of answerLetters) {
      const index = letter.charCodeAt(0) - 65; // Convert A=0, B=1, etc.
      if (index >= 0 && index < options.length) {
        correctAnswers.push(index);
      }
    }

    if (correctAnswers.length === 0) {
      return null;
    }

    return {
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      question: questionText,
      options,
      correctAnswers,
      type: correctAnswers.length === 1 ? 'single' : 'multiple'
    };
  };

  const splitIntoQuestions = (text: string): string[] => {
    const questionSections: string[] = [];
    const lines = text.split('\n');
    let currentQuestion = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if this line starts a new question
      if (line.match(/^Question\s+\d+/i) && currentQuestion.trim() !== '') {
        questionSections.push(currentQuestion.trim());
        currentQuestion = line + '\n';
      } else {
        currentQuestion += line + '\n';
      }
    }
    
    // Add the last question
    if (currentQuestion.trim() !== '') {
      questionSections.push(currentQuestion.trim());
    }
    
    return questionSections;
  };

  const handleBulkAddQuestions = async () => {
    if (!inputText.trim()) {
      toast({
        title: "No Input",
        description: "Please paste your questions first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);

    const questionSections = splitIntoQuestions(inputText);
    const newQuestions: Question[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < questionSections.length; i++) {
      const section = questionSections[i];
      setProcessingProgress(((i + 1) / questionSections.length) * 100);

      if (questions.length + newQuestions.length >= 80) {
        toast({
          title: "Maximum Questions Reached",
          description: "You can add up to 80 questions per quiz. Stopping at question limit.",
          variant: "destructive",
        });
        break;
      }

      const parsedQuestion = parseQuestionText(section);
      if (parsedQuestion) {
        newQuestions.push(parsedQuestion);
        successCount++;
      } else {
        errorCount++;
        console.log(`Failed to parse question section ${i + 1}:`, section);
      }

      // Add a small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    setQuestions([...questions, ...newQuestions]);
    setInputText('');
    setIsProcessing(false);
    setProcessingProgress(0);

    if (successCount > 0) {
      toast({
        title: "Questions Added Successfully",
        description: `Added ${successCount} questions successfully! ${errorCount > 0 ? `${errorCount} questions failed to parse.` : ''} Total: ${questions.length + successCount}/80`,
      });
    } else {
      toast({
        title: "No Questions Added",
        description: "Could not parse any questions. Please check the format.",
        variant: "destructive",
      });
    }
  };

  const handleAddQuestion = () => {
    if (questions.length >= 80) {
      toast({
        title: "Maximum Questions Reached",
        description: "You can add up to 80 questions per quiz.",
        variant: "destructive",
      });
      return;
    }

    const parsedQuestion = parseQuestionText(inputText);
    if (parsedQuestion) {
      setQuestions([...questions, parsedQuestion]);
      setInputText('');
      toast({
        title: "Question Added",
        description: `Added ${parsedQuestion.type} answer question successfully! (${questions.length + 1}/80)`,
      });
    } else {
      toast({
        title: "Invalid Format",
        description: "Please check the question format and try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
    toast({
      title: "Question Deleted",
      description: "Question removed from quiz.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft size={20} />
            Back to Home
          </Button>
          <h1 className="text-3xl font-bold text-gray-800">Quiz Creator</h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Plus size={24} />
                  Add Questions
                </span>
                <span className="text-sm font-normal text-gray-600">
                  {questions.length}/80 questions
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Questions and Options</label>
                  <Textarea
                    placeholder={`Paste all your questions here! Format for each question:

Question 1 
Why would you enter your working hours using Cross-Application Time Sheet (CATS)? Note: There are 3 correct answers to this question 
A. To record overtime 
B. To request absence 
C. To confirm activities 
D. To maintain absence 
E. To plan time 
Answer A C E
...continue with all 80 questions...`}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="h-64 resize-none"
                    disabled={isProcessing}
                  />
                </div>
                
                <div className="text-sm text-gray-700 bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <strong className="text-blue-800">Format Instructions:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-blue-700">
                    <li><strong>Question Number:</strong> "Question X" line (required for bulk import)</li>
                    <li><strong>Question Text:</strong> Your question (can span multiple lines)</li>
                    <li><strong>Options:</strong> A. Option 1, B. Option 2, etc.</li>
                    <li><strong>Answers:</strong> "Answer A C E" (space-separated letters)</li>
                    <li><strong>Bulk Import:</strong> Paste all 80 questions at once</li>
                  </ul>
                </div>

                {isProcessing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Processing questions...</span>
                      <span>{Math.round(processingProgress)}%</span>
                    </div>
                    <Progress value={processingProgress} className="h-2" />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    onClick={handleBulkAddQuestions} 
                    disabled={!inputText.trim() || questions.length >= 80 || isProcessing}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    <Upload size={16} className="mr-2" />
                    {isProcessing ? 'Processing...' : 'Add All Questions'}
                  </Button>
                  
                  <Button 
                    onClick={handleAddQuestion} 
                    disabled={!inputText.trim() || questions.length >= 80 || isProcessing}
                    variant="outline"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Add Single
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Eye size={24} />
                  Quiz Preview
                </span>
                <span className="text-sm font-normal text-gray-600">
                  {questions.length} {questions.length === 1 ? 'question' : 'questions'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {questions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Plus size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No questions added yet</p>
                  <p className="text-sm">Paste all 80 questions or add them one by one</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {questions.map((question, index) => (
                    <div key={question.id} className="border rounded-lg p-4 bg-white">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 mb-2">
                            {index + 1}. {question.question}
                          </h4>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`inline-block px-2 py-1 text-xs rounded ${
                              question.type === 'single' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {question.type === 'single' ? 'Single Answer' : 'Multiple Answers'}
                            </span>
                            <span className="text-xs text-gray-600">
                              {question.correctAnswers.length} correct answer{question.correctAnswers.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteQuestion(index)}
                          className="text-red-600 hover:bg-red-50 ml-2"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => (
                          <div 
                            key={optionIndex} 
                            className={`p-2 rounded text-sm ${
                              question.correctAnswers.includes(optionIndex)
                                ? 'bg-green-50 text-green-800 font-medium border border-green-200'
                                : 'bg-gray-50'
                            }`}
                          >
                            <span className="font-medium text-gray-600 mr-2">
                              {String.fromCharCode(65 + optionIndex)}.
                            </span>
                            {question.correctAnswers.includes(optionIndex) ? '✓ ' : ''}
                            {option}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QuizCreator;
