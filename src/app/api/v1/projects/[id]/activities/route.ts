/**
 * GET  /api/v1/projects/{id}/activities — lista e filtra (doc 10)
 * POST /api/v1/projects/{id}/activities — cria atividade
 *
 * A criação entra aqui, e não só em E3, porque sem ela o critério de pronto
 * do E2 não é verificável: "próximos passos" e "aguardando você" saem de
 * atividades. O restante de E3 — timer, conclusão, histórico por atividade —
 * vem na etapa seguinte.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/server/db';
import { route } from '@/server/api/handler';
import {
  resolveProjectAccess,
  requirePermission,
  requireWritableProject,
  visibleActivitiesWhere,
} from '@/server/auth/authorize';
import { AuthorizationError } from '@/server/auth/errors';
import { audit } from '@/server/audit';

type Params = { id: string };

const listQuery = z.object({
  status: z
    .enum(['not_started', 'in_progress', 'waiting_client', 'waiting_3ads', 'blocked', 'completed', 'cancelled'])
    .optional(),
  ownerUserId: z.string().uuid().optional(),
  stageId: z.string().uuid().optional(),
});

export const GET = route<Params>(async ({ actor, request, params }) => {
  const access = await resolveProjectAccess(actor, params.id);
  const base = visibleActivitiesWhere(access);
  const query = listQuery.parse(Object.fromEntries(new URL(request.url).searchParams));

  const activities = await prisma.activity.findMany({
    where: {
      ...base,
      ...(query.status ? { status: query.status } : {}),
      ...(query.ownerUserId ? { ownerUserId: query.ownerUserId } : {}),
      ...(query.stageId ? { stageId: query.stageId } : {}),
    },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      dueAt: true,
      completedAt: true,
      owner: { select: { id: true, name: true, avatarUrl: true } },
      stage: { select: { id: true, name: true } },
    },
    orderBy: [{ dueAt: 'asc' }, { createdAt: 'asc' }],
  });

  return NextResponse.json({ data: activities });
});

const createBody = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(5000).optional(),
  status: z
    .enum(['not_started', 'in_progress', 'waiting_client', 'waiting_3ads', 'blocked'])
    .default('not_started'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  ownerUserId: z.string().uuid().optional(),
  stageId: z.string().uuid().optional(),
  dueAt: z.coerce.date().optional(),
});

export const POST = route<Params>(async ({ actor, request, params }) => {
  const access = await resolveProjectAccess(actor, params.id);
  requirePermission(access, 'activity.manage');
  requireWritableProject(access);

  const body = createBody.parse(await request.json());

  // Responsável precisa ser membro ativo: atribuir a quem não participa do
  // projeto cria pendência que ninguém vê.
  if (body.ownerUserId) {
    const member = await prisma.projectMember.findFirst({
      where: { projectId: params.id, userId: body.ownerUserId, removedAt: null },
      select: { id: true },
    });
    if (!member) {
      return NextResponse.json(
        {
          code: 'responsavel_invalido',
          message: 'O responsável precisa ser membro ativo do projeto.',
          details: { ownerUserId: body.ownerUserId },
        },
        { status: 422 },
      );
    }
  }

  if (body.stageId) {
    const stage = await prisma.stage.findFirst({
      where: { id: body.stageId, projectId: params.id },
      select: { id: true },
    });
    if (!stage) throw new AuthorizationError('out_of_scope', body.stageId);
  }

  const activity = await prisma.activity.create({
    data: { ...body, projectId: params.id, createdById: actor.id },
    select: {
      id: true,
      title: true,
      status: true,
      dueAt: true,
      owner: { select: { id: true, name: true } },
      stage: { select: { id: true, name: true } },
    },
  });

  await audit({
    actorUserId: actor.id,
    action: 'project.updated',
    entityType: 'Activity',
    entityId: activity.id,
    after: { projectId: params.id, title: body.title, status: body.status },
  });

  return NextResponse.json(activity, { status: 201 });
});
