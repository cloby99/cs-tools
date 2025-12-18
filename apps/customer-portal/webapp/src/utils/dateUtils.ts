export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Handle invalid dates
  if (isNaN(date.getTime())) {
    return dateString;
  }

  // Future dates (shouldn't happen for created dates usually, but handle just in case)
  if (seconds < 0) {
    return "just now";
  }

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1,
  };

  let counter;
  for (const [key, value] of Object.entries(intervals)) {
    counter = Math.floor(seconds / value);
    if (counter > 0) {
      if (counter === 1) {
        return `1 ${key} ago`;
      } else {
        return `${counter} ${key}s ago`;
      }
    }
  }

  return "just now";
};
