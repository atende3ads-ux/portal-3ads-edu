/**
 * Componentes-base.
 *
 * Correspondem ao inventário de docs/11-tokens-de-design.md. Todos usam
 * exclusivamente tokens — nenhum valor de cor, espaço ou tamanho aparece
 * escrito à mão.
 *
 * A regra do doc 06 que mais influencia este arquivo: "cor nunca deve ser o
 * único indicador". Todo componente de estado expõe texto.
 */

import type { ReactNode } from 'react';
import styles from './ui.module.css';

// ---------------------------------------------------------------------------
// Estrutura
// ---------------------------------------------------------------------------

export function Page({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={styles.page}>
      <header className={styles.pageHead}>
        <div>
          {eyebrow ? <span className={styles.eyebrow}>{eyebrow}</span> : null}
          <h1>{title}</h1>
          {description ? <p className={styles.pageDescription}>{description}</p> : null}
        </div>
        {actions ? <div className={styles.pageActions}>{actions}</div> : null}
      </header>
      {children}
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  scroll,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  scroll?: boolean;
}) {
  return (
    <section className={`${styles.panel} ${scroll ? styles.panelScroll : ''}`}>
      {title || action ? (
        <div className={styles.panelHead}>
          {title ? <h2>{title}</h2> : <span />}
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export const Grid = ({ children, columns = 2 }: { children: ReactNode; columns?: 1 | 2 | 3 }) => (
  <div className={styles.grid} data-columns={columns}>
    {children}
  </div>
);

// ---------------------------------------------------------------------------
// Estado
// ---------------------------------------------------------------------------

export type Tone = 'positive' | 'neutral' | 'warning' | 'danger';

/**
 * Selo de estado. O texto é obrigatório: a cor acompanha, nunca substitui.
 */
export function StatusBadge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={styles.badge} data-tone={tone}>
      {children}
    </span>
  );
}

/** Mapeia os estados do doc 05 para tom e rótulo em português. */
export const PROJECT_STATUS: Record<string, { tone: Tone; label: string }> = {
  draft: { tone: 'neutral', label: 'Rascunho' },
  active: { tone: 'positive', label: 'Ativo' },
  paused: { tone: 'warning', label: 'Pausado' },
  completed: { tone: 'positive', label: 'Concluído' },
  cancelled: { tone: 'danger', label: 'Cancelado' },
  archived: { tone: 'neutral', label: 'Arquivado' },
};

const ACTIVITY_STATUS_BASE: Record<string, { tone: Tone; label: string }> = {
  not_started: { tone: 'neutral', label: 'Não iniciado' },
  in_progress: { tone: 'neutral', label: 'Em andamento' },
  waiting_client: { tone: 'warning', label: 'Aguardando cliente' },
  waiting_3ads: { tone: 'warning', label: 'Aguardando a 3ADS' },
  blocked: { tone: 'danger', label: 'Bloqueado' },
  completed: { tone: 'positive', label: 'Concluído' },
  cancelled: { tone: 'neutral', label: 'Cancelado' },
};

export const ACTIVITY_STATUS = ACTIVITY_STATUS_BASE;

/**
 * Rótulo do estado conforme quem lê.
 *
 * "Aguardando você" só faz sentido para o cliente — para a equipe e o
 * professor, o mesmo estado é "Aguardando cliente". O doc 06 exige que o
 * estado venha sempre acompanhado de texto; o texto precisa ser o certo
 * para quem está lendo.
 */
export function activityStatus(
  status: string,
  forClient: boolean,
): { tone: Tone; label: string } {
  const base = ACTIVITY_STATUS_BASE[status] ?? { tone: 'neutral' as const, label: status };
  if (forClient && status === 'waiting_client') {
    return { tone: base.tone, label: 'Aguardando você' };
  }
  if (!forClient && status === 'waiting_3ads') {
    return { tone: base.tone, label: 'Aguardando a 3ADS' };
  }
  return base;
}

export const ROLE_LABEL: Record<string, string> = {
  admin: 'Administração',
  ops: 'Operação 3ADS',
  trainer: 'Professor',
  client_focal: 'Ponto focal',
  client_learner: 'Participante',
};

export const PROJECT_TYPE: Record<string, string> = {
  training: 'Treinamento',
  consulting: 'Consultoria',
  mentoring: 'Mentoria',
  lecture: 'Palestra',
  hybrid: 'Programa híbrido',
};

export const PROJECT_FORMAT: Record<string, string> = {
  online: 'Online',
  in_person: 'Presencial',
  hybrid: 'Híbrido',
};

// ---------------------------------------------------------------------------
// Dados
// ---------------------------------------------------------------------------

export function Metric({
  value,
  label,
  hint,
  variant = 'number',
}: {
  value: ReactNode;
  label: string;
  hint?: string;
  /** `text` para valores por extenso, que não cabem na escala numérica. */
  variant?: 'number' | 'text';
}) {
  return (
    <div className={styles.metric} data-variant={variant}>
      <strong>{value}</strong>
      <span>{label}</span>
      {hint ? <small>{hint}</small> : null}
    </div>
  );
}

export const MetricRow = ({ children }: { children: ReactNode }) => (
  <div className={styles.metrics}>{children}</div>
);

/**
 * Barra de progresso. `aria-valuenow` e o texto ao lado tornam o número
 * legível sem depender da barra.
 */
export function Progress({ percent, label }: { percent: number; label?: string }) {
  const value = Math.min(Math.max(percent, 0), 100);
  return (
    <div className={styles.progressWrap}>
      <div
        className={styles.progress}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Progresso'}
      >
        <i style={{ width: `${value}%` }} />
      </div>
      <span className={styles.progressValue}>{value}%</span>
    </div>
  );
}

/** Avatar com foto, ou iniciais como alternativa — doc 06. */
export function Avatar({ name, src, size = 32 }: { name: string; src?: string | null; size?: number }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <span className={styles.avatar} style={{ width: size, height: size }} aria-hidden="true">
      {src ? <img src={src} alt="" /> : initials}
    </span>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className={styles.empty}>
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action}
    </div>
  );
}

export function DefinitionList({ items }: { items: { term: string; value: ReactNode }[] }) {
  return (
    <dl className={styles.definitions}>
      {items.map((item) => (
        <div key={item.term}>
          <dt>{item.term}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

// ---------------------------------------------------------------------------
// Formatação
// ---------------------------------------------------------------------------

const dateFormat = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
const shortDateFormat = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' });

export const formatDate = (value: Date | string | null | undefined): string =>
  value ? dateFormat.format(new Date(value)) : '—';

export const formatShortDate = (value: Date | string | null | undefined): string =>
  value ? shortDateFormat.format(new Date(value)) : '—';

export const formatPeriod = (
  start: Date | string | null | undefined,
  end: Date | string | null | undefined,
): string => (start || end ? `${formatDate(start)} — ${formatDate(end)}` : 'Período a definir');

/** Horas no formato usado pela operação: "24h30", não "24,5". */
export function formatHours(hours: number): string {
  const whole = Math.floor(hours);
  const minutes = Math.round((hours - whole) * 60);
  return minutes === 0 ? `${whole}h` : `${whole}h${String(minutes).padStart(2, '0')}`;
}
