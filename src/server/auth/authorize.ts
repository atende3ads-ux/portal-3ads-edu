/**
 * Autorização no servidor.
 *
 * Implementa o modelo de docs/14-matriz-permissoes.md: toda decisão responde
 * a duas perguntas, e ambas precisam passar.
 *
 *   1. O usuário tem a permissão?  — capacidade, do perfil e das concessões
 *   2. O recurso está no escopo?   — vínculo, de ProjectMember
 *
 * Esta é a única camada que decide acesso. Route Handlers e Server
 * Components chamam as mesmas funções: nunca existem duas implementações da
 * mesma regra, que é como as duas divergem com o tempo.
 */

import { MemberRole, ProjectStatus, type Prisma } from '@/generated/prisma';
import { prisma } from '@/server/db';
import { AuthorizationError } from './errors';
import {
  effectivePermissions,
  isClientRole,
  type Permission,
} from './permissions';

/** Usuário autenticado, como vem da sessão. */
export interface Actor {
  id: string;
  isSuperAdmin: boolean;
  isInternal: boolean;
}

/** Acesso resolvido de um ator a um projeto específico. */
export interface ProjectAccess {
  projectId: string;
  role: MemberRole;
  permissions: Set<Permission>;
  /** Verdadeiro quando o acesso vem do Admin geral, sem ProjectMember. */
  viaSuperAdmin: boolean;
  projectStatus: ProjectStatus;
}

/** Estados em que o projeto aceita escrita por quem não é Admin geral. */
const WRITABLE_STATUSES: readonly ProjectStatus[] = ['draft', 'active'];

/**
 * Estados invisíveis para quem não é da equipe 3ADS.
 * Um projeto em rascunho não existe para professor nem cliente.
 */
const INTERNAL_ONLY_STATUSES: readonly ProjectStatus[] = ['draft'];

/**
 * Resolve o acesso de um ator a um projeto.
 *
 * Lança `out_of_scope` (404) quando o projeto não existe **ou** quando
 * existe mas está fora do alcance do usuário. Os dois casos respondem
 * igual de propósito: a diferença entre eles é exatamente a informação que
 * o doc 02 proíbe vazar.
 */
export async function resolveProjectAccess(
  actor: Actor,
  projectId: string,
): Promise<ProjectAccess> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, status: true },
  });

  // Admin geral tem escopo global, mas ainda precisa que o projeto exista.
  if (actor.isSuperAdmin) {
    if (!project) throw new AuthorizationError('out_of_scope', projectId);
    return {
      projectId,
      role: MemberRole.admin,
      permissions: effectivePermissions(MemberRole.admin),
      viaSuperAdmin: true,
      projectStatus: project.status,
    };
  }

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: actor.id } },
    select: { role: true, permissions: true, removedAt: true },
  });

  // Projeto inexistente e projeto alheio produzem a mesma resposta.
  if (!project || !membership) {
    throw new AuthorizationError('out_of_scope', projectId);
  }

  // Membro removido perde o acesso, mas o histórico que produziu permanece.
  if (membership.removedAt) {
    throw new AuthorizationError('inactive_membership', projectId);
  }

  // Rascunho é invisível para professor e cliente, mesmo sendo membros.
  if (
    INTERNAL_ONLY_STATUSES.includes(project.status) &&
    !isInternalMember(membership.role)
  ) {
    throw new AuthorizationError('out_of_scope', projectId);
  }

  return {
    projectId,
    role: membership.role,
    permissions: effectivePermissions(membership.role, membership.permissions),
    viaSuperAdmin: false,
    projectStatus: project.status,
  };
}

const isInternalMember = (role: MemberRole) =>
  role === MemberRole.admin || role === MemberRole.ops;

/** Verifica capacidade. O escopo já foi resolvido por `resolveProjectAccess`. */
export function requirePermission(
  access: ProjectAccess,
  permission: Permission,
): void {
  if (!access.permissions.has(permission)) {
    throw new AuthorizationError('missing_permission', access.projectId);
  }
}

export const can = (access: ProjectAccess, permission: Permission): boolean =>
  access.permissions.has(permission);

