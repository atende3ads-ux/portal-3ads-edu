/**
 * Envoltório das rotas de `/api/v1`.
 *
 * Centraliza três coisas que toda rota precisa fazer igual:
 *
 *   - traduzir AuthorizationError no status certo (401, 403, 404);
 *   - registrar toda negativa em AuditLog, como exige o doc 14;
 *   - devolver erro no formato `{ code, message, details }` do doc 10.
 *
 * Fazer isso em cada rota levaria a variações — e a variação, aqui, vira
 * vazamento de informação: basta um 403 onde deveria haver 404.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { AuthorizationError, errorBody } from '@/server/auth/errors';
import { auditDenied } from '@/server/audit';
import { currentActor } from '@/server/auth/session';
import type { Actor } from '@/server/auth/authorize';

export interface RouteContext<P = Record<string, string>> {
  actor: Actor;
  request: NextRequest;
  params: P;
}

type Handler<P> = (ctx: RouteContext<P>) => Promise<NextResponse | Response>;

/** Endereço de origem, para o hash da auditoria. */
function clientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? null;
  return request.headers.get('x-real-ip');
}

/**
 * Rota autenticada. O handler só roda com um ator válido em mãos — não há
 * caminho em que ele receba `null` e precise lembrar de tratar.
 */
export function route<P = Record<string, string>>(handler: Handler<P>) {
  return async (
    request: NextRequest,
    segment: { params: Promise<P> },
  ): Promise<Response> => {
    const params = ((await segment?.params) ?? {}) as P;
    const actor = await currentActor();

    if (!actor) {
      const error = new AuthorizationError('unauthenticated');
      return NextResponse.json(errorBody(error), { status: 401 });
    }

    try {
      return await handler({ actor, request, params });
    } catch (error) {
      if (error instanceof AuthorizationError) {
        await auditDenied({
          actorUserId: actor.id,
          reason: error.reason,
          route: `${request.method} ${new URL(request.url).pathname}`,
          entityType: 'Route',
          entityId: error.resource ?? null,
          ip: clientIp(request),
          userAgent: request.headers.get('user-agent'),
        });
        return NextResponse.json(errorBody(error), { status: error.status });
      }

      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            code: 'invalid_request',
            message: 'Dados inválidos.',
            details: { issues: error.issues },
          },
          { status: 400 },
        );
      }

      // Falha inesperada: o cliente recebe um identificador, e o detalhe
      // fica no log do servidor. Mensagem de erro interna nunca sai daqui.
      const incident = crypto.randomUUID();
      console.error('[api] falha inesperada', { incident, error });
      return NextResponse.json(
        {
          code: 'internal_error',
          message: 'Falha inesperada. Informe o identificador ao suporte.',
          details: { incident },
        },
        { status: 500 },
      );
    }
  };
}
