/**
 * Critério de pronto do E2.
 *
 * docs/13-escopo-v1.md define: "um projeto criado do zero exibe corretamente
 * escopo, pessoas, progresso e próximos passos nas três visões, sem nenhum
 * dado inserido manualmente no banco".
 *
 * O teste leva isso ao pé da letra: tudo é criado pela API — organização é a
 * única exceção, porque o cadastro de organizações não pertence ao E2 — e a
 * verificação acontece nas páginas HTML renderizadas, não só no JSON.
 * Verificar só a API deixaria passar um erro de renderização, e é a página
 * que a pessoa usa.
 */

import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';

import { prisma } from '@/server/db';
import { resetDatabase } from './fixtures';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:3100';

interface Session {
  cookie: string;
  id: string;
}

const sessions: Record<string, Session> = {};
let projectId = '';
let stageId = '';

async function login(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  await prisma.session.create({
    data: { sessionToken: token, userId, expires: new Date(Date.now() + 3_600_000) },
  });
  return `authjs.session-token=${token}`;
}

const api = (path: string, cookie: string, init: RequestInit = {}) =>
  fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      cookie,
      'content-type': 'application/json',
      'x-forwarded-for': '198.51.100.9',
      ...(init.headers ?? {}),
    },
  });

const html = async (path: string, cookie: string): Promise<{ status: number; body: string }> => {
  const response = await fetch(`${BASE}${path}`, { headers: { cookie }, redirect: 'manual' });
  return { status: response.status, body: await response.text() };
};

before(async () => {
  await resetDatabase();

  // Único dado inserido diretamente: organizações e as contas. O cadastro de
  // organizações e o convite por e-mail não fazem parte do E2.
  const agency = await prisma.organization.create({ data: { name: '3ADS', type: 'agency' } });
  const client = await prisma.organization.create({ data: { name: 'Cerrado Log', type: 'client' } });

  const mk = (name: string, email: string, extra: Record<string, unknown> = {}) =>
    prisma.user.create({ data: { name, email, status: 'active', ...extra } });

  const admin = await mk('Nathália Machado', 'nathalia@3ads.com.br', {
    isInternal: true, isSuperAdmin: true, organizationId: agency.id,
  });
  const trainer = await mk('Rafael Martins', 'rafael@parceiro.com.br');
  const focal = await mk('Jéssica Gomes', 'jessica@cerrado.com.br', { organizationId: client.id });
  const outsider = await mk('Marina Alves', 'marina@outro.com.br');

  for (const [key, user] of [
    ['admin', admin], ['trainer', trainer], ['focal', focal], ['outsider', outsider],
  ] as const) {
    sessions[key] = { id: user.id, cookie: await login(user.id) };
  }

  (globalThis as Record<string, unknown>).__orgId = client.id;
});

after(async () => {
  await prisma.$disconnect();
});

