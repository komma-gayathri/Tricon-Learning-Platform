import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import Card from "../../components/Card";
import { useAuth } from "../../context/AuthContext";

const InternCoursesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCourses = async () => {
    if (!user?.batchId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await api.get("/courses");

      const userBatchIdStr =
        user.batchId._id?.toString() || user.batchId?.toString() || "";

      const batchCourses = (res.data.courses || []).filter((course) => {
        const courseBatchId = (
          course.batchId?._id ||
          course.batchId ||
          ""
        ).toString();
        return courseBatchId === userBatchIdStr;
      });

      setCourses(batchCourses);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadCourses();
    }
  }, [user]);

  const handleCourseClick = (course) => {
    navigate(`/courses/${course._id}`);
  };

  if (loading) {
    return (
      <div className="space-y-4 p-8">
        <Card
          title="Loading courses..."
          subtitle="Fetching your batch courses..."
        >
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 max-w-6xl mx-auto">
      <Card
        title="My courses"
        subtitle={`${courses.length} courses in your batch`}
      >
        {courses.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <div className="text-4xl mb-4">📚</div>
            <p className="text-lg font-medium mb-2">No courses yet</p>
            <button
              onClick={loadCourses}
              className="px-6 py-2 bg-primary text-white rounded-full text-sm hover:bg-primary/90"
            >
              🔄 Refresh
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <div
                key={course._id}
                className="group cursor-pointer rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden"
                onClick={() => handleCourseClick(course)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-lg text-slate-800 line-clamp-2 group-hover:text-primary transition-colors pr-2">
                      {course.title}
                    </h3>
                    {course.videoPath && (
                      <div className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                         Video
                      </div>
                    )}
                  </div>

                  {/* Removed Week display since schema has no week */}
                  <p className="text-xs text-slate-500 mb-4 line-clamp-3">
                    {course.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                      {course.difficulty || "Normal"}
                    </span>

                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCourseClick(course);
                        }}
                        className="px-3 py-1 bg-primary text-white text-xs rounded-full hover:bg-primary/90 transition-colors"
                        title="View Course Details"
                      >
                        👁️ View Course
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default InternCoursesPage;
