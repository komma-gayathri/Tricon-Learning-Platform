import React, { useEffect, useState } from "react";
import api from "../../api";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; // ✅ ADD

const CoursesPage = () => {
  const { user } = useAuth(); // ✅ ADD
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return; // ✅ prevent crash before user loads

    const fetchCourses = async () => {
      try {
        let res;

        if (user.role === "Intern") {
          // ✅ Intern sees ONLY their batch courses
          res = await api.get("/learner/courses/my");
        } else {
          // ✅ HR / TRAINER see all
          res = await api.get("/courses");
        }

        setCourses(res.data.courses || []);
      } catch (err) {
        console.error("Fetch courses error:", err);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Courses</h1>
        <p className="mt-2 text-slate-600">
          Explore courses assigned to your batch
        </p>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <svg
            className="h-10 w-10 animate-spin text-primary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <p className="text-slate-600">No courses available</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link
              key={course._id}
              to={`/courses/${course._id}`}
              className="group flex flex-col overflow-hidden rounded-lg border bg-white shadow-sm hover:shadow-md"
            >
              <div className="relative h-28 bg-slate-50 border-b">
                <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
                <div className="absolute top-3 left-3 rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                  Week {course.week}
                </div>
              </div>

              <div className="flex flex-1 flex-col p-4">
                <span className="text-xs font-semibold uppercase text-primary">
                  {course.batchId?.name}
                </span>

                <h3 className="mt-1 text-base font-semibold text-slate-900">
                  {course.title}
                </h3>

                <p className="mt-1 flex-1 text-xs text-slate-600 line-clamp-2">
                  {course.description}
                </p>

                <button className="mt-3 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-white">
                  Explore Course
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default CoursesPage;
