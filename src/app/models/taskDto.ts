export enum ProjectTaskStatus {
  ToDo = 'ToDo',
  InProgress = 'InProgress',
  Done = 'Done',
}

export enum TaskPriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
}

export interface TaskResponseDto {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  priority: TaskPriority;
  status: ProjectTaskStatus;
  projectId: number;
}

export interface CreateTaskDto {
  title: string;
  description: string;
  dueDate: string;
  priority: TaskPriority;
  projectId: number;
}

export interface UpdateTaskDto {
  title: string;
  description: string;
  dueDate: string;
  priority: TaskPriority;
  status: ProjectTaskStatus;
}

export interface UpdateTaskStatusDto {
  status: ProjectTaskStatus;
}
