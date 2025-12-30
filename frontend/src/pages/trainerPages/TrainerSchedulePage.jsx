import React from "react";
import TrainerSchedule from "../../components/TrainerSchedule";

const TrainerSchedulePage = () => {
  // If no batchId prop is passed, you can set a fallback or show a message

  return <TrainerSchedule batchId={"Batch01"} />;
};

export default TrainerSchedulePage;
