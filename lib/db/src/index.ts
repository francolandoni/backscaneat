import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const connectionString = process.env.DB_CONNECTION;

if (!connectionString) {
  throw new Error(
    "DB_CONNECTION must be set. Configure your MySQL connection string.",
  );
}

const pool = mysql.createPool(connectionString);
export const db = drizzle(pool, { schema, mode: "default" });

export * from "./schema";

export { eq, and, or, desc, asc, sql, inArray, isNull, isNotNull } from "drizzle-orm";
