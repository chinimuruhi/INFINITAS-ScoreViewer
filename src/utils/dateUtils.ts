function parseDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return {year, month, day, hours, minutes};
}

export function formatDate(date: Date): string{
  const parsedDate = parseDate(date);
  return `${parsedDate.year}-${parsedDate.month}-${parsedDate.day}`;
}

export function formatTime(date: Date): string{
  const parsedDate = parseDate(date);
  return `${parsedDate.year}-${parsedDate.month}-${parsedDate.day} ${parsedDate.hours}:${parsedDate.minutes}`;
}

export function getCurrentFormattedDate(): string {
  const date = new Date(); 
  return formatDate(date);
}

export function getCurrentFormattedTime(): string {
  const date = new Date(); 
  return formatTime(date);
}

export function convertDateToTimeString(dateString: string): string {
    const date = new Date(dateString);
    return formatTime(date);
}

export function convertDateToDateString(dateString: string): string {
    const date = new Date(dateString);
    return formatDate(date);
}