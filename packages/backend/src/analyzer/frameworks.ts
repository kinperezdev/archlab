/**
 * Framework / language profile detection.
 *
 * Derives a set of boolean flags (and a primary language + human label) from a
 * scan so the pipeline can gate framework-specific findings and generate
 * language-appropriate advice instead of assuming a Node/Express/React stack.
 */

import type { ScanResult } from './scan.js';

export type PrimaryLanguage =
  | 'typescript'
  | 'javascript'
  | 'python'
  | 'go'
  | 'java'
  | 'kotlin'
  | 'rust'
  | 'php'
  | 'ruby'
  | 'csharp'
  | 'swift'
  | 'dart'
  | 'unknown';

export interface TechProfile {
  isReact: boolean;
  isExpress: boolean;
  isDjango: boolean;
  isFastapi: boolean;
  isFlask: boolean;
  isSpring: boolean;
  isGo: boolean;
  isLaravel: boolean;
  isRails: boolean;
  isAspNet: boolean;
  isRust: boolean;
  isFlutter: boolean;
  primaryLanguage: PrimaryLanguage;
  /** Short human-friendly stack label, e.g. "Python / Django". */
  label: string;
}

/** Build a framework/language profile from the scanned files. */
export function detectFrameworks(scan: ScanResult): TechProfile {
  const has = (re: RegExp) => scan.files.some((f) => f.content && re.test(f.content));
  const hasFile = (name: string) =>
    scan.files.some((f) => f.relPath === name || f.relPath.endsWith('/' + name));
  const pkg = scan.files.find((f) => f.relPath === 'package.json')?.content ?? '';
  const pkgHas = (dep: string) => new RegExp(`"${dep}"`).test(pkg);
  const extCount = (ext: string) => scan.files.filter((f) => f.ext === ext).length;

  const isReact = pkgHas('react') || has(/from ['"]react['"]|require\(['"]react['"]\)|\breact-dom\b/);
  const isExpress = pkgHas('express') || has(/require\(['"]express['"]\)|from ['"]express['"]|express\(\)/);
  const isDjango = hasFile('manage.py') || has(/\bdjango\b/i);
  const isFastapi = has(/\bfastapi\b/i);
  const isFlask = has(/\bflask\b/i);
  const isSpring = hasFile('pom.xml') || has(/SpringBootApplication|@RestController|spring-boot/i);
  const isGo = hasFile('go.mod') || extCount('.go') > 0;
  const isLaravel = hasFile('artisan') || has(/\billuminate\b|\blaravel\b/i);
  const isRails = hasFile('config/application.rb') || hasFile('config.ru') || has(/Rails\.application|ActiveRecord::/);
  const isAspNet = extCount('.cs') > 0 && has(/Microsoft\.AspNetCore|WebApplication\.CreateBuilder|asp\.net/i);
  const isRust = hasFile('Cargo.toml') || extCount('.rs') > 0;
  const isFlutter = hasFile('pubspec.yaml') || extCount('.dart') > 0;

  // Primary language by dominant source-file extension.
  const counts: Array<[PrimaryLanguage, number]> = [
    ['typescript', extCount('.ts') + extCount('.tsx')],
    ['javascript', extCount('.js') + extCount('.jsx')],
    ['python', extCount('.py')],
    ['go', extCount('.go')],
    ['java', extCount('.java')],
    ['kotlin', extCount('.kt')],
    ['rust', extCount('.rs')],
    ['php', extCount('.php')],
    ['ruby', extCount('.rb')],
    ['csharp', extCount('.cs')],
    ['swift', extCount('.swift')],
    ['dart', extCount('.dart')],
  ];
  counts.sort((a, b) => b[1] - a[1]);
  const primaryLanguage: PrimaryLanguage = counts[0][1] > 0 ? counts[0][0] : 'unknown';

  const framework =
    (isDjango && 'Django') ||
    (isFastapi && 'FastAPI') ||
    (isFlask && 'Flask') ||
    (isSpring && 'Spring') ||
    (isLaravel && 'Laravel') ||
    (isRails && 'Rails') ||
    (isAspNet && 'ASP.NET') ||
    (isExpress && 'Express') ||
    (isReact && 'React') ||
    (isFlutter && 'Flutter') ||
    '';

  const langLabel: Record<PrimaryLanguage, string> = {
    typescript: 'TypeScript',
    javascript: 'JavaScript',
    python: 'Python',
    go: 'Go',
    java: 'Java',
    kotlin: 'Kotlin',
    rust: 'Rust',
    php: 'PHP',
    ruby: 'Ruby',
    csharp: 'C#',
    swift: 'Swift',
    dart: 'Dart',
    unknown: 'an undetected language',
  };
  const label = framework
    ? `${langLabel[primaryLanguage]} / ${framework}`
    : langLabel[primaryLanguage];

  return {
    isReact,
    isExpress,
    isDjango,
    isFastapi,
    isFlask,
    isSpring,
    isGo,
    isLaravel,
    isRails,
    isAspNet,
    isRust,
    isFlutter,
    primaryLanguage,
    label,
  };
}
