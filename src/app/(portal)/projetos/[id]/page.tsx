/**
 * Detalhe do projeto — as três visões.
 *
 * Uma rota só, um recorte por perfil. É a tradução direta do doc 01: "não
 * são três ferramentas separadas, mas três visões da mesma operação".
 *
 * O que muda por perfil:
 *
 *   Admin e Operação   tudo, incluindo horas, observações internas e
 *                      materiais ainda não publicados
 *   Professor          seu papel, pontos focais, atividades e materiais
 *                      publicados; suas próprias horas
 *   Cliente            escopo, progresso, etapa, pessoas, próximos passos
 *                      e o que aguarda ação dele
 */

import { notFound } from 'next/navigation';
import { prisma } from '@/server/db';
import { requireActor } from '@/server/auth/session';
import {
  resolveProjectAccess,
  can,
  visibleMaterialsWhere,
  visibleUpdatesWhere,
  visibleTimeEntriesWhere,
} from '@/server/auth/authorize';
import { AuthorizationError } from '@/server/auth/errors';
import { projectSummary } from '@/server/projects/summary';
import { isClientRole } from '@/server/auth/permissions';
import {
  Page,
  Panel,
  Grid,
  Metric,
  MetricRow,
  Progress,
  StatusBadge,
  Avatar,
  EmptyState,
  DefinitionList,
  PROJECT_STATUS,
  PROJECT_TYPE,
  PROJECT_FORMAT,
  activityStatus,
  ROLE_LABEL,
  formatDate,
  formatPeriod,
  formatHours,
} from '@/components/ui';
import styles from './projeto.module.css';

export const dynamic = 'force-dynamic';

