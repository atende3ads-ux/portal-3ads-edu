/**
 * Layout das áreas autenticadas.
 *
 * A navegação é montada no servidor conforme o perfil: o doc 01 é explícito
 * que o professor não deve enxergar a operação inteira, e o cliente menos
 * ainda. Montar no cliente exigiria enviar a lista completa e esconder o que
 * não cabe — que é esconder na interface, não autorizar.
 */

import { redirect } from 'next/navigation';
import { prisma } from '@/server/db';
import { currentActor } from '@/server/auth/session';
import { Shell, type NavItem } from '@/components/shell';
import { ROLE_LABEL } from '@/components/ui';
import { MemberRole } from '@/generated/prisma';

/** Itens visíveis hoje. Os das próximas etapas entram junto com elas. */
function navFor(roles: Set<MemberRole>, isSuperAdmin: boolean): NavItem[] {
  const internal = isSuperAdmin || roles.has('admin') || roles.has('ops');
  if (internal) return [{ href: '/projetos', label: 'Projetos' }];
  if (roles.has('trainer')) return [{ href: '/projetos', label: 'Meus projetos' }];
  return [{ href: '/projetos', label: 'Meu projeto' }];
}

function roleLabelFor(roles: Set<MemberRole>, isSuperAdmin: boolean): string {
  if (isSuperAdmin) return 'Administração geral';
  for (const role of ['admin', 'ops', 'trainer', 'client_focal', 'client_learner'] as const) {
    if (roles.has(role)) return ROLE_LABEL[role] ?? 'Portal 3ADS EDU';
  }
  return 'Portal 3ADS EDU';
}

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const actor = await currentActor();
  if (!actor) redirect('/entrar');

  const [user, memberships] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: actor.id },
      select: { name: true, email: true, avatarUrl: true },
    }),
    prisma.projectMember.findMany({
      where: { userId: actor.id, removedAt: null },
      select: { role: true },
    }),
  ]);

  const roles = new Set(memberships.map((m) => m.role));

  return (
    <Shell
      user={{
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        roleLabel: roleLabelFor(roles, actor.isSuperAdmin),
      }}
      nav={navFor(roles, actor.isSuperAdmin)}
    >
      {children}
    </Shell>
  );
}
