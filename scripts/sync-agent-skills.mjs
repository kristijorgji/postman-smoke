import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const scopeDir = join(root, 'node_modules', '@kristijorgji');
const vendorDir = join(root, '.agents', 'skills', 'vendor');

if (!existsSync(scopeDir)) {
    process.exit(0);
}

/** @type {{ packageName: string; skillName: string; src: string }[]} */
const skills = [];

for (const packageName of readdirSync(scopeDir)) {
    const skillsRoot = join(scopeDir, packageName, 'skills');
    if (!existsSync(skillsRoot)) {
        continue;
    }

    for (const skillName of readdirSync(skillsRoot)) {
        const src = join(skillsRoot, skillName);
        if (!existsSync(join(src, 'SKILL.md'))) {
            continue;
        }
        skills.push({ packageName, skillName, src });
    }
}

rmSync(vendorDir, { recursive: true, force: true });

if (skills.length === 0) {
    process.exit(0);
}

mkdirSync(vendorDir, { recursive: true });

for (const { skillName, src } of skills) {
    cpSync(src, join(vendorDir, skillName), { recursive: true, dereference: true });
}

const byPackage = Map.groupBy
    ? Map.groupBy(skills, (s) => s.packageName)
    : skills.reduce((map, s) => {
          const list = map.get(s.packageName) ?? [];
          list.push(s);
          map.set(s.packageName, list);
          return map;
      }, new Map());

const summary = [...byPackage.entries()]
    .map(([pkg, list]) => `${list.length} from @kristijorgji/${pkg}`)
    .join(', ');

console.log(`synced ${skills.length} skill${skills.length === 1 ? '' : 's'} (${summary})`);
