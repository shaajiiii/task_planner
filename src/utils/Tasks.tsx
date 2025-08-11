export const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "#FFC107";
    case "in-progress":
      return "#29B6F6";
    case "completed":
      return "#66BB6A";
    default:
      return "#BDBDBD";
  }
};

export const getStatusText = (status: string) => {
  switch (status) {
    case "pending":
      return "Pending";
    case "in-progress":
      return "In Progress";
    case "completed":
      return "Completed";
    default:
      return "";
  }
};

export function formatDayRange(start?: number, end?: number) {
  if (!start || !end) return;
  const suffix = (n: number) => {
    if (n >= 11 && n <= 13) return `${n}th`;
    switch (n % 10) {
      case 1:
        return `${n}st`;
      case 2:
        return `${n}nd`;
      case 3:
        return `${n}rd`;
      default:
        return `${n}th`;
    }
  };

  if (start === end) {
    return suffix(start);
  }
  return `${suffix(start)} to ${suffix(end)}`;
}
