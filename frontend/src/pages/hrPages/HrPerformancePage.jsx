import React, { useState, useEffect } from "react";
import api from "../../api";
import Card from "../../components/Card";

const HrPerformancePage = () => {
  const [batches, setBatches] = useState([]);
  const [batchId, setBatchId] = useState("");
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");


  const fetchBatches = async () => {
    try {
      const res = await api.get("/batches");
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
    fetchBatches();
  }, []);

  const loadReport = async (batchId) => {
    if (!batchId) return;

    try {
      setLoading(true);
      setInterns([]);
      setMessage("");

      console.log("Loading report for batch:", batchId);

      const res = await api.get(`/learner/report/batch/${batchId}`);

      console.log("API response:", res.data);

      if (res.data?.interns?.length === 0) {
        setMessage(
          res.data?.message ||
          "No interns are currently assigned to this batch."
        );
        return;
      }

      setInterns(res.data.interns);
    } catch (err) {
      console.error("Load report error:", err);
      setMessage("Failed to load batch performance.");
    } finally {
      setLoading(false);
    }
  };




  const computeQuizAverage = (intern) => {
    const quizzes = intern.performance?.quizzes || [];
    if (quizzes.length === 0) return "-";
    const sum = quizzes.reduce((acc, q) => acc + (q.score || 0), 0);
    return Math.round(sum / quizzes.length);
  };

  const computeAssignmentAverage = (intern) => {
    const assignments = intern.performance?.assignments || [];
    if (assignments.length === 0) return "-";
    const sum = assignments.reduce((acc, a) => acc + (a.score || 0), 0);
    return Math.round(sum / assignments.length);
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!batchId || loading) return;
    loadReport(batchId);
  };
  const handleKeyDown = (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    if (batchId && !loading) {
      loadReport(batchId);
    }
  }
};

  return (
    <div className="space-y-8 p-8">
      <Card
        title="Batch Performance"
        subtitle="Track quiz and assignment performance for each intern."
      >
        {/* Global Messages - Top Position */}
        <div className="space-y-4 mb-8">
          {error && (
            <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-6 shadow-xl">
              <div className="flex items-start gap-3">
                <svg
                  className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm font-medium text-red-800 leading-relaxed">
                  {error}
                </p>
              </div>
            </div>
          )}
        </div>
        {/* Validation / Info Message */}
        {message && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {message}
          </div>
        )}

        {/* Batch Selection Section */}
        <form onSubmit={handleSubmit}   onKeyDown={handleKeyDown} className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-4">


            {/* Batch Dropdown */}
            <div className="flex-1 space-y-3">
              <label className="text-sm font-medium text-slate-700">
                Batch
              </label>

              <select
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-slate-300"
                disabled={loading}
              >
                <option value="">Select a batch...</option>

                {batches.map((batch) => (
                  <option key={batch._id} value={batch._id}>
                    {batch.batchId} - {batch.name}
                  </option>
                ))}
              </select>
            </div>



            {/* Load Report Button */}
            <button
              type="submit"
              disabled={!batchId || loading}
              className="rounded-xl bg-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? "Loading..." : "Load Report"}
            </button>

          </div>
        </form>

        {/* Performance Table */}
        {interns.length > 0 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-800">
                Performance Overview
              </h3>
              <p className="text-sm text-slate-600">
                {interns.length} intern{interns.length !== 1 ? 's' : ''} in selected batch
              </p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-lg">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">
                      Intern
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">
                      Quiz Avg
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">
                      Assignment Avg
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">
                      Quizzes Taken
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">
                      Assignments Submitted
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {interns.map((intern) => (
                    <tr
                      key={intern._id}
                      className="hover:bg-slate-50/50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {intern.name}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {intern.email}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {computeQuizAverage(intern) === "-"
                          ? "-"
                          : `${computeQuizAverage(intern)}%`}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {computeAssignmentAverage(intern) === "-"
                          ? "-"
                          : `${computeAssignmentAverage(intern)}%`}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {intern.performance?.quizzes?.length || 0}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {intern.performance?.assignments?.length || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {interns.length === 0 && !error && !loading && (
          <div className="pt-12 text-center">
            <div className="mx-auto h-20 w-20 rounded-2xl bg-slate-100 p-6">
              <svg
                className="mx-auto h-10 w-10 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h3.75M9 15h3.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-800">
              No Performance Data
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Select a batch and click "Load Report" to view intern performance data.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default HrPerformancePage;