import { format, parseISO } from 'date-fns';

const FormatTimeSettings: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
};

const FormatDateSettings: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

export const formatTime = (isoString: string) =>
  new Date(isoString).toLocaleTimeString([...navigator.languages], {
    ...FormatTimeSettings,
  });

export const formatDate = (isoString: string) =>
  new Date(isoString).toLocaleDateString([...navigator.languages]);

export const formatDateTime = (isoString: string) =>
  new Date(isoString).toLocaleTimeString([...navigator.languages], {
    ...FormatDateSettings,
    ...FormatTimeSettings,
  });

export const formatTimeRange = (start: string, end: string) =>
  `${formatTime(start)} - ${formatTime(end)}`;

export const formatDateTimeRange = (start: string, end: string) => {
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (startDate.toLocaleDateString() === endDate.toLocaleDateString()) {
    return `${formatDate(start)} ${formatTimeRange(start, end)}`;
  }

  return `${formatDateTime(start)} - ${formatDateTime(end)}`;
};

// https://github.com/thewca/wca-live/blob/8884f8dc5bb2efcc3874f9fff4f6f3c098efbd6a/client/src/lib/date.js#L10
export const formatDateRange = (startString: string, endString: string) => {
  const [startDay, startMonth, startYear] = format(parseISO(startString), 'd MMM yyyy').split(' ');
  const [endDay, endMonth, endYear] = format(parseISO(endString), 'd MMM yyyy').split(' ');
  if (startString === endString) {
    return `${startMonth} ${startDay}, ${startYear}`;
  }
  if (startMonth === endMonth && startYear === endYear) {
    return `${startMonth} ${startDay} - ${endDay}, ${endYear}`;
  }
  if (startYear === endYear) {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${startYear}`;
  }
  return `${startMonth} ${startDay}, ${startYear} - ${endMonth} ${endDay}, ${endYear}`;
};
