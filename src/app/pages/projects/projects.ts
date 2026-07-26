import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { finalize, catchError } from 'rxjs/operators';
import { ProjectService } from '../../services/project-service';
import { TaskService } from '../../services/task-service';
import { ProjectResponseDto, CreateProjectDto, UpdateProjectDto } from '../../models/project';
import { TaskResponseDto, ProjectTaskStatus } from '../../models/taskDto';

@Component({
  selector: 'app-projects',
  imports: [RouterLink, ReactiveFormsModule, DatePipe],
  templateUrl: './projects.html',
  styleUrl: './projects.css',
})
export class Projects implements OnInit {
  private readonly projectService = inject(ProjectService);
  private readonly taskService = inject(TaskService);
  private readonly fb = inject(FormBuilder);

  projects: ProjectResponseDto[] = [];
  tasks: TaskResponseDto[] = [];
  loading = true;
  showModal = false;
  saving = false;
  error = '';
  editingProject: ProjectResponseDto | null = null;

  projectForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', Validators.required],
  });

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading = true;
    this.error = '';
    forkJoin({
      projects: this.projectService.getAll().pipe(
        catchError((err) => { console.error('Projects fetch error', err); return of([] as ProjectResponseDto[]); }),
      ),
      tasks: this.taskService.getAll().pipe(
        catchError((err) => { console.error('Tasks fetch error', err); return of([] as TaskResponseDto[]); }),
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

  getTaskCount(projectId: number): number {
    return this.tasks.filter(t => t.projectId === projectId).length;
  }

  getCompletedCount(projectId: number): number {
    return this.tasks.filter(t => t.projectId === projectId && t.status === ProjectTaskStatus.Done).length;
  }

  getProgress(projectId: number): number {
    const total = this.getTaskCount(projectId);
    return total > 0 ? Math.round((this.getCompletedCount(projectId) / total) * 100) : 0;
  }

  getStatus(projectId: number): { label: string; class: string } {
    const total = this.getTaskCount(projectId);
    if (total === 0) return { label: 'Empty', class: 'bg-surface-container-high text-on-surface-variant' };
    const done = this.getCompletedCount(projectId);
    if (done === total) return { label: 'Completed', class: 'bg-tertiary-fixed text-on-tertiary-fixed-variant' };
    return { label: 'Active', class: 'bg-primary-container/10 text-primary' };
  }

  openCreateModal(): void {
    this.editingProject = null;
    this.projectForm.reset();
    this.showModal = true;
  }

  openEditModal(project: ProjectResponseDto, event: Event): void {
    event.stopPropagation();
    this.editingProject = project;
    this.projectForm.setValue({ name: project.name, description: project.description });
    this.showModal = true;
  }

  saveProject(): void {
    if (this.projectForm.invalid || this.saving) return;
    this.saving = true;
    const raw = this.projectForm.getRawValue();

    const obs = this.editingProject
      ? this.projectService.update(this.editingProject.id, raw as UpdateProjectDto)
      : this.projectService.create(raw as CreateProjectDto);

    obs.pipe(finalize(() => this.saving = false)).subscribe({
      next: () => {
        this.showModal = false;
        this.loadData();
      },
      error: (err) => { console.error('Save project error', err); this.error = 'Failed to save project'; },
    });
  }

  deleteProject(id: number, event: Event): void {
    event.stopPropagation();
    if (!confirm('Delete this project and all its tasks?')) return;
    this.projectService.delete(id).subscribe({
      next: () => this.loadData(),
      error: (err) => { console.error('Delete project error', err); this.error = 'Failed to delete project'; },
    });
  }
}
