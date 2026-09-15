/**
 * POST /api/v1/projects/{id}/archive — arquiva o projeto (doc 10).
 *
 * Arquivar é mudança de visibilidade: o projeto sai das listas padrão e fica
 * somente leitura para a equipe 3ADS. Nada é apagado — a exclusão segue o
 * doc 15.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { route } from '@/server/api/handler';
import { resolveProjectAccess, requirePermission } from '@/server/auth/authorize';
import { audit } from '@/server/audit';
import { canTransition, transitionData } from '@/server/projects/lifecycle';

type Params = { id: string };

export const POST = route<Params>(async ({ actor, params }) => {
  const access = await resolveProjectAccess(actor, params.id);
  requirePermission(access, 'project.archive');

  const project = await prisma.project.findUniqueOrThrow({
    where: { id: params.id },
    select: { status: true },
  });

  if (project.status === 'archived') {
    return NextResponse.json({ status: 'archived', changed: false });
  }

  if (!canTransition(project.status, 'archived')) {
    return NextResponse.json(
      {
        code: 'transicao_invalida',
        message: 'Só é possível arquivar projeto encerrado ou cancelado.',
        details: { from: project.status },
      },
      { status: 422 },
    );
  }

  const updated = await prisma.project.update({
    where: { id: params.id },
    data: transitionData('archived'),
    select: { status: true, archivedAt: true },
  });

  await audit({
    actorUserId: actor.id,
    action: 'project.status_changed',
    entityType: 'Project',
    entityId: params.id,
    before: { status: project.status },
    after: { status: 'archived' },
  });

  return NextResponse.json({ ...updated, changed: true });
});
