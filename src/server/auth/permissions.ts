/**
 * Catálogo de permissões e conjuntos por perfil.
 *
 * Implementa docs/14-matriz-permissoes.md. Este arquivo é a única definição
 * de "o que cada perfil pode fazer" — nenhuma rota deve inferir capacidade
 * a partir do perfil por conta própria.
 */

import { MemberRole } from '@/generated/prisma';

/** As 22 permissões granulares do doc 14. */
export const PERMISSIONS = [
  'project.read',
  'project.create',
  'project.update',
  'project.archive',
  'activity.read',
  'activity.manage',
  'activity.update_own',
  'material.read',
  'material.upload',
  'material.publish',
  'time.read_own',
  'time.read_all',
  'time.create',
  'time.approve',
  'update.create',
  'update.read',
  'notice.manage',
  'feedback.create',
  'feedback.read_all',
  'feedback.manage',
  'user.manage',
  'permission.manage',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ALL: readonly Permission[] = PERMISSIONS;

/**
 * Conjunto concedido por padrão a cada perfil, na seção "Conjuntos por
 * perfil" do doc 14.
 *
 * O Admin geral não aparece aqui: seu escopo é global e resolvido antes,
 * em `resolveAccess`.
 */
export const DEFAULT_PERMISSIONS: Record<MemberRole, readonly Permission[]> = {
  admin: ALL,

  ops: [
    'project.read',
    'project.update',
    'activity.read',
    'activity.manage',
    'material.read',
    'material.upload',
    'material.publish',
    'time.read_own',
    'time.read_all',
    'time.create',
    'update.create',
    'update.read',
    'feedback.create',
    'feedback.read_all',
    'feedback.manage',
  ],

  trainer: [
    'project.read',
    'activity.read',
    'activity.update_own',
    'material.read',
    'material.upload',
    'time.read_own',
    'time.create',
    'update.create',
    'update.read',
    'feedback.create',
  ],

  client_focal: [
    'project.read',
    'activity.read',
    'material.read',
    'update.read',
    'feedback.create',
  ],

  /**
   * O aluno não recebe `activity.read`: a visão de execução pertence ao
   * ponto focal — ver D-005 em docs/12.
   */
  client_learner: [
    'project.read',
    'material.read',
    'update.read',
    'feedback.create',
  ],
};

/**
 * Permissões que o Admin pode conceder ao perfil Operação além do padrão —
 * os campos marcados com "○" na matriz.
 */
export const GRANTABLE_TO_OPS: readonly Permission[] = [
  'project.create',
  'notice.manage',
  'time.approve',
  'user.manage',
];

/**
 * Permissões que nunca podem ser concedidas a um perfil, por mais que
 * alguém tente gravá-las em `ProjectMember.permissions`.
 *
 * `permission.manage` é exclusiva do Admin geral: quem altera permissões
 * pode escalar a si mesmo. `material.publish` não vai ao professor porque
 * a revisão da 3ADS antes de o material chegar ao cliente é controle de
 * qualidade, não conveniência — ver doc 03 e a matriz do doc 14.
 */
export const NEVER_GRANTABLE: Record<MemberRole, readonly Permission[]> = {
  admin: [],
  ops: ['permission.manage', 'project.archive'],
  trainer: [
    'permission.manage',
    'user.manage',
    'project.create',
    'project.update',
    'project.archive',
    'activity.manage',
    'material.publish',
    'time.read_all',
    'time.approve',
    'notice.manage',
    'feedback.read_all',
    'feedback.manage',
  ],
  client_focal: [
    'permission.manage',
    'user.manage',
    'project.create',
    'project.update',
    'project.archive',
    'activity.manage',
    'activity.update_own',
    'material.upload',
    'material.publish',
    'time.read_own',
    'time.read_all',
    'time.create',
    'time.approve',
    'update.create',
    'notice.manage',
    'feedback.read_all',
    'feedback.manage',
  ],
  client_learner: [
    'permission.manage',
    'user.manage',
    'project.create',
    'project.update',
    'project.archive',
    'activity.read',
    'activity.manage',
    'activity.update_own',
    'material.upload',
    'material.publish',
    'time.read_own',
    'time.read_all',
    'time.create',
    'time.approve',
    'update.create',
    'notice.manage',
    'feedback.read_all',
    'feedback.manage',
  ],
};

/** Perfis que pertencem à equipe da 3ADS. */
export const INTERNAL_ROLES: readonly MemberRole[] = ['admin', 'ops'];

/** Perfis de cliente, que enxergam apenas conteúdo publicado. */
export const CLIENT_ROLES: readonly MemberRole[] = ['client_focal', 'client_learner'];

export const isInternalRole = (role: MemberRole) => INTERNAL_ROLES.includes(role);
export const isClientRole = (role: MemberRole) => CLIENT_ROLES.includes(role);

/**
 * Resolve as permissões efetivas de um vínculo: o padrão do perfil mais as
 * concessões explícitas, descontando o que nunca pode ser concedido.
 *
 * A subtração final importa: ela garante que uma permissão gravada por
 * engano — ou por requisição forjada — em `ProjectMember.permissions` não
 * tenha efeito.
 */
export function effectivePermissions(
  role: MemberRole,
  granted: readonly string[] = [],
): Set<Permission> {
  const forbidden = new Set<string>(NEVER_GRANTABLE[role]);
  const result = new Set<Permission>();

  for (const permission of DEFAULT_PERMISSIONS[role]) {
    if (!forbidden.has(permission)) result.add(permission);
  }

  for (const permission of granted) {
    if (forbidden.has(permission)) continue;
    if ((PERMISSIONS as readonly string[]).includes(permission)) {
      result.add(permission as Permission);
    }
  }

  return result;
}

export const isPermission = (value: string): value is Permission =>
  (PERMISSIONS as readonly string[]).includes(value);
