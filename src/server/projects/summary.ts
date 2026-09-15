/**
 * Indicadores consolidados do projeto.
 *
 * Alimenta `GET /projects/{id}/summary` e o cabeçalho das três visões. Os
 * indicadores são os do doc 01, por perfil.
 *
 * Uma decisão importante: o consumo de escopo mostrado ao cliente usa apenas
 * horas **aprovadas**. O D-004 sujeita a hora de parceiro externo a
 * aprovação, e usar horas ainda em análise faria o número oscilar para baixo
 * quando uma fosse rejeitada — exatamente o tipo de informação instável que
 * destrói a confiança de quem acompanha.
 */

import { prisma } from '@/server/db';
import { isClientRole } from '@/server/auth/permissions';
import type { ProjectAccess } from '@/server/auth/authorize';

export interface ProjectSummary {
  progress: { percent: number; completed: number; total: number };
  hours: {
    planned: number;
    approved: number;
    pending: number;
    remaining: number;
    percentUsed: number;
    byType: Record<string, number>;
  };
  pending: { open: number; late: number; waitingClient: number };
  materials: { published: number; awaiting: number };
  nextMeeting: { id: string; title: string; dueAt: Date } | null;
  nps: { average: number | null; count: number } | null;
}

const minutesToHours = (minutes: number) => Math.round((minutes / 60) * 100) / 100;

export async function projectSummary(access: ProjectAccess): Promise<ProjectSummary> {
  const projectId = access.projectId;
  const forClient = isClientRole(access.role);
  const now = new Date();

  const [project, activities, approved, pending, byType, materials, next, feedbacks] =
    await Promise.all([
      prisma.project.findUniqueOrThrow({
        where: { id: projectId },
        select: { plannedHours: true },
      }),
      prisma.activity.groupBy({
        by: ['status'],
        where: { projectId },
        _count: true,
      }),
      prisma.timeEntry.aggregate({
        where: { projectId, status: 'approved' },
        _sum: { durationMinutes: true },
      }),
      prisma.timeEntry.aggregate({
        where: { projectId, status: 'submitted' },
        _sum: { durationMinutes: true },
      }),
      prisma.timeEntry.groupBy({
        by: ['type'],
        where: { projectId, status: 'approved' },
        _sum: { durationMinutes: true },
      }),
      prisma.material.groupBy({
        by: ['status'],
        where: { projectId },
        _count: true,
      }),
      prisma.activity.findFirst({
        where: { projectId, status: { notIn: ['completed', 'cancelled'] }, dueAt: { gte: now } },
        orderBy: { dueAt: 'asc' },
        select: { id: true, title: true, dueAt: true },
      }),
      prisma.feedback.aggregate({
        where: { projectId, score: { not: null } },
        _avg: { score: true },
        _count: { score: true },
      }),
    ]);

  const countOf = (...statuses: string[]) =>
    activities
      .filter((a) => statuses.includes(a.status))
      .reduce((sum, a) => sum + a._count, 0);

  const total = activities.reduce((sum, a) => sum + a._count, 0);
  const completed = countOf('completed');
  const cancelled = countOf('cancelled');
  const considered = Math.max(total - cancelled, 0);

  const plannedHours = Number(project.plannedHours);
  const approvedHours = minutesToHours(approved._sum.durationMinutes ?? 0);
  const pendingHours = minutesToHours(pending._sum.durationMinutes ?? 0);

  const lateCount = await prisma.activity.count({
    where: {
      projectId,
      status: { notIn: ['completed', 'cancelled'] },
      dueAt: { lt: now },
    },
  });

  const materialCount = (status: string) =>
    materials.find((m) => m.status === status)?._count ?? 0;

  return {
    progress: {
      percent: considered === 0 ? 0 : Math.round((completed / considered) * 100),
      completed,
      total: considered,
    },
    hours: {
      planned: plannedHours,
      approved: approvedHours,
      // O cliente não vê horas em análise: número instável não ajuda quem acompanha.
      pending: forClient ? 0 : pendingHours,
      remaining: Math.max(plannedHours - approvedHours, 0),
      percentUsed: plannedHours === 0 ? 0 : Math.round((approvedHours / plannedHours) * 100),
      byType: Object.fromEntries(
        byType.map((t) => [t.type, minutesToHours(t._sum.durationMinutes ?? 0)]),
      ),
    },
    pending: {
      open: countOf('not_started', 'in_progress', 'waiting_client', 'waiting_3ads', 'blocked'),
      late: lateCount,
      waitingClient: countOf('waiting_client'),
    },
    materials: {
      published: materialCount('published'),
      // Material aguardando publicação é informação interna.
      awaiting: forClient ? 0 : materialCount('in_review') + materialCount('private'),
    },
    nextMeeting: next ? { id: next.id, title: next.title, dueAt: next.dueAt! } : null,
    nps:
      feedbacks._count.score > 0
        ? {
            average: feedbacks._avg.score ? Math.round(feedbacks._avg.score * 10) / 10 : null,
            count: feedbacks._count.score,
          }
        : null,
  };
}
