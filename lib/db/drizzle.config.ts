import { defineConfig } from "drizzle-kit";
import path from "path";

if (!process.env.DB_CONNECTION) {
  throw new Error("DB_CONNECTION must be set");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DB_CONNECTION,
  },
});
