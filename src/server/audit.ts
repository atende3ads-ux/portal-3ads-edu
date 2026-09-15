/**
 * Trilha de auditoria.
 *
 * Implementa a seção "Trilha de auditoria" de docs/15-retencao-e-privacidade.md.
 * A tabela é imutável no banco: um gatilho recusa UPDATE e DELETE, então um
 * registro gravado aqui não pode ser alterado nem pela aplicação.
 *
 * O endereço de origem nunca é armazenado em claro. O hash com sal permite
 * correlacionar tentativas — "cinco falhas de login do mesmo lugar" — sem
 * guardar o dado pessoal, conforme a minimização exigida no mesmo documento.
 */

import { createHash } from 'node:crypto';
import { prisma } from '@/server/db';
import type { Prisma } from '@/generated/prisma';

/** Ações registradas. Lista fechada para manter a trilha consultável. */
export type AuditAction =
  // Acesso
  | 'auth.token_issued'
  | 'auth.token_consumed'
  | 'auth.login'
  | 'auth.logout'
  | 'auth.failed'
  // Autorização
  | 'authz.denied'
  | 'member.added'
  | 'member.removed'
  | 'member.permissions_changed'
  | 'invite.created'
  | 'invite.accepted'
  | 'invite.revoked'
  // Projeto
  | 'project.created'
  | 'project.updated'
  | 'project.status_changed'
  // Horas
  | 'time.created'
  | 'time.updated'
  | 'time.approved'
  | 'time.rejected'
  | 'timer.started'
  | 'timer.stopped'
  // Materiais
  | 'material.uploaded'
  | 'material.published'
  | 'material.unpublished'
  | 'material.archived'
  | 'material.downloaded'
  // Feedback
  | 'feedback.created'
  | 'feedback.triaged'
  | 'feedback.assigned'
  | 'feedback.resolved'
  | 'feedback.identity_revealed'
  // Dados pessoais
  | 'user.exported'
  | 'user.anonymized'
  | 'user.deleted';

export interface AuditInput {
  actorUserId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  before?: Prisma.InputJsonValue | null;
  after?: Prisma.InputJsonValue | null;
  ip?: string | null;
  userAgent?: string | null;
  context?: Prisma.InputJsonValue | null;
}

/**
 * Hash do endereço com sal fixo.
 *
 * O sal precisa ser estável entre execuções — sem isso, o mesmo endereço
 * geraria hashes diferentes e a correlação se perderia, que é justamente o
 * motivo de guardar o campo.
 */
export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const salt = process.env.AUDIT_IP_SALT;
  if (!salt) {
    throw new Error('AUDIT_IP_SALT não configurada. Ver .env.example.');
  }
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32);
}

/**
 * Grava um evento.
 *
 * Nunca lança: uma falha de auditoria não pode derrubar a operação que a
 * originou. Mas também não passa em silêncio — vai para o log do servidor,
 * onde o monitoramento a encontra.
 */
export async function audit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: input.actorUserId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        before: input.before ?? undefined,
        after: input.after ?? undefined,
        ipHash: hashIp(input.ip),
        userAgent: input.userAgent ?? null,
        context: input.context ?? undefined,
      },
    });
  } catch (error) {
    console.error('[auditoria] falha ao registrar evento', {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      error,
    });
  }
}

/**
 * Registra uma tentativa de acesso negada.
 *
 * O doc 14 exige que toda resposta 403 e todo 404 por escopo gerem registro
 * com ator, rota, recurso pretendido e hash do IP. É o que permite detectar
 * alguém varrendo identificadores de projeto.
 */
export async function auditDenied(params: {
  actorUserId?: string | null;
  reason: string;
  route: string;
  entityType: string;
  entityId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  await audit({
    actorUserId: params.actorUserId,
    action: 'authz.denied',
    entityType: params.entityType,
    entityId: params.entityId,
    ip: params.ip,
    userAgent: params.userAgent,
    context: { reason: params.reason, route: params.route },
  });
}

/**
 * Remove campos que nunca devem entrar na trilha.
 *
 * O doc 15 é explícito: `before` e `after` nunca guardam segredo, token ou
 * conteúdo de arquivo.
 */
const SENSITIVE_KEYS = new Set([
  'password', 'senha', 'token', 'secret', 'accessToken', 'refreshToken',
  'access_token', 'refresh_token', 'id_token', 'sessionToken', 'session_token',
  'authorization', 'cookie', 'storageKey', 'storage_key',
]);

export function sanitize(value: Record<string, unknown>): Prisma.InputJsonObject {
  const result: Record<string, Prisma.InputJsonValue> = {};

  for (const [key, item] of Object.entries(value)) {
    if (SENSITIVE_KEYS.has(key)) {
      result[key] = '[omitido]';
      continue;
    }
    result[key] = toJson(item);
  }

  return result;
}

/**
 * Converte para algo que o Postgres aceita em coluna `jsonb`.
 *
 * Datas viram ISO 8601 e Decimal vira número: sem isso, um `before` com
 * `startDate` faria a gravação falhar — e uma falha de auditoria é
 * silenciosa por definição, então o erro só apareceria como trilha vazia.
 */
function toJson(item: unknown): Prisma.InputJsonValue {
  if (item === null || item === undefined) return null as unknown as Prisma.InputJsonValue;
  if (item instanceof Date) return item.toISOString();
  if (typeof item === 'bigint') return item.toString();
  if (Array.isArray(item)) return item.map(toJson);
  if (typeof item === 'object') {
    // Decimal do Prisma e afins expõem toString().
    const proto = Object.getPrototypeOf(item);
    if (proto !== Object.prototype && proto !== null) return String(item);
    return sanitize(item as Record<string, unknown>);
  }
  return item as Prisma.InputJsonValue;
}
