/**
 * Critério de pronto do E1, verificado por HTTP.
 *
 * docs/13-escopo-v1.md define: "um professor autenticado que digitar a URL
 * de um projeto alheio recebe 404 — não 403, para não confirmar a existência
 * do projeto — e a tentativa fica registrada em AuditLog".
 *
 * Os testes de autorização exercitam a camada diretamente; estes exercitam
 * o caminho completo, com servidor, sessão e cookie — é onde apareceria um
 * erro de fiação que a camada sozinha não revela.
 *
 * Exige o servidor rodando em BASE_URL (padrão http://127.0.0.1:3100).
 */

import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';

import { prisma } from '@/server/db';
import { resetDatabase, seedScenario, type Scenario } from './fixtures';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:3100';

let s: Scenario;
const cookies = new Map<string, string>();

/** Cria sessão no banco — a estratégia do Auth.js é `database`. */
async function login(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  await prisma.session.create({
    data: {
      sessionToken: token,
      userId,
      expires: new Date(Date.now() + 60 * 60 * 1000),
    },
  });
  return `authjs.session-token=${token}`;
}

const get = (path: string, cookie?: string) =>
  fetch(`${BASE}${path}`, {
    headers: {
      ...(cookie ? { cookie } : {}),
      'x-forwarded-for': '203.0.113.42',
    },
    redirect: 'manual',
  });

before(async () => {
  await resetDatabase();
  s = await seedScenario();
  for (const [name, actor] of [
    ['trainer', s.trainer], ['clientFocal', s.clientFocal],
    ['ops', s.ops], ['admin', s.admin], ['outsider', s.outsider],
  ] as const) {
    cookies.set(name, await login(actor.id));
  }
});

after(async () => {
  await prisma.$disconnect();
});

describe('Sessão', () => {
  test('sem sessão, a API responde 401', async () => {
    const response = await get(`/api/v1/projects/${s.projectId}`);
    assert.equal(response.status, 401);
    const body = await response.json();
    assert.equal(body.code, 'unauthenticated');
  });

  test('com sessão, /me devolve o usuário e suas permissões por projeto', async () => {
    const response = await get('/api/v1/me', cookies.get('trainer'));
    assert.equal(response.status, 200);

    const body = await response.json();
    assert.equal(body.user.id, s.trainer.id);
    assert.equal(body.projects.length, 1, 'o professor participa de um projeto visível');
    assert.equal(body.projects[0].id, s.projectId);
    assert.ok(body.projects[0].permissions.includes('material.upload'));
    assert.ok(!body.projects[0].permissions.includes('material.publish'));
    assert.deepEqual(body.globalPermissions, []);
  });
});

describe('Critério de pronto do E1', () => {
  test('professor em projeto alheio recebe 404, não 403', async () => {
    const response = await get(`/api/v1/projects/${s.otherProjectId}`, cookies.get('trainer'));

    assert.equal(response.status, 404, 'precisa ser 404: 403 confirmaria a existência');
    const body = await response.json();
    assert.equal(body.code, 'not_found');

    // A resposta não pode conter nada do projeto alheio.
    const texto = JSON.stringify(body);
    assert.ok(!texto.includes('Workshop'), 'nome do projeto vazou no erro');
    assert.ok(!texto.includes('Araguaia'), 'nome do cliente vazou no erro');
  });

  test('projeto inexistente responde exatamente igual', async () => {
    const alheio = await get(`/api/v1/projects/${s.otherProjectId}`, cookies.get('trainer'));
    const inexistente = await get(
      '/api/v1/projects/00000000-0000-4000-8000-0000000000ff',
      cookies.get('trainer'),
    );

    assert.equal(alheio.status, inexistente.status);
    assert.deepEqual(await alheio.json(), await inexistente.json());
  });

  test('a tentativa fica registrada em AuditLog', async () => {
    await get(`/api/v1/projects/${s.otherProjectId}`, cookies.get('trainer'));

    const registro = await prisma.auditLog.findFirst({
      where: { action: 'authz.denied', actorUserId: s.trainer.id },
      orderBy: { createdAt: 'desc' },
    });

    assert.ok(registro, 'toda negativa precisa gerar registro');
    const contexto = registro.context as { reason: string; route: string };
    assert.equal(contexto.reason, 'out_of_scope');
    assert.ok(contexto.route.includes(s.otherProjectId));
    assert.ok(registro.ipHash, 'o hash do IP precisa estar presente');
    assert.ok(!registro.ipHash.includes('203.0.113'), 'o IP não pode ser gravado em claro');
  });

  test('o professor acessa normalmente o projeto autorizado', async () => {
    const response = await get(`/api/v1/projects/${s.projectId}`, cookies.get('trainer'));
    assert.equal(response.status, 200);

    const body = await response.json();
    assert.equal(body.id, s.projectId);
    assert.equal(body.access.role, 'trainer');
  });
});

