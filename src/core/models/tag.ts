export interface Tag {
  id: number;
  name: string;
  color: string;
  createdAt: string;
}

export interface CreateTagRequest {
  name: string;
  color: string;
}

export interface UpdateTagRequest {
  name: string;
  color: string;
}
