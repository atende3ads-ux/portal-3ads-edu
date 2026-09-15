/**
 * Ciclo de vida do projeto.
 *
 * Implementa D-008 de docs/12-decisoes-tecnicas.md.
 *
 *   draft → active → (paused) → completed → archived
 *   cancelled a partir de qualquer estado anterior a completed
 *
 * Arquivar **não apaga nada**: é mudança de visibilidade. A exclusão segue
 * o doc 15.
 */

import { ProjectStatus } from '@/generated/prisma';
import { prisma } from '@/server/db';

/** Transições permitidas a partir de cada estado. */
const TRANSITIONS: Record<ProjectStatus, readonly ProjectStatus[]> = {
  draft: ['active', 'cancelled'],
  active: ['paused', 'completed', 'cancelled'],
  paused: ['active', 'completed', 'cancelled'],
  completed: ['archived', 'active'],
  cancelled: ['archived'],
  // Reabrir exige `project.archive`, que só o Admin geral tem.
  archived: ['completed'],
};

export const canTransition = (from: ProjectStatus, to: ProjectStatus): boolean =>
  TRANSITIONS[from].includes(to);

export interface Blocker {
  code: string;
  message: string;
  count?: number;
}

/**
 * Impedimentos para encerrar um projeto.
 *
 * O D-008 exige: nenhum timer ativo, nenhuma hora pendente de aprovação, e
 * atividades em aberto concluídas ou canceladas explicitamente. A última é
 * deliberada — encerrar um projeto com tarefa em aberto esconde trabalho que
 * ficou por fazer, que é justamente o que o portal existe para evitar.
 */
export async function completionBlockers(projectId: string): Promise<Blocker[]> {
  const [runningTimers, pendingHours, openActivities] = await Promise.all([
    prisma.timeEntry.count({ where: { projectId, status: 'running' } }),
    prisma.timeEntry.count({ where: { projectId, status: 'submitted' } }),
    prisma.activity.count({
      where: { projectId, status: { notIn: ['completed', 'cancelled'] } },
    }),
  ]);

  const blockers: Blocker[] = [];

  if (runningTimers > 0) {
    blockers.push({
      code: 'timer_ativo',
      message: 'Há timer em execução no projeto.',
      count: runningTimers,
    });
  }

  if (pendingHours > 0) {
    blockers.push({
      code: 'horas_pendentes',
      message: 'Há registros de horas aguardando aprovação.',
      count: pendingHours,
    });
  }

  if (openActivities > 0) {
    blockers.push({
      code: 'atividades_abertas',
      message: 'Há atividades em aberto. Conclua ou cancele cada uma.',
      count: openActivities,
    });
  }

  return blockers;
}

/** Campos de data que acompanham cada transição. */
export function transitionData(to: ProjectStatus): Record<string, unknown> {
  switch (to) {
    case 'completed':
      return { status: to, completedAt: new Date(), archivedAt: null };
    case 'archived':
      return { status: to, archivedAt: new Date() };
    case 'active':
      return { status: to, completedAt: null, archivedAt: null };
    default:
      return { status: to };
  }
}

/** Dias após o encerramento até o arquivamento automático (D-008). */
export const AUTO_ARCHIVE_DAYS = 180;

/** Meses de acesso de cliente e professor após o encerramento (D-008). */
export const POST_COMPLETION_ACCESS_MONTHS = 12;
