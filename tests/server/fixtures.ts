/**
 * Massa de teste.
 *
 * Monta um cenário próximo ao do protótipo: duas organizações clientes,
 * dois projetos, e pessoas com vínculos diferentes — incluindo um professor
 * que participa de um projeto e não do outro, que é o caso central dos
 * testes de escopo.
 */

import { prisma } from '@/server/db';
import type { Actor } from '@/server/auth/authorize';

export interface Scenario {
  admin: Actor & { name: string };
  ops: Actor;
  /** Professor com acesso apenas ao projeto "Embaixadores IA". */
  trainer: Actor;
  /** Professor sem acesso a nenhum dos dois projetos. */
  outsider: Actor;
  /** Ponto focal do cliente no projeto "Embaixadores IA". */
  clientFocal: Actor;
  /** Aluno no mesmo projeto. */
  clientLearner: Actor;
  /** Membro cujo vínculo foi encerrado. */
  removed: Actor;

  projectId: string;
  /** Projeto do qual o professor NÃO participa. */
  otherProjectId: string;
  /** Projeto em rascunho, invisível a professor e cliente. */
  draftProjectId: string;

  activityId: string;
  publishedMaterialId: string;
  privateMaterialId: string;
  reviewMaterialId: string;
  trainerTimeEntryId: string;
  opsTimeEntryId: string;
}

const actor = (id: string, opts: Partial<Actor> = {}): Actor => ({
  id,
  isSuperAdmin: opts.isSuperAdmin ?? false,
  isInternal: opts.isInternal ?? false,
});

