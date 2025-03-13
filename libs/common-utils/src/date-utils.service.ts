import { Injectable } from '@nestjs/common';
import {
  addDays,
  differenceInDays,
  formatDuration,
  fromUnixTime,
  getUnixTime,
  intervalToDuration,
  endOfDay,
  startOfDay,
  parseISO,
  differenceInHours,
  formatDate,
} from 'date-fns';

export const DateFormat = {
  date: 'MMM dd, yyyy',
  dateTime: 'MM/dd/yyyy hh:mm a ',
  serverDate: 'yyyy-MM-dd',
};

@Injectable()
export class DateUtilsService {
  static formatDate(date: Date): string {
    return date.toISOString();
  }

  // static dateToString = (date: Date, format = DateFormat.date) => {
  //   return formatDate(date, format);
  // };
  static dateToString = (date: Date, format = DateFormat.date) => {
    if (!date || isNaN(date.getTime())) {
      return '';
    }
    return formatDate(date, format);
  };

  static msToDate = (ms: number) => {
    return fromUnixTime(ms);
  };

  static getUnixTime = (date: Date) => {
    return getUnixTime(date);
  };

  static addDay = (date: Date, day: number) => {
    return addDays(date, day);
  };

  static diff = (date1: number, date2: number) => {
    return differenceInDays(date2, date1);
  };

  static diffInHour = (date1: Date, date2: Date) => {
    return differenceInHours(date2, date1);
  };

  static startDate = (date1: Date) => {
    return startOfDay(date1);
  };

  static endDate = (date1: Date) => {
    return endOfDay(date1);
  };

  static getStartAndEndOfDay(date: Date) {
    const startOfDayUnix = Math.floor(startOfDay(date).getTime()); // Start of day
    const endOfDayUnix = Math.floor(endOfDay(date).getTime()); // End of day
    return {
      startOfDay: startOfDayUnix,
      endOfDay: endOfDayUnix,
    };
  }

  static durationText = (date1: number, date2: number) => {
    return formatDuration(intervalToDuration({ start: date1, end: date2 }), {
      format: ['months', 'weeks', 'days', 'hours', 'minutes'],
    });
  };

  static toDate = (date: string) => {
    return parseISO(date);
  };
}
