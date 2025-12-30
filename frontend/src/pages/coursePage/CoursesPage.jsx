import React, { useEffect, useState } from 'react';
import api from '../../api';
import { Link } from 'react-router-dom';

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/courses')
      .then((res) => setCourses(res.data.courses || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Courses</h1>
        <p className="mt-2 text-slate-600">Explore courses assigned to your batch</p>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            {/* Loading Spinner */}
            <svg
              className="mx-auto h-12 w-12 animate-spin text-primary"
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
            <p className="mt-4 text-slate-600">Loading courses...</p>
          </div>
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <p className="mt-4 text-slate-600">No courses yet. Check back soon!</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link
              key={course._id}
              to={`/courses/${course._id}`}
              className="group flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/30"
            >
              {/* Thumbnail */}
              <div className="relative h-28 bg-slate-50 border-b border-slate-200">
                {/* Accent strip */}
                <div className="absolute inset-x-0 top-0 h-1 bg-primary" />

                {/* Week Badge */}
                <div className="absolute top-3 left-3 rounded-md bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  Week {course.week}
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col p-4">
                {/* Batch Badge */}
                <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                  {course.batchId?.name || 'Course'}
                </span>

                {/* Title */}
                <h3 className="mt-1 text-base font-semibold text-slate-900 transition-colors group-hover:text-primary line-clamp-2">
                  {course.title}
                </h3>

                {/* Description */}
                <p className="mt-1 flex-1 text-xs text-slate-600 line-clamp-2">
                  {course.description}
                </p>

                {/* CTA Button */}
                <button className="mt-3 w-full rounded-md bg-primary px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70">
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
