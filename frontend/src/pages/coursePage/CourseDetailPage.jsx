import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../../api";
import Card from "../../components/Card";
import { useAuth } from "../../context/AuthContext";

const CourseDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quizLoading, setQuizLoading] = useState(false);

  const isTrainer = user?.role === "TRAINER";

  useEffect(() => {
    const fetch = async () => {
      try {
        const [courseRes, quizRes] = await Promise.all([
          api.get(`/courses/${id}`),
          api.get(`/courses/${id}/quizzes`),
        ]);
        setCourse(courseRes.data.course);
        setQuizzes(quizRes.data.quizzes || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleGenerateQuiz = async () => {
    setQuizLoading(true);
    try {
      const res = await api.post(`/courses/${id}/generate-quiz`);
      setQuizzes((prev) => [...prev, res.data.quiz]);
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.msg || "Failed to generate quiz");
    } finally {
      setQuizLoading(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Loading course…</p>;
  }

  if (!course) {
    return <p className="text-sm text-red-600">Course not found.</p>;
  }

  const videoUrl = course.videoPath
    ? `http://localhost:5000/api/courses/${course._id}/download-video`
    : null;

  return (
    <div className="space-y-4">
      <Card
        title={course.title}
        subtitle={course.description}
        actions={
          <>
            {/* Preview button ONLY for trainers when quizzes exist */}
            {isTrainer && quizzes.length > 0 && (
              <button
                onClick={() => navigate(`/quiz/${quizzes[0]._id}/preview`)}
                className="rounded-full bg-emerald-500 hover:bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow-sm transition-colors"
              >
                 Preview Quiz ({quizzes.length})
              </button>
            )}
            
            {/* Generate button ONLY for trainers */}
            {isTrainer && (
              <button
                onClick={handleGenerateQuiz}
                disabled={quizLoading}
                className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-accent/90 disabled:opacity-70 transition-colors"
              >
                {quizLoading ? "Generating…" : "Generate AI Quiz"}
              </button>
            )}
            
            {/* Take Quiz button ONLY for interns */}
            {quizzes.length > 0 && user?.role === "Intern" && (
              <button
                onClick={() => navigate(`/quiz/${quizzes[0]._id}`)}
                className="rounded-full bg-primary px-2 py-1 text-xs font-medium text-white shadow-sm hover:bg-primary/90 transition-colors"
              >
                Take Quiz
              </button>
            )}
          </>
        }
      >
        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              <p>
                <span className="font-medium">Batch:</span>{" "}
                {course.batchId?.name}
              </p>
              <p>
                <span className="font-medium">Week:</span> {course.week}
              </p>
              <p>
                <span className="font-medium">Difficulty:</span>{" "}
                {course.difficulty || "N/A"}
              </p>
              <p>
                <span className="font-medium">Quizzes:</span>{" "}
                <span className="font-semibold text-emerald-600">{quizzes.length}</span>
              </p>
            </div>
            {videoUrl ? (
              <video
                controls
                className="w-full rounded-xl border border-slate-200 bg-black"
              >
                <source src={videoUrl} type="video/mp4" />
                Your browser does not support video playback.
              </video>
            ) : (
              <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500">
                No video uploaded for this course yet.
              </div>
            )}
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
              <p className="font-medium text-slate-800">Content overview</p>
              <p className="mt-1 whitespace-pre-line text-xs text-slate-600">
                {course.content}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              to="/courses"
              className="text-xs font-medium text-accent hover:underline"
            >
              ← Back to all courses
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CourseDetailPage;
