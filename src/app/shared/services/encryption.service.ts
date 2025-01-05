import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class EncryptionService {
  private key = environment.encryptionKey;

  encrypt(data: any): string {
    try {
      return CryptoJS.AES.encrypt(JSON.stringify(data), this.key).toString();
    } catch (error) {
      console.error('Encryption error:', error);
      return '';
    }
  }

  decrypt(encryptedData: string): any {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.key);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('Decryption error:', error);
      return null;
    }
  }
} 