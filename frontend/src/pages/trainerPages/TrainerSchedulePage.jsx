import { useEffect, useState } from "react";
import api from "../../api";
import Card from "../../components/Card";

const TrainerSchedulePage = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =========================
     FETCH TRAINER SCHEDULE
     Backend decides using req.user
  ========================= */
  const loadSchedule = async () => {
    try {
      setLoading(true);
      setError("");

      // 🔑 Trainer-specific API (no batchId from frontend)
      const res = await api.get("/schedule/trainer/my");

      setSchedules(res.data.schedules || []);
    } catch (err) {
      setError(
        err.response?.data?.msg ||
        "Failed to load your schedule"
      );
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, []);

  /* =========================
     UI STATES
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
        <p className="mb-3 text-sm text-red-600">{error}</p>
        <button
          onClick={loadSchedule}
          className="rounded bg-primary px-4 py-1 text-xs font-medium text-white"
        >
          Retry
        </button>
      </Card>
    );
  }

  if (!schedules.length) {
    return (
      <Card title="My Schedule">
        <p className="text-sm text-slate-500">
          No schedules assigned to you yet.
        </p>
      </Card>
    );
  }

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="space-y-4">
      {schedules.map((schedule) => (
        <Card
          key={schedule._id}
          title={`Batch Schedule`}
          subtitle={`Last updated: ${new Date(
            schedule.updatedAt || schedule.createdAt
          ).toLocaleString()}`}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="border-b bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
                  <th className="px-2 py-2">Date</th>
                  <th className="px-2 py-2">Time</th>
                  <th className="px-2 py-2">Topic</th>
                  <th className="px-2 py-2">Course</th>
                </tr>
              </thead>
              <tbody>
                {schedule.timetable.map((slot, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="px-2 py-2">
                      {slot.date
                        ? new Date(slot.date).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-2 py-2">
                      {slot.timeSlot || "-"}
                    </td>
                    <td className="px-2 py-2">
                      {slot.topic || "-"}
                    </td>
                    <td className="px-2 py-2">
                      {slot.courseId?.title || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default TrainerSchedulePage;
