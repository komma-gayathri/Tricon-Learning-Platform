import { useEffect, useState } from "react";
import api from "../../api";
import Card from "../../components/Card";

const InternSchedulePage = () => {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await api.get("/schedule/intern/my");
        const schedules = res.data.schedules || [];

        // always take latest schedule
        setSchedule(schedules.length > 0 ? schedules[0] : null);
      } catch (err) {
        setError(err.response?.data?.msg || "Failed to load schedule");
      } finally {
        setLoading(false);
      }
    };

    loadSchedule();
  }, []);

  /* =========================
     STATES
  ========================= */
  if (loading) {
    return (
      <Card title="My Schedule">
        <p className="text-sm text-slate-500">Loading schedule...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="My Schedule">
        <p className="text-sm text-red-600">{error}</p>
      </Card>
    );
  }

  if (!schedule) {
    return (
      <Card title="My Schedule">
        <p className="text-sm text-slate-500">
          No schedule available for your batch.
        </p>
      </Card>
    );
  }

  /* =========================
     RENDER
  ========================= */
  return (
    <Card title="My Schedule" subtitle="Your batch sessions">
      <div className="space-y-4">
        {!Array.isArray(schedule.timetable) ||
        schedule.timetable.length === 0 ? (
          <p className="text-sm text-slate-500">
            No sessions scheduled yet.
          </p>
        ) : (
          schedule.timetable.map((slot, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              {/* HEADER */}
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">
                  {slot.topic || "Session"}
                </h3>
                <span className="text-xs text-slate-500">
                  {slot.date
                    ? new Date(slot.date).toLocaleDateString()
                    : "Date not set"}
                </span>
              </div>

              {/* DETAILS */}
              <div className="grid gap-2 text-xs text-slate-600 md:grid-cols-2">
                <p>
                  <span className="font-medium">Time:</span>{" "}
                  {slot.timeSlot || "Not specified"}
                </p>

                <p>
                  <span className="font-medium">Course:</span>{" "}
                  {slot.courseId?.title || "Not assigned"}
                </p>

                <p>
                  <span className="font-medium">Trainer:</span>{" "}
                  {slot.trainerId?.name || "Not assigned"}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default InternSchedulePage;
