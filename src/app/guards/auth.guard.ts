import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const authGuard = () => {
  const router = inject(Router);
  if (typeof localStorage !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) return true;
  }
  return router.parseUrl('/login');
};
