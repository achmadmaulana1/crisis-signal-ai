import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url:
      process.env.DATABASE_URL ??
      'file:C:/Users/Asus_/OneDrive/Documents/GITHUB/crisis-signal-ai/prisma/dev.db',
  },
  migrations: {
    seed: 'node prisma/seed.js',
  },
})
