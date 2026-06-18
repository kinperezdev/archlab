/**
 * Classifier — turns scanned files into canvas nodes, edges, and a tech-stack
 * fingerprint. Heuristic and language-agnostic by design: the canvas is built
 * from real files, but detection is best-effort across frameworks.
 */

import path from 'node:path';
import type { CanvasNode, NodeKind, Lane } from '@archlab/shared';
import { isEntryFile } from '@archlab/shared';
import type { ScannedFile, ScanResult } from './scan.js';

/**
 * Backend framework / server signals across ecosystems. Matched case-insensitively
 * against file content. Bare words are word-bounded to limit false positives;
 * symbol-rich tokens (decorators, method chains) are matched literally.
 */
const BACKEND_FRAMEWORK_RE =
  /\b(?:express|fastify|koa|nestjs|flask|django|fastapi|uvicorn|starlette|aiohttp|tornado|gin|echo|fiber|chi|mux|axum|actix|rocket|warp|hyper|spring|ktor|ktorapplication|laravel|artisan|illuminate|symfony|silex|rails|sinatra|rack|vapor|perfect|kitura)\b|app\.listen|createServer|http\.ListenAndServe|@RestController|@Controller|@Service|@Repository|SpringBootApplication|ControllerBase|RestController|asp\.net|\.UseEndpoints|\.MapGet|\.MapPost|WebApplication/i;

