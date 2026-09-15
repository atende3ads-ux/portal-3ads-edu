/**
 * Massa de desenvolvimento.
 *
 * Reproduz o cenário do protótipo — projeto Embaixadores IA para a IPOG,
 * com equipe, professor e cliente — para que as telas tenham dado real ao
 * serem construídas nas etapas seguintes.
 *
 * Nunca rode isto em produção: o doc 15 é explícito sobre não usar dados
 * reais fora de produção, e o inverso também vale.
 */

import { prisma } from '../src/server/db';

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('O seed não roda em produção.');
  }

  const agency = await prisma.organization.upsert({
    where: { id: '00000000-0000-4000-8000-000000000001' },
    update: {},
    create: { id: '00000000-0000-4000-8000-000000000001', name: '3ADS', type: 'agency' },
  });

  const ipog = await prisma.organization.upsert({
    where: { id: '00000000-0000-4000-8000-000000000002' },
    update: {},
    create: { id: '00000000-0000-4000-8000-000000000002', name: 'IPOG', type: 'client' },
  });

  const user = (
    email: string,
    name: string,
    extra: { isInternal?: boolean; isSuperAdmin?: boolean; organizationId?: string } = {},
  ) =>
    prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name,
        status: 'active',
        isInternal: extra.isInternal ?? false,
        isSuperAdmin: extra.isSuperAdmin ?? false,
        organizationId: extra.organizationId ?? null,
      },
    });

  const nathalia = await user('nathalia@3ads.com.br', 'Nathália Machado', {
    isInternal: true, isSuperAdmin: true, organizationId: agency.id,
  });
  const joao = await user('joao@3ads.com.br', 'João Reis', {
    isInternal: true, organizationId: agency.id,
  });
  const rafael = await user('rafael@parceiro.com.br', 'Rafael Martins');
  const jessica = await user('jessica@ipog.com.br', 'Jéssica Gomes', {
    organizationId: ipog.id,
  });

  const project = await prisma.project.upsert({
    where: { id: '00000000-0000-4000-8000-000000000010' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000010',
      clientOrganizationId: ipog.id,
      name: 'Embaixadores IA',
      type: 'hybrid',
      format: 'hybrid',
      description:
        'Programa de desenvolvimento e aplicação prática de IA para formação de líderes e embaixadores internos.',
      scope: 'Cinco encontros, material de apoio e acompanhamento de projetos internos.',
      plannedHours: 60,
      startDate: new Date('2026-07-15'),
      endDate: new Date('2026-11-30'),
      status: 'active',
      currentStage: 'Desenvolvimento',
      clientFocalUserId: jessica.id,
      createdById: nathalia.id,
    },
  });

  const member = (userId: string, role: 'admin' | 'ops' | 'trainer' | 'client_focal', responsibility: string) =>
    prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: project.id, userId } },
      update: {},
      create: { projectId: project.id, userId, role, responsibility },
    });

  await member(nathalia.id, 'admin', 'Direção do projeto');
  await member(joao.id, 'ops', 'Especialista em IA');
  await member(rafael.id, 'trainer', 'Aulas 03, 04 e 05');
  await member(jessica.id, 'client_focal', 'Ponto focal do cliente');

  const stages = ['01 Diagnóstico', '02 Planejamento', '03 Desenvolvimento', '04 Validação'];
  for (const [index, name] of stages.entries()) {
    await prisma.stage.upsert({
      where: { projectId_position: { projectId: project.id, position: index + 1 } },
      update: {},
      create: { projectId: project.id, name, position: index + 1 },
    });
  }

  const development = await prisma.stage.findFirstOrThrow({
    where: { projectId: project.id, position: 3 },
  });

  const activities = [
    { title: 'Reunião inicial', status: 'completed' as const, owner: nathalia.id, due: '2026-07-18' },
    { title: 'Levantamento dos processos', status: 'completed' as const, owner: joao.id, due: '2026-07-22' },
    { title: 'Desenvolvimento dos protótipos', status: 'in_progress' as const, owner: joao.id, due: '2026-08-22' },
    { title: 'Validar fluxos apresentados', status: 'waiting_client' as const, owner: jessica.id, due: '2026-08-23' },
    { title: 'Enviar material da Aula 04', status: 'in_progress' as const, owner: rafael.id, due: '2026-09-15' },
  ];

  for (const item of activities) {
    const exists = await prisma.activity.findFirst({
      where: { projectId: project.id, title: item.title },
    });
    if (exists) continue;
    await prisma.activity.create({
      data: {
        projectId: project.id,
        stageId: development.id,
        title: item.title,
        status: item.status,
        ownerUserId: item.owner,
        dueAt: new Date(item.due),
        completedAt: item.status === 'completed' ? new Date(item.due) : null,
        createdById: nathalia.id,
      },
    });
  }

  console.info('Massa de desenvolvimento criada.');
  console.info(`  organizações: 2 · usuários: 4 · projeto: ${project.name}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
