// Utility function to detect type from vehicle number
export function detectVehicleType(vehicleNo) {
  if (!vehicleNo) return "Unknown";

  // Simple detection rules - you can expand
  if (vehicleNo.startsWith("WP")) return "Truck";
  if (vehicleNo.startsWith("NP")) return "Van";
  if (vehicleNo.match(/[A-Z]{2,3}-\d{4}/)) return "Car";

  return "Other";
}

// Utility to calculate duration
export function formatDuration(inTime, outTime) {
  if (!inTime) return "N/A";

  const start = new Date(inTime);
  const end = outTime ? new Date(outTime) : new Date();
  const diffMs = end - start;
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;

  return outTime
    ? (hours > 0 ? `${hours}h ${remMins}m` : `${remMins} mins`)
    : `⏳ ${hours > 0 ? `${hours}h ${remMins}m` : `${remMins} mins inside`}`;
}
