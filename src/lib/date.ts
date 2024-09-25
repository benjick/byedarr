import dayjs from "dayjs";

// day	d	Day
// week	w	Week
// month	M	Month
// quarter	Q	Quarter ( dependent QuarterOfYear plugin )
// year	y	Year
// hour	h	Hour
// minute	m	Minute
// second	s	Second
// millisecond	ms	Millisecond

const allowedUnits = [
  "d",
  "w",
  "M",
  "Q",
  "y",
  "h",
  "m",
  "s",
  "ms",
  "day",
  "week",
  "month",
  "quarter",
  "year",
  "hour",
  "minute",
  "second",
  "millisecond",
  "days",
  "weeks",
  "months",
  "quarters",
  "years",
  "hours",
  "minutes",
  "seconds",
  "milliseconds",
];

export function getFutureDate(input: string): Date {
  const [amount, unit] = input.split(" ");
  if (!allowedUnits.includes(unit)) {
    throw new Error(`Invalid unit: ${unit}`);
  }
  return dayjs()
    .add(parseInt(amount), unit as any)
    .toDate();
}

export function getPastDate(input: string): Date {
  const [amount, unit] = input.split(" ");
  if (!allowedUnits.includes(unit)) {
    throw new Error(`Invalid unit: ${unit}`);
  }
  return dayjs()
    .subtract(parseInt(amount), unit as any)
    .toDate();
}
