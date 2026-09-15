/**
 * Envio de e-mail transacional.
 *
 * A entrega é requisito de disponibilidade, não conveniência: como o acesso
 * de professores e clientes depende de link mágico (D-001), e-mail que não
 * chega significa pessoa que não entra. Por isso o provedor é uma interface
 * — trocá-lo não deve exigir tocar no fluxo de autenticação.
 *
 * O provedor real (Resend ou SES, conforme D-007) entra na etapa E10.
 */

export interface Mail {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface Mailer {
  send(mail: Mail): Promise<void>;
}

/**
 * Em desenvolvimento e teste, escreve no log do servidor em vez de enviar.
 * O link aparece no terminal, o que permite testar o fluxo inteiro sem
 * provedor configurado.
 */
export class ConsoleMailer implements Mailer {
  async send(mail: Mail): Promise<void> {
    console.info(
      `\n[e-mail não enviado — ambiente ${process.env.NODE_ENV ?? 'development'}]\n` +
        `para: ${mail.to}\nassunto: ${mail.subject}\n\n${mail.text}\n`,
    );
  }
}

let mailer: Mailer = new ConsoleMailer();

/** Permite injetar outro provedor — usado pelos testes e pela produção. */
export const setMailer = (next: Mailer) => {
  mailer = next;
};

export const getMailer = (): Mailer => mailer;

export function magicLinkEmail(url: string, expiresInMinutes: number): Omit<Mail, 'to'> {
  return {
    subject: 'Seu acesso ao Portal 3ADS EDU',
    text:
      `Use o link abaixo para entrar no Portal 3ADS EDU.\n\n${url}\n\n` +
      `O link vale por ${expiresInMinutes} minutos e só pode ser usado uma vez.\n` +
      `Se você não pediu este acesso, ignore esta mensagem.`,
  };
}

export function inviteEmail(url: string, inviterName: string): Omit<Mail, 'to'> {
  return {
    subject: 'Convite para o Portal 3ADS EDU',
    text:
      `${inviterName} convidou você para o Portal 3ADS EDU.\n\n${url}\n\n` +
      `O convite vale por 7 dias.`,
  };
}
