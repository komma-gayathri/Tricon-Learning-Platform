import React, { useState } from "react";
import api from "../../api";
import Card from "../../components/Card";

const HrPerformancePage = () => {
  const [batchId, setBatchId] = useState("");
  const [interns, setInterns] = useState([]);
  const [error, setError] = useState("");

  const loadReport = async () => {
  setError("");
  setInterns([]);

  if (!batchId) {
    setError("BatchId is required.");
    return;
  }

  try {
    const res = await api.get(`/learner/report/batch/${batchId}`);
    setInterns(res.data.interns || []);
  } catch (err) {
    setError(err.response?.data?.msg || "Failed to load performance report");
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

  return (
    <div className="space-y-4">
      <Card
        title="Batch performance"
        subtitle="Track quiz and assignment performance for each intern."
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1 space-y-2">
            <label className="text-xs font-medium text-slate-600">
              Batch ID
            </label>
            <input
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary/40"
              placeholder="Enter Batch ID"
            />
          </div>
          <button
            type="button"
            onClick={loadReport}
            className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary/90"
          >
            Load report
          </button>
        </div>

        {error && (
          <p className="mt-3 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}

        {interns.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  <th className="px-3 py-2 font-semibold text-slate-600">
                    Intern
                  </th>
                  <th className="px-3 py-2 font-semibold text-slate-600">
                    Email
                  </th>
                  <th className="px-3 py-2 font-semibold text-slate-600">
                    Quiz avg
                  </th>
                  <th className="px-3 py-2 font-semibold text-slate-600">
                    Assignment avg
                  </th>
                  <th className="px-3 py-2 font-semibold text-slate-600">
                    Quizzes
                  </th>
                  <th className="px-3 py-2 font-semibold text-slate-600">
                    Assignments
                  </th>
                </tr>
              </thead>
              <tbody>
                {interns.map((intern) => (
                  <tr
                    key={intern._id}
                    className="border-b border-slate-100 hover:bg-slate-50/60"
                  >
                    <td className="px-3 py-2 text-slate-800">{intern.name}</td>
                    <td className="px-3 py-2 text-slate-600">{intern.email}</td>
                    <td className="px-3 py-2 text-slate-800">
                      {computeQuizAverage(intern) === "-"
                        ? "-"
                        : `${computeQuizAverage(intern)}%`}
                    </td>
                    <td className="px-3 py-2 text-slate-800">
                      {computeAssignmentAverage(intern) === "-"
                        ? "-"
                        : `${computeAssignmentAverage(intern)}%`}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {intern.performance?.quizzes?.length || 0}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {intern.performance?.assignments?.length || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {interns.length === 0 && !error && (
          <p className="mt-4 text-xs text-slate-500">
            Enter a batch ID and load the report to see intern performance.
          </p>
        )}
      </Card>
    </div>
  );
};

export default HrPerformancePage;
