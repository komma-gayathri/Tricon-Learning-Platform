import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";
import Card from "../../components/Card";
import { useAuth } from "../../context/AuthContext";

const CoursesPage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignTrainersModal, setShowAssignTrainersModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [assigningCourse, setAssigningCourse] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    content: "",
    week: "",
    batchId: "",
    topics: "",
    difficulty: "",
  });
  const [trainers, setTrainers] = useState([]);
  const [selectedTrainers, setSelectedTrainers] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [activeBatch, setActiveBatch] = useState("all");

  const loadCourses = async () => {
    setLoading(true);
    setError("");
    try {
      const params =
        user?.role === "HR" && activeBatch !== "all"
          ? { batchId: activeBatch }
          : {};

      const res = await api.get("/courses", { params });
      setCourses(res.data.courses || []);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const loadBatches = async () => {
    try {
      const res = await api.get("/batches/");
      console.log("✅ Batches loaded:", res.data);
      setBatches(Array.isArray(res.data) ? res.data : res.data.batches || []);
    } catch (err) {
      console.error("❌ Failed to load batches", err);
      setBatches([]);
    }
  };

  const loadTrainers = async () => {
    try {
      const res = await api.get("/hr/trainers");
      setTrainers(res.data.users || []);
    } catch (err) {
      console.error("Failed to load trainers", err);
    }
  };

  useEffect(() => {
    if (user?.role === "HR") {
      loadBatches();
    }
    loadCourses();
  }, [activeBatch, user?.role]);

  useEffect(() => {
    if (user?.role === "HR") {
      loadTrainers();
    }
  }, [user?.role]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleTopicsChange = (e) => {
    setForm({ ...form, topics: e.target.value });
  };

  const getTopicsForForm = (courseTopics) => {
    return Array.isArray(courseTopics)
      ? courseTopics.join(", ")
      : courseTopics || "";
  };

  const startCreate = () => {
    if (user?.role !== "HR") {
      setError("Only HR can create courses");
      return;
    }
    setShowCreateModal(true);
    setEditingCourse(null);
    setForm({
      title: "",
      description: "",
      content: "",
      week: "",
      batchId: "",
      topics: "",
      difficulty: "",
    });
    setMessage("");
    setError("");
    setVideoFile(null);
  };

  const closeAllModals = () => {
    setShowCreateModal(false);
    setShowAssignTrainersModal(false);
    setEditingCourse(null);
    setAssigningCourse(null);
    setForm({
      title: "",
      description: "",
      content: "",
      week: "",
      batchId: "",
      topics: "",
      difficulty: "",
    });
    setSelectedTrainers([]);
    setVideoFile(null);
    setMessage("");
    setError("");
  };

  const startEdit = async (course) => {
    if (!["TRAINER", "HR"].includes(user?.role)) {
      setError("You cannot edit this course");
      return;
    }

    if (user?.role === "HR" && trainers.length === 0) {
      await loadTrainers();
    }

    setShowCreateModal(true);
    setEditingCourse(course);
    setForm({
      title: course.title || "",
      description: course.description || "",
      content: course.content || "",
      week: course.week || "",
      batchId: course.batchId?._id || course.batchId || "",
      topics: getTopicsForForm(course.topics),
      difficulty: course.difficulty || "",
    });
    setMessage("");
    setError("");
    setVideoFile(null);
  };

  const startAssignTrainers = async (course) => {
    if (user?.role !== "HR") {
      setError("Only HR can assign trainers");
      return;
    }

    if (trainers.length === 0) {
      await loadTrainers();
    }

    const currentTrainerIds = course.trainerIds?.map((t) => t._id) || [];

    setShowAssignTrainersModal(true);
    setAssigningCourse(course);
    setSelectedTrainers(currentTrainerIds);
    setMessage("");
    setError("");
  };

  const handleTrainerToggle = (trainerId) => {
    setSelectedTrainers((prev) =>
      prev.includes(trainerId)
        ? prev.filter((id) => id !== trainerId)
        : [...prev, trainerId]
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      let courseId;
      const saveData = {
        ...form,
        week: Number(form.week),
        topics: form.topics
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        batchId: form.batchId,
        difficulty: form.difficulty,
      };

      console.log("🚀 Saving course:", saveData);

      if (editingCourse) {
        const res = await api.put(`/courses/${editingCourse._id}`, saveData);
        courseId = res.data.course?._id || editingCourse._id;
        setMessage(res.data.msg || "Course updated successfully");
      } else {
        const res = await api.post("/courses", saveData);
        courseId = res.data.course?._id;
        setMessage(res.data.msg || "Course created successfully");
      }

      if (videoFile && courseId) {
        const fd = new FormData();
        fd.append("video", videoFile);
        await api.post(`/courses/${courseId}/upload-video`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      await loadCourses();
      closeAllModals();
    } catch (err) {
      console.error("❌ Save error:", err.response?.data);
      setError(err.response?.data?.msg || "Failed to save course");
    }
  };

  const handleAssignTrainers = async () => {
    try {
      if (selectedTrainers.length === 0) {
        setError("Please select at least one trainer");
        return;
      }

      const res = await api.put(
        `/courses/${assigningCourse._id}/assign-trainers`,
        {
          trainerIds: selectedTrainers,
        }
      );

      setMessage(res.data.msg || "Trainers assigned successfully");
      await loadCourses();
      closeAllModals();
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to assign trainers");
    }
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm("Delete this course permanently?")) return;
    try {
      await api.delete(`/courses/${courseId}`);
      setMessage("Course deleted successfully");
      await loadCourses();
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to delete course");
    }
  };

  const handleGenerateQuiz = async (courseId) => {
    if (user?.role !== "TRAINER") {
      setError("Only trainers can generate quizzes");
      return;
    }
    try {
      await api.post(`/courses/${courseId}/generate-quiz`);
      setMessage("AI quiz generated successfully");
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to generate quiz");
    }
  };

  const userBatches =
    user?.role === "HR"
      ? ["all", ...batches.map((b) => b._id)]
      : [user?.batchId?._id].filter(Boolean);

  const filteredCourses =
    activeBatch === "all"
      ? courses
      : courses.filter((course) => course.batchId?._id === activeBatch);

  const isEditableCourse = (course) => {
    if (["TRAINER", "HR"].includes(user?.role)) {
      return (
        user.role === "HR" || course.trainerIds?.some((t) => t._id === user._id)
      );
    }
    return false;
  };

  const getTrainerNames = (trainerIds) => {
    if (!trainerIds || trainerIds.length === 0) return "No trainers assigned";
    return (
      trainerIds
        .map((t) => t.name || "Trainer")
        .join(", ")
        .slice(0, 30) + (trainerIds.length > 1 ? "..." : "")
    );
  };

  const getTrainerStatus = (course) => {
    const trainerCount = course.trainerIds?.length || 0;
    if (trainerCount === 0) {
      return { text: "No trainers", color: "text-amber-500 bg-amber-50" };
    }
    if (trainerCount === 1) {
      return { text: "1 Trainer", color: "text-emerald-500 bg-emerald-50" };
    }
    return {
      text: `${trainerCount} Trainers`,
      color: "text-emerald-600 bg-emerald-50",
    };
  };

  if (loading && !courses.length) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 animate-spin text-primary"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          <p className="mt-4 text-slate-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Courses</h1>
          <p className="mt-2 text-slate-600">
            {user?.role === "HR"
              ? "Manage all courses across batches"
              : user?.role === "TRAINER"
              ? "Manage your training courses"
              : "Explore courses for your batch"}
          </p>
        </div>

        {user?.role === "HR" && (
          <button
            onClick={startCreate}
            className="inline-flex items-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-md shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
          >
            + Create New Course
          </button>
        )}
      </div>

      {user?.role === "HR" && batches.length > 0 && (
        <div className="bg-slate-50 p-4 rounded-lg">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Filter by Batch
          </label>
          <select
            value={activeBatch}
            onChange={(e) => setActiveBatch(e.target.value)}
            className="w-full md:w-64 lg:w-80 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          >
            <option value="all">All Batches ({courses.length} courses)</option>
            {batches.map((batch) => {
              const batchCourseCount = courses.filter(
                (c) => c.batchId?._id === batch._id
              ).length;
              return (
                <option key={batch._id} value={batch._id}>
                  {batch.name} ({batchCourseCount} courses)
                </option>
              );
            })}
          </select>
        </div>
      )}

      {showCreateModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in-0 duration-200"
            onClick={closeAllModals}
            aria-hidden="true"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      {editingCourse ? "Edit Course" : "Create New Course"}
                    </h2>
                    <p className="text-sm text-slate-600 mt-1">
                      Fill in course details and assign to the correct batch
                    </p>
                  </div>
                  <button
                    onClick={closeAllModals}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <form
                  onSubmit={handleSave}
                  className="grid gap-6 md:grid-cols-2"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-600">
                      Title *
                    </label>
                    <input
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-600">
                      Week *
                    </label>
                    <input
                      name="week"
                      type="number"
                      min="1"
                      max="52"
                      value={form.week}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-medium text-slate-600">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      rows={2}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-medium text-slate-600">
                      Content Overview
                    </label>
                    <textarea
                      name="content"
                      value={form.content}
                      onChange={handleChange}
                      rows={3}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-600">
                      Batch *
                    </label>
                    {editingCourse ? (
                      <div className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm cursor-not-allowed">
                        {
                          batches.find(
                            (b) => b.batchId === editingCourse.batchId
                          )?.batchId
                        }{" "}
                        
                        {editingCourse.batchId?.name ||
                          batches.find(
                            (b) => b.batchId === editingCourse.batchId
                          )?.name ||
                          editingCourse.batchId}
                      </div>
                    ) : (
                      <select
                        name="batchId"
                        value={form.batchId}
                        onChange={handleChange}
                        required
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                      >
                        <option value="">Select a batch...</option>
                        {batches.map((batch) => (
                          <option key={batch._id} value={batch.batchId}>
                            {batch.batchId} - {batch.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-600">
                      Topics (comma separated)
                    </label>
                    <input
                      type="text"
                      name="topics"
                      value={form.topics}
                      onChange={handleTopicsChange}
                      placeholder="React, State Management, Hooks"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-600">
                      Difficulty Level
                    </label>
                    <select
                      name="difficulty"
                      value={form.difficulty}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                    >
                      <option value="">Select difficulty</option>
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-medium text-slate-600">
                      Video (optional)
                    </label>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) =>
                        setVideoFile(e.target.files?.[0] || null)
                      }
                      className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                    />
                  </div>

                  <div className="md:col-span-2 flex justify-end gap-2 pt-4 border-t border-slate-200 mt-4">
                    <button
                      type="button"
                      onClick={closeAllModals}
                      className="px-6 py-2 text-sm font-semibold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!form.title || !form.week || !form.batchId}
                      className="px-6 py-2 text-sm font-semibold text-white bg-primary rounded-lg shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {editingCourse ? "Update Course" : "Create Course"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Assign Trainers Modal */}
      {showAssignTrainersModal && assigningCourse && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in-0 duration-200"
            onClick={closeAllModals}
            aria-hidden="true"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      Assign Trainers
                    </h2>
                    <p className="text-sm text-slate-600 mt-1">
                      Manage trainers for "{assigningCourse.title}"
                    </p>
                  </div>
                  <button
                    onClick={closeAllModals}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-900 text-lg">
                      {assigningCourse.title}
                    </h4>
                    <div className="text-sm text-slate-600">
                      Week {assigningCourse.week}
                    </div>
                    <div className="text-xs text-slate-500">
                      Currently assigned:{" "}
                      {getTrainerNames(assigningCourse.trainerIds)}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-medium text-slate-600 block">
                      Available Trainers ({trainers.length})
                    </label>
                    <div className="max-h-64 overflow-y-auto space-y-2 border border-slate-200 rounded-lg p-3 bg-slate-50">
                      {trainers.map((trainer) => (
                        <label
                          key={trainer._id}
                          className="flex items-center p-3 hover:bg-white rounded-lg cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTrainers.includes(trainer._id)}
                            onChange={() => handleTrainerToggle(trainer._id)}
                            className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary mr-3 flex-shrink-0"
                          />
                          <div>
                            <span className="text-sm font-medium text-slate-900 block">
                              {trainer.name}
                            </span>
                            <span className="text-xs text-slate-500">
                              {trainer.email}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 mt-6">
                  <button
                    type="button"
                    onClick={closeAllModals}
                    className="px-6 py-2 text-sm font-semibold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignTrainers}
                    disabled={selectedTrainers.length === 0}
                    className="px-6 py-2 text-sm font-semibold text-white bg-primary rounded-lg shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {selectedTrainers.length === 0
                      ? "Assign Trainers"
                      : `Save ${selectedTrainers.length} Trainer${
                          selectedTrainers.length !== 1 ? "s" : ""
                        }`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {message && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between">
            <p className="text-sm text-emerald-800 font-medium">✓ {message}</p>
            <button
              onClick={() => setMessage("")}
              className="ml-3 text-emerald-500 hover:text-emerald-700 text-lg font-bold p-1 -m-1 rounded-full hover:bg-emerald-100 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-800 font-medium">✗ {error}</p>
            <button
              onClick={() => setError("")}
              className="ml-3 text-red-500 hover:text-red-700 text-lg font-bold p-1 -m-1 rounded-full hover:bg-red-100 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <Card
        title={`${filteredCourses.length} Course${
          filteredCourses.length !== 1 ? "s" : ""
        }`}
        subtitle={
          user?.role === "HR"
            ? `Showing ${
                activeBatch === "all"
                  ? "all batches"
                  : batches.find((b) => b._id === activeBatch)?.name ||
                    "selected batch"
              } courses`
            : "Courses assigned to your batch"
        }
      >
        {filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-16 w-16 text-slate-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {activeBatch === "all"
                ? "No courses available"
                : "No courses in this batch"}
            </h3>
            <p className="text-slate-600">
              {user?.role === "HR"
                ? "Create your first course to get started."
                : "No courses assigned yet. Check back soon!"}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => {
              const trainerStatus = getTrainerStatus(course);
              return (
                <div
                  key={course._id}
                  className="group flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm hover:shadow-xl hover:border-primary/50 transition-all duration-200 h-full"
                >
                  <div className="relative h-32 bg-gradient-to-br from-slate-50 to-slate-100 border-b border-slate-200">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-primary/80" />

                    <div className="absolute top-3 left-3 rounded-md bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary group-hover:bg-primary group-hover:text-white transition-all">
                      Week {course.week || "1"}
                    </div>

                    <div
                      className={`absolute top-3 right-3 rounded-md px-2 py-1 text-[11px] font-semibold ${trainerStatus.color}`}
                    >
                      {trainerStatus.text}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <span className="text-xs font-semibold uppercase tracking-wide text-primary bg-primary/10 px-2 py-1 rounded-full w-fit">
                      {course.batchId?.name || "General"}
                    </span>

                    <h3 className="mt-3 text-lg font-semibold text-slate-900 line-clamp-2 group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>

                    <p className="mt-2 flex-1 text-sm text-slate-600 line-clamp-3">
                      {course.description || "No description available"}
                    </p>

                    {course.topics?.length > 0 && (
                      <div className="mt-4 mb-6">
                        <div className="flex flex-wrap gap-1">
                          {course.topics.slice(0, 3).map((topic, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full"
                            >
                              {topic}
                            </span>
                          ))}
                          {course.topics.length > 3 && (
                            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
                              +{course.topics.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 mt-auto pt-4 border-t border-slate-100">
                      <Link
                        to={`/courses/${course._id}`}
                        className="flex-1 bg-primary text-white py-2.5 px-4 text-sm font-semibold rounded-lg shadow-sm hover:bg-primary/90 text-center transition-all flex items-center justify-center gap-2 group-hover:shadow-md"
                      >
                        View Course
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                      </Link>

                      {isEditableCourse(course) && (
                        <button
                          onClick={() => startEdit(course)}
                          className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit course"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                      )}

                      {user?.role === "HR" && (
                        <button
                          onClick={() => startAssignTrainers(course)}
                          className={`p-2 rounded-lg transition-colors ${
                            course.trainerIds?.length > 0
                              ? "text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50"
                              : "text-amber-500 hover:text-amber-700 hover:bg-amber-50"
                          }`}
                          title={
                            course.trainerIds?.length > 0
                              ? "Manage trainers"
                              : "Assign trainers"
                          }
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                            />
                          </svg>
                        </button>
                      )}

                      {user?.role === "HR" && (
                        <button
                          onClick={() => handleDelete(course._id)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete course"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      )}

                      {user?.role === "TRAINER" &&
                        course.trainerIds?.some((t) => t._id === user._id) && (
                          <button
                            onClick={() => handleGenerateQuiz(course._id)}
                            className="p-2 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Generate AI Quiz"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                              />
                            </svg>
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default CoursesPage;
