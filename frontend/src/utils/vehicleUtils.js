// src/services/vehicleUtils.js
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
dayjs.extend(duration);

export const formatDuration = (inTime, outTime) => {
  if (!inTime) return "N/A";
  const start = dayjs(inTime);
  const end = outTime ? dayjs(outTime) : dayjs();

  const diff = dayjs.duration(end.diff(start));
  const hours = diff.hours();
  const minutes = diff.minutes();

  return `${hours}h ${minutes}m`;
};
