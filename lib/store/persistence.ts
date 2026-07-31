export type PersistenceMode = "database" | "memory";

export type PersistenceStatus = {
  mode: PersistenceMode;
  durable: boolean;
  detail: string;
};

export const DATABASE_PERSISTENCE: PersistenceStatus = {
  mode: "database",
  durable: true,
  detail: "Stored in Supabase Postgres for the signed-in account."
};

export const MEMORY_PERSISTENCE: PersistenceStatus = {
  mode: "memory",
  durable: false,
  detail: "Stored in demo memory for this running app instance; it is not durable."
};
