-- A V2 gravou o endereço das fotos de exemplo como http://localhost:8080/..., que
-- só funciona rodando na máquina local. Aqui ele passa a ser só o caminho
-- (/api/users/{id}/avatar), e a API completa com o próprio endereço ao responder.
-- Assim as fotos aparecem em qualquer ambiente (local, Railway etc.).
UPDATE users
SET avatar_url = SUBSTRING(avatar_url, CHAR_LENGTH('http://localhost:8080') + 1)
WHERE avatar_url LIKE 'http://localhost:8080/api/users/%';
