import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api";

const HRBatchDetails = () => {
  const { id } = useParams();

  const [batch, setBatch] = useState(null);
  const [unassignedInterns, setUnassignedInterns] = useState([]);
  const [unassignedTrainers, setUnassignedTrainers] = useState([]);
  const [selectedInterns, setSelectedInterns] = useState([]);
  const [selectedTrainers, setSelectedTrainers] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ================= FETCH BATCH ================= */
  const fetchBatch = async () => {
    const res = await api.get(`/batches/${id}`);
    setBatch(res.data.batch);
  };

  /* ================= FETCH UNASSIGNED USERS ================= */
  const fetchUnassignedUsers = async () => {
    const res = await api.get("/batches/unassigned-users");
    setUnassignedInterns(res.data.interns || []);
    setUnassignedTrainers(res.data.trainers || []);
  };

  useEffect(() => {
    fetchBatch();
    fetchUnassignedUsers();
  }, [id]);

  /* ================= TOGGLE CHECKBOX ================= */
  const toggle = (id, list, setList) => {
    setList(
      list.includes(id)
        ? list.filter((x) => x !== id)
        : [...list, id]
    );
  };

  /* ================= ASSIGN USERS ================= */
  const assignUsers = async () => {
    setLoading(true);
    try {
      await api.post(`/batches/${id}/assign`, {
        internIds: selectedInterns,
        trainerIds: selectedTrainers
      });

      setSelectedInterns([]);
      setSelectedTrainers([]);
      await fetchBatch();
      await fetchUnassignedUsers();
    } finally {
      setLoading(false);
    }
  };

  /* ================= REMOVE USER ================= */
  const removeUser = async (userId, role) => {
    if (!window.confirm("Remove this user from the batch?")) return;
    await api.post(`/batches/${id}/remove`, { userId, role });
    fetchBatch();
    fetchUnassignedUsers();
  };

  if (!batch) return <p className="p-6">Loading batch details…</p>;

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-semibold">{batch.name}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {new Date(batch.startDate).toLocaleDateString()} →{" "}
          {new Date(batch.endDate).toLocaleDateString()}
        </p>

        <div className="flex gap-6 mt-4">
          <div className="bg-gray-100 rounded-lg px-4 py-2 text-sm">
            <span className="font-semibold">{batch.interns.length}</span>{" "}
            Interns
          </div>
          <div className="bg-gray-100 rounded-lg px-4 py-2 text-sm">
            <span className="font-semibold">{batch.trainers.length}</span>{" "}
            Trainers
          </div>
        </div>
      </div>

      {/* ASSIGNED USERS */}
      <div className="grid grid-cols-2 gap-6">
        {/* Trainers */}
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-semibold mb-4">Assigned Trainers</h3>
          {batch.trainers.length === 0 ? (
            <p className="text-sm text-gray-400">No trainers assigned</p>
          ) : (
            <ul className="space-y-3">
              {batch.trainers.map((t) => (
                <li
                  key={t._id}
                  className="flex justify-between items-center text-sm border-b pb-2"
                >
                  <span>
                    {t.name}
                    <span className="text-gray-400">
                      {" "}
                      ({t.email})
                    </span>
                  </span>
                  <button
                    onClick={() => removeUser(t._id, "TRAINER")}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Interns */}
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-semibold mb-4">Assigned Interns</h3>
          {batch.interns.length === 0 ? (
            <p className="text-sm text-gray-400">No interns assigned</p>
          ) : (
            <ul className="space-y-3">
              {batch.interns.map((i) => (
                <li
                  key={i._id}
                  className="flex justify-between items-center text-sm border-b pb-2"
                >
                  <span>
                    {i.name}
                    <span className="text-gray-400">
                      {" "}
                      ({i.email})
                    </span>
                  </span>
                  <button
                    onClick={() => removeUser(i._id, "Intern")}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ASSIGN USERS */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="font-semibold mb-4">Add People to Batch</h3>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium mb-2">Available Trainers</p>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {unassignedTrainers.map((t) => (
                <label
                  key={t._id}
                  className="flex items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedTrainers.includes(t._id)}
                    onChange={() =>
                      toggle(
                        t._id,
                        selectedTrainers,
                        setSelectedTrainers
                      )
                    }
                  />
                  {t.name}
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Available Interns</p>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {unassignedInterns.map((i) => (
                <label
                  key={i._id}
                  className="flex items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedInterns.includes(i._id)}
                    onChange={() =>
                      toggle(
                        i._id,
                        selectedInterns,
                        setSelectedInterns
                      )
                    }
                  />
                  {i.name}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={assignUsers}
            disabled={
              loading ||
              (!selectedInterns.length && !selectedTrainers.length)
            }
            className="px-6 py-2 bg-black text-white rounded disabled:opacity-50"
          >
            {loading ? "Assigning…" : "Assign Selected"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HRBatchDetails;
