/**
 * GET /api/v1/me — dados e permissões do usuário (doc 10).
 *
 * Devolve as permissões **por projeto**, e não um conjunto global: no modelo
 * do doc 14 a mesma pessoa pode ser Operação em um projeto e apenas leitora
 * em outro. Um conjunto único mentiria sobre o que ela pode fazer.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { route } from '@/server/api/handler';
import { visibleProjectsWhere } from '@/server/auth/authorize';
import { effectivePermissions, DEFAULT_PERMISSIONS } from '@/server/auth/permissions';

export const GET = route(async ({ actor }) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: actor.id },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      status: true,
      isInternal: true,
      isSuperAdmin: true,
      organization: { select: { id: true, name: true, type: true } },
    },
  });

  /**
   * Os vínculos precisam passar pela mesma regra de visibilidade das
   * listagens: ser membro não basta, porque um projeto em rascunho é
   * invisível para professor e cliente ainda que eles já estejam vinculados.
   * Listar `ProjectMember` direto revelaria a existência do rascunho.
   */
  const memberships = await prisma.projectMember.findMany({
    where: {
      userId: actor.id,
      removedAt: null,
      project: visibleProjectsWhere(actor),
    },
    select: {
      projectId: true,
      role: true,
      permissions: true,
      project: { select: { name: true, status: true } },
    },
  });

  return NextResponse.json({
    user,
    projects: memberships.map((m) => ({
      id: m.projectId,
      name: m.project.name,
      status: m.project.status,
      role: m.role,
      permissions: [...effectivePermissions(m.role, m.permissions)],
    })),
    // O Admin geral não tem ProjectMember: seu escopo é global.
    globalPermissions: actor.isSuperAdmin ? [...DEFAULT_PERMISSIONS.admin] : [],
  });
});
