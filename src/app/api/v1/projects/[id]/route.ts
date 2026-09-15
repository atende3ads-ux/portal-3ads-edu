/**
 * GET   /api/v1/projects/{id} — detalhe do projeto (doc 10)
 * PATCH /api/v1/projects/{id} — atualiza o projeto
 *
 * Esta rota é o critério de pronto do E1: um professor autenticado que
 * digitar o identificador de um projeto alheio precisa receber 404 — nunca
 * 403, que confirmaria a existência — e a tentativa precisa ficar
 * registrada. Ambas as coisas acontecem sem código próprio aqui: o 404 vem
 * de `resolveProjectAccess` e o registro, do envoltório `route`.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/server/db';
import { route } from '@/server/api/handler';
import {
  resolveProjectAccess,
  requirePermission,
  requireWritableProject,
  can,
  visibleUpdatesWhere,
  visibleMaterialsWhere,
} from '@/server/auth/authorize';
import { audit, sanitize } from '@/server/audit';

type Params = { id: string };

export const GET = route<Params>(async ({ actor, params }) => {
  const access = await resolveProjectAccess(actor, params.id);
  requirePermission(access, 'project.read');

  const project = await prisma.project.findUniqueOrThrow({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      type: true,
      format: true,
      description: true,
      scope: true,
      objectives: true,
      deliverables: true,
      status: true,
      currentStage: true,
      plannedHours: true,
      startDate: true,
      endDate: true,
      // Observações internas nunca vão para o cliente.
      notes: can(access, 'project.update'),
      clientOrganization: { select: { id: true, name: true } },
      clientFocalUser: { select: { id: true, name: true, avatarUrl: true } },
      stages: { select: { id: true, name: true, position: true }, orderBy: { position: 'asc' } },
      members: {
        where: { removedAt: null },
        select: {
          role: true,
          responsibility: true,
          user: { select: { id: true, name: true, avatarUrl: true, organization: { select: { name: true } } } },
        },
      },
    },
  });

  // Cada bloco adicional respeita o recorte do perfil.
  const [updates, materials, activities] = await Promise.all([
    prisma.update.findMany({
      where: visibleUpdatesWhere(access),
      select: {
        id: true, type: true, title: true, body: true, createdAt: true,
        author: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.material.findMany({
      where: visibleMaterialsWhere(access),
      select: { id: true, name: true, kind: true, status: true, publishedAt: true, downloadable: true },
      orderBy: { createdAt: 'desc' },
    }),
    can(access, 'activity.read')
      ? prisma.activity.findMany({
          where: { projectId: params.id },
          select: {
            id: true, title: true, description: true, status: true, priority: true, dueAt: true,
            owner: { select: { id: true, name: true } },
            stage: { select: { id: true, name: true } },
          },
          orderBy: [{ dueAt: 'asc' }],
        })
      : Promise.resolve([]),
  ]);

  return NextResponse.json({
    ...project,
    plannedHours: Number(project.plannedHours),
    updates,
    materials,
    activities,
    access: { role: access.role, permissions: [...access.permissions] },
  });
});

const patchBody = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  scope: z.string().max(5000).optional(),
  objectives: z.string().max(5000).optional(),
  deliverables: z.string().max(5000).optional(),
  notes: z.string().max(5000).optional(),
  plannedHours: z.number().min(0).max(100000).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  currentStage: z.string().max(200).optional(),
  clientFocalUserId: z.string().uuid().nullable().optional(),
});

export const PATCH = route<Params>(async ({ actor, request, params }) => {
  const access = await resolveProjectAccess(actor, params.id);
  requirePermission(access, 'project.update');
  requireWritableProject(access);

  const body = patchBody.parse(await request.json());

  const before = await prisma.project.findUniqueOrThrow({
    where: { id: params.id },
    select: {
      name: true, description: true, scope: true, objectives: true,
      deliverables: true, notes: true, plannedHours: true,
      startDate: true, endDate: true, currentStage: true, clientFocalUserId: true,
    },
  });

  const after = await prisma.project.update({
    where: { id: params.id },
    data: body,
    select: {
      id: true, name: true, description: true, scope: true, objectives: true,
      deliverables: true, notes: true, plannedHours: true,
      startDate: true, endDate: true, currentStage: true, clientFocalUserId: true,
    },
  });

  await audit({
    actorUserId: actor.id,
    action: 'project.updated',
    entityType: 'Project',
    entityId: params.id,
    before: sanitize({ ...before, plannedHours: Number(before.plannedHours) }),
    after: sanitize({ ...after, plannedHours: Number(after.plannedHours) }),
  });

  return NextResponse.json({ ...after, plannedHours: Number(after.plannedHours) });
});
