declare module 'date-fns/format' {
  export function format(date: Date | number | string, formatStr: string): string;
}

declare module 'date-fns/parseISO' {
  export function parseISO(dateString: string): Date;
}

declare module 'date-fns/isValid' {
  export function isValid(date: unknown): boolean;
}

declare module 'date-fns/addDays' {
  export function addDays(date: Date | number, amount: number): Date;
}

declare module 'date-fns/subDays' {
  export function subDays(date: Date | number, amount: number): Date;
}

declare module 'date-fns/addHours' {
  export function addHours(date: Date | number, amount: number): Date;
}

declare module 'date-fns/subHours' {
  export function subHours(date: Date | number, amount: number): Date;
}

declare module 'date-fns/startOfMonth' {
  export function startOfMonth(date: Date | number): Date;
}

declare module 'date-fns/endOfMonth' {
  export function endOfMonth(date: Date | number): Date;
}

declare module 'date-fns/differenceInDays' {
  export function differenceInDays(dateLeft: Date | number, dateRight: Date | number): number;
}

declare module 'date-fns/formatDistance' {
  export function formatDistance(date: Date | number, baseDate: Date | number, options?: any): string;
}

declare module 'date-fns/isAfter' {
  export function isAfter(date: Date | number, dateToCompare: Date | number): boolean;
}

declare module 'date-fns/isBefore' {
  export function isBefore(date: Date | number, dateToCompare: Date | number): boolean;
}

declare module 'date-fns/startOfDay' {
  export function startOfDay(date: Date | number): Date;
}

declare module 'date-fns/endOfDay' {
  export function endOfDay(date: Date | number): Date;
}