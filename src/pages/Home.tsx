import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { showNotification } from '../lib/notifications';
import QuestionCard from '../components/QuestionCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import { MessageSquare } from 'lucide-react';

interface Question {
  id: string;
  title: string;
  content: string;
  video_url: string | null;
  created_at: string;
  user: {
    email: string;
  };
  answers: Answer[];
}

interface Answer {
  id: string;
  content: string;
  upvotes: number;
  created_at: string;
  user: {
    email: string;
  };
}

const Home = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [answeringQuestion, setAnsweringQuestion] = useState<string | null>(null);

  useEffect(() => {
    loadQuestions();
    subscribeToQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          user:users(email),
          answers:answers(
            *,
            user:users(email)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestions(data || []);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToQuestions = () => {
    const subscription = supabase
      .channel('questions_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'questions' }, loadQuestions)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'answers' }, loadQuestions)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const handleAnswerSubmit = async (questionId: string) => {
    try {
      const { data: answer, error } = await supabase
        .from('answers')
        .insert({
          question_id: questionId,
          user_id: user?.id,
          content: newAnswer,
        })
        .select(`
          *,
          question:questions(
            user_id,
            title
          )
        `)
        .single();

      if (error) throw error;

      if (answer?.question?.user_id) {
        showNotification(
          'New Answer',
          `Someone answered your question: ${answer.question.title}`
        );
      }

      setNewAnswer('');
      setAnsweringQuestion(null);
      loadQuestions();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleUpvote = async (answerId: string, questionTitle: string) => {
    try {
      const { error } = await supabase.rpc('increment_upvotes', {
        answer_id: answerId
      });

      if (error) throw error;

      showNotification(
        'Answer Upvoted',
        `Your answer to "${questionTitle}" received an upvote!`
      );

      loadQuestions();
    } catch (error: any) {
      setError(error.message);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Questions</h1>
        {user && (
          <Link
            to="/ask"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <MessageSquare className="h-5 w-5 mr-2" />
            Ask a Question
          </Link>
        )}
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="space-y-6">
        {questions.length === 0 ? (
          <EmptyState
            message="No questions yet"
            submessage="Be the first to ask a question!"
          />
        ) : (
          questions.map((question) => (
            <QuestionCard
              key={question.id}
              {...question}
              onAnswer={setAnsweringQuestion}
              onUpvote={handleUpvote}
            />
          ))
        )}
      </div>

      {answeringQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-semibold mb-4">Add Your Answer</h3>
            <textarea
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              placeholder="Write your answer..."
            />
            <div className="flex justify-end mt-4 space-x-2">
              <button
                onClick={() => setAnsweringQuestion(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAnswerSubmit(answeringQuestion)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Submit Answer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;