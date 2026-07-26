import { Component, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { finalize, catchError } from 'rxjs/operators';
import { TaskService } from '../../services/task-service';
import { ProjectService } from '../../services/project-service';
import { TaskResponseDto, CreateTaskDto, UpdateTaskDto, ProjectTaskStatus, TaskPriority } from '../../models/taskDto';
import { ProjectResponseDto } from '../../models/project';

@Component({
  selector: 'app-tasks',
  imports: [DatePipe, ReactiveFormsModule, FormsModule],
  templateUrl: './tasks.html',
  styleUrl: './tasks.css',
})
export class Tasks implements OnInit {
  private readonly taskService = inject(TaskService);
  private readonly projectService = inject(ProjectService);
  private readonly fb = inject(FormBuilder);

  allTasks: TaskResponseDto[] = [];
  projects: ProjectResponseDto[] = [];
  loading = true;
  activeTab = 'all';
  selectedProject = '';
  selectedPriority = '';
  currentPage = 1;
  pageSize = 8;
  showModal = false;
  saving = false;
  error = '';
  editingTask: TaskResponseDto | null = null;

  taskForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: [''],
    dueDate: [''],
    priority: [TaskPriority.Medium, Validators.required],
    projectId: [0, Validators.required],
  });

  get filteredTasks(): TaskResponseDto[] {
    let result = [...this.allTasks];

    if (this.activeTab === 'completed') {
      result = result.filter(t => t.status === ProjectTaskStatus.Done);
    } else if (this.activeTab === 'active') {
      result = result.filter(t => t.status !== ProjectTaskStatus.Done);
    }

    if (this.selectedProject) {
      result = result.filter(t => t.projectId === +this.selectedProject);
    }
    if (this.selectedPriority) {
      result = result.filter(t => t.priority === this.selectedPriority);
    }
    return result;
  }

  get pagedTasks(): TaskResponseDto[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredTasks.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredTasks.length / this.pageSize));
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  getProjectName(id: number): string {
    return this.projects.find(p => p.id === id)?.name || 'Unknown';
  }

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading = true;
    this.error = '';
    forkJoin({
      projects: this.projectService.getAll().pipe(
        catchError((err) => { console.error('Tasks page projects fetch error', err); return of([] as ProjectResponseDto[]); }),
      ),
      tasks: this.taskService.getAll().pipe(
        catchError((err) => { console.error('Tasks page tasks fetch error', err); return of([] as TaskResponseDto[]); }),
      ),
    }).pipe(
      finalize(() => this.loading = false),
    ).subscribe({
      next: (result) => {
        this.projects = result.projects;
        this.allTasks = result.tasks;
      },
    });
  }

  setTab(tab: string): void {
    this.activeTab = tab;
    this.currentPage = 1;
  }

  onFilterChange(): void {
    this.currentPage = 1;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }

  openCreateModal(): void {
    this.editingTask = null;
    this.taskForm.reset({ priority: TaskPriority.Medium, projectId: 0 });
    this.showModal = true;
  }

  openEditModal(task: TaskResponseDto): void {
    this.editingTask = task;
    this.taskForm.setValue({
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate ? task.dueDate.substring(0, 10) : '',
      priority: task.priority,
      projectId: task.projectId,
    });
    this.showModal = true;
  }

  saveTask(): void {
    if (this.taskForm.invalid || this.saving) return;
    this.saving = true;
    const raw = this.taskForm.getRawValue();
    const dueDate = raw.dueDate ? new Date(raw.dueDate).toISOString() : new Date().toISOString();

    if (this.editingTask) {
      const dto: UpdateTaskDto = {
        title: raw.title,
        description: raw.description,
        dueDate,
        priority: raw.priority,
        status: this.editingTask.status,
      };
      this.taskService.update(this.editingTask.id, dto).pipe(finalize(() => this.saving = false)).subscribe({
        next: () => {
          this.showModal = false;
          this.loadData();
        },
        error: (err) => { console.error('Update task error', err); this.error = 'Failed to update task'; },
      });
    } else {
      const dto: CreateTaskDto = {
        title: raw.title,
        description: raw.description,
        dueDate,
        priority: raw.priority,
        projectId: raw.projectId,
      };
      this.taskService.create(dto).pipe(finalize(() => this.saving = false)).subscribe({
        next: () => {
          this.showModal = false;
          this.loadData();
        },
        error: (err) => { console.error('Create task error', err); this.error = 'Failed to create task'; },
      });
    }
  }

  deleteTask(id: number): void {
    if (!confirm('Delete this task?')) return;
    this.taskService.delete(id).subscribe({
      next: () => { this.allTasks = this.allTasks.filter(t => t.id !== id); },
      error: (err) => { console.error('Delete task error', err); this.error = 'Failed to delete task'; },
    });
  }

  toggleStatus(task: TaskResponseDto): void {
    const newStatus = task.status === ProjectTaskStatus.Done ? ProjectTaskStatus.ToDo : ProjectTaskStatus.Done;
    this.taskService.updateStatus(task.id, { status: newStatus }).subscribe({
      next: () => { task.status = newStatus; },
      error: (err) => { console.error('Toggle status error', err); this.error = 'Failed to update status'; },
    });
  }

  statusClass(status: ProjectTaskStatus): string {
    switch (status) {
      case ProjectTaskStatus.ToDo: return 'bg-surface-container-high text-on-surface-variant';
      case ProjectTaskStatus.InProgress: return 'bg-primary-container/10 text-primary';
      case ProjectTaskStatus.Done: return 'bg-tertiary-fixed text-on-tertiary-fixed-variant';
    }
  }

  priorityClass(priority: TaskPriority): string {
    switch (priority) {
      case TaskPriority.High: return 'bg-error-container/40 text-on-error-container';
      case TaskPriority.Medium: return 'bg-secondary-container/60 text-secondary';
      case TaskPriority.Low: return 'bg-surface-container-high text-on-surface-variant';
    }
  }
}
