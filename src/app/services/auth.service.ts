import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { EncryptionService } from '../shared/services/encryption.service';
import { Router } from '@angular/router';

interface TokenResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    refreshToken: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authStateSubject = new BehaviorSubject<boolean>(this.isAuthenticated());
  authState$ = this.authStateSubject.asObservable();
  private refreshTokenInProgress = false;

  constructor(
    private http: HttpClient,
    private encryptionService: EncryptionService,
    private router: Router
  ) {}

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/auth/login`, credentials).pipe(
      tap((response: any) => {
        localStorage.setItem('token', response.accessToken);
        localStorage.setItem('user', JSON.stringify({
          firstName: response.firstName,
          lastName: response.lastName,
          email: response.email
        }));
        // Encrypt and store refresh token
        const encryptedRefreshToken = this.encryptionService.encrypt(response.refreshToken);
        localStorage.setItem('refreshToken', encryptedRefreshToken);
        this.authStateSubject.next(true);
      })
    );
  }

  refreshToken(): Observable<TokenResponse> {
    if (this.refreshTokenInProgress) {
      return throwError(() => new Error('Refresh token request in progress'));
    }

    this.refreshTokenInProgress = true;
    const encryptedRefreshToken = localStorage.getItem('refreshToken');
    
    if (!encryptedRefreshToken) {
      this.handleAuthError();
      return throwError(() => new Error('No refresh token available'));
    }

    const refreshToken = this.encryptionService.decrypt(encryptedRefreshToken);

    return this.http.post<TokenResponse>(
      `${environment.apiUrl}/api/refresh-token/new`,
      { refreshToken },
      { headers: {} }
    ).pipe(
      tap(response => {
        if (response.success) {
          localStorage.setItem('token', response.data.token);
          const encryptedNewRefreshToken = this.encryptionService.encrypt(response.data.refreshToken);
          localStorage.setItem('refreshToken', encryptedNewRefreshToken);
        }
        this.refreshTokenInProgress = false;
      }),
      catchError(error => {
        this.refreshTokenInProgress = false;
        if (error.status === 400) {
          this.handleAuthError();
        }
        return throwError(() => error);
      })
    );
  }

  private handleAuthError(): void {
    this.logout();
    this.router.navigate(['/login']).then(() => {
      window.location.reload();
    });
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    localStorage.clear();
    this.authStateSubject.next(false);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}