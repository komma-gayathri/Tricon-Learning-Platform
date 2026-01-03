import { useEffect, useState } from "react";
import api from "../../api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";


const HRInterns = () => {
  const navigate = useNavigate();

  // ✅ always arrays
  const [interns, setInterns] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // ================= FETCH INTERNS =================
  const fetchInterns = async () => {
    try {
      const res = await api.get("/hr/interns");

      // ✅ SAFE handling for all backend shapes
      const data =
        res.data?.interns ||
        res.data?.users ||
        res.data ||
        [];

      setInterns(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch interns", err);
      setInterns([]); // ✅ never undefined
    }
  };

  useEffect(() => {
    fetchInterns();
  }, []);

  // ================= CREATE INTERN =================
  const createIntern = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/auth/register", {
        name,
        email,
        password,
        role: "Intern"
      });
      toast.success("Intern created successfully");

      setName("");
      setEmail("");
      setPassword("");
      fetchInterns();
    } catch (err) {
      console.error("Create intern failed", err);
    } finally {
      setLoading(false);
    }
  };

  // ================= FILTER =================
  const filteredInterns = interns.filter(
    (i) =>
      i?.name?.toLowerCase().includes(search.toLowerCase()) ||
      i?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-8">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold">Manage Interns</h1>
        <p className="text-sm text-gray-500">
          Create and manage intern profiles
        </p>
      </div>

      {/* CREATE INTERN */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Create New Intern</h2>

        <form
          onSubmit={createIntern}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <input
            type="text"
            placeholder="Intern Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="border rounded px-3 py-2"
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border rounded px-3 py-2"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border rounded px-3 py-2"
          />

          <button
            type="submit"
            disabled={loading}
            className="md:col-span-3 bg-black text-white px-6 py-2 rounded disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Intern"}
          </button>
        </form>
      </div>

      {/* SEARCH */}
      <div className="bg-white rounded-lg shadow p-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      {/* INTERN LIST */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="font-semibold mb-4">
          Interns ({filteredInterns.length})
        </h2>

        {filteredInterns.length === 0 ? (
          <p className="text-sm text-gray-400">No interns found</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr className="text-left">
                <th className="py-2">Name</th>
                <th>Email</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredInterns.map((intern) => (
                <tr key={intern._id} className="border-b">
                  <td
                    className="py-2 cursor-pointer hover:underline"
                    onClick={() => navigate(`/hr/users/${intern._id}`)}
                  >
                    {intern.name}
                  </td>
                  <td>{intern.email}</td>
                  <td>
                    {intern.batchId ? (
                      <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                        Assigned
                      </span>
                    ) : (
                      <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                        Unassigned
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default HRInterns;
