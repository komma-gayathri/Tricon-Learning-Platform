import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import Card from '../components/Card';

const QuizPreview = () => {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setError('');
        const res = await api.get(`/courses/quiz/${id}`);
        setQuiz(res.data.quiz);
      } catch (e) {
        console.error(e);
        setError(e.response?.data?.msg || 'Failed to load quiz');
        setQuiz(null);
      }
    };
    fetchQuiz();
  }, [id]);

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!quiz) {
    return <p className="text-sm text-slate-500">Loading quiz…</p>;
  }

  return (
    <div className="space-y-4">
      <Card
        title={quiz.title || 'Quiz (preview)'}
        subtitle={quiz.courseId?.title || 'Course quiz'}
      >
        <div className="space-y-4">
          {Array.isArray(quiz.questions) && quiz.questions.length > 0 ? (
            quiz.questions.map((q, qIndex) => (
              <div
                key={qIndex}
                className="rounded-lg border border-slate-200 bg-white p-4"
              >
                <p className="text-xs font-medium text-slate-800">
                  Q{qIndex + 1}. {q?.question || 'Question not available'}
                </p>
                <ul className="mt-2 space-y-1 text-xs text-slate-700">
                  {Array.isArray(q?.options) ? (
                    q.options.map((opt, oIndex) => (
                      <li
                        key={oIndex}
                        className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
                      >
                        {opt}
                      </li>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">No options available</p>
                  )}
                </ul>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500 p-4 italic">
              This quiz has no questions yet.
            </p>
          )}
        </div>
        <p className="mt-4 text-[11px] text-slate-500">
          Preview only. Trainers cannot submit answers from this page.
        </p>
      </Card>
    </div>
  );
};

export default QuizPreview;
