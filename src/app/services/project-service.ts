import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  ProjectResponseDto,
  CreateProjectDto,
  UpdateProjectDto,
} from '../models/project';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/projects`;
  private readonly REQ_TIMEOUT = 15000;

  getAll(): Observable<ProjectResponseDto[]> {
    return this.http
      .get<ProjectResponseDto[]>(this.baseUrl)
      .pipe(timeout(this.REQ_TIMEOUT));
  }

  getById(id: number): Observable<ProjectResponseDto> {
    return this.http
      .get<ProjectResponseDto>(`${this.baseUrl}/${id}`)
      .pipe(timeout(this.REQ_TIMEOUT));
  }

  create(dto: CreateProjectDto): Observable<ProjectResponseDto> {
    return this.http
      .post<ProjectResponseDto>(this.baseUrl, dto)
      .pipe(timeout(this.REQ_TIMEOUT));
  }

  update(id: number, dto: UpdateProjectDto): Observable<ProjectResponseDto> {
    return this.http
      .put<ProjectResponseDto>(`${this.baseUrl}/${id}`, dto)
      .pipe(timeout(this.REQ_TIMEOUT));
  }

  delete(id: number): Observable<string> {
    return this.http
      .delete(`${this.baseUrl}/${id}`, { responseType: 'text' })
      .pipe(timeout(this.REQ_TIMEOUT));
  }
}
