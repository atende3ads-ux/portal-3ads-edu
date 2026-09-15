import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * Configuração do Prisma 7. A URL de conexão vive aqui, fora do schema:
 * o Migrate a usa diretamente e o PrismaClient recebe um adapter
 * (ver src/server/db.ts).
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
