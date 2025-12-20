import React, { useEffect, useState } from 'react';
import api from '../api';
import Card from '../components/Card';
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
    <div className="space-y-4">
      <Card
        title="Courses"
        subtitle="Browse the content assigned to your batch."
      >
        {loading ? (
          <p className="text-sm text-slate-500">Loading courses…</p>
        ) : courses.length === 0 ? (
          <p className="text-sm text-slate-500">No courses yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Link
                key={course._id}
                to={`/courses/${course._id}`}
                className="group flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <p className="text-sm font-semibold text-slate-800 group-hover:text-primary">
                  {course.title}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                  {course.description}
                </p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Week {course.week}</span>
                  <span>{course.batchId?.name || 'Batch'}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default CoursesPage;
