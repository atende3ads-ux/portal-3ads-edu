/**
 * POST /api/v1/projects/{id}/status — transição de estado.
 *
 * Extensão do contrato do doc 10, que previa apenas `/archive`. As demais
 * transições do D-008 precisam de um caminho próprio porque envolvem
 * validação — encerrar um projeto não é o mesmo que editar um campo.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ProjectStatus } from '@/generated/prisma';
import { prisma } from '@/server/db';
import { route } from '@/server/api/handler';
import { resolveProjectAccess, requirePermission } from '@/server/auth/authorize';
import { AuthorizationError } from '@/server/auth/errors';
import { audit } from '@/server/audit';
import { canTransition, completionBlockers, transitionData } from '@/server/projects/lifecycle';

type Params = { id: string };

const body = z.object({
  status: z.enum(['draft', 'active', 'paused', 'completed', 'cancelled', 'archived']),
  reason: z.string().max(500).optional(),
});

export const POST = route<Params>(async ({ actor, request, params }) => {
  const access = await resolveProjectAccess(actor, params.id);
  requirePermission(access, 'project.update');

  const input = body.parse(await request.json());
  const target = input.status as ProjectStatus;

  const project = await prisma.project.findUniqueOrThrow({
    where: { id: params.id },
    select: { status: true, name: true },
  });

  if (project.status === target) {
    return NextResponse.json({ status: target, changed: false });
  }

  if (!canTransition(project.status, target)) {
    return NextResponse.json(
      {
        code: 'transicao_invalida',
        message: `Não é possível ir de "${project.status}" para "${target}".`,
        details: { from: project.status, to: target },
      },
      { status: 422 },
    );
  }

  // Arquivar e reabrir são do Admin geral.
  if (target === 'archived' || project.status === 'archived') {
    requirePermission(access, 'project.archive');
  }

  if (target === 'completed') {
    const blockers = await completionBlockers(params.id);
    if (blockers.length > 0) {
      return NextResponse.json(
        {
          code: 'encerramento_bloqueado',
          message: 'O projeto não pode ser encerrado ainda.',
          details: { blockers },
        },
        { status: 422 },
      );
    }
  }

  const updated = await prisma.project.update({
    where: { id: params.id },
    data: transitionData(target),
    select: { status: true, completedAt: true, archivedAt: true },
  });

  await audit({
    actorUserId: actor.id,
    action: 'project.status_changed',
    entityType: 'Project',
    entityId: params.id,
    before: { status: project.status },
    after: { status: target },
    context: input.reason ? { reason: input.reason } : undefined,
  });

  return NextResponse.json({ ...updated, changed: true });
});
