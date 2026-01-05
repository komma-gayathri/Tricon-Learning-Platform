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
                className="rounded-md border p-3"
              >
                <p className="font-medium">{batch.name}</p>
                <p className="text-xs text-gray-500">
                  Batch ID: {batch.batchId}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default HRTrainerProfile;
