import { useEffect, useState } from "react";
import api from "../../api";
import Card from "../../components/Card";
import TrainerSchedule from "./TrainerSchedule";

const TrainerSchedulePage = () => {
  const [batch, setBatch] = useState(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadBatch = async () => {
      try {
        const me = await api.get("/auth/me");
        const batchId = me.data?.user?.batchId;

        if (!batchId) {
          setError("No batch assigned to this trainer.");
          return;
        }

        const res = await api.get("/batch");
        const assignedBatch = res.data.batches.find(
          (b) => b._id === batchId
        );

        setBatch(assignedBatch || null);
      } catch {
        setError("Failed to load trainer batch.");
      }
    };

    loadBatch();
  }, []);

  return (
    <div className="space-y-6">
      {/* BATCH CARD */}
      <Card title="My Schedule" subtitle="Select your batch to view schedule">
        {error && <p className="text-sm text-red-600">{error}</p>}

        {batch && (
          <div
            onClick={() => setShowSchedule(true)}
            className="cursor-pointer rounded-xl border p-4 hover:shadow transition"
          >
            <h3 className="font-semibold">{batch.name}</h3>
            <p className="text-xs text-slate-500">
              Batch Code: {batch.batchId}
            </p>
            <p className="mt-1 text-xs text-primary">
              Click to view schedule →
            </p>
          </div>
        )}
      </Card>

      {/* SCHEDULE LOADS ONLY AFTER CLICK */}
      {showSchedule && batch && (
        <TrainerSchedule batchId={batch.batchId} />
      )}
    </div>
  );
};

export default TrainerSchedulePage;
