import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";

const HRTrainerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [trainer, setTrainer] = useState(null);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTrainerProfile = async () => {
    try {
      setLoading(true);

      // ✅ SINGLE SOURCE OF TRUTH
      const res = await api.get(`/hr/trainers/${id}`);

      setTrainer(res.data.trainer);
      setBatches(res.data.batches || []);
    } catch (err) {
      console.error("Fetch trainer profile error:", err);
      setError("Failed to load trainer profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainerProfile();
  }, [id]);

  if (loading) {
    return <p className="p-6">Loading trainer profile...</p>;
  }

  if (error) {
    return <p className="p-6 text-red-600">{error}</p>;
  }

  if (!trainer) {
    return <p className="p-6">Trainer not found</p>;
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{trainer.name}</h1>
          <p className="text-sm text-gray-600">{trainer.email}</p>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="text-sm text-primary underline"
        >
          ← Back
        </button>
      </div>

      {/* BATCH COUNT */}
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold">
          {batches.length} {batches.length === 1 ? "Batch" : "Batches"}
        </p>
      </div>

      {/* BATCH LIST */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Assigned Batches</h2>

        {batches.length === 0 ? (
          <p className="text-sm text-gray-500">
            This trainer is not assigned to any batch yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {batches.map((batch) => (
              <li
                key={batch._id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-primary/50 hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors">
                      {batch.name}
                    </h3>

                    <div className="mt-1 flex flex-wrap gap-2 items-center">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                        ID: {batch.batchId || <span className="text-red-400 italic">N/A</span>}
                      </span>

                      {batch.startDate && batch.endDate && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(batch.startDate).toLocaleDateString()} — {new Date(batch.endDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default HRTrainerProfile;