describe('Recorte por perfil na resposta', () => {
  test('cliente não recebe material privado nem observações internas', async () => {
    const response = await get(`/api/v1/projects/${s.projectId}`, cookies.get('clientFocal'));
    assert.equal(response.status, 200);

    const body = await response.json();
    const texto = JSON.stringify(body);

    assert.equal(body.materials.length, 1, 'apenas o material publicado');
    assert.ok(!texto.includes('Proposta comercial'), 'material privado vazou');
    assert.ok(!texto.includes('Slides Aula 04'), 'material em revisão vazou');
    assert.ok(!texto.includes('Margem do projeto'), 'atualização interna vazou');
    assert.equal(body.notes, undefined, 'observações internas não vão para o cliente');
  });

  test('a equipe 3ADS recebe tudo', async () => {
    const response = await get(`/api/v1/projects/${s.projectId}`, cookies.get('ops'));
    const body = await response.json();
    assert.equal(body.materials.length, 3);
    assert.equal(body.updates.length, 2);
  });

  test('a listagem do professor não inclui projeto alheio', async () => {
    const response = await get('/api/v1/projects', cookies.get('trainer'));
    assert.equal(response.status, 200);

    const body = await response.json();
    const ids = body.data.map((p: { id: string }) => p.id);
    assert.deepEqual(ids, [s.projectId]);
    assert.ok(!JSON.stringify(body).includes('Araguaia'));
  });

  test('quem não é membro de nada recebe lista vazia', async () => {
    const response = await get('/api/v1/projects', cookies.get('outsider'));
    const body = await response.json();
    assert.equal(body.data.length, 0);
  });

  test('o Admin geral vê os três projetos', async () => {
    const response = await get('/api/v1/projects', cookies.get('admin'));
    const body = await response.json();
    assert.equal(body.data.length, 3);
  });
});

describe('Escrita', () => {
  test('cliente recebe 403 ao tentar alterar o projeto', async () => {
    const response = await fetch(`${BASE}/api/v1/projects/${s.projectId}`, {
      method: 'PATCH',
      headers: {
        cookie: cookies.get('clientFocal')!,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ name: 'Nome alterado pelo cliente' }),
    });

    assert.equal(response.status, 403, 'o recurso está no escopo; falta capacidade');
    const body = await response.json();
    assert.equal(body.code, 'forbidden');

    const project = await prisma.project.findUniqueOrThrow({ where: { id: s.projectId } });
    assert.equal(project.name, 'Embaixadores IA', 'o projeto não pode ter mudado');
  });

  test('professor em projeto alheio recebe 404 mesmo no PATCH', async () => {
    const response = await fetch(`${BASE}/api/v1/projects/${s.otherProjectId}`, {
      method: 'PATCH',
      headers: { cookie: cookies.get('trainer')!, 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'x' }),
    });
    assert.equal(response.status, 404);
  });

  test('a Operação altera e a mudança fica auditada', async () => {
    const response = await fetch(`${BASE}/api/v1/projects/${s.projectId}`, {
      method: 'PATCH',
      headers: { cookie: cookies.get('ops')!, 'content-type': 'application/json' },
      body: JSON.stringify({ currentStage: 'Validação' }),
    });

    assert.equal(response.status, 200);

    const registro = await prisma.auditLog.findFirst({
      where: { action: 'project.updated', entityId: s.projectId },
      orderBy: { createdAt: 'desc' },
    });
    assert.ok(registro);
    assert.equal((registro.before as { currentStage: string }).currentStage, 'Desenvolvimento');
    assert.equal((registro.after as { currentStage: string }).currentStage, 'Validação');
  });

  test('dados inválidos respondem 400', async () => {
    const response = await fetch(`${BASE}/api/v1/projects/${s.projectId}`, {
      method: 'PATCH',
      headers: { cookie: cookies.get('ops')!, 'content-type': 'application/json' },
      body: JSON.stringify({ plannedHours: -10 }),
    });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).code, 'invalid_request');
  });
});
