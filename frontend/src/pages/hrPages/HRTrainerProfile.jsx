import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../../api";

export default function HRTrainerProfile() {
  const { id } = useParams();
  const [trainer, setTrainer] = useState(null);
  const [allBatches, setAllBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignLoading, setAssignLoading] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedBatchIds, setSelectedBatchIds] = useState([]);

  useEffect(() => {
    const fetchTrainerProfile = async () => {
      try {
        // Fetch trainer profile (populates trainerBatches)
        const trainerRes = await api.get(`/hr/trainers/${id}`);
        setTrainer(trainerRes.data.trainer);
        
        // Fetch ALL batches for assignment
        const batchesRes = await api.get('/hr/batches');
        setAllBatches(Array.isArray(batchesRes.data) 
          ? batchesRes.data 
          : batchesRes.data.batches || []
        );
        
        // Pre-select current trainer batches
        if (trainerRes.data.trainer?.trainerBatches) {
          setSelectedBatchIds(trainerRes.data.trainer.trainerBatches.map(b => b._id));
        }
      } catch (err) {
        console.error("Fetch trainer profile error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrainerProfile();
  }, [id]);

  const handleAssignToggle = () => {
    setShowAssignForm(!showAssignForm);
  };

  const handleBatchChange = (batchId) => {
    setSelectedBatchIds(prev =>
      prev.includes(batchId)
        ? prev.filter(id => id !== batchId)
        : [...prev, batchId]
    );
  };

  const handleAssignBatches = async () => {
    if (selectedBatchIds.length === 0) {
      alert("Please select at least one batch");
      return;
    }

    setAssignLoading(true);
    try {
      // ✅ NEW ENDPOINT: PUT /hr/trainers/:id/batches
      await api.put(`/hr/trainers/${id}/batches`, { batchIds: selectedBatchIds });
      
      // Update local trainer state
      setTrainer(prev => ({ 
        ...prev, 
        trainerBatches: allBatches.filter(b => selectedBatchIds.includes(b._id)) 
      }));
      
      setShowAssignForm(false);
      alert(`✅ ${selectedBatchIds.length} batch(es) assigned successfully!`);
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to assign batches');
    } finally {
      setAssignLoading(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Loading trainer profile…</p>;
  }

  if (!trainer) {
    return <p className="text-sm text-red-500">Trainer not found</p>;
  }

  const currentBatches = trainer.trainerBatches || [];

  return (
    <div className="space-y-6">
      {/* ================= BASIC INFO + ASSIGN BUTTON ================= */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Trainer Profile</h2>
            <p className="text-sm text-slate-600 mt-1">
              Manage batches for <span className="font-semibold">{trainer.name}</span>
            </p>
          </div>
          <button
            onClick={handleAssignToggle}
            className="rounded-full bg-emerald-500 hover:bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors"
          >
            {showAssignForm ? 'Cancel' : `Assign Batches (${currentBatches.length})`}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-xs text-slate-500 block">Name</span>
            <span className="font-semibold">{trainer.name}</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Email</span>
            <span>{trainer.email}</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Role</span>
            <span className="font-semibold text-primary">TRAINER</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Joined</span>
            <span>{new Date(trainer.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* ================= ASSIGN BATCHES FORM ================= */}
      {showAssignForm && (
        <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/50 p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center">
            <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
            Assign Batches (Multi-select)
          </h3>
          
          <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-lg p-4 bg-white mb-4">
            {allBatches.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No batches available</p>
            ) : (
              allBatches.map((batch) => (
                <label key={batch._id} className="flex items-center p-3 hover:bg-slate-50 rounded-lg cursor-pointer mb-2 transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedBatchIds.includes(batch._id)}
                    onChange={() => handleBatchChange(batch._id)}
                    className="w-5 h-5 text-emerald-500 rounded border-slate-300 focus:ring-emerald-500 mr-3"
                  />
                  <div>
                    <div className="font-medium text-sm text-slate-900">{batch.name}</div>
                    <div className="text-xs text-slate-500">
                      {new Date(batch.startDate).toLocaleDateString()} → {new Date(batch.endDate).toLocaleDateString()}
                    </div>
                  </div>
                </label>
              ))
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={handleAssignBatches}
              disabled={assignLoading || selectedBatchIds.length === 0}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2.5 rounded-lg text-sm font-semibold text-white shadow-sm transition-all"
            >
              {assignLoading ? 'Assigning...' : `Assign ${selectedBatchIds.length} Batches`}
            </button>
            <button
              onClick={handleAssignToggle}
              className="px-6 py-2.5 text-sm font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ================= CURRENT BATCHES ================= */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="mb-6 text-sm font-semibold text-slate-700 flex items-center">
          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
          Current Batches ({currentBatches.length})
        </h3>

        {currentBatches.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
            <p className="text-lg text-slate-500 mb-2">No batches assigned</p>
            <p className="text-sm text-slate-400">
              Click "Assign Batches" above to get started
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {currentBatches.map((batch) => (
              <div
                key={batch._id}
                className="group rounded-lg border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-5 hover:shadow-md hover:border-slate-300 transition-all"
              >
                <h4 className="text-sm font-semibold text-slate-900 mb-1">{batch.name}</h4>
                <p className="text-xs text-slate-500 mb-2">
                  {new Date(batch.startDate).toLocaleDateString()} → {new Date(batch.endDate).toLocaleDateString()}
                </p>
                <Link
                  to={`/hr/batches/${batch._id}`}
                  className="text-xs font-medium text-primary hover:text-primary/80 group-hover:underline transition-colors"
                >
                  View batch →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
