import { useEffect, useState, useMemo } from "react";
import api from "../../api";
import Card from "../../components/Card";

const TrainerSchedulePage = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedBatchId, setSelectedBatchId] = useState(null);

  /* =========================
     FETCH TRAINER SCHEDULES
  ========================= */
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await api.get("/schedule/trainer/my");
        setSchedules(res.data.schedules || []);
      } catch (err) {
        setError(err.response?.data?.msg || "Failed to load trainer schedules");
      } finally {
        setLoading(false);
      }
    };
    fetchSchedules();
  }, [reloadKey]);

  /* =========================
     GROUP BY BATCH
  ========================= */
  const batchGroups = useMemo(() => {
    const groups = {};
    schedules.forEach((s) => {
      const bId = s.batchId?._id;
      if (!bId) return;
      if (!groups[bId]) {
        groups[bId] = {
          batch: s.batchId,
          lastUpdated: s.updatedAt || s.createdAt,
          timetable: [],
        };
      }
      // Combine all timetable slots
      if (Array.isArray(s.timetable)) {
        groups[bId].timetable = [...groups[bId].timetable, ...s.timetable];
      }
      // Update lastUpdated to most recent
      const currentLast = new Date(groups[bId].lastUpdated);
      const newLast = new Date(s.updatedAt || s.createdAt);
      if (newLast > currentLast) groups[bId].lastUpdated = s.updatedAt || s.createdAt;
    });

    // Sort timetable by date
    Object.values(groups).forEach(g => {
      g.timetable.sort((a, b) => new Date(a.date) - new Date(b.date));
    });

    return Object.values(groups);
  }, [schedules]);

  const selectedGroup = useMemo(() => {
    return batchGroups.find(g => g.batch._id === selectedBatchId);
  }, [batchGroups, selectedBatchId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="ml-3 text-slate-500">Loading schedules...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="text-center p-8">
        <p className="mb-4 text-red-600">{error}</p>
        <button
          onClick={() => setReloadKey((k) => k + 1)}
          className="rounded-xl bg-primary px-6 py-2 text-white font-semibold transition hover:bg-primary/90"
        >
          Retry
        </button>
      </Card>
    );
  }

  if (!batchGroups.length) {
    return (
      <Card className="text-center p-12">
        <div className="text-5xl mb-4">📅</div>
        <h3 className="text-lg font-bold text-slate-800">No schedules found</h3>
        <p className="text-slate-500 mt-2">You haven't been assigned any batch schedules yet.</p>
      </Card>
    );
  }

  /* =========================
     DETAIL VIEW
  ========================= */
  if (selectedBatchId && selectedGroup) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <button
          onClick={() => setSelectedBatchId(null)}
          className="flex items-center text-primary font-semibold hover:underline bg-primary/5 px-4 py-2 rounded-lg"
        >
          ← Back to Batches
        </button>

        <Card>
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b pb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                {selectedGroup.batch.name}
              </h2>
              <p className="text-slate-500 font-medium text-sm sm:text-base">Batch ID: {selectedGroup.batch.batchId}</p>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full w-fit">
              Last updated: {new Date(selectedGroup.lastUpdated).toLocaleString()}
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
                <tr>
                  <th className="px-4 sm:px-6 py-4 text-left">Date</th>
                  <th className="px-4 sm:px-6 py-4 text-left">Time</th>
                  <th className="px-4 sm:px-6 py-4 text-left">Topic</th>
                  <th className="px-4 sm:px-6 py-4 text-left">Course</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-700">
                {selectedGroup.timetable.map((slot, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap font-medium">
                      {slot.date ? new Date(slot.date).toLocaleDateString("en-GB", {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      }) : "-"}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">{slot.timeSlot || "-"}</td>
                    <td className="px-4 sm:px-6 py-4 text-primary font-medium min-w-[120px]">{slot.topic || "-"}</td>
                    <td className="px-4 sm:px-6 py-4">
                      {slot.courseId?.title ? (
                        <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold border border-emerald-100 block sm:inline-block w-fit">
                          {slot.courseId.title}
                        </span>
                      ) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  /* =========================
     BATCH CARDS LIST
  ========================= */
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {batchGroups.map((group) => (
        <div
          key={group.batch._id}
          onClick={() => setSelectedBatchId(group.batch._id)}
          className="group relative cursor-pointer bg-white rounded-2xl border border-slate-200 p-6 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 hover:border-primary/30"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-primary/5 rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>

          <h3 className="text-xl font-bold text-slate-800 line-clamp-1">{group.batch.name}</h3>
          <p className="text-sm text-slate-500 font-medium mb-4">ID: {group.batch.batchId}</p>

          <div className="flex items-center gap-4 border-t pt-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Sessions</p>
              <p className="text-lg font-bold text-slate-700">{group.timetable.length}</p>
            </div>
            <div className="h-8 w-px bg-slate-100"></div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Updated</p>
              <p className="text-sm font-bold text-slate-600">
                {new Date(group.lastUpdated).toLocaleDateString("en-GB", { day: '2-digit', month: 'short' })}
              </p>
            </div>
          </div>

          <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-primary text-sm font-bold flex items-center gap-1">
              View Schedule
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TrainerSchedulePage;
