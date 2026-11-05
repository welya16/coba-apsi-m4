import { defineConfig } from "@prisma/config";

export default defineConfig({
  datasource: {
    url: "postgresql://postgres:Meme123@localhost:5432/apsi_db?schema=public",
  },
});