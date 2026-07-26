import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { finalize, catchError } from 'rxjs/operators';
import { ProjectService } from '../../services/project-service';
import { TaskService } from '../../services/task-service';
import { ProjectResponseDto } from '../../models/project';
import { TaskResponseDto, ProjectTaskStatus } from '../../models/taskDto';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, DatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {

  priorityClass(priority: string): string {
    switch (priority) {
      case 'High': return 'bg-error-container/40 text-on-error-container';
      case 'Medium': return 'bg-secondary-container/60 text-secondary';
      case 'Low': return 'bg-surface-container-high text-on-surface-variant';
      default: return 'bg-surface-container-high text-on-surface-variant';
    }
  }

  private readonly projectService = inject(ProjectService);
  private readonly taskService = inject(TaskService);

  userName = 'User';
  projects: ProjectResponseDto[] = [];
  tasks: TaskResponseDto[] = [];
  loading = true;
  error = '';

  get totalProjects() { return this.projects.length; }
  get totalTasks() { return this.tasks.length; }
  get completedTasks() { return this.tasks.filter(t => t.status === ProjectTaskStatus.Done).length; }
  get activeTasks() { return this.tasks.filter(t => t.status !== ProjectTaskStatus.Done).length; }
  get completionRate() {
    return this.totalTasks > 0 ? Math.round((this.completedTasks / this.totalTasks) * 100) : 0;
  }
  get recentProjects() { return this.projects.slice(0, 4); }
  get upcomingTasks() {
    return this.tasks
      .filter(t => t.status !== ProjectTaskStatus.Done)
      .slice(0, 5);
  }

  constructor() {
    if (typeof localStorage !== 'undefined') {
      this.userName = localStorage.getItem('userName') || 'User';
    }
  }

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading = true;
    this.error = '';
    forkJoin({
      projects: this.projectService.getAll().pipe(
        catchError((err) => { console.error('Dashboard projects fetch error', err); return of([] as ProjectResponseDto[]); }),
      ),
      tasks: this.taskService.getAll().pipe(
        catchError((err) => { console.error('Dashboard tasks fetch error', err); return of([] as TaskResponseDto[]); }),
      ),
    }).pipe(
      finalize(() => this.loading = false),
    ).subscribe({
      next: (result) => {
        this.projects = result.projects;
        this.tasks = result.tasks;
      },
    });
  }
}
