import React, { useState } from "react";
import api from "../../api";
import Card from "../../components/Card";
 
const emptySlot = {
  date: "",
  timeSlot: "",
  topic: "",
  trainerId: "",
  courseId: "",
};
 
const HrSchedulePage = () => {
  const [batchId, setBatchId] = useState("");
  const [scheduleId, setScheduleId] = useState(null);
  const [schedules, setSchedules] = useState([]); // store all schedules
  const [slots, setSlots] = useState([emptySlot]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
 
  const handleSlotChange = (index, field, value) => {
    const next = [...slots];
    next[index] = { ...next[index], [field]: value };
    setSlots(next);
  };
 
  const addSlot = () => {
    setSlots((prev) => [...prev, emptySlot]);
  };
 
  const removeSlot = (index) => {
    setSlots((prev) => prev.filter((_, i) => i !== index));
  };
 
  const loadScheduleIntoForm = (schedule) => {
    setScheduleId(schedule._id);
    setSlots(
      schedule.timetable.map((s) => ({
        date: s.date ? s.date.slice(0, 10) : "",
        timeSlot: s.timeSlot || "",
        topic: s.topic || "",
        trainerId: s.trainerId?.name || "",
        courseId: s.courseId?.title || "",
      }))
    );
  };
 
  const handleLoadSchedule = async () => {
    setMessage("");
    setError("");
    try {
      const res = await api.get(`/schedule/batch/${batchId}`);
      const all = res.data.schedules || []; // backend returns `schedules`
      setSchedules(all);
 
      const latest = all[0]; // newest (sorted in controller)
      if (!latest) {
        setScheduleId(null);
        setSlots([emptySlot]);
        setError("No schedule found. Create a new one.");
        return;
      }
 
      loadScheduleIntoForm(latest);
      setMessage("Existing schedule loaded for this batch.");
    } catch (err) {
      setScheduleId(null);
      setSchedules([]);
      setSlots([emptySlot]);
      setError(
        err.response?.status === 404
          ? "No schedule found. Create a new one."
          : err.response?.data?.msg || "Failed to load schedule"
      );
    }
  };
 
  const handleSaveSchedule = async () => {
    setMessage("");
    setError("");
    const timetable = slots
      .filter((s) => s.date && s.timeSlot && s.topic)
      .map((s) => ({
        date: s.date,
        timeSlot: s.timeSlot,
        topic: s.topic,
        trainerId: s.trainerId || undefined,
        courseId: s.courseId || undefined,
      }));
 
    if (!batchId || timetable.length === 0) {
      setError("Batch ID and at least one valid slot are required.");
      return;
    }
 
    try {
      if (scheduleId) {
        const res = await api.put(`/schedule/${scheduleId}`, { timetable });
        setMessage(res.data.msg || "Schedule updated successfully.");
      } else {
        const res = await api.post("/schedule/create", {
          batchId,
          timetable,
        });
        setScheduleId(res.data.schedule._id);
        setMessage(res.data.msg || "Schedule created successfully.");
      }
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to save schedule");
    }
  };
 
  return (
    <div className="space-y-4">
      <Card
        title="Batch schedule"
        subtitle="Plan sessions for each batch with dates, times, and topics."
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1 space-y-2">
            <label className="text-xs font-medium text-slate-600">
              Batch ID
            </label>
            <input
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary/40"
              placeholder="Enter batchId like Batch01"
            />
          </div>
          <button
            type="button"
            onClick={handleLoadSchedule}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Load schedule
          </button>
          <button
            type="button"
            onClick={handleSaveSchedule}
            className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary/90"
          >
            {scheduleId ? "Update schedule" : "Create schedule"}
          </button>
        </div>
 
        {/*Schedule selector */}
        {schedules.length > 0 && (
          <div className="mt-3 space-y-1">
            <label className="text-xs font-medium text-slate-600">
              Select schedule
            </label>
            <select
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
              value={scheduleId || ""}
              onChange={(e) => {
                const selected = schedules.find(
                  (s) => s._id === e.target.value
                );
                if (selected) {
                  loadScheduleIntoForm(selected);
                  setMessage("Schedule loaded.");
                }
              }}
            >
              {schedules.map((s, i) => {
                const dateLabel = new Date(s.createdAt).toLocaleDateString(); // only date
                return (
                  <option key={s._id} value={s._id}>
                    {`Schedule ${i + 1} – ${dateLabel}`}
                  </option>
                );
              })}
            </select>
          </div>
        )}
 
        <div className="mt-5 space-y-3">
          {slots.map((slot, idx) => (
            <div
              key={idx}
              className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1.1fr,0.9fr,1.4fr,auto]"
            >
              <input
                type="date"
                value={slot.date}
                onChange={(e) => handleSlotChange(idx, "date", e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/40"
              />
              <input
                placeholder="Time slot (e.g. 10:00–12:00)"
                value={slot.timeSlot}
                onChange={(e) =>
                  handleSlotChange(idx, "timeSlot", e.target.value)
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/40"
              />
              <input
                placeholder="Topic"
                value={slot.topic}
                onChange={(e) => handleSlotChange(idx, "topic", e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/40"
              />
              <button
                type="button"
                onClick={() => removeSlot(idx)}
                className="self-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-600 hover:bg-slate-100"
              >
                Remove
              </button>
              <input
                placeholder="Trainer Name (optional)"
                value={slot.trainerId || ""} //CHANGE: Use slot.trainerId (string), NOT slot.trainerId?.name
                onChange={
                  (e) => handleSlotChange(idx, "trainerId", e.target.value) //Keeps name as string for backend
                }
                className="md:col-span-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/40"
              />
              <input
                placeholder="Course Name (optional)"
                value={slot.courseId || ""} //CHANGE: Use slot.courseId (string), NOT slot.courseId?.title
                onChange={
                  (e) => handleSlotChange(idx, "courseId", e.target.value) //Keeps title as string for backend
                }
                className="md:col-span-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/40"
              />
            </div>
          ))}
        </div>
 
        <button
          type="button"
          onClick={addSlot}
          className="mt-4 rounded-full border border-dashed border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          + Add slot
        </button>
 
        {message && (
          <p className="mt-3 rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            {message}
          </p>
        )}
        {error && (
          <p className="mt-3 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}
      </Card>
    </div>
  );
};
 
export default HrSchedulePage;
 