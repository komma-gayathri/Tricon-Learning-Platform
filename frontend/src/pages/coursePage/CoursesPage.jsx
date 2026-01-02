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
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAssignTrainersForm, setShowAssignTrainersForm] = useState(false);
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
      const res = await api.get("/hr/batches");
      setBatches(res.data.batches || []);
    } catch (err) {
      console.error("Failed to load batches", err);
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
    loadBatches();
    loadCourses();
  }, [activeBatch]);

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
    setShowCreateForm(true);
    setEditingCourse(null);
    setAssigningCourse(null);
    setShowAssignTrainersForm(false);
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

  const closeCreateForm = () => {
    setShowCreateForm(false);
    setEditingCourse(null);
    setAssigningCourse(null);
    setShowAssignTrainersForm(false);
    setForm({
      title: "",
      description: "",
      content: "",
      week: "",
      batchId: "",
      topics: "",
      difficulty: "",
    });
    setVideoFile(null);
    setMessage("");
    setError("");
  };

  const startEdit = (course) => {
    if (!["TRAINER", "HR"].includes(user?.role)) {
      setError("You cannot edit this course");
      return;
    }
    setShowCreateForm(true);
    setEditingCourse(course);
    setAssigningCourse(null);
    setShowAssignTrainersForm(false);
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

  // NEW: Assign trainers form
  const startAssignTrainers = (course) => {
    if (user?.role !== "HR") {
      setError("Only HR can assign trainers");
      return;
    }
    setShowAssignTrainersForm(true);
    setAssigningCourse(course);
    setEditingCourse(null);
    setShowCreateForm(false);
    setSelectedTrainers([]);
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
      };

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
      closeCreateForm();
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to save course");
    }
  };

  // NEW: Assign trainers handler
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
      setShowAssignTrainersForm(false);
      setAssigningCourse(null);
      setSelectedTrainers([]);
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
      ? ["all", ...new Set(courses.map((c) => c.batchId?._id).filter(Boolean))]
      : [user?.batchId?._id].filter(Boolean);

  const filteredCourses =
    activeBatch === "all"
      ? courses
      : courses.filter((course) => course.batchId?._id === activeBatch);

  const isEditableCourse = (course) => {
    if (["TRAINER", "HR"].includes(user?.role)) {
      // CHANGED: Check trainerIds array instead of single trainerId
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
      {/* Header */}
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

      {user?.role === "HR" && userBatches.length > 1 && (
        <div className="flex flex-wrap gap-2 bg-slate-50 p-4 rounded-lg">
          {userBatches.map((batchId) => {
            const batchName =
              courses.find((c) => c.batchId?._id === batchId)?.batchId?.name ||
              "Uncategorized";
            return (
              <button
                key={batchId}
                onClick={() =>
                  setActiveBatch(batchId === activeBatch ? "all" : batchId)
                }
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                  activeBatch === batchId
                    ? "bg-primary text-white shadow-sm"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {batchId === "all" ? "All Batches" : batchName}
              </button>
            );
          })}
        </div>
      )}

      {/* NEW: Assign Trainers Form (HR only) */}
      {showAssignTrainersForm && assigningCourse && (
        <Card
          title="Assign Trainers"
          subtitle={`Select trainers for "${assigningCourse.title}"`}
          actions={
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAssignTrainersForm(false);
                  setAssigningCourse(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignTrainers}
                disabled={selectedTrainers.length === 0}
                className="px-6 py-2 text-sm font-semibold text-white bg-primary rounded-lg shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assign {selectedTrainers.length} Trainer
                {selectedTrainers.length !== 1 ? "s" : ""}
              </button>
            </div>
          }
        >
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">
                {assigningCourse.title}
              </h4>
              <p className="text-sm text-slate-600 mb-4">
                Week {assigningCourse.week}
              </p>
              <p className="text-xs text-slate-500 mb-4">
                Currently assigned:{" "}
                {getTrainerNames(assigningCourse.trainerIds)}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 block mb-2">
                Available Trainers ({trainers.length})
              </label>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {trainers.map((trainer) => (
                  <label
                    key={trainer._id}
                    className="flex items-center p-2 hover:bg-slate-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTrainers.includes(trainer._id)}
                      onChange={() => handleTrainerToggle(trainer._id)}
                      className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary"
                    />
                    <span className="ml-2 text-sm font-medium text-slate-900">
                      {trainer.name}
                    </span>
                    <span className="ml-2 text-xs text-slate-500">
                      ({trainer.email})
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {showCreateForm && (
        <Card
          title={editingCourse ? "Edit Course" : "Create New Course"}
          subtitle="Fill in course details and assign to the correct batch"
          actions={
            <div className="flex gap-2">
              <button
                type="button"
                onClick={closeCreateForm}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg"
              >
                Cancel
              </button>
            </div>
          }
        >
          <form onSubmit={handleSave} className="grid gap-4 md:grid-cols-2">
            {/* Same form fields as original */}
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
              <select
                name="batchId"
                value={form.batchId}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="">Select batch</option>
                {batches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
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
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-medium text-slate-600">
                Video (optional)
              </label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-2 pt-4">
              <button
                type="submit"
                disabled={!form.title || !form.week || !form.batchId}
                className="px-6 py-2 text-sm font-semibold text-white bg-primary rounded-lg shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingCourse ? "Update Course" : "Create Course"}
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Message/Error notifications - same as original */}
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
                activeBatch === "all" ? "all batches" : "selected batch"
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
            {filteredCourses.map((course) => (
              <div
                key={course._id}
                className="group flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm hover:shadow-xl hover:border-primary/50 transition-all duration-200 h-full"
              >
                <div className="relative h-32 bg-gradient-to-br from-slate-50 to-slate-100 border-b border-slate-200">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-primary/80" />

                  <div className="absolute top-3 left-3 rounded-md bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary group-hover:bg-primary group-hover:text-white transition-all">
                    Week {course.week || "1"}
                  </div>

                  {/* CHANGED: Show trainers or status */}
                  <div className="absolute top-3 right-3 rounded-md px-2 py-1 text-[11px] font-semibold">
                    {course.trainerIds?.length > 0
                      ? `${course.trainerIds.length} Trainer${
                          course.trainerIds.length !== 1 ? "s" : ""
                        }`
                      : "No trainers"}
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
                      <>
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
                      </>
                    )}

                    {/* Assign trainers button (HR only) */}
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

                    {/* Delete button (HR only) */}
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

                    {/* Generate quiz (Trainer only for assigned courses) */}
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
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default CoursesPage;
