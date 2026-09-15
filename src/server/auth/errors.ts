/**
 * Erros de autorização e os códigos HTTP correspondentes.
 *
 * A distinção entre 403 e 404 é deliberada e está em docs/14: um recurso
 * fora do escopo do usuário responde **404**, não 403, porque 403
 * confirmaria que ele existe. O doc 02 exige que um professor não consiga
 * descobrir nomes ou dados de projetos não autorizados.
 *
 * O 403 fica reservado para o caso em que o recurso está no escopo mas
 * falta capacidade — aí a existência já é conhecida e negar é honesto.
 */

export type AuthzReason =
  | 'unauthenticated'
  | 'out_of_scope'
  | 'missing_permission'
  | 'read_only_role'
  | 'inactive_membership'
  | 'project_not_writable';

const STATUS: Record<AuthzReason, number> = {
  unauthenticated: 401,
  out_of_scope: 404,
  missing_permission: 403,
  read_only_role: 403,
  inactive_membership: 404,
  project_not_writable: 403,
};

export class AuthorizationError extends Error {
  readonly reason: AuthzReason;
  readonly status: number;
  readonly resource?: string;

  constructor(reason: AuthzReason, resource?: string) {
    super(`Acesso negado: ${reason}`);
    this.name = 'AuthorizationError';
    this.reason = reason;
    this.status = STATUS[reason];
    this.resource = resource;
  }
}

/** Corpo de erro no formato do doc 10. */
export function errorBody(error: AuthorizationError) {
  if (error.status === 404) {
    return { code: 'not_found', message: 'Recurso não encontrado.', details: {} };
  }
  if (error.status === 401) {
    return { code: 'unauthenticated', message: 'Sessão ausente ou expirada.', details: {} };
  }
  return {
    code: 'forbidden',
    message: 'Você não tem permissão para esta ação.',
    details: {},
  };
}
