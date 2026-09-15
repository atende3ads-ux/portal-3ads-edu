/**
 * Os dez testes de autorização obrigatórios.
 *
 * Lista em docs/14-matriz-permissoes.md, seção "Testes obrigatórios". O doc
 * é explícito: regressão em autorização é defeito crítico e bloqueia o
 * deploy. Por isso rodam contra banco real, e não contra mocks — a regra
 * envolve consulta, e mock de consulta testa o mock.
 */

import { test, before, beforeEach, after, describe } from 'node:test';
import assert from 'node:assert/strict';

import { prisma } from '@/server/db';
import { AuthorizationError } from '@/server/auth/errors';
import {
  resolveProjectAccess,
  authorize,
  authorizeWrite,
  requirePermission,
  requireActivityOwnership,
  can,
  visibleProjectsWhere,
  visibleMaterialsWhere,
  visibleUpdatesWhere,
  visibleTimeEntriesWhere,
} from '@/server/auth/authorize';
import { effectivePermissions } from '@/server/auth/permissions';
import { audit, auditDenied } from '@/server/audit';
import { resetDatabase, seedScenario, type Scenario } from './fixtures';

let s: Scenario;

before(async () => {
  await resetDatabase();
});

beforeEach(async () => {
  await resetDatabase();
  s = await seedScenario();
});

after(async () => {
  await prisma.$disconnect();
});

/** Captura o erro de autorização de uma operação que deve falhar. */
async function denial(fn: () => Promise<unknown>): Promise<AuthorizationError> {
  try {
    await fn();
  } catch (error) {
    assert.ok(error instanceof AuthorizationError, `esperava AuthorizationError, veio ${error}`);
    return error;
  }
  assert.fail('a operação deveria ter sido negada');
}

describe('1 · Professor recebe 404 em projeto não autorizado', () => {
  test('acesso por identificador direto responde 404, não 403', async () => {
    const error = await denial(() => resolveProjectAccess(s.trainer, s.otherProjectId));
    assert.equal(error.status, 404);
    assert.equal(error.reason, 'out_of_scope');
  });

  test('projeto inexistente e projeto alheio respondem igual', async () => {
    const inexistente = await denial(() =>
      resolveProjectAccess(s.trainer, '00000000-0000-4000-8000-000000000000'));
    const alheio = await denial(() => resolveProjectAccess(s.trainer, s.otherProjectId));

    // A diferença entre as duas respostas é exatamente o que o doc 02 proíbe
    // vazar: se fossem distintas, daria para descobrir quais projetos existem.
    assert.equal(inexistente.status, alheio.status);
    assert.equal(inexistente.reason, alheio.reason);
  });

  test('projeto em rascunho é invisível ao professor, mesmo sendo membro', async () => {
    const membership = await prisma.projectMember.findFirst({
      where: { projectId: s.draftProjectId, userId: s.trainer.id },
    });
    assert.ok(membership, 'o professor precisa ser membro para o teste ter valor');

    const error = await denial(() => resolveProjectAccess(s.trainer, s.draftProjectId));
    assert.equal(error.status, 404);
  });

  test('a tentativa fica registrada em AuditLog', async () => {
    const error = await denial(() => resolveProjectAccess(s.trainer, s.otherProjectId));
    await auditDenied({
      actorUserId: s.trainer.id,
      reason: error.reason,
      route: `GET /api/v1/projects/${s.otherProjectId}`,
      entityType: 'Project',
      entityId: s.otherProjectId,
      ip: '203.0.113.7',
    });

    const registro = await prisma.auditLog.findFirst({
      where: { action: 'authz.denied', actorUserId: s.trainer.id },
    });
    assert.ok(registro, 'a negativa precisa ficar registrada');
    assert.equal(registro.entityId, s.otherProjectId);
    assert.ok(registro.ipHash, 'o hash do IP precisa estar presente');
    assert.ok(!registro.ipHash.includes('203.0.113'), 'o IP não pode ser gravado em claro');
  });
});

