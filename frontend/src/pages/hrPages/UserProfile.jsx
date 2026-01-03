import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api";

const UserProfile = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);

  useEffect(() => {
    api.get(`/hr/users/${id}`).then(res => {
      setUser(res.data.user);
    });
  }, [id]);

  if (!user) return <p className="p-6">Loading profile...</p>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-xl shadow p-6 max-w-2xl">
        <h1 className="text-2xl font-semibold mb-1">{user.name}</h1>
        <p className="text-sm text-gray-500">{user.email}</p>

        <div className="mt-4 flex gap-4">
          <span className="px-3 py-1 text-xs rounded-full bg-gray-100">
            {user.role}
          </span>
          {user.batchId ? (
            <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-700">
              Assigned
            </span>
          ) : (
            <span className="px-3 py-1 text-xs rounded-full bg-gray-200">
              Unassigned
            </span>
          )}
        </div>

        {/* Batch Info */}
        {user.batchId && (
          <div className="mt-6 border-t pt-4">
            <h3 className="font-medium mb-2">Batch Details</h3>
            <p className="text-sm">Name: {user.batchId.name}</p>
            <p className="text-sm">Batch ID: {user.batchId.batchId}</p>
            <p className="text-sm text-gray-500">
              {new Date(user.batchId.startDate).toLocaleDateString()} →{" "}
              {new Date(user.batchId.endDate).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
