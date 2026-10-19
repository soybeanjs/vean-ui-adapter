import type { Member } from './types';

export const tableScroll = { x: 480 };

export const members: Member[] = [
  { id: 'member-1', name: 'Soybean', role: '管理员', projects: 12, status: '启用' },
  { id: 'member-2', name: 'Alice', role: '开发者', projects: 8, status: '启用' },
  { id: 'member-3', name: 'Chris', role: '设计师', projects: 5, status: '待邀请' },
  { id: 'member-4', name: 'Robin', role: '开发者', projects: 10, status: '启用' }
];

export function compareProjects(left: Member, right: Member): number {
  return left.projects - right.projects;
}

export function getMemberKey(member: Member): string {
  return member.id;
}
