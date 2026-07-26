import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { UserService } from '../../services/user-service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  userName = 'User';

  constructor() {
    if (typeof localStorage !== 'undefined') {
      this.userName = localStorage.getItem('userName') || 'User';
    }
  }
  sidebarOpen = false;

  navItems = [
    { icon: 'dashboard', label: 'Dashboard', route: '/dashboard' },
    { icon: 'folder', label: 'Projects', route: '/projects' },
    { icon: 'checklist', label: 'Tasks', route: '/tasks' },

  ];

  secondaryNav = [
    
  ];

  mobileNav = [
    { icon: 'dashboard', label: 'Home', route: '/dashboard' },
    { icon: 'folder', label: 'Projects', route: '/projects' },
    { icon: 'checklist', label: 'Tasks', route: '/tasks' },
    { icon: 'chat', label: 'Messages', route: '/messages' },
    { icon: 'settings', label: 'Settings', route: '/settings' },
  ];

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  logout(): void {
    this.userService.logout();
    this.router.navigate(['/login']);
  }
}