export default async function ProjetoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await requireActor();

  // Fora de escopo responde 404, igual à API: a página não pode revelar o
  // que o endpoint esconde.
  let access;
  try {
    access = await resolveProjectAccess(actor, id);
  } catch (error) {
    if (error instanceof AuthorizationError) notFound();
    throw error;
  }

  const forClient = isClientRole(access.role);
  const showHours = can(access, 'time.read_own') || can(access, 'time.read_all');

  const [project, summary, activities, materials, updates, timeEntries] = await Promise.all([
    prisma.project.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        name: true,
        type: true,
        format: true,
        description: true,
        scope: true,
        objectives: true,
        deliverables: true,
        status: true,
        currentStage: true,
        plannedHours: true,
        startDate: true,
        endDate: true,
        notes: can(access, 'project.update'),
        clientOrganization: { select: { name: true } },
        clientFocalUser: { select: { id: true, name: true } },
        stages: { select: { id: true, name: true, position: true }, orderBy: { position: 'asc' } },
        members: {
          where: { removedAt: null },
          select: {
            role: true,
            responsibility: true,
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                organization: { select: { name: true } },
              },
            },
          },
          orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
        },
      },
    }),
    projectSummary(access),
    can(access, 'activity.read')
      ? prisma.activity.findMany({
          where: { projectId: id },
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            dueAt: true,
            owner: { select: { id: true, name: true } },
            stage: { select: { id: true, name: true } },
          },
          orderBy: [{ dueAt: 'asc' }, { createdAt: 'asc' }],
        })
      : Promise.resolve([]),
    prisma.material.findMany({
      where: visibleMaterialsWhere(access),
      select: { id: true, name: true, kind: true, status: true, publishedAt: true },
      orderBy: { createdAt: 'desc' },
      take: 12,
    }),
    prisma.update.findMany({
      where: visibleUpdatesWhere(access),
      select: {
        id: true,
        title: true,
        body: true,
        createdAt: true,
        author: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    showHours
      ? prisma.timeEntry.findMany({
          where: visibleTimeEntriesWhere(access, actor),
          select: {
            id: true,
            description: true,
            type: true,
            durationMinutes: true,
            startedAt: true,
            status: true,
            user: { select: { name: true } },
          },
          orderBy: { startedAt: 'desc' },
          take: 8,
        })
      : Promise.resolve([]),
  ]);

  const status = PROJECT_STATUS[project.status] ?? { tone: 'neutral' as const, label: project.status };

  // O item mais importante da visão do cliente: o que depende dele.
  const waitingClient = activities.filter((a) => a.status === 'waiting_client');
  const myRole = project.members.find((m) => m.user.id === actor.id);
  const nextSteps = activities
    .filter((a) => a.status !== 'completed' && a.status !== 'cancelled')
    .slice(0, 5);

  return (
    <Page
      eyebrow={`${project.clientOrganization.name} · ${PROJECT_TYPE[project.type]} · ${PROJECT_FORMAT[project.format]}`}
      title={project.name}
      description={project.description ?? undefined}
      actions={<StatusBadge tone={status.tone}>{status.label}</StatusBadge>}
    >
      <MetricRow>
        <Metric
          value={`${summary.progress.percent}%`}
          label="Progresso"
          hint={`${summary.progress.completed} de ${summary.progress.total} concluídas`}
        />
        <Metric value={project.currentStage ?? '—'} label="Etapa atual" variant="text" />
        {forClient ? (
          <Metric value={summary.pending.waitingClient} label="Aguardando você" />
        ) : (
          <Metric
            value={summary.pending.open}
            label="Pendências abertas"
            hint={summary.pending.late > 0 ? `${summary.pending.late} em atraso` : undefined}
          />
        )}
        <Metric
          value={summary.nextMeeting ? formatDate(summary.nextMeeting.dueAt) : '—'}
          label="Próximo encontro"
          hint={summary.nextMeeting?.title}
          variant="text"
        />
        {showHours ? (
          <Metric
            value={formatHours(summary.hours.approved)}
            label="Horas realizadas"
            hint={`de ${formatHours(summary.hours.planned)} previstas`}
          />
        ) : null}
      </MetricRow>

      {waitingClient.length > 0 && forClient ? (
        <div className={styles.attention} role="status">
          <strong>
            {waitingClient.length === 1
              ? '1 item aguarda a sua ação'
              : `${waitingClient.length} itens aguardam a sua ação`}
          </strong>
          <ul>
            {waitingClient.map((activity) => (
              <li key={activity.id}>
                {activity.title}
                {activity.dueAt ? ` · até ${formatDate(activity.dueAt)}` : ''}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Grid columns={2}>
        <div className={styles.column}>
          <Panel title="Escopo">
            <DefinitionList
              items={[
                { term: 'Período', value: formatPeriod(project.startDate, project.endDate) },
                {
                  term: 'Carga horária prevista',
                  value: formatHours(Number(project.plannedHours)),
                },
                ...(project.scope ? [{ term: 'O que está incluído', value: project.scope }] : []),
                ...(project.objectives ? [{ term: 'Objetivos', value: project.objectives }] : []),
                ...(project.deliverables
                  ? [{ term: 'Entregáveis', value: project.deliverables }]
                  : []),
                ...(myRole?.responsibility
                  ? [{ term: 'Seu papel neste projeto', value: myRole.responsibility }]
                  : []),
                ...(project.notes
                  ? [{ term: 'Observações internas', value: project.notes }]
                  : []),
              ]}
            />
          </Panel>

          {project.stages.length > 0 ? (
            <Panel title="Etapas">
              <ol className={styles.stages}>
                {project.stages.map((stage) => (
                  <li key={stage.id} data-current={stage.name === project.currentStage || undefined}>
                    {stage.name}
                  </li>
                ))}
              </ol>
            </Panel>
          ) : null}

          {can(access, 'activity.read') ? (
            <Panel title={forClient ? 'Acompanhamento' : 'Atividades'}>
              {activities.length === 0 ? (
                <EmptyState
                  title="Nenhuma atividade cadastrada"
                  description="As atividades aparecem aqui conforme a equipe organiza o projeto."
                />
              ) : (
                <ul className={styles.activities}>
                  {activities.map((activity) => {
                    const state = activityStatus(activity.status, forClient);
                    return (
                      <li key={activity.id}>
                        <div className={styles.activityText}>
                          <strong>{activity.title}</strong>
                          {activity.description ? <p>{activity.description}</p> : null}
                        </div>
                        <StatusBadge tone={state.tone}>{state.label}</StatusBadge>
                        <span className={styles.activityMeta}>
                          {activity.owner?.name ?? 'Sem responsável'}
                        </span>
                        <span className={styles.activityMeta}>{formatDate(activity.dueAt)}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
          ) : null}
        </div>

        <div className={styles.column}>
          <Panel title="Pessoas envolvidas">
            <ul className={styles.people}>
              {project.members.map((member) => (
                <li key={member.user.id}>
                  <Avatar name={member.user.name} src={member.user.avatarUrl} size={34} />
                  <span>
                    <strong>{member.user.name}</strong>
                    <small>
                      {member.user.organization?.name ?? ROLE_LABEL[member.role]}
                      {member.responsibility ? ` · ${member.responsibility}` : ''}
                    </small>
                  </span>
                </li>
              ))}
            </ul>
          </Panel>

          {!forClient && nextSteps.length > 0 ? (
            <Panel title="Próximos passos">
              <ul className={styles.nextSteps}>
                {nextSteps.map((activity) => (
                  <li key={activity.id}>
                    <strong>{activity.title}</strong>
                    <small>
                      {activity.owner?.name ?? 'Sem responsável'} · {formatDate(activity.dueAt)}
                    </small>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          <Panel title="Materiais">
            {materials.length === 0 ? (
              <EmptyState
                title="Nenhum material disponível"
                description="Os conteúdos publicados aparecem aqui."
              />
            ) : (
              <ul className={styles.materials}>
                {materials.map((material) => (
                  <li key={material.id}>
                    <span>
                      <strong>{material.name}</strong>
                      <small>
                        {material.publishedAt
                          ? `Publicado em ${formatDate(material.publishedAt)}`
                          : 'Ainda não publicado'}
                      </small>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {updates.length > 0 ? (
            <Panel title="Atualizações">
              <ul className={styles.updates}>
                {updates.map((update) => (
                  <li key={update.id}>
                    <strong>{update.title}</strong>
                    <p>{update.body}</p>
                    <small>
                      {update.author.name} · {formatDate(update.createdAt)}
                    </small>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          {showHours && timeEntries.length > 0 ? (
            <Panel title={can(access, 'time.read_all') ? 'Horas do projeto' : 'Minhas horas'}>
              <ul className={styles.hours}>
                {timeEntries.map((entry) => (
                  <li key={entry.id}>
                    <span>
                      <strong>{entry.description ?? 'Dedicação'}</strong>
                      <small>
                        {entry.user.name} · {formatDate(entry.startedAt)}
                      </small>
                    </span>
                    <span className={styles.hoursValue}>
                      {formatHours((entry.durationMinutes ?? 0) / 60)}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
        </div>
      </Grid>

      {showHours ? (
        <Panel title="Consumo do escopo">
          <Progress percent={summary.hours.percentUsed} label="Horas utilizadas" />
          <p className={styles.hoursHint}>
            {formatHours(summary.hours.approved)} de {formatHours(summary.hours.planned)} ·{' '}
            {formatHours(summary.hours.remaining)} restantes
            {summary.hours.pending > 0
              ? ` · ${formatHours(summary.hours.pending)} aguardando aprovação`
              : ''}
          </p>
        </Panel>
      ) : null}
    </Page>
  );
}
