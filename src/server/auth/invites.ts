/**
 * Convites.
 *
 * O acesso ao portal nasce sempre de um convite: ninguém se cadastra
 * sozinho. O convite guarda o perfil e os projetos que a pessoa receberá,
 * para que a autorização já nasça correta em vez de ser ajustada depois.
 *
 * Implementa "Gerenciar acessos" do doc 03 e as regras do doc 14.
 */

import { randomBytes } from 'node:crypto';
import { MemberRole } from '@/generated/prisma';
import { prisma } from '@/server/db';
import { audit } from '@/server/audit';
import { AuthorizationError } from './errors';
import {
  GRANTABLE_TO_OPS,
  NEVER_GRANTABLE,
  isPermission,
  type Permission,
} from './permissions';
import { getMailer, inviteEmail } from './mailer';
import { isInternalEmail } from './config';
import type { Actor } from './authorize';

/** Validade do convite, em dias. */
export const INVITE_TTL_DAYS = 7;

export interface CreateInviteInput {
  email: string;
  name?: string;
  role: MemberRole;
  projectIds: string[];
  permissions?: string[];
}

/**
 * Filtra as permissões extras pedidas no convite.
 *
 * Só o Admin geral concede permissão extra, e só a Operação pode recebê-la.
 * O que não estiver nessa interseção é descartado em silêncio — o convite é
 * criado com o que sobrou, em vez de falhar, porque o pedido de permissão
 * indevida costuma ser engano de formulário, não ataque.
 */
function sanitizePermissions(role: MemberRole, requested: readonly string[]): Permission[] {
  if (role !== MemberRole.ops) return [];
  const forbidden = new Set<string>(NEVER_GRANTABLE[role]);
  return requested
    .filter(isPermission)
    .filter((p) => !forbidden.has(p))
    .filter((p) => GRANTABLE_TO_OPS.includes(p));
}

/**
 * Cria o convite e envia o e-mail.
 *
 * Quem convida precisa de `user.manage` em **todos** os projetos indicados.
 * Não basta ter a permissão em um deles: convidar para o projeto B usando
 * autorização do projeto A seria escalada lateral.
 */
export async function createInvite(
  actor: Actor,
  actorName: string,
  input: CreateInviteInput,
): Promise<{ id: string; token: string }> {
  const email = input.email.trim().toLowerCase();

  // Só o Admin geral cria outro Admin geral ou usuário interno.
  if (!actor.isSuperAdmin && (input.role === MemberRole.admin || input.role === MemberRole.ops)) {
    throw new AuthorizationError('missing_permission');
  }

  if (!actor.isSuperAdmin) {
    const authorized = await prisma.projectMember.findMany({
      where: { userId: actor.id, projectId: { in: input.projectIds }, removedAt: null },
      select: { projectId: true, role: true, permissions: true },
    });

    const allowed = new Set(
      authorized
        .filter((m) => m.role === MemberRole.admin || m.permissions.includes('user.manage'))
        .map((m) => m.projectId),
    );

    if (input.projectIds.some((id) => !allowed.has(id))) {
      throw new AuthorizationError('missing_permission');
    }
  }

  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

  const invite = await prisma.$transaction(async (tx) => {
    // O usuário é criado já como `invited`: o callback de entrada recusa
    // quem não existe, e é assim que a base permanece fechada.
    await tx.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: input.name ?? email,
        status: 'invited',
        isInternal: isInternalEmail(email),
      },
    });

    const created = await tx.invite.create({
      data: {
        email,
        name: input.name ?? null,
        role: input.role,
        permissions: sanitizePermissions(input.role, input.permissions ?? []),
        projectIds: input.projectIds,
        createdById: actor.id,
        expiresAt,
      },
    });

    await tx.verificationToken.create({
      data: { identifier: email, token, expires: expiresAt },
    });

    return created;
  });

  const url = `${process.env.AUTH_URL ?? 'http://localhost:3000'}/convite/${token}`;
  await getMailer().send({ to: email, ...inviteEmail(url, actorName) });

  await audit({
    actorUserId: actor.id,
    action: 'invite.created',
    entityType: 'Invite',
    entityId: invite.id,
    after: { email, role: input.role, projectIds: input.projectIds },
  });

  return { id: invite.id, token };
}

/**
 * Aceita o convite: cria os vínculos e consome o token.
 *
 * O token é de uso único — apagado na mesma transação que cria os vínculos,
 * para que uma segunda tentativa com o mesmo link não produza acesso.
 */
export async function acceptInvite(token: string): Promise<{ userId: string }> {
  const verification = await prisma.verificationToken.findUnique({ where: { token } });
  if (!verification || verification.expires < new Date()) {
    throw new AuthorizationError('unauthenticated');
  }

  const invite = await prisma.invite.findFirst({
    where: {
      email: verification.identifier,
      acceptedAt: null,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!invite) throw new AuthorizationError('unauthenticated');

  const user = await prisma.user.findUniqueOrThrow({
    where: { email: invite.email },
    select: { id: true },
  });

  await prisma.$transaction(async (tx) => {
    for (const projectId of invite.projectIds) {
      await tx.projectMember.upsert({
        where: { projectId_userId: { projectId, userId: user.id } },
        update: { role: invite.role, permissions: invite.permissions, removedAt: null },
        create: {
          projectId,
          userId: user.id,
          role: invite.role,
          permissions: invite.permissions,
        },
      });
    }

    await tx.user.update({ where: { id: user.id }, data: { status: 'active' } });
    await tx.invite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });
    await tx.verificationToken.delete({ where: { token } });
  });

  await audit({
    actorUserId: user.id,
    action: 'invite.accepted',
    entityType: 'Invite',
    entityId: invite.id,
    after: { projectIds: invite.projectIds, role: invite.role },
  });

  return { userId: user.id };
}

export async function revokeInvite(actor: Actor, inviteId: string): Promise<void> {
  const invite = await prisma.invite.findUnique({ where: { id: inviteId } });
  if (!invite) throw new AuthorizationError('out_of_scope', inviteId);
  if (!actor.isSuperAdmin && invite.createdById !== actor.id) {
    throw new AuthorizationError('missing_permission', inviteId);
  }

  await prisma.$transaction(async (tx) => {
    await tx.invite.update({ where: { id: inviteId }, data: { revokedAt: new Date() } });
    await tx.verificationToken.deleteMany({ where: { identifier: invite.email } });
  });

  await audit({
    actorUserId: actor.id,
    action: 'invite.revoked',
    entityType: 'Invite',
    entityId: inviteId,
  });
}
