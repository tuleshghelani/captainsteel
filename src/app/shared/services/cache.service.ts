import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private cache: { [key: string]: any } = {};
  private expirationTimes: { [key: string]: number } = {};

  set(key: string, data: any, expirationMinutes: number = 30): void {
    this.cache[key] = data;
    this.expirationTimes[key] = Date.now() + (expirationMinutes * 60 * 1000);
    // Also store in localStorage as backup
    localStorage.setItem(key, JSON.stringify({
      data,
      expiration: this.expirationTimes[key]
    }));
  }

  get(key: string): any {
    // First check memory cache
    if (this.cache[key] && this.expirationTimes[key] > Date.now()) {
      return this.cache[key];
    }

    // Then check localStorage
    const stored = localStorage.getItem(key);
    if (stored) {
      const { data, expiration } = JSON.parse(stored);
      if (expiration > Date.now()) {
        this.cache[key] = data;
        this.expirationTimes[key] = expiration;
        return data;
      }
      // Clear expired data
      localStorage.removeItem(key);
    }

    return null;
  }

  clear(key: string): void {
    delete this.cache[key];
    delete this.expirationTimes[key];
    localStorage.removeItem(key);
  }
} 