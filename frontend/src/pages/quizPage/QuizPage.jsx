import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api';
import Card from '../../components/Card';

const QuizPage = () => {
  const { id } = useParams(); // quiz id
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    api
      .get(`/courses/quiz/${id}`)
      .then((res) => {
        setQuiz(res.data.quiz);
      })
      .catch(() => {
        setQuiz(null);
      });
  }, [id]);

  const handleChange = (qIndex, optionIndex) => {
    setAnswers((prev) => ({ ...prev, [qIndex]: optionIndex }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    const payload = {
      answers: Object.entries(answers).map(([qIndex, optIdx]) => ({
        questionIndex: Number(qIndex),
        selectedOptionIndex: optIdx
      }))
    };
    setSubmitting(true);
    try {
      const res = await api.post(`/courses/quiz/${id}/submit`, payload);
      setResult(res.data.submission);
    } catch (e) {
      alert(e.response?.data?.msg || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  if (!quiz) {
    return <p className="text-sm text-slate-500">Loading quiz…</p>;
  }

  return (
    <div className="space-y-4">
      <Card
        title={quiz.title || 'Quiz'}
        subtitle={quiz.courseId?.title || 'Course quiz'}
      >
        <div className="space-y-4">
          {quiz.questions.map((q, qIndex) => (
            <div
              key={qIndex}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <p className="text-xs font-medium text-slate-800">
                Q{qIndex + 1}. {q.question}
              </p>
              <div className="mt-2 grid gap-2">
                {q.options.map((opt, oIndex) => (
                  <label
                    key={oIndex}
                    className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs ${
                      answers[qIndex] === oIndex
                        ? 'border-primary bg-primary/5 text-slate-900'
                        : 'border-slate-200 bg-slate-50 hover:border-primary/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${qIndex}`}
                      className="h-3 w-3"
                      checked={answers[qIndex] === oIndex}
                      onChange={() => handleChange(qIndex, oIndex)}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            Answer all questions and click Submit.
          </p>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary/90 disabled:opacity-70"
          >
            {submitting ? 'Submitting…' : 'Submit quiz'}
          </button>
        </div>
        {result && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
            <p className="font-semibold text-slate-800">
              Result: {result.status?.toUpperCase()}
            </p>
            <p className="mt-1">
              Score: {result.correctAnswers}/{result.totalQuestions} (
              {result.percentage}%)
            </p>
            <p className="mt-1 text-slate-600">{result.feedback}</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default QuizPage;
