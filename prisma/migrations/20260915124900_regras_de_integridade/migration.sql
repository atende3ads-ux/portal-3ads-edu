-- Regras de integridade de docs/05-modelo-de-dados.md que o Prisma não
-- expressa no schema. Aplicadas no banco para valerem mesmo se alguém
-- escrever fora da aplicação.

-- `ended_at` deve ser posterior a `started_at`.
ALTER TABLE "time_entries"
  ADD CONSTRAINT "time_entries_periodo_valido"
  CHECK ("ended_at" IS NULL OR "ended_at" > "started_at");

-- Duração não pode ser negativa.
ALTER TABLE "time_entries"
  ADD CONSTRAINT "time_entries_duracao_nao_negativa"
  CHECK ("duration_minutes" IS NULL OR "duration_minutes" >= 0);

-- Somente um timer ativo por usuário.
-- Índice parcial: a restrição vale apenas para registros em execução e é
-- garantida pelo banco em transação — não por verificação na aplicação,
-- que não resiste a duas requisições simultâneas.
CREATE UNIQUE INDEX "time_entries_um_timer_ativo_por_usuario"
  ON "time_entries" ("user_id")
  WHERE "status" = 'running';

-- Um timer em execução não tem fim registrado.
ALTER TABLE "time_entries"
  ADD CONSTRAINT "time_entries_timer_em_execucao_sem_fim"
  CHECK ("status" <> 'running' OR "ended_at" IS NULL);

-- `planned_hours` não pode ser negativo.
ALTER TABLE "projects"
  ADD CONSTRAINT "projects_horas_previstas_nao_negativas"
  CHECK ("planned_hours" >= 0);

-- Período do projeto coerente.
ALTER TABLE "projects"
  ADD CONSTRAINT "projects_periodo_valido"
  CHECK ("start_date" IS NULL OR "end_date" IS NULL OR "end_date" >= "start_date");

-- NPS vai de 0 a 10.
ALTER TABLE "feedbacks"
  ADD CONSTRAINT "feedbacks_score_valido"
  CHECK ("score" IS NULL OR ("score" >= 0 AND "score" <= 10));

-- Material de arquivo precisa de chave no bucket; material de link, de URL.
ALTER TABLE "materials"
  ADD CONSTRAINT "materials_origem_definida"
  CHECK (("kind" = 'link' AND "link_url" IS NOT NULL)
      OR ("kind" <> 'link' AND "storage_key" IS NOT NULL));

-- Recado direcionado a um projeto precisa apontar para ele.
ALTER TABLE "notices"
  ADD CONSTRAINT "notices_projeto_obrigatorio_quando_direcionado"
  CHECK ("audience_type" <> 'project' OR "project_id" IS NOT NULL);

-- Trilha de auditoria imutável (docs/15).
-- O gatilho recusa alteração e remoção mesmo para o dono da tabela; só um
-- superusuário do banco consegue contornar, e isso fica no log do servidor.
CREATE OR REPLACE FUNCTION "audit_logs_somente_insercao"()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs e imutavel: % nao e permitido', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "audit_logs_sem_update"
  BEFORE UPDATE ON "audit_logs"
  FOR EACH ROW EXECUTE FUNCTION "audit_logs_somente_insercao"();

CREATE TRIGGER "audit_logs_sem_delete"
  BEFORE DELETE ON "audit_logs"
  FOR EACH ROW EXECUTE FUNCTION "audit_logs_somente_insercao"();
