import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api';

export default function HRBatchDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [batch, setBatch] = useState(null);
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [quizSubmissions, setQuizSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [allTrainers, setAllTrainers] = useState([]);
  const [allInterns, setAllInterns] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState("");
  const [selectedIntern, setSelectedIntern] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [allCoursesList, setAllCoursesList] = useState([]); // Renamed to avoid key collision
  const [allocating, setAllocating] = useState(false);

  useEffect(() => {
    fetchBatchDetails();
    fetchQuizSubmissions();
    fetchAllUsers();
  }, [id]);

  const fetchAllUsers = async () => {
    try {
      const tRes = await api.get('/hr/trainers');
      setAllTrainers(Array.isArray(tRes.data) ? tRes.data : tRes.data.users || []);

      const iRes = await api.get('/hr/interns');
      setAllInterns(Array.isArray(iRes.data) ? iRes.data : iRes.data.users || []);

      const cRes = await api.get('/courses'); // Fetch all courses for dropdown
      setAllCoursesList(cRes.data.courses || []);
    } catch (err) {
      console.error("Failed to fetch users/courses for allocation", err);
    }
  };

  const fetchBatchDetails = async () => {
    try {
      const res = await api.get(`/batches/${id}`);
      setBatch(res.data.batch);
      setCourses(res.data.courses || []);
      setAssignments(res.data.assignments || []);
    } catch (err) {
      console.error('Fetch batch details error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizSubmissions = async () => {
    try {
      const res = await api.get(`/hr/batches/${id}/quiz-submissions`);
      setQuizSubmissions(res.data.submissions || []);
    } catch (err) {
      console.error('Fetch quiz submissions error:', err);
      setQuizSubmissions([]);
    }
  };

  const handleAllocateTrainer = async () => {
    if (!selectedTrainer) return;
    setAllocating(true);
    try {
      await api.post(`/batches/${id}/add-trainer`, { trainerId: selectedTrainer });
      setSelectedTrainer("");
      fetchBatchDetails(); // refresh batch info
      fetchAllUsers(); // refresh available trainers/interns/courses list
      toast.success("Trainer allocated successfully");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to allocate trainer");
    } finally {
      setAllocating(false);
    }
  };

  const handleAllocateIntern = async () => {
    if (!selectedIntern) return;
    setAllocating(true);
    try {
      await api.post(`/batches/${id}/add-intern`, { internId: selectedIntern });
      setSelectedIntern("");
      fetchBatchDetails(); // refresh
      toast.success("Intern allocated successfully");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to allocate intern");
    } finally {
      setAllocating(false);
    }
  };

  const handleAllocateCourse = async () => {
    if (!selectedCourse) return;
    setAllocating(true);
    try {
      // Logic: Update the course's batchId to the current batch ID
      // CAUTION: This moves the course from its old batch to this one
      await api.put(`/courses/${selectedCourse}`, { batchId: id });

      setSelectedCourse("");
      fetchBatchDetails(); // Refresh batch details to show new course
      fetchAllUsers(); // Refresh all courses list (if needed)
      toast.success("Course assigned to batch successfully");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to assign course");
    } finally {
      setAllocating(false);
    }
  };

  const handleRemoveTrainer = async (trainerId) => {
    if (!window.confirm("Are you sure you want to remove this trainer from the batch?")) return;
    try {
      await api.post(`/batches/${id}/remove-trainer`, { trainerId });
      fetchBatchDetails();
      toast.success("Trainer removed successfully");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to remove trainer");
    }
  };

  const handleRemoveIntern = async (internId) => {
    if (!window.confirm("Are you sure you want to remove this intern from the batch?")) return;
    try {
      await api.post(`/batches/${id}/remove-intern`, { internId });
      fetchBatchDetails();
      toast.success("Intern removed successfully");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to remove intern");
    }
  };

  const handleRemoveCourse = async (courseId) => {
    if (!window.confirm("Are you sure you want to remove this course from the batch?")) return;
    try {
      await api.post(`/batches/${id}/remove-course`, { courseId });
      fetchBatchDetails();
      fetchAllUsers(); // Refresh available courses list
      toast.success("Course removed successfully");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to remove course");
    }
  };

  const handleViewCourseDetails = (courseId) => {
    navigate(`/course/${courseId}`);
  };

  const handleViewInternDetails = (internId) => {
    navigate(`/hr/interns/${internId}`);
  };

  const getInternStats = (internId) => {
    const assignmentsSubmitted = assignments.filter(assignment =>
      assignment.submissions?.some(submission =>
        submission.internId?.toString() === internId ||
        submission.internId?._id?.toString() === internId
      )
    ).length;

    const quizzesSubmitted = quizSubmissions.filter(submission =>
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
      totalQuizzes
    };
  };

  if (loading) return <p className="p-8 text-center text-slate-500">Loading batch details...</p>;
  if (!batch) return (
    <div className="p-8 text-center text-slate-500">
      <p className="text-xl font-bold text-slate-700">Batch Not Found</p>
      <p className="text-sm">Could not find batch with ID: <span className="font-mono text-slate-900">{id}</span></p>
      <button
        onClick={() => navigate('/hr/batches')}
        className="mt-4 rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90"
      >
        Back to Batches
      </button>
    </div>
  );

  // Filter out already assigned users
  // Filter out already assigned users
  const availableTrainers = allTrainers.filter(t => !batch.trainers?.some(bt => bt._id === t._id || bt === t._id));

  // Filter interns: 
  // 1. Not in THIS batch (already handled by logic below actually, as they would have batches.length > 0)
  // 2. Not in ANY other batch (batches array must be empty)
  const availableInterns = allInterns.filter(i =>
    (!i.batches || i.batches.length === 0) &&
    !batch.interns?.some(bi => bi._id === i._id || bi === i._id)
  );

  // Filter available courses: Exclude those already in this batch
  const availableCourses = allCoursesList.filter(c =>
    !courses.some(existing => existing._id === c._id)
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-8">
      {/* Batch Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">{batch.name}</h2>
          <p className="mt-2 text-sm font-medium text-slate-500 font-mono tracking-wide">ID: {batch.batchId}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-600">
            <span className="font-semibold">Duration:</span>
            <br />
            {new Date(batch.startDate).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric'
            })} — {new Date(batch.endDate).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric'
            })}
          </p>
        </div>
      </div>

      {/* ALLOCATION SECTION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Helper Card for Trainer Allocation */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-4">Allocate Trainer</h3>
          <div className="flex flex-col gap-3">
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              value={selectedTrainer}
              onChange={(e) => setSelectedTrainer(e.target.value)}
            >
              <option value="">Select Trainer...</option>
              {availableTrainers.map(t => (
                <option key={t._id} value={t._id}>{t.name} ({t.email})</option>
              ))}
            </select>
            <button
              onClick={handleAllocateTrainer}
              disabled={!selectedTrainer || allocating}
              className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
            >
              Assign Trainer
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-400">Select an existing trainer to assign to this batch.</p>
        </div>

        {/* Helper Card for Intern Allocation */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-4">Allocate Intern</h3>
          <div className="flex flex-col gap-3">
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              value={selectedIntern}
              onChange={(e) => setSelectedIntern(e.target.value)}
            >
              <option value="">Select Intern...</option>
              {availableInterns.map(i => (
                <option key={i._id} value={i._id}>{i.name} ({i.email})</option>
              ))}
            </select>
            <button
              onClick={handleAllocateIntern}
              disabled={!selectedIntern || allocating}
              className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
            >
              Enroll Intern
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-400">Select an existing intern to enroll in this batch.</p>
        </div>

        {/* Helper Card for Course Allocation */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-4">Add Course</h3>
          <div className="flex flex-col gap-3">
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
            >
              <option value="">Select Course...</option>
              {availableCourses.map(c => (
                <option key={c._id} value={c._id}>{c.title}</option>
              ))}
            </select>
            <button
              onClick={handleAllocateCourse}
              disabled={!selectedCourse || allocating}
              className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
            >
              Add Course
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-400">Assign an existing course to this batch (Duplicate/Move).</p>
        </div>
      </div>

      <div className="pt-2">
        <h3 className="text-xl font-bold mb-6 text-slate-900 flex items-center gap-2">
          <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Trainers ({batch.trainers?.length || 0})
        </h3>
        {(!batch.trainers || batch.trainers.length === 0) ? (
          <p className="text-slate-500 text-sm italic">No trainers allocated yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {batch.trainers.map((trainer) => (
              <div
                key={trainer.id || trainer._id}
                className="group flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/30"
              >
                {/* Thumbnail/Avatar Header */}
                <div className="relative h-20 bg-primary/5 border-b border-slate-200">
                  <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
                  <div className="absolute top-3 left-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary border border-slate-100 shadow-sm">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="text-base font-bold text-slate-900 transition-colors group-hover:text-primary line-clamp-1">
                    {trainer.name}
                  </h3>
                  <p className="mt-0.5 mb-3 text-xs text-slate-500 line-clamp-1">
                    {trainer.email}
                  </p>
                  <div className="mt-auto grid grid-cols-2 gap-2">
                    <button
                      onClick={() => navigate(`/hr/trainers/${trainer.id || trainer._id}`)}
                      className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-primary hover:text-primary transition-all"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => handleRemoveTrainer(trainer.id || trainer._id)}
                      className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-all hover:border-red-300"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* INTERNS SECTION */}
      <div className="pt-6 border-t border-slate-100">
        <h3 className="text-xl font-bold mb-6 text-slate-900 flex items-center gap-2">
          <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 12H9m6 0a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
          Interns ({batch.interns?.length || 0})
        </h3>
        {(!batch.interns || batch.interns.length === 0) ? (
          <p className="text-slate-500 text-sm italic">No interns allocated yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {batch.interns.map((intern) => {
              const internId = intern.id || intern._id;
              const stats = getInternStats(internId);
              return (
                <div
                  key={internId}
                  className="group flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/30"
                >
                  {/* Thumbnail/Avatar Header */}
                  <div className="relative h-24 bg-primary/5 border-b border-slate-200">
                    <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
                    <div className="absolute top-3 left-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary border border-slate-100 shadow-sm">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-5">
                    {/* Name */}
                    <h3 className="text-base font-bold text-slate-900 transition-colors group-hover:text-primary line-clamp-1">
                      {intern.name}
                    </h3>

                    {/* Email */}
                    <p className="mt-0.5 text-xs text-slate-500 line-clamp-1 mb-4">
                      {intern.email}
                    </p>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="rounded-md bg-slate-50 p-2 text-center border border-slate-100">
                        <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold">Assgn</span>
                        <span className="block text-sm font-bold text-slate-800">{stats.assignmentsSubmitted}/{stats.totalAssignments}</span>
                      </div>
                      <div className="rounded-md bg-slate-50 p-2 text-center border border-slate-100">
                        <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold">Quiz</span>
                        <span className="block text-sm font-bold text-slate-800">{stats.quizzesSubmitted}/{stats.totalQuizzes}</span>
                      </div>
                    </div>

                    <div className="mt-auto grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleViewInternDetails(internId)}
                        className="rounded-lg border border-slate-200 bg-white text-slate-600 px-3 py-2 text-xs font-bold hover:bg-primary hover:text-white hover:border-primary transition-all"
                      >
                        View Profile
                      </button>
                      <button
                        onClick={() => handleRemoveIntern(internId)}
                        className="rounded-lg border border-red-200 bg-red-50 text-red-600 px-3 py-2 text-xs font-bold hover:bg-red-100 hover:border-red-300 transition-all"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* COURSES SECTION */}
      <div className="pt-6 border-t border-slate-100">
        <h3 className="text-xl font-bold mb-6 text-slate-900 flex items-center gap-2">
          <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Modules / Courses ({courses.length})
        </h3>

        {courses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course._id}
                className="group flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/30"
              >
                {/* Thumbnail/Avatar Header */}
                <div className="relative h-28 bg-slate-50 border-b border-slate-200">
                  <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
                  <div className="absolute top-3 left-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-4">
                  {/* Course Name */}
                  <h3 className="text-base font-semibold text-slate-900 transition-colors group-hover:text-primary line-clamp-2">
                    {course.title}
                  </h3>

                  {/* Trainers Names */}
                  <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                    {course.trainers && course.trainers.length > 0
                      ? course.trainers.map(t => t.name).join(', ')
                      : (course.trainerId?.name || 'No trainer assigned')}
                  </p>

                  {/* Video Status */}
                  <p className="mt-1 text-xs text-slate-500">
                    Video: {course.videoFileName || course.videoPath ? '✅ Uploaded' : '❌ Not uploaded'}
                  </p>

                  {/* CTA Buttons */}
                  <div className="mt-auto grid grid-cols-2 gap-2">
                    <button
                      onClick={() => navigate(`/courses/${course._id}`)}
                      className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary/90"
                    >
                      View Course
                    </button>
                    <button
                      onClick={() => handleRemoveCourse(course._id)}
                      className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-all hover:border-red-300"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-lg font-semibold text-slate-900 mb-2">No courses/modules assigned yet</p>
            <p className="text-sm text-slate-500">Courses will appear here once assigned to this batch</p>
          </div>
        )}
      </div>
    </div>
  );
}

