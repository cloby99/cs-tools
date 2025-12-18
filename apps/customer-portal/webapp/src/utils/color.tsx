import {
  ArrowRightIcon,
  CircleAlertIcon,
  ClockIcon,
  FileTextIcon,
  MessageCircleIcon,
} from "../assets/icons/support/support-icons";

export const getStatusColor = (color: string) => {
  switch (color) {
    case "orange":
      return { bg: "#ffedd5", text: "#c2410c", border: "#fed7aa" };
    case "yellow":
      return { bg: "#fef9c3", text: "#a16207", border: "#fef08a" };
    case "blue":
      return { bg: "#dbeafe", text: "#1d4ed8", border: "#bfdbfe" };
    default:
      return { bg: "#f3f4f6", text: "#374151", border: "#e5e7eb" };
  }
};

export const getStatusIcon = (status: string) => {
  if (status.includes("Progress")) return <ClockIcon width={12} height={12} />;
  if (status.includes("Response"))
    return <MessageCircleIcon width={12} height={12} />;
  return <CircleAlertIcon width={12} height={12} />;
};

export const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "High":
      return "#f97316";
    case "Medium":
      return "#eab308";
    case "Low":
      return "#3b82f6";
    default:
      return "#9ca3af";
  }
};
