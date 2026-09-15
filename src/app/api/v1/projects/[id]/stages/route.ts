/**
 * GET  /api/v1/projects/{id}/stages — etapas do projeto
 * PUT  /api/v1/projects/{id}/stages — substitui a lista de etapas
 *
 * As etapas agrupam atividades e dão ao cliente a noção de "em que fase
 * estamos" exigida pelo doc 03. A substituição é em bloco porque reordenar
 * é a operação mais comum, e reordenar item a item gera estados
 * intermediários inválidos — `position` é único por projeto.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/server/db';
import { route } from '@/server/api/handler';
import { resolveProjectAccess, requirePermission, requireWritableProject } from '@/server/auth/authorize';
import { audit } from '@/server/audit';

type Params = { id: string };

export const GET = route<Params>(async ({ actor, params }) => {
  const access = await resolveProjectAccess(actor, params.id);
  requirePermission(access, 'project.read');

  const stages = await prisma.stage.findMany({
    where: { projectId: params.id },
    select: {
      id: true,
      name: true,
      position: true,
      startDate: true,
      endDate: true,
      _count: { select: { activities: true } },
    },
    orderBy: { position: 'asc' },
  });

  return NextResponse.json({ data: stages });
});

const putBody = z.object({
  stages: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        name: z.string().trim().min(1).max(120),
        startDate: z.coerce.date().nullable().optional(),
        endDate: z.coerce.date().nullable().optional(),
      }),
    )
    .max(30),
});

export const PUT = route<Params>(async ({ actor, request, params }) => {
  const access = await resolveProjectAccess(actor, params.id);
  requirePermission(access, 'project.update');
  requireWritableProject(access);

  const { stages } = putBody.parse(await request.json());

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.stage.findMany({
      where: { projectId: params.id },
      select: { id: true },
    });
    const keep = new Set(stages.map((s) => s.id).filter(Boolean));

    // Etapa removida solta as atividades em vez de apagá-las.
    const remove = existing.filter((s) => !keep.has(s.id)).map((s) => s.id);
    if (remove.length > 0) {
      await tx.activity.updateMany({
        where: { stageId: { in: remove } },
        data: { stageId: null },
      });
      await tx.stage.deleteMany({ where: { id: { in: remove } } });
    }

    // Posições saem do caminho antes de serem reatribuídas: `position` é
    // único por projeto, e trocar duas de lugar colidiria no meio do caminho.
    await tx.stage.updateMany({
      where: { projectId: params.id },
      data: { position: { increment: 1000 } },
    });

    const saved = [];
    for (const [index, stage] of stages.entries()) {
      const data = {
        name: stage.name,
        position: index + 1,
        startDate: stage.startDate ?? null,
        endDate: stage.endDate ?? null,
      };
      saved.push(
        stage.id
          ? await tx.stage.update({ where: { id: stage.id }, data })
          : await tx.stage.create({ data: { ...data, projectId: params.id } }),
      );
    }
    return saved;
  });

  await audit({
    actorUserId: actor.id,
    action: 'project.updated',
    entityType: 'Project',
    entityId: params.id,
    after: { stages: result.map((s) => ({ name: s.name, position: s.position })) },
  });

  return NextResponse.json({ data: result });
});
