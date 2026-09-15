/**
 * Configuração do Auth.js.
 *
 * Implementa D-001 de docs/12-decisoes-tecnicas.md: dois caminhos de entrada,
 * escolhidos pelo público.
 *
 *   equipe 3ADS           SSO Google, restrito ao domínio
 *   professor e cliente   link mágico por e-mail, 15 minutos, uso único
 *
 * Não existe senha no produto. Isso elimina recuperação de senha, política de
 * complexidade e vazamento por reuso — e, para quem entra uma vez por semana,
 * é menos fricção do que lembrar de mais uma credencial.
 */

import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import Nodemailer from 'next-auth/providers/nodemailer';
import { PrismaAdapter } from '@auth/prisma-adapter';

import { prisma } from '@/server/db';
import { audit } from '@/server/audit';
import { getMailer, magicLinkEmail } from './mailer';

/** Validade do link mágico, em minutos (D-001). */
export const MAGIC_LINK_TTL_MINUTES = 15;

/** Inatividade que encerra a sessão, e duração máxima (D-001). */
export const SESSION_IDLE_HOURS = 12;
export const SESSION_MAX_DAYS = 30;

const internalDomain = () => process.env.INTERNAL_EMAIL_DOMAIN?.toLowerCase() ?? '';

export const isInternalEmail = (email: string): boolean => {
  const domain = internalDomain();
  return domain.length > 0 && email.toLowerCase().endsWith(`@${domain}`);
};

export const authConfig: NextAuthConfig = {
  /**
   * O adapter ainda declara os tipos do Prisma 6; o client deste projeto é
   * gerado pelo Prisma 7. A API que o adapter usa é a mesma, então o
   * descasamento é só de tipos — daí o cast, restrito a esta linha.
   * Remover quando @auth/prisma-adapter suportar o Prisma 7.
   */
  adapter: PrismaAdapter(prisma as never),

  session: {
    strategy: 'database',
    maxAge: SESSION_MAX_DAYS * 24 * 60 * 60,
    updateAge: SESSION_IDLE_HOURS * 60 * 60,
  },

  pages: {
    signIn: '/entrar',
    verifyRequest: '/entrar/verifique',
    error: '/entrar/erro',
  },

  providers: [
    Google({
      allowDangerousEmailAccountLinking: false,
    }),

    Nodemailer({
      server: { host: 'localhost', port: 25 },
      from: process.env.EMAIL_FROM ?? 'portal@3ads.com.br',
      maxAge: MAGIC_LINK_TTL_MINUTES * 60,

      /** O envio passa pela nossa abstração, não pelo nodemailer direto. */
      async sendVerificationRequest({ identifier, url }) {
        const mail = magicLinkEmail(url, MAGIC_LINK_TTL_MINUTES);
        await getMailer().send({ to: identifier, ...mail });
        await audit({
          action: 'auth.token_issued',
          entityType: 'User',
          context: { identifier, method: 'magic_link' },
        });
      },
    }),
  ],

  callbacks: {
    /**
     * Porta de entrada. Duas regras:
     *
     * 1. SSO só para o domínio interno — um e-mail Google qualquer não entra
     *    pela porta da equipe.
     * 2. Ninguém se cadastra sozinho. O acesso nasce de um convite feito por
     *    quem já está dentro; sem usuário previamente criado, a entrada é
     *    recusada. É o que mantém a base fechada.
     */
    async signIn({ user, account }) {
      const email = user.email?.toLowerCase();
      if (!email) return false;

      if (account?.provider === 'google' && !isInternalEmail(email)) {
        await audit({
          action: 'auth.failed',
          entityType: 'User',
          context: { email, reason: 'sso_fora_do_dominio' },
        });
        return false;
      }

      const existing = await prisma.user.findUnique({
        where: { email },
        select: { id: true, status: true },
      });

      if (!existing) {
        await audit({
          action: 'auth.failed',
          entityType: 'User',
          context: { email, reason: 'sem_convite' },
        });
        return false;
      }

      if (existing.status === 'blocked') {
        await audit({
          actorUserId: existing.id,
          action: 'auth.failed',
          entityType: 'User',
          entityId: existing.id,
          context: { reason: 'usuario_bloqueado' },
        });
        return false;
      }

      // Primeiro acesso de quem foi convidado.
      if (existing.status === 'invited') {
        await prisma.user.update({
          where: { id: existing.id },
          data: { status: 'active' },
        });
      }

      await prisma.user.update({
        where: { id: existing.id },
        data: { lastSeenAt: new Date() },
      });

      await audit({
        actorUserId: existing.id,
        action: 'auth.login',
        entityType: 'User',
        entityId: existing.id,
        context: { provider: account?.provider ?? 'desconhecido' },
      });

      return true;
    },

    /**
     * A sessão carrega apenas o que a autorização precisa. Permissões por
     * projeto **não** entram aqui: elas são resolvidas por requisição, contra
     * o banco, porque um vínculo revogado precisa valer imediatamente — e um
     * dado gravado na sessão continuaria valendo até ela expirar.
     */
    async session({ session, user }) {
      const record = await prisma.user.findUnique({
        where: { id: user.id },
        select: { isSuperAdmin: true, isInternal: true, status: true },
      });

      session.user.id = user.id;
      session.user.isSuperAdmin = record?.isSuperAdmin ?? false;
      session.user.isInternal = record?.isInternal ?? false;
      session.user.status = record?.status ?? 'invited';
      return session;
    },
  },

  events: {
    async signOut(message) {
      const userId = 'session' in message ? message.session?.userId : undefined;
      await audit({
        actorUserId: userId ?? null,
        action: 'auth.logout',
        entityType: 'User',
        entityId: userId ?? null,
      });
    },
  },

  trustHost: true,
};