describe('Projeto criado do zero pela API', () => {
  test('1 · o Admin cria o projeto', async () => {
    const response = await api('/api/v1/projects', sessions.admin!.cookie, {
      method: 'POST',
      body: JSON.stringify({
        name: 'Formação em Logística Preditiva',
        clientOrganizationId: (globalThis as Record<string, unknown>).__orgId,
        type: 'training',
        format: 'hybrid',
        description: 'Capacitação das equipes de operação em previsão de demanda.',
        scope: 'Seis encontros, material de apoio e acompanhamento das aplicações práticas.',
        objectives: 'Reduzir ruptura de estoque e melhorar a acurácia da previsão.',
        deliverables: 'Slides, framework de previsão e relatório final.',
        plannedHours: 48,
        startDate: '2026-10-01',
        endDate: '2027-02-28',
      }),
    });

    assert.equal(response.status, 201);
    const body = await response.json();
    projectId = body.id;
    assert.equal(body.status, 'draft', 'projeto nasce em rascunho');
  });

  test('2 · define as etapas', async () => {
    const response = await api(`/api/v1/projects/${projectId}/stages`, sessions.admin!.cookie, {
      method: 'PUT',
      body: JSON.stringify({
        stages: [
          { name: '01 Diagnóstico' },
          { name: '02 Capacitação' },
          { name: '03 Aplicação' },
        ],
      }),
    });

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.data.length, 3);
    assert.deepEqual(body.data.map((s: { position: number }) => s.position), [1, 2, 3]);
    stageId = body.data[1].id;
  });

  test('3 · adiciona as pessoas', async () => {
    for (const [key, role, responsibility] of [
      ['trainer', 'trainer', 'Encontros 02 a 05'],
      ['focal', 'client_focal', 'Ponto focal do cliente'],
    ] as const) {
      const user = await prisma.user.findUniqueOrThrow({ where: { id: sessions[key]!.id } });
      const response = await api(`/api/v1/projects/${projectId}/members`, sessions.admin!.cookie, {
        method: 'POST',
        body: JSON.stringify({ email: user.email, role, responsibility }),
      });
      assert.equal(response.status, 201, `falhou ao adicionar ${key}`);
      assert.equal((await response.json()).invited, false, 'pessoa já cadastrada entra direto');
    }

    const list = await api(`/api/v1/projects/${projectId}/members`, sessions.admin!.cookie);
    const body = await list.json();
    assert.equal(body.data.length, 3, 'admin criador mais as duas pessoas');
  });

  test('4 · ativa o projeto', async () => {
    const response = await api(`/api/v1/projects/${projectId}/status`, sessions.admin!.cookie, {
      method: 'POST',
      body: JSON.stringify({ status: 'active' }),
    });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).status, 'active');
  });

  test('5 · cria as atividades', async () => {
    const activities = [
      { title: 'Reunião de abertura', status: 'completed', ownerUserId: sessions.admin!.id, dueAt: '2026-10-05' },
      { title: 'Encontro 02 · Previsão de demanda', status: 'in_progress', ownerUserId: sessions.trainer!.id, dueAt: '2026-10-20' },
      { title: 'Validar base de dados histórica', status: 'waiting_client', ownerUserId: sessions.focal!.id, dueAt: '2026-10-25' },
      { title: 'Aplicar o framework na operação', status: 'not_started', ownerUserId: sessions.focal!.id, dueAt: '2026-11-10' },
    ];

    for (const activity of activities) {
      const status = activity.status === 'completed' ? 'in_progress' : activity.status;
      const response = await api(`/api/v1/projects/${projectId}/activities`, sessions.admin!.cookie, {
        method: 'POST',
        body: JSON.stringify({ ...activity, status, stageId }),
      });
      assert.equal(response.status, 201, `falhou ao criar "${activity.title}"`);

      // A conclusão pertence a E3; aqui basta o estado final para o progresso.
      if (activity.status === 'completed') {
        const created = await response.json();
        await prisma.activity.update({
          where: { id: created.id },
          data: { status: 'completed', completedAt: new Date() },
        });
      }
    }

    const list = await api(`/api/v1/projects/${projectId}/activities`, sessions.admin!.cookie);
    assert.equal((await list.json()).data.length, 4);
  });

  test('6 · os indicadores refletem o que foi criado', async () => {
    const response = await api(`/api/v1/projects/${projectId}/summary`, sessions.admin!.cookie);
    const body = await response.json();

    assert.equal(body.progress.total, 4);
    assert.equal(body.progress.completed, 1);
    assert.equal(body.progress.percent, 25);
    assert.equal(body.hours.planned, 48);
    assert.equal(body.pending.open, 3);
    assert.equal(body.pending.waitingClient, 1);
    assert.ok(body.nextMeeting, 'o próximo encontro precisa ser identificado');
  });
});

describe('Visão do Admin', () => {
  test('a página mostra escopo, pessoas, progresso e próximos passos', async () => {
    const { status, body } = await html(`/projetos/${projectId}`, sessions.admin!.cookie);
    assert.equal(status, 200);

    assert.ok(body.includes('Formação em Logística Preditiva'), 'nome do projeto');
    assert.ok(body.includes('Cerrado Log'), 'cliente');
    assert.ok(body.includes('Seis encontros'), 'escopo');
    assert.ok(body.includes('Reduzir ruptura'), 'objetivos');
    assert.ok(body.includes('Rafael Martins'), 'professor entre as pessoas');
    assert.ok(body.includes('Jéssica Gomes'), 'ponto focal entre as pessoas');
    assert.ok(body.includes('25%'), 'progresso');
    assert.ok(body.includes('Próximos passos'), 'próximos passos');
    assert.ok(body.includes('48h'), 'carga horária prevista');
  });

  test('o Admin vê as pendências da operação', async () => {
    const { body } = await html(`/projetos/${projectId}`, sessions.admin!.cookie);
    assert.ok(body.includes('Pendências abertas'));
    assert.ok(body.includes('Consumo do escopo'), 'consumo de horas é informação interna');
  });

  test('o estado aparece com o rótulo certo para quem lê', async () => {
    // O mesmo estado `waiting_client` é "Aguardando cliente" para a equipe e
    // "Aguardando você" para o cliente.
    const admin = await html(`/projetos/${projectId}`, sessions.admin!.cookie);
    assert.ok(admin.body.includes('Aguardando cliente'));
    assert.ok(!admin.body.includes('Aguardando você'));

    const cliente = await html(`/projetos/${projectId}`, sessions.focal!.cookie);
    assert.ok(cliente.body.includes('Aguardando você'));
  });
});