describe('2 · Professor não descobre projetos alheios em listagens', () => {
  test('a listagem devolve apenas os projetos autorizados', async () => {
    const projetos = await prisma.project.findMany({
      where: visibleProjectsWhere(s.trainer),
      select: { id: true, name: true },
    });

    const ids = projetos.map((p) => p.id);
    assert.ok(ids.includes(s.projectId));
    assert.ok(!ids.includes(s.otherProjectId), 'projeto alheio não pode aparecer');
    assert.ok(!ids.includes(s.draftProjectId), 'rascunho não pode aparecer');
  });

  test('nenhum nome de cliente alheio aparece no resultado', async () => {
    const projetos = await prisma.project.findMany({
      where: visibleProjectsWhere(s.trainer),
      include: { clientOrganization: true },
    });
    const texto = JSON.stringify(projetos);
    assert.ok(!texto.includes('Araguaia'), 'nome do cliente alheio vazou');
    assert.ok(!texto.includes('Workshop Liderança'), 'nome do projeto alheio vazou');
  });

  test('quem não é membro de nada não vê projeto algum', async () => {
    const projetos = await prisma.project.findMany({
      where: visibleProjectsWhere(s.outsider),
    });
    assert.equal(projetos.length, 0);
  });

  test('Admin geral enxerga todos', async () => {
    const projetos = await prisma.project.findMany({
      where: visibleProjectsWhere(s.admin),
    });
    assert.equal(projetos.length, 3);
  });
});

describe('3 · Cliente não escreve em dado operacional', () => {
  test('ponto focal não pode atualizar projeto', async () => {
    const error = await denial(() => authorize(s.clientFocal, s.projectId, 'project.update'));
    assert.equal(error.status, 403);
    assert.equal(error.reason, 'missing_permission');
  });

  test('ponto focal não pode gerenciar atividade', async () => {
    const error = await denial(() => authorize(s.clientFocal, s.projectId, 'activity.manage'));
    assert.equal(error.status, 403);
  });

  test('ponto focal não pode registrar horas', async () => {
    const error = await denial(() => authorize(s.clientFocal, s.projectId, 'time.create'));
    assert.equal(error.status, 403);
  });

  test('ponto focal não pode publicar material', async () => {
    const error = await denial(() => authorize(s.clientFocal, s.projectId, 'material.publish'));
    assert.equal(error.status, 403);
  });

  test('o que o cliente pode: ler e avaliar', async () => {
    const access = await resolveProjectAccess(s.clientFocal, s.projectId);
    assert.ok(can(access, 'project.read'));
    assert.ok(can(access, 'material.read'));
    assert.ok(can(access, 'feedback.create'));
  });
});

describe('4 · Cliente não recebe material privado nem em revisão', () => {
  test('a consulta do cliente devolve apenas publicados', async () => {
    const access = await resolveProjectAccess(s.clientFocal, s.projectId);
    const materiais = await prisma.material.findMany({
      where: visibleMaterialsWhere(access),
      select: { id: true, name: true, status: true },
    });

    assert.equal(materiais.length, 1);
    assert.equal(materiais[0]?.id, s.publishedMaterialId);
    const texto = JSON.stringify(materiais);
    assert.ok(!texto.includes('Proposta comercial'), 'material privado vazou');
    assert.ok(!texto.includes('Slides Aula 04'), 'material em revisão vazou');
  });

  test('o professor também não vê privado nem em revisão', async () => {
    const access = await resolveProjectAccess(s.trainer, s.projectId);
    const materiais = await prisma.material.findMany({ where: visibleMaterialsWhere(access) });
    assert.equal(materiais.length, 1);
    assert.equal(materiais[0]?.status, 'published');
  });

  test('a equipe 3ADS vê os três', async () => {
    const access = await resolveProjectAccess(s.ops, s.projectId);
    const materiais = await prisma.material.findMany({ where: visibleMaterialsWhere(access) });
    assert.equal(materiais.length, 3);
  });

  test('cliente vê apenas atualizações publicadas', async () => {
    const access = await resolveProjectAccess(s.clientFocal, s.projectId);
    const updates = await prisma.update.findMany({ where: visibleUpdatesWhere(access) });
    assert.equal(updates.length, 1);
    assert.equal(updates[0]?.visibility, 'published');
    assert.ok(!JSON.stringify(updates).includes('Margem do projeto'));
  });
});

describe('5 · Professor não publica material ao cliente', () => {
  test('a permissão é negada mesmo com o vínculo ativo', async () => {
    const error = await denial(() => authorize(s.trainer, s.projectId, 'material.publish'));
    assert.equal(error.status, 403);
  });

  test('conceder a permissão no vínculo não tem efeito', async () => {
    // Simula requisição forjada ou gravação indevida: alguém escreveu
    // `material.publish` em ProjectMember.permissions.
    await prisma.projectMember.update({
      where: { projectId_userId: { projectId: s.projectId, userId: s.trainer.id } },
      data: { permissions: ['material.publish', 'permission.manage', 'time.read_all'] },
    });

    const access = await resolveProjectAccess(s.trainer, s.projectId);
    assert.ok(!can(access, 'material.publish'), 'a concessão indevida não pode valer');
    assert.ok(!can(access, 'permission.manage'));
    assert.ok(!can(access, 'time.read_all'));

    // O professor continua com o que lhe cabe.
    assert.ok(can(access, 'material.upload'));
  });
});

