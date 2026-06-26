import { expect, test } from '@playwright/test';

/**
 * Flujo completo: registro → avatar → torneo (sala, 1 tirada) → cargar puntaje
 * → finalizar → podio. Usa un alias único por corrida para no depender de reset.
 */
test('flujo completo de torneo', async ({ page }) => {
  const alias = `e2e${Date.now()}`;
  const password = 'archery123';

  // ── Registro ──
  await page.goto('/register');
  await page.getByLabel('Alias').fill(alias);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByLabel('Pregunta de seguridad').selectOption('3');
  await page.getByLabel('Respuesta').fill('Firulais');
  await page.getByRole('button', { name: 'Crear cuenta' }).click();

  await expect(page.getByRole('heading', { name: 'Inicio' })).toBeVisible();

  // ── Crear avatar (Inicio → Avatares → Nuevo avatar) ──
  await page.getByRole('link', { name: 'Avatares' }).click();
  await page.getByRole('link', { name: 'Nuevo avatar' }).click();
  await page.getByLabel('Alias').fill('Robin');
  await page.getByRole('button', { name: 'Recurvo olímpico' }).click();
  await page.getByRole('button', { name: 'Azul' }).click();
  await page.getByRole('button', { name: 'Crear avatar' }).click();

  // Vuelve a la gestión de avatares con el nuevo avatar en la lista.
  await expect(page.getByText('Robin')).toBeVisible();

  // ── Volver a Inicio y crear torneo (sala, 1 tirada) ──
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Inicio' })).toBeVisible();
  await page.getByRole('link', { name: 'Nuevo torneo' }).click();
  await page.getByLabel('Nombre').fill('Copa E2E');
  await page.getByLabel('Tiradas').fill('1');
  await page.getByText('Robin').click(); // selecciona el avatar
  await page.getByRole('button', { name: 'Crear torneo' }).click();

  // ── Cargar la tirada 1 ──
  await page.getByText('Tirada 1').click();
  await page.getByText('Robin').click(); // abre el keypad para el arquero
  await page.getByRole('button', { name: 'X', exact: true }).click();
  await page.getByRole('button', { name: '9', exact: true }).click();
  await page.getByRole('button', { name: '7', exact: true }).click();

  await page.getByRole('button', { name: 'Volver al torneo' }).click();

  // ── Finalizar y ver podio ──
  await page.getByRole('button', { name: 'Finalizar torneo' }).click();
  await page.getByRole('link', { name: 'Ver podios' }).click();

  await expect(page.getByRole('heading', { name: 'General' })).toBeVisible();
  await expect(page.getByText('Robin').first()).toBeVisible();
});
