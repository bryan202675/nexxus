-- El advisor de seguridad marcó la extensión vector instalada en el schema public (mala
-- práctica: mezcla objetos de extensión con las tablas de la app). No hay ninguna columna
-- usando el tipo vector todavía (verificado contra information_schema.columns), así que es
-- un simple reordenamiento sin impacto. El proyecto ya usa "extensions" como schema para el
-- resto de extensiones (pgcrypto, uuid-ossp, pg_stat_statements).
alter extension vector set schema extensions;
