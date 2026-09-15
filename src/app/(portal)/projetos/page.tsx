/**
 * Lista de projetos.
 *
 * A mesma rota serve os três perfis — o que muda é o recorte, aplicado por
 * `visibleProjectsWhere` no banco. O cliente com um único projeto é levado
 * direto ao detalhe: uma lista de um item só é atrito sem informação.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/server/db';
import { requireActor } from '@/server/auth/session';
import { visibleProjectsWhere } from '@/server/auth/authorize';
import {
  Page,
  StatusBadge,
  EmptyState,
  PROJECT_STATUS,
  PROJECT_TYPE,
  PROJECT_FORMAT,
  formatPeriod,
  formatHours,
} from '@/components/ui';
import styles from './projetos.module.css';

export const dynamic = 'force-dynamic';

export default async function ProjetosPage() {
  const actor = await requireActor();

  const projects = await prisma.project.findMany({
    where: visibleProjectsWhere(actor),
    select: {
      id: true,
      name: true,
      type: true,
      format: true,
      status: true,
      startDate: true,
      endDate: true,
      plannedHours: true,
      currentStage: true,
      clientOrganization: { select: { name: true } },
      _count: { select: { members: { where: { removedAt: null } } } },
    },
    orderBy: [{ status: 'asc' }, { endDate: 'asc' }],
  });

  // Cliente ou professor com um projeto só vai direto ao que interessa.
  if (projects.length === 1 && !actor.isInternal && !actor.isSuperAdmin) {
    redirect(`/projetos/${projects[0]!.id}`);
  }

  const title = actor.isSuperAdmin || actor.isInternal ? 'Projetos' : 'Meus projetos';

  return (
    <Page
      eyebrow="Portfólio EDU"
      title={title}
      description={
        actor.isSuperAdmin || actor.isInternal
          ? 'Escopo, pessoas, horas e histórico de cada projeto.'
          : 'Você visualiza somente os projetos em que participa.'
      }
    >
      {projects.length === 0 ? (
        <EmptyState
          title="Nenhum projeto por aqui"
          description="Quando você for incluído em um projeto, ele aparece nesta lista."
        />
      ) : (
        <ul className={styles.list}>
          {projects.map((project) => {
            const status = PROJECT_STATUS[project.status] ?? { tone: 'neutral' as const, label: project.status };
            return (
              <li key={project.id}>
                <Link href={`/projetos/${project.id}`} className={styles.row}>
                  <span className={styles.identity}>
                    <strong>{project.name}</strong>
                    <small>
                      {project.clientOrganization.name} · {PROJECT_TYPE[project.type]} ·{' '}
                      {PROJECT_FORMAT[project.format]}
                    </small>
                  </span>
                  <span className={styles.meta}>{formatPeriod(project.startDate, project.endDate)}</span>
                  <span className={styles.meta}>{formatHours(Number(project.plannedHours))} previstas</span>
                  <span className={styles.meta}>
                    {project._count.members} {project._count.members === 1 ? 'pessoa' : 'pessoas'}
                  </span>
                  <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                  <span className={styles.chevron} aria-hidden="true">
                    ›
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Page>
  );
}
