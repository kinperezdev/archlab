/**
 * ArchCo company roster — the 25+ pixel-art employees across five floors.
 *
 * Pure data. Every other ArchCo module derives from this: floor scenes render
 * the employees on their floor, the time system decides who is present, and the
 * growth system tracks XP per employee id.
 */

export type Department =
  | 'leadership'
  | 'engineering-backend'
  | 'engineering-frontend'
  | 'sre-devops'
  | 'security'
  | 'product'
  | 'design'
  | 'qa'
  | 'finops';

export type Floor = 1 | 2 | 3 | 4 | 5 | 6;

export type HairStyle =
  | 'short'
  | 'curly'
  | 'long'
  | 'ponytail'
  | 'bun'
  | 'messy'
  | 'bald'
  | 'swept';

export type Accessory =
  | 'glasses'
  | 'headphones'
  | 'coffee'
  | 'phone'
  | 'clipboard'
  | 'tablet'
  | 'stylus';

export type EmployeeStatus =
  | 'working'
  | 'idle'
  | 'meeting'
  | 'break'
  | 'on-call'
  | 'gone-home';

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: Department;
  floor: Floor;
  color: string;
  skinTone: string;
  hairStyle: HairStyle;
  hairColor: string;
  accessory?: Accessory;
  personality: string;
  specialization: string[];
  deskPosition: { x: number; y: number };
  level: number;
  xp: number;
  xpToNextLevel: number;
  tasksCompleted: number;
  currentTask?: string;
  status: EmployeeStatus;
  catchphrases: string[];
  ambientMessages: string[];
}

