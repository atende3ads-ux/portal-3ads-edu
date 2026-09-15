/**
 * GET  /api/v1/projects — lista projetos autorizados (doc 10)
 * POST /api/v1/projects — cria projeto
 *
 * A listagem nunca devolve projeto fora do escopo. O recorte acontece no
 * banco, por `visibleProjectsWhere` — filtrar em memória depois de ler tudo
 * é como dado alheio vaza por engano.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/server/db';
import { route } from '@/server/api/handler';
import { visibleProjectsWhere } from '@/server/auth/authorize';
import { AuthorizationError } from '@/server/auth/errors';
import { audit } from '@/server/audit';
import { MemberRole } from '@/generated/prisma';

const listQuery = z.object({
  status: z.enum(['draft', 'active', 'paused', 'completed', 'cancelled', 'archived']).optional(),
  search: z.string().trim().min(1).max(120).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  cursor: z.string().uuid().optional(),
});

export const GET = route(async ({ actor, request }) => {
  const url = new URL(request.url);
  const query = listQuery.parse(Object.fromEntries(url.searchParams));

  const projects = await prisma.project.findMany({
    where: {
      AND: [
        visibleProjectsWhere(actor),
        query.status ? { status: query.status } : {},
        query.search
          ? {
              OR: [
                { name: { contains: query.search, mode: 'insensitive' } },
                { clientOrganization: { name: { contains: query.search, mode: 'insensitive' } } },
              ],
            }
          : {},
      ],
    },
    select: {
      id: true,
      name: true,
      type: true,
      format: true,
      status: true,
      startDate: true,
      endDate: true,
      plannedHours: true,
      currentStage: true,
      clientOrganization: { select: { id: true, name: true } },
      _count: { select: { members: true } },
    },
    orderBy: [{ status: 'asc' }, { endDate: 'asc' }],
    take: query.limit + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
  });

  const hasMore = projects.length > query.limit;
  const page = hasMore ? projects.slice(0, query.limit) : projects;

  return NextResponse.json({
    data: page.map((p) => ({ ...p, plannedHours: Number(p.plannedHours) })),
    nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
  });
});

const createBody = z.object({
  name: z.string().trim().min(1).max(200),
  clientOrganizationId: z.string().uuid(),
  type: z.enum(['training', 'consulting', 'mentoring', 'lecture', 'hybrid']),
  format: z.enum(['online', 'in_person', 'hybrid']),
  description: z.string().max(5000).optional(),
  scope: z.string().max(5000).optional(),
  objectives: z.string().max(5000).optional(),
  deliverables: z.string().max(5000).optional(),
  notes: z.string().max(5000).optional(),
  plannedHours: z.number().min(0).max(100000).default(0),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  clientFocalUserId: z.string().uuid().optional(),
});

export const POST = route(async ({ actor, request }) => {
  // `project.create` não pertence a um projeto — ele ainda não existe.
  // A capacidade vem do perfil global: Admin geral, ou Operação com a
  // permissão concedida em algum projeto (ver "Conjuntos por perfil").
  if (!actor.isSuperAdmin) {
    const allowed = await prisma.projectMember.findFirst({
      where: {
        userId: actor.id,
        removedAt: null,
        role: MemberRole.ops,
        permissions: { has: 'project.create' },
      },
      select: { id: true },
    });
    if (!allowed) throw new AuthorizationError('missing_permission');
  }

  const body = createBody.parse(await request.json());

  const project = await prisma.project.create({
    data: {
      ...body,
      status: 'draft',
      createdById: actor.id,
      members: {
        create: {
          userId: actor.id,
          role: actor.isSuperAdmin ? MemberRole.admin : MemberRole.ops,
        },
      },
    },
    select: { id: true, name: true, status: true },
  });

  await audit({
    actorUserId: actor.id,
    action: 'project.created',
    entityType: 'Project',
    entityId: project.id,
    after: { name: body.name, type: body.type, format: body.format },
  });

  return NextResponse.json(project, { status: 201 });
});
