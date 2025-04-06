import React from 'react';
import { MessageSquare, ThumbsUp, Clock, User, Video } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Answer {
  id: string;
  content: string;
  upvotes: number;
  created_at: string;
  user: {
    email: string;
  };
}

interface QuestionProps {
  id: string;
  title: string;
  content: string;
  video_url: string | null;
  created_at: string;
  user: {
    email: string;
  };
  answers: Answer[];
  onAnswer: (questionId: string) => void;
  onUpvote: (answerId: string, questionTitle: string, authorEmail: string) => void;
}

const QuestionCard: React.FC<QuestionProps> = ({
  id,
  title,
  content,
  video_url,
  created_at,
  user,
  answers,
  onAnswer,
  onUpvote,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 transition-all hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600">
            <Link to={`/question/${id}`}>{title}</Link>
          </h2>
          <p className="text-gray-600 mb-4 line-clamp-3">{content}</p>
          
          {video_url && (
            <div className="mb-4">
              <div className="flex items-center text-blue-600 mb-2">
                <Video className="h-5 w-5 mr-2" />
                <span>Video Attachment</span>
              </div>
              <video
                controls
                className="w-full rounded-lg max-h-96 object-cover"
                src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/${video_url}`}
              />
            </div>
          )}

          <div className="flex items-center text-sm text-gray-500 space-x-4">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-1" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              <span>{new Date(created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center">
              <MessageSquare className="h-4 w-4 mr-1" />
              <span>{answers.length} answers</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="space-y-4">
          {answers.slice(0, 2).map((answer) => (
            <div
              key={answer.id}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200"
            >
              <p className="text-gray-800 mb-3 line-clamp-2">{answer.content}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-500">
                  <User className="h-4 w-4 mr-1" />
                  <span>{answer.user.email}</span>
                </div>
                <button
                  onClick={() => onUpvote(answer.id, title, answer.user.email)}
                  className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <ThumbsUp className="h-5 w-5 mr-1" />
                  <span>{answer.upvotes}</span>
                </button>
              </div>
            </div>
          ))}
          {answers.length > 2 && (
            <Link
              to={`/question/${id}`}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              View all {answers.length} answers
            </Link>
          )}
        </div>

        <button
          onClick={() => onAnswer(id)}
          className="mt-4 text-blue-600 hover:text-blue-700 flex items-center text-sm font-medium"
        >
          <MessageSquare className="h-5 w-5 mr-2" />
          Add Answer
        </button>
      </div>
    </div>
  );
};

export default QuestionCard;