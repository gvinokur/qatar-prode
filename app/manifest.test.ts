import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('PWA Manifest', () => {
  const manifestPath = path.join(__dirname, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  it('has correct id', () => {
    expect(manifest.id).toBe('prode_mundial');
  });

  it('has correct start_url', () => {
    expect(manifest.start_url).toBe('https://prodemundial.app');
  });

  it('has correct name and short_name', () => {
    expect(manifest.name).toBe('Prode Mundial');
    expect(manifest.short_name).toBe('Prode');
  });

  it('has correct description', () => {
    expect(manifest.description).toBe('Plataforma de pronósticos deportivos');
  });

  it('does not have screenshots array', () => {
    expect(manifest.screenshots).toBeUndefined();
  });

  it('has valid icons array', () => {
    expect(manifest.icons).toBeDefined();
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  it('has correct theme and background colors', () => {
    expect(manifest.theme_color).toBe('#242424');
    expect(manifest.background_color).toBe('#242424');
  });

  it('has standalone display mode', () => {
    expect(manifest.display).toBe('standalone');
  });

  it('has correct language and categories', () => {
    expect(manifest.lang).toBe('es');
    expect(manifest.categories).toContain('social');
    expect(manifest.categories).toContain('sports');
  });
});
