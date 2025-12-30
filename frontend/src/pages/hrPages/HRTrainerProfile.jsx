import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../../api";

export default function HRTrainerProfile() {
  const { id } = useParams();
  const [trainer, setTrainer] = useState(null);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrainerProfile = async () => {
      try {
        const res = await api.get(`/hr/trainers/${id}`);
        setTrainer(res.data.trainer);
        setBatches(res.data.batches || []);
      } catch (err) {
        console.error("Fetch trainer profile error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrainerProfile();
  }, [id]);

  if (loading) {
    return <p className="text-sm text-slate-500">Loading trainer profile…</p>;
  }

  if (!trainer) {
    return <p className="text-sm text-red-500">Trainer not found</p>;
  }

  return (
    <div className="space-y-6">
      {/* ================= BASIC INFO ================= */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-800">
          Trainer Profile
        </h2>

        <div className="mt-3 space-y-1 text-sm text-slate-700">
          <p>
            <b>Name:</b> {trainer.name}
          </p>
          <p>
            <b>Email:</b> {trainer.email}
          </p>
          <p>
            <b>Role:</b> "TRAINER"
          </p>
          <p>
            <b>Joined on:</b>{" "}
            {new Date(trainer.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* ================= BATCHES ================= */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-sm font-semibold text-slate-700">
          Batches Teaching ({batches.length})
        </h3>

        {batches.length === 0 && (
          <p className="text-sm text-slate-500">
            No batches assigned to this trainer
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {batches.map((batch) => (
            <div
              key={batch._id}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4 hover:bg-white hover:shadow-sm transition"
            >
              <h4 className="text-sm font-semibold text-slate-800">
                {batch.name}
              </h4>

              <p className="mt-1 text-xs text-slate-600">
                Batch ID: {batch.batchId}
              </p>

              <p className="mt-1 text-xs text-slate-600">
                Duration:{" "}
                {new Date(batch.startDate).toLocaleDateString()} →{" "}
                {new Date(batch.endDate).toLocaleDateString()}
              </p>

              {/* OPTIONAL: VIEW BATCH */}
              <div className="mt-3">
                <Link
                  to={`/hr/batches/${batch._id}`}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  View batch →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
