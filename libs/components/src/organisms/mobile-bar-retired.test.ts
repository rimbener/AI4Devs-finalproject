import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { AccountMenu } from './account-menu/account-menu';

const organismsBarrel = resolve(__dirname, 'index.ts');
const mobileBarDir = resolve(__dirname, 'mobile-bar');
const mobileBarE2eDir = resolve(__dirname, '../../tests/e2e/organisms/mobile-bar');
const appChromeSrc = resolve(
  __dirname,
  '../../../study-buddy/src/components/app-chrome/app-chrome.tsx',
);

// @s17 — retired MobileBar removed from the design system; AccountMenu stays.
describe('retired MobileBar (@s17)', () => {
  it('organisms barrel does not export MobileBar; AccountMenu remains', () => {
    const barrel = readFileSync(organismsBarrel, 'utf8');
    expect(barrel).not.toMatch(/mobile-bar/);
    expect(barrel).toMatch(/account-menu/);
    expect(AccountMenu).toBeDefined();
  });

  it('removes the mobile-bar component folder and its Playwright e2e', () => {
    expect(existsSync(mobileBarDir)).toBe(false);
    expect(existsSync(mobileBarE2eDir)).toBe(false);
  });

  // Slice 3 integration: product chrome keeps AccountMenu; no MobileBar import.
  it('AppChrome keeps AccountMenu and does not import MobileBar', () => {
    const src = readFileSync(appChromeSrc, 'utf8');
    expect(src).toMatch(/AccountMenu/);
    expect(src).not.toMatch(/MobileBar/);
    expect(src).not.toMatch(/mobile-bar/);
  });
});
