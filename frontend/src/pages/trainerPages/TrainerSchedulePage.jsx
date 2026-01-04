import { useEffect, useState } from "react";
import api from "../../api";
import Card from "../../components/Card";

const TrainerSchedulePage = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  /* =========================
     FETCH TRAINER SCHEDULES
     (ALL BATCHES)
  ========================= */
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setLoading(true);
        setError("");

        // Trainer-specific API
        const res = await api.get("/schedule/trainer/my");
        setSchedules(res.data.schedules || []);
      } catch (err) {
        setError(
          err.response?.data?.msg || "Failed to load trainer schedules"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, [reloadKey]);

  /* =========================
     STATES
  ========================= */
  if (loading) {
    return (
      <Card>
        <p className="text-sm text-slate-500">Loading schedules...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <p className="mb-3 text-sm text-red-600">{error}</p>
        <button
          onClick={() => setReloadKey((k) => k + 1)}
          className="rounded bg-primary px-4 py-1 text-xs font-medium text-white"
        >
          Retry
        </button>
      </Card>
    );
  }

  if (!schedules.length) {
    return (
      <Card>
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
        <Card key={schedule._id}>
          {/* Batch Info */}
          <div className="mb-3">
            <h2 className="text-base font-semibold text-primary">
              Batch: {schedule.batchId?.batchId} – {schedule.batchId?.name}
            </h2>
            <p className="text-xs text-slate-500">
              Last updated:{" "}
              {new Date(
                schedule.updatedAt || schedule.createdAt
              ).toLocaleString()}
            </p>
          </div>

          {/* Timetable */}
          {schedule.timetable?.length === 0 ? (
            <p className="text-xs text-slate-500">
              No timetable entries for this batch.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs border">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-2 py-1 text-left">Date</th>
                    <th className="px-2 py-1 text-left">Time</th>
                    <th className="px-2 py-1 text-left">Topic</th>
                    <th className="px-2 py-1 text-left">Course</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.timetable.map((slot, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-2 py-1">
                        {slot.date
                          ? new Date(slot.date).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-2 py-1">{slot.timeSlot || "-"}</td>
                      <td className="px-2 py-1">{slot.topic || "-"}</td>
                      <td className="px-2 py-1">
                        {slot.courseId?.title || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

export default TrainerSchedulePage;