describe('Visão do Professor', () => {
  test('mostra o projeto, seu papel e as pessoas', async () => {
    const { status, body } = await html(`/projetos/${projectId}`, sessions.trainer!.cookie);
    assert.equal(status, 200);

    assert.ok(body.includes('Formação em Logística Preditiva'));
    assert.ok(body.includes('Encontros 02 a 05'), 'o papel do professor no projeto');
    assert.ok(body.includes('Jéssica Gomes'), 'ponto focal do cliente');
    assert.ok(body.includes('25%'), 'progresso');
  });

  test('não recebe observações internas nem horas de terceiros', async () => {
    const { body } = await html(`/projetos/${projectId}`, sessions.trainer!.cookie);
    assert.ok(!body.includes('Observações internas'));
    assert.ok(!body.includes('Horas do projeto'), 'o professor vê apenas as próprias horas');
  });

  test('projeto alheio responde 404', async () => {
    const outro = await api('/api/v1/projects', sessions.admin!.cookie, {
      method: 'POST',
      body: JSON.stringify({
        name: 'Projeto reservado',
        clientOrganizationId: (globalThis as Record<string, unknown>).__orgId,
        type: 'consulting',
        format: 'online',
        plannedHours: 10,
      }),
    });
    const { id } = await outro.json();

    const page = await fetch(`${BASE}/projetos/${id}`, {
      headers: { cookie: sessions.trainer!.cookie },
      redirect: 'manual',
    });
    assert.equal(page.status, 404);
  });
});

describe('Visão do Cliente', () => {
  test('mostra escopo, progresso, etapa, pessoas e o que aguarda ação', async () => {
    const { status, body } = await html(`/projetos/${projectId}`, sessions.focal!.cookie);
    assert.equal(status, 200);

    assert.ok(body.includes('Formação em Logística Preditiva'));
    assert.ok(body.includes('Seis encontros'), 'escopo');
    assert.ok(body.includes('25%'), 'progresso');
    assert.ok(body.includes('Rafael Martins'), 'pessoas envolvidas');
    assert.ok(body.includes('Aguardando você'), 'indicador do que depende do cliente');
    assert.ok(body.includes('Validar base de dados'), 'o item que aguarda ação aparece nomeado');
    assert.ok(body.includes('aguarda a sua ação'), 'o aviso de atenção');
  });

  test('não recebe informação interna', async () => {
    const { body } = await html(`/projetos/${projectId}`, sessions.focal!.cookie);
    assert.ok(!body.includes('Observações internas'));
    assert.ok(!body.includes('Consumo do escopo'), 'horas não vão para o cliente');
    assert.ok(!body.includes('Pendências abertas'), 'o cliente vê o que aguarda ele, não a fila interna');
  });

  test('não consegue alterar o projeto', async () => {
    const response = await api(`/api/v1/projects/${projectId}`, sessions.focal!.cookie, {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Alterado pelo cliente' }),
    });
    assert.equal(response.status, 403);

    const project = await prisma.project.findUniqueOrThrow({ where: { id: projectId } });
    assert.equal(project.name, 'Formação em Logística Preditiva');
  });
});

describe('Quem não participa', () => {
  test('não vê o projeto na lista nem na página', async () => {
    const lista = await html('/projetos', sessions.outsider!.cookie);
    assert.ok(!lista.body.includes('Formação em Logística Preditiva'));
    assert.ok(!lista.body.includes('Cerrado Log'));

    const page = await fetch(`${BASE}/projetos/${projectId}`, {
      headers: { cookie: sessions.outsider!.cookie },
      redirect: 'manual',
    });
    assert.equal(page.status, 404);
  });
});

describe('Ciclo de vida', () => {
  test('encerrar com atividade em aberto é recusado, com o motivo', async () => {
    const response = await api(`/api/v1/projects/${projectId}/status`, sessions.admin!.cookie, {
      method: 'POST',
      body: JSON.stringify({ status: 'completed' }),
    });

    assert.equal(response.status, 422);
    const body = await response.json();
    assert.equal(body.code, 'encerramento_bloqueado');
    assert.ok(
      body.details.blockers.some((b: { code: string }) => b.code === 'atividades_abertas'),
      'o motivo precisa ser explícito',
    );
  });

  test('arquivar projeto ativo é recusado', async () => {
    const response = await api(`/api/v1/projects/${projectId}/archive`, sessions.admin!.cookie, {
      method: 'POST',
    });
    assert.equal(response.status, 422);
  });

  test('remover pessoa preserva o histórico', async () => {
    const before = await prisma.activity.count({
      where: { projectId, ownerUserId: sessions.trainer!.id },
    });
    assert.ok(before > 0, 'o professor precisa ter histórico para o teste valer');

    const response = await api(
      `/api/v1/projects/${projectId}/members/${sessions.trainer!.id}`,
      sessions.admin!.cookie,
      { method: 'DELETE' },
    );
    assert.equal(response.status, 204);

    const after = await prisma.activity.count({
      where: { projectId, ownerUserId: sessions.trainer!.id },
    });
    assert.equal(after, before, 'as atividades do professor permanecem');

    // E ele perde o acesso na hora.
    const page = await fetch(`${BASE}/projetos/${projectId}`, {
      headers: { cookie: sessions.trainer!.cookie },
      redirect: 'manual',
    });
    assert.equal(page.status, 404);
  });
});
