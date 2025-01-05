import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DateUtils {
  formatDate(dateString: string): string {
    if (!dateString) return '';
    
    try {
      // Create a date object from the UTC string
      const date = new Date(dateString);
      
      // Format the date according to local timezone
      return date.toLocaleString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(/\//g, '-').replace(',', '');
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  }

  formatDateForApi(dateStr: string, isStartDate: boolean = false): string {
    if (!dateStr) return '';
    
    try {
      // Create date object and adjust for IST
      const date = new Date(dateStr);
      const istDate = new Date(date.getTime() - (5.5 * 60 * 60 * 1000));
      
      if (isNaN(istDate.getTime())) return '';

      const day = istDate.getDate().toString().padStart(2, '0');
      const month = (istDate.getMonth() + 1).toString().padStart(2, '0');
      const year = istDate.getFullYear();
      const time = isStartDate ? '00:00:00' : '23:59:59';

      return `${day}-${month}-${year} ${time}`;
    } catch (error) {
      console.error('Error formatting date for API:', error);
      return '';
    }
  }
} 