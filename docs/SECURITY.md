# Seguridad — BV Archery Battle

La seguridad es **no negociable**. Base reutilizada de `bv-bow-sight` (sesión httpOnly + CSRF). Este documento lista controles y su checklist de verificación.

## 1. Autenticación y sesión

- Passwords y respuestas de recuperación con **argon2id** (nunca texto plano, nunca hashes rápidos tipo MD5/SHA por sí solos).
- Sesión = token aleatorio de alta entropía. En la cookie va el token; en la DB se guarda **`sha256(token)`** (no el token).
- Cookie de sesión: **`HttpOnly`**, **`Secure`** (prod), **`SameSite=Lax`**, `Path=/`, expiración definida.
- **Lookup timing-safe** en login (comparar contra un `DUMMY_HASH` cuando el alias no existe) para evitar enumeración de usuarios por tiempo.
- Logout invalida la sesión en la DB.

## 2. CSRF

- Token CSRF en cookie legible + **header `x-csrf-token` obligatorio** en toda mutación (`POST/PUT/PATCH/DELETE`).
- El FE obtiene el token vía `GET /api/auth/csrf` antes de la primera mutación.
- Rechazo (403) si falta o no coincide.

## 3. Autorización (ownership)

- Cada recurso (avatar, torneo, tirada, score) pertenece a un `user_id`.
- **Todos** los endpoints verifican que el recurso pertenece al usuario de la sesión → 404/403 si no.
- Nunca exponer ids de otros usuarios ni permitir IDOR.

## 4. Validación de entrada

- **Zod `.strict()`** en todo input: rechaza propiedades no declaradas (evita mass-assignment / contaminación).
- Validación de tipos, longitudes y enums (categorías, modalidades, colores, tokens de flecha).
- El servidor es la **autoridad de scoring**: deriva el valor de cada flecha del token y recalcula `end_total`/contadores; ignora cualquier total enviado por el cliente.

## 5. Capa de datos

- **Solo prepared statements parametrizados** (better-sqlite3). Prohibido interpolar valores en SQL.
- `foreign_keys = ON`; `ON DELETE CASCADE`/`SET NULL` coherentes.
- Transacciones para operaciones compuestas (crear torneo, autosave con rollups).

## 6. Cabeceras y transporte

- **CSP** restrictiva (default-src self; sin inline salvo el script anti-FOUC con nonce/hash).
- `X-Content-Type-Options: nosniff`, `Referrer-Policy: same-origin`, `X-Frame-Options: DENY`, `Permissions-Policy` mínima.
- **HSTS** en producción. Solo HTTPS (el proveedor de hosting termina TLS).

## 7. Rate limiting

- Límite por IP en `/auth/*` (login/register/recover) para frenar fuerza bruta.
- Límite en escritura de scores para evitar abuso.

## 8. Datos personales (PII)

- Sin emails ni datos personales de los participantes: solo **alias, color, categoría, experiencia**.
- Cuenta del usuario: alias + password (+ pregunta de recuperación). Sin email en la primera instancia.

## 9. Dependencias y build

- Lockfile fijo; revisar `pnpm audit` en CI.
- Sin secretos en el repo; configuración por variables de entorno (ver `CONFIG.md`).
- Logs sin datos sensibles (no loguear tokens, hashes ni passwords).

## 10. Checklist de verificación

- [ ] Request mutante **sin CSRF** → 403.
- [ ] Request **sin sesión** a recurso protegido → 401.
- [ ] Acceso a **recurso de otro usuario** → 403/404.
- [ ] Payload con **propiedad extra** → rechazado por `.strict()`.
- [ ] `end_total` falseado por el cliente → **ignorado**, recalculado en server.
- [ ] Token de flecha inválido (p. ej. `12` en sala) → rechazado.
- [ ] Passwords almacenados con argon2id; tokens de sesión como `sha256` en DB.
- [ ] Cookies con `HttpOnly`/`Secure`/`SameSite`.
- [ ] Cabeceras de seguridad presentes (CSP, nosniff, frame-options, HSTS en prod).
- [ ] Rate limit activo en `/auth/*`.
- [ ] `pnpm audit` sin vulnerabilidades críticas.

> Ejecutar `/security-review` sobre el diff antes de cada merge relevante.
