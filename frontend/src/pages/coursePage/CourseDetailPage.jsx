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
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    week: "",
    difficulty: "",
    content: "",
    topics: "",
  });
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoFile, setVideoFile] = useState(null);

  const isAssignedTrainer =
    user?.role === "TRAINER" &&
    ((course?.trainerId &&
      course.trainerId.toString() === user._id?.toString()) ||
      course?.trainerIds?.some(
        (t) => t._id?.toString() === user._id?.toString()
      ));
  const isHR = user?.role === "HR";
  const canEdit = isAssignedTrainer || isHR;

  useEffect(() => {
    const fetch = async () => {
      try {
        const [courseRes, quizRes] = await Promise.all([
          api.get(`/courses/${id}`),
          api.get(`/courses/${id}/quizzes`),
        ]);
        setCourse(courseRes.data.course);
        setQuizzes(quizRes.data.quizzes || []);
        // Prefill edit form when course loads
        if (courseRes.data.course) {
          setEditForm({
            title: courseRes.data.course.title || "",
            description: courseRes.data.course.description || "",
            week: courseRes.data.course.week || "",
            difficulty: courseRes.data.course.difficulty || "",
            content: courseRes.data.course.content || "",
            topics: courseRes.data.course.topics
              ? courseRes.data.course.topics.join(", ")
              : "",
          });
        }
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
      alert("Quiz generated successfully!");
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.msg || "Failed to generate quiz");
    } finally {
      setQuizLoading(false);
    }
  };

  const handleVideoUpload = async () => {
    console.log(
      "🔄 Uploading video - Course ID:",
      id,
      "User role:",
      user?.role
    ); // DEBUG

    if (!videoFile) {
      alert("Please select a video file first");
      return;
    }

    setVideoUploading(true);
    const formData = new FormData();
    formData.append("video", videoFile);

    try {
      console.log("📤 Sending request to /courses/" + id + "/upload-video"); // DEBUG
      await api.post(`/courses/${id}/upload-video`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Refresh course to get updated videoPath
      const courseRes = await api.get(`/courses/${id}`);
      setCourse(courseRes.data.course);

      alert("Video uploaded successfully!");
      // Reset file input
      setVideoFile(null);
      document.getElementById("video-upload-detail").value = "";

      console.log("✅ Upload success!"); // DEBUG
    } catch (e) {
      console.error("❌ Upload error:", e.response?.data || e.message); // DEBUG
      alert("Failed to upload video: " + (e.response?.data?.msg || e.message));
    } finally {
      setVideoUploading(false);
    }
  };

  const handleVideoChange = (e) => {
    setVideoFile(e.target.files[0]);
  };

  const handleEditToggle = () => {
    setEditing(!editing);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...editForm,
        topics: editForm.topics
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };
      await api.put(`/courses/${id}`, payload);
      setCourse({ ...course, ...payload });
      setEditing(false);
      alert("Course updated successfully!");
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.msg || "Failed to update course");
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

  const trainerNames =
    course.trainerIds?.length > 0
      ? course.trainerIds.map((t) => t.name || "Trainer").join(", ")
      : "No trainers assigned";

  return (
    <div className="space-y-4">
      <Card
        title={course.title}
        subtitle={course.description}
        actions={
          <>
            {(isAssignedTrainer || isHR) && quizzes.length > 0 && (
              <button
                onClick={() => navigate(`/quiz/${quizzes[0]._id}/preview`)}
                className="rounded-full bg-emerald-500 hover:bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow-sm transition-colors"
              >
                📋 Preview Quiz ({quizzes.length})
              </button>
            )}

            {canEdit && (
              <button
                onClick={handleEditToggle}
                className="rounded-full bg-blue-500 hover:bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-sm transition-colors"
              >
                {editing ? "Cancel" : "✏️ Edit Course"}
              </button>
            )}

            {(isAssignedTrainer || isHR) && (
              <button
                onClick={handleGenerateQuiz}
                disabled={quizLoading}
                className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-accent/90 disabled:opacity-70 transition-colors"
              >
                {quizLoading ? "Generating…" : "Generate AI Quiz"}
              </button>
            )}

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
        {editing ? (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Title
                </label>
                <input
                  name="title"
                  value={editForm.title}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Week
                </label>
                <input
                  name="week"
                  type="number"
                  value={editForm.week}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  required
                  min="1"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Difficulty
                </label>
                <select
                  name="difficulty"
                  value={editForm.difficulty}
                  onChange={handleEditChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Difficulty</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                rows="2"
                value={editForm.description}
                onChange={handleEditChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Topics (comma separated)
              </label>
              <input
                name="topics"
                value={editForm.topics}
                onChange={handleEditChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Video Upload Section */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                📹 Video Upload {videoUploading && "(Uploading...)"}
              </label>
              <div className="space-y-3 p-4 border border-dashed border-slate-300 rounded-xl bg-slate-50 hover:border-blue-400 transition-colors">
                <input
                  id="video-upload-detail"
                  name="video"
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                  disabled={videoUploading}
                />
                {videoFile && (
                  <div className="text-xs text-slate-600 p-2 bg-white rounded-lg">
                    Selected: {videoFile.name}
                    <span className="ml-2">
                      ({(videoFile.size / 1024 / 1024).toFixed(1)} MB)
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleVideoUpload}
                  disabled={videoUploading || !videoFile}
                  className="w-full rounded-full bg-green-500 hover:bg-green-600 disabled:bg-green-400 px-6 py-2 text-sm font-semibold text-white shadow-sm transition-all disabled:cursor-not-allowed"
                >
                  {videoUploading ? "⏳ Uploading..." : "🚀 Upload Video"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Content
              </label>
              <textarea
                name="content"
                rows="4"
                value={editForm.content}
                onChange={handleEditChange}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="rounded-full bg-blue-500 hover:bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition-colors"
            >
              Save Changes
            </button>
          </form>
        ) : (
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
                  <span className="font-medium">Trainers:</span>{" "}
                  <span className="font-semibold text-primary">
                    {trainerNames}
                  </span>
                </p>
                <p>
                  <span className="font-medium">Quizzes:</span>{" "}
                  <span className="font-semibold text-emerald-600">
                    {quizzes.length}
                  </span>
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
        )}
      </Card>
    </div>
  );
};

export default CourseDetailPage;
