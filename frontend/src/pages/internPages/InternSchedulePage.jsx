import { useEffect, useState } from "react";
import api from "../../api";
import Card from "../../components/Card";

const InternSchedulePage = () => {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        setLoading(true);
        const res = await api.get("/schedule/intern/my");
        const schedules = res.data.schedules || [];
        setSchedule(schedules[0] || null);
      } catch (err) {
        setError(
          err.response?.data?.msg || "Failed to load schedule"
        );
      } finally {
        setLoading(false);
      }
    };

    loadSchedule();
  }, []);

  if (loading) {
    return <Card><p className="text-sm">Loading schedule...</p></Card>;
  }

  if (error) {
    return <Card><p className="text-sm text-red-600">{error}</p></Card>;
  }

  if (!schedule) {
    return <Card><p className="text-sm text-slate-500">No schedule found.</p></Card>;
  }

  return (
    <Card title="My Schedule" subtitle="Your batch sessions">
      <div className="space-y-3">
        {schedule.timetable.map((slot, idx) => (
          <div
            key={idx}
            className="grid grid-cols-3 gap-3 rounded border p-3 text-xs"
          >
            <div>
              <p className="font-semibold">{slot.topic}</p>
              <p className="text-slate-500">{slot.courseId?.title}</p>
            </div>
            <div>
              <p>{new Date(slot.date).toLocaleDateString()}</p>
              <p>{slot.timeSlot}</p>
            </div>
            <div>
              <p>Trainer</p>
              <p className="font-medium">{slot.trainerId?.name}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default InternSchedulePage;
