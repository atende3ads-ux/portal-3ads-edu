import { currentActor } from '@/server/auth/session';
import { redirect } from 'next/navigation';

/**
 * Raiz. As telas dos três portais entram nas etapas E2 em diante; por ora
 * a raiz só resolve o destino conforme a sessão.
 */
export default async function Home() {
  const actor = await currentActor();
  if (!actor) redirect('/entrar');
  redirect('/projetos');
}