/** Endpoint / route-handler signals across web frameworks. */
const ENDPOINT_RE =
  /route|controller|endpoint|handler|\.(?:get|post|put|delete)\(|r\.(?:GET|POST|PUT|DELETE)\(|@(?:Get|Post|Put|Delete)Mapping|@RequestMapping|router\.(?:get|post|put|delete)|Route::(?:get|post|put|delete)|(?:get|post)\s+'\/|app\.MapGet|app\.MapPost|\.(?:get|post)\(path:/i;

export interface Classification {
  nodes: CanvasNode[];
  techStack: string[];
  /** Map of relPath -> node id, used later to derive edges from imports. */
  fileToNode: Map<string, string>;
}

/** Decide which lane + kind a file belongs to based on its path and content. */
function classifyFile(file: ScannedFile): { lane: Lane; kind: NodeKind } | null {
  const p = file.relPath.toLowerCase();
  const c = file.content;

  // External / config surfaces first.
  if (/(^|\/)\.env/.test(p)) return { lane: 'external', kind: 'config' };
  if (/(^|\/)(prisma\/schema\.prisma|schema\.sql)$/.test(p) || file.ext === '.sql') {
    return { lane: 'external', kind: 'database' };
  }
  if (/docker-compose|\.tf$/.test(p)) return { lane: 'external', kind: 'config' };
  if (/(^|\/)mcp(-server)?\//.test(p) || /@modelcontextprotocol\/sdk|mcpServer/i.test(c + p)) {
    return { lane: 'backend', kind: 'mcp' };
  }

  // Backend signals.
  const looksBackend =
    /(^|\/)(server|backend|api|routes|controllers|services|middleware|models|handlers|cmd|internal|app\/http)\//.test(p) ||
    BACKEND_FRAMEWORK_RE.test(c);

  if (looksBackend) {
    if (/middleware/.test(p)) return { lane: 'backend', kind: 'middleware' };
    if (/\bauth\b|\bauthentication\b|\bauthorization\b|\bpassport\b|\bjwt\b/.test(p + c)) return { lane: 'backend', kind: 'auth' };
    if (/(model|schema|entity|repository)/.test(p)) return { lane: 'backend', kind: 'database' };
    if (ENDPOINT_RE.test(p + c)) {
      return { lane: 'backend', kind: 'endpoint' };
    }
    return { lane: 'backend', kind: 'endpoint' };
  }

  // General frontend file check (React, Vue, Svelte, Flutter, SwiftUI, Android Compose, Unity, Obj-C)
  const isFrontendFile =
    ['.tsx', '.jsx', '.vue', '.svelte', '.dart', '.swift', '.kt', '.html', '.cs', '.m'].includes(file.ext) ||
    /(^|\/)(src\/components|src\/pages|src\/routes|app|pages|components|src\/state|src\/utils|lib\/|features\/)\//.test(p) ||
    p.includes('/frontend/') || p.includes('/ios/') || p.includes('/android/');

  if (isFrontendFile) {
    if (p.endsWith('.g.dart') || p.endsWith('.freezed.dart') || p.includes('/test/') || p.includes('/androidTest/')) {
      return null;
    }

    // Heuristics for a screen/page route (user-facing views or entry points)
    const isPageRoute =
      /(^|\/)(pages|routes|screens|views|navigation|router|routing)\//.test(p) ||
      /(_screen|_page|viewcontroller|router|routing)\b/.test(p) ||
      /(useRouter|createBrowserRouter|<Route|GoRoute|StatefulShellRoute|GoRouter|RouteBase)/i.test(c) ||
      /(^|\/)(page|layout|router|routes)\.(tsx|jsx|ts|js|dart)$/.test(p) ||
      /class\s+\w+(Screen|Page|ViewController|Activity|Fragment|Router)\b/i.test(c) ||
      /struct\s+\w+View\s*:\s*View\b/i.test(c); // SwiftUI screen view convention

    if (isPageRoute) {
      return { lane: 'frontend', kind: 'route' };
    }

    // Heuristics for component
    const isComponent =
      /(^|\/)(components|widgets|ui|controls)\//.test(p) ||
      /(_widget|_component)\b/.test(p) ||
      /extends\s+(StatelessWidget|StatefulWidget|ConsumerWidget)/i.test(c) ||
      /struct\s+\w+\s*:\s*View\b/i.test(c) || // SwiftUI View struct
      ['.tsx', '.jsx', '.vue', '.svelte'].includes(file.ext);

    if (isComponent) {
      return { lane: 'frontend', kind: 'component' };
    }

    // Fallback for frontend source files
    return { lane: 'frontend', kind: 'component' };
  }

  return null; // Not a meaningful architecture node (e.g. css, json config).
}

/** Detect a coarse tech-stack fingerprint from filenames + package.json. */
function detectTechStack(scan: ScanResult): string[] {
  const stack = new Set<string>();
  const pkg = scan.files.find((f) => f.relPath === 'package.json');
  if (pkg?.content) {
    const deps = pkg.content;
    const add = (name: string, label: string) => {
      if (new RegExp(`"${name}"`).test(deps)) stack.add(label);
    };
    add('react', 'React');
    add('typescript', 'TypeScript');
    add('express', 'Express');
    add('fastify', 'Fastify');
    add('next', 'Next.js');
    add('vue', 'Vue');
    add('svelte', 'Svelte');
    add('ws', 'WebSockets');
    add('prisma', 'Prisma');
    add('@prisma/client', 'Prisma');
    add('mongoose', 'MongoDB');
    add('pg', 'PostgreSQL');
  }

  // Check configs
  if (scan.files.some((f) => f.relPath === 'pubspec.yaml')) {
    stack.add('Flutter/Dart');
  }
  if (scan.files.some((f) => f.relPath === 'Cargo.toml')) {
    stack.add('Rust');
  }
  if (scan.files.some((f) => f.relPath === 'go.mod')) {
    stack.add('Go');
  }
  if (scan.files.some((f) => f.relPath.endsWith('.csproj'))) {
    stack.add('C#');
  }
  if (scan.files.some((f) => f.relPath === 'Podfile' || f.relPath.endsWith('.xcodeproj'))) {
    stack.add('iOS/Swift');
  }
  // Maven projects (pom.xml) are Java. Gradle projects are Android/Kotlin when a
  // Kotlin source is present, otherwise plain Java/Gradle.
  if (scan.files.some((f) => f.relPath === 'pom.xml' || f.relPath.endsWith('/pom.xml'))) {
    stack.add('Java');
  }
  const hasGradle = scan.files.some(
    (f) =>
      f.relPath.endsWith('build.gradle') ||
      f.relPath.endsWith('build.gradle.kts') ||
      f.relPath.endsWith('settings.gradle'),
  );
  if (hasGradle) {
    const hasKotlin = scan.files.some((f) => f.ext === '.kt');
    stack.add(hasKotlin ? 'Android/Kotlin' : 'Java/Gradle');
  }

  // Check file extensions fallback
  if (scan.files.some((f) => f.ext === '.dart')) stack.add('Flutter/Dart');
  if (scan.files.some((f) => f.ext === '.swift')) stack.add('Swift/iOS');
  if (scan.files.some((f) => f.ext === '.kt')) stack.add('Kotlin/Android');
  if (scan.files.some((f) => f.ext === '.rs')) stack.add('Rust');
  if (scan.files.some((f) => f.ext === '.go')) stack.add('Go');
  if (scan.files.some((f) => f.ext === '.py' || f.relPath.includes('requirements.txt'))) stack.add('Python');
  if (scan.files.some((f) => f.ext === '.cs')) stack.add('C#');
  if (scan.files.some((f) => ['.cpp', '.cc', '.cxx', '.c', '.h', '.hpp'].includes(f.ext))) stack.add('C/C++');
  if (scan.files.some((f) => f.ext === '.scala')) stack.add('Scala');
  if (scan.files.some((f) => f.ext === '.rb')) stack.add('Ruby');

  return [...stack];
}

import { parseSchemaForFile } from './dbParser.js';

/** Run the full classification pass over a scan result. */
export function classify(scan: ScanResult): Classification {
  const nodes: CanvasNode[] = [];
  const fileToNode = new Map<string, string>();

  for (const file of scan.files) {
    const decision = classifyFile(file);
    if (!decision) continue;

    const id = `n_${nodes.length}`;
    
    // Parse database schemas if this node represents a DB file. Supports Prisma,
    // SQL, Python (Django/SQLAlchemy), Go (GORM), and Java/Kotlin (JPA).
    const meta: Record<string, string | number | boolean> = { ext: file.ext };
    if (isEntryFile(file.relPath)) meta.isEntry = true;
    if (decision.kind === 'database' && file.content) {
      try {
        const schema = parseSchemaForFile(file.ext, file.content);
        if (schema.length > 0) meta.dbSchema = JSON.stringify(schema);
      } catch {
        // Safe fallback if parsing fails on half-written files
      }
    }

    nodes.push({
      id,
      kind: decision.kind,
      lane: decision.lane,
      label: path.basename(file.relPath),
      filePath: file.relPath,
      animation: 'idle',
      position: { x: 0, y: 0 }, // Filled in by the layout pass.
      meta,
    });
    fileToNode.set(file.relPath, id);
  }

  return { nodes, techStack: detectTechStack(scan), fileToNode };
}
