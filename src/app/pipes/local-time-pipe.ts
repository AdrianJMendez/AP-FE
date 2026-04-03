import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'localTime',
  standalone: true
})
export class LocalTimePipe implements PipeTransform {
  transform(value: string | null | undefined, format: 'time' | 'datetime' | 'date' = 'time'): string {
    if (!value) return '';

    // RDS devuelve sin 'Z', hay que indicarle que es UTC
    const utcDate = new Date(value.endsWith('Z') ? value : value + 'Z');

    if (isNaN(utcDate.getTime())) return '';

    const options: Intl.DateTimeFormatOptions = {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      ...(format === 'time' && { hour: '2-digit', minute: '2-digit' }),
      ...(format === 'date' && { day: '2-digit', month: 'short', year: 'numeric' }),
      ...(format === 'datetime' && {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }),
    };

    return new Intl.DateTimeFormat(navigator.language, options).format(utcDate);
  }
}