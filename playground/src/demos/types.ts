export interface Member {
  id: string;
  name: string;
  role: string;
  projects: number;
  status: '启用' | '待邀请';
}