export const EMPLOYEES: Employee[] = [
  // FLOOR 1 — Leadership & Operations
  {
    id: 'alex-chen',
    name: 'Alex Chen',
    role: 'CTO',
    department: 'leadership',
    floor: 1,
    color: '#6366F1',
    skinTone: '#F3C5A0',
    hairStyle: 'short',
    hairColor: '#1A1A2E',
    accessory: 'glasses',
    personality: 'Visionary, decisive, thinks in systems, occasionally over-engineers, loves whiteboards',
    specialization: ['system architecture', 'technical strategy', 'team leadership', 'final decisions'],
    deskPosition: { x: 580, y: 120 },
    level: 10,
    xp: 9800,
    xpToNextLevel: 10000,
    tasksCompleted: 847,
    status: 'working',
    catchphrases: ["Let's not over-engineer this", 'Think about the long term', 'What does the data say?', 'We need to talk about technical debt'],
    ambientMessages: ['reviewing architecture diagrams...', 'in the zone', 'thinking about scaling...'],
  },
  {
    id: 'jamie-park',
    name: 'Jamie Park',
    role: 'COO',
    department: 'leadership',
    floor: 1,
    color: '#64748B',
    skinTone: '#C68642',
    hairStyle: 'swept',
    hairColor: '#4A3728',
    personality: 'Operational excellence, process-oriented, bridges engineering and business, meetings all day',
    specialization: ['operations', 'process optimization', 'team coordination', 'resource allocation'],
    deskPosition: { x: 480, y: 120 },
    level: 9,
    xp: 8200,
    xpToNextLevel: 9000,
    tasksCompleted: 623,
    status: 'working',
    catchphrases: ["What's blocking you?", 'We need a process for this', "Let's sync on that", 'Timeline?'],
    ambientMessages: ['updating roadmap...', 'in 3 meetings today', 'coordinating teams...'],
  },
  {
    id: 'fran-torres',
    name: 'Fran Torres',
    role: 'FinOps / Token Monitor',
    department: 'finops',
    floor: 1,
    color: '#EAB308',
    skinTone: '#FDBCB4',
    hairStyle: 'bun',
    hairColor: '#92400E',
    accessory: 'glasses',
    personality: 'Numbers-obsessed, panics when budget runs low, celebrates when tokens are saved, has a big token counter on her monitor',
    specialization: ['token budget', 'cost optimization', 'resource monitoring', 'budget alerts'],
    deskPosition: { x: 120, y: 180 },
    level: 7,
    xp: 5400,
    xpToNextLevel: 6000,
    tasksCompleted: 412,
    status: 'working',
    catchphrases: ['Watch the token burn rate!', "We're at 50% budget!", 'MAYDAY MAYDAY tokens running low!', 'Nice, we saved tokens there'],
    ambientMessages: ['monitoring token usage...', 'budget looks good', 'calculating burn rate...', 'updating cost report...'],
  },

  // FLOOR 2 — Engineering Backend
  {
    id: 'marcus-webb',
    name: 'Marcus Webb',
    role: 'Senior Backend Lead',
    department: 'engineering-backend',
    floor: 2,
    color: '#06B6D4',
    skinTone: '#8D5524',
    hairStyle: 'curly',
    hairColor: '#1A1A1A',
    accessory: 'coffee',
    personality: 'Deep distributed systems knowledge, pragmatic, always has coffee, slightly opinionated about databases',
    specialization: ['distributed systems', 'API design', 'database optimization', 'backend architecture'],
    deskPosition: { x: 100, y: 140 },
    level: 9,
    xp: 7800,
    xpToNextLevel: 9000,
    tasksCompleted: 734,
    status: 'working',
    catchphrases: ['This query needs an index', 'Have you considered caching?', 'The database will thank us', 'N+1 query detected'],
    ambientMessages: ['optimizing queries...', 'reviewing API design...', 'refactoring service layer...'],
  },
  {
    id: 'kai-nakamura',
    name: 'Kai Nakamura',
    role: 'Senior Backend Engineer',
    department: 'engineering-backend',
    floor: 2,
    color: '#0891B2',
    skinTone: '#F3C5A0',
    hairStyle: 'short',
    hairColor: '#1A1A1A',
    accessory: 'headphones',
    personality: 'Performance obsessed, loves benchmarks, quiet but deadly in code reviews, listens to lo-fi while coding',
    specialization: ['performance optimization', 'Go/Rust', 'microservices', 'benchmarking'],
    deskPosition: { x: 200, y: 140 },
    level: 8,
    xp: 6200,
    xpToNextLevel: 7000,
    tasksCompleted: 521,
    status: 'working',
    catchphrases: ['Have you profiled this?', 'The benchmark says otherwise', 'This can be 10x faster', 'Memory allocation issue'],
    ambientMessages: ['running benchmarks...', 'profiling service...', 'writing Go service...'],
  },
  {
    id: 'yuna-park',
    name: 'Yuna Park',
    role: 'Senior Backend Engineer',
    department: 'engineering-backend',
    floor: 2,
    color: '#0E7490',
    skinTone: '#F3C5A0',
    hairStyle: 'long',
    hairColor: '#1A1A1A',
    personality: 'API design expert, obsessed with developer experience, writes the best documentation on the team',
    specialization: ['API design', 'REST/GraphQL', 'developer experience', 'documentation'],
    deskPosition: { x: 300, y: 140 },
    level: 8,
    xp: 6800,
    xpToNextLevel: 7000,
    tasksCompleted: 498,
    status: 'working',
    catchphrases: ['The API contract matters', 'Would a junior dev understand this?', 'Document as you go', 'Versioning this properly'],
    ambientMessages: ['designing API schema...', 'writing OpenAPI spec...', 'reviewing REST conventions...'],
  },
  {
    id: 'ravi-patel',
    name: 'Ravi Patel',
    role: 'Senior Backend Engineer',
    department: 'engineering-backend',
    floor: 2,
    color: '#0D9488',
    skinTone: '#C68642',
    hairStyle: 'short',
    hairColor: '#1A1A1A',
    personality: 'Database wizard, knows every index trick, can read query plans like poetry, slightly smug about it',
    specialization: ['database design', 'query optimization', 'data modeling', 'migrations'],
    deskPosition: { x: 400, y: 140 },
    level: 8,
    xp: 7100,
    xpToNextLevel: 8000,
    tasksCompleted: 567,
    status: 'working',
    catchphrases: ['Let me see the query plan', "That's a table scan", 'Index this foreign key', 'Migration needs a rollback'],
    ambientMessages: ['analyzing query plans...', 'designing schema...', 'writing migration...'],
  },
  {
    id: 'elena-vasquez',
    name: 'Elena Vasquez',
    role: 'Senior Backend Engineer',
    department: 'engineering-backend',
    floor: 2,
    color: '#0891B2',
    skinTone: '#C68642',
    hairStyle: 'ponytail',
    hairColor: '#4A3728',
    personality: 'Event-driven architecture specialist, thinks everything should be a message queue, evangelizes Kafka',
    specialization: ['event-driven architecture', 'message queues', 'Kafka', 'async systems'],
    deskPosition: { x: 500, y: 140 },
    level: 7,
    xp: 5900,
    xpToNextLevel: 6000,
    tasksCompleted: 443,
    status: 'working',
    catchphrases: ['Should this be async?', 'Put it in the queue', 'Events are immutable facts', 'Dead letter queue?'],
    ambientMessages: ['designing event schema...', 'reviewing Kafka setup...', 'tracing message flow...'],
  },

  // FLOOR 2 — Engineering Frontend
  {
    id: 'casey-kim',
    name: 'Casey Kim',
    role: 'Senior Frontend Lead',
    department: 'engineering-frontend',
    floor: 2,
    color: '#A855F7',
    skinTone: '#F3C5A0',
    hairStyle: 'swept',
    hairColor: '#6B21A8',
    personality: 'Component architecture expert, performance-obsessed, advocates for accessibility, judges bad CSS',
    specialization: ['React architecture', 'performance', 'accessibility', 'component design'],
    deskPosition: { x: 100, y: 240 },
    level: 9,
    xp: 7600,
    xpToNextLevel: 9000,
    tasksCompleted: 689,
    status: 'working',
    catchphrases: ['Is this accessible?', 'Bundle size increased', 'Lighthouse score dropped', 'This rerenders too much'],
    ambientMessages: ['auditing bundle size...', 'fixing accessibility...', 'optimizing renders...'],
  },
  {
    id: 'mia-chen',
    name: 'Mia Chen',
    role: 'Senior Frontend Engineer',
    department: 'engineering-frontend',
    floor: 2,
    color: '#9333EA',
    skinTone: '#F3C5A0',
    hairStyle: 'long',
    hairColor: '#1A1A1A',
    personality: 'State management guru, has strong opinions about Zustand vs Redux, writes perfect TypeScript',
    specialization: ['state management', 'TypeScript', 'React hooks', 'data fetching'],
    deskPosition: { x: 200, y: 240 },
    level: 8,
    xp: 6400,
    xpToNextLevel: 7000,
    tasksCompleted: 512,
    status: 'working',
    catchphrases: ['Global state is a smell', 'Type this properly', 'useCallback this', 'Zustand over Redux'],
    ambientMessages: ['refactoring state...', 'typing interfaces...', 'optimizing hooks...'],
  },
  {
    id: 'tyler-brooks',
    name: 'Tyler Brooks',
    role: 'Senior Frontend Engineer',
    department: 'engineering-frontend',
    floor: 2,
    color: '#7C3AED',
    skinTone: '#FDBCB4',
    hairStyle: 'messy',
    hairColor: '#92400E',
    personality: 'Animation and UX motion specialist, makes everything feel smooth, slightly procrastinates on non-visual work',
    specialization: ['animations', 'CSS', 'UI polish', 'motion design'],
    deskPosition: { x: 300, y: 240 },
    level: 7,
    xp: 5200,
    xpToNextLevel: 6000,
    tasksCompleted: 398,
    status: 'working',
    catchphrases: ['This transition needs easing', 'Framer Motion this', 'The animation is janky', 'Polish matters'],
    ambientMessages: ['adding animations...', 'polishing transitions...', 'tweaking CSS...'],
  },

  // FLOOR 2 — SRE/DevOps
  {
    id: 'jordan-lee',
    name: 'Jordan Lee',
    role: 'SRE Lead',
    department: 'sre-devops',
    floor: 2,
    color: '#F59E0B',
    skinTone: '#C68642',
    hairStyle: 'messy',
    hairColor: '#4A3728',
    accessory: 'phone',
    personality: 'Has been paged at 3am too many times, obsessed with runbooks, loves chaos engineering, tired eyes always',
    specialization: ['incident response', 'monitoring', 'reliability', 'on-call'],
    deskPosition: { x: 500, y: 240 },
    level: 9,
    xp: 8100,
    xpToNextLevel: 9000,
    tasksCompleted: 756,
    status: 'working',
    catchphrases: ['Add it to the runbook', 'How do we detect this?', "What's our MTTR?", 'PagerDuty is going off'],
    ambientMessages: ['updating runbooks...', 'checking dashboards...', 'reviewing alerts...'],
  },
  {
    id: 'sam-rivera',
    name: 'Sam Rivera',
    role: 'SRE Engineer',
    department: 'sre-devops',
    floor: 2,
    color: '#D97706',
    skinTone: '#C68642',
    hairStyle: 'short',
    hairColor: '#1A1A1A',
    personality: 'Infrastructure as code evangelist, automates everything, hates manual processes, Terraform wizard',
    specialization: ['infrastructure', 'Terraform', 'Kubernetes', 'CI/CD'],
    deskPosition: { x: 600, y: 240 },
    level: 7,
    xp: 5600,
    xpToNextLevel: 6000,
    tasksCompleted: 421,
    status: 'working',
    catchphrases: ['Is this in Terraform?', 'Automate this', 'K8s can handle it', 'Pipeline needs a gate'],
    ambientMessages: ['writing Terraform...', 'updating K8s config...', 'fixing CI pipeline...'],
  },

  // FLOOR 3 — Product
  {
    id: 'priya-sharma',
    name: 'Priya Sharma',
    role: 'Senior Product Manager',
    department: 'product',
    floor: 3,
    color: '#22C55E',
    skinTone: '#C68642',
    hairStyle: 'long',
    hairColor: '#1A1A1A',
    accessory: 'clipboard',
    personality: 'User-obsessed, translates tech to business, pushes back on over-engineering, always asks about timelines',
    specialization: ['product strategy', 'user research', 'prioritization', 'roadmapping'],
    deskPosition: { x: 200, y: 140 },
    level: 8,
    xp: 6900,
    xpToNextLevel: 8000,
    tasksCompleted: 534,
    status: 'working',
    catchphrases: ["What's the user impact?", 'Can we ship this faster?', 'Business case?', "Users don't care about that"],
    ambientMessages: ['writing PRD...', 'analyzing user feedback...', 'updating roadmap...'],
  },
  {
    id: 'leo-zhang',
    name: 'Leo Zhang',
    role: 'Product Manager',
    department: 'product',
    floor: 3,
    color: '#16A34A',
    skinTone: '#F3C5A0',
    hairStyle: 'short',
    hairColor: '#1A1A1A',
    personality: 'Data-driven, loves A/B tests, always checking metrics, brings receipts to every argument',
    specialization: ['data analysis', 'A/B testing', 'metrics', 'growth'],
    deskPosition: { x: 300, y: 140 },
    level: 6,
    xp: 4200,
    xpToNextLevel: 5000,
    tasksCompleted: 312,
    status: 'working',
    catchphrases: ['The data says...', "Let's A/B test it", 'Conversion rate dropped', 'Statistically significant?'],
    ambientMessages: ['analyzing metrics...', 'setting up experiment...', 'reviewing dashboard...'],
  },

  // FLOOR 3 — Design
  {
    id: 'rio-tanaka',
    name: 'Rio Tanaka',
    role: 'Senior Designer',
    department: 'design',
    floor: 3,
    color: '#F43F5E',
    skinTone: '#F3C5A0',
    hairStyle: 'bun',
    hairColor: '#1A1A1A',
    accessory: 'tablet',
    personality: 'Systems thinker, fights for design consistency, has strong opinions about error states, hates generic 404 pages',
    specialization: ['design systems', 'UX', 'error states', 'component design'],
    deskPosition: { x: 450, y: 140 },
    level: 8,
    xp: 6600,
    xpToNextLevel: 7000,
    tasksCompleted: 487,
    status: 'working',
    catchphrases: ["Users won't understand this", 'The error message is terrible', 'Design system violation', 'This needs a loading state'],
    ambientMessages: ['designing components...', 'updating design system...', 'creating error states...'],
  },
  {
    id: 'nadia-hassan',
    name: 'Nadia Hassan',
    role: 'UI Designer',
    department: 'design',
    floor: 3,
    color: '#E11D48',
    skinTone: '#C68642',
    hairStyle: 'ponytail',
    hairColor: '#1A1A1A',
    accessory: 'stylus',
    personality: 'Visual perfectionist, pixel-perfect obsessed, dark mode advocate, judges misaligned elements from across the room',
    specialization: ['visual design', 'dark mode', 'typography', 'icon design'],
    deskPosition: { x: 550, y: 140 },
    level: 6,
    xp: 4800,
    xpToNextLevel: 5000,
    tasksCompleted: 356,
    status: 'working',
    catchphrases: ["That's 1px off", 'Dark mode needs fixing', 'Wrong font weight', "Colors don't have enough contrast"],
    ambientMessages: ['pixel-perfecting UI...', 'designing icons...', 'tweaking typography...'],
  },
  {
    id: 'maya-patel',
    name: 'Maya Patel',
    role: 'UX Researcher',
    department: 'design',
    floor: 3,
    color: '#FB7185',
    skinTone: '#C68642',
    hairStyle: 'long',
    hairColor: '#4A3728',
    accessory: 'clipboard',
    personality: 'Empathy-driven, always talking to users, translates user pain into product insights, challenges assumptions with data',
    specialization: ['user research', 'usability testing', 'user interviews', 'journey mapping'],
    deskPosition: { x: 350, y: 240 },
    level: 7,
    xp: 5300,
    xpToNextLevel: 6000,
    tasksCompleted: 389,
    status: 'working',
    catchphrases: ['Users are confused here', 'I talked to 5 users and...', 'This assumes too much', 'Journey map shows pain here'],
    ambientMessages: ['conducting user research...', 'analyzing interviews...', 'mapping user journey...'],
  },

  // FLOOR 4 — Security
  {
    id: 'sarah-chen',
    name: 'Sarah Chen',
    role: 'Security Lead',
    department: 'security',
    floor: 4,
    color: '#EF4444',
    skinTone: '#F3C5A0',
    hairStyle: 'ponytail',
    hairColor: '#1A1A1A',
    personality: 'Paranoid by design, sees vulnerabilities everywhere, OWASP memorized, never sleeps well before a release',
    specialization: ['threat modeling', 'penetration testing', 'OWASP', 'security architecture'],
    deskPosition: { x: 150, y: 160 },
    level: 9,
    xp: 8400,
    xpToNextLevel: 9000,
    tasksCompleted: 712,
    status: 'working',
    catchphrases: ['Is this authenticated?', 'SQL injection risk here', 'OWASP Top 10 violation', 'This needs a security review'],
    ambientMessages: ['threat modeling...', 'reviewing auth flow...', 'scanning for vulns...'],
  },
  {
    id: 'omar-khalil',
    name: 'Omar Khalil',
    role: 'Senior Security Engineer',
    department: 'security',
    floor: 4,
    color: '#DC2626',
    skinTone: '#C68642',
    hairStyle: 'short',
    hairColor: '#1A1A1A',
    personality: 'Cryptography expert, reviews every encryption implementation, has nightmares about weak cipher suites',
    specialization: ['cryptography', 'encryption', 'PKI', 'secrets management'],
    deskPosition: { x: 300, y: 160 },
    level: 8,
    xp: 7200,
    xpToNextLevel: 8000,
    tasksCompleted: 589,
    status: 'working',
    catchphrases: ['AES-256 or nothing', 'Rotate those keys', "Don't roll your own crypto", 'Certificate expires when?'],
    ambientMessages: ['reviewing encryption...', 'auditing certificates...', 'checking key rotation...'],
  },
  {
    id: 'zara-ahmed',
    name: 'Zara Ahmed',
    role: 'Security Engineer',
    department: 'security',
    floor: 4,
    color: '#B91C1C',
    skinTone: '#C68642',
    hairStyle: 'long',
    hairColor: '#1A1A1A',
    personality: 'Penetration testing specialist, thinks like an attacker, always trying to break things before bad actors do',
    specialization: ['penetration testing', 'vulnerability assessment', 'red team', 'SAST/DAST'],
    deskPosition: { x: 450, y: 160 },
    level: 7,
    xp: 5800,
    xpToNextLevel: 6000,
    tasksCompleted: 445,
    status: 'working',
    catchphrases: ['Let me try to break this', 'Found an injection point', 'CORS misconfiguration', 'Rate limiting bypassable'],
    ambientMessages: ['running security scan...', 'testing attack vectors...', 'writing pentest report...'],
  },

  // FLOOR 4 — QA
  {
    id: 'chris-park',
    name: 'Chris Park',
    role: 'QA Lead',
    department: 'qa',
    floor: 4,
    color: '#EA580C',
    skinTone: '#F3C5A0',
    hairStyle: 'short',
    hairColor: '#4A3728',
    personality: 'Breaks things professionally, edge case obsessed, writes test cases for scenarios no one thought of, thorough to a fault',
    specialization: ['test strategy', 'edge cases', 'automation', 'regression testing'],
    deskPosition: { x: 200, y: 260 },
    level: 8,
    xp: 6700,
    xpToNextLevel: 7000,
    tasksCompleted: 623,
    status: 'working',
    catchphrases: ['What about the edge case?', 'Test coverage is too low', 'This will break in production', 'Regression test this'],
    ambientMessages: ['writing test cases...', 'running regression suite...', 'documenting edge cases...'],
  },
  {
    id: 'ava-thompson',
    name: 'Ava Thompson',
    role: 'QA Engineer',
    department: 'qa',
    floor: 4,
    color: '#C2410C',
    skinTone: '#FDBCB4',
    hairStyle: 'curly',
    hairColor: '#92400E',
    personality: 'Automation enthusiast, writes Playwright tests for everything, hates manual testing, CI/CD integration obsessed',
    specialization: ['test automation', 'Playwright', 'E2E testing', 'CI integration'],
    deskPosition: { x: 400, y: 260 },
    level: 6,
    xp: 4100,
    xpToNextLevel: 5000,
    tasksCompleted: 334,
    status: 'working',
    catchphrases: ['Automate this test', 'E2E test is flaky', 'Add this to CI', 'Playwright handles this'],
    ambientMessages: ['writing Playwright tests...', 'fixing flaky tests...', 'updating CI config...'],
  },
];

/** Lookup by id. */
const BY_ID = new Map(EMPLOYEES.map((e) => [e.id, e]));
export function employeeById(id: string): Employee | undefined {
  return BY_ID.get(id);
}

/** Employees assigned to a given floor (CTO also keeps an office on floor 5). */
export function employeesOnFloor(floor: Floor): Employee[] {
  if (floor === 5) return EMPLOYEES.filter((e) => e.id === 'alex-chen');
  return EMPLOYEES.filter((e) => e.floor === floor);
}
