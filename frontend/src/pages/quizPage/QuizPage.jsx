import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api';
import Card from '../../components/Card';
import { useAuth } from '../../context/AuthContext';

const QuizPage = () => {
  const { id } = useParams(); // quiz id
  const { user } = useAuth();
  const [quiz, setQuiz] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseQuizzes, setCourseQuizzes] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  // FIXED: Filter courses by user's batch (Intern) or trainerId (Trainer)
  const fetchCourses = async () => {
    try {
      const res = await api.get('/courses');
      let filteredCourses = res.data.courses || [];

      // INTERN: Only show batch courses
      if (user?.role === 'Intern') {
        const internBatchId = user?.batchId?._id || user?.batchId;
        filteredCourses = filteredCourses.filter(course => 
          course.batchId?._id === internBatchId || 
          course.batchId === internBatchId
        );
        console.log('Intern filtered courses:', filteredCourses.length);
      }
      // TRAINER: Only show their courses
      else if (user?.role === 'TRAINER') {
        const trainerId = user?._id || user?.id;
        filteredCourses = filteredCourses.filter(course => 
          course.trainerId?._id === trainerId || 
          course.trainerId === trainerId
        );
        console.log('🔄 Trainer filtered courses:', filteredCourses.length);
      }
      // HR: See all courses

      setCourses(filteredCourses);
    } catch (err) {
      console.error("Failed to load courses:", err);
      setCourses([]);
    }
  };

  // Fetch quizzes for a specific course
  const fetchCourseQuizzes = async (courseId) => {
    try {
      const res = await api.get(`/courses/${courseId}/quizzes`);
      setCourseQuizzes(res.data.quizzes || []);
    } catch (err) {
      console.error("Failed to load quizzes:", err);
      setCourseQuizzes([]);
    }
  };

  // Load initial quiz if direct access via URL
  useEffect(() => {
    const loadInitialQuiz = async () => {
      if (id) {
        try {
          setLoading(true);
          const res = await api.get(`/courses/quiz/${id}`);
          const quizData = res.data.quiz;
          setQuiz(quizData);
          
          // Auto-select course and load its quizzes
          const courseId = quizData.courseId?._id || quizData.courseId;
          if (courseId) {
            setSelectedCourse(courseId);
            await fetchCourseQuizzes(courseId);
          }
        } catch (err) {
          console.error("Failed to load quiz:", err);
          setQuiz(null);
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadInitialQuiz();
  }, [id]);

  // Load courses once on mount
  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCourseSelect = async (courseId) => {
    setSelectedCourse(courseId);
    await fetchCourseQuizzes(courseId);
    setQuiz(null); // Clear current quiz
    setResult(null);
    setAnswers({});
  };

  const handleQuizSelect = async (quizId) => {
    try {
      const res = await api.get(`/courses/quiz/${quizId}`);
      setQuiz(res.data.quiz);
      setResult(null);
      setAnswers({});
    } catch (err) {
      console.error("Failed to load quiz:", err);
      setQuiz(null);
    }
  };

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
      const res = await api.post(`/courses/quiz/${quiz._id}/submit`, payload);
      setResult(res.data.submission);
    } catch (e) {
      alert(e.response?.data?.msg || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading while initial quiz loads
  if (loading && !quiz) {
    return <div className="flex items-center justify-center min-h-screen"><p>Loading quiz...</p></div>;
  }

  return (
    <div className="flex gap-6 p-6 bg-gray-50 min-h-screen">
      {/* Sidebar - Role-filtered courses */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-20'} bg-white border-r border-gray-200 rounded-lg shadow-sm p-4 transition-all duration-300 overflow-y-auto max-h-[calc(100vh-2rem)]`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`${sidebarOpen ? 'block' : 'hidden'} text-lg font-bold text-primary`}>
            {user?.role === 'Intern' ? 'Your Batch Modules' : 
             user?.role === 'TRAINER' ? 'My Courses' : 'All Modules'}
          </h2>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
            title={sidebarOpen ? 'Collapse' : 'Expand'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
            </svg>
          </button>
        </div>

        <div className="space-y-2">
          {courses.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">{user?.role === 'Intern' ? 'No courses in your batch' : 'No courses available'}</p>
          ) : (
            courses.map((course) => (
              <div key={course._id} className="mb-4">
                <button
                  onClick={() => handleCourseSelect(course._id)}
                  className={`w-full text-left px-4 py-2 rounded-lg font-bold transition-all ${
                    selectedCourse === course._id
                      ? 'bg-primary text-white shadow-md'
                      : 'text-gray-900 bg-gray-100 hover:bg-gray-200 hover:shadow-sm'
                  }`}
                >
                  {sidebarOpen ? (
                    <span>{course.title || course.name}</span> 
                  ) : (
                    <span title={course.title || course.name}>📚</span>
                  )}
                </button>

                {sidebarOpen && selectedCourse === course._id && courseQuizzes.length > 0 && (
                  <div className="mt-2 ml-4 space-y-1 border-l-2 border-primary/30 pl-3">
                    {courseQuizzes.map((q) => (
                      <button
                        key={q._id}
                        onClick={() => handleQuizSelect(q._id)}
                        className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                          quiz?._id === q._id
                            ? 'bg-primary/10 text-primary font-semibold border border-primary/20'
                            : 'text-gray-700 hover:bg-primary/5 hover:text-primary'
                        }`}
                      >
                        <span className="truncate block">Quiz</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {quiz && !result ? (
          <Card>
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-2">
                Module: <span className="font-semibold text-primary">
                  {courses.find(c => c._id === selectedCourse)?.title || 
                   courses.find(c => c._id === quiz.courseId?._id)?.title || 'Unknown'}
                </span>
              </p>
              <h1 className="text-3xl font-bold mb-2 text-primary">{quiz.title}</h1>
              <p className="text-gray-600">{quiz.description}</p>
            </div>

            <div className="space-y-6 mb-8">
              {quiz.questions?.map((q, qIndex) => (
                <div key={qIndex} className="border-l-4 border-primary pl-4 py-2">
                  <h3 className="font-semibold mb-3 text-lg text-gray-800">
                    {qIndex + 1}. {q.question || q.questionText}
                  </h3>
                  <div className="space-y-2">
                    {(q.options || []).map((opt, optIdx) => (
                      <label key={optIdx} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-primary/5 rounded transition-colors">
                        <input
                          type="radio"
                          name={`question-${qIndex}`}
                          value={optIdx}
                          checked={answers[qIndex] === optIdx}
                          onChange={() => handleChange(qIndex, optIdx)}
                          className="w-4 h-4 text-primary border-primary/50 cursor-pointer focus:ring-primary"
                        />
                        <span className="text-gray-800">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || Object.keys(answers).length === 0}
              className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed border-0"
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          </Card>
        ) : result ? (
          <Card>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Quiz Submitted!</h2>
              <div className="text-6xl font-bold bg-primary/10 text-primary p-4 rounded-2xl inline-block mb-4">
                {result.correctAnswers}/{result.totalQuestions}
              </div>
              <p className="text-xl text-primary font-bold mb-2">Score: {result.percentage}%</p>
              <p className="text-gray-600 mb-8">{result.feedback || result.message}</p>
              <button
                onClick={() => {
                  setResult(null);
                  setAnswers({});
                  setQuiz(null);
                }}
                className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all border-0"
              >
                Select Another Quiz
              </button>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-primary/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">Select a Quiz</h2>
              <p className="text-gray-500">Choose a module and quiz from the sidebar to get started</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default QuizPage;
