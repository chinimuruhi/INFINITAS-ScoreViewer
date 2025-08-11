const parseDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return { year, month, day, hours, minutes };
}

export const formatDate = (date: Date): string => {
  const parsedDate = parseDate(date);
  return `${parsedDate.year}-${parsedDate.month}-${parsedDate.day}`;
}

export const formatTime = (date: Date): string => {
  const parsedDate = parseDate(date);
  return `${parsedDate.year}-${parsedDate.month}-${parsedDate.day} ${parsedDate.hours}:${parsedDate.minutes}`;
}

export const getCurrentFormattedDate = (): string => {
  const date = new Date();
  return formatDate(date);
}

export const getCurrentFormattedTime = (): string => {
  const date = new Date();
  return formatTime(date);
}

export const convertDateToTimeString = (dateString: string): string => {
  const date = new Date(dateString);
  return formatTime(date);
}

export const convertDateToDateString = (dateString: string): string => {
  const date = new Date(dateString);
  return formatDate(date);
}