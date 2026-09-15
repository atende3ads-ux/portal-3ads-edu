/**
 * PATCH  /api/v1/projects/{id}/members/{userId} — altera papel e permissões
 * DELETE /api/v1/projects/{id}/members/{userId} — remove o acesso
 *
 * Alterar papel ou permissões exige `permission.manage`, exclusiva do Admin
 * geral: quem pode alterar permissões pode escalar a si mesmo (docs/14).
 *
 * Remover é encerrar o vínculo, nunca apagar registros — o doc 02 é
 * explícito: "a remoção de acesso não deve apagar o histórico produzido
 * pelo usuário".
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/server/db';
import { route } from '@/server/api/handler';
import { resolveProjectAccess, requirePermission, requireWritableProject } from '@/server/auth/authorize';
import { AuthorizationError } from '@/server/auth/errors';
import { GRANTABLE_TO_OPS, NEVER_GRANTABLE, isPermission } from '@/server/auth/permissions';
import { audit } from '@/server/audit';
import { MemberRole } from '@/generated/prisma';

type Params = { id: string; userId: string };

const patchBody = z.object({
  role: z.enum(['admin', 'ops', 'trainer', 'client_focal', 'client_learner']).optional(),
  responsibility: z.string().max(200).nullable().optional(),
  permissions: z.array(z.string()).max(30).optional(),
});

export const PATCH = route<Params>(async ({ actor, request, params }) => {
  const access = await resolveProjectAccess(actor, params.id);
  requirePermission(access, 'permission.manage');
  requireWritableProject(access);

  // Ninguém altera o próprio vínculo, nem sendo Admin geral. A regra evita
  // que uma conta comprometida se blinde alterando o próprio papel.
  if (params.userId === actor.id) {
    throw new AuthorizationError('missing_permission', params.userId);
  }

  const body = patchBody.parse(await request.json());

  const before = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: params.id, userId: params.userId } },
    select: { role: true, permissions: true, responsibility: true, removedAt: true },
  });

  if (!before || before.removedAt) {
    throw new AuthorizationError('out_of_scope', params.userId);
  }

  const role = (body.role ?? before.role) as MemberRole;

  // As permissões extras passam pelo mesmo filtro do convite: só Operação
  // recebe, e só o que é concedível. O resto é descartado.
  const permissions =
    body.permissions === undefined
      ? before.permissions
      : role !== MemberRole.ops
        ? []
        : body.permissions
            .filter(isPermission)
            .filter((p) => !new Set<string>(NEVER_GRANTABLE[role]).has(p))
            .filter((p) => GRANTABLE_TO_OPS.includes(p));

  const after = await prisma.projectMember.update({
    where: { projectId_userId: { projectId: params.id, userId: params.userId } },
    data: {
      role,
      permissions,
      ...(body.responsibility !== undefined ? { responsibility: body.responsibility } : {}),
    },
    select: { role: true, permissions: true, responsibility: true },
  });

  await audit({
    actorUserId: actor.id,
    action: 'member.permissions_changed',
    entityType: 'ProjectMember',
    entityId: `${params.id}:${params.userId}`,
    before: { role: before.role, permissions: before.permissions, responsibility: before.responsibility },
    after,
  });

  return NextResponse.json(after);
});

export const DELETE = route<Params>(async ({ actor, params }) => {
  const access = await resolveProjectAccess(actor, params.id);
  requirePermission(access, 'user.manage');
  requireWritableProject(access);

  if (params.userId === actor.id) {
    throw new AuthorizationError('missing_permission', params.userId);
  }

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: params.id, userId: params.userId } },
    select: { role: true, removedAt: true },
  });

  if (!member || member.removedAt) {
    throw new AuthorizationError('out_of_scope', params.userId);
  }

  // Apenas o Admin geral remove outro administrador.
  if (member.role === MemberRole.admin && !actor.isSuperAdmin) {
    throw new AuthorizationError('missing_permission', params.userId);
  }

  await prisma.projectMember.update({
    where: { projectId_userId: { projectId: params.id, userId: params.userId } },
    data: { removedAt: new Date() },
  });

  await audit({
    actorUserId: actor.id,
    action: 'member.removed',
    entityType: 'ProjectMember',
    entityId: `${params.id}:${params.userId}`,
    before: { role: member.role },
    context: { nota: 'o histórico produzido pelo usuário é preservado' },
  });

  return new NextResponse(null, { status: 204 });
});
