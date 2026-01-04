import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../../api";
 
export default function HRBatchDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
 
  const [batch, setBatch] = useState(null);
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [quizSubmissions, setQuizSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    fetchBatchDetails();
    fetchQuizSubmissions();
  }, [id]);
 
  const fetchBatchDetails = async () => {
    try {
      const res = await api.get(`/hr/batches/${id}`);
      setBatch(res.data.batch);
      setCourses(res.data.courses || []);
      setAssignments(res.data.assignments || []);
    } catch (err) {
      console.error("Fetch batch details error:", err);
    } finally {
      setLoading(false);
    }
  };
 
  const fetchQuizSubmissions = async () => {
    try {
      const res = await api.get(`/hr/batches/${id}/quiz-submissions`);
      setQuizSubmissions(res.data || []);
    } catch (err) {
      console.error("Fetch quiz submissions error:", err);
      setQuizSubmissions([]);
    }
  };
 
  const handleViewCourseDetails = (courseId) => {
    navigate(`/courses/${courseId}`);
  };
 
  const handleViewInternDetails = (internId) => {
    navigate(`/hr/interns/${internId}`);
  };
 
  const getInternStats = (internId) => {
    const assignmentsSubmitted = assignments.filter((assignment) =>
      assignment.submissions?.some(
        (submission) =>
          submission.internId?.toString() === internId ||
          submission.internId?._id?.toString() === internId
      )
    ).length;
 
    const quizzesSubmitted = quizSubmissions.filter(
      (submission) =>
        submission.internId?.toString() === internId ||
        submission.internId?._id?.toString() === internId
    ).length;
 
    const totalQuizzes = courses.reduce((total, course) => {
      return total + (course.quizzes?.length || 0);
    }, 0);
 
    return {
      assignmentsSubmitted,
      totalAssignments: assignments.length,
      quizzesSubmitted,
      totalQuizzes,
    };
  };
 
  if (loading) return <p>Loading batch details...</p>;
  if (!batch) return <p>Batch not found</p>;
 
  return (
    <div className="space-y-6 max-w-6xl mx-auto p-6">
      {/* Batch Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">{batch.name}</h2>
      </div>
 
      {/* Batch Details */}
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
        <p className="text-sm">
          <b>Batch ID:</b> {batch.batchId}
        </p>
        <p className="text-sm">
          <b>Duration:</b>{" "}
          {new Date(batch.startDate).toLocaleDateString("en-US", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
          })}{" "}
          -{" "}
          {new Date(batch.endDate).toLocaleDateString("en-US", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </p>
      </div>
 
      {/* INTERNS SECTION */}
      {batch.interns && batch.interns.length > 0 && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-bold mb-6 text-slate-900 flex items-center gap-2">
            <svg
              className="w-6 h-6 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 12H9m6 0a6 6 0 11-12 0 6 6 0 0112 0z"
              />
            </svg>
            Interns ({batch.interns.length})
          </h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {batch.interns.map((intern) => {
              const internId = intern.id || intern._id;
              const stats = getInternStats(internId);
              return (
                <div
                  key={internId}
                  className="group flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/30"
                >
                  {/* Thumbnail/Avatar Header */}
                  <div className="relative h-28 bg-slate-50 border-b border-slate-200">
                    <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
                    <div className="absolute top-3 left-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                  </div>
 
                  {/* Content */}
                  <div className="flex flex-1 flex-col p-4">
                    {/* Name */}
                    <h3 className="text-base font-semibold text-slate-900 transition-colors group-hover:text-primary line-clamp-2">
                      {intern.name}
                    </h3>
 
                    {/* Email */}
                    <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                      {intern.email}
                    </p>
 
                    {/* Assignments - BOLD COLOR */}
                    <p className="mt-1 text-xs font-semibold text-slate-900">
                      Assignments: {stats.assignmentsSubmitted}/
                      {stats.totalAssignments}
                    </p>
 
                    {/* Quizzes - SUBTLE BOLD */}
                    <p className="mt-1 text-xs font-semibold text-slate-700">
                      Quizzes: {stats.quizzesSubmitted}/{stats.totalQuizzes}
                    </p>
 
                    {/* CTA Button */}
                    <button
                      onClick={() => handleViewInternDetails(internId)}
                      className="mt-3 w-full rounded-md bg-primary px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary/90"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
 
      {/* TRAINERS SECTION */}
      {batch.trainers && batch.trainers.length > 0 && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-bold mb-6 text-slate-900 flex items-center gap-2">
            <svg
              className="w-6 h-6 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
            Trainers ({batch.trainers.length})
          </h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {batch.trainers.map((trainer) => (
              <div
                key={trainer.id}
                className="group flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/30"
              >
                {/* Thumbnail/Avatar Header */}
                <div className="relative h-28 bg-slate-50 border-b border-slate-200">
                  <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
                  <div className="absolute top-3 left-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                      />
                    </svg>
                  </div>
                </div>
 
                {/* Content */}
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="mt-1 text-base font-semibold text-slate-900 transition-colors group-hover:text-primary line-clamp-2">
                    {trainer.name}
                  </h3>
                  <p className="mt-1 flex-1 text-xs text-slate-600 line-clamp-2">
                    {trainer.email}
                  </p>
                  <button className="mt-3 w-full rounded-md bg-primary px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary/90">
                    View Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
 
      {/* COURSES SECTION */}
      {courses.length > 0 ? (
        <div className="border-t pt-6">
          <h3 className="text-lg font-bold mb-6 text-slate-900 flex items-center gap-2">
            <svg
              className="w-6 h-6 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            Modules / Courses ({courses.length})
          </h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <div
                key={course._id}
                className="group flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/30"
              >
                {/* Thumbnail/Avatar Header */}
                <div className="relative h-28 bg-slate-50 border-b border-slate-200">
                  <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
                  <div className="absolute top-3 left-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                </div>
 
                {/* Content */}
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="text-base font-semibold text-slate-900 transition-colors group-hover:text-primary line-clamp-2">
                    {course.title}
                  </h3>
 
                  {/* ✅ All trainers */}
                  <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                    {course.trainerIds?.length > 0
                      ? course.trainerIds
                          .map((t) => t.name || "Trainer")
                          .join(", ")
                      : "No trainer assigned"}
                  </p>
 
                  <p className="mt-1 text-xs text-slate-500">
                    Video:{" "}
                    {course.videoFileName || course.videoPath
                      ? "✅ Uploaded"
                      : "❌ Not uploaded"}
                  </p>
 
                  <button
                    onClick={() => handleViewCourseDetails(course._id)}
                    className="mt-3 w-full rounded-md bg-primary px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary/90"
                  >
                    View Course
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="border-t pt-6">
          <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-slate-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="text-lg font-semibold text-slate-900 mb-2">
              No courses/modules assigned yet
            </p>
            <p className="text-sm text-slate-500">
              Courses will appear here once assigned to this batch
            </p>
          </div>
        </div>
      )}
    </div>
  );
}