describe('6 · Membro removido perde o acesso', () => {
  test('recebe 404 no projeto', async () => {
    const error = await denial(() => resolveProjectAccess(s.removed, s.projectId));
    assert.equal(error.status, 404);
    assert.equal(error.reason, 'inactive_membership');
  });

  test('não consegue criar registro', async () => {
    const error = await denial(() => authorize(s.removed, s.projectId, 'time.create'));
    assert.equal(error.status, 404);
  });

  test('o histórico que produziu permanece', async () => {
    // O doc 02 é explícito: remover acesso não apaga o histórico.
    const entradas = await prisma.timeEntry.findMany({ where: { projectId: s.projectId } });
    assert.ok(entradas.length > 0);
  });
});

describe('7 · Acesso a material verificado no momento do pedido', () => {
  test('quem não é do projeto não obtém o material', async () => {
    const error = await denial(() => authorize(s.outsider, s.projectId, 'material.read'));
    assert.equal(error.status, 404);
  });

  test('material privado exige perfil interno, não apenas material.read', async () => {
    const access = await resolveProjectAccess(s.clientFocal, s.projectId);
    assert.ok(can(access, 'material.read'));

    // Ter a permissão não basta: o recorte por estado é parte da regra.
    const material = await prisma.material.findFirst({
      where: { ...visibleMaterialsWhere(access), id: s.privateMaterialId },
    });
    assert.equal(material, null, 'material privado não pode ser alcançável pelo cliente');
  });

  test('o vínculo é reavaliado a cada pedido', async () => {
    const antes = await resolveProjectAccess(s.trainer, s.projectId);
    assert.ok(can(antes, 'material.read'));

    await prisma.projectMember.update({
      where: { projectId_userId: { projectId: s.projectId, userId: s.trainer.id } },
      data: { removedAt: new Date() },
    });

    // Um link emitido antes não pode continuar valendo.
    const error = await denial(() => authorize(s.trainer, s.projectId, 'material.read'));
    assert.equal(error.status, 404);
  });
});

describe('8 · Ninguém eleva as próprias permissões', () => {
  test('Operação não recebe permission.manage', async () => {
    const access = await resolveProjectAccess(s.ops, s.projectId);
    assert.ok(!can(access, 'permission.manage'));
  });

  test('conceder permission.manage a Operação não tem efeito', async () => {
    await prisma.projectMember.update({
      where: { projectId_userId: { projectId: s.projectId, userId: s.ops.id } },
      data: { permissions: ['permission.manage', 'project.archive'] },
    });

    const access = await resolveProjectAccess(s.ops, s.projectId);
    assert.ok(!can(access, 'permission.manage'), 'permission.manage é exclusiva do Admin geral');
    assert.ok(!can(access, 'project.archive'));
  });

  test('as permissões concedíveis a Operação funcionam', async () => {
    await prisma.projectMember.update({
      where: { projectId_userId: { projectId: s.projectId, userId: s.ops.id } },
      data: { permissions: ['time.approve', 'notice.manage'] },
    });

    const access = await resolveProjectAccess(s.ops, s.projectId);
    assert.ok(can(access, 'time.approve'));
    assert.ok(can(access, 'notice.manage'));
  });

  test('valor inválido em permissions é ignorado', async () => {
    await prisma.projectMember.update({
      where: { projectId_userId: { projectId: s.projectId, userId: s.ops.id } },
      data: { permissions: ['nao.existe', '*', 'admin'] },
    });
    const access = await resolveProjectAccess(s.ops, s.projectId);
    const efetivas = effectivePermissions('ops', ['nao.existe', '*', 'admin']);
    assert.equal(efetivas.size, access.permissions.size);
    assert.ok(!Array.from(access.permissions).some((p) => String(p) === '*'));
  });
});

