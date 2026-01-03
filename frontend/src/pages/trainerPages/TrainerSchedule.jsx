import { useEffect, useState } from "react";
import api from "../../api";
import Card from "../../components/Card";

function TrainerSchedule({ batchId }) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  /* =========================
     FETCH SCHEDULE BY BATCH
  ========================= */
  useEffect(() => {
    const fetchSchedule = async () => {
      if (!batchId) {
        setError("No batch selected.");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const res = await api.get(`/schedule/batch/${batchId}`);
        setSchedules(res.data.schedules || []);
      } catch (err) {
        setError(
          err.response?.data?.msg ||
            "Failed to load schedule for this batch"
        );
        setSchedules([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [batchId, reloadKey]);

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
        <p className="mb-3 text-sm text-slate-500">
          No schedules found for this batch.
        </p>
        <button
          onClick={() => setReloadKey((k) => k + 1)}
          className="rounded bg-primary px-4 py-1 text-xs font-medium text-white"
        >
          Refresh
        </button>
      </Card>
    );
  }

  /* =========================
     RENDER
  ========================= */
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            Schedules for{" "}
            <span className="text-primary">Batch {batchId}</span>
          </h2>
          <p className="text-xs text-slate-500">
            Total schedules: {schedules.length}
          </p>
        </div>
        <button
          onClick={() => setReloadKey((k) => k + 1)}
          className="rounded bg-primary px-3 py-1 text-xs font-medium text-white"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-4">
        {schedules.map((schedule) => (
          <div
            key={schedule._id}
            className="rounded border border-slate-200 p-4 text-sm"
          >
            <div className="mb-2 flex justify-between">
              <p className="font-medium text-slate-800">
                Schedule #{schedule._id.slice(-6)}
              </p>
              <p className="text-xs text-slate-500">
                {new Date(
                  schedule.updatedAt || schedule.createdAt
                ).toLocaleString()}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead>
                  <tr className="border-b bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
                    <th className="px-2 py-1">Date</th>
                    <th className="px-2 py-1">Time</th>
                    <th className="px-2 py-1">Topic</th>
                    <th className="px-2 py-1">Course</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.timetable.map((slot, idx) => (
                    <tr key={idx} className="border-b last:border-0">
                      <td className="px-2 py-1">
                        {slot.date
                          ? new Date(slot.date).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-2 py-1">
                        {slot.timeSlot || "-"}
                      </td>
                      <td className="px-2 py-1">
                        {slot.topic || "-"}
                      </td>
                      <td className="px-2 py-1">
                        {slot.courseId?.title || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default TrainerSchedule;
