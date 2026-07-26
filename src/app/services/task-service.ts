import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  TaskResponseDto,
  CreateTaskDto,
  UpdateTaskDto,
  UpdateTaskStatusDto,
  ProjectTaskStatus,
} from '../models/taskDto';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/tasks`;
  private readonly REQ_TIMEOUT = 15000;

  getByProject(
    projectId: number,
    status?: ProjectTaskStatus | null
  ): Observable<TaskResponseDto[]> {
    let params = new HttpParams();
    if (status != null) {
      params = params.set('status', status);
    }
    return this.http
      .get<TaskResponseDto[]>(`${this.baseUrl}/project/${projectId}`, { params })
      .pipe(timeout(this.REQ_TIMEOUT));
  }

  getAll(status?: ProjectTaskStatus | null): Observable<TaskResponseDto[]> {
    let params = new HttpParams();
    if (status != null) {
      params = params.set('status', status);
    }
    return this.http
      .get<TaskResponseDto[]>(this.baseUrl, { params })
      .pipe(timeout(this.REQ_TIMEOUT));
  }

  getById(taskId: number): Observable<TaskResponseDto> {
    return this.http
      .get<TaskResponseDto>(`${this.baseUrl}/${taskId}`)
      .pipe(timeout(this.REQ_TIMEOUT));
  }

  create(dto: CreateTaskDto): Observable<TaskResponseDto> {
    return this.http
      .post<TaskResponseDto>(this.baseUrl, dto)
      .pipe(timeout(this.REQ_TIMEOUT));
  }

  update(taskId: number, dto: UpdateTaskDto): Observable<TaskResponseDto> {
    return this.http
      .put<TaskResponseDto>(`${this.baseUrl}/${taskId}`, dto)
      .pipe(timeout(this.REQ_TIMEOUT));
  }

  updateStatus(
    taskId: number,
    dto: UpdateTaskStatusDto
  ): Observable<TaskResponseDto> {
    return this.http
      .patch<TaskResponseDto>(`${this.baseUrl}/${taskId}/status`, dto)
      .pipe(timeout(this.REQ_TIMEOUT));
  }

  delete(taskId: number): Observable<string> {
    return this.http
      .delete(`${this.baseUrl}/${taskId}`, { responseType: 'text' })
      .pipe(timeout(this.REQ_TIMEOUT));
  }
}
