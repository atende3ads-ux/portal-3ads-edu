/**
 * GET  /api/v1/projects/{id}/members — lista envolvidos (doc 10)
 * POST /api/v1/projects/{id}/members — adiciona ou convida
 *
 * O doc 03 pede que o cliente veja "nome, foto ou avatar, organização, papel
 * e canais liberados". A lista é visível a todos os membros; o que muda por
 * perfil é o detalhe: e-mail e permissões só saem para quem administra.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { MemberRole } from '@/generated/prisma';
import { prisma } from '@/server/db';
import { route } from '@/server/api/handler';
import { resolveProjectAccess, requirePermission, requireWritableProject, can } from '@/server/auth/authorize';
import { effectivePermissions } from '@/server/auth/permissions';
import { createInvite } from '@/server/auth/invites';
import { audit } from '@/server/audit';

type Params = { id: string };

export const GET = route<Params>(async ({ actor, params }) => {
  const access = await resolveProjectAccess(actor, params.id);
  requirePermission(access, 'project.read');

  const detailed = can(access, 'user.manage') || can(access, 'permission.manage');

  const members = await prisma.projectMember.findMany({
    where: { projectId: params.id, removedAt: null },
    select: {
      role: true,
      responsibility: true,
      joinedAt: true,
      permissions: detailed,
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          email: detailed,
          status: detailed,
          organization: { select: { id: true, name: true, type: true } },
        },
      },
    },
    orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
  });

  return NextResponse.json({
    data: members.map((m) => ({
      ...m.user,
      role: m.role,
      responsibility: m.responsibility,
      joinedAt: m.joinedAt,
      ...(detailed
        ? { permissions: [...effectivePermissions(m.role, m.permissions ?? [])] }
        : {}),
    })),
  });
});

const addBody = z.object({
  email: z.string().email(),
  name: z.string().trim().min(1).max(200).optional(),
  role: z.enum(['admin', 'ops', 'trainer', 'client_focal', 'client_learner']),
  responsibility: z.string().max(200).optional(),
  permissions: z.array(z.string()).max(30).optional(),
});

export const POST = route<Params>(async ({ actor, request, params }) => {
  const access = await resolveProjectAccess(actor, params.id);
  requirePermission(access, 'user.manage');
  requireWritableProject(access);

  const body = addBody.parse(await request.json());
  const email = body.email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, status: true },
  });

  // Pessoa já cadastrada entra direto no projeto; pessoa nova recebe convite.
  // O convite é o mesmo mecanismo do login (D-001), então não há um segundo
  // caminho de entrada para manter em pé.
  if (existing) {
    const member = await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: params.id, userId: existing.id } },
      update: { role: body.role, responsibility: body.responsibility, removedAt: null },
      create: {
        projectId: params.id,
        userId: existing.id,
        role: body.role,
        responsibility: body.responsibility,
      },
      select: { role: true, responsibility: true, joinedAt: true },
    });

    await audit({
      actorUserId: actor.id,
      action: 'member.added',
      entityType: 'ProjectMember',
      entityId: params.id,
      after: { userId: existing.id, email, role: body.role },
    });

    return NextResponse.json(
      { user: { id: existing.id, name: existing.name, email }, ...member, invited: false },
      { status: 201 },
    );
  }

  const inviter = await prisma.user.findUniqueOrThrow({
    where: { id: actor.id },
    select: { name: true },
  });

  const invite = await createInvite(actor, inviter.name, {
    email,
    name: body.name,
    role: body.role as MemberRole,
    projectIds: [params.id],
    permissions: body.permissions,
  });

  return NextResponse.json({ inviteId: invite.id, email, invited: true }, { status: 201 });
});
