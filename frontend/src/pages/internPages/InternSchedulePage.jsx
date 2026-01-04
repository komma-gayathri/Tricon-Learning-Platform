import { useEffect, useState } from "react";
import api from "../../api";
import Card from "../../components/Card";

const InternSchedulePage = () => {
  const [schedule, setSchedule] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const res = await api.get("/schedule/my");
        setSchedule(res.data.schedules[0]);
      } catch (err) {
        setError(err.response?.data?.msg || "Failed to load schedule");
      } finally {
        setLoading(false);
      }
    };

    loadSchedule();
  }, []);

  return (
    <Card title="My Schedule" subtitle="Your batch sessions">
      {loading && <p className="text-xs">Loading…</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}

      {schedule?.timetable?.map((slot, i) => (
        <div key={i} className="border p-3 rounded text-xs">
          <p className="font-semibold">{slot.topic}</p>
          <p>{slot.courseId?.title}</p>
          <p>{slot.timeSlot}</p>
          <p>Trainer: {slot.trainerId?.name}</p>
        </div>
      ))}
    </Card>
  );
};

export default InternSchedulePage;
