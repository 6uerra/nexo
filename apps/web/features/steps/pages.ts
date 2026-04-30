/**
 * Page Object Model — selectores y acciones reutilizables.
 * Mantenemos los locators en un solo lugar para que cuando cambie el DOM
 * solo haya que actualizar una clase, no decenas de tests.
 */
import type { Page } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}
  async goto() { await this.page.goto('/login'); }
  emailInput() { return this.page.locator('input[type=email]'); }
  passwordInput() { return this.page.locator('input[type=password]'); }
  submitBtn() { return this.page.locator('button[type=submit]'); }
  quickAdminBtn() { return this.page.getByRole('button', { name: /Entrar como Admin/i }); }
  quickClientBtn() { return this.page.getByRole('button', { name: /Entrar como Cliente/i }); }
  errorAlert() { return this.page.getByText(/Credenciales|inválida/i).first(); }
  async loginAs(email: string, password: string) {
    await this.emailInput().fill(email);
    await this.passwordInput().fill(password);
    await this.submitBtn().click();
  }
}

export class Sidebar {
  constructor(private page: Page) {}
  root() { return this.page.locator('aside').first(); }
  link(text: string) {
    return this.root().getByRole('link', { name: new RegExp(`^${text}$`, 'i') });
  }
  lockedItem(text: string) {
    return this.root().locator('button').filter({ hasText: new RegExp(text, 'i') });
  }
  async textContent() { return (await this.root().innerText().catch(() => '')) || ''; }
  async exists() { return await this.root().count() > 0; }
}

export class AdminClientsPage {
  constructor(private page: Page) {}
  async goto() { await this.page.goto('/admin/clients'); }
  rowFor(name: string) { return this.page.locator('tr', { hasText: name }); }
  detailLink() { return this.page.getByRole('link', { name: /Ver detalle/i }).first(); }
  async openDemoDetail() {
    await this.goto();
    await this.detailLink().click();
    await this.page.waitForURL((u) => /\/admin\/clients\/[a-f0-9-]+/.test(u.pathname));
  }
}
