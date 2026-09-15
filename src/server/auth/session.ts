/**
 * Ponte entre a sessão do Auth.js e o `Actor` da camada de autorização.
 *
 * Toda rota e todo Server Component começa aqui. `requireActor` lança 401
 * quando não há sessão válida, para que nenhuma rota precise lembrar de
 * checar — esquecer de chamar é erro visível; esquecer de checar não é.
 */

import { auth } from '@/auth';
import { AuthorizationError } from './errors';
import type { Actor } from './authorize';

export async function currentActor(): Promise<Actor | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  // Conta bloqueada ou ainda não aceita não opera, mesmo com sessão viva.
  if (session.user.status !== 'active') return null;

  return {
    id: session.user.id,
    isSuperAdmin: session.user.isSuperAdmin,
    isInternal: session.user.isInternal,
  };
}

export async function requireActor(): Promise<Actor> {
  const actor = await currentActor();
  if (!actor) throw new AuthorizationError('unauthenticated');
  return actor;
}
