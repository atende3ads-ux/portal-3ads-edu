/**
 * GET /api/v1/projects/{id}/summary — indicadores consolidados (doc 10).
 *
 * O recorte por perfil acontece dentro de `projectSummary`: o cliente não
 * recebe horas em análise nem contagem de material aguardando publicação.
 */

import { NextResponse } from 'next/server';
import { route } from '@/server/api/handler';
import { resolveProjectAccess, requirePermission } from '@/server/auth/authorize';
import { projectSummary } from '@/server/projects/summary';

type Params = { id: string };

export const GET = route<Params>(async ({ actor, params }) => {
  const access = await resolveProjectAccess(actor, params.id);
  requirePermission(access, 'project.read');
  return NextResponse.json(await projectSummary(access));
});
