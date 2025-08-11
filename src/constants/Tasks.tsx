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
