import { useEffect, useState } from "react";
import axios from "axios";

function TrainerSchedule({ batchId }) {
  const [schedules, setSchedules] = useState([]); // array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0); // used to force refetch

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        if (!batchId) {
          setLoading(false);
          setError("No batch selected for this trainer.");
          return;
        }

        setLoading(true);
        setError("");
        const token = localStorage.getItem("token");

        const res = await axios.get(
          `http://localhost:5000/api/schedule/batch/${batchId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setSchedules(res.data.schedules || []);
      } catch (err) {
        setError(
          err.response?.data?.msg || err.message || "Failed to load schedule"
        );
        setSchedules([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [batchId, reloadKey]);

  if (loading)
    return (
      <div className="rounded-md bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Loading schedules...</p>
      </div>
    );

  if (error)
    return (
      <div className="rounded-md bg-white p-6 shadow-sm">
        <div className="mb-3 text-sm text-red-600">{error}</div>
        <button
          onClick={() => setReloadKey((k) => k + 1)}
          className="rounded bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );

  if (!schedules.length)
    return (
      <div className="rounded-md bg-white p-6 shadow-sm">
        <div className="mb-3 text-sm text-slate-500">
          No schedules found for this batch.
        </div>
        <button
          onClick={() => setReloadKey((k) => k + 1)}
          className="rounded bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary/90"
        >
          Refresh
        </button>
      </div>
    );

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Schedules for{" "}
            <span className="text-primary">Batch: {batchId}</span>
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Total schedules: {schedules.length}
          </p>
        </div>
        <button
          onClick={() => setReloadKey((k) => k + 1)}
          className="rounded bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary/90"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-4">
        {schedules.map((sch) => (
          <div
            key={sch._id}
            className="rounded border border-slate-200 p-4 text-sm"
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="font-medium text-slate-800">
                Schedule #{sch._id.slice(-6)}
              </p>
              <p className="text-xs text-slate-500">
                Last updated:{" "}
                {sch.updatedAt
                  ? new Date(sch.updatedAt).toLocaleString()
                  : new Date(sch.createdAt).toLocaleString()}
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
                  {sch.timetable.map((slot, idx) => (
                    <tr key={idx} className="border-b last:border-0">
                      <td className="px-2 py-1 text-slate-700">
                        {slot.date
                          ? new Date(slot.date).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-2 py-1 text-slate-700">
                        {slot.timeSlot || "-"}
                      </td>
                      <td className="px-2 py-1 text-slate-800">
                        {slot.topic || "-"}
                      </td>
                      <td className="px-2 py-1 text-slate-600">
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
    </div>
  );
}

export default TrainerSchedule;