/**
 * Exige que o projeto aceite escrita.
 *
 * Projeto pausado, encerrado, cancelado ou arquivado é somente leitura para
 * todos, exceto o Admin geral — ver D-008 em docs/12.
 */
export function requireWritableProject(access: ProjectAccess): void {
  if (access.viaSuperAdmin) return;
  if (!WRITABLE_STATUSES.includes(access.projectStatus)) {
    throw new AuthorizationError('project_not_writable', access.projectId);
  }
}

/**
 * Atalho para o caso mais comum: resolver escopo e exigir permissão.
 */
export async function authorize(
  actor: Actor,
  projectId: string,
  permission: Permission,
): Promise<ProjectAccess> {
  const access = await resolveProjectAccess(actor, projectId);
  requirePermission(access, permission);
  return access;
}

/** Como acima, exigindo também que o projeto aceite escrita. */
export async function authorizeWrite(
  actor: Actor,
  projectId: string,
  permission: Permission,
): Promise<ProjectAccess> {
  const access = await authorize(actor, projectId, permission);
  requireWritableProject(access);
  return access;
}

/**
 * Atividade atribuída: `activity.update_own` só vale para o próprio dono.
 * Quem tem `activity.manage` passa por cima disso.
 */
export function requireActivityOwnership(
  access: ProjectAccess,
  actor: Actor,
  ownerUserId: string | null,
): void {
  if (can(access, 'activity.manage')) return;
  if (can(access, 'activity.update_own') && ownerUserId === actor.id) return;
  throw new AuthorizationError('missing_permission', access.projectId);
}

// ---------------------------------------------------------------------------
// Filtros de consulta
//
// Autorização não é só permitir ou negar uma ação: é também limitar o que
// uma listagem devolve. As funções abaixo produzem cláusulas Prisma para
// que o recorte aconteça no banco — nunca filtrando em memória depois de
// ler tudo, que é como dado alheio vaza por engano.
// ---------------------------------------------------------------------------

/** Projetos visíveis a um ator, para listagens. */
export function visibleProjectsWhere(actor: Actor): Prisma.ProjectWhereInput {
  if (actor.isSuperAdmin) return {};

  return {
    members: {
      some: { userId: actor.id, removedAt: null },
    },
    // Rascunho só aparece para quem é da equipe naquele projeto.
    OR: [
      { status: { not: ProjectStatus.draft } },
      {
        status: ProjectStatus.draft,
        members: {
          some: {
            userId: actor.id,
            removedAt: null,
            role: { in: [MemberRole.admin, MemberRole.ops] },
          },
        },
      },
    ],
  };
}

/** Atualizações visíveis: cliente vê apenas o que foi publicado. */
export function visibleUpdatesWhere(access: ProjectAccess): Prisma.UpdateWhereInput {
  const base: Prisma.UpdateWhereInput = { projectId: access.projectId };
  if (isClientRole(access.role)) return { ...base, visibility: 'published' };
  return base;
}

/**
 * Materiais visíveis: cliente e professor veem apenas publicados.
 * `private` e `in_review` são internos — o segundo porque o arquivo ainda
 * não passou pela varredura antivírus (D-003).
 */
export function visibleMaterialsWhere(access: ProjectAccess): Prisma.MaterialWhereInput {
  const base: Prisma.MaterialWhereInput = { projectId: access.projectId };
  if (isInternalMember(access.role)) return base;
  return { ...base, status: 'published' };
}

/**
 * Horas visíveis: quem só tem `time.read_own` vê exclusivamente as próprias.
 */
export function visibleTimeEntriesWhere(
  access: ProjectAccess,
  actor: Actor,
): Prisma.TimeEntryWhereInput {
  const base: Prisma.TimeEntryWhereInput = { projectId: access.projectId };
  if (can(access, 'time.read_all')) return base;
  if (can(access, 'time.read_own')) return { ...base, userId: actor.id };
  throw new AuthorizationError('missing_permission', access.projectId);
}

/** Atividades visíveis. O aluno não tem acesso à visão de execução. */
export function visibleActivitiesWhere(
  access: ProjectAccess,
): Prisma.ActivityWhereInput {
  requirePermission(access, 'activity.read');
  return { projectId: access.projectId };
}