export async function resetDatabase(): Promise<void> {
  // Ordem importa por causa das chaves estrangeiras. `audit_logs` tem
  // gatilho contra DELETE, então o TRUNCATE precisa desabilitá-lo.
  await prisma.$executeRawUnsafe('ALTER TABLE audit_logs DISABLE TRIGGER USER');
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE audit_logs, feedbacks, notices, materials, updates,
      time_entries, activities, stages, project_members, projects,
      invites, verification_tokens, sessions, accounts, users, organizations
    RESTART IDENTITY CASCADE
  `);
  await prisma.$executeRawUnsafe('ALTER TABLE audit_logs ENABLE TRIGGER USER');
}

export async function seedScenario(): Promise<Scenario> {
  const agency = await prisma.organization.create({
    data: { name: '3ADS', type: 'agency' },
  });
  const ipog = await prisma.organization.create({
    data: { name: 'IPOG', type: 'client' },
  });
  const araguaia = await prisma.organization.create({
    data: { name: 'Araguaia', type: 'client' },
  });

  const mk = (
    name: string,
    email: string,
    extra: { isInternal?: boolean; isSuperAdmin?: boolean; organizationId?: string } = {},
  ) =>
    prisma.user.create({
      data: {
        name,
        email,
        status: 'active',
        isInternal: extra.isInternal ?? false,
        isSuperAdmin: extra.isSuperAdmin ?? false,
        organizationId: extra.organizationId ?? null,
      },
    });

  const adminUser = await mk('Nathália Machado', 'nathalia@3ads.com.br', {
    isInternal: true,
    isSuperAdmin: true,
    organizationId: agency.id,
  });
  const opsUser = await mk('João Reis', 'joao@3ads.com.br', {
    isInternal: true,
    organizationId: agency.id,
  });
  const trainerUser = await mk('Rafael Martins', 'rafael@parceiro.com.br');
  const outsiderUser = await mk('Marina Alves', 'marina@outro.com.br');
  const focalUser = await mk('Jéssica Gomes', 'jessica@ipog.com.br', {
    organizationId: ipog.id,
  });
  const learnerUser = await mk('Pedro Lima', 'pedro@ipog.com.br', {
    organizationId: ipog.id,
  });
  const removedUser = await mk('Carla Souza', 'carla@parceiro.com.br');

  const project = await prisma.project.create({
    data: {
      clientOrganizationId: ipog.id,
      name: 'Embaixadores IA',
      type: 'hybrid',
      format: 'hybrid',
      description: 'Programa de desenvolvimento em IA.',
      plannedHours: 60,
      status: 'active',
      currentStage: 'Desenvolvimento',
      clientFocalUserId: focalUser.id,
      createdById: adminUser.id,
    },
  });

  const otherProject = await prisma.project.create({
    data: {
      clientOrganizationId: araguaia.id,
      name: 'Workshop Liderança',
      type: 'training',
      format: 'in_person',
      plannedHours: 12,
      status: 'active',
      createdById: adminUser.id,
    },
  });

  const draftProject = await prisma.project.create({
    data: {
      clientOrganizationId: ipog.id,
      name: 'Mentoria Growth',
      type: 'mentoring',
      format: 'online',
      plannedHours: 30,
      status: 'draft',
      createdById: adminUser.id,
    },
  });

  const member = (
    projectId: string,
    userId: string,
    role: 'admin' | 'ops' | 'trainer' | 'client_focal' | 'client_learner',
    extra: { permissions?: string[]; removedAt?: Date } = {},
  ) =>
    prisma.projectMember.create({
      data: {
        projectId,
        userId,
        role,
        permissions: extra.permissions ?? [],
        removedAt: extra.removedAt ?? null,
      },
    });

  await member(project.id, opsUser.id, 'ops');
  await member(project.id, trainerUser.id, 'trainer');
  await member(project.id, focalUser.id, 'client_focal');
  await member(project.id, learnerUser.id, 'client_learner');
  await member(project.id, removedUser.id, 'trainer', { removedAt: new Date() });

  // O professor participa deste projeto, mas não do "Workshop Liderança".
  await member(otherProject.id, opsUser.id, 'ops');

  // Rascunho: o professor é membro, mas não deve enxergá-lo.
  await member(draftProject.id, opsUser.id, 'ops');
  await member(draftProject.id, trainerUser.id, 'trainer');

  const activity = await prisma.activity.create({
    data: {
      projectId: project.id,
      title: 'Enviar material da Aula 04',
      description: 'Slides e conteúdo de apoio.',
      status: 'in_progress',
      ownerUserId: trainerUser.id,
      createdById: adminUser.id,
    },
  });

  const publishedMaterial = await prisma.material.create({
    data: {
      projectId: project.id,
      uploadedById: opsUser.id,
      name: 'Slides Aula 03.pdf',
      kind: 'document',
      mimeType: 'application/pdf',
      sizeBytes: BigInt(8_000_000),
      storageKey: 'projetos/embaixadores/slides-03.pdf',
      status: 'published',
      publishedAt: new Date(),
    },
  });

  const privateMaterial = await prisma.material.create({
    data: {
      projectId: project.id,
      uploadedById: opsUser.id,
      name: 'Proposta comercial.pdf',
      kind: 'document',
      storageKey: 'projetos/embaixadores/proposta.pdf',
      status: 'private',
    },
  });

  const reviewMaterial = await prisma.material.create({
    data: {
      projectId: project.id,
      uploadedById: trainerUser.id,
      name: 'Slides Aula 04.pptx',
      kind: 'document',
      storageKey: 'projetos/embaixadores/slides-04.pptx',
      status: 'in_review',
    },
  });

  const trainerEntry = await prisma.timeEntry.create({
    data: {
      projectId: project.id,
      userId: trainerUser.id,
      type: 'class_hour',
      description: 'Aula 03',
      startedAt: new Date('2026-09-08T14:00:00Z'),
      endedAt: new Date('2026-09-08T16:00:00Z'),
      durationMinutes: 120,
      source: 'manual',
      status: 'submitted',
    },
  });

  const opsEntry = await prisma.timeEntry.create({
    data: {
      projectId: project.id,
      userId: opsUser.id,
      type: 'material_production',
      description: 'Produção de material',
      startedAt: new Date('2026-09-14T09:00:00Z'),
      endedAt: new Date('2026-09-14T11:18:00Z'),
      durationMinutes: 138,
      source: 'timer',
      status: 'approved',
    },
  });

  await prisma.update.create({
    data: {
      projectId: project.id,
      authorUserId: trainerUser.id,
      type: 'class_report',
      title: 'Aula 03 concluída',
      body: 'Turma engajada.',
      visibility: 'published',
    },
  });

  await prisma.update.create({
    data: {
      projectId: project.id,
      authorUserId: opsUser.id,
      type: 'note',
      title: 'Margem do projeto',
      body: 'Consumo de horas acima do previsto para a etapa.',
      visibility: 'internal',
    },
  });

  return {
    admin: { ...actor(adminUser.id, { isSuperAdmin: true, isInternal: true }), name: adminUser.name },
    ops: actor(opsUser.id, { isInternal: true }),
    trainer: actor(trainerUser.id),
    outsider: actor(outsiderUser.id),
    clientFocal: actor(focalUser.id),
    clientLearner: actor(learnerUser.id),
    removed: actor(removedUser.id),
    projectId: project.id,
    otherProjectId: otherProject.id,
    draftProjectId: draftProject.id,
    activityId: activity.id,
    publishedMaterialId: publishedMaterial.id,
    privateMaterialId: privateMaterial.id,
    reviewMaterialId: reviewMaterial.id,
    trainerTimeEntryId: trainerEntry.id,
    opsTimeEntryId: opsEntry.id,
  };
}
