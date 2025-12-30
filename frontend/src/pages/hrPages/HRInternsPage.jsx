import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";

export default function HRInternsPage() {
  const navigate = useNavigate();

  const [interns, setInterns] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [batchId, setBatchId] = useState("");

  /* =========================
     FETCH INTERNS
  ========================= */
  const fetchInterns = async () => {
    try {
      const res = await api.get("/hr/interns");
      setInterns(res.data?.users || []);
    } catch (err) {
      console.error("Fetch interns error:", err);
      setInterns([]);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     FETCH BATCHES (DROPDOWN)
  ========================= */
  const fetchBatches = async () => {
    try {
      const res = await api.get("/hr/batches");

      // supports both: res.json(batches) OR res.json({ batches })
      const batchList = Array.isArray(res.data)
        ? res.data
        : res.data?.batches || [];

      setBatches(batchList);
    } catch (err) {
      console.error("Fetch batches error:", err);
      setBatches([]);
    }
  };

  useEffect(() => {
    fetchInterns();
    fetchBatches();
  }, []);

  /* =========================
     CREATE INTERN
  ========================= */
  const handleCreateIntern = async (e) => {
    e.preventDefault();

    try {
      await api.post("/hr/interns", {
        name,
        email,
        password,
        batchId
      });

      // reset form
      setName("");
      setEmail("");
      setPassword("");
      setBatchId("");

      fetchInterns();
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to create intern");
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* ================= CREATE INTERN ================= */}
      <div className="bg-white shadow-md rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Create Intern</h2>

        <form
          onSubmit={handleCreateIntern}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <input
            className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            placeholder="Intern Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {/* 🔽 BATCH DROPDOWN */}
          <select
            className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            required
          >
            <option value="">Select Batch</option>
            {batches.map((batch) => (
              <option key={batch._id} value={batch._id}>
                {batch.name}
              </option>
            ))}
          </select>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Create Intern
            </button>
          </div>
        </form>
      </div>

      {/* ================= INTERN CARDS ================= */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Interns</h2>

        {loading && <p>Loading interns...</p>}
        {!loading && interns.length === 0 && (
          <p className="text-gray-500">No interns found</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {interns.map((intern) => (
            <div
              key={intern._id}
              onClick={() => navigate(`/hr/interns/${intern._id}`)}
              className="cursor-pointer bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition border"
            >
              <h3 className="text-lg font-semibold">{intern.name}</h3>
              <p className="text-gray-600 text-sm">{intern.email}</p>

              <p className="mt-3 text-sm">
                <span className="font-medium">Batch:</span>{" "}
                {intern.batchId?.name || "Not assigned"}
              </p>

              <div className="mt-4 text-blue-600 text-sm font-medium">
                View Profile →
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