describe('9 · time.read_own nunca devolve registro alheio', () => {
  test('o professor vê apenas as próprias horas', async () => {
    const access = await resolveProjectAccess(s.trainer, s.projectId);
    assert.ok(can(access, 'time.read_own'));
    assert.ok(!can(access, 'time.read_all'));

    const entradas = await prisma.timeEntry.findMany({
      where: visibleTimeEntriesWhere(access, s.trainer),
    });

    assert.equal(entradas.length, 1);
    assert.equal(entradas[0]?.id, s.trainerTimeEntryId);
    assert.ok(entradas.every((e) => e.userId === s.trainer.id));
  });

  test('a Operação vê as horas de todos no projeto', async () => {
    const access = await resolveProjectAccess(s.ops, s.projectId);
    const entradas = await prisma.timeEntry.findMany({
      where: visibleTimeEntriesWhere(access, s.ops),
    });
    assert.equal(entradas.length, 2);
  });

  test('cliente sem permissão de horas é recusado', async () => {
    const access = await resolveProjectAccess(s.clientFocal, s.projectId);
    assert.throws(() => visibleTimeEntriesWhere(access, s.clientFocal), AuthorizationError);
  });
});

describe('10 · Alteração de permissão gera AuditLog com antes e depois', () => {
  test('o registro guarda os dois estados', async () => {
    const antes = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: s.projectId, userId: s.ops.id } },
      select: { role: true, permissions: true },
    });

    const depois = await prisma.projectMember.update({
      where: { projectId_userId: { projectId: s.projectId, userId: s.ops.id } },
      data: { permissions: ['time.approve'] },
      select: { role: true, permissions: true },
    });

    await audit({
      actorUserId: s.admin.id,
      action: 'member.permissions_changed',
      entityType: 'ProjectMember',
      entityId: s.projectId,
      before: antes ?? undefined,
      after: depois,
      ip: '198.51.100.4',
    });

    const registro = await prisma.auditLog.findFirst({
      where: { action: 'member.permissions_changed' },
    });

    assert.ok(registro);
    assert.equal(registro.actorUserId, s.admin.id);
    assert.deepEqual((registro.before as { permissions: string[] }).permissions, []);
    assert.deepEqual((registro.after as { permissions: string[] }).permissions, ['time.approve']);
  });

  test('a trilha é imutável', async () => {
    await audit({
      actorUserId: s.admin.id,
      action: 'member.added',
      entityType: 'ProjectMember',
      entityId: s.projectId,
    });
    const registro = await prisma.auditLog.findFirstOrThrow({
      where: { action: 'member.added' },
    });

    await assert.rejects(
      () => prisma.auditLog.update({ where: { id: registro.id }, data: { action: 'outra' } }),
      /imutavel/i,
      'o banco precisa recusar alteração na trilha',
    );

    await assert.rejects(
      () => prisma.auditLog.delete({ where: { id: registro.id } }),
      /imutavel/i,
      'o banco precisa recusar remoção na trilha',
    );
  });
});

describe('Regras complementares de escopo', () => {
  test('projeto encerrado não aceita escrita', async () => {
    await prisma.project.update({
      where: { id: s.projectId },
      data: { status: 'completed' },
    });

    // Leitura continua valendo.
    const access = await resolveProjectAccess(s.trainer, s.projectId);
    assert.ok(can(access, 'project.read'));

    const error = await denial(() => authorizeWrite(s.trainer, s.projectId, 'time.create'));
    assert.equal(error.status, 403);
    assert.equal(error.reason, 'project_not_writable');
  });

  test('Admin geral escreve mesmo em projeto encerrado', async () => {
    await prisma.project.update({
      where: { id: s.projectId },
      data: { status: 'completed' },
    });
    const access = await authorizeWrite(s.admin, s.projectId, 'project.update');
    assert.ok(access.viaSuperAdmin);
  });

  test('atividade atribuída: o professor só mexe na própria', async () => {
    const access = await resolveProjectAccess(s.trainer, s.projectId);

    // A dele passa.
    requireActivityOwnership(access, s.trainer, s.trainer.id);

    // A de outra pessoa, não.
    assert.throws(
      () => requireActivityOwnership(access, s.trainer, s.ops.id),
      AuthorizationError,
    );
  });

  test('quem tem activity.manage mexe em qualquer uma', async () => {
    const access = await resolveProjectAccess(s.ops, s.projectId);
    requireActivityOwnership(access, s.ops, s.trainer.id);
  });

  test('aluno não tem acesso à visão de execução', async () => {
    const access = await resolveProjectAccess(s.clientLearner, s.projectId);
    assert.ok(!can(access, 'activity.read'), 'o aluno não vê atividades — D-005');
    assert.ok(can(access, 'material.read'));
    assert.throws(() => requirePermission(access, 'activity.read'), AuthorizationError);
  });
});
