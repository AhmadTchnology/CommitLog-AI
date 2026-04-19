import fs from 'node:fs/promises';
import path from 'node:path';
import semver from 'semver';

export async function detectVersion(): Promise<string | undefined> {
    // Try package.json
    const pkgVersion = await readJsonVersion('package.json');
    if (pkgVersion) return pkgVersion;

    // Try pyproject.toml
    const pyVersion = await readPyprojectVersion();
    if (pyVersion) return pyVersion;

    // Try Cargo.toml
    const cargoVersion = await readCargoVersion();
    if (cargoVersion) return cargoVersion;

    return undefined;
}

async function readJsonVersion(filename: string): Promise<string | undefined> {
    try {
        const content = await fs.readFile(path.resolve(filename), 'utf-8');
        const pkg = JSON.parse(content);
        if (pkg.version && semver.valid(pkg.version)) {
            return pkg.version;
        }
    } catch {
        // File doesn't exist or invalid
    }
    return undefined;
}

async function readPyprojectVersion(): Promise<string | undefined> {
    try {
        const content = await fs.readFile(path.resolve('pyproject.toml'), 'utf-8');
        const match = content.match(/version\s*=\s*"([^"]+)"/);
        if (match && semver.valid(match[1])) {
            return match[1];
        }
    } catch {
        // File doesn't exist
    }
    return undefined;
}

async function readCargoVersion(): Promise<string | undefined> {
    try {
        const content = await fs.readFile(path.resolve('Cargo.toml'), 'utf-8');
        const match = content.match(/version\s*=\s*"([^"]+)"/);
        if (match && semver.valid(match[1])) {
            return match[1];
        }
    } catch {
        // File doesn't exist
    }
    return undefined;
}

export function formatDate(date?: Date): string {
    const d = date ?? new Date();
    return d.toISOString().split('T')[0];
}
