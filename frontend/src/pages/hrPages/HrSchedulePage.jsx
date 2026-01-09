import React, { useState, useEffect, useCallback } from "react";
import api from "../../api";
import Card from "../../components/Card";

const emptySlot = {
  id: Date.now().toString(),
  date: new Date().toISOString().split("T")[0],
  startTime: "",
  endTime: "",
  topic: "",
  trainerId: "",
  courseId: "",
};

const HrSchedulePage = () => {
  const [batchId, setBatchId] = useState("");
  const [batches, setBatches] = useState([]);
  const [scheduleId, setScheduleId] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [slots, setSlots] = useState([emptySlot]);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [trainers, setTrainers] = useState([]);
  const [courses, setCourses] = useState([]);

  // Fetch courses when batch changes
  useEffect(() => {
    if (!batchId) {
      setCourses([]);
      return;
    }
    const fetchCourses = async () => {
      try {
        const res = await api.get('/courses');
        const all = res.data.courses || [];

        // Since courses can now be created without a batch, show all courses
        // This allows HR to schedule any course for any batch
        setCourses(all);
      } catch (err) {
        console.error("Failed to load courses", err);
      }
    };
    fetchCourses();
  }, [batchId]);

  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        const res = await api.get("/hr/trainers");
        setTrainers(res.data.users || res.data || []);
      } catch (err) {
        console.error("Failed to load trainers:", err);
      }
    };
    fetchTrainers();
  }, []);

  const loadScheduleIntoForm = (schedule) => {
    setScheduleId(schedule._id);
    setSlots(
      schedule.timetable.length > 0
        ? schedule.timetable.map((s, i) => ({
          id: `slot-${schedule._id}-${i}`,
          date: s.date
            ? s.date.slice(0, 10)
            : new Date().toISOString().split("T")[0],
          startTime: s.timeSlot ? s.timeSlot.split("–")[0]?.trim() || "" : "",
          endTime: s.timeSlot ? s.timeSlot.split("–")[1]?.trim() || "" : "",
          // Map topic to courseId if it stores course name, or just use courseId field
          // The schema uses 'topic' string. We are changing UI to 'Course'.
          // We should ideally store courseId. 
          // If backend expects 'topic', we can send course title as topic for compatibility?
          // Or user meant strictly "Say course" in UI. 
          // Let's assume we send course title as topic for now to avoid schema migration issues unless 'courseId' exists in Schedule Schema.
          // Checking file... 'courseId' exists in emptySlot (line 12).
          // But 'handleSaveSchedule' (line 228) maps topic to 'topic' and courseId to 'courseId'.
          // So we should use courseId field.
          topic: s.topic || "",
          courseId: s.courseId?._id || s.courseId || "",
          trainerId: s.trainerId?._id || s.trainerId || "",
        }))
        : [emptySlot]
    );
    setValidationErrors({});
  };


  useEffect(() => {
    const loadBatches = async () => {
      try {
        const res = await api.get("/batches");
        setBatches(res.data.batches || res.data || []);
      } catch (err) {
        console.error("Failed to load batches:", err);
        setBatches([]);
      } finally {
        setLoadingBatches(false);
      }
    };
    loadBatches();
  }, []);

  const validateSlots = useCallback(() => {
    const errors = {};
    const today = new Date().toISOString().split("T")[0];

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      const slotErrors = [];

      // Find current batch to validate dates
      const currentBatch = batches.find(b => (b.batchId === batchId) || (b._id === batchId));

      if (!slot.date) {
        slotErrors.push("Date required");
      } else {
        if (slot.date < today) slotErrors.push("Date cannot be in the past");

        if (currentBatch && currentBatch.startDate && currentBatch.endDate) {
          const sDate = new Date(slot.date);
          const batchStart = new Date(currentBatch.startDate);
          const batchEnd = new Date(currentBatch.endDate);
          // Reset times for accurate comparison
          sDate.setHours(0, 0, 0, 0);
          batchStart.setHours(0, 0, 0, 0);
          batchEnd.setHours(0, 0, 0, 0);

          if (sDate < batchStart || sDate > batchEnd) {
            slotErrors.push(`Date must be between ${batchStart.toLocaleDateString()} and ${batchEnd.toLocaleDateString()}`);
          }
        }
      }

      if (!slot.startTime) slotErrors.push("Start time required");
      if (!slot.endTime) slotErrors.push("End time required");
      if (slot.startTime && slot.endTime && slot.startTime >= slot.endTime) {
        slotErrors.push("End time must be after start time");
      }

      if (!slot.topic?.trim()) slotErrors.push("Topic is required");
      if (!slot.trainerId) slotErrors.push("Trainer is required");

      if (slotErrors.length > 0) {
        errors[i] = slotErrors.join("; ");
      }
    }

    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        if (
          slots[i].date === slots[j].date &&
          slots[i].startTime &&
          slots[j].startTime &&
          slots[i].endTime &&
          slots[j].endTime
        ) {
          if (
            slots[i].startTime < slots[j].endTime &&
            slots[i].endTime > slots[j].startTime
          ) {
            errors[i] = `${errors[i] || ""} Overlaps with slot #${j + 1
              }`.trim();
            errors[j] = `${errors[j] || ""} Overlaps with slot #${i + 1
              }`.trim();
          }
        }
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [slots]);

  const handleSlotChange = (index, field, value) => {
    setSlots((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });

    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[index];
      return newErrors;
    });
  };

  const addSlot = () => {
    const newSlot = { ...emptySlot, id: Date.now().toString() };
    setSlots((prev) => [...prev, newSlot]);
  };

  const removeSlot = (index) => {
    // If it's the only slot, just clear it instead of removing
    if (slots.length === 1) {
      setSlots([{ ...emptySlot, id: Date.now().toString() }]);
      setValidationErrors({});
      return;
    }

    setSlots((prev) => {
      const newSlots = prev.filter((_, i) => i !== index);
      return newSlots;
    });
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[index];
      return newErrors;
    });
  };



  const handleLoadSchedule = async () => {
    setMessage("");
    setError("");
    try {
      const res = await api.get(`/schedule/batch/${batchId}`);
      const all = res.data.schedules || [];
      setSchedules(all);

      const latest = all.length > 0 ? all[0] : null;
      if (!latest) {
        setScheduleId(null);
        setSlots([emptySlot]);
        setError("No schedule found for this batch. Create a new one below.");
        return;
      }

      loadScheduleIntoForm(latest);
      setMessage(
        "Latest schedule loaded. You can select other versions from the dropdown."
      );
    } catch (err) {
      setScheduleId(null);
      setSchedules([]);
      setSlots([emptySlot]);
      setError(
        err.response?.status === 404
          ? "No schedule found. Create one."
          : "Failed to load schedule."
      );
    }
  };

  const handleSaveSchedule = async () => {
    setMessage("");
    setError("");

    if (!validateSlots()) {
      setError("Please fix the validation errors below before saving.");
      return;
    }

    const timetable = slots
      .filter((s) => s.date && s.startTime && s.endTime && s.topic?.trim())
      .map((s) => ({
        date: s.date,
        timeSlot: `${s.startTime}–${s.endTime}`,
        topic: s.topic.trim(),
        trainerId: s.trainerId?.trim() || undefined,
        courseId: s.courseId?.trim() || undefined,
      }));

    if (!batchId || timetable.length === 0) {
      setError("Please select a batch and add at least one valid slot.");
      return;
    }

    try {
      if (scheduleId) {
        const res = await api.put(`/schedule/${scheduleId}`, { timetable });
        setMessage(res.data.msg || "Schedule updated successfully.");
      } else {
        const res = await api.post("/schedule/create", { batchId, timetable });
        setScheduleId(res.data.schedule._id);
        setMessage(res.data.msg || "Schedule created successfully.");
      }
      handleLoadSchedule();
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to save schedule");
    }
  };

  return (
    <div className="space-y-8 p-4 sm:p-8">
      <Card
        title="Batch Schedule Management"
        subtitle="Plan and validate class sessions with no time conflicts."
      >
        {/* Global Messages - TOP POSITION */}
        <div className="space-y-4 mb-8">
          {message && (
            <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-6 shadow-xl">
              <div className="flex items-start gap-3">
                <svg
                  className="h-6 w-6 text-emerald-500 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm font-medium text-emerald-800 leading-relaxed">
                  {message}
                </p>
              </div>
            </div>
          )}
          {error && (
            <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-6 shadow-xl">
              <div className="flex items-start gap-3">
                <svg
                  className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm font-medium text-red-800 leading-relaxed">
                  {error}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Batch Selection Section */}
        <div className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-4">
            <div className="flex-1 space-y-3">
              <label className="text-sm font-medium text-slate-700">
                Batch
              </label>
              <select
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-slate-300"
                disabled={loadingBatches}
              >
                <option value="">Select a batch...</option>
                {batches.map((batch) => (
                  <option key={batch._id} value={batch._id}>
                    {batch.name} ({batch.batchId || "No ID"})
                  </option>
                ))}
              </select>
              {loadingBatches && (
                <p className="text-xs text-slate-500">Loading batches...</p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleLoadSchedule}
                disabled={!batchId}
                className="rounded-xl border-2 border-primary text-primary px-6 py-3 text-sm font-semibold shadow-sm hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Load Schedule
              </button>
              <button
                onClick={handleSaveSchedule}
                disabled={!batchId}
                className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {scheduleId ? "Update Schedule" : "Create Schedule"}
              </button>
            </div>
          </div>
        </div>

        {/* Time Slots Section */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-800">Time Slots</h3>
            <p className="text-sm text-slate-600">
              Add and configure individual class sessions below
            </p>
          </div>

          <div className="space-y-6">
            {slots.map((slot, idx) => (
              <div
                key={slot.id || idx}
                className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 ${validationErrors[idx]
                  ? "border-red-400 bg-red-50/80 shadow-red-200/50"
                  : "border-slate-200 bg-white/80 shadow-lg hover:border-primary/70"
                  } p-8`}
              >
                {/* Decorative gradient border */}
                <div
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-primary/5 to-transparent h-px top-0 transition-all duration-300 group-hover:h-2 pointer-events-none`}
                ></div>

                {/* Main slot fields */}
                <div className="grid gap-6 md:grid-cols-[1fr_1fr_1fr_1.5fr_1.5fr_auto] items-end">
                  <div className="space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Date
                    </label>
                    <input
                      type="date"
                      value={slot.date}
                      onChange={(e) =>
                        handleSlotChange(idx, "date", e.target.value)
                      }
                      className="w-full rounded-xl border-2 border-slate-200 bg-white px-5 py-4 text-sm shadow-sm transition-all focus:border-primary/60 focus:ring-4 focus:ring-primary/20 focus:outline-none hover:border-slate-300 hover:shadow-md"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) =>
                        handleSlotChange(idx, "startTime", e.target.value)
                      }
                      className="w-full rounded-xl border-2 border-slate-200 bg-white px-5 py-4 text-sm shadow-sm transition-all focus:border-primary/60 focus:ring-4 focus:ring-primary/20 focus:outline-none hover:border-slate-300 hover:shadow-md"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) =>
                        handleSlotChange(idx, "endTime", e.target.value)
                      }
                      className="w-full rounded-xl border-2 border-slate-200 bg-white px-5 py-4 text-sm shadow-sm transition-all focus:border-primary/60 focus:ring-4 focus:ring-primary/20 focus:outline-none hover:border-slate-300 hover:shadow-md"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Trainer
                    </label>
                    <select
                      value={slot.trainerId}
                      onChange={(e) => {
                        handleSlotChange(idx, "trainerId", e.target.value);
                        handleSlotChange(idx, "courseId", "");
                        handleSlotChange(idx, "topic", "");
                      }}
                      className="w-full rounded-xl border-2 border-slate-200 bg-white px-5 py-4 text-sm shadow-sm transition-all focus:border-primary/60 focus:ring-4 focus:ring-primary/20 focus:outline-none hover:border-slate-300 hover:shadow-md"
                    >
                      <option value="">Select trainer...</option>
                      {(() => {
                        const selectedBatch = batches.find(b => String(b._id) === String(batchId));
                        if (!selectedBatch || !selectedBatch.trainers) return trainers.map(t => (
                          <option key={t._id} value={t._id}>{t.name}</option>
                        ));

                        return trainers
                          .filter(t => selectedBatch.trainers.some(bt => String(bt._id || bt) === String(t._id)))
                          .map(t => (
                            <option key={t._id} value={t._id}>{t.name}</option>
                          ));
                      })()}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Course Topic
                    </label>
                    <select
                      value={slot.courseId}
                      disabled={!slot.trainerId}
                      onChange={(e) => {
                        const selectedCourse = courses.find(c => c._id === e.target.value);
                        handleSlotChange(idx, "courseId", e.target.value);
                        if (selectedCourse) {
                          handleSlotChange(idx, "topic", selectedCourse.title);
                        }
                      }}
                      className="w-full rounded-xl border-2 border-slate-200 bg-white px-5 py-4 text-sm shadow-sm transition-all focus:border-primary/60 focus:ring-4 focus:ring-primary/20 focus:outline-none hover:border-slate-300 hover:shadow-md disabled:bg-slate-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Select Topic</option>
                      {courses
                        .filter(c => c.trainerIds?.some(tid => String(tid._id || tid) === String(slot.trainerId)))
                        .map(c => (
                          <option key={c._id} value={c._id}>{c.title}</option>
                        ))}
                    </select>
                  </div>

                  <div className="flex items-end justify-center pb-1">
                    <button
                      type="button"
                      onClick={() => removeSlot(idx)}
                      className="group/remove p-3 rounded-xl border-2 border-red-100 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-200 transition-all"
                      title="Remove slot"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m7-10V4a1 1 0 00-1-1h-4M9 1v1a1 1 0 001 1h4a1 1 0 001-1V1z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Individual Slot Validation Error */}
                {validationErrors[idx] && (
                  <div className="mt-8 p-6 rounded-2xl border-2 border-red-200 bg-red-50 shadow-xl">
                    <div className="flex items-start gap-3">
                      <svg
                        className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="text-sm font-medium text-red-800 leading-relaxed">
                        {validationErrors[idx]}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add Slot Button */}
          <div className="pt-8 border-t-2 border-dashed border-slate-200">
            <button
              className="mx-auto flex w-fit items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-200 active:scale-98"
              onClick={addSlot}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Slot
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default HrSchedulePage;
