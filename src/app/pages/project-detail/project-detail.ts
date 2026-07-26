import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { finalize, catchError } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { ProjectService } from '../../services/project-service';
import { TaskService } from '../../services/task-service';
import { ProjectResponseDto } from '../../models/project';
import { TaskResponseDto, CreateTaskDto, UpdateTaskDto, ProjectTaskStatus, TaskPriority } from '../../models/taskDto';

@Component({
  selector: 'app-project-detail',
  imports: [RouterLink, DatePipe, ReactiveFormsModule],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.css',
})
export class ProjectDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly projectService = inject(ProjectService);
  private readonly taskService = inject(TaskService);
  private readonly fb = inject(FormBuilder);

  project: ProjectResponseDto | null = null;
  tasks: TaskResponseDto[] = [];
  loading = true;
  showModal = false;
  saving = false;
  error = '';
  editingTask: TaskResponseDto | null = null;

  taskForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: [''],
    dueDate: [''],
    priority: [TaskPriority.Medium, Validators.required],
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.params['id']);
    if (!id) { this.router.navigate(['/projects']); return; }
    this.loadData(id);
  }

  private loadData(projectId: number): void {
    this.loading = true;
    this.error = '';
    forkJoin({
      project: this.projectService.getById(projectId).pipe(
        catchError((err) => { console.error('Project detail fetch error', err); return of(null as unknown as ProjectResponseDto); }),
      ),
      tasks: this.taskService.getByProject(projectId).pipe(
        catchError((err) => { console.error('Project tasks fetch error', err); return of([] as TaskResponseDto[]); }),
      ),
    }).pipe(
      finalize(() => this.loading = false),
    ).subscribe({
      next: (result) => {
        this.project = result.project;
        this.tasks = result.tasks;
        if (!result.project) this.error = 'Project not found.';
      },
    });
  }

  getProgress(): number {
    if (!this.tasks.length) return 0;
    const done = this.tasks.filter(t => t.status === ProjectTaskStatus.Done).length;
    return Math.round((done / this.tasks.length) * 100);
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

  openCreateModal(): void {
    this.editingTask = null;
    this.taskForm.reset({ priority: TaskPriority.Medium });
    this.showModal = true;
  }

  openEditModal(task: TaskResponseDto): void {
    this.editingTask = task;
    this.taskForm.setValue({
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate ? task.dueDate.substring(0, 10) : '',
      priority: task.priority,
    });
    this.showModal = true;
  }

  saveTask(): void {
    if (this.taskForm.invalid || !this.project || this.saving) return;
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
        next: (updated) => {
          const idx = this.tasks.findIndex(t => t.id === updated.id);
          if (idx >= 0) this.tasks[idx] = updated;
          this.showModal = false;
        },
        error: (err) => { console.error('Update task error', err); this.error = 'Failed to update task'; },
      });
    } else {
      const dto: CreateTaskDto = {
        title: raw.title,
        description: raw.description,
        dueDate,
        priority: raw.priority,
        projectId: this.project.id,
      };
      this.taskService.create(dto).pipe(finalize(() => this.saving = false)).subscribe({
        next: (task) => {
          this.tasks.push(task);
          this.showModal = false;
        },
        error: (err) => { console.error('Create task error', err); this.error = 'Failed to create task'; },
      });
    }
  }

  deleteTask(taskId: number): void {
    const swalWithBootstrapButtons = Swal.mixin({
      customClass: { confirmButton: 'btn btn-success', cancelButton: 'btn btn-danger' },
      buttonsStyling: false,
    });
    swalWithBootstrapButtons.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, cancel!',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        this.taskService.delete(taskId).subscribe({
          next: () => {
            swalWithBootstrapButtons.fire({ title: 'Deleted!', text: 'The task has been deleted.', icon: 'success' });
            this.tasks = this.tasks.filter(t => t.id !== taskId);
          },
          error: (err) => { console.error('Delete task error', err); this.error = 'Failed to delete task'; },
        });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        swalWithBootstrapButtons.fire({ title: 'Cancelled', text: 'Your task is safe :)', icon: 'error' });
      }
    });
  }

  updateStatus(task: TaskResponseDto): void {
    const newStatus = task.status === ProjectTaskStatus.Done ? ProjectTaskStatus.ToDo : task.status === ProjectTaskStatus.ToDo ? ProjectTaskStatus.InProgress : ProjectTaskStatus.Done;
    this.taskService.updateStatus(task.id, { status: newStatus }).subscribe({
      next: () => { task.status = newStatus; },
      error: (err) => { console.error('Update status error', err); this.error = 'Failed to update status'; },
    });
  }
}
