/**
 * Docs content — the entire offline knowledge base.
 *
 * Every entry is a fully self-contained {@link DocArticle}. This file is pure
 * data: components in this folder render it, but nothing here imports React or
 * touches the network. New articles are added by appending to DOC_ARTICLES;
 * no renderer change is ever required.
 *
 * Diagrams are authored with the helpers in `docsSvg.ts` to keep the visual
 * language consistent across the whole resource.
 */

import type { DocArticle } from './docsTypes.js';
import { SVG } from './docsSvg.js';

const { box, arrow, label, lane, defs } = SVG;

/** Wrap authored fragments into a complete viewBox'd svg body string. */
function svg(w: number, h: number, body: string): string {
  return `${defs()}<rect x="0" y="0" width="${w}" height="${h}" rx="0" fill="transparent"/>${body}`;
}

export const DOC_ARTICLES: DocArticle[] = [
  // ───────────────────────────── System Design Fundamentals ─────────────────────────────
  {
    id: 'what-is-system-design',
    title: 'What is System Design',
    category: 'System Design Fundamentals',
    difficulty: 'Beginner',
    readTime: 11,
    summary:
      'System design is the discipline of turning fuzzy product requirements into a concrete, defensible architecture under real constraints of scale, cost, and reliability.',
    whyItMatters:
      'Almost every senior engineering interview and every consequential technical decision at work is a system design problem in disguise. Getting the framing right is the difference between an architecture that survives growth and one that collapses under its first traffic spike.',
    content: [
      {
        heading: 'Definition and scope',
        body: 'System design is the process of defining the architecture, components, interfaces, and data flows of a system to satisfy a set of functional and non-functional requirements. Functional requirements describe what the system does, such as "users can upload a photo," while non-functional requirements describe how well it does it, such as "uploads complete in under two seconds at the 99th percentile." The scope of system design spans from the macro level, where you decide on services, datastores, and communication patterns, down to the meso level, where you choose specific algorithms and schemas. Crucially, system design is about tradeoffs rather than correctness: there is rarely a single right answer, only answers that are better or worse for a given context. A good design makes its assumptions explicit so that future engineers understand why each decision was made. This is what separates system design from simply drawing boxes and arrows on a whiteboard.',
      },
      {
        heading: 'Why system design matters at scale',
        body: 'At small scale almost any architecture works, which is precisely why scale is the great revealer of bad design. A naive design that serves a thousand users may fall over completely at a million because bottlenecks that were invisible suddenly dominate, such as a single database connection pool or an unindexed query. System design matters because the cost of a wrong foundational decision compounds: changing a data model or a service boundary after launch can require months of migration work and carries real risk of data loss. Designing for scale is not about over-engineering for traffic you do not have, but about choosing decisions that are cheap to reverse and being deliberate about the ones that are not. Reliability, latency, and cost are all emergent properties of design choices made early. The engineers who are trusted with the largest systems are the ones who can reason about how a design behaves when one part of it fails or when load increases tenfold.',
      },
      {
        heading: 'How to approach a system design problem',
        body: 'Start by clarifying requirements rather than jumping to a solution, because the most common failure is solving the wrong problem confidently. Establish the functional requirements, then quantify the non-functional ones into concrete numbers: expected read and write throughput, data volume, latency targets, and availability goals. From those numbers you can do back-of-the-envelope capacity estimation, which tells you whether you need one machine or one thousand and grounds every later decision in reality. Only then do you sketch a high-level design of the major components and their interactions, deliberately keeping it simple before adding complexity. After the high-level design holds together, you drill into the components most likely to be bottlenecks, such as the datastore or the hottest API path. Throughout, you narrate the tradeoffs of each choice, which signals the senior judgment that distinguishes a strong design from a memorized template.',
      },
      {
        heading: 'The difference between design and implementation',
        body: 'Design answers what to build and why, while implementation answers how to build it in a specific language and framework. A design decision such as "use a write-through cache in front of the product catalog" is independent of whether the cache is Redis or Memcached and whether the service is written in Go or TypeScript. Confusing the two layers is a frequent mistake: candidates dive into class hierarchies and library choices before the data flow is even agreed upon. The value of keeping design separate is that it lets a team reason about correctness and tradeoffs at a level where mistakes are cheap to fix, namely on a diagram rather than in production code. Good designs are also implementation-agnostic enough to survive a technology change, so that swapping a queue vendor does not invalidate the architecture. When you can articulate a design without naming a single library, you have genuinely understood the problem rather than a particular tool.',
      },
    ],
    diagrams: [
      {
        title: 'The system design thought process',
        description: 'Every strong design moves left to right: requirements constrain the space, the high-level design takes shape, then detail and tradeoffs are layered in.',
        type: 'flow',
        svgContent: svg(720, 140, [
          box(10, 45, 120, 50, 'Requirements', { sub: 'functional + non-func' }),
          arrow(130, 70, 165, 70),
          box(165, 45, 110, 50, 'Constraints', { sub: 'scale · cost · SLA' }),
          arrow(275, 70, 310, 70),
          box(310, 45, 120, 50, 'High-level design', { fill: 'cardAlt', stroke: 'accent' }),
          arrow(430, 70, 465, 70),
          box(465, 45, 120, 50, 'Detailed design', { sub: 'schemas · algorithms' }),
          arrow(585, 70, 620, 70),
          box(620, 45, 90, 50, 'Tradeoffs', { stroke: 'amber' }),
        ].join('')),
      },
      {
        title: 'One feature touches the whole system: photo upload',
        description: 'A single "upload a photo" action fans out across CDN, gateway, auth, object storage, metadata database, and an async processing pipeline.',
        type: 'architecture',
        svgContent: svg(720, 320, [
          box(20, 20, 110, 46, 'Client', { sub: 'mobile / web' }),
          arrow(130, 43, 175, 43, { label: 'upload' }),
          box(175, 20, 110, 46, 'CDN / Edge', { fill: 'cardAlt' }),
          arrow(285, 43, 330, 43),
          box(330, 20, 120, 46, 'API Gateway', { stroke: 'accent' }),
          arrow(390, 66, 390, 110, { label: 'verify' }),
          box(330, 110, 120, 46, 'Auth Service'),
          arrow(450, 43, 600, 43),
          box(600, 20, 110, 46, 'Object Storage', { sub: 'S3 / blob', fill: 'cardAlt' }),
          arrow(390, 156, 390, 200, { label: 'metadata' }),
          box(330, 200, 120, 46, 'Database', { sub: 'photos table' }),
          arrow(450, 223, 540, 223, { label: 'enqueue' }),
          box(540, 200, 100, 46, 'Queue', { stroke: 'amber' }),
          arrow(590, 246, 590, 280),
          box(520, 280, 140, 40, 'Worker', { sub: 'thumbnails · EXIF' }),
        ].join('')),
      },
    ],
    realWorldExamples: [
      {
        company: 'Google (Gmail)',
        problem: 'Launch a webmail product that gives every user a gigabyte of storage at a time when competitors offered a few megabytes, while keeping search instant across years of mail.',
        solution: 'Designed around a distributed storage layer and inverted indexes for search rather than a per-user mailbox file, treating mail as a queryable dataset and investing heavily in replication and sharding from day one.',
        outcome: 'Gmail scaled to billions of users with sub-second search, and its storage-and-index architecture became a template for large consumer products.',
      },
      {
        company: 'A two-person startup',
        problem: 'Ship the same "email with search" idea in weeks with no infrastructure team and almost no budget.',
        solution: 'Use a single managed Postgres instance with full-text search, a managed object store for attachments, and a hosted platform, deferring sharding and custom indexing until real load demands it.',
        outcome: 'The startup ships fast and validates the product; the design is intentionally cheap to evolve, trading future scale work for present speed.',
      },
    ],
    codeExamples: [
      {
        language: 'typescript',
        label: 'System design checklist',
        description: 'A reusable checklist class that forces you to answer the non-functional questions before drawing any boxes.',
        code: `interface DesignRequirement {
  readonly name: string;
  readonly answered: boolean;
  readonly value?: string;
}

class SystemDesignChecklist {
  private readonly items: ReadonlyArray<DesignRequirement>;

  constructor(items: ReadonlyArray<DesignRequirement> = DEFAULT_ITEMS) {
    this.items = items;
  }

  answer(name: string, value: string): SystemDesignChecklist {
    return new SystemDesignChecklist(
      this.items.map((i) =>
        i.name === name ? { ...i, answered: true, value } : i,
      ),
    );
  }

  unanswered(): ReadonlyArray<string> {
    return this.items.filter((i) => !i.answered).map((i) => i.name);
  }

  isReadyToDesign(): boolean {
    return this.unanswered().length === 0;
  }
}

const DEFAULT_ITEMS: ReadonlyArray<DesignRequirement> = [
  { name: 'read throughput (rps)', answered: false },
  { name: 'write throughput (rps)', answered: false },
  { name: 'data volume (5yr)', answered: false },
  { name: 'p99 latency target', answered: false },
  { name: 'availability target', answered: false },
  { name: 'consistency requirement', answered: false },
];

const ready = new SystemDesignChecklist()
  .answer('read throughput (rps)', '50000')
  .answer('write throughput (rps)', '2000');

console.log(ready.unanswered()); // still missing 4 → not ready`,
      },
      {
        language: 'python',
        label: 'Capacity estimation validator',
        description: 'Back-of-the-envelope math that flags when a single-node design cannot meet the stated throughput.',
        code: `from dataclasses import dataclass


@dataclass(frozen=True)
class Capacity:
    read_rps: int
    write_rps: int
    avg_payload_kb: float
    single_node_rps: int = 8000  # conservative per-node ceiling

    def total_rps(self) -> int:
        return self.read_rps + self.write_rps

    def nodes_required(self) -> int:
        # ceil division, never fewer than one node
        return max(1, -(-self.total_rps() // self.single_node_rps))

    def egress_mb_per_s(self) -> float:
        return (self.read_rps * self.avg_payload_kb) / 1024

    def validate(self) -> list[str]:
        warnings: list[str] = []
        if self.nodes_required() > 1:
            warnings.append(
                f"single node insufficient: need ~{self.nodes_required()} nodes"
            )
        if self.egress_mb_per_s() > 100:
            warnings.append(
                f"egress {self.egress_mb_per_s():.0f} MB/s — add a CDN"
            )
        return warnings


cap = Capacity(read_rps=50_000, write_rps=2_000, avg_payload_kb=12.0)
for w in cap.validate():
    print("WARN:", w)`,
      },
    ],
    commonMistakes: [
      'Jumping straight to a solution and naming databases before clarifying a single requirement.',
      'Treating system design as drawing boxes without ever quantifying load, latency, or data volume.',
      'Optimizing for hypothetical future scale instead of the actual, stated requirements.',
      'Presenting one design as objectively correct instead of articulating tradeoffs against alternatives.',
    ],
    whenNotToUse:
      'Do not run a heavyweight system design exercise for a throwaway prototype, an internal tool with ten users, or a feature that fits comfortably in an existing service. Ceremony has a cost; reserve deep design for decisions that are expensive to reverse or that operate near real scale.',
    relatedTopics: ['scalability-horizontal-vertical', 'reliability-availability', 'cap-theorem', 'caching-strategies'],
    industryStandard: 'Google SRE Book · "Designing Data-Intensive Applications" (Kleppmann)',
    interviewTips:
      'Structure a 45-minute answer in fixed phases: spend the first 5 minutes clarifying requirements and agreeing on numbers, 5 minutes on capacity estimation, 10 minutes on a high-level design, 15 minutes drilling into the one or two hardest components, and the last 10 minutes on bottlenecks, failure modes, and tradeoffs. Narrate your reasoning out loud and explicitly state assumptions; interviewers score judgment and communication far more than whether you recall a specific technology.',
  },

  {
    id: 'scalability-horizontal-vertical',
    title: 'Scalability — Horizontal vs Vertical',
    category: 'System Design Fundamentals',
    difficulty: 'Beginner',
    readTime: 12,
    summary:
      'Scaling vertically means a bigger machine; scaling horizontally means more machines. The choice determines your ceiling, your failure modes, and how much of your architecture must become stateless.',
    whyItMatters:
      'Most production incidents at growth-stage companies trace back to a component that could only scale vertically and finally hit its ceiling. Knowing which axis to scale, and when, is foundational to every other design decision.',
    content: [
      {
        heading: 'What scalability means',
        body: 'Scalability is the ability of a system to handle increased load by adding resources, ideally with a roughly proportional increase in capacity and a roughly constant cost per unit of work. A system scales well when doubling the resources roughly doubles the throughput without a collapse in latency or a surge in error rate. Scalability is distinct from raw performance: a fast single-threaded program may be high-performance yet scale terribly because it cannot use additional cores or machines. It is also distinct from elasticity, which is the ability to add and remove capacity quickly in response to changing demand. The practical question is always "what breaks first as load grows," because the least scalable component sets the ceiling for the entire system. Identifying that bottleneck early, often the database or a shared lock, is more valuable than optimizing components that were never going to be the limit.',
      },
      {
        heading: 'Vertical scaling explained with limits',
        body: 'Vertical scaling, or scaling up, means giving a single machine more CPU, memory, faster disks, or network bandwidth. Its great appeal is simplicity: the application code rarely changes, there is no distributed coordination, and a single powerful database can serve enormous workloads with strong consistency for free. The limits, however, are hard and unavoidable. There is a maximum machine size you can buy, the cost curve becomes brutally nonlinear at the top end, and a single machine is a single point of failure no matter how powerful it is. Upgrading typically requires downtime or a failover, and you cannot scale fractionally, so you often pay for far more capacity than you use. Vertical scaling is the right first move because it buys time cheaply, but it is a ceiling, not a strategy.',
      },
      {
        heading: 'Horizontal scaling explained with tradeoffs',
        body: 'Horizontal scaling, or scaling out, means adding more machines and distributing load across them, usually behind a load balancer. Its ceiling is effectively unbounded, and because there are many machines, the failure of any one need not take down the system, which is the foundation of high availability. The tradeoff is complexity: you must now handle distributed state, coordination, partial failure, and data consistency across nodes. Operations like joining data, maintaining sessions, or guaranteeing ordering become genuinely hard once data and requests are spread across machines. Horizontal scaling also shifts cost from hardware to engineering, since the architecture, deployment, and observability all become more involved. The payoff is a system whose capacity and resilience grow with the fleet rather than being capped by the largest machine money can buy.',
      },
      {
        heading: 'Stateless vs stateful services and why it matters',
        body: 'A stateless service keeps no client-specific data between requests, so any instance can handle any request, which is exactly what makes horizontal scaling cheap and load balancing trivial. A stateful service, by contrast, holds data such as in-memory sessions or local files that ties a client to a specific instance, and that affinity fights against elastic scaling. The standard discipline is to push state out of the application tier into shared backing stores: sessions into Redis, files into object storage, and durable data into a database. Once the service tier is stateless, you can add and remove instances freely, deploy with zero downtime, and survive the loss of any single node. State does not disappear; it is concentrated in systems that are explicitly designed to be distributed and replicated. This separation of stateless compute from stateful storage is one of the most important patterns in all of system design.',
      },
      {
        heading: 'Auto-scaling strategies',
        body: 'Auto-scaling adjusts the number of running instances automatically based on signals such as CPU utilization, request rate, or queue depth, so capacity tracks demand instead of being provisioned for the worst case at all times. Reactive auto-scaling responds to current metrics and is simple but lags behind sudden spikes, which can cause brief overload while new instances boot. Predictive or scheduled auto-scaling anticipates known patterns, such as a daily traffic peak or a product launch, and warms capacity ahead of demand. The hardest parts are choosing the right metric, since CPU is often a poor proxy for user-facing load, and tuning cooldowns so the system does not oscillate by adding and removing instances rapidly. Queue depth and request latency are frequently better scaling signals than raw CPU. Done well, auto-scaling cuts cost during quiet periods while protecting latency during bursts, but it only works if the service is genuinely stateless and instances start quickly.',
      },
    ],
    diagrams: [
      {
        title: 'One big server vs a fleet behind a load balancer',
        description: 'Vertical scaling grows a single node toward a hard ceiling; horizontal scaling spreads load across interchangeable nodes.',
        type: 'comparison',
        svgContent: svg(720, 260, [
          label(20, 24, 'Vertical (scale up)', { fill: 'amber', weight: 700, size: 13 }),
          box(60, 50, 180, 150, 'One large server', { sub: 'more CPU / RAM', fill: 'cardAlt', stroke: 'amber' }),
          label(70, 225, 'ceiling = biggest machine', { fill: 'muted', size: 10.5 }),
          lane(330, 30, 330, ''),
          label(400, 24, 'Horizontal (scale out)', { fill: 'green', weight: 700, size: 13 }),
          box(440, 50, 120, 40, 'Load Balancer', { stroke: 'accent' }),
          arrow(470, 90, 440, 130),
          arrow(500, 90, 500, 130),
          arrow(530, 90, 560, 130),
          box(400, 130, 80, 38, 'node', { sub: 'stateless' }),
          box(490, 130, 80, 38, 'node', { sub: 'stateless' }),
          box(580, 130, 80, 38, 'node', { sub: 'stateless' }),
          label(400, 200, 'ceiling = effectively none', { fill: 'muted', size: 10.5 }),
        ].join('')),
      },
      {
        title: 'A horizontally scaled service with shared state',
        description: 'Stateless app nodes scale freely because session and durable state live in shared, independently-scaled backing stores.',
        type: 'architecture',
        svgContent: svg(720, 300, [
          box(20, 130, 100, 44, 'Clients'),
          arrow(120, 152, 165, 152),
          box(165, 130, 120, 44, 'Load Balancer', { stroke: 'accent' }),
          arrow(285, 140, 340, 70),
          arrow(285, 152, 340, 152),
          arrow(285, 164, 340, 234),
          box(340, 50, 110, 40, 'App node', { sub: 'stateless' }),
          box(340, 132, 110, 40, 'App node', { sub: 'stateless' }),
          box(340, 214, 110, 40, 'App node', { sub: 'stateless' }),
          arrow(450, 70, 560, 95),
          arrow(450, 152, 560, 110),
          arrow(450, 234, 560, 125),
          box(560, 80, 130, 50, 'Shared Cache', { sub: 'Redis · sessions', fill: 'cardAlt' }),
          arrow(450, 90, 560, 200),
          arrow(450, 172, 560, 210),
          arrow(450, 244, 560, 220),
          box(560, 195, 130, 50, 'Database', { sub: 'durable state' }),
        ].join('')),
      },
    ],
    realWorldExamples: [
      {
        company: 'Twitter',
        problem: 'A Ruby on Rails monolith with a single primary database could not keep up with timeline reads, producing the infamous "fail whale" during traffic spikes.',
        solution: 'Decomposed into services, moved hot paths off the monolith, and adopted horizontally scalable storage and caching with fan-out-on-write for timelines so reads hit precomputed data rather than a single overloaded database.',
        outcome: 'Twitter sustained massive event-driven traffic spikes, and the fail whale effectively disappeared as capacity could grow horizontally.',
      },
      {
        company: 'Netflix',
        problem: 'Serving roughly 200 million members streaming concurrently around the globe, far beyond what any single datacenter or vertically scaled tier could handle.',
        solution: 'Built a stateless microservice architecture on horizontally scaled cloud instances with aggressive auto-scaling, and pushed video bytes to edge appliances (Open Connect) so the origin only handles control-plane traffic.',
        outcome: 'Netflix scales elastically to global peak demand each evening and tolerates the loss of entire instances and zones without viewer-visible failure.',
      },
    ],
    codeExamples: [
      {
        language: 'typescript',
        label: 'Load balancer config for horizontal scaling',
        description: 'A minimal round-robin balancer with health checks that routes only to healthy stateless nodes.',
        code: `interface Node {
  readonly url: string;
  healthy: boolean;
}

class RoundRobinBalancer {
  private index = 0;
  constructor(private readonly nodes: Node[]) {}

  next(): Node | null {
    const healthy = this.nodes.filter((n) => n.healthy);
    if (healthy.length === 0) return null;
    const node = healthy[this.index % healthy.length];
    this.index++;
    return node;
  }

  async healthCheck(): Promise<void> {
    await Promise.all(
      this.nodes.map(async (n) => {
        try {
          const res = await fetch(\`\${n.url}/healthz\`, {
            signal: AbortSignal.timeout(1000),
          });
          n.healthy = res.ok;
        } catch {
          n.healthy = false; // failed nodes drop out of rotation
        }
      }),
    );
  }
}

const lb = new RoundRobinBalancer([
  { url: 'http://10.0.0.1:8080', healthy: true },
  { url: 'http://10.0.0.2:8080', healthy: true },
  { url: 'http://10.0.0.3:8080', healthy: true },
]);
setInterval(() => lb.healthCheck(), 5000);`,
      },
      {
        language: 'go',
        label: 'Stateless HTTP service',
        description: 'A Go service that holds zero per-client state in memory, so any instance can serve any request and scale horizontally.',
        code: `package main

import (
	"encoding/json"
	"net/http"
	"os"
)

// No package-level mutable state tied to a user — only config and clients.
type server struct {
	store SessionStore // backed by Redis, shared across all instances
}

func (s *server) handleProfile(w http.ResponseWriter, r *http.Request) {
	token := r.Header.Get("Authorization")
	// State lives in the shared store, never in this process.
	session, err := s.store.Get(r.Context(), token)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"user": session.UserID})
}

func (s *server) handleHealth(w http.ResponseWriter, _ *http.Request) {
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte("ok"))
}

func main() {
	s := &server{store: NewRedisStore(os.Getenv("REDIS_URL"))}
	http.HandleFunc("/profile", s.handleProfile)
	http.HandleFunc("/healthz", s.handleHealth)
	// Any number of these can run behind a load balancer.
	_ = http.ListenAndServe(":8080", nil)
}`,
      },
    ],
    commonMistakes: [
      'Reaching for horizontal scaling and distributed systems complexity before exhausting a simple, cheap vertical bump.',
      'Keeping session state in process memory, which silently breaks the moment a second instance is added behind a load balancer.',
      'Auto-scaling on CPU when the real pressure is queue depth or downstream latency, leading to scaling at the wrong time.',
      'Forgetting that the database is usually the component that does not scale horizontally for free, then being surprised when it is the bottleneck.',
    ],
    whenNotToUse:
      'Do not architect for horizontal scale when a single well-sized instance comfortably meets current and near-term load; the distributed-systems complexity is pure cost until you actually need the ceiling. Equally, do not lean on vertical scaling for a system that must never have downtime, because a single node is a single point of failure regardless of size.',
    relatedTopics: ['load-balancing', 'caching-strategies', 'reliability-availability', 'monolith-vs-microservices'],
    industryStandard: 'AWS Well-Architected Framework — Performance Efficiency Pillar',
    interviewTips:
      'When asked how you would scale a system, always propose scaling vertically first as the cheap, low-risk move that buys time, then explain the specific signal that would force you horizontal. Make the statelessness argument explicitly: name where session and durable state will live, because interviewers are listening for whether you understand that horizontal scaling is impossible until state is externalized.',
  },

  {
    id: 'cap-theorem',
    title: 'CAP Theorem',
    category: 'System Design Fundamentals',
    difficulty: 'Intermediate',
    readTime: 10,
    summary:
      'During a network partition a distributed system must choose between consistency and availability; it cannot have both. CAP frames that unavoidable tradeoff, and PACELC extends it to the no-partition case.',
    whyItMatters:
      'Every distributed datastore you pick has already made a CAP choice on your behalf, and choosing the wrong one for your use case leads to either user-visible errors or silent data anomalies that are extremely hard to debug.',
    content: [
      {
        heading: 'The three properties explained simply',
        body: 'Consistency in the CAP sense means every read receives the most recent write or an error, so all clients see a single, agreed-upon value at any moment. Availability means every request to a non-failing node receives a non-error response, even if that response might not reflect the most recent write. Partition tolerance means the system continues to operate despite arbitrary loss or delay of messages between nodes, which in practice means surviving network failures between datacenters or racks. These three properties are precise technical definitions, and much confusion comes from using the everyday meanings of the words instead. Note that CAP consistency is linearizability, which is stronger than the C in ACID transactions. Keeping the formal definitions straight is the first step to reasoning about the theorem correctly.',
      },
      {
        heading: 'Why you can only have two',
        body: 'The theorem states that during a network partition, a distributed system cannot simultaneously guarantee consistency and availability, forcing a choice between them. The reasoning is concrete: when the network splits two nodes apart, a write arrives at one side, and a client now reads from the other side. The system must either return the stale value, sacrificing consistency to stay available, or refuse to answer until the partition heals, sacrificing availability to stay consistent. There is no third option, because the two nodes physically cannot communicate to agree on the truth. The common phrasing "pick two of three" is slightly misleading, because partition tolerance is not optional for any real distributed system, since networks always fail eventually. The genuine choice is therefore between CP and AP, made only at the moment a partition actually occurs.',
      },
      {
        heading: 'CP vs AP systems and when to choose each',
        body: 'A CP system chooses consistency over availability during a partition, meaning it will reject or block requests rather than risk returning stale or conflicting data. This is the correct choice when correctness is non-negotiable, such as a bank ledger, an inventory count that must not oversell, or any system where two clients seeing different truths causes real damage. An AP system chooses availability, continuing to serve reads and writes on both sides of a partition and reconciling differences afterward, which is correct when uptime matters more than momentary staleness, such as a social feed, a shopping cart, or a metrics pipeline. The decision is fundamentally a business question, not a technical preference: ask what is worse for this specific data, a brief error or a brief inconsistency. Most real systems are not uniformly CP or AP but make the choice per data type. A user-facing product often wants its catalog AP and its payments CP within the same architecture.',
      },
      {
        heading: 'How modern databases navigate CAP and the PACELC extension',
        body: 'Real databases rarely sit at a pure corner of CAP; they expose tunable knobs so you choose per operation. Cassandra and DynamoDB let you set quorum levels so a given read or write can lean consistent or available, while systems like Spanner use synchronized clocks and consensus to offer strong consistency with very high availability in practice. The PACELC theorem extends CAP to capture what most systems are actually trading off most of the time: if there is a Partition, choose between Availability and Consistency, Else, when running normally, choose between Latency and Consistency. PACELC matters because partitions are rare but the latency-versus-consistency tradeoff is paid on every single request. A database that uses synchronous cross-region replication for strong consistency pays latency on every write even when the network is perfectly healthy. Understanding PACELC explains why two "consistent" databases can feel completely different in production.',
      },
    ],
    diagrams: [
      {
        title: 'CAP: the three properties and where systems land',
        description: 'Partition tolerance is mandatory for distributed systems, so the real axis is CP versus AP.',
        type: 'comparison',
        svgContent: svg(720, 240, [
          box(40, 90, 150, 60, 'Consistency', { stroke: 'accent', sub: 'one true value' }),
          box(280, 30, 150, 60, 'Availability', { stroke: 'green', sub: 'always answers' }),
          box(280, 150, 150, 60, 'Partition tol.', { stroke: 'amber', sub: 'survives splits' }),
          arrow(190, 110, 280, 70, { stroke: 'muted' }),
          arrow(190, 130, 280, 175, { stroke: 'muted' }),
          arrow(430, 70, 520, 110, { stroke: 'muted' }),
          arrow(430, 175, 520, 130, { stroke: 'muted' }),
          box(520, 95, 170, 50, 'Pick a corner', { fill: 'cardAlt' }),
          label(40, 230, 'CP: Spanner, HBase, ZooKeeper   ·   AP: Dynamo, Cassandra, Riak', { fill: 'muted', size: 11 }),
        ].join('')),
      },
      {
        title: 'A network partition in CP vs AP',
        description: 'Same partition, opposite reactions: CP refuses to answer to protect correctness; AP answers with possibly-stale data to stay up.',
        type: 'sequence',
        svgContent: svg(720, 250, [
          label(20, 20, 'CP system', { fill: 'accent', weight: 700 }),
          box(20, 35, 90, 36, 'Client'),
          box(250, 35, 90, 36, 'Node B'),
          lane(20, 95, 340, 'partition: B cannot reach primary'),
          arrow(110, 53, 250, 53, { label: 'read' }),
          arrow(250, 85, 110, 85, { label: 'ERROR (refuse)', stroke: 'red' }),
          label(400, 20, 'AP system', { fill: 'green', weight: 700 }),
          box(400, 35, 90, 36, 'Client'),
          box(620, 35, 90, 36, 'Node B'),
          lane(400, 95, 710, 'partition: B serves local copy'),
          arrow(490, 53, 620, 53, { label: 'read' }),
          arrow(620, 85, 490, 85, { label: 'stale value (200)', stroke: 'amber' }),
          label(20, 150, 'CP trades uptime for correctness.', { fill: 'muted', size: 11 }),
          label(400, 150, 'AP trades correctness for uptime.', { fill: 'muted', size: 11 }),
        ].join('')),
      },
    ],
    realWorldExamples: [
      {
        company: 'Amazon (DynamoDB)',
        problem: 'The shopping cart and other high-traffic services needed to stay writable even during datacenter and network failures, because a cart that refuses writes loses sales.',
        solution: 'The original Dynamo design chose AP, accepting eventual consistency and resolving conflicting writes (for example merging cart contents) rather than ever rejecting a write during a partition.',
        outcome: 'Carts remained available through infrastructure failures, and the AP design became the blueprint for a generation of highly available stores.',
      },
      {
        company: 'Apache HBase',
        problem: 'Workloads such as financial and analytical systems built on Hadoop needed strong, single-value consistency for each row even at large scale.',
        solution: 'HBase chose CP: each region is served by exactly one region server, so during a partition the affected regions become unavailable rather than serving divergent data.',
        outcome: 'Readers always see a consistent view of a row, at the cost of temporary unavailability for partitioned regions during failover.',
      },
    ],
    codeExamples: [
      {
        language: 'typescript',
        label: 'CP read: refuse on partition',
        description: 'A simplified CP read that requires a quorum and returns an error rather than stale data when the quorum cannot be met.',
        code: `interface Replica {
  read(key: string): Promise<{ value: string; version: number } | null>;
  reachable: boolean;
}

class CPStore {
  constructor(
    private readonly replicas: Replica[],
    private readonly quorum: number,
  ) {}

  async read(key: string): Promise<string> {
    const reachable = this.replicas.filter((r) => r.reachable);
    if (reachable.length < this.quorum) {
      // Cannot guarantee freshness → refuse rather than risk stale data.
      throw new Error('PARTITION: quorum unavailable, read rejected');
    }
    const results = await Promise.all(reachable.map((r) => r.read(key)));
    const latest = results
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => b.version - a.version)[0];
    if (!latest) throw new Error('not found');
    return latest.value; // highest version among a quorum = consistent
  }
}`,
      },
      {
        language: 'python',
        label: 'AP write: accept and reconcile later',
        description: 'An AP store that always accepts writes locally and reconciles divergent versions on read using last-write-wins.',
        code: `from dataclasses import dataclass, field
import time


@dataclass
class Versioned:
    value: str
    timestamp: float


@dataclass
class APStore:
    # Each node keeps its own copy; writes never block on the network.
    local: dict[str, Versioned] = field(default_factory=dict)

    def write(self, key: str, value: str) -> None:
        # Always available: accept the write immediately, replicate async.
        self.local[key] = Versioned(value, time.time())

    def read(self, key: str) -> str | None:
        v = self.local.get(key)
        return v.value if v else None

    def reconcile(self, key: str, incoming: Versioned) -> None:
        # Eventual consistency via last-write-wins conflict resolution.
        current = self.local.get(key)
        if current is None or incoming.timestamp > current.timestamp:
            self.local[key] = incoming


node_a, node_b = APStore(), APStore()
node_a.write("cart:42", "[book]")          # accepted during partition
node_b.write("cart:42", "[book, pen]")     # accepted on the other side
# After the partition heals, gossip reconciles to the latest write:
node_a.reconcile("cart:42", node_b.local["cart:42"])
print(node_a.read("cart:42"))  # [book, pen]`,
      },
    ],
    commonMistakes: [
      'Saying you want consistency, availability, and partition tolerance all at once, which signals a misunderstanding of the theorem.',
      'Treating partition tolerance as optional; for any multi-node system across a network, partitions are inevitable.',
      'Confusing CAP consistency (linearizability) with ACID consistency, which are different guarantees.',
      'Choosing a database by popularity rather than by whether its CAP and PACELC stance matches the data being stored.',
    ],
    whenNotToUse:
      'CAP reasoning only applies to distributed systems that span a network; a single-node database is not subject to the partition tradeoff, so do not invoke CAP to justify a choice on a system that never partitions. Also avoid letting CAP dominate a design where partitions are astronomically rare and the simpler model is good enough; PACELC latency tradeoffs often matter more day to day.',
    relatedTopics: ['consistency-models', 'reliability-availability', 'sql-vs-nosql', 'what-is-system-design'],
    industryStandard: 'Brewer\'s CAP Theorem · Abadi\'s PACELC · "Designing Data-Intensive Applications"',
    interviewTips:
      'Never claim you can have all three; instead, immediately frame the question as CP versus AP and tie the choice to the specific data and its business consequences. Earn senior-level credit by bringing up PACELC unprompted, explaining that even without partitions you are constantly trading latency for consistency, and by noting that real systems often choose differently per data type within one architecture.',
  },

  {
    id: 'caching-strategies',
    title: 'Caching Strategies',
    category: 'System Design Fundamentals',
    difficulty: 'Intermediate',
    readTime: 12,
    summary:
      'Caching trades memory and a risk of staleness for dramatic gains in latency and load reduction. The hard parts are choosing a write strategy, an eviction policy, and an invalidation approach that fits your consistency needs.',
    whyItMatters:
      'A cache is the single highest-leverage performance tool in most systems, and it is also the source of some of the most maddening bugs, because a stale cache serves wrong answers that look perfectly valid.',
    content: [
      {
        heading: 'Why caching exists',
        body: 'Caching exists because recomputing or refetching the same data repeatedly is wasteful when that data changes far less often than it is read. A cache stores the result of an expensive operation, a database query, a rendered page, an API response, close to where it is needed so subsequent requests are served in microseconds instead of milliseconds or seconds. The economics are compelling: a cache hit can be hundreds of times cheaper than the original computation, which means caching both lowers latency for users and reduces load on the systems behind it, often by an order of magnitude. This load reduction is frequently the real prize, because it lets a modest database serve traffic that would otherwise require expensive scaling. Caching leverages two empirical facts about real workloads: temporal locality, recently accessed data tends to be accessed again, and skew, a small fraction of items account for most requests. The cost of all this is the risk that the cached copy no longer matches the source of truth.',
      },
      {
        heading: 'Cache-aside, write-through, write-behind, and read-through',
        body: 'Cache-aside, also called lazy loading, puts the application in control: it checks the cache, and on a miss it reads the database, populates the cache, and returns the value, while writes go to the database and invalidate the cache entry. Read-through is similar but the cache itself, not the application, fetches from the database on a miss, which centralizes the logic but couples the cache to the data source. Write-through writes to the cache and the database synchronously on every write, keeping them consistent at the cost of higher write latency, and is ideal when reads must always be fresh. Write-behind, or write-back, writes to the cache immediately and flushes to the database asynchronously, which gives very fast writes but risks data loss if the cache fails before the flush. The right choice depends on your read-write ratio and how much staleness or write-loss risk you can tolerate. Most web systems default to cache-aside because it is simple and fails safe, since a cache outage degrades to direct database reads rather than data loss.',
      },
      {
        heading: 'Eviction policies and cache sizing',
        body: 'A cache has finite memory, so when it fills, an eviction policy decides what to discard. Least Recently Used (LRU) evicts the item untouched for the longest time and is the sensible default because it exploits temporal locality, keeping hot data resident. Least Frequently Used (LFU) evicts the item with the fewest accesses, which can outperform LRU for workloads with stable popularity but adapts poorly to changing access patterns. First In First Out (FIFO) simply evicts the oldest entry regardless of use and is rarely ideal because it ignores access patterns entirely. Beyond the policy, sizing matters enormously: a cache too small to hold the working set thrashes and provides little benefit, while an oversized cache wastes expensive memory. The hit rate is the metric that matters, and it is worth measuring directly rather than assuming, because the difference between a 95 percent and a 99 percent hit rate can be a fivefold change in load on the backing store.',
      },
      {
        heading: 'Cache invalidation, the hardest problem',
        body: 'Invalidation is famously hard because the cache and the source of truth are separate systems that can drift apart, and there is no perfect way to keep them in lockstep without sacrificing the very performance the cache was meant to provide. The simplest approach is a time-to-live, where each entry expires after a fixed duration, accepting bounded staleness in exchange for guaranteed eventual freshness and zero invalidation logic. Explicit invalidation, deleting or updating the cache entry when the underlying data changes, gives fresher data but is error-prone because every code path that mutates the data must remember to invalidate, and missed paths cause silent staleness. A subtle danger is the thundering herd, where a popular key expires and thousands of concurrent requests all miss and stampede the database simultaneously, which is mitigated with request coalescing or staggered expiry. There is also the dual-write problem, where updating the database and the cache as two steps can leave them inconsistent if one fails. The pragmatic stance is to prefer short TTLs for most data and reserve precise invalidation for the few cases where staleness is unacceptable.',
      },
      {
        heading: 'Distributed caching and the CDN layer',
        body: 'A single-process in-memory cache is fast but does not survive restarts and is not shared across instances, so distributed caches like Redis and Memcached provide a shared, network-accessible cache that all application nodes consult. This shared cache becomes its own tier that must be sized, monitored, and made highly available, often through replication and partitioning across nodes. At the edge of the system, a Content Delivery Network acts as a geographically distributed cache for static and cacheable dynamic content, serving users from a nearby location and absorbing enormous read traffic before it ever reaches your origin. Caching is therefore best understood as a layered strategy: the browser caches, the CDN caches, an application-level cache caches, and the database itself has a buffer cache. Each layer that achieves a hit shields every layer behind it, so the cumulative effect is multiplicative. The design skill is deciding what belongs at which layer and how long it may safely live there.',
      },
    ],
    diagrams: [
      {
        title: 'Four write strategies side by side',
        description: 'Where the write goes first, and whether it is synchronous, defines each strategy\'s consistency and latency profile.',
        type: 'comparison',
        svgContent: svg(720, 280, [
          label(20, 20, 'Cache-aside', { fill: 'accent', weight: 700, size: 12 }),
          box(20, 30, 90, 34, 'App'),
          arrow(110, 47, 170, 47, { label: 'miss' }),
          box(170, 30, 90, 34, 'DB'),
          arrow(65, 64, 65, 95, { label: 'fill', dashed: true }),
          box(20, 95, 90, 34, 'Cache'),

          label(380, 20, 'Write-through', { fill: 'green', weight: 700, size: 12 }),
          box(380, 30, 90, 34, 'App'),
          arrow(470, 47, 530, 47),
          box(530, 30, 90, 34, 'Cache'),
          arrow(575, 64, 575, 95, { label: 'sync' }),
          box(530, 95, 90, 34, 'DB'),

          label(20, 165, 'Write-behind', { fill: 'amber', weight: 700, size: 12 }),
          box(20, 175, 90, 34, 'App'),
          arrow(110, 192, 170, 192),
          box(170, 175, 90, 34, 'Cache'),
          arrow(215, 209, 215, 240, { label: 'async', dashed: true }),
          box(170, 240, 90, 34, 'DB'),

          label(380, 165, 'Read-through', { fill: 'purple', weight: 700, size: 12 }),
          box(380, 175, 90, 34, 'App'),
          arrow(470, 192, 530, 192),
          box(530, 175, 90, 34, 'Cache'),
          arrow(620, 192, 660, 192, { label: 'miss' }),
          box(560, 240, 90, 34, 'DB'),
          arrow(575, 209, 600, 240, { dashed: true }),
        ].join('')),
      },
      {
        title: 'Multi-layer cache hierarchy',
        description: 'Each layer that hits shields the layers behind it; the database is the last resort, not the first.',
        type: 'architecture',
        svgContent: svg(720, 130, [
          box(10, 45, 110, 44, 'Browser', { sub: 'HTTP cache' }),
          arrow(120, 67, 155, 67, { label: 'miss' }),
          box(155, 45, 110, 44, 'CDN', { fill: 'cardAlt', sub: 'edge cache' }),
          arrow(265, 67, 300, 67, { label: 'miss' }),
          box(300, 45, 110, 44, 'API cache', { sub: 'in-process' }),
          arrow(410, 67, 445, 67, { label: 'miss' }),
          box(445, 45, 110, 44, 'Redis', { fill: 'cardAlt', stroke: 'accent', sub: 'shared' }),
          arrow(555, 67, 590, 67, { label: 'miss' }),
          box(590, 45, 110, 44, 'Database', { stroke: 'amber', sub: 'source of truth' }),
        ].join('')),
      },
    ],
    realWorldExamples: [
      {
        company: 'Facebook (Memcache)',
        problem: 'The social graph generated billions of small, read-heavy lookups that would have overwhelmed the MySQL tier if served directly.',
        solution: 'Built a massive distributed Memcache layer using cache-aside, with careful techniques for lease-based invalidation and thundering-herd mitigation across thousands of cache servers.',
        outcome: 'The cache absorbed the overwhelming majority of reads, letting a comparatively small database fleet serve a planet-scale social graph.',
      },
      {
        company: 'Netflix (EVCache)',
        problem: 'Needed a highly available, low-latency cache spread across cloud zones that could survive instance and zone failures without cold-start latency spikes.',
        solution: 'Built EVCache, a Memcached-based distributed cache that replicates data across availability zones so a zone loss does not cause a cache miss storm against backing services.',
        outcome: 'Netflix serves personalized data with single-digit-millisecond latency and rides out zone failures without user-visible degradation.',
      },
    ],
    codeExamples: [
      {
        language: 'typescript',
        label: 'Cache-aside with Redis',
        description: 'The canonical lazy-loading pattern with a TTL and explicit invalidation on write.',
        code: `import type { Redis } from 'ioredis';

const TTL_SECONDS = 300;

async function getProduct(
  redis: Redis,
  db: { findProduct(id: string): Promise<Product | null> },
  id: string,
): Promise<Product | null> {
  const key = \`product:\${id}\`;
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached) as Product; // hit

  const product = await db.findProduct(id); // miss → load
  if (product) {
    // Populate with a TTL so the entry self-heals even if invalidation is missed.
    await redis.set(key, JSON.stringify(product), 'EX', TTL_SECONDS);
  }
  return product;
}

async function updateProduct(
  redis: Redis,
  db: { saveProduct(p: Product): Promise<void> },
  product: Product,
): Promise<void> {
  await db.saveProduct(product);
  // Invalidate (don't write) so the next read repopulates fresh data.
  await redis.del(\`product:\${product.id}\`);
}`,
      },
      {
        language: 'python',
        label: 'Write-through cache',
        description: 'Writes update cache and database synchronously so reads are always fresh, at the cost of write latency.',
        code: `from typing import Optional


class WriteThroughCache:
    def __init__(self, cache, db, ttl: int = 600):
        self.cache = cache
        self.db = db
        self.ttl = ttl

    def get(self, key: str) -> Optional[str]:
        value = self.cache.get(key)
        if value is not None:
            return value
        value = self.db.read(key)        # cold path on cache miss
        if value is not None:
            self.cache.set(key, value, ex=self.ttl)
        return value

    def set(self, key: str, value: str) -> None:
        # Write-through: DB first (durable), then cache stays in lockstep.
        self.db.write(key, value)
        self.cache.set(key, value, ex=self.ttl)
        # Reads after this point are guaranteed fresh from the cache.`,
      },
    ],
    commonMistakes: [
      'Caching without a TTL or any invalidation, so entries become permanently stale after the first write.',
      'Updating the cache directly on writes instead of invalidating, which races with concurrent reads and produces inconsistencies.',
      'Ignoring the thundering herd, so a single hot key expiring stampedes the database.',
      'Caching data that is cheap to compute or rarely re-read, paying memory and complexity for no real hit-rate benefit.',
    ],
    whenNotToUse:
      'Do not cache data that must be strictly consistent and changes on every read, such as a live account balance during a transaction, where serving a stale value is unacceptable. Caching also hurts when the working set has no skew and almost every request is unique, because the hit rate stays near zero while you pay the memory and complexity cost.',
    relatedTopics: ['content-delivery-networks', 'consistency-models', 'latency-vs-throughput', 'rate-limiting'],
    industryStandard: 'AWS Well-Architected — Performance Efficiency · "Scaling Memcache at Facebook" (NSDI)',
    interviewTips:
      'Whenever you propose a cache, the interviewer\'s next question is almost always about invalidation, so volunteer your invalidation strategy and the staleness bound before being asked. Show senior judgment by naming the thundering-herd risk and a mitigation, and by stating that you would default to cache-aside with a TTL because it fails safe, escalating to explicit invalidation only for the data that genuinely cannot tolerate staleness.',
  },

  // ───────────────────────────── API Design ─────────────────────────────
  {
    id: 'rest-api-best-practices',
    title: 'REST API Best Practices',
    category: 'API Design',
    difficulty: 'Intermediate',
    readTime: 12,
    summary:
      'REST is a set of constraints, not a rulebook, but the practical conventions around resources, HTTP methods, and status codes are what make an API predictable, cacheable, and pleasant to integrate against.',
    whyItMatters:
      'An API is a contract that outlives the code behind it; clumsy resource design or misused status codes force every consumer to write defensive workarounds and make the API nearly impossible to change later.',
    content: [
      {
        heading: 'REST constraints explained',
        body: 'REST is an architectural style defined by a handful of constraints, the most important being a uniform interface, statelessness, and a client-server separation with cacheable responses. Statelessness means each request carries everything needed to process it, so the server holds no client session between calls, which is exactly what makes REST APIs scale horizontally with ease. The uniform interface constraint says resources are identified by URLs and manipulated through a small, standard set of methods with well-defined semantics, so a client that understands HTTP already understands most of your API. Cacheability is a first-class concern: responses should declare whether and how long they may be cached, which lets intermediaries and clients avoid redundant work. Importantly, REST is a style, not a specification, so being pragmatic about the constraints matters more than dogmatically chasing purity. The goal is an API that behaves the way an experienced developer expects without reading much documentation.',
      },
      {
        heading: 'Resource naming conventions',
        body: 'A REST API models the domain as resources, and the cleanest convention is to name collections with plural nouns and address individual items by an identifier under that collection, such as a users collection and a specific user beneath it. Resources should be nouns, never verbs, because the verb is already expressed by the HTTP method; an endpoint to create a user is a POST to the users collection, not a call to a createUser action. Hierarchy expresses relationships, so the orders belonging to a user are nested under that user, while filtering, sorting, and pagination belong in query parameters rather than in the path. Consistency is more valuable than any particular choice: pick a casing and pluralization convention and apply it everywhere, because every inconsistency is a thing each integrator must memorize. Avoid leaking implementation details such as database table names or internal identifiers into the public surface. Good resource design reads like a clear description of the domain rather than a dump of the database schema.',
      },
      {
        heading: 'HTTP methods and their correct semantics',
        body: 'Each HTTP method carries a defined meaning that clients, caches, and proxies rely on, so using them correctly is not cosmetic. GET retrieves a resource and must be safe, meaning it never changes state, which is why GETs can be cached and retried freely. POST creates a new resource or triggers a non-idempotent action, and it is the one common method that is neither safe nor idempotent. PUT replaces a resource entirely and must be idempotent, so sending the same PUT twice leaves the same final state, while PATCH applies a partial update. DELETE removes a resource and should also be idempotent, returning success or a not-found that the client can treat as already-deleted. Respecting these contracts means infrastructure can safely retry idempotent requests and cache safe ones; violating them, such as mutating data inside a GET, breaks assumptions throughout the stack and causes subtle, dangerous bugs.',
      },
      {
        heading: 'Status codes and when to use each',
        body: 'HTTP status codes are the primary channel for communicating outcome, and using the precise code lets clients branch on behavior without parsing message strings. The 2xx range signals success, with 200 for a normal response, 201 for a created resource, and 204 for success with no body. The 4xx range signals client errors that the caller can fix: 400 for a malformed request, 401 for missing or invalid authentication, 403 for an authenticated user lacking permission, 404 for a missing resource, 409 for a conflict such as a duplicate, and 422 for a well-formed request that fails validation. The distinction between 400 and 422 matters: 400 means the request could not even be understood, while 422 means it was understood but the contents were semantically invalid. The 5xx range signals server faults the client cannot fix, and these should be logged and alerted on because they indicate a bug or outage. Returning 200 with an error embedded in the body is a common antipattern that defeats every tool built to reason about HTTP.',
      },
      {
        heading: 'Versioning, HATEOAS, and evolution',
        body: 'APIs change, and the discipline of versioning is what lets them change without breaking existing integrations, since once a third party depends on a response shape you cannot freely alter it. The most common approach is a version segment in the URL path, which is explicit and easy to route, though header-based versioning keeps URLs stable at the cost of being less visible. The deeper principle, popularized by Stripe, is to make changes additive whenever possible, adding new fields and endpoints rather than changing or removing existing ones, so old clients keep working untouched. HATEOAS, hypermedia as the engine of application state, takes REST to its logical end by having responses include links to related actions, so clients discover what they can do next rather than hardcoding URLs. In practice full HATEOAS is rare because most clients are written against documentation, but the idea of returning links for pagination and related resources is widely useful. Whatever you choose, publish a clear deprecation policy so consumers have a predictable runway before anything is removed.',
      },
    ],
    diagrams: [
      {
        title: 'Resource hierarchy and URL structure',
        description: 'Collections are plural nouns; items live beneath them; relationships nest; filters go in the query string.',
        type: 'flow',
        svgContent: svg(720, 200, [
          box(20, 20, 160, 40, '/users', { sub: 'collection', stroke: 'accent' }),
          arrow(100, 60, 100, 90),
          box(20, 90, 160, 40, '/users/{id}', { sub: 'one item' }),
          arrow(180, 110, 230, 110),
          box(230, 90, 200, 40, '/users/{id}/orders', { sub: 'nested relationship' }),
          arrow(430, 110, 480, 110),
          box(480, 90, 220, 40, '?status=paid&sort=-date', { sub: 'filter / sort in query', fill: 'cardAlt' }),
          label(20, 170, 'POST /users  creates · GET /users/{id}  reads · PUT replaces · PATCH partial · DELETE removes', { fill: 'muted', size: 11 }),
        ].join('')),
      },
      {
        title: 'Status code decision tree',
        description: 'Pick the most specific code: distinguish auth from permission, malformed from invalid, conflict from not-found.',
        type: 'flow',
        svgContent: svg(720, 260, [
          box(280, 14, 150, 38, 'Request arrives', { stroke: 'accent' }),
          arrow(355, 52, 355, 78),
          box(280, 78, 150, 38, 'Authenticated?'),
          arrow(280, 97, 150, 97, { label: 'no' }),
          box(40, 78, 110, 38, '401', { stroke: 'red', sub: 'unauthenticated' }),
          arrow(355, 116, 355, 142, { label: 'yes' }),
          box(280, 142, 150, 38, 'Permitted?'),
          arrow(430, 161, 560, 161, { label: 'no' }),
          box(560, 142, 110, 38, '403', { stroke: 'red', sub: 'forbidden' }),
          arrow(355, 180, 355, 206, { label: 'yes' }),
          box(280, 206, 150, 38, 'Valid body?'),
          arrow(280, 225, 150, 225, { label: 'no' }),
          box(40, 206, 110, 38, '422', { stroke: 'amber', sub: 'unprocessable' }),
          arrow(430, 225, 560, 225, { label: 'yes' }),
          box(560, 206, 110, 38, '200 / 201', { stroke: 'green', sub: 'success' }),
        ].join('')),
      },
    ],
    realWorldExamples: [
      {
        company: 'Stripe',
        problem: 'Payments integrators needed an API stable enough to build a business on, yet Stripe had to keep evolving it for a decade.',
        solution: 'Designed clean resource-oriented endpoints, used precise status codes, and adopted strictly additive, dated versioning so a request pinned to an old version keeps its exact behavior forever.',
        outcome: 'Stripe became the widely cited gold standard for API design, with integrations from years ago continuing to work without modification.',
      },
      {
        company: 'GitHub',
        problem: 'A sprawling public API serving millions of developers had to evolve through major changes without breaking the enormous ecosystem of tools built on it.',
        solution: 'Maintained a versioned REST API with consistent resource naming and clear status codes, communicated rate limits and deprecations in headers, and later added GraphQL alongside REST for flexible querying.',
        outcome: 'The ecosystem of GitHub integrations remained stable across years of platform evolution, and the API\'s conventions influenced industry norms.',
      },
    ],
    codeExamples: [
      {
        language: 'typescript',
        label: 'Express REST resource with correct conventions',
        description: 'A users resource using plural nouns, proper methods, and precise status codes including 201, 404, and 422.',
        code: `import express, { Request, Response } from 'express';
import { z } from 'zod';

const router = express.Router();

const CreateUser = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

router.get('/users/:id', async (req: Request, res: Response) => {
  const user = await db.findUser(req.params.id);
  if (!user) return res.status(404).json({ error: 'user not found' });
  return res.status(200).json(user); // safe, cacheable
});

router.post('/users', async (req: Request, res: Response) => {
  const parsed = CreateUser.safeParse(req.body);
  if (!parsed.success) {
    // Well-formed JSON but semantically invalid → 422, not 400.
    return res.status(422).json({ error: 'validation failed', issues: parsed.error.issues });
  }
  if (await db.emailExists(parsed.data.email)) {
    return res.status(409).json({ error: 'email already registered' }); // conflict
  }
  const user = await db.createUser(parsed.data);
  return res.status(201).location(\`/users/\${user.id}\`).json(user);
});

router.delete('/users/:id', async (req: Request, res: Response) => {
  await db.deleteUser(req.params.id); // idempotent
  return res.status(204).send();
});

export default router;`,
      },
      {
        language: 'python',
        label: 'FastAPI REST implementation',
        description: 'The same conventions in FastAPI, where Pydantic models and status codes are first-class.',
        code: `from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr

router = APIRouter()


class CreateUser(BaseModel):
    email: EmailStr
    name: str


class User(CreateUser):
    id: str


@router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str) -> User:
    user = await db.find_user(user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "user not found")
    return user


@router.post("/users", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_user(payload: CreateUser) -> User:
    # FastAPI returns 422 automatically when the body fails validation.
    if await db.email_exists(payload.email):
        raise HTTPException(status.HTTP_409_CONFLICT, "email already registered")
    return await db.create_user(payload)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: str) -> None:
    await db.delete_user(user_id)  # idempotent: 204 even if already gone`,
      },
    ],
    commonMistakes: [
      'Putting verbs in URLs (/getUser, /createUser) instead of letting the HTTP method express the action.',
      'Returning 200 OK with an error flag in the body, which defeats every tool that reasons about HTTP status.',
      'Conflating 400 and 422, or using 401 when the real issue is insufficient permission (403).',
      'Making GET requests that mutate state, breaking the safety guarantee that lets GETs be cached and retried.',
    ],
    whenNotToUse:
      'REST is a poor fit when clients need to fetch deeply nested, highly variable data shapes in one round trip, where GraphQL avoids over- and under-fetching, or when you need high-throughput, low-latency service-to-service calls with streaming, where gRPC is stronger. For real-time bidirectional communication such as chat or live collaboration, a WebSocket or event-streaming protocol fits better than request-response REST.',
    relatedTopics: ['graphql-vs-rest-vs-grpc', 'api-versioning-strategies', 'pagination-patterns', 'error-handling-standards'],
    industryStandard: 'Fielding\'s REST dissertation · Stripe & GitHub API guidelines · RFC 7231 (HTTP semantics)',
    interviewTips:
      'Demonstrate that you know the difference between similar status codes cold, especially 400 vs 422, 401 vs 403, and 409 vs 422, because interviewers use these to separate people who have designed real APIs from those who have only consumed them. When asked about evolution, cite the additive-change philosophy and a concrete versioning strategy, and mention idempotency of PUT and DELETE as the property that lets infrastructure retry safely.',
  },

  // ───────────────────────────── Security ─────────────────────────────
  {
    id: 'owasp-top-10',
    title: 'OWASP Top 10',
    category: 'Security',
    difficulty: 'Senior',
    readTime: 14,
    summary:
      'The OWASP Top 10 is the industry\'s consensus list of the most critical web application security risks. Knowing the top categories in depth, with real breaches and concrete mitigations, is table stakes for any senior engineer.',
    whyItMatters:
      'The overwhelming majority of catastrophic breaches map directly onto these categories. They are not exotic; they are the predictable result of skipping well-known defenses, which makes them both common and entirely preventable.',
    content: [
      {
        heading: 'Injection and broken access control',
        body: 'Injection occurs whenever untrusted input is interpreted as code or commands, with SQL injection the classic example, where input concatenated into a query lets an attacker rewrite that query and read or destroy data. The defense is never to build commands from raw input: use parameterized queries and prepared statements so the data can never escape its slot and become executable. Broken access control, which OWASP now ranks as the most prevalent risk, is the failure to enforce what an authenticated user is allowed to do, allowing horizontal escalation to another user\'s data or vertical escalation to admin functions. The canonical bug is the insecure direct object reference, where changing an identifier in a URL exposes someone else\'s record because the server checks authentication but not authorization. Defending access control requires checking permissions on every request at the server, denying by default, and never relying on the client to hide functionality. These two categories together account for a huge share of real-world compromises.',
      },
      {
        heading: 'Authentication, sensitive data, and misconfiguration',
        body: 'Broken authentication covers weak credential handling, predictable session tokens, missing rate limits on login, and absent multi-factor authentication, all of which let attackers take over accounts. The mitigations are well established: hash passwords with a slow algorithm like bcrypt or Argon2, issue high-entropy session tokens, lock or throttle after repeated failures, and support MFA. Sensitive data exposure, now framed as cryptographic failures, is the failure to protect data in transit and at rest, such as serving sensitive endpoints over plain HTTP or storing secrets and personal data unencrypted. The fix is to enforce TLS everywhere, encrypt sensitive data at rest, and avoid storing data you do not need. Security misconfiguration, ubiquitous because systems ship with insecure defaults, includes leaving debug modes on, exposing admin panels, verbose error messages that leak internals, and overly permissive cloud storage buckets. Hardening means disabling defaults, applying least privilege, and treating configuration as code that is reviewed and scanned.',
      },
      {
        heading: 'XSS, deserialization, and vulnerable components',
        body: 'Cross-site scripting injects attacker-controlled script into pages other users view, letting the attacker run code in the victim\'s browser to steal sessions or perform actions as them. Output encoding, treating user content as data rather than markup, plus a strong Content Security Policy, are the core defenses, and modern frameworks that escape by default eliminate most reflected and stored XSS. Insecure deserialization turns untrusted serialized data into live objects, which can lead to remote code execution when the deserializer can instantiate dangerous types, so you should avoid deserializing untrusted input or use formats and allowlists that cannot construct arbitrary objects. Using components with known vulnerabilities is the supply-chain risk: a single outdated dependency with a published exploit can compromise an entire application regardless of how careful your own code is. The defense is continuous dependency scanning, prompt patching, and minimizing the dependency surface. These categories are dangerous precisely because the vulnerability often lives in code you did not write.',
      },
      {
        heading: 'Logging failures and a defense-in-depth mindset',
        body: 'Insufficient logging and monitoring is the category that turns a contained incident into a catastrophe, because if you cannot detect an attack you cannot stop it, and breaches routinely go undiscovered for months. Adequate security logging captures authentication events, access-control failures, and input-validation failures with enough context to investigate, while avoiding logging the sensitive data itself. Beyond any single category, the unifying principle is defense in depth: no single control is trusted to be perfect, so you layer validation, parameterization, least privilege, encoding, and monitoring so that one failure does not become a breach. Threat modeling early, asking what could go wrong at each trust boundary, surfaces these risks before they reach production. Security is also a process, not a one-time checklist, because dependencies age, configurations drift, and new attack techniques emerge. The senior mindset treats every external input as hostile and every internal boundary as a place to verify rather than assume. This posture is what the entire Top 10 is ultimately teaching.',
      },
    ],
    diagrams: [
      {
        title: 'OWASP risk matrix: likelihood vs impact',
        description: 'The highest-priority risks combine high likelihood with high impact; broken access control and injection sit in the danger zone.',
        type: 'comparison',
        svgContent: svg(720, 280, [
          label(20, 20, 'Impact ↑', { fill: 'muted', size: 11 }),
          label(610, 268, 'Likelihood →', { fill: 'muted', size: 11 }),
          arrow(60, 250, 60, 30, { stroke: 'muted' }),
          arrow(60, 250, 690, 250, { stroke: 'muted' }),
          box(420, 50, 200, 60, 'Broken access control', { stroke: 'red', sub: 'high / high' }),
          box(420, 130, 160, 50, 'Injection', { stroke: 'red', sub: 'high / high' }),
          box(180, 60, 160, 50, 'Crypto failures', { stroke: 'amber', sub: 'high impact' }),
          box(440, 200, 180, 40, 'Misconfiguration', { stroke: 'amber', sub: 'very common' }),
          box(120, 190, 160, 40, 'Insecure deserialization', { sub: 'lower likelihood' }),
        ].join('')),
      },
      {
        title: 'Where each risk appears in a web app',
        description: 'Risks cluster at trust boundaries: the edge, the app tier, the data tier, and the dependency supply chain.',
        type: 'architecture',
        svgContent: svg(720, 230, [
          box(20, 90, 110, 44, 'Browser', { sub: 'XSS, CSRF' }),
          arrow(130, 112, 175, 112),
          box(175, 90, 120, 44, 'Edge / TLS', { sub: 'crypto failures', stroke: 'amber' }),
          arrow(295, 112, 340, 112),
          box(340, 90, 130, 44, 'App tier', { sub: 'authN/Z, injection', stroke: 'red' }),
          arrow(470, 112, 515, 112),
          box(515, 90, 120, 44, 'Database', { sub: 'SQL injection' }),
          arrow(400, 134, 400, 180, { label: 'pulls' }),
          box(330, 180, 150, 40, 'Dependencies', { sub: 'known CVEs', stroke: 'amber' }),
          label(560, 60, 'Logging spans all tiers', { fill: 'muted', size: 10.5 }),
        ].join('')),
      },
    ],
    realWorldExamples: [
      {
        company: 'Equifax',
        problem: 'A known, patchable vulnerability existed in an Apache Struts dependency, exactly the "vulnerable components" category.',
        solution: 'The fix was simply applying the available security patch promptly and maintaining an inventory of dependencies with their known vulnerabilities, which was not done in time.',
        outcome: 'The 2017 breach exposed the personal data of roughly 147 million people and became the textbook case for dependency patch discipline.',
      },
      {
        company: 'British Airways',
        problem: 'Attackers injected malicious script into the payment flow, a classic cross-site scripting and supply-chain weakness, skimming card details from real customers.',
        solution: 'The defenses that would have helped were a strict Content Security Policy, subresource integrity on third-party scripts, and tighter control over what code could run on payment pages.',
        outcome: 'The breach affected hundreds of thousands of customers and drew a major regulatory fine, underscoring CSP as a frontline XSS defense.',
      },
    ],
    codeExamples: [
      {
        language: 'typescript',
        label: 'Express with layered OWASP mitigations',
        description: 'Helmet for security headers, parameterized queries, validation, and authorization checks in one middleware stack.',
        code: `import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

const app = express();

// Security misconfiguration + XSS: secure headers incl. a CSP.
app.use(helmet({
  contentSecurityPolicy: {
    directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'"], objectSrc: ["'none'"] },
  },
}));
app.use(express.json({ limit: '100kb' })); // bound payloads

// Broken authentication: throttle login attempts.
app.use('/login', rateLimit({ windowMs: 60_000, max: 5 }));

const TransferDto = z.object({ to: z.string().uuid(), amount: z.number().positive() });

app.post('/accounts/:id/transfer', requireAuth, async (req, res) => {
  // Broken access control: verify the caller owns this account.
  if (req.user.id !== req.params.id) return res.status(403).json({ error: 'forbidden' });

  const dto = TransferDto.safeParse(req.body); // injection/validation
  if (!dto.success) return res.status(422).json({ error: 'invalid' });

  // SQL injection: parameterized query, never string concatenation.
  await db.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [
    dto.data.amount,
    req.params.id,
  ]);
  res.status(200).json({ ok: true });
});`,
      },
      {
        language: 'python',
        label: 'Django secure configuration',
        description: 'Production settings that close the most common misconfiguration and crypto gaps in Django.',
        code: `# settings.py — hardened production configuration
import os

DEBUG = False  # never True in prod: leaks stack traces and internals
ALLOWED_HOSTS = os.environ["ALLOWED_HOSTS"].split(",")
SECRET_KEY = os.environ["DJANGO_SECRET_KEY"]  # never hardcoded

# Crypto failures: force HTTPS and secure cookies.
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31_536_000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True

# XSS / clickjacking hardening.
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
CSP_DEFAULT_SRC = ("'self'",)

# Broken authentication: strong password hashing + validators.
PASSWORD_HASHERS = ["django.contrib.auth.hashers.Argon2PasswordHasher"]
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
     "OPTIONS": {"min_length": 12}},
]`,
      },
    ],
    commonMistakes: [
      'Checking authentication but forgetting authorization, leaving insecure direct object references (change the id, see someone else\'s data).',
      'Building SQL or shell commands by concatenating user input instead of using parameterized queries.',
      'Trusting client-side validation and hidden UI as a security control instead of enforcing everything server-side.',
      'Letting dependencies go unpatched, so a single known CVE in a transitive package compromises the whole app.',
    ],
    whenNotToUse:
      'There is no context in which you skip these defenses for internet-facing software; the only judgment call is depth versus effort for genuinely low-risk internal tools. Even then, avoid the trap of declaring something "internal" as a reason to skip authorization and patching, because internal networks are routinely breached and lateral movement is exactly how attackers escalate.',
    relatedTopics: ['sql-injection-prevention', 'xss-csrf-protection', 'secrets-management', 'security-headers'],
    industryStandard: 'OWASP Top 10 (2021) · OWASP ASVS · CWE Top 25',
    interviewTips:
      'Be able to discuss at least the top five categories in depth with a real breach for each, because naming "SQL injection" is junior-level while explaining parameterization, least-privilege database users, and defense in depth is senior-level. Frame your answers around trust boundaries and the principle that every external input is hostile, and always pair a named vulnerability with its concrete mitigation rather than just identifying the risk.',
  },

  // ───────────────────────────── Databases ─────────────────────────────
  {
    id: 'sql-vs-nosql',
    title: 'SQL vs NoSQL',
    category: 'Databases',
    difficulty: 'Intermediate',
    readTime: 12,
    summary:
      'SQL and NoSQL are not competitors but different tools with different tradeoffs around schema, consistency, scaling, and query flexibility. The skill is matching the data model to the access pattern.',
    whyItMatters:
      'The database is the hardest part of a system to change after launch, so an early mismatch between your data model and your access patterns becomes a permanent tax on every feature you build afterward.',
    content: [
      {
        heading: 'The relational model explained',
        body: 'Relational databases organize data into tables of rows and columns with a fixed, enforced schema, and they connect tables through foreign keys and joins, which lets you model complex relationships without duplicating data. Their defining strength is ACID transactions, which guarantee that a set of changes either fully succeeds or fully fails and that concurrent operations do not corrupt each other, making them the natural home for data where correctness is paramount. The query language, SQL, is declarative and extraordinarily expressive, letting you ask complex questions, joins, aggregations, ad hoc filters, without anticipating them at design time. Decades of engineering have made relational engines like PostgreSQL deeply reliable, with mature tooling, strong consistency, and sophisticated query planners. The historical weakness was horizontal scaling, since joins and transactions are hard to distribute, though read replicas, partitioning, and modern distributed SQL engines have softened this considerably. For most applications, a relational database remains the correct and boring default.',
      },
      {
        heading: 'Document and key-value models',
        body: 'Document databases store semi-structured documents, typically JSON, where each document is self-contained and the schema is flexible rather than enforced, which suits data that varies in shape or evolves rapidly. The model shines when your access pattern is to fetch a whole aggregate at once, such as a product with its variants and reviews, because there is no join, just a single document read. Key-value stores are the simplest model, mapping an opaque key to a value with no query capability beyond lookup by key, which makes them blisteringly fast and trivially scalable for caching, sessions, and feature flags. The tradeoff for both is that flexibility shifts responsibility onto the application: without an enforced schema, the burden of consistency moves into your code, and without joins you must either denormalize and duplicate data or perform multiple round trips. Denormalization trades write complexity and storage for read speed, which is often the right call at scale but a real cost. These models are powerful precisely when your queries are known and aggregate-shaped rather than ad hoc and relational.',
      },
      {
        heading: 'Column-family and graph models',
        body: 'Column-family databases such as Cassandra store data in rows that can have vast numbers of columns, and they are designed for enormous write throughput and horizontal scale across many nodes, typically with tunable consistency. Their data model is query-first: you design tables around the exact queries you will run, because flexible ad hoc querying is not their strength, and the reward is linear scalability and high availability that relational systems struggle to match. Graph databases such as Neo4j model data as nodes and edges, making relationships first-class, which is transformative when the relationships themselves are the primary thing you query, as in social networks, recommendations, or fraud detection. A query that would require many expensive joins in a relational database, finding friends of friends who like a given thing, becomes a natural, efficient traversal in a graph. Each of these specialized models trades general-purpose flexibility for excellence at a specific class of problem. Recognizing when your problem is genuinely graph-shaped or write-heavy and wide is what justifies stepping outside the relational default.',
      },
      {
        heading: 'A decision framework',
        body: 'Choosing a database starts not with the database but with the data and its access patterns: what are the read and write rates, what queries must be fast, how structured and how related is the data, and how strong must consistency be. If the data is highly relational, correctness is critical, and you need flexible querying, a relational database is almost always right, and you should reach for something else only when a specific requirement forces it. If you fetch large self-contained aggregates and value schema flexibility, a document store fits; if you need extreme write throughput with known queries, a column-family store fits; if relationships dominate, a graph database fits. A crucial insight is that NoSQL does not mean no schema, it means the schema lives in your application instead of the database, which is a tradeoff, not a free lunch. Many mature systems use polyglot persistence, choosing the right store per concern, a relational system for orders and a key-value store for sessions and a search engine for full-text. The goal is to let each access pattern be served by the model best suited to it rather than forcing everything into one tool.',
      },
    ],
    diagrams: [
      {
        title: 'Database types and their sweet spots',
        description: 'Each model trades generality for excellence at a particular access pattern.',
        type: 'comparison',
        svgContent: svg(720, 200, [
          box(20, 40, 160, 70, 'Relational', { stroke: 'accent', sub: 'joins · ACID · ad hoc' }),
          box(195, 40, 160, 70, 'Document', { fill: 'cardAlt', sub: 'aggregates · flexible' }),
          box(370, 40, 150, 70, 'Key-value', { sub: 'cache · sessions' }),
          box(535, 40, 160, 70, 'Column / Graph', { fill: 'cardAlt', sub: 'write-scale · relations' }),
          label(20, 150, 'Default to relational. Step out only when a specific requirement forces it.', { fill: 'muted', size: 11 }),
        ].join('')),
      },
      {
        title: 'Polyglot persistence',
        description: 'One application, several stores: each concern served by the model best suited to it.',
        type: 'architecture',
        svgContent: svg(720, 220, [
          box(290, 14, 140, 44, 'Application', { stroke: 'accent' }),
          arrow(320, 58, 120, 110),
          arrow(350, 58, 290, 110),
          arrow(370, 58, 460, 110),
          arrow(400, 58, 620, 110),
          box(40, 110, 150, 50, 'PostgreSQL', { sub: 'orders, users' }),
          box(220, 110, 140, 50, 'Redis', { fill: 'cardAlt', sub: 'sessions, cache' }),
          box(400, 110, 150, 50, 'Elasticsearch', { sub: 'full-text search' }),
          box(580, 110, 120, 50, 'Neo4j', { fill: 'cardAlt', sub: 'recommendations' }),
        ].join('')),
      },
    ],
    realWorldExamples: [
      {
        company: 'Instagram',
        problem: 'A rapidly growing photo-sharing service needed a database that was reliable, consistent, and operationally well-understood while scaling to hundreds of millions of users.',
        solution: 'Stayed on PostgreSQL and scaled it deliberately through sharding, connection pooling, and careful schema design rather than switching to a trendier NoSQL store.',
        outcome: 'Instagram demonstrated that a well-operated relational database scales to massive consumer scale, making "just use Postgres" a credible default.',
      },
      {
        company: 'Discord',
        problem: 'Storing trillions of chat messages with heavy write throughput strained their datastore, and operational issues with their existing Cassandra deployment caused latency spikes.',
        solution: 'Migrated their messages store to ScyllaDB, a Cassandra-compatible column-family database optimized for low-latency, high-throughput writes at massive scale.',
        outcome: 'Discord drastically reduced tail latency and operational toil while continuing to store an enormous, ever-growing volume of messages.',
      },
    ],
    codeExamples: [
      {
        language: 'typescript',
        label: 'Same data in Postgres vs MongoDB',
        description: 'The relational version normalizes and joins; the document version embeds the aggregate for single-read access.',
        code: `// Relational (Postgres via parameterized query): normalized, joined.
async function getOrderSql(db: SqlClient, orderId: string) {
  const order = await db.query(
    \`SELECT o.id, o.total, u.email
       FROM orders o JOIN users u ON u.id = o.user_id
      WHERE o.id = $1\`,
    [orderId],
  );
  const items = await db.query(
    'SELECT product_id, qty FROM order_items WHERE order_id = $1',
    [orderId],
  );
  return { ...order.rows[0], items: items.rows }; // two round trips + a join
}

// Document (MongoDB): the whole aggregate is one self-contained document.
async function getOrderDoc(coll: Collection, orderId: string) {
  // No join, no second query — the embedded items come along for free.
  return coll.findOne({ _id: orderId }); // { total, email, items: [...] }
}`,
      },
      {
        language: 'python',
        label: 'Polyglot persistence repository',
        description: 'A repository that routes each concern to the store that fits it: relational for orders, key-value for sessions.',
        code: `class OrderRepository:
    """Durable, relational, transactional data lives in Postgres."""

    def __init__(self, pg):
        self.pg = pg

    def create(self, user_id: str, total: float) -> str:
        with self.pg.transaction() as tx:  # ACID matters for money
            row = tx.execute(
                "INSERT INTO orders (user_id, total) VALUES (%s, %s) RETURNING id",
                (user_id, total),
            ).fetchone()
            return row["id"]


class SessionStore:
    """Ephemeral, high-churn data lives in Redis (key-value)."""

    def __init__(self, redis):
        self.redis = redis

    def save(self, token: str, user_id: str, ttl: int = 3600) -> None:
        self.redis.set(f"session:{token}", user_id, ex=ttl)

    def resolve(self, token: str) -> str | None:
        return self.redis.get(f"session:{token}")`,
      },
    ],
    commonMistakes: [
      'Choosing NoSQL for "scale" before there is any scale problem, taking on schema-in-application complexity for no benefit.',
      'Assuming NoSQL means no schema; in reality the schema just moves into your application code, often unmanaged.',
      'Modeling document and column-family stores like relational tables, then needing joins the store cannot do efficiently.',
      'Picking a database by hype rather than by analyzing the actual read/write patterns and consistency needs.',
    ],
    whenNotToUse:
      'Do not reach for NoSQL when your data is highly relational, requires multi-record transactions, or needs flexible ad hoc querying, because you will end up reimplementing joins and consistency badly in application code. Equally, do not force a relational database to serve a genuinely graph-shaped traversal workload or extreme write-heavy time-series ingestion where a specialized store is dramatically better.',
    relatedTopics: ['cap-theorem', 'database-indexing', 'database-sharding', 'acid-transactions'],
    industryStandard: '"Designing Data-Intensive Applications" (Kleppmann) · AWS database selection guidance',
    interviewTips:
      'Resist naming a database in your first sentence; instead, ask about access patterns, consistency requirements, and data relationships, then justify the choice from those facts, because interviewers are testing whether you reason from requirements. Score senior points by stating that NoSQL moves the schema into the application rather than removing it, and by proposing polyglot persistence when different concerns in the same system have genuinely different needs.',
  },

  // ───────────────────────────── Infrastructure ─────────────────────────────
  {
    id: 'containers-docker',
    title: 'Containers and Docker',
    category: 'Infrastructure',
    difficulty: 'Intermediate',
    readTime: 12,
    summary:
      'Containers package an application with its dependencies into a portable, isolated unit that runs identically everywhere. Docker made them mainstream; understanding image layers and build hygiene is what separates a working image from a good one.',
    whyItMatters:
      'Containers eliminated the "works on my machine" class of bugs and became the unit of deployment for nearly all modern infrastructure, so a sloppy image directly inflates build times, attack surface, and cloud cost across every deployment.',
    content: [
      {
        heading: 'Containers versus virtual machines',
        body: 'A virtual machine virtualizes hardware, running a full guest operating system on top of a hypervisor, which gives strong isolation but carries the weight of an entire OS per instance, measured in gigabytes and tens of seconds to boot. A container instead virtualizes the operating system, sharing the host kernel while isolating processes through Linux primitives like namespaces and cgroups, so each container is just your application and its dependencies, measured in megabytes and milliseconds to start. This lightness is the whole point: you can pack far more containers onto a machine than VMs, start them almost instantly, and treat them as disposable. The tradeoff is weaker isolation, since containers share the host kernel, so a kernel vulnerability can in principle cross the boundary, which is why security-sensitive multi-tenant workloads sometimes still use VMs or lightweight micro-VMs. For the vast majority of application deployment, containers hit the sweet spot of portability, density, and speed. Understanding that containers are isolated processes rather than tiny machines clarifies both their power and their limits.',
      },
      {
        heading: 'Docker image layers',
        body: 'A Docker image is built as a stack of read-only layers, where each instruction in a Dockerfile, such as installing packages or copying code, produces a new layer on top of the previous one. These layers are cached and shared, so if two images start from the same base and install the same dependencies, those layers are stored once and reused, which saves enormous space and bandwidth. The caching also accelerates builds dramatically: Docker reuses cached layers up to the first instruction that changed, so ordering your Dockerfile from least to most frequently changing maximizes cache hits. This is why copying your dependency manifest and installing dependencies should come before copying your application code, since code changes far more often than dependencies and you do not want a one-line code change to reinstall everything. A running container adds a thin writable layer on top of the read-only image layers, and changes there are ephemeral unless persisted to a volume. Grasping the layer model is the key to fast builds and small, efficient images.',
      },
      {
        heading: 'Dockerfile best practices and multi-stage builds',
        body: 'A good Dockerfile produces an image that is small, secure, and fast to build, and the single most effective technique for this is the multi-stage build. In a multi-stage build you use one stage with the full toolchain to compile or bundle your application, then copy only the resulting artifacts into a clean, minimal final stage, so build tools, source code, and intermediate files never ship to production. This routinely shrinks images by an order of magnitude and removes a large amount of attack surface, since an attacker who compromises the container finds no compilers or package managers to abuse. Other essentials include pinning base image versions for reproducibility, ordering instructions for cache efficiency, combining related commands to reduce layer count, and using a dot-dockerignore file so you do not copy secrets or bloat into the build context. Choosing a slim or distroless base image further reduces both size and vulnerabilities. The difference between a naive image and a well-crafted one is often hundreds of megabytes and dozens of known vulnerabilities.',
      },
      {
        heading: 'Networking and security hardening',
        body: 'Containers communicate over virtual networks that Docker manages, where containers on the same network can reach each other by name, and ports are explicitly published to the host only when external access is needed. This explicit model is a security benefit: nothing is reachable from outside unless you deliberately expose it, and you should expose the minimum. Security hardening starts with not running as root inside the container, because a process running as root that escapes isolation is far more dangerous than an unprivileged one, so you create and switch to a non-root user. You should also run the filesystem read-only where possible, drop unnecessary Linux capabilities, and scan images for known vulnerabilities as part of the build pipeline so you never ship a base image with published exploits. Secrets should be injected at runtime through the orchestrator rather than baked into image layers, because anything in a layer is recoverable by anyone with the image. Treating the container as a hardened, minimal, unprivileged unit, rather than a convenient place to dump everything, is the mark of production-grade containerization.',
      },
    ],
    diagrams: [
      {
        title: 'VM stack vs container stack',
        description: 'VMs carry a full guest OS each; containers share the host kernel and ship only the app and its dependencies.',
        type: 'comparison',
        svgContent: svg(720, 250, [
          label(40, 20, 'Virtual machines', { fill: 'amber', weight: 700 }),
          box(40, 35, 260, 28, 'App A     ·     App B', {}),
          box(40, 67, 260, 28, 'Guest OS  ·  Guest OS', { fill: 'cardAlt' }),
          box(40, 99, 260, 28, 'Hypervisor', {}),
          box(40, 131, 260, 28, 'Host OS', {}),
          box(40, 163, 260, 28, 'Hardware', { stroke: 'muted' }),
          label(420, 20, 'Containers', { fill: 'green', weight: 700 }),
          box(420, 35, 80, 28, 'App A', {}),
          box(505, 35, 80, 28, 'App B', {}),
          box(590, 35, 90, 28, 'App C', {}),
          box(420, 67, 260, 28, 'Container runtime (Docker)', { fill: 'cardAlt', stroke: 'accent' }),
          box(420, 99, 260, 28, 'Host OS / shared kernel', {}),
          box(420, 131, 260, 28, 'Hardware', { stroke: 'muted' }),
          label(420, 185, 'Lighter, denser, starts in ms', { fill: 'muted', size: 10.5 }),
        ].join('')),
      },
      {
        title: 'Multi-container app with Docker Compose',
        description: 'Services share a private network and reach each other by name; only the gateway publishes a host port.',
        type: 'architecture',
        svgContent: svg(720, 220, [
          box(20, 90, 110, 44, 'Internet'),
          arrow(130, 112, 175, 112, { label: ':443' }),
          box(175, 90, 110, 44, 'web', { stroke: 'accent', sub: 'published' }),
          arrow(285, 112, 330, 112),
          box(330, 90, 110, 44, 'api', { sub: 'internal' }),
          arrow(440, 100, 540, 70),
          arrow(440, 124, 540, 150),
          box(540, 50, 150, 44, 'db', { fill: 'cardAlt', sub: 'volume-backed' }),
          box(540, 130, 150, 44, 'cache', { fill: 'cardAlt', sub: 'redis' }),
          label(175, 175, 'one private network · service discovery by name', { fill: 'muted', size: 10.5 }),
        ].join('')),
      },
    ],
    realWorldExamples: [
      {
        company: 'Spotify',
        problem: 'Hundreds of microservices owned by autonomous teams needed consistent, reproducible deployment without each team reinventing packaging and environment management.',
        solution: 'Standardized on containers so every service shipped as a self-contained image with pinned dependencies, then orchestrated them, decoupling the runtime environment from the host.',
        outcome: 'Teams deployed independently and reliably, and the "works on my machine" problem disappeared across a large, heterogeneous service estate.',
      },
      {
        company: 'Google (Borg)',
        problem: 'Running billions of jobs across enormous clusters required packing workloads densely and scheduling them efficiently long before Docker existed.',
        solution: 'Pioneered Linux container isolation with the Borg cluster manager, treating containers as the unit of scheduling and resource isolation, which later inspired Kubernetes.',
        outcome: 'Google ran planet-scale workloads with high utilization, and the container-and-orchestrator model became the industry standard it created.',
      },
    ],
    codeExamples: [
      {
        language: 'typescript',
        label: 'Production multi-stage Dockerfile (Node)',
        description: 'A build stage compiles and installs; the slim runtime stage runs as a non-root user with only production artifacts.',
        code: `# syntax=docker/dockerfile:1

# ---- build stage: full toolchain, never shipped ----
FROM node:20-slim AS build
WORKDIR /app
# Copy manifests first so dependency layers cache across code changes.
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

# ---- runtime stage: minimal, hardened ----
FROM node:20-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
# Run as an unprivileged user, not root.
RUN addgroup --system app && adduser --system --ingroup app app
COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/dist ./dist
COPY --from=build --chown=app:app /app/package.json ./
USER app
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD node dist/healthcheck.js
CMD ["node", "dist/server.js"]`,
      },
      {
        language: 'python',
        label: 'Multi-stage Dockerfile (Python)',
        description: 'Builds wheels in one stage and installs them into a clean slim image, keeping build tools out of production.',
        code: `# ---- build stage ----
FROM python:3.12-slim AS build
WORKDIR /app
RUN pip install --no-cache-dir build
COPY requirements.txt .
# Pre-build wheels so the final image needs no compiler.
RUN pip wheel --no-cache-dir --wheel-dir /wheels -r requirements.txt

# ---- runtime stage ----
FROM python:3.12-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
RUN useradd --create-home --uid 1000 appuser
COPY --from=build /wheels /wheels
COPY requirements.txt .
RUN pip install --no-cache-dir --no-index --find-links=/wheels -r requirements.txt \\
    && rm -rf /wheels
COPY --chown=appuser:appuser . .
USER appuser
EXPOSE 8000
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:8000", "--workers", "4"]`,
      },
    ],
    commonMistakes: [
      'Copying application code before installing dependencies, busting the layer cache on every code change.',
      'Shipping a single-stage image full of compilers and source, bloating size and attack surface.',
      'Running the container process as root, turning any escape into a far more serious compromise.',
      'Baking secrets into image layers, where anyone with the image can recover them forever.',
    ],
    whenNotToUse:
      'Containers add little for a simple static site or a function that a serverless platform runs better and cheaper, and they are a poor fit for workloads needing the strong isolation of full VMs, such as untrusted multi-tenant code. They also do not solve state on their own, so do not treat a container as durable storage; stateful data belongs in volumes or managed services, not in the ephemeral writable layer.',
    relatedTopics: ['kubernetes-fundamentals', 'ci-cd-pipeline-design', 'service-mesh', 'infrastructure-as-code'],
    industryStandard: 'OCI image spec · Docker best practices · CIS Docker Benchmark',
    interviewTips:
      'Be ready to explain why Dockerfile instruction order matters for caching and to describe a multi-stage build, because these are the most common practical container questions. Know the difference between CMD and ENTRYPOINT, and articulate the container-versus-VM tradeoff in terms of shared kernel isolation, since interviewers use that to gauge whether you understand containers as processes rather than tiny machines.',
  },

  // ───────────────────────────── Observability ─────────────────────────────
  {
    id: 'logging-best-practices',
    title: 'Logging Best Practices',
    category: 'Observability',
    difficulty: 'Intermediate',
    readTime: 10,
    summary:
      'Good logging is structured, leveled, and correlated. In a distributed system, a log line without a correlation ID and machine-parseable fields is nearly useless when you are debugging an incident at 3 a.m.',
    whyItMatters:
      'Logs are often the only record of what actually happened during an incident, and the gap between a system that is debuggable and one that is not is almost entirely decided by logging discipline put in place before the incident.',
    content: [
      {
        heading: 'Structured logging versus plain text',
        body: 'Plain-text logs are written for humans to read line by line, which works at small scale but collapses the moment you need to search, filter, or aggregate across millions of lines from many services. Structured logging instead emits each log entry as a machine-parseable object, typically JSON, with named fields for the timestamp, level, message, and any contextual data such as user id, request id, and latency. The payoff is that your log aggregation system can index those fields, letting you query for all errors on a specific endpoint for a specific user in a time window, which is impossible with free-form text. Structured logs also compose cleanly with dashboards and alerts, since a numeric field like duration can be charted directly. The discipline is to log events as data rather than as prose, attaching context as fields rather than concatenating it into a sentence. Once a team adopts structured logging, the speed of incident investigation improves dramatically because the logs become a queryable dataset rather than a wall of text.',
      },
      {
        heading: 'Log levels and using them correctly',
        body: 'Log levels exist so you can control verbosity and signal severity, and using them consistently is what makes them useful. ERROR is for failures that need attention, conditions where the system could not do what was asked, while WARN is for recoverable or suspicious situations that did not fail outright but might indicate a developing problem. INFO records significant business events such as a completed order or a started job, giving a high-level narrative of what the system is doing, while DEBUG carries the fine-grained detail useful during development and deep investigation but too noisy for normal production. The most common mistake is level inflation, where everything is logged at ERROR or INFO until the levels lose all meaning and alerts become noise. A disciplined scheme lets you run production at INFO, dial up to DEBUG temporarily when investigating, and trust that an ERROR genuinely warrants a human looking. Choosing the right level for each event is a small act of empathy for whoever debugs the system later.',
      },
      {
        heading: 'Correlation IDs for distributed tracing',
        body: 'In a distributed system a single user request fans out across many services, so a log line from one service in isolation tells you almost nothing about the request that produced it. A correlation ID, also called a request id or trace id, is a unique identifier generated at the entry point and propagated through every downstream call, usually via a header, so that every log line emitted while handling that request carries the same id. With correlation IDs in place you can filter your aggregated logs by a single id and see the complete journey of one request across every service it touched, in order, which turns distributed debugging from guesswork into a precise reconstruction. Without them, correlating events across services means matching timestamps and hoping, which is unreliable and slow. The correlation ID should be generated as early as possible, ideally at the gateway, and threaded through asynchronous work like queue messages so the chain is never broken. This single practice is arguably the highest-leverage logging investment a distributed system can make.',
      },
      {
        heading: 'Aggregation, retention, and cost',
        body: 'Logs are only useful if they are collected somewhere searchable, so production systems ship logs from every instance to a central aggregation platform, classically the ELK stack of Elasticsearch, Logstash, and Kibana, or a managed equivalent. Centralization means you query one place instead of logging into individual machines that may already be gone, which matters enormously with ephemeral containers that can vanish before you investigate. The cost dimension is real and frequently underestimated: logs can become one of the largest line items in an observability budget, because indexing and storing high-volume logs is expensive. This forces deliberate decisions about what to log, at what level, and for how long to retain it, often keeping recent logs hot and searchable while archiving older logs to cheap cold storage. Sampling high-volume, low-value logs and being disciplined about not logging redundant or sensitive data keeps both cost and noise under control. The aim is a system where the signal you need during an incident is present and findable without drowning in volume you will never read.',
      },
    ],
    diagrams: [
      {
        title: 'From application to searchable index',
        description: 'Structured events flow from each instance through a shipper into a central index that powers search and dashboards.',
        type: 'flow',
        svgContent: svg(720, 150, [
          box(20, 55, 120, 44, 'App instances', { sub: 'JSON logs' }),
          arrow(140, 77, 185, 77, { label: 'ship' }),
          box(185, 55, 120, 44, 'Collector', { fill: 'cardAlt', sub: 'Fluent Bit' }),
          arrow(305, 77, 350, 77),
          box(350, 55, 130, 44, 'Index', { stroke: 'accent', sub: 'Elasticsearch' }),
          arrow(480, 77, 525, 77),
          box(525, 55, 120, 44, 'Kibana', { sub: 'search · alert' }),
        ].join('')),
      },
      {
        title: 'ELK aggregation architecture',
        description: 'Many ephemeral instances feed one durable, queryable store, so logs outlive the containers that produced them.',
        type: 'architecture',
        svgContent: svg(720, 220, [
          box(20, 30, 110, 38, 'svc A', { sub: 'container' }),
          box(20, 90, 110, 38, 'svc B', { sub: 'container' }),
          box(20, 150, 110, 38, 'svc C', { sub: 'container' }),
          arrow(130, 49, 220, 100),
          arrow(130, 109, 220, 109),
          arrow(130, 169, 220, 118),
          box(220, 88, 130, 44, 'Logstash', { fill: 'cardAlt', sub: 'parse · enrich' }),
          arrow(350, 110, 410, 110),
          box(410, 88, 140, 44, 'Elasticsearch', { stroke: 'accent', sub: 'indexed store' }),
          arrow(550, 110, 600, 110),
          box(600, 88, 100, 44, 'Kibana'),
        ].join('')),
      },
    ],
    realWorldExamples: [
      {
        company: 'Stripe',
        problem: 'Debugging individual payment flows across many services required reconstructing exactly what happened to one transaction among an enormous volume.',
        solution: 'Adopted rich structured logging with consistent fields and correlation identifiers so a single payment could be traced end to end across services by filtering on its id.',
        outcome: 'Engineers can investigate a specific payment\'s journey precisely and quickly, which is essential for a system handling money where every anomaly matters.',
      },
      {
        company: 'Netflix',
        problem: 'Operating thousands of services generating petabytes of logs made naive full retention both unsearchable and prohibitively expensive.',
        solution: 'Built large-scale log aggregation pipelines with structured events, tiered retention, and sampling so that high-value signals stay searchable while volume and cost stay controlled.',
        outcome: 'Netflix retains actionable observability across an enormous fleet without the log bill or noise overwhelming the value.',
      },
    ],
    codeExamples: [
      {
        language: 'typescript',
        label: 'Winston structured logger with correlation ID',
        description: 'A JSON logger plus middleware that generates and propagates a correlation ID through the request lifecycle.',
        code: `import winston from 'winston';
import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

const als = new AsyncLocalStorage<{ correlationId: string }>();

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format((info) => {
      // Attach the correlation ID to every line automatically.
      info.correlationId = als.getStore()?.correlationId;
      return info;
    })(),
    winston.format.json(),
  ),
  transports: [new winston.transports.Console()],
});

export function correlationMiddleware(req: Request, res: Response, next: NextFunction) {
  const correlationId = (req.headers['x-correlation-id'] as string) ?? randomUUID();
  res.setHeader('x-correlation-id', correlationId);
  als.run({ correlationId }, () => next()); // propagate through async work
}

// Usage: logger.info('order.created', { orderId, total }); // → structured JSON`,
      },
      {
        language: 'python',
        label: 'structlog with bound context',
        description: 'structlog emits JSON and binds a correlation ID so every subsequent log line in the request carries it.',
        code: `import logging
import uuid
import structlog

structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,  # pulls in bound context
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),       # machine-parseable output
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
)

log = structlog.get_logger()


async def handle_request(request, call_next):
    correlation_id = request.headers.get("x-correlation-id", str(uuid.uuid4()))
    # Bind once; every log line in this request inherits the id.
    structlog.contextvars.bind_contextvars(correlation_id=correlation_id)
    try:
        log.info("request.start", path=request.url.path, method=request.method)
        response = await call_next(request)
        log.info("request.end", status=response.status_code)
        return response
    finally:
        structlog.contextvars.clear_contextvars()`,
      },
    ],
    commonMistakes: [
      'Logging free-form text strings instead of structured fields, making logs unsearchable at scale.',
      'Omitting a correlation ID, so reconstructing a single request across services becomes timestamp guesswork.',
      'Level inflation, logging everything at ERROR or INFO until severity carries no information and alerts are noise.',
      'Logging secrets, tokens, or full personal data, creating a compliance and security liability in the log store.',
    ],
    whenNotToUse:
      'Do not lean on verbose application logs for high-cardinality, high-volume metrics like request rates and latency percentiles; those belong in a metrics system that aggregates far more cheaply than logging every event. Also avoid logging on the hot path of extremely latency-sensitive code where the serialization and I/O cost is non-trivial; sample or defer instead.',
    relatedTopics: ['distributed-tracing', 'metrics-and-monitoring', 'sla-slo-sli', 'health-checks'],
    industryStandard: 'Google SRE Book (monitoring chapters) · OpenTelemetry logging · Elastic Common Schema',
    interviewTips:
      'State plainly that in a distributed system every log line needs a correlation ID, because that single point signals you have actually debugged production rather than just read about it. Distinguish logs from metrics and traces as the three pillars of observability, explaining that logs answer "what exactly happened to this request," and mention cost and retention tradeoffs to show you think about observability as a budgeted system, not a free dumping ground.',
  },

  // ───────────────────────────── Architecture Patterns ─────────────────────────────
  {
    id: 'monolith-vs-microservices',
    title: 'Monolith vs Microservices',
    category: 'Architecture Patterns',
    difficulty: 'Senior',
    readTime: 13,
    summary:
      'Microservices trade in-process simplicity for independent deployability and scaling, paying for it in operational and distributed-systems complexity. The right choice depends on team size and organizational maturity far more than on technology.',
    whyItMatters:
      'Premature microservices is one of the most expensive mistakes a growing company can make, creating a distributed monolith that has all the complexity of microservices and none of the benefits, while the wrong monolith can throttle a large organization.',
    content: [
      {
        heading: 'Monolith strengths',
        body: 'A monolith is a single deployable unit where all the code runs in one process, and its strengths are exactly the things distributed systems make hard. Calls between modules are ordinary function calls, so they are fast, type-checked, and transactional, with no network failures, serialization, or partial failures to reason about. A single codebase means one place to build, test, and deploy, one database where transactions span the whole domain, and a refactor across module boundaries that the compiler can verify in one step. Onboarding is simpler, local development is straightforward, and end-to-end testing does not require standing up a constellation of services. For a small team and a young product, a well-structured monolith is almost always faster to build and easier to operate, and it preserves the option to extract services later once the boundaries are actually understood. The monolith\'s bad reputation usually comes from monoliths that lacked internal structure, not from the architecture itself.',
      },
      {
        heading: 'Microservices strengths',
        body: 'Microservices decompose a system into independently deployable services, each owning a bounded slice of the domain and typically its own data, communicating over the network. The defining benefit is independent deployability: a team can ship its service without coordinating a release of the entire system, which is what lets large organizations move quickly in parallel. Services can also scale independently, so a hot path gets more instances without scaling everything, and they can use different technologies where appropriate. Crucially, microservices align with team structure following Conway\'s Law, letting autonomous teams own services end to end, which is the real reason large companies adopt them. Fault isolation is a further benefit when done well, since a failure in one service need not take down the others if boundaries and fallbacks are designed carefully. These benefits are organizational and operational as much as technical, which is why microservices pay off mainly at a scale of people, not just a scale of traffic.',
      },
      {
        heading: 'The distributed monolith antipattern',
        body: 'The distributed monolith is the worst of both worlds: services that are physically separate but so tightly coupled that they must be deployed together, changed together, and fail together. It arises when a monolith is split along the wrong lines, so that a single feature change ripples across many services, every service shares a database, or synchronous call chains mean one service being down breaks all of them. You get all the operational overhead of microservices, network calls, separate deployments, distributed debugging, with none of the independence that justifies that overhead. The root cause is usually splitting by technical layer or by premature guessing rather than by genuine business boundaries that change independently. Avoiding it requires defining service boundaries around bounded contexts where the data and the rate of change are truly separable, and being honest that if two services always change together they should probably be one service. Recognizing this antipattern is a senior skill, because it is easy to declare victory on a microservices migration that has actually made everything harder.',
      },
      {
        heading: 'When to choose, and migration strategy',
        body: 'The decision should start from the organization, not the diagram: a small team shipping a young product is almost always better served by a modular monolith, while a large organization with many teams that block each other on a shared deployment is the canonical case for microservices. Traffic scale alone rarely justifies microservices, because a monolith can scale horizontally too; the deciding factor is usually whether teams need to deploy independently. When a monolith genuinely outgrows its seams, the proven migration path is the strangler fig pattern, where you incrementally route specific capabilities to new services while the monolith keeps serving the rest, gradually shrinking it rather than attempting a risky big-bang rewrite. The first services to extract should be the ones with the clearest boundaries and the strongest independent-scaling or independent-deployment need. Throughout, you keep the system shippable at every step, never breaking the running product. The mature stance is to default to a well-structured monolith and extract services deliberately, with evidence, rather than starting distributed because it is fashionable.',
      },
    ],
    diagrams: [
      {
        title: 'Monolith vs microservices',
        description: 'One deployable with in-process calls, versus many deployables communicating over the network, each with its own data.',
        type: 'comparison',
        svgContent: svg(720, 240, [
          label(20, 20, 'Monolith', { fill: 'accent', weight: 700 }),
          box(20, 35, 260, 150, 'Single process', { fill: 'cardAlt' }),
          box(45, 70, 100, 34, 'orders'),
          box(155, 70, 100, 34, 'billing'),
          box(45, 120, 100, 34, 'users'),
          box(155, 120, 100, 34, 'catalog'),
          label(45, 175, 'one DB · in-process calls', { fill: 'muted', size: 10 }),
          label(420, 20, 'Microservices', { fill: 'green', weight: 700 }),
          box(380, 40, 90, 38, 'orders', { sub: 'db' }),
          box(490, 40, 90, 38, 'billing', { sub: 'db' }),
          box(600, 40, 90, 38, 'users', { sub: 'db' }),
          box(435, 110, 90, 38, 'catalog', { sub: 'db' }),
          box(545, 110, 90, 38, 'search', { sub: 'db' }),
          arrow(470, 78, 490, 110, { stroke: 'muted', dashed: true }),
          arrow(580, 78, 545, 110, { stroke: 'muted', dashed: true }),
          label(380, 175, 'each owns its data · network calls', { fill: 'muted', size: 10 }),
        ].join('')),
      },
      {
        title: 'Strangler fig migration',
        description: 'A facade routes traffic, gradually shifting capabilities from the monolith to new services without a big-bang rewrite.',
        type: 'timeline',
        svgContent: svg(720, 180, [
          box(20, 60, 110, 44, 'Clients'),
          arrow(130, 82, 175, 82),
          box(175, 60, 110, 44, 'Routing facade', { stroke: 'accent' }),
          arrow(285, 70, 360, 50, { label: 'legacy' }),
          box(360, 30, 130, 40, 'Monolith', { fill: 'cardAlt', sub: 'shrinking' }),
          arrow(285, 94, 360, 120, { label: 'extracted' }),
          box(360, 100, 130, 40, 'orders-svc', { stroke: 'green' }),
          box(510, 100, 130, 40, 'billing-svc', { stroke: 'green' }),
          arrow(490, 120, 510, 120, { dashed: true }),
          label(360, 165, 'route more capabilities out over time → monolith disappears', { fill: 'muted', size: 10.5 }),
        ].join('')),
      },
    ],
    realWorldExamples: [
      {
        company: 'Shopify',
        problem: 'A massive Rails monolith powering an enormous commerce platform risked becoming unmaintainable as the codebase and team grew.',
        solution: 'Rather than splitting into microservices, invested in a modular monolith with enforced internal boundaries (componentization), keeping the deployment simplicity while restoring modularity.',
        outcome: 'Shopify scaled one of the largest Rails applications in the world, demonstrating that a disciplined modular monolith is a legitimate end state, not just a stepping stone.',
      },
      {
        company: 'Amazon',
        problem: 'A monolithic application and shared database created deployment bottlenecks where teams blocked each other, slowing the whole organization.',
        solution: 'Decomposed into services owned by small autonomous "two-pizza" teams, each deploying independently with its own data, aligning architecture to organization per Conway\'s Law.',
        outcome: 'Amazon achieved very high deployment frequency and team autonomy, and its service-oriented approach became foundational to AWS itself.',
      },
    ],
    codeExamples: [
      {
        language: 'typescript',
        label: 'Modular monolith with enforced boundaries',
        description: 'Modules expose narrow public interfaces and never reach into each other\'s internals, preserving the option to extract later.',
        code: `// orders/index.ts — the ONLY public surface of the orders module.
export interface OrdersModule {
  createOrder(input: CreateOrderInput): Promise<Order>;
  getOrder(id: string): Promise<Order | null>;
}

// orders/internal/* is private: other modules must not import it.
// billing depends on the interface, not the implementation.
export function makeOrdersModule(deps: OrdersDeps): OrdersModule {
  return {
    async createOrder(input) {
      const order = await deps.repo.insert(input);
      // Cross-module communication via an event, not a direct internal call —
      // this is the seam where a future microservice extraction happens.
      deps.events.emit('order.created', { orderId: order.id, total: order.total });
      return order;
    },
    getOrder: (id) => deps.repo.findById(id),
  };
}

// billing subscribes to the event, staying decoupled from orders' internals.
events.on('order.created', (e) => billing.charge(e.orderId, e.total));`,
      },
      {
        language: 'go',
        label: 'Microservice with an explicit contract',
        description: 'A service exposing a versioned, well-defined contract so it can be deployed and evolved independently.',
        code: `package orders

import (
	"context"
	"errors"
)

// Contract: the stable, versioned interface other services depend on.
type Service interface {
	CreateOrder(ctx context.Context, req CreateOrderRequest) (Order, error)
	GetOrder(ctx context.Context, id string) (Order, error)
}

var ErrNotFound = errors.New("order not found")

type service struct {
	repo      Repository
	publisher EventPublisher // async boundary to other services
}

func (s *service) CreateOrder(ctx context.Context, req CreateOrderRequest) (Order, error) {
	if req.Total <= 0 {
		return Order{}, errors.New("invalid total")
	}
	order, err := s.repo.Insert(ctx, req)
	if err != nil {
		return Order{}, err
	}
	// Publish an event; billing is a separate, independently deployed service.
	_ = s.publisher.Publish(ctx, "order.created", OrderCreated{ID: order.ID, Total: order.Total})
	return order, nil
}`,
      },
    ],
    commonMistakes: [
      'Starting with microservices for a small team and young product, paying distributed-systems tax before any benefit exists.',
      'Splitting along technical layers instead of business boundaries, producing a distributed monolith that must deploy together.',
      'Sharing a single database across services, which silently couples them and destroys independent deployability.',
      'Attempting a big-bang rewrite from monolith to microservices instead of an incremental strangler-fig migration.',
    ],
    whenNotToUse:
      'Do not adopt microservices when you have a small team, an unproven product, or unclear domain boundaries, because you cannot draw good service lines around a domain you do not yet understand, and the operational overhead will dominate. Avoid them too when your bottleneck is purely traffic that a horizontally scaled monolith handles fine, since scale alone rarely justifies the distributed complexity.',
    relatedTopics: ['event-driven-architecture', 'domain-driven-design', 'api-gateway-pattern', 'saga-pattern'],
    industryStandard: 'Martin Fowler\'s microservices writing · Conway\'s Law · Sam Newman, "Building Microservices"',
    interviewTips:
      'Lead with "it depends on team size and organizational maturity, not traffic," because the senior insight is that microservices solve a people-scaling problem more than a load problem. Name the distributed monolith antipattern explicitly, recommend defaulting to a modular monolith with an incremental strangler-fig extraction path, and tie service boundaries to bounded contexts rather than technical layers.',
  },

  // ───────────────────────────── Mobile Engineering ─────────────────────────────
  {
    id: 'ios-architecture-patterns',
    title: 'iOS Architecture Patterns',
    category: 'Mobile Engineering',
    difficulty: 'Senior',
    readTime: 12,
    summary:
      'iOS architecture has evolved from massive-view-controller MVC toward MVVM, VIPER, and unidirectional patterns like TCA. Each adds testability and clearer ownership at the cost of more structure.',
    whyItMatters:
      'On iOS the view controller is a magnet for responsibilities, and without a deliberate architecture it becomes an untestable thousand-line monster, so the pattern you choose directly determines how maintainable and testable the app is as it grows.',
    content: [
      {
        heading: 'Why MVC breaks down at scale',
        body: 'Apple\'s classic Model-View-Controller assigns models the data, views the presentation, and controllers the mediation between them, which is clean in principle but degrades badly in practice on iOS. The problem is that UIViewController straddles the view and controller roles, so it ends up owning view lifecycle, layout, navigation, networking, formatting, and business logic all at once, earning the nickname Massive View Controller. Because so much logic lives inside a class that is tightly bound to UIKit and the view lifecycle, it becomes extremely hard to unit test, since instantiating the logic means instantiating the whole view stack. The view controller also becomes a coupling hub where unrelated concerns tangle together, making changes risky and review difficult. None of this is inherent to MVC as a concept; it is a consequence of the controller having no natural place to put presentation logic that is not view code. The architectures that followed are largely attempts to give that logic a proper, testable home.',
      },
      {
        heading: 'MVVM with Combine',
        body: 'Model-View-ViewModel introduces a view model that sits between the view and the model, holding presentation logic and exposing the view\'s state as observable properties the view binds to. The view becomes thin, simply rendering whatever the view model exposes and forwarding user actions to it, while the view model contains the formatting, validation, and orchestration that used to bloat the controller. Crucially, the view model has no reference to UIKit or SwiftUI types, so it can be unit tested in isolation by setting inputs and asserting on its published outputs. Combine, Apple\'s reactive framework, makes the binding natural: the view model publishes state, and the view subscribes, so updates flow automatically without manual reloads. MVVM is the de facto industry standard on iOS today because it dramatically improves testability with a modest increase in structure. Its main risk is view models that themselves grow too large, which is mitigated by composing smaller view models or extracting services.',
      },
      {
        heading: 'VIPER and the coordinator pattern',
        body: 'VIPER splits a screen into View, Interactor, Presenter, Entity, and Router, pushing separation of concerns much further than MVVM by giving business logic, presentation logic, and navigation each their own component. The Interactor holds business logic, the Presenter prepares data for display, and the Router handles navigation, which yields highly testable, single-responsibility pieces at the cost of significant boilerplate per screen. VIPER tends to pay off for large teams and large apps where strict boundaries reduce merge conflicts and make ownership explicit, but it is often overkill for smaller apps. The coordinator pattern addresses one specific weakness across all these architectures: navigation logic that otherwise leaks into view controllers. A coordinator owns the flow between screens, so view controllers no longer know which screen comes next, which decouples them and makes flows reusable and testable. Coordinators compose well with MVVM, giving a pragmatic middle ground of testable presentation logic plus clean navigation without VIPER\'s full ceremony.',
      },
      {
        heading: 'The Composable Architecture and unidirectional flow',
        body: 'The Composable Architecture, TCA, brings the unidirectional data-flow ideas popular in web development to Swift, modeling each feature as a State, a set of Actions, and a Reducer that produces new state from an action. State changes flow in one direction, an action is sent, the reducer computes the next state, and the view re-renders, which makes behavior predictable and the entire feature exhaustively testable, including side effects modeled as values. TCA also makes composition explicit, letting you build large features from smaller ones with clear boundaries, which scales well for teams that value consistency and rigorous testing. The tradeoff is a steeper learning curve and more upfront structure than MVVM, plus a dependency on a third-party framework with its own conventions. It shines when correctness and testability are paramount and the team is willing to invest in the paradigm. The broader lesson across all these patterns is that they exist to move logic out of the view layer into testable, single-purpose units, and the right choice is the least structure that achieves the testability and clarity your app actually needs.',
      },
    ],
    diagrams: [
      {
        title: 'MVC vs MVVM data flow',
        description: 'MVVM inserts a UIKit-free view model so presentation logic becomes testable in isolation.',
        type: 'comparison',
        svgContent: svg(720, 200, [
          label(20, 20, 'MVC', { fill: 'amber', weight: 700 }),
          box(20, 40, 100, 40, 'View'),
          arrow(120, 60, 160, 60),
          box(160, 40, 140, 40, 'Controller', { sub: 'does everything', stroke: 'amber' }),
          arrow(300, 60, 340, 60),
          box(340, 40, 100, 40, 'Model'),
          label(20, 110, 'MVVM', { fill: 'green', weight: 700 }),
          box(20, 130, 100, 40, 'View', { sub: 'thin' }),
          arrow(120, 150, 160, 150, { label: 'binds' }),
          box(160, 130, 140, 40, 'ViewModel', { stroke: 'accent', sub: 'no UIKit · testable' }),
          arrow(300, 150, 340, 150),
          box(340, 130, 100, 40, 'Model'),
        ].join('')),
      },
      {
        title: 'VIPER module structure',
        description: 'Each responsibility gets its own component, maximizing testability at the cost of boilerplate.',
        type: 'architecture',
        svgContent: svg(720, 180, [
          box(40, 70, 110, 44, 'View'),
          arrow(150, 92, 200, 92),
          box(200, 70, 120, 44, 'Presenter', { stroke: 'accent' }),
          arrow(320, 80, 400, 50, { label: 'logic' }),
          box(400, 30, 120, 44, 'Interactor', { sub: 'business' }),
          arrow(320, 104, 400, 134, { label: 'navigate' }),
          box(400, 114, 120, 44, 'Router'),
          arrow(520, 52, 600, 52),
          box(600, 30, 90, 44, 'Entity', { fill: 'cardAlt' }),
        ].join('')),
      },
    ],
    realWorldExamples: [
      {
        company: 'Airbnb',
        problem: 'A large iOS app maintained by many engineers needed presentation logic that could be tested and reasoned about without spinning up the full view stack.',
        solution: 'Adopted MVVM-style separation so view models held testable presentation logic, keeping view controllers thin and reducing the massive-view-controller problem.',
        outcome: 'The team gained far more testable code and clearer ownership boundaries across a large, multi-engineer codebase.',
      },
      {
        company: 'Square',
        problem: 'Building point-of-sale and financial apps where correctness matters and many engineers touch the same screens demanded strict separation and testability.',
        solution: 'Used VIPER-style architecture with strong boundaries between view, presentation, business logic, and navigation, accepting boilerplate in exchange for isolation.',
        outcome: 'Square achieved highly testable modules with explicit ownership, reducing the risk of regressions in financial flows.',
      },
    ],
    codeExamples: [
      {
        language: 'swift',
        label: 'MVVM with Combine',
        description: 'A UIKit-free view model exposing published state, fully testable without instantiating any view.',
        code: `import Combine
import Foundation

@MainActor
final class ProfileViewModel: ObservableObject {
    enum State: Equatable { case idle, loading, loaded(String), failed(String) }

    @Published private(set) var state: State = .idle

    private let service: ProfileService
    private var cancellables = Set<AnyCancellable>()

    init(service: ProfileService) { self.service = service }

    func load(userID: String) {
        state = .loading
        Task {
            do {
                let profile = try await service.fetch(userID: userID)
                state = .loaded(profile.displayName)   // observable output
            } catch {
                state = .failed(error.localizedDescription)
            }
        }
    }
}

// The view simply binds to \`state\`; the view model has zero UIKit/SwiftUI types,
// so a test injects a fake ProfileService and asserts on the published states.`,
      },
      {
        language: 'swift',
        label: 'TCA counter feature',
        description: 'A minimal Composable Architecture feature with State, Action, and a Reducer driving unidirectional flow.',
        code: `import ComposableArchitecture

@Reducer
struct CounterFeature {
    @ObservableState
    struct State: Equatable {
        var count = 0
        var isLoading = false
    }

    enum Action {
        case increment
        case decrement
        case factButtonTapped
        case factResponse(String)
    }

    @Dependency(\\.numberFact) var numberFact

    var body: some ReducerOf<Self> {
        Reduce { state, action in
            switch action {
            case .increment:
                state.count += 1
                return .none
            case .decrement:
                state.count -= 1
                return .none
            case .factButtonTapped:
                state.isLoading = true
                // Side effects are modeled as values → exhaustively testable.
                return .run { [count = state.count] send in
                    await send(.factResponse(try await numberFact.fetch(count)))
                }
            case let .factResponse(fact):
                state.isLoading = false
                print(fact)
                return .none
            }
        }
    }
}`,
      },
    ],
    commonMistakes: [
      'Letting the view controller accumulate networking, formatting, and business logic until it is untestable (Massive View Controller).',
      'Putting navigation logic inside view controllers so screens are tightly coupled to what comes next.',
      'Adopting VIPER or TCA for a tiny app, drowning simple screens in boilerplate the app does not need.',
      'Creating view models that reference UIKit/SwiftUI types, which destroys the testability that is the whole point.',
    ],
    whenNotToUse:
      'Do not impose heavyweight architectures like VIPER or TCA on small apps or simple screens where MVC or light MVVM is perfectly maintainable; the boilerplate becomes pure overhead. Equally, do not introduce a reactive or unidirectional framework solely because it is trendy if the team lacks the appetite to learn its paradigm, since a half-understood architecture is worse than a simple one applied consistently.',
    relatedTopics: ['android-architecture-patterns', 'flutter-state-management', 'clean-architecture', 'offline-first-design'],
    industryStandard: 'Apple Human Interface & app architecture guidance · Point-Free TCA · community MVVM conventions',
    interviewTips:
      'Explain that MVVM is the industry default because it makes presentation logic testable without the view, and be specific that the view model must contain no UIKit or SwiftUI types. Show range by comparing the testability-versus-boilerplate tradeoff across MVC, MVVM, VIPER, and TCA, and mention the coordinator pattern as the clean answer to navigation, since interviewers want to see you choose the least structure that achieves the needed testability.',
  },

  // ───────────────────────────── DevOps and Deployment ─────────────────────────────
  {
    id: 'ci-cd-pipeline-design',
    title: 'CI/CD Pipeline Design',
    category: 'DevOps and Deployment',
    difficulty: 'Intermediate',
    readTime: 12,
    summary:
      'Continuous integration keeps the main branch always shippable through automated build and test on every change; continuous delivery and deployment automate the path to production. The payoff is measured by DORA metrics.',
    whyItMatters:
      'Deployment speed and safety are among the strongest predictors of engineering performance, and a well-designed pipeline turns releases from risky, infrequent events into routine, boring, reversible ones.',
    content: [
      {
        heading: 'Continuous integration practices',
        body: 'Continuous integration is the practice of merging every developer\'s work into a shared mainline frequently, ideally several times a day, with each merge automatically built and tested so that integration problems surface immediately rather than accumulating. The core discipline is that the main branch must always be in a working, shippable state, which is enforced by running the full automated test suite on every change and refusing to merge anything that breaks it. Small, frequent merges are essential because large, long-lived branches drift far from the mainline and produce painful, error-prone integrations, the exact problem CI was invented to eliminate. Fast feedback is the other pillar: if the CI pipeline takes an hour, developers context-switch and stop trusting it, so keeping the pipeline fast through parallelism and caching is itself a feature. CI also depends on a healthy test suite, since automated gates are only as trustworthy as the tests behind them. When CI is working, the team can integrate constantly with confidence, which is the foundation everything else builds on.',
      },
      {
        heading: 'Continuous delivery versus deployment',
        body: 'Continuous delivery means every change that passes the pipeline is automatically prepared and proven ready to release to production at the push of a button, while continuous deployment goes one step further and releases every passing change automatically with no human gate. The distinction matters: continuous delivery keeps a human decision point for when to release, which suits regulated environments or products that batch user-facing changes, whereas continuous deployment maximizes flow and is feasible when automated testing and observability are strong enough to trust. Both share the principle that the artifact built once in CI is the exact artifact promoted through environments, so you never rebuild between staging and production and risk a different result. The path to production is itself code, defined and version-controlled, so deployments are repeatable and auditable rather than manual and ad hoc. Achieving continuous deployment requires real confidence in the test suite, fast rollback, and good monitoring, so many teams sensibly stop at continuous delivery. The maturity ladder runs from manual releases to delivery to full deployment, and where a team should sit depends on its risk tolerance and automation maturity.',
      },
      {
        heading: 'Pipeline stages and the test pyramid',
        body: 'A typical pipeline runs as a sequence of stages, each a gate that the change must pass before proceeding, beginning with fast checks and ending with deployment. Early stages run quickly and cheaply, linting, type checking, and unit tests, so the most common failures are caught in seconds, while later stages run slower, more expensive integration and end-to-end tests. This ordering reflects the test pyramid, which prescribes many fast unit tests at the base, fewer integration tests in the middle, and a small number of end-to-end tests at the top, because end-to-end tests are slow and flaky and should verify only critical user journeys. Inverting the pyramid, relying heavily on slow end-to-end tests, produces a pipeline that is slow, flaky, and distrusted, which is a common and costly mistake. Later stages may also include security scanning, building the deployment artifact, and deploying to successive environments with automated verification at each. Designing the pipeline so failures are caught as early and cheaply as possible is what keeps both feedback fast and confidence high.',
      },
      {
        heading: 'Deployment frequency and DORA metrics',
        body: 'The research behind the DORA metrics established four measures that together capture software delivery performance: deployment frequency, lead time for changes, change failure rate, and time to restore service. Deployment frequency and lead time measure throughput, how often you ship and how quickly an idea reaches production, while change failure rate and recovery time measure stability, how often releases cause problems and how fast you recover. The crucial finding is that throughput and stability are not opposed but correlated: elite teams deploy frequently and have low failure rates and fast recovery, because small frequent changes are easier to verify and to roll back than large infrequent ones. This reframes the goal of a pipeline: shipping more often, in smaller increments, is itself a path to higher reliability, not a threat to it. Optimizing for these metrics means investing in automation, testing, and fast rollback rather than adding manual approval gates that slow delivery without improving safety. Treating deployment as a routine, automated, reversible activity is the cultural shift the metrics are really measuring.',
      },
    ],
    diagrams: [
      {
        title: 'Commit to production pipeline',
        description: 'Fast cheap checks run first; slow expensive ones run last; the same artifact is promoted, never rebuilt.',
        type: 'flow',
        svgContent: svg(720, 140, [
          box(10, 50, 90, 44, 'Commit', { stroke: 'accent' }),
          arrow(100, 72, 130, 72),
          box(130, 50, 90, 44, 'Lint+Type', { sub: 'seconds' }),
          arrow(220, 72, 250, 72),
          box(250, 50, 90, 44, 'Unit tests', { sub: 'fast' }),
          arrow(340, 72, 370, 72),
          box(370, 50, 100, 44, 'Integration', { sub: 'slower' }),
          arrow(470, 72, 500, 72),
          box(500, 50, 90, 44, 'Build', { sub: 'one artifact' }),
          arrow(590, 72, 620, 72),
          box(620, 50, 90, 44, 'Deploy', { stroke: 'green' }),
        ].join('')),
      },
      {
        title: 'The test pyramid',
        description: 'Many fast unit tests, fewer integration tests, a handful of end-to-end tests for critical journeys.',
        type: 'architecture',
        svgContent: svg(720, 220, [
          `<polygon points="360,20 480,90 240,90" fill="${SVG.PALETTE.cardAlt}" stroke="${SVG.PALETTE.red}" stroke-width="1.5"/>`,
          label(360, 60, 'E2E', { anchor: 'middle', size: 12, weight: 700 }),
          `<polygon points="240,92 480,92 560,162 160,162" fill="${SVG.PALETTE.card}" stroke="${SVG.PALETTE.amber}" stroke-width="1.5"/>`,
          label(360, 130, 'Integration', { anchor: 'middle', size: 12, weight: 700 }),
          `<polygon points="160,164 560,164 640,210 80,210" fill="${SVG.PALETTE.card}" stroke="${SVG.PALETTE.green}" stroke-width="1.5"/>`,
          label(360, 192, 'Unit (many, fast)', { anchor: 'middle', size: 12, weight: 700 }),
          label(500, 50, 'slow · flaky · few', { fill: 'muted', size: 10.5 }),
          label(560, 200, 'fast · stable · many', { fill: 'muted', size: 10.5 }),
        ].join('')),
      },
    ],
    realWorldExamples: [
      {
        company: 'Google',
        problem: 'An enormous monorepo with thousands of engineers needed to integrate and ship continuously without the mainline ever being broken.',
        solution: 'Invested heavily in automated testing, fast presubmit checks, and a culture where the main branch is always green, enabling extremely high integration and deployment rates.',
        outcome: 'Google sustains a very high deployment cadence across a massive codebase while keeping the mainline reliably shippable.',
      },
      {
        company: 'Etsy',
        problem: 'Infrequent, risky deployments made releases stressful and changes hard to attribute when something went wrong.',
        solution: 'Built a fast, heavily automated deployment pipeline enabling many deploys per day with strong monitoring, making each release small and easy to reason about.',
        outcome: 'Etsy became a widely cited example of continuous deployment, shipping dozens of times a day with low change failure rates.',
      },
    ],
    codeExamples: [
      {
        language: 'typescript',
        label: 'GitHub Actions workflow (Node)',
        description: 'A pipeline that caches dependencies, runs lint, type check, and tests in order, then builds once.',
        code: `# .github/workflows/ci.yml
name: ci
on:
  push: { branches: [main] }
  pull_request:

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'          # cache deps for fast feedback
      - run: npm ci
      - run: npm run lint        # cheapest checks first
      - run: npm run typecheck
      - run: npm test -- --coverage
      - run: npm run build       # build the artifact exactly once
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/           # promote this same artifact downstream`,
      },
      {
        language: 'python',
        label: 'CI pipeline with pytest and coverage',
        description: 'A GitHub Actions job enforcing a minimum coverage threshold as a hard gate.',
        code: `# .github/workflows/python-ci.yml
name: python-ci
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
          cache: 'pip'
      - run: pip install -r requirements.txt -r requirements-dev.txt
      - run: ruff check .                      # lint gate
      - run: mypy src                          # type gate
      - name: tests with coverage gate
        run: |
          pytest --cov=src --cov-report=term-missing \\
                 --cov-fail-under=80            # fail the build below 80%`,
      },
    ],
    commonMistakes: [
      'Letting the main branch stay broken, which defeats the entire purpose of continuous integration.',
      'Inverting the test pyramid with mostly slow end-to-end tests, producing a flaky, distrusted, slow pipeline.',
      'Rebuilding the artifact between environments instead of promoting the exact artifact tested in CI.',
      'Adding manual approval gates everywhere as a substitute for real automated tests and fast rollback.',
    ],
    whenNotToUse:
      'Full continuous deployment is inappropriate when releases require regulatory sign-off, coordinated user communication, or when the test suite and monitoring are not yet trustworthy enough to ship unattended; continuous delivery with a human gate is the right stop there. For a tiny solo prototype, an elaborate multi-stage pipeline is premature overhead that adds friction without payoff.',
    relatedTopics: ['blue-green-deployment', 'feature-flags', 'zero-downtime-deployments', 'test-driven-development'],
    industryStandard: 'DORA / "Accelerate" research · Google SRE · Continuous Delivery (Humble & Farley)',
    interviewTips:
      'Cite the four DORA metrics by name and explain the counterintuitive finding that deploying more frequently improves stability rather than harming it, because small reversible changes are safer. Distinguish continuous delivery from continuous deployment precisely, emphasize building the artifact once and promoting it, and describe the test pyramid as the way you keep the pipeline both fast and trustworthy.',
  },

  // ───────────────────────────── Code Quality ─────────────────────────────
  {
    id: 'solid-principles',
    title: 'SOLID Principles',
    category: 'Code Quality',
    difficulty: 'Intermediate',
    readTime: 13,
    summary:
      'SOLID is five object-oriented design principles that, applied together, produce code that is easier to change, test, and extend. They are guidelines for managing dependencies and responsibilities, not laws.',
    whyItMatters:
      'Most of the cost of software is in changing it after it ships, and SOLID is fundamentally about making change cheap and safe by controlling how parts of a system depend on and affect one another.',
    content: [
      {
        heading: 'Single Responsibility and Open-Closed',
        body: 'The Single Responsibility Principle states that a class should have one reason to change, meaning it should be responsible to a single actor or concern rather than mixing unrelated jobs. A class that handles parsing, business rules, and database access has three reasons to change, so a change to any one risks breaking the others, whereas splitting them isolates change and makes each piece independently testable. The Open-Closed Principle states that software entities should be open for extension but closed for modification, meaning you should be able to add new behavior without editing existing, tested code. This is typically achieved through abstraction and polymorphism: instead of a growing switch statement that you edit for every new case, you define an interface and add a new implementation, leaving the existing code untouched. Together these two principles attack the most common source of regressions, which is changing working code to accommodate something new. The practical signal that you are violating them is a class that keeps growing and a file that everyone edits for unrelated reasons.',
      },
      {
        heading: 'Liskov Substitution',
        body: 'The Liskov Substitution Principle states that objects of a subtype must be usable anywhere the supertype is expected without breaking the program\'s correctness, which is a constraint on how you design inheritance and interface implementations. A subtype must honor the contract of its parent: it must not strengthen preconditions, weaken postconditions, or throw unexpected exceptions, because code written against the parent relies on those guarantees. The classic violation is a Square that inherits from Rectangle but breaks the expectation that width and height can be set independently, so code that works for any Rectangle silently misbehaves for a Square. When a subtype cannot truly fulfill its parent\'s contract, the inheritance relationship is wrong and should be replaced by composition or a different abstraction. Violations of this principle are insidious because the code compiles and looks correct but fails at runtime in ways that depend on which concrete type is passed. Respecting it means inheritance models genuine is-a relationships with substitutable behavior, not just shared code.',
      },
      {
        heading: 'Interface Segregation',
        body: 'The Interface Segregation Principle states that clients should not be forced to depend on methods they do not use, favoring many small, focused interfaces over one large general-purpose one. A fat interface couples all its clients to all its methods, so a change to a method that one client needs forces recompilation and risk onto every other client, even those that never touch it. The classic example is a Worker interface with both work and eat methods, which forces a Robot implementation to implement eat even though robots do not eat, leading to awkward stubs or thrown exceptions. Splitting it into focused interfaces lets each implementation declare only what it genuinely supports, and each client depends only on the narrow slice it actually uses. This reduces coupling and makes the system easier to evolve, because changes ripple only to the clients that truly care. The principle is a specific application of the broader idea that smaller, more cohesive contracts produce more flexible, less brittle systems.',
      },
      {
        heading: 'Dependency Inversion and applying SOLID together',
        body: 'The Dependency Inversion Principle states that high-level modules should not depend on low-level modules; both should depend on abstractions, and abstractions should not depend on details. In practice this means your business logic should depend on an interface like a PaymentGateway rather than on a concrete StripeClient, so the concrete implementation is injected from outside and can be swapped or mocked without touching the business logic. This inversion is what makes code testable, because you can inject a fake implementation in a test, and flexible, because you can change vendors by writing a new implementation of the same interface. Dependency injection is the mechanism that delivers this principle, wiring concrete implementations into abstractions at the system\'s edges. The five principles reinforce each other: single responsibility and interface segregation keep units small and focused, open-closed and Liskov keep extension safe, and dependency inversion keeps the dependencies pointing toward stable abstractions. Applied together with judgment, they produce a codebase where new requirements are additions rather than risky edits, but applied dogmatically they produce needless abstraction, so the skill is knowing when the flexibility is worth the indirection.',
      },
    ],
    diagrams: [
      {
        title: 'Dependency Inversion: depend on abstractions',
        description: 'Business logic depends on an interface; concrete implementations are injected, so vendors swap without touching the core.',
        type: 'comparison',
        svgContent: svg(720, 200, [
          label(20, 20, 'Without DIP', { fill: 'amber', weight: 700 }),
          box(20, 40, 130, 40, 'OrderService'),
          arrow(150, 60, 200, 60, { label: 'new', stroke: 'amber' }),
          box(200, 40, 130, 40, 'StripeClient', { sub: 'concrete', stroke: 'amber' }),
          label(20, 115, 'With DIP', { fill: 'green', weight: 700 }),
          box(20, 135, 130, 40, 'OrderService'),
          arrow(150, 155, 210, 155, { label: 'depends' }),
          box(210, 135, 140, 40, 'PaymentGateway', { stroke: 'accent', sub: 'interface' }),
          arrow(350, 155, 410, 130, { dashed: true, label: 'impl' }),
          box(410, 110, 120, 40, 'StripeClient'),
          arrow(350, 165, 410, 185, { dashed: true, label: 'impl' }),
          box(410, 165, 120, 40, 'FakeGateway', { sub: 'for tests' }),
        ].join('')),
      },
      {
        title: 'Dependency injection wiring',
        description: 'Concrete implementations are constructed at the edge and injected inward, keeping the core dependent only on interfaces.',
        type: 'architecture',
        svgContent: svg(720, 170, [
          box(20, 60, 130, 44, 'main / composition', { stroke: 'accent', sub: 'edge' }),
          arrow(150, 82, 210, 82, { label: 'injects' }),
          box(210, 60, 140, 44, 'OrderService', { sub: 'high-level' }),
          arrow(350, 82, 410, 82, { label: 'uses' }),
          box(410, 60, 140, 44, 'PaymentGateway', { fill: 'cardAlt', sub: 'abstraction' }),
          arrow(480, 104, 480, 134, { dashed: true }),
          box(410, 134, 140, 30, 'StripeGateway', { sub: 'detail' }),
        ].join('')),
      },
    ],
    realWorldExamples: [
      {
        company: 'Spring Framework',
        problem: 'Enterprise Java applications were tightly coupled to concrete implementations, making them hard to test and to evolve.',
        solution: 'Built its core around dependency injection and programming to interfaces, embodying the Dependency Inversion Principle so business components depend on abstractions wired by the container.',
        outcome: 'Spring made testable, loosely coupled enterprise code the norm and became one of the most widely used frameworks in the industry.',
      },
      {
        company: 'React',
        problem: 'UI code historically mixed rendering, state, and side effects into large components that were hard to reuse and reason about.',
        solution: 'Encouraged small, single-responsibility components and composition over inheritance, with hooks extracting reusable behavior, reflecting SRP and interface-segregation-style thinking.',
        outcome: 'Component-based design with clear single responsibilities became the dominant approach to building user interfaces.',
      },
    ],
    codeExamples: [
      {
        language: 'typescript',
        label: 'SOLID refactoring (DIP + SRP)',
        description: 'Splitting responsibilities and depending on an interface so the order logic is testable and vendor-agnostic.',
        code: `// Violations: OrderService does too much AND depends on a concrete vendor.
// Refactor toward SRP + DIP.

interface PaymentGateway {
  charge(amountCents: number, token: string): Promise<{ id: string }>;
}

interface OrderRepository {
  save(order: Order): Promise<void>;
}

// High-level policy depends only on abstractions (DIP),
// and does exactly one job: orchestrate placing an order (SRP).
class OrderService {
  constructor(
    private readonly payments: PaymentGateway,
    private readonly orders: OrderRepository,
  ) {}

  async place(order: Order, token: string): Promise<string> {
    const { id } = await this.payments.charge(order.totalCents, token);
    await this.orders.save({ ...order, paymentId: id });
    return id;
  }
}

// Concrete details live at the edge and are injected.
class StripeGateway implements PaymentGateway {
  async charge(amountCents: number, token: string) {
    return { id: 'ch_' + token.slice(0, 6) }; // real Stripe call here
  }
}

// In tests, inject a fake — no network, no Stripe, fully isolated.
const service = new OrderService(new StripeGateway(), repo);`,
      },
      {
        language: 'python',
        label: 'Open-Closed via polymorphism',
        description: 'Adding a new shipping method requires a new class, not edits to existing tested code.',
        code: `from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass(frozen=True)
class Parcel:
    weight_kg: float
    distance_km: float


# Open for extension, closed for modification: add a strategy, don't edit a switch.
class ShippingRate(ABC):
    @abstractmethod
    def cost(self, parcel: Parcel) -> float: ...


class StandardRate(ShippingRate):
    def cost(self, parcel: Parcel) -> float:
        return 5 + parcel.weight_kg * 0.5


class ExpressRate(ShippingRate):
    def cost(self, parcel: Parcel) -> float:
        return 12 + parcel.weight_kg * 0.9


# Adding "OvernightRate" later means a NEW class — existing code is untouched.
def quote(parcel: Parcel, rate: ShippingRate) -> float:
    return round(rate.cost(parcel), 2)


print(quote(Parcel(2.0, 100), ExpressRate()))  # 13.8`,
      },
    ],
    commonMistakes: [
      'Treating SOLID as dogma and over-abstracting, adding interfaces and indirection for code that will never have a second implementation.',
      'Misusing inheritance in ways that violate Liskov, where a subtype cannot honor its parent\'s contract.',
      'Building fat interfaces that force implementers to stub methods they do not support.',
      'Letting one class accumulate unrelated responsibilities so every team ends up editing the same file.',
    ],
    whenNotToUse:
      'Do not apply SOLID mechanically to small scripts, prototypes, or code that genuinely has one implementation and is unlikely to change, because the abstraction overhead buys flexibility you will never use. The principles serve maintainability of evolving systems; when there is no evolution pressure, premature abstraction is itself a smell that makes simple code harder to read.',
    relatedTopics: ['clean-architecture', 'clean-code-principles', 'test-driven-development', 'domain-driven-design'],
    industryStandard: 'Robert C. Martin (Uncle Bob) · "Clean Architecture" · "Agile Software Development"',
    interviewTips:
      'Interviewers test recognition, not recitation, so prepare a concise violation-and-fix example for each letter rather than just definitions. Emphasize that SOLID exists to make change cheap by controlling dependencies, single out Dependency Inversion as the principle most tied to testability, and show maturity by acknowledging that applying these dogmatically produces needless abstraction.',
  },
  {
    id: 'reliability-availability',
    title: 'Reliability and Availability',
    category: 'System Design Fundamentals',
    difficulty: 'Intermediate',
    readTime: 12,
    summary:
      'Reliability is the probability a system performs correctly over time; availability is the fraction of time it is usable. They are related but distinct, and you design for each with different techniques.',
    whyItMatters:
      'Every minute of downtime maps directly to lost revenue, broken trust, and on-call burnout, and the difference between three nines and four nines is the difference between nine hours and fifty minutes of outage a year. Teams that cannot reason precisely about reliability set targets they cannot meet and spend money in the wrong places.',
    content: [
      {
        heading: 'Reliability versus availability',
        body: 'Reliability is the probability that a system performs its intended function correctly for a specified period under stated conditions, while availability is the proportion of time the system is in a usable state. A system can be highly available but unreliable if it stays up yet frequently returns wrong answers, and it can be reliable but unavailable if it is correct whenever it runs but is often down for maintenance. The two are measured differently: reliability is captured by metrics like mean time between failures, while availability is captured by uptime percentage over a window. Most product conversations conflate them, but engineers must separate them because the fixes differ, with reliability addressed through correctness and fault tolerance and availability addressed through redundancy and fast recovery. A useful mental model is that reliability asks "does it do the right thing" and availability asks "can I reach it right now." Designing well means stating an explicit target for each rather than vaguely promising the system will be "robust."',
      },
      {
        heading: 'The nines and what they cost',
        body: 'Availability is conventionally expressed in "nines," where 99.9 percent allows roughly 8.8 hours of downtime per year, 99.99 percent allows about 52 minutes, and 99.999 percent allows about 5 minutes. Each additional nine is roughly ten times harder and more expensive to achieve because it requires eliminating progressively rarer failure modes, from single-server crashes to entire-region outages to subtle correlated failures. The cost curve is steep: going from two nines to three might mean adding a load balancer and health checks, while going from four to five can require multi-region active-active deployments, chaos engineering, and a mature incident response organization. This is why mature teams choose the lowest number of nines the business actually needs rather than chasing five nines reflexively. The target should be derived from the cost of downtime weighed against the engineering cost of preventing it. Setting the target too high wastes money; setting it too low erodes user trust and invites churn.',
      },
      {
        heading: 'Redundancy, failover, and the limits of both',
        body: 'The primary tool for availability is redundancy: running multiple instances so that the failure of any one does not take down the service. Redundancy only helps if failover is automatic and fast, which requires health checks to detect failure and a mechanism, such as a load balancer or leader election, to route around the dead instance. Crucially, redundancy must be uncorrelated to be effective, because if two replicas share a power supply, a network switch, or a buggy deployment, they will fail together and the redundancy is an illusion. This is why cloud providers expose availability zones and regions, allowing you to place replicas in physically and logically isolated failure domains. There is a hidden cost: redundancy multiplies infrastructure spend and adds the complexity of keeping replicas consistent, which can itself introduce new failure modes. Good designs treat redundancy as a deliberate tradeoff and test failover regularly, because untested failover is failover that does not work when you need it.',
      },
      {
        heading: 'Measuring with MTBF, MTTR, and error budgets',
        body: 'Two metrics anchor reliability engineering: mean time between failures, which measures how often things break, and mean time to recovery, which measures how fast you recover when they do. Availability can be approximated as MTBF divided by the sum of MTBF and MTTR, which reveals a profound insight: you can improve availability either by failing less often or by recovering faster, and recovering faster is often cheaper and more achievable. This is why Google SRE practice emphasizes fast detection and rollback over trying to prevent every possible failure. The error budget formalizes this by treating the gap between your target and 100 percent as a quantity you are allowed to spend on risk, so a 99.9 percent target grants a budget of roughly 43 minutes of downtime per month. When the budget is healthy, teams ship aggressively; when it is exhausted, they freeze risky changes and focus on stability. This converts reliability from an emotional argument into a data-driven negotiation between velocity and stability.',
      },
    ],
    diagrams: [
      {
        title: 'Reliability is not the same as availability',
        description: 'Four quadrants: a system can be up-and-correct, up-but-wrong, down-but-correct-when-up, or simply broken.',
        type: 'comparison',
        svgContent: svg(720, 200, [
          label(360, 20, 'Availability →', { fill: 'muted', size: 11, anchor: 'middle' }),
          box(60, 40, 250, 60, 'Available + Reliable', { stroke: 'green', sub: 'the goal: up and correct' }),
          box(360, 40, 250, 60, 'Reliable, not Available', { sub: 'correct, but often down' }),
          box(60, 120, 250, 60, 'Available, not Reliable', { stroke: 'amber', sub: 'up, but returns wrong data' }),
          box(360, 120, 250, 60, 'Neither', { stroke: 'red', sub: 'down and/or wrong' }),
        ].join('')),
      },
      {
        title: 'Redundant architecture with automatic failover',
        description: 'A load balancer health-checks two zones; on failure it routes all traffic to the survivor while replication keeps state in sync.',
        type: 'architecture',
        svgContent: svg(720, 300, [
          box(300, 20, 120, 46, 'Load Balancer', { stroke: 'accent', sub: 'health checks' }),
          arrow(330, 66, 180, 110, { label: 'zone A' }),
          arrow(390, 66, 540, 110, { label: 'zone B' }),
          box(110, 110, 140, 46, 'App (AZ-1)', { fill: 'cardAlt' }),
          box(470, 110, 140, 46, 'App (AZ-2)', { fill: 'cardAlt' }),
          arrow(180, 156, 180, 210),
          arrow(540, 156, 540, 210),
          box(110, 210, 140, 46, 'DB primary', { stroke: 'green' }),
          box(470, 210, 140, 46, 'DB replica', { sub: 'sync replication' }),
          arrow(250, 233, 470, 233, { label: 'replicate', dashed: true }),
        ].join('')),
      },
    ],
    realWorldExamples: [
      {
        company: 'Amazon (S3)',
        problem: 'Provide an object store that customers can build their own businesses on top of, requiring extreme durability and high availability across massive scale.',
        solution: 'Replicate every object across multiple devices in multiple availability zones, design for eleven nines of durability, and treat availability as a separate target achieved through redundancy and automated repair.',
        outcome: 'S3 became the default storage backbone of the internet, with durability so high that data loss is effectively unheard of, demonstrating the payoff of separating durability, reliability, and availability as distinct goals.',
      },
      {
        company: 'Google (SRE error budgets)',
        problem: 'Constant tension between product teams wanting to ship features fast and SRE teams wanting stability, with no objective way to settle the argument.',
        solution: 'Introduce error budgets derived from explicit SLOs, allowing fast shipping while the budget is healthy and triggering change freezes when it is spent, turning reliability into a shared, measurable currency.',
        outcome: 'The error budget model aligned incentives across the company and became an industry-standard practice documented in the Google SRE Book.',
      },
    ],
    codeExamples: [
      {
        language: 'typescript',
        label: 'Availability and error-budget calculator',
        description: 'Compute downtime allowance from an SLO and report how much error budget remains for the month.',
        code: `interface Slo {
  readonly targetPercent: number; // e.g. 99.9
  readonly windowDays: number; // e.g. 30
}

function downtimeBudgetMinutes(slo: Slo): number {
  const totalMinutes = slo.windowDays * 24 * 60;
  const allowedFailureFraction = 1 - slo.targetPercent / 100;
  return totalMinutes * allowedFailureFraction;
}

function budgetRemaining(slo: Slo, observedDowntimeMin: number): {
  budgetMin: number;
  usedMin: number;
  remainingMin: number;
  frozen: boolean;
} {
  const budgetMin = downtimeBudgetMinutes(slo);
  const remainingMin = budgetMin - observedDowntimeMin;
  return {
    budgetMin,
    usedMin: observedDowntimeMin,
    remainingMin,
    frozen: remainingMin <= 0, // freeze risky changes when spent
  };
}

const slo: Slo = { targetPercent: 99.9, windowDays: 30 };
console.log(budgetRemaining(slo, 30));
// { budgetMin: ~43.2, usedMin: 30, remainingMin: ~13.2, frozen: false }`,
      },
      {
        language: 'go',
        label: 'Availability from MTBF and MTTR',
        description: 'Steady-state availability and the insight that faster recovery often beats fewer failures.',
        code: `package reliability

import "fmt"

// Availability returns steady-state availability from MTBF and MTTR (same unit).
func Availability(mtbf, mttr float64) float64 {
	if mtbf+mttr == 0 {
		return 0
	}
	return mtbf / (mtbf + mttr)
}

// Nines converts an availability fraction into a human "nines" string.
func Nines(a float64) string {
	switch {
	case a >= 0.99999:
		return "five nines"
	case a >= 0.9999:
		return "four nines"
	case a >= 0.999:
		return "three nines"
	default:
		return "below three nines"
	}
}

func Demo() {
	// Halving MTTR improves availability as much as doubling MTBF.
	fmt.Println(Availability(720, 1), Nines(Availability(720, 1)))
	fmt.Println(Availability(720, 0.5), Nines(Availability(720, 0.5)))
}`,
      },
    ],
    commonMistakes: [
      'Conflating availability and reliability, then fixing the wrong problem (adding replicas when the real issue is incorrect responses).',
      'Chasing five nines by default instead of deriving the target from the actual cost of downtime.',
      'Deploying redundancy with correlated failure domains, so replicas share a switch, power supply, or buggy release and die together.',
      'Never testing failover, so the standby path is broken precisely when it is finally needed.',
      'Optimizing only MTBF while ignoring MTTR, when faster recovery is usually the cheaper lever.',
    ],
    whenNotToUse:
      'Do not invest in multi-region active-active redundancy and five-nines tooling for an internal dashboard, an early-stage prototype, or any system whose downtime costs less than the engineering effort to prevent it. Over-engineering reliability burns budget and slows delivery; match the investment to the real business impact of an outage.',
    relatedTopics: ['what-is-system-design', 'scalability-horizontal-vertical', 'circuit-breaker-pattern', 'sla-slo-sli', 'disaster-recovery'],
    industryStandard: 'Google SRE Book (SLOs, error budgets) · AWS Well-Architected Reliability Pillar',
    interviewTips:
      'Open by defining reliability and availability separately and stating you would set an explicit SLO for each rather than promising vague robustness. Show that you can convert a nines target into a downtime budget on the spot, and emphasize MTTR and fast rollback as often-cheaper levers than preventing every failure. Senior signal comes from discussing correlated failure domains and from framing reliability as an error-budget negotiation between velocity and stability.',
  },

  {
    id: 'consistency-models',
    title: 'Consistency Models',
    category: 'System Design Fundamentals',
    difficulty: 'Senior',
    readTime: 13,
    summary:
      'A consistency model is the contract a distributed system makes about when and how writes become visible to reads. Choosing the right one, from strong to eventual, is among the highest-leverage design decisions you make.',
    whyItMatters:
      'The consistency model dictates whether two users can see different balances, whether a read-after-write returns your own change, and how much latency and availability you sacrifice for correctness. Pick wrong and you either build a sluggish system or ship subtle data-corruption bugs that surface only under concurrency.',
    content: [
      {
        heading: 'What a consistency model actually promises',
        body: 'A consistency model is a formal contract between a distributed datastore and its clients describing the guarantees about the visibility and ordering of operations. At one extreme, strong consistency (linearizability) promises that every read sees the most recent write as if there were a single copy of the data and operations happened in real-time order. At the other extreme, eventual consistency promises only that if writes stop, all replicas will eventually converge to the same value, with no guarantee about when or what intermediate states readers observe. Between these poles lie many useful models, including causal consistency, read-your-writes, monotonic reads, and bounded staleness, each relaxing some guarantee in exchange for lower latency or higher availability. The key realization is that these are not vague quality levels but precise contracts with defined behaviors, and reasoning about them sloppily is how concurrency bugs are born. Choosing a model means choosing exactly which anomalies your application can tolerate. The discipline is to make that choice explicitly rather than inheriting whatever the database defaults to.',
      },
      {
        heading: 'Strong consistency and its price',
        body: 'Strong consistency makes application code dramatically simpler because developers can reason as though there is a single, up-to-date copy of the data, eliminating an entire class of anomalies. The price is paid in latency and availability: to guarantee every read sees the latest write, the system must coordinate across replicas, typically via consensus protocols like Paxos or Raft that require a majority of nodes to acknowledge each write. This coordination adds round trips, so writes are slower, and under a network partition the system must refuse some operations to avoid divergence, which means it sacrifices availability. For data where correctness is non-negotiable, such as account balances, inventory counts, or unique-username enforcement, this price is worth paying. The mistake is applying strong consistency uniformly to all data, including data where a few seconds of staleness is harmless, thereby paying the coordination tax everywhere. Mature systems segment their data and apply strong consistency surgically only where invariants demand it.',
      },
      {
        heading: 'Eventual consistency and the anomalies you must handle',
        body: 'Eventual consistency trades immediate correctness for low latency and high availability, allowing each replica to accept writes and reads locally and reconcile later. This model powers globally distributed systems like DNS, shopping carts, and social feeds, where serving a slightly stale value is far better than being slow or unavailable. The catch is that your application must now tolerate anomalies: a user might not see their own recent write, two readers might see updates in different orders, or a value might appear to go backward in time. To make eventual consistency usable, systems add targeted guarantees such as read-your-writes, which ensures a user always sees their own changes, and conflict resolution strategies like last-write-wins or conflict-free replicated data types that deterministically merge concurrent updates. Without these, eventual consistency leaks confusing behavior to users. The engineering work is not avoiding eventual consistency but explicitly enumerating which anomalies are acceptable and adding just enough guarantee to mask the rest.',
      },
      {
        heading: 'Causal and session guarantees as the practical middle',
        body: 'Most real applications do not need full linearizability but cannot tolerate arbitrary eventual-consistency anomalies, so the practical sweet spot is a set of session and causal guarantees. Causal consistency ensures that operations with a cause-and-effect relationship are seen by everyone in the same order, so a reply never appears before the comment it answers, even though unrelated operations may be reordered. Session guarantees, including read-your-writes, monotonic reads, and monotonic writes, scope correctness to a single user session, which is usually exactly what users perceive as "the system working correctly." These models are cheaper than strong consistency because they do not require global coordination, yet they eliminate the most jarring anomalies. Implementing them often relies on version vectors or logical clocks to track causality between operations. The lesson is that consistency is a spectrum, and the senior move is to select the weakest model that still preserves the invariants your users actually depend on. Defaulting to either extreme without analysis is the error.',
      },
    ],
    diagrams: [
      {
        title: 'The consistency spectrum',
        description: 'Stronger models cost more latency and availability; weaker models are faster and more available but expose more anomalies.',
        type: 'comparison',
        svgContent: svg(720, 160, [
          label(20, 24, 'stronger · safer · slower', { fill: 'green', size: 11 }),
          label(700, 24, 'weaker · faster · more available', { fill: 'amber', size: 11, anchor: 'end' }),
          box(20, 50, 150, 54, 'Linearizable', { stroke: 'green', sub: 'single-copy illusion' }),
          box(190, 50, 150, 54, 'Causal', { sub: 'cause precedes effect' }),
          box(360, 50, 150, 54, 'Read-your-writes', { sub: 'session scoped' }),
          box(530, 50, 170, 54, 'Eventual', { stroke: 'amber', sub: 'converges, someday' }),
          arrow(20, 130, 700, 130, { label: 'increasing relaxation' }),
        ].join('')),
      },
      {
        title: 'Quorum reads and writes (W + R > N)',
        description: 'With N replicas, requiring write and read quorums that overlap guarantees a read sees the latest acknowledged write.',
        type: 'architecture',
        svgContent: svg(720, 260, [
          box(290, 20, 140, 46, 'Coordinator', { stroke: 'accent' }),
          arrow(310, 66, 150, 120, { label: 'W=2' }),
          arrow(360, 66, 360, 120),
          arrow(410, 66, 570, 120, { label: 'R=2' }),
          box(90, 120, 120, 46, 'Replica 1', { fill: 'cardAlt' }),
          box(300, 120, 120, 46, 'Replica 2', { fill: 'cardAlt' }),
          box(510, 120, 120, 46, 'Replica 3', { fill: 'cardAlt' }),
          label(360, 210, 'N=3 · W=2 · R=2 · W+R>N → overlap guarantees freshness', { fill: 'muted', size: 11, anchor: 'middle' }),
        ].join('')),
      },
    ],
    realWorldExamples: [
      {
        company: 'Amazon (DynamoDB)',
        problem: 'Serve a shopping cart and other high-scale workloads where availability during partitions mattered more than always returning the newest value.',
        solution: 'Offer tunable consistency with eventually consistent reads by default and optional strongly consistent reads, using quorums so applications choose their point on the spectrum per request.',
        outcome: 'DynamoDB delivered single-digit-millisecond latency at massive scale while letting teams pay for strong consistency only where they truly needed it.',
      },
      {
        company: 'Google (Spanner)',
        problem: 'Run globally distributed databases that still offer external (strong) consistency for financial and business-critical data across continents.',
        solution: 'Use the TrueTime API backed by GPS and atomic clocks to bound clock uncertainty, enabling globally linearizable transactions via Paxos with commit waits.',
        outcome: 'Spanner proved that strong consistency at global scale is achievable, at the cost of specialized infrastructure, and now underpins Google\'s most critical systems.',
      },
    ],
    codeExamples: [
      {
        language: 'typescript',
        label: 'Read-your-writes with a version token',
        description: 'A client tracks the highest version it has written so subsequent reads can require at least that freshness.',
        code: `interface Versioned<T> {
  readonly value: T;
  readonly version: number;
}

class ReadYourWritesClient<T> {
  private lastSeenVersion = 0;

  write(store: Map<string, Versioned<T>>, key: string, value: T): void {
    const current = store.get(key)?.version ?? 0;
    const next = current + 1;
    store.set(key, { value, version: next });
    this.lastSeenVersion = Math.max(this.lastSeenVersion, next);
  }

  // Returns null if the replica is too stale to honor read-your-writes.
  read(replica: Map<string, Versioned<T>>, key: string): T | null {
    const found = replica.get(key);
    if (!found || found.version < this.lastSeenVersion) {
      return null; // route to a fresher replica or wait
    }
    return found.value;
  }
}`,
      },
      {
        language: 'python',
        label: 'Quorum freshness check',
        description: 'Validate that a chosen read and write quorum overlap so reads observe the latest acknowledged write.',
        code: `from dataclasses import dataclass


@dataclass(frozen=True)
class QuorumConfig:
    replicas: int  # N
    write_quorum: int  # W
    read_quorum: int  # R

    def is_strongly_consistent(self) -> bool:
        # Overlap guarantee: W + R > N ensures a read set intersects the
        # latest write set on at least one replica.
        return self.write_quorum + self.read_quorum > self.replicas

    def tolerates_failures(self) -> int:
        # How many replica failures the write path survives.
        return self.replicas - self.write_quorum


cfg = QuorumConfig(replicas=3, write_quorum=2, read_quorum=2)
print(cfg.is_strongly_consistent())  # True
print(cfg.tolerates_failures())      # 1`,
      },
    ],
    commonMistakes: [
      'Treating consistency as a vague quality level instead of a precise contract, then debugging concurrency anomalies you never reasoned about.',
      'Applying strong consistency uniformly and paying the coordination tax on data that could tolerate staleness.',
      'Adopting eventual consistency without adding read-your-writes or conflict resolution, leaking confusing behavior to users.',
      'Assuming last-write-wins is safe when it silently discards concurrent updates and corrupts data.',
      'Ignoring clock skew when ordering events, which breaks naive timestamp-based reconciliation.',
    ],
    whenNotToUse:
      'Do not reach for strong, globally coordinated consistency when the data is naturally append-only, user-scoped, or tolerant of seconds of staleness, because you will pay latency and availability costs for a guarantee no one needs. Conversely, never settle for eventual consistency on invariants like balances or inventory where an anomaly means real money lost.',
    relatedTopics: ['cap-theorem', 'acid-transactions', 'database-sharding', 'read-replicas', 'reliability-availability'],
    industryStandard: 'Kleppmann "Designing Data-Intensive Applications" · Amazon Dynamo paper · Google Spanner paper',
    interviewTips:
      'Demonstrate that you see consistency as a spectrum by naming at least linearizable, causal, read-your-writes, and eventual, and by explaining the anomaly each one prevents. State the W + R > N quorum rule and connect strong consistency to consensus and its latency cost. The strongest candidates segment data by invariant and apply the weakest model that still protects each invariant, rather than defaulting to one extreme.',
  },

  {
    id: 'latency-vs-throughput',
    title: 'Latency vs Throughput',
    category: 'System Design Fundamentals',
    difficulty: 'Intermediate',
    readTime: 11,
    summary:
      'Latency is how long one operation takes; throughput is how many operations complete per unit time. They are different axes, often in tension, and confusing them leads to systems that are fast in benchmarks but slow under load.',
    whyItMatters:
      'Users feel latency directly while the business feels throughput in capacity and cost, and optimizing one can quietly destroy the other. Engineers who cannot separate the two tune the wrong knob, celebrate a misleading average, and get paged when tail latency explodes at peak.',
    content: [
      {
        heading: 'Two different axes',
        body: 'Latency is the time elapsed between issuing a request and receiving its response, measured in units of time like milliseconds, while throughput is the rate at which a system completes work, measured in operations per second. These are independent axes: a system can have low latency and low throughput, like a single fast worker, or high latency and high throughput, like a deeply pipelined batch system that processes millions of records but takes seconds per record end to end. The classic analogy is a highway, where latency is how long your individual car takes to travel the road and throughput is how many cars pass a point per minute, and widening the road improves throughput without making any single trip faster. Confusing the two is one of the most common analysis errors in system design. Optimizing throughput often involves batching and parallelism that increase per-request latency, while optimizing latency can reduce the batching that maximizes throughput. The first discipline is to always ask which one the requirement actually cares about.',
      },
      {
        heading: 'Why averages lie and tail latency rules',
        body: 'Reporting a single average latency is one of the most dangerous habits in performance work because averages hide the tail where real user pain lives. A service might average 20 milliseconds while its 99th percentile is 800 milliseconds, meaning one in a hundred requests is forty times slower, and at scale that fraction represents a huge number of frustrated users. Tail latency matters even more in systems that fan out, because a single user request that depends on a hundred backend calls will be as slow as the slowest of those calls, so the 99th percentile of the backend becomes the median experience of the frontend. This is why mature teams track p50, p95, p99, and p999 rather than averages, and why they invest in cutting the tail through techniques like hedged requests and timeouts. The mathematics of fan-out makes tail latency a first-class design concern, not an afterthought. Anyone reporting only a mean is hiding the part of the distribution that actually hurts.',
      },
      {
        heading: 'The tension and how to navigate it',
        body: 'Latency and throughput are frequently in direct tension because the techniques that maximize one degrade the other. Batching many operations together amortizes fixed costs and dramatically increases throughput, but it forces early requests to wait for the batch to fill, increasing their latency. Adding queues smooths load and protects throughput under bursts, but a deep queue means requests wait longer, trading latency for stability. Increasing concurrency raises throughput until contention on shared resources, like locks or a database connection pool, causes latency to spike non-linearly as the system approaches saturation. The art is choosing an operating point: interactive systems prioritize low latency and accept lower peak throughput, while data pipelines prioritize throughput and accept high latency. Little\'s Law formalizes the relationship, stating that the average number of concurrent requests equals throughput multiplied by latency, which lets you reason quantitatively about how queue depth, arrival rate, and response time interact. Understanding this law turns vague intuition into capacity math.',
      },
      {
        heading: 'Saturation, queueing, and the knee of the curve',
        body: 'Every system has a saturation point beyond which adding load no longer increases throughput and instead causes latency to climb sharply, a phenomenon visible as the "knee" in a latency-versus-load curve. Below the knee, the system has spare capacity and latency stays flat as throughput rises, but once a bottleneck resource approaches 100 percent utilization, queues form and latency grows without bound. Queueing theory explains why this happens before reaching full utilization: as utilization approaches one, expected wait time grows toward infinity, so a system running at 90 percent utilization already suffers dramatically worse latency than one at 60 percent. This is the deep reason production systems are deliberately run with headroom rather than packed to full capacity, because the last fraction of utilization is paid for in catastrophic tail latency. Recognizing the knee lets you set capacity targets and autoscaling thresholds correctly. Pushing utilization higher to save money is a false economy once you cross the knee.',
      },
    ],
    diagrams: [
      {
        title: 'The latency knee under increasing load',
        description: 'Latency stays flat while the system has headroom, then climbs sharply as a bottleneck resource saturates.',
        type: 'flow',
        svgContent: svg(720, 220, [
          arrow(60, 180, 680, 180, { label: 'throughput / load →' }),
          arrow(60, 180, 60, 30, { label: '' }),
          label(40, 30, 'latency', { fill: 'muted', size: 11, anchor: 'end' }),
          label(360, 200, 'utilization →', { fill: 'muted', size: 11, anchor: 'middle' }),
          box(120, 150, 80, 26, 'flat', { stroke: 'green' }),
          box(300, 140, 80, 26, 'rising', { stroke: 'amber' }),
          box(500, 70, 90, 26, 'the knee', { stroke: 'red' }),
          arrow(200, 163, 300, 153),
          arrow(380, 140, 500, 90),
        ].join('')),
      },
      {
        title: 'Fan-out makes p99 the median',
        description: 'One user request waits on the slowest of many backend calls, so backend tail latency dominates the user experience.',
        type: 'architecture',
        svgContent: svg(720, 240, [
          box(40, 100, 120, 46, 'User request', { stroke: 'accent' }),
          arrow(160, 123, 230, 60, { label: 'fan-out' }),
          arrow(160, 123, 230, 123),
          arrow(160, 123, 230, 186),
          box(230, 38, 150, 44, 'Service A · 10ms', { fill: 'cardAlt' }),
          box(230, 101, 150, 44, 'Service B · 12ms', { fill: 'cardAlt' }),
          box(230, 164, 150, 44, 'Service C · 800ms', { stroke: 'red', sub: 'p99 spike' }),
          arrow(380, 123, 470, 123, { label: 'wait for slowest' }),
          box(470, 100, 160, 46, 'Response ≈ 800ms', { stroke: 'red' }),
        ].join('')),
      },
    ],
    realWorldExamples: [
      {
        company: 'Google (tail at scale)',
        problem: 'Services that fan out to thousands of leaf servers were dominated by rare slow responses, making the 99.9th percentile the typical user latency.',
        solution: 'Adopt techniques like hedged requests, tied requests, and micro-partitioning to cut the tail, treating tail latency as a primary design constraint rather than an average.',
        outcome: 'These practices, published as "The Tail at Scale," became foundational guidance for building responsive large-scale services and reshaped how the industry measures latency.',
      },
      {
        company: 'Netflix',
        problem: 'Encoding and serving video at massive scale required maximizing throughput of the encoding pipeline while keeping playback start latency low for users.',
        solution: 'Separate the two concerns architecturally: batch, parallel, throughput-optimized encoding offline, and a latency-optimized CDN and adaptive-bitrate path for playback.',
        outcome: 'Netflix delivered fast start times to hundreds of millions of users while efficiently encoding an enormous catalog, by refusing to optimize both axes in the same system.',
      },
    ],
    codeExamples: [
      {
        language: 'typescript',
        label: 'Percentiles over a latency sample',
        description: 'Compute p50/p95/p99 instead of an average so the tail is visible.',
        code: `function percentile(samplesMs: number[], p: number): number {
  if (samplesMs.length === 0) return 0;
  const sorted = [...samplesMs].sort((a, b) => a - b);
  const rank = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (rank - lo);
}

function report(samplesMs: number[]): Record<string, number> {
  return {
    p50: percentile(samplesMs, 50),
    p95: percentile(samplesMs, 95),
    p99: percentile(samplesMs, 99),
    avg: samplesMs.reduce((a, b) => a + b, 0) / samplesMs.length,
  };
}

// avg can look great while p99 is catastrophic.
console.log(report([8, 9, 10, 11, 9, 10, 12, 9, 800]));`,
      },
      {
        language: 'go',
        label: 'Little\'s Law capacity check',
        description: 'Use L = λ × W to size concurrency and spot saturation before it happens.',
        code: `package capacity

import "fmt"

// ConcurrentInFlight applies Little's Law: L = throughput * latency.
// throughput in req/sec, latency in seconds, returns avg concurrent requests.
func ConcurrentInFlight(throughput, latencySec float64) float64 {
	return throughput * latencySec
}

// MaxThroughput inverts the law given a concurrency budget and target latency.
func MaxThroughput(concurrency, targetLatencySec float64) float64 {
	if targetLatencySec == 0 {
		return 0
	}
	return concurrency / targetLatencySec
}

func Demo() {
	// 2000 rps at 50ms means ~100 requests in flight on average.
	fmt.Println(ConcurrentInFlight(2000, 0.05)) // 100
	// With a pool of 100 workers and a 50ms budget, ceiling is 2000 rps.
	fmt.Println(MaxThroughput(100, 0.05)) // 2000
}`,
      },
    ],
    commonMistakes: [
      'Reporting average latency and hiding a catastrophic p99 tail that dominates the real user experience.',
      'Optimizing throughput with aggressive batching and accidentally tripling interactive latency.',
      'Running systems near 100 percent utilization to save cost, then getting paged when latency crosses the knee.',
      'Ignoring fan-out math, so backend tail latency silently becomes the frontend median.',
      'Load testing with uniform traffic and missing the bursty arrival patterns that actually cause queueing.',
    ],
    whenNotToUse:
      'Do not optimize for latency in a system whose job is bulk offline processing, where throughput and cost per record are what matter and per-item latency is irrelevant. Equally, do not chase maximum throughput in an interactive user-facing path where a fast individual response is the entire point.',
    relatedTopics: ['scalability-horizontal-vertical', 'load-balancing', 'caching-strategies', 'rate-limiting', 'auto-scaling'],
    industryStandard: 'Google "The Tail at Scale" · queueing theory (Little\'s Law) · USE/RED methods',
    interviewTips:
      'Immediately separate the two axes and ask the interviewer which one the requirement targets before optimizing anything. Reach for percentiles over averages, explain why fan-out makes p99 the effective median, and cite Little\'s Law to reason quantitatively about concurrency and saturation. Mentioning the latency knee and deliberate headroom signals that you have operated real systems rather than only benchmarked them.',
  },

  {
    id: 'load-balancing',
    title: 'Load Balancing',
    category: 'System Design Fundamentals',
    difficulty: 'Intermediate',
    readTime: 12,
    summary:
      'A load balancer distributes incoming traffic across multiple backend instances so no single server is overwhelmed, and it is the keystone that makes horizontal scaling, redundancy, and zero-downtime deploys possible.',
    whyItMatters:
      'Without a load balancer you cannot scale horizontally, survive an instance failure, or deploy without downtime, because every one of those capabilities depends on being able to route traffic away from a busy or broken server. Choosing the wrong algorithm or health-check strategy quietly concentrates load, defeats your redundancy, and turns one slow node into a site-wide outage.',
    content: [
      {
        heading: 'What a load balancer does and where it sits',
        body: 'A load balancer is a component that accepts client requests and forwards them to one of several backend servers, presenting a single stable endpoint while the pool behind it changes freely. It sits at one or more tiers of the stack: a layer 4 balancer operates on TCP/UDP and routes by IP and port without inspecting the payload, while a layer 7 balancer understands HTTP and can route by path, header, cookie, or hostname. The layer 4 approach is faster and protocol-agnostic, whereas the layer 7 approach is smarter, enabling content-based routing, TLS termination, and request rewriting at the cost of more processing per request. Modern architectures often use both, with a fast layer 4 balancer in front and layer 7 routing closer to the services. The load balancer is also where you terminate TLS, enforce connection limits, and gather the traffic metrics that drive autoscaling. Because everything flows through it, it must itself be redundant, or it becomes the single point of failure it was meant to eliminate.',
      },
      {
        heading: 'Balancing algorithms and their tradeoffs',
        body: 'The simplest algorithm is round robin, which sends each new request to the next server in rotation, and it works well when servers are identical and requests are uniform, but it ignores that some requests are far more expensive than others. Least connections routes each request to the server with the fewest active connections, which adapts better to uneven request costs because a server stuck on slow requests stops receiving new ones. Weighted variants let you bias traffic toward more powerful servers, which matters in heterogeneous fleets or during gradual rollouts. Consistent hashing routes by a key such as user ID so the same client tends to hit the same server, which is essential for cache locality and sticky workloads, and its defining property is that adding or removing a server remaps only a small fraction of keys rather than reshuffling everything. Power-of-two-choices, which samples two random servers and picks the less loaded, achieves nearly optimal balancing with very little coordination and is widely used at scale. The right algorithm depends entirely on whether your requests are uniform, your servers are identical, and your workload benefits from locality.',
      },
      {
        heading: 'Health checks and graceful failure',
        body: 'A load balancer is only as good as its health checks, because routing traffic to a dead or degraded server is worse than having one fewer server. Active health checks periodically probe each backend on a dedicated endpoint and remove failing instances from rotation, while passive health checks observe real traffic and eject a server after it returns errors or times out. The subtlety is designing the health endpoint to reflect real readiness: a check that only confirms the process is alive will keep routing to a server whose database connection has died, so good checks verify critical dependencies without being so strict that a transient blip ejects a healthy node. Equally important is graceful handling of intentional removal, where a deploying server should stop receiving new connections but finish in-flight requests, a pattern called connection draining. Without draining, every deploy drops a burst of requests. Health checking and draining together are what convert a pool of servers into a system that tolerates failure and deploys invisibly.',
      },
      {
        heading: 'Stickiness, statelessness, and avoiding hot spots',
        body: 'Load balancing works cleanly when backends are stateless, meaning any server can handle any request because session state lives in a shared store rather than in server memory. When applications keep session state locally, you are forced into sticky sessions that pin a user to one server, which undermines balancing because load can no longer move freely and a server failure logs out everyone pinned to it. The better pattern is to externalize state into a cache or database so the balancer is free to route anywhere, which is why statelessness is a precondition for elastic scaling. Hot spots are the other failure mode, arising when a hashing scheme or a popular key concentrates disproportionate load on one server, and they are mitigated by better key distribution, ephemeral replication of hot items, or randomized tie-breaking. The deeper principle is that a load balancer cannot fix an architecture that resists being balanced, so the design work is making the backends genuinely interchangeable. Once they are, the balancer delivers scaling, redundancy, and smooth deploys almost for free.',
      },
    ],
    diagrams: [
      {
        title: 'Layer 4 versus layer 7 routing',
        description: 'Layer 4 routes by IP/port without reading the payload; layer 7 understands HTTP and routes by path, header, or cookie.',
        type: 'comparison',
        svgContent: svg(720, 200, [
          box(40, 30, 280, 70, 'Layer 4 (transport)', { sub: 'fast · IP/port · protocol-agnostic', stroke: 'accent' }),
          box(400, 30, 280, 70, 'Layer 7 (application)', { sub: 'smart · path/header/cookie · TLS term', stroke: 'purple' }),
          box(40, 120, 130, 50, 'TCP/UDP only'),
          box(190, 120, 130, 50, 'No payload read'),
          box(400, 120, 130, 50, 'Content routing'),
          box(550, 120, 130, 50, 'Rewrite/redirect'),
        ].join('')),
      },
      {
        title: 'Redundant load balancer with health-checked pool',
        description: 'A pair of balancers (active/standby) front a pool; failing nodes are drained and removed while replicas absorb load.',
        type: 'architecture',
        svgContent: svg(720, 300, [
          box(40, 120, 110, 46, 'Clients', { fill: 'cardAlt' }),
          arrow(150, 143, 240, 143),
          box(240, 100, 130, 46, 'LB active', { stroke: 'accent' }),
          box(240, 160, 130, 46, 'LB standby', { sub: 'failover', stroke: 'amber' }),
          arrow(370, 123, 470, 60, { label: 'healthy' }),
          arrow(370, 123, 470, 123, { label: 'healthy' }),
          arrow(370, 143, 470, 200, { label: 'draining', dashed: true }),
          box(470, 38, 150, 44, 'Server 1 ✓', { stroke: 'green' }),
          box(470, 101, 150, 44, 'Server 2 ✓', { stroke: 'green' }),
          box(470, 178, 150, 44, 'Server 3 ⟳', { sub: 'drain + redeploy', stroke: 'amber' }),
        ].join('')),
      },
    ],
    realWorldExamples: [
      {
        company: 'Google (Maglev)',
        problem: 'Balance enormous traffic across servers using commodity hardware while surviving the failure of individual balancers without dropping connections.',
        solution: 'Build Maglev, a software network load balancer using consistent hashing and connection tracking so that even as the set of balancers changes, existing flows keep landing on the same backend.',
        outcome: 'Maglev delivered high throughput on commodity machines and influenced a generation of software load balancers, proving balancing could be done in software at Google scale.',
      },
      {
        company: 'AWS (Elastic Load Balancing)',
        problem: 'Give customers a managed balancer that scales itself, integrates health checks, and supports both fast layer 4 and feature-rich layer 7 routing.',
        solution: 'Offer Network Load Balancers for layer 4 and Application Load Balancers for layer 7, with built-in autoscaling, health checks, connection draining, and TLS termination.',
        outcome: 'Teams gained production-grade balancing without operating it themselves, making horizontal scaling and zero-downtime deploys the default rather than a project.',
      },
    ],
    codeExamples: [
      {
        language: 'typescript',
        label: 'Least-connections balancer',
        description: 'A minimal balancer that routes to the backend with the fewest in-flight requests and tracks completion.',
        code: `interface Backend {
  readonly id: string;
  active: number;
  healthy: boolean;
}

class LeastConnections {
  constructor(private readonly backends: Backend[]) {}

  pick(): Backend | null {
    const candidates = this.backends.filter((b) => b.healthy);
    if (candidates.length === 0) return null;
    return candidates.reduce((best, b) =>
      b.active < best.active ? b : best,
    );
  }

  async route<T>(fn: (b: Backend) => Promise<T>): Promise<T> {
    const b = this.pick();
    if (!b) throw new Error('no healthy backends');
    b.active += 1;
    try {
      return await fn(b);
    } finally {
      b.active -= 1; // release the slot whether it succeeded or failed
    }
  }
}`,
      },
      {
        language: 'go',
        label: 'Consistent hashing ring',
        description: 'A hash ring so adding or removing a node remaps only a small fraction of keys, preserving cache locality.',
        code: `package lb

import (
	"hash/crc32"
	"sort"
)

type Ring struct {
	points  []uint32
	owners  map[uint32]string
	virtual int
}

func NewRing(nodes []string, virtual int) *Ring {
	r := &Ring{owners: map[uint32]string{}, virtual: virtual}
	for _, n := range nodes {
		for i := 0; i < virtual; i++ {
			h := crc32.ChecksumIEEE([]byte(n + string(rune(i))))
			r.points = append(r.points, h)
			r.owners[h] = n
		}
	}
	sort.Slice(r.points, func(i, j int) bool { return r.points[i] < r.points[j] })
	return r
}

// Get returns the node that owns the given key on the ring.
func (r *Ring) Get(key string) string {
	if len(r.points) == 0 {
		return ""
	}
	h := crc32.ChecksumIEEE([]byte(key))
	idx := sort.Search(len(r.points), func(i int) bool { return r.points[i] >= h })
	if idx == len(r.points) {
		idx = 0 // wrap around the ring
	}
	return r.owners[r.points[idx]]
}`,
      },
    ],
    commonMistakes: [
      'Using round robin when request costs are wildly uneven, so a few expensive requests pile onto one server.',
      'Writing a health check that only confirms the process is alive while its database connection is dead.',
      'Deploying without connection draining, dropping a burst of in-flight requests on every release.',
      'Relying on sticky sessions because state lives in server memory, which defeats balancing and breaks on failure.',
      'Forgetting to make the load balancer itself redundant, recreating the single point of failure it was meant to remove.',
    ],
    whenNotToUse:
      'A load balancer adds little for a single-instance service with no availability target, an internal tool with trivial traffic, or a system already fronted by a managed platform that balances for you. Adding one prematurely introduces an extra hop, extra failure surface, and operational cost without a scaling or redundancy problem to solve.',
    relatedTopics: ['scalability-horizontal-vertical', 'reliability-availability', 'load-balancer-types', 'auto-scaling', 'rate-limiting'],
    industryStandard: 'Google Maglev paper · AWS ELB (NLB/ALB) · NGINX and HAProxy · Envoy proxy',
    interviewTips:
      'Distinguish layer 4 from layer 7 early and tie each algorithm to the workload it suits, especially least-connections for uneven costs and consistent hashing for cache locality. Volunteer health checks, connection draining, and load-balancer redundancy unprompted, since omitting them is a classic miss. The senior signal is explaining that balancing presupposes stateless, interchangeable backends and that statelessness is the real design work.',
  },

  {
    id: 'content-delivery-networks',
    title: 'Content Delivery Networks',
    category: 'System Design Fundamentals',
    difficulty: 'Intermediate',
    readTime: 11,
    summary:
      'A CDN is a globally distributed network of edge servers that cache content close to users, cutting latency, absorbing traffic spikes, and shielding your origin from load.',
    whyItMatters:
      'The speed of light is a hard limit, so a user in Sydney fetching from a server in Virginia pays an unavoidable round-trip penalty that no amount of backend optimization can erase. A CDN moves content to within tens of milliseconds of every user, which is often the single largest latency win available, while also absorbing traffic that would otherwise crush the origin.',
    content: [
      {
        heading: 'Why geography is a performance problem',
        body: 'Network latency is bounded by physics: light in fiber travels roughly two-thirds the speed of light in a vacuum, so a round trip between continents costs well over a hundred milliseconds no matter how fast your servers are. For a page that makes many sequential requests, this geographic latency compounds into seconds of delay for distant users, which directly harms engagement and conversion. A CDN attacks this by placing edge servers, called points of presence, in hundreds of locations worldwide, so a user fetches cached content from a nearby edge instead of crossing the planet to your origin. The first request to an edge may miss the cache and fetch from origin, but every subsequent request for that content is served locally at a fraction of the latency. This is why static assets like images, scripts, stylesheets, and videos are almost always served through a CDN. The performance gain comes purely from shortening the physical distance data must travel, which is otherwise immovable.',
      },
      {
        heading: 'Caching, TTLs, and cache keys',
        body: 'A CDN decides what to cache and for how long using cache-control headers from your origin, where the TTL sets how long an edge may serve a cached copy before revalidating. Choosing TTLs is a balance: long TTLs maximize cache hit ratio and offload the origin but risk serving stale content, while short TTLs keep content fresh but increase origin traffic. The cache key determines what counts as the same object, and getting it wrong is a common source of bugs, because including unnecessary query parameters or headers in the key fragments the cache and tanks the hit ratio, while excluding important ones serves the wrong variant to users. For content that changes, the standard technique is cache busting through versioned URLs, where a content hash in the filename means a new version is a new URL that cannot collide with the old cached copy. This lets you set effectively infinite TTLs on immutable assets while still deploying changes instantly. Thoughtful cache keys and versioning are what separate a CDN that offloads ninety-five percent of traffic from one that barely helps.',
      },
      {
        heading: 'Static, dynamic, and edge compute',
        body: 'CDNs began by caching static content, but modern CDNs also accelerate dynamic and personalized responses through several mechanisms. Even uncacheable dynamic requests benefit because the CDN maintains warm, optimized connections to the origin and routes over its private backbone, avoiding the slow and congested public internet for the long-haul segment. Techniques like edge-side includes let a page be assembled from cacheable fragments and a small dynamic part, so most of the response is still served from the edge. The frontier is edge compute, where the CDN runs your code in its points of presence, allowing personalization, authentication, A/B testing, and even full applications to execute close to users rather than at a distant origin. This collapses the distinction between CDN and compute platform and pushes logic to the edge where latency is lowest. The progression from static caching to dynamic acceleration to edge compute reflects a steady migration of work outward toward the user. Each step trades some centralization for dramatically lower latency.',
      },
      {
        heading: 'Origin shielding, invalidation, and resilience',
        body: 'A CDN protects the origin not only by caching but by acting as a shock absorber during traffic spikes and attacks, since a flash crowd or a volumetric DDoS hits the distributed edge rather than your single origin. Origin shielding adds a designated mid-tier cache so that on a cache miss, many edges funnel through one shield rather than all stampeding the origin simultaneously, preventing the thundering-herd effect. Invalidation is the hard problem, captured by the adage that cache invalidation is one of the two hard things in computing, because purging content across hundreds of edges takes time and must be deliberate, which is why versioned URLs are preferred over active purges whenever possible. A well-configured CDN also improves resilience by serving stale content when the origin is down, keeping a site partially functional during an outage. The combination of distribution, shielding, and stale-on-error means a CDN is a reliability tool as much as a performance one. Treating it purely as a speed optimization undersells what it does for availability.',
      },
    ],
    diagrams: [
      {
        title: 'Edge cache hit versus origin fetch',
        description: 'A nearby edge serves cached content in milliseconds; only a cache miss travels the long distance to origin.',
        type: 'flow',
        svgContent: svg(720, 200, [
          box(20, 80, 110, 50, 'User (Sydney)', { fill: 'cardAlt' }),
          arrow(130, 95, 220, 95, { label: 'hit · ~15ms' }),
          box(220, 75, 120, 50, 'Edge PoP', { stroke: 'green' }),
          arrow(340, 110, 540, 110, { label: 'miss · ~160ms', dashed: true }),
          box(540, 80, 150, 50, 'Origin (Virginia)', { stroke: 'amber' }),
          label(280, 160, 'most requests stop at the edge', { fill: 'muted', size: 11, anchor: 'middle' }),
        ].join('')),
      },
      {
        title: 'CDN topology with origin shield',
        description: 'Many edges fan into a shield tier so a cache miss does not stampede the origin.',
        type: 'architecture',
        svgContent: svg(720, 280, [
          box(40, 40, 120, 40, 'Edge · US', { fill: 'cardAlt' }),
          box(40, 110, 120, 40, 'Edge · EU', { fill: 'cardAlt' }),
          box(40, 180, 120, 40, 'Edge · APAC', { fill: 'cardAlt' }),
          arrow(160, 60, 300, 120),
          arrow(160, 130, 300, 130),
          arrow(160, 200, 300, 140),
          box(300, 110, 140, 46, 'Origin shield', { stroke: 'accent', sub: 'mid-tier cache' }),
          arrow(440, 133, 560, 133, { label: 'single miss' }),
          box(560, 110, 130, 46, 'Origin', { stroke: 'amber' }),
        ].join('')),
      },
    ],
    realWorldExamples: [
      {
        company: 'Netflix (Open Connect)',
        problem: 'Stream a huge fraction of global internet video traffic without saturating transit links or paying ruinous bandwidth costs to distant origins.',
        solution: 'Build Open Connect, placing custom caching appliances directly inside internet service provider networks so popular content is served from within the user\'s own ISP.',
        outcome: 'The vast majority of Netflix traffic is served from these local caches, slashing latency and transit cost while keeping playback smooth at global scale.',
      },
      {
        company: 'Cloudflare',
        problem: 'Protect and accelerate millions of websites, including absorbing massive DDoS attacks that would overwhelm any single origin.',
        solution: 'Operate a global anycast network where every edge can serve any site, caching content and filtering attack traffic at the edge before it ever reaches the origin.',
        outcome: 'Sites gained both speed and the ability to survive enormous attacks, and Cloudflare extended the edge into a compute platform with Workers.',
      },
    ],
    codeExamples: [
      {
        language: 'typescript',
        label: 'Cache-control and versioned URLs',
        description: 'Set aggressive caching on immutable, content-hashed assets and short revalidation on HTML.',
        code: `import { createHash } from 'node:crypto';

// Immutable assets get a content hash in the URL, so a change is a new URL.
function versionedAssetUrl(path: string, bytes: Buffer): string {
  const hash = createHash('sha1').update(bytes).digest('hex').slice(0, 8);
  return \`/static/\${path}?v=\${hash}\`;
}

function cacheControlFor(kind: 'immutable' | 'html'): string {
  switch (kind) {
    case 'immutable':
      // Safe to cache forever because the URL changes when content changes.
      return 'public, max-age=31536000, immutable';
    case 'html':
      // Always revalidate so deploys are visible immediately.
      return 'public, no-cache';
  }
}

console.log(cacheControlFor('immutable'));
console.log(versionedAssetUrl('app.js', Buffer.from('console.log(1)')));`,
      },
      {
        language: 'python',
        label: 'Cache hit ratio and origin offload',
        description: 'Quantify how much a given hit ratio reduces origin traffic, which justifies TTL choices.',
        code: `from dataclasses import dataclass


@dataclass(frozen=True)
class CdnTraffic:
    total_requests: int
    edge_hits: int

    def hit_ratio(self) -> float:
        if self.total_requests == 0:
            return 0.0
        return self.edge_hits / self.total_requests

    def origin_requests(self) -> int:
        return self.total_requests - self.edge_hits

    def offload_percent(self) -> float:
        return self.hit_ratio() * 100


t = CdnTraffic(total_requests=1_000_000, edge_hits=970_000)
print(f"hit ratio: {t.hit_ratio():.3f}")
print(f"origin sees only: {t.origin_requests():,} requests")
print(f"offloaded: {t.offload_percent():.1f}%")`,
      },
    ],
    commonMistakes: [
      'Including volatile query parameters in the cache key, fragmenting the cache and destroying the hit ratio.',
      'Setting long TTLs on mutable URLs instead of using content-hashed versioned URLs, then fighting stale content.',
      'Relying on active purges for every change when versioned URLs would make invalidation unnecessary.',
      'Forgetting origin shielding, so a popular cache miss stampedes the origin with a thundering herd.',
      'Caching personalized or authenticated responses without a Vary or proper key, leaking one user\'s data to another.',
    ],
    whenNotToUse:
      'A CDN adds little for a purely internal application whose users sit beside the origin, for highly dynamic per-request data that is never cacheable, or for tiny traffic volumes where the configuration overhead outweighs the benefit. In those cases the extra layer and cache-correctness risk are not justified by any latency or offload gain.',
    relatedTopics: ['caching-strategies', 'latency-vs-throughput', 'ddos-protection', 'multi-region-architecture', 'load-balancing'],
    industryStandard: 'Akamai, Cloudflare, Fastly, AWS CloudFront · Netflix Open Connect · RFC 9111 (HTTP caching)',
    interviewTips:
      'Anchor the value of a CDN in the speed of light so the interviewer sees you understand why backend tuning cannot fix geographic latency. Discuss TTLs, cache keys, and content-hashed versioned URLs as the levers for hit ratio, and raise origin shielding and stale-on-error to show you see the CDN as a reliability tool. Mentioning edge compute as the next step signals current knowledge.',
  },

  {
    id: 'message-queues-event-streaming',
    title: 'Message Queues and Event Streaming',
    category: 'System Design Fundamentals',
    difficulty: 'Senior',
    readTime: 13,
    summary:
      'Message queues and event streams decouple producers from consumers, letting systems absorb bursts, process work asynchronously, and communicate through durable logs rather than fragile synchronous calls.',
    whyItMatters:
      'Synchronous calls couple the availability and speed of every service in a chain, so one slow dependency stalls the whole request. Queues and streams break that coupling, turning a brittle web of direct calls into resilient, buffered, independently scalable pipelines, which is why they sit at the heart of nearly every large system.',
    content: [
      {
        heading: 'Why asynchronous messaging exists',
        body: 'When one service calls another synchronously, the caller is blocked until the callee responds, which means the caller inherits the callee\'s latency and fails whenever the callee is down, coupling their fates tightly. A message queue breaks this coupling by letting the producer hand off a message and move on, while a consumer processes it whenever it is ready, so a temporary spike or outage in the consumer becomes a growing queue rather than a cascade of failures. This buffering is the core value: the queue absorbs bursts, smoothing a spiky arrival rate into a steady processing rate the consumer can sustain. Asynchronous messaging also enables work that should not block the user, such as sending email, generating thumbnails, or updating search indexes, to happen out of band after a fast response is returned. The tradeoff is added complexity and eventual rather than immediate consistency, because the work completes later. Choosing async messaging means accepting that decoupling and resilience are worth the loss of a simple, immediate request-response model.',
      },
      {
        heading: 'Queues versus logs: the fundamental distinction',
        body: 'There are two different abstractions often lumped together, and confusing them is a frequent design error. A traditional message queue, like RabbitMQ or SQS, treats messages as transient work items: a message is delivered to one consumer, acknowledged, and then deleted, making it ideal for distributing tasks among workers. An event log, like Apache Kafka, treats messages as a durable, append-only, replayable sequence: messages are retained for a configured period, multiple independent consumer groups can each read the whole stream at their own pace, and a consumer can rewind to reprocess history. The queue model is about getting work done once by some worker, while the log model is about broadcasting an immutable history of events that many consumers interpret independently. This distinction drives architecture: use a queue to fan work out to a pool, and use a log when multiple systems need the same events or when replay and ordering matter. Picking the wrong one leads to painful workarounds, such as trying to get replay out of a delete-on-ack queue.',
      },
      {
        heading: 'Delivery guarantees and idempotency',
        body: 'Messaging systems offer different delivery semantics, and understanding them is essential because each forces a different consumer design. At-most-once delivery may lose messages but never duplicates them, which is rarely acceptable for important work. At-least-once delivery, the common default, guarantees a message is delivered but may deliver it more than once, for example when a consumer crashes after processing but before acknowledging. Exactly-once delivery is the ideal but is extremely hard end to end and is usually approximated through at-least-once delivery combined with idempotent consumers that can safely process the same message twice. This is why idempotency is the constant companion of messaging: because duplicates are a fact of life, consumers must be designed so that reprocessing a message produces the same result, typically by tracking processed message IDs or making operations naturally idempotent. Ordering is a related concern, since most systems only guarantee ordering within a partition, not globally. Designing consumers to tolerate duplicates and partial ordering is the difference between a robust pipeline and one that silently corrupts data.',
      },
      {
        heading: 'Dead letter queues, backpressure, and operational reality',
        body: 'A production messaging system must handle messages that cannot be processed, or a single poison message will block a partition forever as the consumer retries it endlessly. The dead letter queue is the standard answer: after a configured number of failed attempts, the message is moved aside for inspection rather than retried infinitely, keeping the main pipeline flowing. Backpressure is the other operational reality, because if producers persistently outpace consumers the queue grows without bound until it exhausts storage, so systems must either scale consumers, slow producers, or shed load deliberately. Monitoring consumer lag, the gap between the newest message and the consumer\'s position, is the single most important signal of pipeline health, since rising lag is the early warning of an overwhelmed consumer. Operationally, you also tune batching, prefetch limits, and retention to balance throughput against latency and storage cost. These concerns, dead lettering, backpressure, and lag monitoring, are where messaging architectures succeed or fail in practice. A design that ignores them works in a demo and collapses in production.',
      },
    ],
    diagrams: [
      {
        title: 'Queue (work) versus log (events)',
        description: 'A queue deletes after one worker acks; a log retains events for many independent consumer groups to replay.',
        type: 'comparison',
        svgContent: svg(720, 220, [
          box(30, 30, 300, 40, 'Message Queue', { stroke: 'accent', sub: 'one consumer · delete on ack' }),
          box(30, 90, 90, 40, 'Producer'),
          arrow(120, 110, 170, 110),
          box(170, 90, 70, 40, 'Queue'),
          arrow(240, 110, 290, 110),
          box(290, 90, 40, 40, 'W'),
          box(390, 30, 300, 40, 'Event Log', { stroke: 'purple', sub: 'retained · many groups · replay' }),
          box(390, 90, 90, 40, 'Producer'),
          arrow(480, 110, 520, 110),
          box(520, 90, 60, 40, 'Log'),
          arrow(580, 100, 630, 80, { label: 'g1' }),
          arrow(580, 120, 630, 140, { label: 'g2' }),
          box(630, 60, 60, 36, 'Group A'),
          box(630, 124, 60, 36, 'Group B'),
        ].join('')),
      },
      {
        title: 'Async pipeline with dead letter queue',
        description: 'Producers enqueue, workers process at their own rate, and poison messages divert to a DLQ after retries.',
        type: 'architecture',
        svgContent: svg(720, 260, [
          box(30, 100, 110, 46, 'API (producer)', { stroke: 'accent' }),
          arrow(140, 123, 230, 123, { label: 'enqueue' }),
          box(230, 100, 110, 46, 'Topic / Queue', { fill: 'cardAlt' }),
          arrow(340, 110, 440, 70, { label: 'consume' }),
          arrow(340, 130, 440, 150, { label: 'consume' }),
          box(440, 50, 120, 40, 'Worker 1'),
          box(440, 130, 120, 40, 'Worker 2'),
          arrow(500, 170, 500, 215, { label: 'N fails', dashed: true }),
          box(430, 215, 140, 40, 'Dead Letter Queue', { stroke: 'red' }),
        ].join('')),
      },
    ],
    realWorldExamples: [
      {
        company: 'LinkedIn (Kafka)',
        problem: 'Move enormous volumes of activity and metric events between many systems without a tangle of brittle point-to-point integrations.',
        solution: 'Create Kafka, a distributed, partitioned, replayable commit log where producers publish events once and any number of consumer groups subscribe independently.',
        outcome: 'Kafka became the central nervous system for LinkedIn and then an industry-standard streaming platform powering pipelines at thousands of companies.',
      },
      {
        company: 'Uber',
        problem: 'Coordinate trips, pricing, and notifications across many services where synchronous coupling would make the system fragile under spikes.',
        solution: 'Adopt event-driven messaging extensively, using Kafka-based streams to decouple services so each can scale and fail independently while reacting to a shared event flow.',
        outcome: 'Uber handled massive, spiky real-time workloads with services that absorb bursts through queues instead of cascading failures across synchronous calls.',
      },
    ],
    codeExamples: [
      {
        language: 'typescript',
        label: 'Idempotent at-least-once consumer',
        description: 'Deduplicate by message ID so reprocessing a redelivered message is safe.',
        code: `interface Message {
  readonly id: string;
  readonly payload: unknown;
}

class IdempotentConsumer {
  private readonly processed = new Set<string>();

  constructor(private readonly handle: (m: Message) => Promise<void>) {}

  async consume(m: Message): Promise<'processed' | 'duplicate'> {
    if (this.processed.has(m.id)) {
      return 'duplicate'; // at-least-once means duplicates are normal
    }
    await this.handle(m);
    // Mark only after success so a crash mid-handle retries cleanly.
    this.processed.add(m.id);
    return 'processed';
  }
}`,
      },
      {
        language: 'python',
        label: 'Consumer lag and backpressure check',
        description: 'Track lag between latest offset and committed offset to decide when to scale consumers.',
        code: `from dataclasses import dataclass


@dataclass(frozen=True)
class PartitionLag:
    latest_offset: int
    committed_offset: int
    throughput_per_sec: int  # messages a consumer drains per second

    def lag(self) -> int:
        return max(0, self.latest_offset - self.committed_offset)

    def seconds_to_drain(self) -> float:
        if self.throughput_per_sec == 0:
            return float("inf")
        return self.lag() / self.throughput_per_sec

    def needs_scale_out(self, sla_seconds: float) -> bool:
        return self.seconds_to_drain() > sla_seconds


p = PartitionLag(latest_offset=1_000_000, committed_offset=940_000, throughput_per_sec=5000)
print("lag:", p.lag())
print("drain in:", p.seconds_to_drain(), "s")
print("scale out?", p.needs_scale_out(sla_seconds=10))`,
      },
    ],
    commonMistakes: [
      'Choosing a delete-on-ack queue when the system actually needs replay and multiple independent consumers, then bolting on hacks.',
      'Assuming exactly-once delivery and building consumers that corrupt data when a message is inevitably redelivered.',
      'Omitting a dead letter queue, so one poison message blocks a partition and stalls the whole pipeline.',
      'Ignoring consumer lag until the queue exhausts storage, instead of monitoring it as the primary health signal.',
      'Expecting global ordering when the system only guarantees ordering within a partition.',
    ],
    whenNotToUse:
      'Do not introduce a queue for an operation that genuinely needs a synchronous, immediate answer, such as validating a login or returning a price the user is waiting on, because async messaging trades immediacy for decoupling. For small systems with low traffic and no burst problem, a direct call is simpler and the operational weight of a broker is not yet justified.',
    relatedTopics: ['event-driven-architecture', 'idempotency', 'saga-pattern', 'retry-backoff', 'consistency-models'],
    industryStandard: 'Apache Kafka · RabbitMQ · AWS SQS/SNS · Google Pub/Sub · CNCF CloudEvents',
    interviewTips:
      'Lead by distinguishing a delete-on-ack queue from a retained, replayable log, because picking the right abstraction is the core decision interviewers probe. State that you design for at-least-once delivery with idempotent consumers rather than assuming exactly-once, and bring up dead letter queues and consumer lag to prove operational maturity. The strongest answers tie messaging back to decoupling availability and absorbing bursts, not just to background jobs.',
  },

  {
    id: 'rate-limiting',
    title: 'Rate Limiting',
    category: 'System Design Fundamentals',
    difficulty: 'Intermediate',
    readTime: 12,
    summary:
      'Rate limiting caps how many requests a client can make in a window, protecting your system from abuse, runaway clients, and accidental overload while enforcing fair usage and cost control.',
    whyItMatters:
      'A single misbehaving client, a retry storm, or a deliberate attack can exhaust your capacity and take the service down for everyone. Rate limiting is the guardrail that converts unbounded demand into a bounded, survivable load, and it is also how APIs enforce pricing tiers and fair sharing among tenants.',
    content: [
      {
        heading: 'What rate limiting protects against',
        body: 'Rate limiting restricts the number of operations a given client can perform within a time window, and it exists because demand on a shared service is fundamentally unbounded while capacity is finite. Without it, a single buggy client stuck in a tight loop, a thundering herd of retries after an outage, or a malicious actor can consume all available capacity and degrade the service for every legitimate user. Beyond protection, rate limiting enforces fairness in multi-tenant systems so that one heavy customer cannot starve others, and it underpins commercial models where different plans grant different quotas. It also provides a cost ceiling, which matters enormously when each request triggers expensive downstream work like a database query or an AI model invocation. Crucially, rate limiting is a blunt but reliable tool: it does not make the system faster, it makes the system survivable by refusing excess load deterministically rather than collapsing under it. Treating it as a first-class part of any public-facing API is a mark of operational maturity.',
      },
      {
        heading: 'The core algorithms',
        body: 'The fixed window counter is the simplest algorithm, counting requests per calendar window and resetting at the boundary, but it suffers from a burst problem where a client can send a full window of requests at the end of one window and another full window at the start of the next, briefly doubling the intended rate. The sliding window log fixes this by tracking timestamps of recent requests and counting those within the trailing window, giving precise limits at the cost of storing every timestamp. The token bucket is the most widely used algorithm because it elegantly allows controlled bursts: tokens refill at a steady rate up to a maximum, each request consumes a token, and a request is rejected when the bucket is empty, so a client can burst up to the bucket size but is throttled to the refill rate over time. The leaky bucket is its conceptual sibling, processing requests at a constant output rate regardless of input bursts, which smooths traffic but does not allow bursts through. Choosing among them is a tradeoff between accuracy, memory cost, and whether you want to permit short bursts, with token bucket being the pragmatic default for most APIs.',
      },
      {
        heading: 'Distributed rate limiting and its hard parts',
        body: 'Rate limiting on a single server is trivial because all state lives in local memory, but real systems run many servers behind a load balancer, and a per-server limit means the effective global limit is multiplied by the number of servers, which is rarely what you want. Enforcing a true global limit requires shared state, typically a fast central store like Redis that all servers consult, which introduces latency on every request and makes the rate limiter a potential bottleneck and single point of failure. The practical compromises are well known: you can shard limits per client so each client maps to one server, you can use approximate counting that trades a little accuracy for far less coordination, or you can give each server a local budget that is periodically reconciled against the global pool. Atomicity matters too, because checking and decrementing a counter must be a single operation or concurrent requests will race past the limit, which is why implementations use atomic Redis operations or Lua scripts. The deep lesson is that distributed rate limiting is a consistency problem in disguise, and the right answer depends on how strict the limit truly needs to be.',
      },
      {
        heading: 'Responses, headers, and client cooperation',
        body: 'How a rate limiter responds is as important as how it counts, because a good limiter helps clients behave correctly rather than just punishing them. The conventional response for an exceeded limit is HTTP 429 Too Many Requests, ideally accompanied by a Retry-After header telling the client exactly how long to wait before trying again, which prevents the client from hammering the service in a tight retry loop. Standard headers like those describing the limit, remaining quota, and reset time let well-behaved clients proactively slow down before they are ever rejected, turning rate limiting into a cooperative protocol. On the server side, the choice between hard rejection and throttling matters: rejecting is simpler and protects capacity immediately, while queuing or shaping can smooth traffic but risks unbounded latency if abused. It is also wise to fail open or closed deliberately, deciding in advance whether the limiter being unavailable should allow all traffic or block it. Thoughtful responses and clear headers are what make rate limiting a tool clients can integrate with rather than an opaque wall they bounce off unpredictably.',
      },
    ],
    diagrams: [
      {
        title: 'Token bucket allows bursts, caps sustained rate',
        description: 'Tokens refill steadily; requests consume tokens and are rejected when the bucket is empty.',
        type: 'flow',
        svgContent: svg(720, 200, [
          box(40, 80, 120, 46, 'Refill: 10/s', { stroke: 'green' }),
          arrow(160, 103, 250, 103, { label: 'add tokens' }),
          box(250, 70, 120, 66, 'Bucket (cap 50)', { stroke: 'accent', sub: 'burst headroom' }),
          arrow(370, 103, 470, 103, { label: 'take 1' }),
          box(470, 80, 110, 46, 'Request ✓', { stroke: 'green' }),
          box(470, 140, 110, 40, 'Empty → 429', { stroke: 'red' }),
          arrow(525, 126, 525, 140, { dashed: true }),
        ].join('')),
      },
      {
        title: 'Distributed limiting with shared counter',
        description: 'All app servers atomically check and decrement a counter in a shared store to enforce a true global limit.',
        type: 'architecture',
        svgContent: svg(720, 240, [
          box(40, 40, 120, 40, 'App server 1'),
          box(40, 100, 120, 40, 'App server 2'),
          box(40, 160, 120, 40, 'App server 3'),
          arrow(160, 60, 300, 110, { label: 'INCR' }),
          arrow(160, 120, 300, 120, { label: 'INCR' }),
          arrow(160, 180, 300, 130, { label: 'INCR' }),
          box(300, 95, 150, 50, 'Redis counter', { stroke: 'accent', sub: 'atomic + TTL' }),
          arrow(450, 120, 560, 120, { label: 'over limit?' }),
          box(560, 95, 120, 50, '429 + Retry-After', { stroke: 'red' }),
        ].join('')),
      },
    ],
    realWorldExamples: [
      {
        company: 'Stripe',
        problem: 'Protect a payments API used by countless integrations from accidental request floods and abuse while keeping the platform responsive for everyone.',
        solution: 'Apply token-bucket-style rate limits per account with clear 429 responses and documented limits, plus separate limits for read versus write and special handling for spikes.',
        outcome: 'Stripe maintained high reliability under unpredictable third-party load, and its rate-limit design became a frequently cited reference for API builders.',
      },
      {
        company: 'GitHub',
        problem: 'Serve a massive public API where unauthenticated scrapers and automated clients could otherwise overwhelm the service.',
        solution: 'Enforce hourly request quotas that differ by authentication status, exposing remaining-quota and reset headers so clients can self-throttle before hitting the wall.',
        outcome: 'The API stayed healthy under heavy automated use, and the transparent headers let integrators build well-behaved clients that rarely get rejected.',
      },
    ],
    codeExamples: [
      {
        language: 'typescript',
        label: 'Token bucket limiter',
        description: 'A token bucket that refills lazily based on elapsed time and permits bursts up to capacity.',
        code: `class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private readonly capacity: number,
    private readonly refillPerSec: number,
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const elapsedSec = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + elapsedSec * this.refillPerSec);
    this.lastRefill = now;
  }

  tryRemove(cost = 1): { allowed: boolean; retryAfterSec: number } {
    this.refill();
    if (this.tokens >= cost) {
      this.tokens -= cost;
      return { allowed: true, retryAfterSec: 0 };
    }
    const deficit = cost - this.tokens;
    return { allowed: false, retryAfterSec: deficit / this.refillPerSec };
  }
}`,
      },
      {
        language: 'python',
        label: 'Atomic distributed limiter (Redis Lua)',
        description: 'A fixed-window counter incremented atomically so concurrent requests cannot race past the limit.',
        code: `# Executed atomically on Redis; returns the count after increment.
LUA = """
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return current
"""


class RedisRateLimiter:
    def __init__(self, redis, limit: int, window_sec: int):
        self.redis = redis
        self.limit = limit
        self.window_sec = window_sec
        self.script = redis.register_script(LUA)

    def allow(self, client_id: str) -> tuple[bool, int]:
        key = f"rl:{client_id}:{self.window_sec}"
        count = int(self.script(keys=[key], args=[self.window_sec]))
        remaining = max(0, self.limit - count)
        return count <= self.limit, remaining


# allowed, remaining = limiter.allow("user-42")`,
      },
    ],
    commonMistakes: [
      'Using a fixed window and ignoring the boundary burst that lets clients briefly double the intended rate.',
      'Applying a per-server limit behind a load balancer, so the real global limit is multiplied by the fleet size.',
      'Checking and incrementing the counter non-atomically, letting concurrent requests race past the cap.',
      'Returning a bare 429 with no Retry-After, which pushes clients into tight, destructive retry loops.',
      'Failing to decide explicitly whether the limiter fails open or closed when its backing store is unavailable.',
    ],
    whenNotToUse:
      'Internal services with trusted callers and predictable, bounded traffic often do not need rate limiting, and adding it there introduces latency and a coordination dependency for no real protection. Be cautious applying aggressive limits to first-party traffic where the better fix is capacity or backpressure, since limiting can mask a genuine scaling problem rather than solve it.',
    relatedTopics: ['api-rate-limiting-implementation', 'load-balancing', 'circuit-breaker-pattern', 'ddos-protection', 'caching-strategies'],
    industryStandard: 'Stripe & GitHub API limits · token/leaky bucket algorithms · RFC 6585 (HTTP 429) · IETF RateLimit headers',
    interviewTips:
      'Name the four core algorithms and immediately explain the fixed-window burst flaw and why token bucket is the usual default. The moment you mention multiple servers, raise distributed state, atomicity, and Redis, because interviewers are listening for whether you realize per-server limits do not compose. Round it out with 429, Retry-After, and a deliberate fail-open-or-closed decision to show production judgment.',
  },

  {
    id: 'circuit-breaker-pattern',
    title: 'Circuit Breaker Pattern',
    category: 'System Design Fundamentals',
    difficulty: 'Senior',
    readTime: 11,
    summary:
      'A circuit breaker stops calling a failing dependency after errors cross a threshold, failing fast instead of piling up doomed requests, and periodically tests whether the dependency has recovered.',
    whyItMatters:
      'When a downstream service degrades, naive callers keep sending requests that hang and consume threads, and that backlog cascades upstream until the whole system falls over. The circuit breaker is the pattern that contains a single failure so it does not become a system-wide outage, which is why it is essential to resilient distributed systems.',
    content: [
      {
        heading: 'The cascading failure it prevents',
        body: 'In a distributed system, services call each other, and when one dependency slows down or fails, every caller that keeps sending requests pays the price by blocking threads, exhausting connection pools, and accumulating a backlog of timed-out requests. This is the mechanism of cascading failure: a localized problem in one service propagates upstream because callers do not stop calling, so a single slow database can take down an entire fleet of application servers as their thread pools fill with requests waiting on it. The circuit breaker interrupts this chain by detecting that a dependency is failing and then refusing to call it, failing immediately rather than waiting on a request that is almost certainly going to fail anyway. By failing fast, the breaker frees up the caller\'s resources to keep serving other work and gives the struggling dependency room to recover instead of being hammered. The pattern is named after electrical circuit breakers, which trip to protect a circuit from damage. Its core insight is counterintuitive but powerful: when something is broken, the resilient response is to stop trying for a while.',
      },
      {
        heading: 'The three states',
        body: 'A circuit breaker is a state machine with three states that govern whether calls are allowed through. In the closed state, the breaker permits requests normally while tracking the rate of failures, and this is the healthy default. When failures cross a configured threshold, such as fifty percent of requests failing over a rolling window, the breaker trips to the open state, where it rejects all calls immediately without even attempting the dependency, returning an error or a fallback right away. After a cooldown period, the breaker moves to the half-open state, where it allows a limited number of trial requests through to test whether the dependency has recovered: if those succeed, it closes and resumes normal operation, and if they fail, it returns to open and waits again. This cycle lets the system automatically detect failure, protect itself, and recover without human intervention. The thresholds, window sizes, and cooldown durations are the tuning knobs, and getting them right balances tripping too eagerly against tripping too late.',
      },
      {
        heading: 'Fallbacks and graceful degradation',
        body: 'A circuit breaker is most valuable when paired with a sensible fallback, because failing fast is only half the answer and the other half is deciding what to return when the breaker is open. A good fallback degrades gracefully: a product page whose recommendation service is down can show a generic list instead of personalized picks, a feed whose ranking service fails can fall back to reverse-chronological order, and a non-critical enrichment that times out can simply be omitted. The art is distinguishing critical dependencies, where there is no acceptable fallback and the request must genuinely fail, from non-critical ones, where a degraded experience is far better than an error. This forces a valuable design conversation about which features are essential and which are enhancements, making the system\'s dependency graph and its failure modes explicit. Cached or stale data is a common fallback, trading freshness for availability during an outage. The combination of a breaker and a thoughtful fallback is what lets a system lose a dependency and keep serving users a slightly diminished but functional experience.',
      },
      {
        heading: 'Tuning, observability, and related patterns',
        body: 'A circuit breaker that is mistuned can do more harm than good, tripping on a transient blip and cutting off a healthy dependency, or never tripping and failing to protect anything, so the thresholds must reflect the real error and latency characteristics of the dependency. Observability is essential: every state transition should be logged and metered so operators can see when and why breakers trip, and dashboards of breaker state are a fast way to localize an incident to its source. The breaker also composes with sibling patterns that together form a resilience toolkit, including timeouts that bound how long any single call may hang, retries with backoff for transient errors, and bulkheads that isolate resource pools so one dependency cannot consume all threads. These patterns reinforce each other, since a breaker needs timeouts to detect hangs and bulkheads to contain the damage before it trips. Treating them as a coordinated set rather than isolated tricks is the senior approach. The goal across all of them is the same: contain failure locally so it never becomes systemic.',
      },
    ],
    diagrams: [
      {
        title: 'Circuit breaker state machine',
        description: 'Closed allows traffic, open rejects fast, half-open tests recovery before fully closing.',
        type: 'sequence',
        svgContent: svg(720, 200, [
          box(60, 80, 130, 50, 'CLOSED', { stroke: 'green', sub: 'allow · count fails' }),
          arrow(190, 95, 300, 95, { label: 'fails > threshold' }),
          box(300, 80, 130, 50, 'OPEN', { stroke: 'red', sub: 'reject fast' }),
          arrow(430, 95, 540, 95, { label: 'after cooldown' }),
          box(540, 80, 140, 50, 'HALF-OPEN', { stroke: 'amber', sub: 'trial requests' }),
          arrow(610, 130, 130, 130, { label: 'trial ok → close', dashed: true }),
          arrow(575, 130, 380, 130, { label: 'trial fails → open', dashed: true }),
        ].join('')),
      },
      {
        title: 'Breaker plus fallback in a call path',
        description: 'When the breaker is open, the caller returns cached or default data instead of hanging on the dead dependency.',
        type: 'architecture',
        svgContent: svg(720, 220, [
          box(40, 90, 110, 46, 'Service', { stroke: 'accent' }),
          arrow(150, 113, 250, 113, { label: 'call' }),
          box(250, 90, 120, 46, 'Breaker', { stroke: 'amber' }),
          arrow(370, 100, 470, 60, { label: 'closed' }),
          arrow(370, 126, 470, 170, { label: 'open', dashed: true }),
          box(470, 40, 150, 44, 'Recommender', { sub: 'may be down' }),
          box(470, 150, 150, 44, 'Fallback: cached list', { stroke: 'green' }),
        ].join('')),
      },
    ],
    realWorldExamples: [
      {
        company: 'Netflix (Hystrix)',
        problem: 'A single slow or failing backend in their service mesh could exhaust caller thread pools and cascade into a broad outage.',
        solution: 'Build Hystrix, wrapping every cross-service call in a circuit breaker with timeouts, thread isolation (bulkheads), and fallbacks, so a failing dependency trips its breaker and callers degrade gracefully.',
        outcome: 'Hystrix became the canonical implementation of the pattern, dramatically improving resilience and popularizing circuit breaking across the industry.',
      },
      {
        company: 'Amazon (service resilience)',
        problem: 'Operate a vast mesh of services where any dependency can degrade, requiring each service to protect itself rather than trust its dependencies to stay healthy.',
        solution: 'Standardize defensive patterns including circuit breakers, timeouts, and load shedding so each service fails fast and sheds excess work instead of cascading failure upstream.',
        outcome: 'Services contained dependency failures locally, keeping overall availability high even as individual components occasionally degraded.',
      },
    ],
    codeExamples: [
      {
        language: 'typescript',
        label: 'Circuit breaker with three states',
        description: 'A breaker that trips on failure rate, rejects fast while open, and probes recovery when half-open.',
        code: `type State = 'closed' | 'open' | 'half-open';

class CircuitBreaker {
  private state: State = 'closed';
  private failures = 0;
  private openedAt = 0;

  constructor(
    private readonly threshold: number,
    private readonly cooldownMs: number,
    private readonly fallback: () => Promise<unknown>,
  ) {}

  async call<T>(fn: () => Promise<T>): Promise<T | unknown> {
    if (this.state === 'open') {
      if (Date.now() - this.openedAt < this.cooldownMs) return this.fallback();
      this.state = 'half-open'; // time to test the dependency
    }
    try {
      const result = await fn();
      this.failures = 0;
      this.state = 'closed';
      return result;
    } catch (err) {
      this.failures += 1;
      if (this.state === 'half-open' || this.failures >= this.threshold) {
        this.state = 'open';
        this.openedAt = Date.now();
      }
      return this.fallback();
    }
  }
}`,
      },
      {
        language: 'go',
        label: 'Failure-rate window',
        description: 'A rolling window that decides whether to trip based on the recent failure ratio, not a single error.',
        code: `package breaker

type Window struct {
	results  []bool // true = success
	size     int
	minCalls int
}

func NewWindow(size, minCalls int) *Window {
	return &Window{size: size, minCalls: minCalls}
}

func (w *Window) Record(success bool) {
	w.results = append(w.results, success)
	if len(w.results) > w.size {
		w.results = w.results[1:] // slide the window
	}
}

// ShouldTrip reports whether the recent failure ratio exceeds the threshold.
func (w *Window) ShouldTrip(failureRatio float64) bool {
	if len(w.results) < w.minCalls {
		return false // not enough data to judge
	}
	failures := 0
	for _, ok := range w.results {
		if !ok {
			failures++
		}
	}
	return float64(failures)/float64(len(w.results)) >= failureRatio
}`,
      },
    ],
    commonMistakes: [
      'Tripping on a single error instead of a failure rate over a window, so transient blips cut off healthy dependencies.',
      'Opening the breaker but providing no fallback, converting a slow dependency into an immediate hard failure.',
      'Never moving to half-open, so the breaker stays open long after the dependency recovers.',
      'Using a breaker without timeouts, so hung calls are never detected as failures in the first place.',
      'Failing to emit metrics on state transitions, leaving operators blind to which breaker tripped during an incident.',
    ],
    whenNotToUse:
      'A circuit breaker adds little for purely local, in-process operations that cannot hang on a remote dependency, or for a critical call that has no acceptable fallback and must simply fail when the dependency is down. For very low-traffic paths, the breaker may never gather enough samples to make a sound tripping decision, so a plain timeout is simpler and sufficient.',
    relatedTopics: ['retry-backoff', 'timeout-handling', 'bulkhead-pattern', 'graceful-degradation', 'reliability-availability'],
    industryStandard: 'Netflix Hystrix / Resilience4j · Polly (.NET) · Release It! (Michael Nygard)',
    interviewTips:
      'Explain the cascading-failure mechanism first, because the breaker only makes sense once the interviewer sees how thread-pool exhaustion propagates upstream. Walk the three states crisply and pair the breaker with a concrete fallback to show you understand graceful degradation. The senior signal is presenting breakers, timeouts, retries, and bulkheads as a coordinated resilience toolkit rather than one isolated trick.',
  },

  {
    id: 'retry-backoff',
    title: 'Retry Logic and Exponential Backoff',
    category: 'System Design Fundamentals',
    difficulty: 'Intermediate',
    readTime: 11,
    summary:
      'Retries recover from transient failures, but naive retries amplify outages into retry storms. Exponential backoff with jitter and a cap turns retries from a liability into a safe, effective resilience tool.',
    whyItMatters:
      'Transient failures are inevitable in distributed systems, and retries are the cheapest way to ride through them, but retries done wrong are how a brief blip becomes a self-inflicted denial-of-service. Knowing when to retry, how to back off, and when to give up is fundamental to building systems that recover instead of collapse.',
    content: [
      {
        heading: 'When retries help and when they hurt',
        body: 'Retrying a failed operation makes sense when the failure is transient, meaning it is likely to succeed on a subsequent attempt, such as a brief network glitch, a momentary timeout, or a temporary server overload that has since cleared. Retrying is actively harmful when the failure is permanent or deterministic, because retrying a request that returns a validation error, an authentication failure, or a not-found will never succeed and only wastes resources. The first discipline of retry logic is therefore classifying errors into retryable and non-retryable categories, typically treating timeouts and 5xx server errors and connection failures as retryable while treating 4xx client errors as terminal. A second subtlety is idempotency, because retrying a non-idempotent operation like charging a card can double-execute it if the original actually succeeded but the response was lost, so retries are only safe for idempotent operations or must be paired with idempotency keys. Blindly retrying everything is one of the most common and dangerous mistakes. Retries are a precision tool for transient, idempotent failures, not a blanket response to any error.',
      },
      {
        heading: 'Why exponential backoff and jitter are essential',
        body: 'The most dangerous failure mode of retries is the retry storm, where a dependency briefly fails, every client retries immediately, and the synchronized flood of retries overwhelms the recovering dependency and keeps it down, turning a momentary blip into a sustained outage. Exponential backoff defuses this by increasing the wait between attempts geometrically, so a client waits one second, then two, then four, then eight, which spreads retries out over time and gives the dependency room to recover. But exponential backoff alone is not enough, because if many clients fail at the same moment they will all back off by the same amounts and retry in synchronized waves, recreating the storm at each interval. Jitter, the addition of randomness to each backoff delay, breaks this synchronization by smearing the retries across a range of times so they no longer arrive in lockstep. The combination of exponential backoff plus jitter is the industry-standard answer, and AWS engineers demonstrated that full jitter, randomizing the entire delay rather than a portion, minimizes both contention and completion time. Omitting jitter is a subtle but serious bug that only manifests under correlated failure.',
      },
      {
        heading: 'Caps, budgets, and giving up',
        body: 'Retries must be bounded, because infinite retries waste resources and keep a doomed request alive long after it should have failed, so every retry policy needs a maximum number of attempts and a maximum total time after which it gives up and surfaces the error. The backoff itself should be capped so the delay does not grow without bound into minutes of waiting, typically with an upper limit beyond which it stops doubling. A more sophisticated control is the retry budget, which limits retries as a fraction of total traffic so that even under widespread failure, retries can never exceed, say, ten percent of requests, preventing the system from drowning itself in retry traffic when everything is failing at once. This token-bucket-style budgeting is what large systems use to make retries safe in aggregate rather than just per-request. Giving up gracefully also matters: when retries are exhausted, the system should fail cleanly, possibly to a fallback, rather than hanging. Bounding retries in count, time, and aggregate volume is what separates a resilient retry strategy from one that amplifies failure.',
      },
      {
        heading: 'Retries in the broader resilience stack',
        body: 'Retries do not work in isolation and must be coordinated with the other resilience patterns, or they will fight each other and amplify load at exactly the wrong moment. Retries need timeouts, because you cannot retry a request until you have decided it has failed, and a missing or overly long timeout means retries never trigger or trigger far too late. Retries combine with circuit breakers in a specific way: while a breaker is open the caller should not retry at all, because the dependency is known to be down and retrying just wastes effort, so the breaker short-circuits the retry loop. A particularly insidious problem is retry amplification in layered systems, where each layer retries independently and the multiplication of retries across layers turns a few client retries into an exponential flood at the bottom of the stack, which is why many designs retry at only one layer. Observability ties it together, since you must measure retry rates to detect storms and tune policies. Treating retries as one coordinated element of a resilience strategy, rather than a local reflex sprinkled everywhere, is the mark of a mature design.',
      },
    ],
    diagrams: [
      {
        title: 'Exponential backoff with jitter',
        description: 'Delays grow geometrically and randomized jitter smears retries so they never arrive in synchronized waves.',
        type: 'timeline',
        svgContent: svg(720, 180, [
          lane(40, 40, 690, 'attempt timeline'),
          box(40, 60, 70, 36, 'try 1', { stroke: 'accent' }),
          box(160, 60, 70, 36, 'try 2', { sub: '~1s ±j' }),
          box(320, 60, 70, 36, 'try 3', { sub: '~2s ±j' }),
          box(520, 60, 80, 36, 'try 4', { sub: '~4s ±j' }),
          label(40, 140, 'wait doubles each attempt; jitter randomizes the exact moment', { fill: 'muted', size: 11 }),
        ].join('')),
      },
      {
        title: 'Retry storm versus backoff',
        description: 'Synchronized immediate retries keep a recovering service down; jittered backoff lets it breathe.',
        type: 'comparison',
        svgContent: svg(720, 200, [
          box(30, 40, 300, 50, 'Immediate retries', { stroke: 'red', sub: 'synchronized flood' }),
          box(30, 110, 80, 40, 'client'),
          box(120, 110, 80, 40, 'client'),
          box(210, 110, 80, 40, 'client'),
          arrow(70, 100, 180, 100, { stroke: 'red' }),
          box(390, 40, 300, 50, 'Backoff + jitter', { stroke: 'green', sub: 'spread over time' }),
          box(390, 110, 70, 40, 'client'),
          box(500, 130, 70, 40, 'client'),
          box(610, 115, 70, 40, 'client'),
        ].join('')),
      },
    ],
    realWorldExamples: [
      {
        company: 'AWS',
        problem: 'SDK clients retrying throttled or failed API calls could synchronize and overwhelm services during partial outages, prolonging incidents.',
        solution: 'Publish and implement full-jitter exponential backoff in the SDKs and document retry budgets, randomizing the entire delay to minimize contention and recovery time.',
        outcome: 'The "Exponential Backoff and Jitter" guidance became a widely adopted standard, and AWS SDKs retry safely by default, reducing self-inflicted overload.',
      },
      {
        company: 'Google',
        problem: 'Layered services each retrying independently could multiply a small number of client retries into a destructive flood at lower layers.',
        solution: 'Adopt retry budgets and the principle of retrying at a single layer, capping retries as a fraction of traffic so aggregate retry load stays bounded during failures.',
        outcome: 'Systems avoided retry amplification and stayed stable under partial failure, a practice documented in the Google SRE materials.',
      },
    ],
    codeExamples: [
      {
        language: 'typescript',
        label: 'Retry with full jitter and a cap',
        description: 'Retry only retryable errors, back off exponentially with full jitter, and bound attempts and total delay.',
        code: `interface RetryOptions {
  maxAttempts: number;
  baseMs: number;
  capMs: number;
  isRetryable: (err: unknown) => boolean;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions): Promise<T> {
  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (err) {
      attempt += 1;
      if (attempt >= opts.maxAttempts || !opts.isRetryable(err)) throw err;
      // Full jitter: random delay between 0 and the exponential cap.
      const exp = Math.min(opts.capMs, opts.baseMs * 2 ** (attempt - 1));
      const delay = Math.random() * exp;
      await sleep(delay);
    }
  }
}

const retryable = (e: unknown) =>
  e instanceof Error && /timeout|503|ECONNRESET/.test(e.message);`,
      },
      {
        language: 'python',
        label: 'Retry budget (token bucket)',
        description: 'Cap retries as a fraction of traffic so aggregate retries cannot exceed a safe share during outages.',
        code: `from dataclasses import dataclass


@dataclass
class RetryBudget:
    # Allow retries up to ratio * successful_calls, refilled by real traffic.
    ratio: float
    tokens: float = 0.0

    def on_success(self) -> None:
        self.tokens += self.ratio  # each real call funds a fraction of a retry

    def try_retry(self) -> bool:
        if self.tokens >= 1.0:
            self.tokens -= 1.0
            return True
        return False  # budget exhausted: stop retrying, fail fast


budget = RetryBudget(ratio=0.1)  # retries capped at ~10% of traffic
for _ in range(20):
    budget.on_success()
print(budget.try_retry())  # True while budget remains`,
      },
    ],
    commonMistakes: [
      'Retrying non-idempotent operations without idempotency keys, double-charging or duplicating side effects.',
      'Retrying immediately with no backoff, synchronizing clients into a retry storm that prolongs the outage.',
      'Using exponential backoff but omitting jitter, so clients still retry in correlated waves.',
      'Retrying at every layer of a call stack, multiplying retries into an exponential flood at the bottom.',
      'Retrying while a circuit breaker is open, wasting effort on a dependency already known to be down.',
    ],
    whenNotToUse:
      'Do not retry deterministic client errors such as validation, authentication, or authorization failures, because they will never succeed and retrying only adds load and latency. Avoid retries on non-idempotent operations unless protected by idempotency keys, and skip them on ultra-low-latency paths where the added delay of even one backoff exceeds the value of recovering.',
    relatedTopics: ['circuit-breaker-pattern', 'timeout-handling', 'idempotency', 'message-queues-event-streaming', 'reliability-availability'],
    industryStandard: 'AWS "Exponential Backoff and Jitter" · Google SRE retry budgets · gRPC/HTTP client retry policies',
    interviewTips:
      'Start by classifying errors into retryable and non-retryable and flag idempotency before proposing any retry, since that ordering shows discipline. Explain the retry storm and why exponential backoff needs jitter, ideally naming full jitter, then bound everything with attempt caps, time caps, and a retry budget. The senior move is coordinating retries with timeouts and circuit breakers and warning about cross-layer retry amplification.',
  },

  {
    id: 'timeout-handling',
    title: 'Timeout Handling',
    category: 'System Design Fundamentals',
    difficulty: 'Intermediate',
    readTime: 10,
    summary:
      'A timeout bounds how long an operation may wait before being abandoned. Without timeouts, a single hung dependency silently consumes resources until the whole system stalls; with thoughtful timeouts, failures stay fast and contained.',
    whyItMatters:
      'The default behavior of most network calls is to wait indefinitely, which means one stuck dependency can pin every thread that touches it until the service grinds to a halt. Timeouts are the most basic and most frequently neglected resilience control, and they are the precondition that makes retries and circuit breakers even possible.',
    content: [
      {
        heading: 'Why the absence of a timeout is a bug',
        body: 'Most networking libraries default to no timeout or an extremely long one, so a call to a dependency that hangs will block the calling thread essentially forever, and this default is a latent outage waiting to happen. When a dependency becomes slow rather than failing outright, callers without timeouts accumulate blocked threads, exhaust their connection pools, and eventually stop serving any requests at all, even ones that have nothing to do with the slow dependency. This is why a missing timeout is not a missing optimization but an actual bug: it removes the system\'s ability to give up on a doomed operation and reclaim its resources. The correct mental model is that every operation that crosses a process boundary can hang, and the only defense against a hang is a deadline. Setting an explicit timeout on every network call, database query, and lock acquisition is therefore a baseline discipline, not an advanced technique. A system without timeouts is one slow dependency away from a total stall.',
      },
      {
        heading: 'Choosing the right timeout value',
        body: 'Setting a timeout too long makes it nearly useless because the system still hangs for an unacceptable duration before giving up, while setting it too short causes false failures by aborting requests that would have succeeded just slightly later, so the value must be chosen deliberately. The principled approach is to base timeouts on the observed latency distribution of the dependency, setting the timeout somewhere above the high percentile of normal response times, such as just past the p99, so that genuine slowness trips it but ordinary variation does not. Timeouts should also account for the call graph: an outer service that calls several inner services must have a timeout larger than the sum or the critical path of its dependencies, or it will abort before its own children have had their fair chance. This leads to the concept of timeout budgets, where a total deadline is allocated down through the layers so each layer knows how much time it actually has left. Hard-coding the same arbitrary timeout everywhere is a common mistake. The right value comes from measured latencies and an explicit budget, not from a round number that feels reasonable.',
      },
      {
        heading: 'Deadlines, propagation, and cancellation',
        body: 'A more powerful model than per-call timeouts is the deadline, an absolute point in time by which a whole request must complete, which is propagated through every downstream call so the entire chain shares one budget. With deadline propagation, when a request enters the system with a 500-millisecond budget, each service passes the remaining time to its dependencies, and a service that receives a request with only 5 milliseconds left can immediately reject it rather than starting work that can never finish in time. This prevents wasted effort on requests whose caller has already given up, a surprisingly common source of load amplification during incidents. Cancellation is the companion mechanism: when a deadline is exceeded or a client disconnects, the work should be actively cancelled so it stops consuming resources, which languages support through cancellation tokens or context objects threaded through the call stack. Without cancellation, a timed-out request keeps running in the background even though no one will use its result. Deadlines plus propagation plus cancellation together ensure that time limits are honored consistently across a distributed call rather than enforced inconsistently at each hop.',
      },
      {
        heading: 'Timeouts as the foundation of resilience',
        body: 'Timeouts are not an isolated control but the foundation on which the other resilience patterns rest, because each of them depends on first being able to declare that an operation has failed. A retry policy cannot retry until a timeout has decided the original attempt failed, so a missing or excessive timeout makes retries useless or dangerously delayed. A circuit breaker counts failures to decide when to trip, and a hung call that never times out is never counted as a failure, so the breaker never trips and the cascade it was meant to prevent proceeds unchecked. Bulkheads contain the damage, but without timeouts the contained pool still fills with permanently blocked threads. This dependency chain is why experienced engineers treat timeouts as the first resilience control to add, before retries or breakers, since those higher patterns are built atop the ability to fail fast. The broader principle is that you cannot manage a failure you cannot detect, and a timeout is how you detect the most insidious failure of all, the silent hang. Getting timeouts right is therefore the highest-leverage resilience investment available.',
      },
    ],
    diagrams: [
      {
        title: 'Deadline propagation through a call chain',
        description: 'A request enters with a budget; each hop passes the remaining time so a late call can reject immediately.',
        type: 'sequence',
        svgContent: svg(720, 200, [
          box(20, 80, 130, 50, 'Edge · 500ms', { stroke: 'accent' }),
          arrow(150, 105, 250, 105, { label: '420ms left' }),
          box(250, 80, 130, 50, 'Service A', { sub: 'used 80ms' }),
          arrow(380, 105, 480, 105, { label: '300ms left' }),
          box(480, 80, 130, 50, 'Service B', { sub: 'used 120ms' }),
          arrow(610, 105, 690, 105, { label: '5ms → reject', stroke: 'red' }),
          label(20, 170, 'each hop subtracts elapsed time; near-zero budget fails fast', { fill: 'muted', size: 11 }),
        ].join('')),
      },
      {
        title: 'Hung dependency without a timeout',
        description: 'A slow dependency fills the caller thread pool; a timeout reclaims threads and keeps the service alive.',
        type: 'comparison',
        svgContent: svg(720, 190, [
          box(30, 40, 300, 46, 'No timeout', { stroke: 'red', sub: 'threads block forever' }),
          box(30, 110, 90, 40, 'pool full'),
          box(130, 110, 90, 40, 'no capacity'),
          box(230, 110, 90, 40, 'stall'),
          box(390, 40, 300, 46, 'With timeout', { stroke: 'green', sub: 'fail fast, reclaim' }),
          box(390, 110, 90, 40, 'abort @ p99'),
          box(490, 110, 90, 40, 'free thread'),
          box(590, 110, 90, 40, 'keep serving'),
        ].join('')),
      },
    ],
    realWorldExamples: [
      {
        company: 'Stripe',
        problem: 'API calls and internal service calls that hung on a slow dependency risked tying up workers and degrading the payments platform.',
        solution: 'Enforce explicit timeouts on outbound calls and design clients to fail fast, combining timeouts with idempotency keys so a timed-out request can be retried safely.',
        outcome: 'Slow dependencies produced fast, recoverable failures instead of pinned workers, and clients could retry without risking duplicate charges.',
      },
      {
        company: 'Google (gRPC deadlines)',
        problem: 'Across a massive service mesh, requests whose callers had already given up still consumed downstream resources, amplifying load during incidents.',
        solution: 'Bake deadline propagation into gRPC so every request carries an absolute deadline that flows through the call graph, letting any service cancel work that can no longer finish in time.',
        outcome: 'Wasted downstream work dropped sharply and the platform degraded more gracefully under load, making deadlines a default rather than an afterthought.',
      },
    ],
    codeExamples: [
      {
        language: 'typescript',
        label: 'Timeout wrapper with cancellation',
        description: 'Race an operation against a deadline and abort the underlying work via an AbortController.',
        code: `function withTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  ms: number,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fn(controller.signal).finally(() => clearTimeout(timer));
}

async function fetchUser(id: string): Promise<unknown> {
  return withTimeout(async (signal) => {
    const res = await fetch(\`/users/\${id}\`, { signal });
    if (!res.ok) throw new Error(\`status \${res.status}\`);
    return res.json();
  }, 300); // hard 300ms budget; aborts the fetch on expiry
}`,
      },
      {
        language: 'go',
        label: 'Context deadline propagation',
        description: 'Thread a context deadline through calls so downstream work is cancelled when the budget is spent.',
        code: `package timeouts

import (
	"context"
	"errors"
	"time"
)

// Call enforces a per-request deadline and propagates it to downstream work.
func Call(parent context.Context, budget time.Duration, do func(context.Context) error) error {
	ctx, cancel := context.WithTimeout(parent, budget)
	defer cancel() // always release resources

	done := make(chan error, 1)
	go func() { done <- do(ctx) }()

	select {
	case err := <-done:
		return err
	case <-ctx.Done():
		// Deadline exceeded or caller cancelled; downstream sees ctx.Done() too.
		return errors.Join(ctx.Err(), errors.New("operation timed out"))
	}
}`,
      },
    ],
    commonMistakes: [
      'Leaving the default of no timeout or an effectively infinite one on network and database calls.',
      'Picking a round-number timeout instead of basing it on the dependency\'s measured latency distribution.',
      'Giving an outer call a timeout smaller than its inner dependencies need, aborting before children can finish.',
      'Timing out the caller but never cancelling the work, so abandoned requests keep consuming resources.',
      'Adding retries or circuit breakers without timeouts, so hangs are never detected and the higher patterns never engage.',
    ],
    whenNotToUse:
      'Genuinely long-running operations such as large file processing or batch jobs should not use a tight request-style timeout; they belong in an asynchronous pipeline with progress tracking instead. For purely local, in-memory computation that cannot block on I/O, a timeout adds complexity without protecting against any real hang.',
    relatedTopics: ['circuit-breaker-pattern', 'retry-backoff', 'bulkhead-pattern', 'latency-vs-throughput', 'reliability-availability'],
    industryStandard: 'gRPC deadlines · Go context package · Release It! (Michael Nygard) · Google SRE practices',
    interviewTips:
      'State plainly that a missing timeout is a bug and that timeouts are the first resilience control you add, before retries or breakers. Explain choosing values from the latency distribution and introduce deadline propagation and cancellation to show you think in terms of a whole call graph rather than one call. Tying timeouts to thread-pool exhaustion and to why a hung call defeats a circuit breaker is the senior signal.',
  },

  {
    id: 'graphql-rest-grpc',
    title: 'GraphQL vs REST vs gRPC',
    category: 'API Design',
    difficulty: 'Senior',
    readTime: 13,
    summary:
      'REST, GraphQL, and gRPC are three API paradigms with different strengths: REST for resource-oriented web APIs, GraphQL for flexible client-driven queries, and gRPC for fast, strongly-typed service-to-service calls.',
    whyItMatters:
      'The API paradigm shapes client experience, performance, tooling, and evolution for years, and the three options optimize for genuinely different things. Choosing by hype rather than by fit leads to over-fetching pain, schema sprawl, or a public API no one can consume, so understanding the tradeoffs is core senior knowledge.',
    content: [
      {
        heading: 'REST: resources, uniformity, and the web',
        body: 'REST models a system as a set of resources identified by URLs and manipulated through a uniform set of HTTP methods, where GET reads, POST creates, PUT and PATCH update, and DELETE removes, with the response codes and caching semantics of HTTP doing real work. Its great strengths are ubiquity and simplicity: every language has an HTTP client, every developer understands it, and intermediaries like caches, proxies, and CDNs understand HTTP verbs and status codes natively, so a GET can be cached at the edge for free. REST\'s resource orientation maps cleanly onto CRUD-style domains and produces APIs that are easy to explore and document. Its weaknesses appear when client needs diverge from the resource shape: a mobile screen that needs a little data from many resources must either make many round trips, called under-fetching, or accept large responses full of fields it ignores, called over-fetching. REST also lacks a built-in strong schema, though OpenAPI fills that gap by convention. For public web APIs and resource-centric domains, REST remains the sensible default precisely because of its uniformity and web-native tooling.',
      },
      {
        heading: 'GraphQL: client-driven queries and one round trip',
        body: 'GraphQL exposes a single endpoint and a strongly-typed schema through which clients ask for exactly the fields they need in one query, which directly solves the over-fetching and under-fetching problems that plague REST for rich, varied clients. A mobile app can request a user, their three most recent orders, and each order\'s total in a single round trip, getting back precisely that shape and nothing more, which is a major efficiency win over orchestrating several REST calls. The schema is introspectable, enabling excellent tooling, type generation, and a self-documenting API, and the strong typing catches whole classes of errors at development time. These strengths come with real costs: caching is harder because every query can be different and the uniform GET-cacheability of REST is lost, and a naive resolver implementation invites the N+1 query problem where fetching a list and its relations explodes into many database calls unless batched with a tool like DataLoader. GraphQL also shifts complexity to the server and can expose expensive queries that need depth limiting and cost analysis to prevent abuse. It shines when many different clients need flexible, evolving views over a complex, highly-connected data graph.',
      },
      {
        heading: 'gRPC: contracts, binary speed, and service meshes',
        body: 'gRPC is a high-performance RPC framework that uses Protocol Buffers to define a strict service contract and serializes messages into a compact binary format over HTTP/2, making it dramatically faster and smaller on the wire than JSON over HTTP/1.1. Its defining strengths are performance and a strong, code-generated contract: the .proto file is the single source of truth from which typed clients and servers are generated in many languages, eliminating an entire category of integration bugs and enabling features like streaming in both directions. These properties make gRPC the natural choice for internal service-to-service communication in a microservices mesh, where the parties are trusted, latency matters, and the binary format and HTTP/2 multiplexing pay off across millions of calls. The tradeoff is that gRPC is awkward for public and browser-facing APIs, because browsers cannot speak raw gRPC without a proxy layer, the binary format is not human-readable for debugging, and the tooling is less universal than plain HTTP. gRPC is therefore best understood as an internal-systems technology, complementary to rather than competing with a public REST or GraphQL edge. Many architectures use gRPC between services and expose REST or GraphQL at the boundary.',
      },
      {
        heading: 'How to actually choose',
        body: 'The choice among the three should be driven by who consumes the API, what their data-shaping needs are, and where the call sits in the architecture, not by novelty. For a public API consumed by unknown third parties, REST is usually right because of its universal tooling, cacheability, and low barrier to entry, with OpenAPI providing the schema. For an API serving many first-party clients with divergent and evolving data needs over a connected graph, GraphQL earns its added server complexity by collapsing round trips and eliminating over-fetching. For internal communication between your own services where performance and strict contracts dominate and human readability is irrelevant, gRPC is the strongest option. Crucially, these are not mutually exclusive: a very common and effective pattern is gRPC internally between services with a REST or GraphQL gateway at the public edge, getting each technology\'s benefit where it fits. The senior answer to "which one" is therefore "for which consumer and which boundary," because the right system often uses more than one. Picking dogmatically for the whole system is the mistake; matching paradigm to context is the craft.',
      },
    ],
    diagrams: [
      {
        title: 'Three paradigms, three sweet spots',
        description: 'REST for public resource APIs, GraphQL for flexible client queries, gRPC for fast internal calls.',
        type: 'comparison',
        svgContent: svg(720, 210, [
          box(30, 40, 200, 120, 'REST', { stroke: 'accent', sub: 'public · cacheable · uniform' }),
          box(260, 40, 200, 120, 'GraphQL', { stroke: 'purple', sub: 'client-shaped · one round trip' }),
          box(490, 40, 200, 120, 'gRPC', { stroke: 'green', sub: 'internal · binary · typed' }),
          label(130, 150, 'CRUD / web', { fill: 'muted', size: 10.5, anchor: 'middle' }),
          label(360, 150, 'rich clients', { fill: 'muted', size: 10.5, anchor: 'middle' }),
          label(590, 150, 'service mesh', { fill: 'muted', size: 10.5, anchor: 'middle' }),
        ].join('')),
      },
      {
        title: 'gRPC inside, REST/GraphQL at the edge',
        description: 'A common hybrid: a public gateway speaks REST or GraphQL while services talk gRPC internally.',
        type: 'architecture',
        svgContent: svg(720, 240, [
          box(30, 100, 110, 46, 'Clients', { fill: 'cardAlt' }),
          arrow(140, 123, 240, 123, { label: 'REST/GraphQL' }),
          box(240, 100, 130, 46, 'API Gateway', { stroke: 'accent' }),
          arrow(370, 110, 480, 60, { label: 'gRPC' }),
          arrow(370, 130, 480, 180, { label: 'gRPC' }),
          box(480, 40, 150, 44, 'Users svc', { stroke: 'green' }),
          box(480, 160, 150, 44, 'Orders svc', { stroke: 'green' }),
          arrow(555, 84, 555, 160, { label: 'gRPC', dashed: true }),
        ].join('')),
      },
    ],
    realWorldExamples: [
      {
        company: 'GitHub',
        problem: 'A sprawling REST API forced clients to make many calls and over-fetch data for rich pages, straining mobile and integration use cases.',
        solution: 'Ship a public GraphQL API alongside REST, letting clients request exactly the connected data they need in one query against a strongly-typed schema.',
        outcome: 'Integrators built faster, leaner clients, and GitHub\'s GraphQL API became a widely studied example of GraphQL at public scale.',
      },
      {
        company: 'Google',
        problem: 'Internal services needed extremely fast, strongly-typed communication across many languages without the overhead of JSON over HTTP/1.1.',
        solution: 'Use Protocol Buffers and the RPC model (the basis of gRPC) for service-to-service calls, generating typed stubs from a single contract and serializing compact binary over HTTP/2.',
        outcome: 'Internal communication became fast and contract-safe at massive scale, and gRPC was open-sourced and adopted broadly for microservice meshes.',
      },
    ],
    codeExamples: [
      {
        language: 'typescript',
        label: 'Same data, three shapes',
        description: 'Contrast REST endpoints, a GraphQL query, and a gRPC/proto contract for fetching a user with orders.',
        code: `// REST: resource-oriented, often multiple round trips
// GET /users/42
// GET /users/42/orders?limit=3

// GraphQL: one query, exactly the fields needed
const query = \`
  query {
    user(id: "42") {
      name
      orders(last: 3) { id total }
    }
  }
\`;

// gRPC contract (proto), code-generated into typed clients:
// service UserService {
//   rpc GetUserWithOrders(UserRequest) returns (UserWithOrders);
// }
interface UserRequest { id: string; lastOrders: number }
interface UserWithOrders { name: string; orders: { id: string; total: number }[] }`,
      },
      {
        language: 'python',
        label: 'GraphQL N+1 and batching',
        description: 'Show the N+1 trap and how a batch loader collapses many per-item fetches into one query.',
        code: `from collections import defaultdict


class OrderLoader:
    """Batches order lookups so a list of N users triggers 1 query, not N."""

    def __init__(self, db):
        self.db = db
        self._pending: list[str] = []

    def queue(self, user_id: str) -> None:
        self._pending.append(user_id)

    def load_all(self) -> dict[str, list]:
        if not self._pending:
            return {}
        # Single batched query instead of one per user (avoids N+1).
        rows = self.db.query(
            "SELECT user_id, id, total FROM orders WHERE user_id = ANY(%s)",
            (self._pending,),
        )
        grouped: dict[str, list] = defaultdict(list)
        for r in rows:
            grouped[r["user_id"]].append(r)
        self._pending = []
        return grouped`,
      },
    ],
    commonMistakes: [
      'Choosing GraphQL for a simple CRUD API and inheriting caching and N+1 complexity for no real benefit.',
      'Exposing gRPC directly to browsers without a proxy, then fighting the lack of native browser support.',
      'Building a REST API that forces clients into many round trips when a single client-shaped query was the real need.',
      'Letting GraphQL queries run unbounded in depth and cost, opening the door to expensive or abusive queries.',
      'Treating the three as competitors for the whole system instead of matching each to its consumer and boundary.',
    ],
    whenNotToUse:
      'Avoid GraphQL when your API is simple, resource-shaped, and consumed by clients that do not need flexible queries, since REST will be simpler and more cacheable. Avoid gRPC at the public, browser-facing edge where universal HTTP tooling and human-readable payloads matter more than raw speed, and avoid REST for chatty internal hot paths where gRPC\'s binary efficiency pays off.',
    relatedTopics: ['rest-api-best-practices', 'api-versioning', 'webhook-design', 'api-gateway-pattern', 'idempotency'],
    industryStandard: 'Fielding REST dissertation · GraphQL spec (GitHub, Apollo) · gRPC & Protocol Buffers (CNCF)',
    interviewTips:
      'Frame the answer around consumer and boundary rather than declaring a winner, and give each paradigm its honest sweet spot: REST for public resource APIs, GraphQL for flexible first-party clients, gRPC for internal performance. Volunteer the hard parts, GraphQL caching and N+1, gRPC browser limits, REST over/under-fetching, to show balance. The strongest close is the hybrid pattern of gRPC internally with a REST or GraphQL edge.',
  },

  {
    id: 'api-versioning',
    title: 'API Versioning Strategies',
    category: 'API Design',
    difficulty: 'Senior',
    readTime: 11,
    summary:
      'Versioning lets an API evolve without breaking existing clients. The strategies, from URL paths to headers to additive-only change, trade off clarity, flexibility, and the long-term burden of maintaining multiple versions.',
    whyItMatters:
      'Once external clients depend on your API, a breaking change can silently shatter their integrations, and you rarely control when or whether they upgrade. A deliberate versioning strategy is what lets you keep improving the API while honoring the contract you already shipped, and getting it wrong means either frozen evolution or a trail of broken consumers.',
    content: [
      {
        heading: 'What counts as a breaking change',
        body: 'Versioning only makes sense once you can precisely classify changes as breaking or non-breaking, because the entire discipline is about avoiding or isolating the breaking ones. A non-breaking, additive change includes adding a new endpoint, adding an optional request field, or adding a new field to a response, all of which existing clients can simply ignore. A breaking change includes removing or renaming a field, changing a field\'s type or meaning, making a previously optional field required, changing default behavior, or altering error formats, because any of these can cause a client that worked yesterday to fail today. A subtle category is the semantic breaking change, where the shape is unchanged but the behavior differs, such as a field that now returns values in a different unit, which is especially dangerous because it passes schema validation while corrupting client logic. The discipline of asking "would any existing client break" before every change is the foundation of API stability. Most teams underestimate how many changes are breaking, which is why a clear shared definition matters more than any particular versioning mechanism.',
      },
      {
        heading: 'Where to put the version',
        body: 'The most common and most debated decision is how clients select a version, and there are three main approaches with real tradeoffs. URL path versioning, such as a v1 or v2 segment in the path, is the most visible and easiest to understand, route, and test, since the version is obvious in every request and trivially cacheable, but purists argue it violates REST because the same resource now has multiple URLs. Header versioning, where the client specifies the version in a custom header or via content negotiation on the Accept header, keeps URLs clean and is considered more RESTful, but it is less discoverable, harder to test from a browser, and easy for clients to get wrong by omitting the header. Query parameter versioning sits in between but muddies caching and feels ad hoc. In practice, URL path versioning has won broad adoption for public APIs precisely because its visibility and simplicity outweigh the theoretical purity of header versioning, and major platforms like Stripe and GitHub demonstrate both approaches working at scale. The right choice depends on your audience, but the more important point is to pick one and apply it consistently rather than mixing schemes.',
      },
      {
        heading: 'Additive-only evolution and avoiding versions',
        body: 'The most sophisticated versioning strategy is to need versions as rarely as possible by committing to additive-only, backward-compatible evolution, which many of the best-run APIs treat as their default. Under this discipline you never remove or repurpose fields and only ever add new optional ones, so existing clients keep working indefinitely while new clients opt into new capabilities, and a hard version bump becomes a rare event reserved for genuinely unavoidable breaking changes. Tolerant readers reinforce this: clients are designed to ignore unknown fields rather than reject them, so the server can add fields freely without coordination. When a breaking change is truly necessary, some platforms use date-based versions pinned per account, as Stripe does, where each customer is locked to the API behavior from when they integrated and upgrades are an explicit, opt-in migration. This converts versioning from a global event into a per-consumer choice, dramatically reducing the blast radius. The deep insight is that the cheapest version to maintain is the one you never had to create, so designing for additive evolution is more valuable than any particular versioning mechanism.',
      },
      {
        heading: 'Deprecation, sunsetting, and the maintenance burden',
        body: 'Every version you ship is a version you must maintain, and the real long-term cost of versioning is not creating versions but operating several of them at once, so a strategy is incomplete without a deprecation and sunset plan. Maintaining multiple major versions multiplies testing, bug-fixing, and security-patching work, and without a path to retire old versions you accumulate an ever-growing maintenance tax that slows the team for years. A humane deprecation process announces the timeline well in advance, communicates it through documentation, response headers like Sunset and Deprecation, and direct outreach, and gives clients ample time to migrate before the old version is removed. Measuring actual usage of each version is essential, because you cannot safely retire what you cannot see, and instrumenting version usage tells you which consumers still need migration. The goal is a steady state with few live versions, where new ones are added rarely and old ones are retired deliberately. Teams that version without a sunset discipline eventually drown in compatibility obligations, which is why the exit plan matters as much as the entry mechanism.',
      },
    ],
    diagrams: [
      {
        title: 'Versioning placement options',
        description: 'URL path is visible and cacheable; header versioning keeps URLs clean; date-pinned versions isolate each consumer.',
        type: 'comparison',
        svgContent: svg(720, 200, [
          box(20, 40, 210, 70, 'URL path', { stroke: 'accent', sub: '/v2/orders · visible' }),
          box(255, 40, 210, 70, 'Header / Accept', { sub: 'clean URLs · less discoverable' }),
          box(490, 40, 210, 70, 'Date-pinned', { stroke: 'green', sub: 'per-account · opt-in upgrade' }),
          label(360, 150, 'pick one and apply it consistently', { fill: 'muted', size: 11, anchor: 'middle' }),
        ].join('')),
      },
      {
        title: 'Additive evolution versus a version bump',
        description: 'Adding optional fields keeps v1 clients working; only a true breaking change forces v2.',
        type: 'timeline',
        svgContent: svg(720, 180, [
          lane(40, 40, 690, 'API evolution'),
          box(40, 60, 110, 40, 'v1', { stroke: 'accent' }),
          box(180, 60, 130, 40, '+ optional field', { stroke: 'green', sub: 'still v1' }),
          box(340, 60, 130, 40, '+ new endpoint', { stroke: 'green', sub: 'still v1' }),
          box(520, 60, 150, 40, 'remove field → v2', { stroke: 'red' }),
        ].join('')),
      },
    ],
    realWorldExamples: [
      {
        company: 'Stripe',
        problem: 'Continuously evolve a payments API used by enormous numbers of integrations without breaking any existing merchant when behavior changes.',
        solution: 'Pin each account to a dated API version captured at integration time, applying compatibility shims so old integrations see old behavior while new ones opt in explicitly to upgrades.',
        outcome: 'Stripe evolved aggressively for years without breaking existing clients, and its date-based per-account versioning became a celebrated model for API stability.',
      },
      {
        company: 'GitHub',
        problem: 'Support a huge ecosystem of clients across major API revisions while still being able to make breaking changes when necessary.',
        solution: 'Use explicit versioning (media-type and later dated REST versions) with clear deprecation timelines and Sunset signaling, plus a GraphQL API that evolves additively.',
        outcome: 'GitHub managed major API transitions with minimal ecosystem disruption by combining explicit versions, additive change, and disciplined deprecation.',
      },
    ],
    codeExamples: [
      {
        language: 'typescript',
        label: 'Version routing and deprecation headers',
        description: 'Route by URL version and signal deprecation with standard Sunset and Deprecation headers.',
        code: `import express from 'express';

const app = express();

// Current version.
app.get('/v2/orders/:id', (req, res) => {
  res.json({ id: req.params.id, total: 1299, currency: 'usd' });
});

// Deprecated version: still works, but advertises its retirement.
app.get('/v1/orders/:id', (req, res) => {
  res.setHeader('Deprecation', 'true');
  res.setHeader('Sunset', 'Wed, 31 Dec 2025 23:59:59 GMT');
  res.setHeader('Link', '</v2/orders>; rel="successor-version"');
  res.json({ id: req.params.id, amount: 1299 }); // old field name preserved
});`,
      },
      {
        language: 'python',
        label: 'Breaking-change classifier',
        description: 'A small checker that flags whether a schema diff is backward compatible or requires a new version.',
        code: `from dataclasses import dataclass


@dataclass(frozen=True)
class FieldChange:
    name: str
    kind: str  # 'added_optional' | 'added_required' | 'removed' | 'retyped'


def is_breaking(changes: list[FieldChange]) -> bool:
    breaking_kinds = {"added_required", "removed", "retyped"}
    return any(c.kind in breaking_kinds for c in changes)


def required_action(changes: list[FieldChange]) -> str:
    return "new major version" if is_breaking(changes) else "additive: same version"


diff = [
    FieldChange("discount", "added_optional"),
    FieldChange("amount", "retyped"),  # cents -> dollars: semantic break
]
print(required_action(diff))  # new major version`,
      },
    ],
    commonMistakes: [
      'Treating semantic changes (a field that now means something different) as non-breaking because the shape is unchanged.',
      'Mixing versioning schemes across endpoints so clients cannot reason about how to select a version.',
      'Introducing a new major version for changes that could have been made additively and backward compatible.',
      'Shipping versions with no deprecation timeline or usage metrics, accumulating an unbounded maintenance burden.',
      'Designing clients that reject unknown fields, forcing a version bump for changes that should have been additive.',
    ],
    whenNotToUse:
      'A private, internal API with a single first-party client that deploys in lockstep often does not need formal versioning, since you can change client and server together and the ceremony adds friction. Heavy versioning machinery is also overkill for an early-stage product still finding its shape, where breaking changes are cheap because there are no external consumers yet.',
    relatedTopics: ['rest-api-best-practices', 'graphql-rest-grpc', 'webhook-design', 'idempotency', 'api-gateway-pattern'],
    industryStandard: 'Stripe dated versions · GitHub API versioning · RFC 8594 (Sunset header) · semantic versioning',
    interviewTips:
      'Begin by defining breaking versus additive changes precisely, including the sneaky semantic break, because that classification is the heart of the topic. Compare URL, header, and date-pinned versioning with honest tradeoffs, then argue that the best strategy is additive evolution plus tolerant readers so hard versions are rare. Closing on deprecation timelines, Sunset headers, and usage metrics shows you understand that the real cost is maintaining versions, not creating them.',
  },

  {
    id: 'auth-jwt-sessions-oauth2',
    title: 'Authentication: JWT vs Sessions vs OAuth2',
    category: 'API Design',
    difficulty: 'Senior',
    readTime: 13,
    summary:
      'Sessions, JWTs, and OAuth2 solve overlapping but distinct problems. Sessions and JWTs are mechanisms for maintaining authenticated state, while OAuth2 is a framework for delegated authorization, and conflating them causes real security bugs.',
    whyItMatters:
      'Authentication is where security failures are most catastrophic and most common, and the choice between server sessions and stateless tokens shapes scalability, revocation, and attack surface. Misunderstanding what OAuth2 actually does, or treating a JWT as if it were revocable, leads directly to account takeovers, so this is knowledge a senior engineer must hold precisely.',
    content: [
      {
        heading: 'Sessions: stateful authentication',
        body: 'Session-based authentication keeps the source of truth on the server: when a user logs in, the server creates a session record, stores it in a database or cache, and hands the client an opaque session ID, usually in a cookie, which the client returns on every request. The server looks up that ID to retrieve the user\'s identity and state, which means the token itself carries no information and is meaningless if stolen without the matching server record. The defining strength of this model is control: because the server holds the state, it can revoke a session instantly by deleting the record, which makes logout, forced sign-out, and "log out everywhere" trivial and immediate. The cost is that every request requires a server-side lookup, and that session store becomes shared state every application server must reach, which is a scaling and availability consideration though a fast cache like Redis makes it cheap in practice. Sessions remain the right default for traditional web applications, especially with secure, http-only, same-site cookies that resist common attacks. The model is simple, well understood, and revocable, which is exactly what most applications need.',
      },
      {
        heading: 'JWTs: stateless tokens and the revocation problem',
        body: 'A JSON Web Token takes the opposite approach: instead of storing state on the server, the server signs a token that contains the user\'s claims, such as their ID and roles, and the client presents this self-contained token on each request, which the server validates by checking the signature without any lookup. The appeal is statelessness and scale, because any server with the signing key can validate a token independently, eliminating the shared session store and making JWTs attractive for distributed systems and APIs. But this strength is also the central weakness: because the server holds no record, it cannot easily revoke a JWT before it expires, so a stolen token remains valid until expiry no matter what, and a user clicking logout does not actually invalidate the token. The common mitigations all reintroduce state, including short token lifetimes paired with refresh tokens, and server-side denylists of revoked tokens, which quietly undermines the stateless premise. JWTs are genuinely useful for short-lived access tokens and service-to-service calls, but using a long-lived JWT as a session replacement, especially stored insecurely, is a frequent and dangerous mistake. The honest framing is that statelessness trades away revocation, and you must decide whether that trade is acceptable.',
      },
      {
        heading: 'OAuth2: delegated authorization, not authentication',
        body: 'OAuth2 is the most misunderstood of the three because it is not an authentication mechanism at all but a framework for delegated authorization, answering the question of how a user can grant a third-party application limited access to their resources without sharing their password. The canonical example is letting a photo-printing app access your cloud photos: OAuth2 lets you authorize the app to read those photos through an access token with a narrow scope, while never revealing your credentials to the app, and you can revoke that grant later. The flows, most importantly the authorization code flow with PKCE for public clients, define how the app obtains that scoped access token via redirects and a trusted authorization server. Crucially, OAuth2 by itself does not tell the app who the user is, which is why OpenID Connect was layered on top of OAuth2 to add an identity token and standardize authentication, and "log in with Google" is actually OIDC, not raw OAuth2. Confusing the two leads to insecure designs where developers use OAuth2 access tokens as proof of identity, a known anti-pattern. The precise mental model is that OAuth2 delegates access to resources, OIDC proves identity, and both can coexist with sessions or JWTs as the underlying token mechanics.',
      },
      {
        heading: 'Choosing and combining them securely',
        body: 'These three are not competitors to rank but tools for different jobs that frequently combine in one system, so the senior skill is composing them correctly. A typical architecture uses sessions or OIDC for first-party user login, short-lived JWTs as access tokens for API calls, refresh tokens to obtain new access tokens without re-authenticating, and OAuth2 flows when third parties need delegated access. The security details matter enormously: tokens in browsers should live in secure, http-only cookies rather than local storage to resist cross-site scripting theft, redirect URIs must be strictly validated to prevent token interception, and the PKCE extension protects public clients from authorization-code interception. Token lifetime is a direct tradeoff between security and convenience, where shorter access tokens limit the damage of theft but require more frequent refreshes. Whatever the choice, you should never roll your own crypto or token format and should lean on vetted libraries and identity providers, because the failure modes are subtle and the cost of a mistake is account takeover. The right design states explicitly which mechanism handles login, which handles API access, and how revocation works, rather than reaching for a single token type to do everything.',
      },
    ],
    diagrams: [
      {
        title: 'Stateful sessions versus stateless JWTs',
        description: 'Sessions look up server state and can revoke instantly; JWTs validate locally but cannot be revoked before expiry.',
        type: 'comparison',
        svgContent: svg(720, 200, [
          box(30, 40, 300, 60, 'Session (stateful)', { stroke: 'accent', sub: 'server lookup · instant revoke' }),
          box(30, 115, 140, 44, 'opaque cookie', { fill: 'cardAlt' }),
          arrow(170, 137, 230, 137, { label: 'lookup' }),
          box(230, 115, 100, 44, 'session store'),
          box(390, 40, 300, 60, 'JWT (stateless)', { stroke: 'amber', sub: 'local verify · no easy revoke' }),
          box(390, 115, 160, 44, 'signed token', { fill: 'cardAlt' }),
          arrow(550, 137, 610, 137, { label: 'verify sig' }),
          box(610, 115, 80, 44, 'key only'),
        ].join('')),
      },
      {
        title: 'OAuth2 authorization code flow (with PKCE)',
        description: 'The app gets a scoped access token via the authorization server without ever seeing the user password.',
        type: 'sequence',
        svgContent: svg(720, 240, [
          box(20, 40, 110, 44, 'User', { fill: 'cardAlt' }),
          box(20, 150, 110, 44, 'App (client)', { stroke: 'accent' }),
          box(300, 40, 150, 44, 'Authorization server', { stroke: 'purple' }),
          box(560, 150, 130, 44, 'Resource API', { stroke: 'green' }),
          arrow(130, 62, 300, 62, { label: 'consent' }),
          arrow(300, 84, 130, 150, { label: 'auth code', dashed: true }),
          arrow(130, 172, 300, 84, { label: 'code + verifier' }),
          arrow(300, 100, 130, 172, { label: 'access token', dashed: true }),
          arrow(130, 172, 560, 172, { label: 'token → scoped access' }),
        ].join('')),
      },
    ],
    realWorldExamples: [
      {
        company: 'Google (OAuth2 / OIDC)',
        problem: 'Let third-party apps access user data like calendar or photos, and let sites offer "sign in with Google," without those apps ever handling Google passwords.',
        solution: 'Implement OAuth2 for delegated, scoped resource access and OpenID Connect on top for authentication, issuing scoped access tokens and identity tokens through standard flows.',
        outcome: 'A vast ecosystem of apps integrates securely with Google accounts, and OAuth2/OIDC became the industry standard for delegated access and federated login.',
      },
      {
        company: 'Auth0 / Okta',
        problem: 'Most teams implement authentication insecurely when they build it themselves, repeatedly making the same subtle token and flow mistakes.',
        solution: 'Provide managed identity platforms implementing sessions, JWT access tokens, refresh tokens, and OAuth2/OIDC flows correctly, with secure defaults and revocation built in.',
        outcome: 'Teams adopted vetted auth rather than rolling their own, reducing account-takeover vulnerabilities across the industry.',
      },
    ],
    codeExamples: [
      {
        language: 'typescript',
        label: 'Short-lived JWT plus refresh, in http-only cookies',
        description: 'Issue a short access token and a longer refresh token, both in secure cookies, and verify on each request.',
        code: `import jwt from 'jsonwebtoken';

const ACCESS_TTL = '10m';
const REFRESH_TTL = '7d';

function issueTokens(userId: string, secret: string) {
  const accessToken = jwt.sign({ sub: userId, typ: 'access' }, secret, { expiresIn: ACCESS_TTL });
  const refreshToken = jwt.sign({ sub: userId, typ: 'refresh' }, secret, { expiresIn: REFRESH_TTL });
  return { accessToken, refreshToken };
}

// Store in http-only, secure, same-site cookies — never in localStorage (XSS).
function setAuthCookies(res: any, tokens: { accessToken: string; refreshToken: string }) {
  const base = { httpOnly: true, secure: true, sameSite: 'strict' as const };
  res.cookie('at', tokens.accessToken, { ...base, maxAge: 10 * 60 * 1000 });
  res.cookie('rt', tokens.refreshToken, { ...base, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

function verifyAccess(token: string, secret: string): string {
  const claims = jwt.verify(token, secret) as { sub: string; typ: string };
  if (claims.typ !== 'access') throw new Error('wrong token type');
  return claims.sub;
}`,
      },
      {
        language: 'python',
        label: 'Server-side session with instant revocation',
        description: 'A session store that issues opaque IDs and can revoke any session immediately, which JWTs cannot.',
        code: `import secrets
import time
from dataclasses import dataclass


@dataclass
class Session:
    user_id: str
    created_at: float


class SessionStore:
    def __init__(self, ttl_seconds: int = 3600):
        self._store: dict[str, Session] = {}
        self.ttl = ttl_seconds

    def create(self, user_id: str) -> str:
        sid = secrets.token_urlsafe(32)  # opaque, unguessable
        self._store[sid] = Session(user_id, time.time())
        return sid

    def resolve(self, sid: str) -> str | None:
        s = self._store.get(sid)
        if not s or time.time() - s.created_at > self.ttl:
            self._store.pop(sid, None)
            return None
        return s.user_id

    def revoke(self, sid: str) -> None:
        self._store.pop(sid, None)  # instant logout — impossible with a bare JWT`,
      },
    ],
    commonMistakes: [
      'Treating OAuth2 access tokens as proof of identity instead of using OpenID Connect, a known security anti-pattern.',
      'Using long-lived JWTs as session replacements and being unable to revoke a stolen token before expiry.',
      'Storing tokens in localStorage where cross-site scripting can steal them, instead of http-only cookies.',
      'Skipping PKCE or failing to strictly validate redirect URIs, enabling authorization-code interception.',
      'Rolling a custom token format or crypto rather than using vetted libraries and identity providers.',
    ],
    whenNotToUse:
      'Do not adopt stateless JWTs for a system that requires immediate, reliable revocation, such as banking or anything where instant forced logout is a hard requirement, because sessions serve that far better. Avoid pulling in full OAuth2 for a simple first-party login with no third-party delegation, where a plain session is simpler and less error-prone.',
    relatedTopics: ['owasp-top-10', 'rest-api-best-practices', 'secrets-management', 'security-headers', 'rbac-vs-abac'],
    industryStandard: 'OAuth2 (RFC 6749) · OpenID Connect · JWT (RFC 7519) · PKCE (RFC 7636) · OWASP ASVS',
    interviewTips:
      'Separate the three crisply: sessions and JWTs are state mechanisms while OAuth2 is delegated authorization, and OIDC is what actually proves identity. Make the revocation tradeoff central, explaining why a stateless JWT cannot be revoked before expiry and how short tokens plus refresh tokens reintroduce state. Mentioning http-only cookies over localStorage, PKCE, and never rolling your own crypto signals real security maturity.',
  },

  {
    id: 'webhook-design',
    title: 'Webhook Design',
    category: 'API Design',
    difficulty: 'Senior',
    readTime: 12,
    summary:
      'Webhooks invert the API model: instead of clients polling for changes, your service pushes events to a client-provided URL. Designing them well means solving delivery reliability, security, ordering, and idempotency on the receiver side.',
    whyItMatters:
      'Webhooks are how modern platforms deliver real-time events, from a payment succeeding to a build finishing, and a poorly designed webhook system silently drops events, replays them unsafely, or becomes an attack vector. Because the receiver is code you do not control, the burden of making delivery reliable and verifiable falls on careful design.',
    content: [
      {
        heading: 'Push versus poll and why webhooks exist',
        body: 'Without webhooks, a client that needs to know when something changes must poll, repeatedly asking the API whether anything is new, which is wasteful because most polls return nothing and is slow because the client only learns of a change at the next poll interval. Webhooks invert this by having the provider push an HTTP request to a URL the client registered whenever a relevant event occurs, so the client learns immediately and makes no wasted calls. This is dramatically more efficient and timely for event-driven integrations, which is why platforms like Stripe, GitHub, and Shopify deliver events this way. The inversion has a profound consequence: the provider is now an HTTP client calling into systems it does not own and cannot trust, which flips many assumptions, because the receiver might be slow, down, behind a firewall, or malicious. Every hard problem in webhook design flows from this inversion of the client-server relationship. Understanding that webhooks turn your API into a client of your customers is the key to designing them well.',
      },
      {
        heading: 'Delivery reliability: retries, ordering, and dead letters',
        body: 'Because the receiver may be temporarily down or slow, webhook delivery must assume failure and retry, which immediately raises the same delivery-semantics questions as message queues. A robust webhook system retries failed deliveries with exponential backoff over an extended period, often hours, so a receiver that was briefly down still eventually gets its events, and after exhausting retries it moves the event to a dead-letter state and surfaces it for manual replay rather than dropping it silently. This means webhooks are an at-least-once system, so receivers will sometimes get the same event more than once and must be prepared for duplicates. Ordering is another hard guarantee, because retries and parallel delivery mean events can arrive out of order, so well-designed webhooks include a timestamp or sequence number and advise receivers not to assume order, or the provider offers ordered delivery at the cost of throughput. Providers also typically offer a dashboard of delivery attempts and a way to manually resend, acknowledging that some failures need human intervention. Treating webhook delivery with the same rigor as a message pipeline, rather than a fire-and-forget POST, is what separates a reliable integration from a flaky one.',
      },
      {
        heading: 'Security: verifying the sender',
        body: 'A webhook endpoint is a publicly reachable URL that accepts data and triggers actions, which makes it an attractive attack target, so the receiver must be able to prove that a request genuinely came from the provider and was not forged or tampered with. The standard mechanism is a signature: the provider computes an HMAC of the request body using a shared secret and includes it in a header, and the receiver recomputes the HMAC and compares, rejecting any request whose signature does not match. This verifies both authenticity and integrity, since any modification to the body invalidates the signature, and it must use a constant-time comparison to avoid timing attacks. To prevent replay attacks, where an attacker captures a valid signed request and resends it, providers include a timestamp in the signed payload and receivers reject requests older than a short tolerance window. Receivers should also validate that the event is one they expect and treat all incoming data as untrusted input subject to the usual injection defenses. Skipping signature verification, which is alarmingly common, means anyone who learns the URL can inject fraudulent events, so it is the non-negotiable foundation of webhook security.',
      },
      {
        heading: 'Receiver design and fast acknowledgment',
        body: 'The provider expects a fast HTTP response, and a receiver that does heavy processing inline before responding will time out, trigger retries, and create duplicate work, so the correct pattern is to acknowledge immediately and process asynchronously. A well-built receiver verifies the signature, enqueues the event into its own internal queue, returns a 2xx response within a few hundred milliseconds, and processes the event from the queue separately, which decouples the provider\'s delivery from the receiver\'s workload. Because delivery is at-least-once, the receiver must be idempotent, deduplicating by the event ID the provider supplies so that a redelivered event is processed only once, which is the single most important correctness property on the receiving side. The receiver should also respond with the right status codes, using 2xx to acknowledge, and a non-2xx only when it genuinely wants a retry, since returning errors for events it cannot handle just causes pointless retries. Finally, the endpoint should be resilient to bursts, because events can arrive in floods after an outage clears. Fast acknowledgment plus idempotent asynchronous processing is the canonical receiver architecture that makes webhooks reliable in practice.',
      },
    ],
    diagrams: [
      {
        title: 'Poll versus webhook push',
        description: 'Polling wastes calls and adds latency; webhooks push events the moment they happen.',
        type: 'comparison',
        svgContent: svg(720, 190, [
          box(30, 40, 300, 46, 'Polling', { stroke: 'amber', sub: 'repeated "anything new?"' }),
          box(30, 110, 90, 40, 'client'),
          arrow(120, 130, 250, 130, { label: 'mostly empty' }),
          box(250, 110, 80, 40, 'API'),
          box(390, 40, 300, 46, 'Webhook', { stroke: 'green', sub: 'push on event' }),
          box(390, 110, 80, 40, 'API'),
          arrow(470, 130, 600, 130, { label: 'event!' }),
          box(600, 110, 90, 40, 'receiver'),
        ].join('')),
      },
      {
        title: 'Reliable webhook receiver',
        description: 'Verify signature, enqueue, ack fast, then process idempotently; failed deliveries retry then dead-letter.',
        type: 'architecture',
        svgContent: svg(720, 250, [
          box(30, 100, 110, 46, 'Provider', { stroke: 'accent' }),
          arrow(140, 123, 240, 123, { label: 'signed POST' }),
          box(240, 100, 120, 46, 'Verify + enqueue', { stroke: 'green' }),
          arrow(360, 113, 460, 113, { label: '2xx fast' }),
          box(460, 95, 110, 40, 'Internal queue'),
          arrow(515, 135, 515, 185, { label: 'async' }),
          box(450, 185, 130, 40, 'Idempotent worker', { sub: 'dedupe by event id' }),
          arrow(300, 146, 300, 205, { label: 'N fails', dashed: true }),
          box(230, 205, 130, 40, 'Dead letter', { stroke: 'red' }),
        ].join('')),
      },
    ],
    realWorldExamples: [
      {
        company: 'Stripe',
        problem: 'Notify merchants reliably about asynchronous events like successful payments and disputes, to systems Stripe does not control and cannot assume are always up.',
        solution: 'Deliver signed webhook events with HMAC signatures and timestamps, retry failed deliveries with backoff for hours, and provide a dashboard to inspect and resend events.',
        outcome: 'Merchants built dependable event-driven integrations, and Stripe\'s webhook signature and retry design became a widely copied reference implementation.',
      },
      {
        company: 'GitHub',
        problem: 'Let countless CI systems, bots, and integrations react instantly to repository events like pushes and pull requests without polling the API.',
        solution: 'Push signed webhook payloads for subscribed events, include a delivery ID for idempotency, sign with a secret, and expose recent deliveries with redelivery for debugging.',
        outcome: 'A massive ecosystem of automation reacts to GitHub events in real time, with signature verification and delivery IDs making integrations secure and duplicate-safe.',
      },
    ],
    codeExamples: [
      {
        language: 'typescript',
        label: 'Signature verification and fast ack',
        description: 'Verify the HMAC signature in constant time, reject stale requests, enqueue, and respond immediately.',
        code: `import crypto from 'node:crypto';
import express from 'express';

const app = express();
const SECRET = process.env.WEBHOOK_SECRET ?? '';
const TOLERANCE_SEC = 300;

function verify(rawBody: string, header: string): boolean {
  const [tsPart, sigPart] = header.split(',');
  const ts = Number(tsPart.replace('t=', ''));
  const sig = sigPart.replace('v1=', '');
  if (Math.abs(Date.now() / 1000 - ts) > TOLERANCE_SEC) return false; // replay guard
  const expected = crypto
    .createHmac('sha256', SECRET)
    .update(\`\${ts}.\${rawBody}\`)
    .digest('hex');
  // Constant-time compare to avoid timing attacks.
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

app.post('/webhooks', express.raw({ type: '*/*' }), (req, res) => {
  const raw = req.body.toString('utf8');
  if (!verify(raw, req.header('Stripe-Signature') ?? '')) {
    return res.status(400).send('bad signature');
  }
  // Enqueue and ack fast; process asynchronously and idempotently elsewhere.
  void enqueue(JSON.parse(raw));
  return res.status(200).send('ok');
});

async function enqueue(_event: unknown): Promise<void> {/* push to internal queue */}`,
      },
      {
        language: 'python',
        label: 'Idempotent webhook processing',
        description: 'Deduplicate by the provider event ID so at-least-once delivery never double-processes an event.',
        code: `class WebhookProcessor:
    def __init__(self, db):
        self.db = db

    def process(self, event: dict) -> str:
        event_id = event["id"]
        # Atomic insert; if the id already exists, this is a duplicate delivery.
        inserted = self.db.execute(
            "INSERT INTO processed_events (id) VALUES (%s) ON CONFLICT DO NOTHING",
            (event_id,),
        )
        if inserted.rowcount == 0:
            return "duplicate"  # already handled; safe to ignore

        self._handle(event)  # do the real work exactly once
        return "processed"

    def _handle(self, event: dict) -> None:
        if event["type"] == "payment.succeeded":
            ...  # fulfill the order, etc.`,
      },
    ],
    commonMistakes: [
      'Skipping signature verification, so anyone who discovers the URL can inject forged events.',
      'Processing the event inline before responding, causing timeouts, retries, and duplicate work.',
      'Assuming exactly-once delivery and not deduplicating, so a redelivered event is processed twice.',
      'Assuming events arrive in order when retries and parallelism mean they often do not.',
      'Omitting a replay-protection timestamp, letting an attacker resend a captured valid request.',
    ],
    whenNotToUse:
      'Webhooks are a poor fit when the consumer cannot expose a reachable public endpoint, such as a browser app or a service behind a strict firewall, where polling or a streaming connection works better. They are also overkill for low-frequency data a client can simply fetch on demand, where the operational weight of signed, retried delivery is not justified.',
    relatedTopics: ['idempotency', 'message-queues-event-streaming', 'rest-api-best-practices', 'retry-backoff', 'event-driven-architecture'],
    industryStandard: 'Stripe & GitHub webhooks · HMAC signing (RFC 2104) · Standard Webhooks spec · CloudEvents',
    interviewTips:
      'Frame webhooks as inverting the API so the provider becomes an untrusted client of the receiver, since every hard problem follows from that. Cover the three pillars deliberately: at-least-once delivery with retries and dead-lettering, HMAC signature verification with replay protection, and a receiver that acknowledges fast then processes idempotently. Naming idempotency by event ID as the key receiver-side property is the strongest single signal.',
  },

  {
    id: 'idempotency',
    title: 'Idempotency',
    category: 'API Design',
    difficulty: 'Senior',
    readTime: 11,
    summary:
      'An idempotent operation produces the same result whether performed once or many times. In distributed systems where retries and duplicates are inevitable, idempotency is what makes "try again" safe instead of catastrophic.',
    whyItMatters:
      'Networks lose responses, clients retry, and queues redeliver, so the same request will reach your system more than once whether you plan for it or not. Without idempotency, a retried payment charges the customer twice and a redelivered event ships two orders, which is why idempotency is the quiet backbone of correct distributed systems.',
    content: [
      {
        heading: 'What idempotency means and why it is unavoidable',
        body: 'An operation is idempotent if applying it multiple times has the same effect as applying it once, so setting a value to ten is idempotent because doing it again changes nothing, while incrementing a value by ten is not, because each repetition changes the result. This property matters because in any distributed system, duplicate requests are not an edge case but a certainty: a client sends a request, the server processes it successfully, but the response is lost to a network failure, and the client, unable to distinguish a lost response from a lost request, retries, causing the server to process the same logical operation twice. There is no way to fully eliminate this ambiguity, which is the fundamental reason idempotency is necessary rather than optional. The HTTP specification already builds this in, defining GET, PUT, and DELETE as idempotent and POST as not, which is why naive POST-based creation is the classic source of duplicate records. Recognizing that duplicates are guaranteed, not hypothetical, reframes idempotency from a nice-to-have into a core correctness requirement for any operation with side effects.',
      },
      {
        heading: 'Idempotency keys: the standard mechanism',
        body: 'The most general way to make an inherently non-idempotent operation safe is the idempotency key, a unique token the client generates and attaches to a request so the server can recognize a retry of that exact operation. The server stores the key along with the result of the first successful execution, and if a request arrives with a key it has already seen, the server skips re-executing the operation and instead returns the stored result, so the client gets a consistent answer no matter how many times it retries. This is exactly how Stripe makes payment creation safe: a client charging a card includes an idempotency key, and even if the response is lost and the client retries, the customer is charged only once because the server recognizes the repeated key. The implementation has subtleties, because the key-and-result record must be written atomically with the operation or a crash between them reopens the duplicate window, and the keys need a retention period and a scope so they do not collide across users. Concurrency must also be handled, since two requests with the same key can arrive simultaneously and the server must serialize them, typically with a unique constraint or lock. Done correctly, idempotency keys turn any unsafe operation into one that can be retried freely, which is why they are a near-universal pattern in serious APIs.',
      },
      {
        heading: 'Natural idempotency and designing it in',
        body: 'Idempotency keys are the general fallback, but the more elegant approach is to design operations that are naturally idempotent so no extra machinery is needed. Using a client-supplied unique identifier for a created resource makes creation idempotent, because a second create with the same ID can be detected as a duplicate or treated as a no-op rather than producing a second record. State-setting operations are naturally idempotent where state-mutating ones are not, so an API that says "set status to shipped" is safe to repeat while one that says "advance to the next status" is not. Conditional operations using version numbers or compare-and-set make updates safe by rejecting a write whose precondition no longer holds, which both prevents lost updates and makes retries harmless. Upserts, which insert or update based on a key, are another naturally idempotent building block widely used in data pipelines. The design lesson is that the cheapest idempotency is the kind built into the operation\'s semantics, so when you control the API shape you should prefer set-this-value and use-this-id formulations over increment and append. Reaching for idempotency keys is the right move when you cannot change the operation to be naturally safe.',
      },
      {
        heading: 'Idempotency across the resilience stack',
        body: 'Idempotency is not a standalone feature but the property that makes the entire resilience toolkit safe to use, because every pattern that improves reliability does so by repeating work. Retries are only safe on idempotent operations, which is why a retry policy must classify whether an operation can be retried at all before retrying it. At-least-once message delivery guarantees duplicates, so message consumers must be idempotent or the pipeline will double-process events, and webhook receivers face the identical requirement. Even exactly-once processing, the holy grail, is almost always implemented as at-least-once delivery plus idempotent consumers rather than as true exactly-once delivery, which is extraordinarily hard, so idempotency is what makes the practical approximation work. This is why idempotency keeps appearing alongside retries, queues, and webhooks throughout system design: it is the shared foundation that lets all of them tolerate the duplicates they inevitably produce. A senior engineer treats "is this idempotent" as a reflexive question for any operation with side effects, because the answer determines whether the rest of the resilience stack can be applied safely. Without it, retries and queues become mechanisms for corrupting data rather than for surviving failure.',
      },
    ],
    diagrams: [
      {
        title: 'Lost response forces a retry',
        description: 'The server succeeds but the response is lost; the client retries, and only an idempotency key prevents a double effect.',
        type: 'sequence',
        svgContent: svg(720, 200, [
          box(30, 80, 120, 46, 'Client', { stroke: 'accent' }),
          arrow(150, 95, 420, 95, { label: 'charge (key=abc)' }),
          box(420, 80, 130, 46, 'Server', { stroke: 'green' }),
          arrow(420, 120, 150, 120, { label: 'response LOST', stroke: 'red', dashed: true }),
          arrow(150, 145, 420, 145, { label: 'retry (key=abc) → same result' }),
          label(30, 185, 'same key → server returns stored result, no second charge', { fill: 'muted', size: 11 }),
        ].join('')),
      },
      {
        title: 'Idempotency key handling',
        description: 'First request executes and stores result under the key; duplicates short-circuit to the stored result.',
        type: 'flow',
        svgContent: svg(720, 200, [
          box(20, 80, 120, 46, 'Request + key', { fill: 'cardAlt' }),
          arrow(140, 103, 230, 103),
          box(230, 80, 130, 46, 'Key seen?', { stroke: 'accent' }),
          arrow(360, 90, 470, 60, { label: 'no' }),
          arrow(360, 116, 470, 150, { label: 'yes' }),
          box(470, 40, 180, 44, 'Execute + store result', { stroke: 'green' }),
          box(470, 128, 180, 44, 'Return stored result', { stroke: 'amber' }),
        ].join('')),
      },
    ],
    realWorldExamples: [
      {
        company: 'Stripe',
        problem: 'A lost response on a payment request would cause clients to retry and risk charging a customer twice, an unacceptable failure for a payments platform.',
        solution: 'Accept a client-generated Idempotency-Key header, store the first result against that key, and return the same result for any retry, so charges happen exactly once despite retries.',
        outcome: 'Clients can safely retry payment requests through network failures, and Stripe\'s idempotency-key design became the canonical pattern for safe write APIs.',
      },
      {
        company: 'Amazon / AWS',
        problem: 'Distributed services and queues redeliver messages and retry operations, which would duplicate side effects like launching resources or processing events.',
        solution: 'Provide idempotency tokens on mutating API calls and design services around idempotent operations, so at-least-once mechanisms cannot produce duplicate effects.',
        outcome: 'Customers build reliable automation on top of retries and queues without double-provisioning or double-processing, making at-least-once infrastructure safe to use.',
      },
    ],
    codeExamples: [
      {
        language: 'typescript',
        label: 'Idempotency-key middleware',
        description: 'Store the first result under the key atomically and short-circuit duplicates to that stored result.',
        code: `interface Store {
  // Returns existing result, or null if this key is new (and reserves it).
  reserve(key: string): Promise<{ status: number; body: unknown } | null>;
  complete(key: string, result: { status: number; body: unknown }): Promise<void>;
}

async function withIdempotency(
  key: string | undefined,
  store: Store,
  handler: () => Promise<{ status: number; body: unknown }>,
): Promise<{ status: number; body: unknown }> {
  if (!key) return handler(); // unkeyed: caller accepts at-most-once semantics

  const existing = await store.reserve(key);
  if (existing) return existing; // duplicate retry → identical response

  const result = await handler();
  await store.complete(key, result); // persist so future retries match
  return result;
}`,
      },
      {
        language: 'go',
        label: 'Naturally idempotent upsert',
        description: 'Insert-or-update on a unique key so repeating the operation converges to the same state.',
        code: `package idempotent

import "database/sql"

// UpsertOrder is idempotent: running it twice with the same id yields one row
// in the same final state, so retries and redeliveries are harmless.
func UpsertOrder(db *sql.DB, id string, total int, status string) error {
	_, err := db.Exec(\`
		INSERT INTO orders (id, total, status)
		VALUES ($1, $2, $3)
		ON CONFLICT (id) DO UPDATE
		SET total = EXCLUDED.total, status = EXCLUDED.status
	\`, id, total, status)
	return err
}

// Compare-and-set makes a transition idempotent and safe under concurrency.
func MarkShipped(db *sql.DB, id string, expectedVersion int) (bool, error) {
	res, err := db.Exec(\`
		UPDATE orders SET status = 'shipped', version = version + 1
		WHERE id = $1 AND version = $2
	\`, id, expectedVersion)
	if err != nil {
		return false, err
	}
	n, _ := res.RowsAffected()
	return n == 1, nil // false means a concurrent update already advanced it
}`,
      },
    ],
    commonMistakes: [
      'Using plain POST for creation with no idempotency key, producing duplicate records on every retry.',
      'Storing the idempotency key and executing the operation non-atomically, leaving a window for duplicates on a crash.',
      'Ignoring concurrent requests with the same key, so two simultaneous retries both execute.',
      'Building message consumers and webhook receivers that assume exactly-once delivery instead of deduplicating.',
      'Designing increment or append operations where a set or upsert would have been naturally idempotent.',
    ],
    whenNotToUse:
      'Operations that are already naturally idempotent, such as a pure GET or a state-setting PUT, need no extra idempotency-key machinery, and adding it there is pointless overhead. For internal, low-stakes operations with no meaningful side effects, the storage and complexity of idempotency keys may not be justified, though the bar for "no meaningful side effects" is higher than most engineers assume.',
    relatedTopics: ['retry-backoff', 'message-queues-event-streaming', 'webhook-design', 'rest-api-best-practices', 'consistency-models'],
    industryStandard: 'Stripe Idempotency-Key · HTTP method semantics (RFC 7231) · AWS idempotency tokens · IETF idempotency-key draft',
    interviewTips:
      'Define idempotency precisely with a concrete idempotent-versus-not example, then explain why lost responses make duplicates a certainty rather than an edge case. Walk through idempotency keys including the atomic store-and-execute and the concurrency handling, and show range by preferring naturally idempotent designs like upserts and compare-and-set when you control the API. The unifying senior point is that idempotency is what makes retries, queues, and webhooks safe, so you treat "is this idempotent" as a reflex for any write.',
  },

  {
    id: 'error-handling-standards',
    title: 'Error Handling Standards',
    category: 'API Design',
    difficulty: 'Senior',
    readTime: 12,
    summary:
      'Consistent error handling is a contract: it tells clients what went wrong, whether to retry, and how to react programmatically. Good error design uses correct status codes, structured machine-readable bodies, and never leaks internals.',
    whyItMatters:
      'Errors are part of your public API surface, and clients write code against them, so inconsistent or vague errors force every integrator to special-case your service and guess at failure modes. Well-designed errors reduce support load, make retries safe, and prevent security leaks, while sloppy ones turn every failure into a debugging session for someone else.',
    content: [
      {
        heading: 'Errors are an API contract, not an afterthought',
        body: 'Every error your API returns is consumed by client code that must decide what to do next, which means the structure and meaning of errors is as much a part of your contract as the success responses. When errors are inconsistent, returning a string here, an object there, a 200 with an error field somewhere else, every client is forced to write defensive, brittle parsing that breaks the moment you change anything. A disciplined approach defines a single error envelope used everywhere, so a client can reliably extract a machine-readable code, a human-readable message, and any structured details from the same shape regardless of which endpoint failed. This consistency is what lets clients build generic error handling once rather than per endpoint. It also signals professionalism, because an API whose errors are coherent is one integrators trust. The first principle of error handling is therefore to treat the error format as a designed, stable, documented contract rather than whatever each handler happens to throw.',
      },
      {
        heading: 'Use the right status codes, and use them honestly',
        body: 'HTTP status codes carry semantic meaning that intermediaries, clients, and monitoring all rely on, so using them correctly is foundational. The broad categories matter most: 2xx means success, 4xx means the client made a mistake that retrying without change will not fix, and 5xx means the server failed and the client may reasonably retry. Within these, specific codes communicate precisely, with 400 for malformed requests, 401 for missing or invalid authentication, 403 for authenticated-but-not-authorized, 404 for not found, 409 for conflicts, 422 for semantically invalid input, and 429 for rate limiting. The cardinal sin is returning 200 OK with an error embedded in the body, which breaks every layer that reasons about status codes, hides failures from monitoring, and defeats automatic retry logic. Equally wrong is collapsing everything into 500, which tells the client nothing actionable. Choosing the status code honestly, so it reflects who is at fault and whether a retry could succeed, is what makes the rest of the error usable.',
      },
      {
        heading: 'Structured, machine-readable bodies',
        body: 'A human-readable message alone is insufficient because client code cannot reliably branch on prose, so error bodies need a stable machine-readable code that programs key off and that never changes once published. A good error body combines several fields: a stable error code like "card_declined" or "rate_limited", a human-readable message for display and debugging, optional structured details such as which fields failed validation and why, and often a correlation or request ID that ties the error to server logs. The emerging standard for this is RFC 9457 Problem Details, which defines a JSON shape with type, title, status, detail, and instance fields, giving the industry a common vocabulary instead of every API inventing its own. Validation errors especially benefit from structure, because returning the specific fields and rules that failed lets a client highlight exactly the right inputs rather than showing a generic failure. The discipline is to separate the stable, programmatic part of an error from the human-facing message, so the message can be reworded freely while the code clients depend on stays fixed.',
      },
      {
        heading: 'Security, observability, and graceful failure',
        body: 'Error responses are a notorious source of information leakage, because a stack trace, a database error, or an internal hostname returned to the client hands an attacker a map of your system, so errors crossing a trust boundary must be sanitized to reveal nothing about internals. The pattern is to log the full detail server-side, attached to a correlation ID, while returning to the client only a generic message and that ID, so support can look up the real error without exposing it. This separation of internal and external error detail is essential for both security and good operations, since the correlation ID turns "it failed" into a precise log lookup. Observability also depends on errors being emitted as metrics and structured logs so that a spike in 5xx or a particular error code triggers alerts rather than being noticed by users first. Finally, graceful failure means the application keeps working as much as possible around an error, degrading a feature rather than crashing the whole request, and never leaving data in a half-written state. Errors handled this way protect both the user experience and the system, which is the whole point of taking them seriously.',
      },
    ],
    diagrams: [
      {
        title: 'Status code decision tree',
        description: 'Pick the code by who is at fault and whether a retry could succeed.',
        type: 'flow',
        svgContent: svg(720, 200, [
          box(20, 80, 110, 46, 'Request fails', { stroke: 'accent' }),
          arrow(130, 103, 220, 103),
          box(220, 80, 130, 46, 'Client error?', { sub: 'bad input/auth' }),
          arrow(350, 90, 460, 60, { label: 'yes → 4xx' }),
          arrow(350, 116, 460, 150, { label: 'no → 5xx' }),
          box(460, 38, 230, 44, '400/401/403/404/409/422/429', { stroke: 'amber' }),
          box(460, 130, 230, 44, '500/502/503 · retryable', { stroke: 'red' }),
        ].join('')),
      },
      {
        title: 'Internal vs external error detail',
        description: 'Full detail is logged with a correlation ID; the client sees only a safe message and that ID.',
        type: 'architecture',
        svgContent: svg(720, 220, [
          box(40, 90, 120, 46, 'Handler throws', { stroke: 'accent' }),
          arrow(160, 113, 270, 70, { label: 'log full' }),
          arrow(160, 113, 270, 160, { label: 'sanitize' }),
          box(270, 48, 180, 44, 'Logs: stack + query', { sub: 'id=req_abc', stroke: 'amber' }),
          box(270, 138, 180, 44, 'Client: safe message', { sub: 'id=req_abc', stroke: 'green' }),
          arrow(450, 70, 560, 110, { label: 'correlate' }),
          box(560, 90, 130, 46, 'Support lookup', { fill: 'cardAlt' }),
        ].join('')),
      },
    ],
    realWorldExamples: [
      {
        company: 'Stripe',
        problem: 'Developers integrating payments need to handle dozens of distinct failure modes (declines, fraud, validation) programmatically and reliably.',
        solution: 'Return a consistent error object with a stable type and code, a human message, and a parameter pointer, mapped onto correct HTTP status codes and documented exhaustively.',
        outcome: 'Integrators write robust error handling against stable codes, and Stripe\'s error design is frequently cited as a model for API error contracts.',
      },
      {
        company: 'Google (API design guide)',
        problem: 'Hundreds of internal and external APIs returned errors inconsistently, making clients hard to write and failures hard to diagnose.',
        solution: 'Standardize on a canonical error model with a small set of status codes, a structured error payload, and guidance on never leaking internal detail, published in the Google API Improvement Proposals.',
        outcome: 'Errors became uniform across a vast API surface, simplifying client libraries and tooling and reducing integration friction.',
      },
    ],
    codeExamples: [
      {
        language: 'typescript',
        label: 'Problem Details error envelope',
        description: 'A typed error helper that produces RFC 9457-style bodies with a stable code and a correlation id.',
        code: `interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  code: string; // stable, machine-readable; clients branch on this
  detail: string; // human-readable; safe to reword
  instance: string; // correlation id for log lookup
  errors?: Record<string, string>; // field-level validation detail
}

function problem(
  status: number,
  code: string,
  detail: string,
  errors?: Record<string, string>,
): ProblemDetails {
  return {
    type: \`https://errors.example.com/\${code}\`,
    title: code.replace(/_/g, ' '),
    status,
    code,
    detail,
    instance: \`req_\${crypto.randomUUID()}\`,
    errors,
  };
}

// 422 with field-level detail the client can map to inputs.
const body = problem(422, 'validation_failed', 'Some fields are invalid', {
  email: 'must be a valid email',
  age: 'must be >= 0',
});`,
      },
      {
        language: 'python',
        label: 'Sanitizing errors at the boundary',
        description: 'Log the real exception with a correlation id and return only a safe payload to the caller.',
        code: `import logging
import uuid

logger = logging.getLogger("api")


class AppError(Exception):
    def __init__(self, status: int, code: str, message: str):
        self.status = status
        self.code = code
        self.message = message  # safe for clients


def handle(exc: Exception) -> tuple[int, dict]:
    correlation_id = f"req_{uuid.uuid4().hex[:12]}"
    if isinstance(exc, AppError):
        # Expected, client-safe error.
        return exc.status, {"code": exc.code, "message": exc.message, "id": correlation_id}

    # Unexpected: log full detail server-side, reveal nothing to the client.
    logger.exception("unhandled error id=%s", correlation_id)
    return 500, {
        "code": "internal_error",
        "message": "An unexpected error occurred.",
        "id": correlation_id,
    }`,
      },
    ],
    commonMistakes: [
      'Returning 200 OK with an error in the body, breaking status-aware clients, monitoring, and retry logic.',
      'Collapsing every failure into 500, telling clients nothing about whether they caused it or should retry.',
      'Leaking stack traces, SQL errors, or internal hostnames in responses, handing attackers a map of the system.',
      'Using unstable, human-readable messages as the thing clients branch on instead of a fixed machine-readable code.',
      'Omitting a correlation id, so a reported failure cannot be tied back to the server logs that explain it.',
    ],
    whenNotToUse:
      'A tiny internal script or a one-off tool with a single trusted caller does not need a full Problem Details envelope and correlation infrastructure, where a simple thrown error is enough. Do not over-engineer error taxonomies for endpoints with one obvious failure mode, since excessive structure there is ceremony without payoff.',
    relatedTopics: ['rest-api-best-practices', 'api-versioning', 'idempotency', 'logging-best-practices', 'graceful-degradation'],
    industryStandard: 'RFC 9457 Problem Details · Stripe & Google API error models · HTTP status semantics (RFC 9110)',
    interviewTips:
      'Treat errors as a versioned contract and lead with correct status-code semantics, especially the rule that 4xx is the client\'s fault and 5xx is retryable. Propose a structured envelope with a stable code separate from the human message, and bring up RFC 9457 to show current knowledge. The security and operations signal is sanitizing errors at the boundary while logging full detail under a correlation id.',
  },

  {
    id: 'zero-trust-architecture',
    title: 'Zero Trust Architecture',
    category: 'Security',
    difficulty: 'Senior',
    readTime: 12,
    summary:
      'Zero Trust replaces the old "trusted internal network" model with "never trust, always verify": every request is authenticated, authorized, and encrypted based on identity and context, regardless of where it originates.',
    whyItMatters:
      'The traditional castle-and-moat model assumes everything inside the network is safe, so a single breached device or stolen VPN credential gives an attacker free lateral movement across everything. Zero Trust eliminates that implicit trust, containing breaches and adapting to a world of cloud, remote work, and dissolving network perimeters, which is why it is now the dominant enterprise security model.',
    content: [
      {
        heading: 'Why the perimeter model failed',
        body: 'The classic security model treated the corporate network as a trusted interior protected by a hardened perimeter, so once you were inside, via the office network or a VPN, you were largely trusted to move freely. This castle-and-moat approach fails catastrophically in the modern world for several reasons: the perimeter has dissolved as workloads moved to the cloud and employees work from anywhere, so there is no longer a clean inside and outside. Worse, the model offers no defense against an attacker who gets inside, and attackers routinely do through phishing, stolen credentials, or a single compromised device, after which they move laterally with the network\'s implicit trust working for them. High-profile breaches repeatedly followed this pattern, where one foothold became total compromise because internal traffic was unverified. The perimeter also cannot distinguish a legitimate user from an attacker using that user\'s stolen credentials, because location inside the network was treated as proof of trustworthiness. Recognizing that implicit network trust is the root weakness is the starting point for Zero Trust, which removes that assumption entirely.',
      },
      {
        heading: 'The core principles',
        body: 'Zero Trust rests on a few principles that together replace network-based trust with identity-and-context-based verification on every request. The first is "never trust, always verify," meaning no request is trusted because of its origin and every one must prove its identity and authorization regardless of whether it comes from inside or outside. The second is least privilege, granting each identity only the minimum access it needs and only for as long as it needs it, so a compromised identity unlocks little. The third is assume breach, designing as though attackers are already inside, which leads to micro-segmentation that limits how far any compromise can spread and to continuous monitoring that hunts for intrusions. Verification is also continuous and contextual rather than a one-time gate, evaluating signals like device health, user behavior, location, and risk on every access decision, so trust is re-established constantly rather than granted once at login. These principles apply uniformly to users, devices, services, and data. Together they shift security from guarding a boundary to verifying every interaction, which is the essence of the model.',
      },
      {
        heading: 'How it is actually built',
        body: 'Implementing Zero Trust centers on strong identity and a policy decision point that authorizes every access request based on identity and context. Strong identity is the foundation, requiring robust authentication, multi-factor authentication, and verified device posture so the system knows who and what is making each request. A policy engine then evaluates each request against rules combining identity, device health, resource sensitivity, and contextual risk, granting fine-grained, often just-in-time access rather than broad standing permissions. Micro-segmentation divides the network and workloads into small zones with their own access controls, so even a successful breach is contained to a tiny blast radius instead of spreading freely. Service-to-service communication is secured with mutual TLS so services authenticate each other cryptographically rather than trusting network location, which is why mTLS and service meshes are common Zero Trust building blocks. Google\'s BeyondCorp pioneered applying these ideas to employee access, removing the VPN and making every internal application require per-request authentication and authorization. The combination of strong identity, contextual policy, micro-segmentation, and encrypted authenticated service traffic is how the abstract principles become a working architecture.',
      },
      {
        heading: 'Tradeoffs and the road to adoption',
        body: 'Zero Trust is powerful but not free, and pretending it is leads to stalled or painful rollouts. The benefits are substantial: breaches are contained because lateral movement is blocked, remote and cloud access become secure without a network perimeter, and security adapts continuously to context rather than trusting a one-time login. The costs are real complexity and effort, because you must establish strong identity everywhere, instrument device posture, build and maintain policy, and segment systems that were never designed for it, all of which is a multi-year journey rather than a product you install. There is also a user-experience tension, since more verification can mean more friction, which is why good implementations use risk-based authentication that stays invisible for low-risk access and steps up only when signals warrant. Legacy systems that assume a trusted network are often the hardest part, requiring gateways or gradual modernization. The pragmatic path is incremental: start with the most sensitive resources, establish strong identity and MFA, segment progressively, and expand coverage over time. Treating Zero Trust as a strategy and a journey, not a switch you flip, is what separates successful adoptions from frustrated ones.',
      },
    ],
    diagrams: [
      {
        title: 'Castle-and-moat versus Zero Trust',
        description: 'The old model trusts everything inside; Zero Trust verifies every request by identity and context.',
        type: 'comparison',
        svgContent: svg(720, 200, [
          box(30, 40, 300, 60, 'Perimeter (castle-and-moat)', { stroke: 'red', sub: 'inside = trusted → lateral movement' }),
          box(30, 115, 280, 44, 'one breach → free movement', { fill: 'cardAlt' }),
          box(390, 40, 300, 60, 'Zero Trust', { stroke: 'green', sub: 'verify every request · least privilege' }),
          box(390, 115, 280, 44, 'breach contained to one segment', { fill: 'cardAlt' }),
        ].join('')),
      },
      {
        title: 'Policy decision point on every request',
        description: 'Identity, device posture, and context feed a policy engine that grants just-in-time, least-privilege access.',
        type: 'architecture',
        svgContent: svg(720, 240, [
          box(30, 100, 110, 46, 'User + device', { stroke: 'accent' }),
          arrow(140, 123, 250, 123, { label: 'request' }),
          box(250, 90, 140, 66, 'Policy engine', { stroke: 'purple', sub: 'identity·posture·risk' }),
          arrow(250, 90, 200, 50, { label: 'MFA', dashed: true }),
          box(150, 30, 110, 36, 'Identity / MFA'),
          arrow(390, 110, 500, 70, { label: 'allow (scoped)' }),
          arrow(390, 140, 500, 180, { label: 'deny / step-up', dashed: true }),
          box(500, 50, 160, 40, 'Resource (segment)', { stroke: 'green' }),
          box(500, 165, 160, 40, 'Challenge / block', { stroke: 'red' }),
        ].join('')),
      },
    ],
    realWorldExamples: [
      {
        company: 'Google (BeyondCorp)',
        problem: 'Employees needed secure access to internal apps from anywhere, but the VPN-and-trusted-network model was fragile and gave broad implicit trust.',
        solution: 'Build BeyondCorp, removing the privileged corporate network and requiring every request to any internal app to be authenticated and authorized by user identity and device state.',
        outcome: 'Google enabled secure access from any network without a VPN, and BeyondCorp became the reference implementation that popularized Zero Trust.',
      },
      {
        company: 'US Federal Government',
        problem: 'After major breaches exploiting implicit network trust, agencies needed a mandated, consistent path to modern security.',
        solution: 'Issue executive guidance and the NIST 800-207 standard requiring agencies to adopt Zero Trust principles, with identity, segmentation, and continuous verification as pillars.',
        outcome: 'Zero Trust moved from vendor concept to required architecture across government, accelerating its adoption as the default enterprise model.',
      },
    ],
    codeExamples: [
      {
        language: 'typescript',
        label: 'Contextual policy decision',
        description: 'A policy function that authorizes per request using identity, device posture, and contextual risk.',
        code: `interface AccessContext {
  userId: string;
  roles: string[];
  deviceCompliant: boolean;
  mfaSatisfied: boolean;
  riskScore: number; // 0 (low) .. 1 (high)
  resourceSensitivity: 'low' | 'high';
}

type Decision = 'allow' | 'step-up' | 'deny';

function authorize(ctx: AccessContext, requiredRole: string): Decision {
  if (!ctx.roles.includes(requiredRole)) return 'deny'; // least privilege
  if (!ctx.deviceCompliant) return 'deny'; // assume breach: untrusted device
  if (ctx.resourceSensitivity === 'high' && !ctx.mfaSatisfied) return 'step-up';
  if (ctx.riskScore > 0.7) return 'step-up'; // risk-based, continuous verify
  return 'allow';
}

console.log(authorize(
  { userId: 'u1', roles: ['eng'], deviceCompliant: true, mfaSatisfied: false, riskScore: 0.2, resourceSensitivity: 'high' },
  'eng',
)); // 'step-up'`,
      },
      {
        language: 'go',
        label: 'Per-request verification middleware',
        description: 'Middleware that re-verifies identity and device on every request rather than trusting a session origin.',
        code: `package zerotrust

import "net/http"

type Verifier interface {
	Identity(r *http.Request) (string, bool)   // strong identity, not IP
	DeviceCompliant(r *http.Request) bool       // posture check
	RiskOK(r *http.Request) bool                // contextual risk
}

// Enforce wraps a handler so every request is verified, regardless of origin.
func Enforce(v Verifier, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if _, ok := v.Identity(r); !ok {
			http.Error(w, "unauthenticated", http.StatusUnauthorized)
			return
		}
		if !v.DeviceCompliant(r) {
			http.Error(w, "device not compliant", http.StatusForbidden)
			return
		}
		if !v.RiskOK(r) {
			http.Error(w, "step-up required", http.StatusForbidden)
			return
		}
		next.ServeHTTP(w, r) // trust is earned per request, never assumed
	})
}`,
      },
    ],
    commonMistakes: [
      'Treating Zero Trust as a product to buy rather than an architecture and multi-year strategy.',
      'Adding MFA at the edge but still trusting all east-west (internal) traffic, leaving lateral movement open.',
      'Granting broad standing permissions instead of least-privilege, just-in-time access.',
      'Verifying identity once at login instead of continuously evaluating context on every request.',
      'Ignoring legacy systems that assume a trusted network, leaving a soft underbelly behind the new controls.',
    ],
    whenNotToUse:
      'A tiny isolated system, a single-developer project, or a fully air-gapped environment may not justify the substantial investment Zero Trust demands, where simpler controls suffice. The model is also a poor fit to bolt on hastily, since a rushed, partial rollout that segments nothing meaningful can add friction without real security gain.',
    relatedTopics: ['mtls', 'rbac-vs-abac', 'secrets-management', 'security-headers', 'owasp-top-10'],
    industryStandard: 'NIST SP 800-207 · Google BeyondCorp · CISA Zero Trust Maturity Model',
    interviewTips:
      'Open by explaining why the perimeter model fails, specifically lateral movement after a single breach, since Zero Trust only makes sense as the answer to that. Recite the core principles, never trust always verify, least privilege, assume breach, continuous contextual verification, and ground them in concrete mechanisms like MFA, micro-segmentation, and mTLS. The senior signal is acknowledging it as an incremental journey with real UX and legacy-system tradeoffs, not a switch.',
  },

  {
    id: 'secrets-management',
    title: 'Secrets Management',
    category: 'Security',
    difficulty: 'Senior',
    readTime: 11,
    summary:
      'Secrets management is the disciplined handling of credentials, API keys, tokens, and certificates: storing them outside code, distributing them securely, rotating them regularly, and auditing their use.',
    whyItMatters:
      'Leaked secrets are one of the most common and damaging breach vectors, because a single API key or database password committed to a repository or baked into an image can hand an attacker the keys to everything. Treating secrets casually is how startups and giants alike get breached, while disciplined secrets management contains the damage and makes rotation routine.',
    content: [
      {
        heading: 'Why hardcoded secrets are a crisis',
        body: 'A secret is any credential that grants access, including database passwords, API keys, OAuth tokens, encryption keys, and TLS private keys, and the cardinal rule is that secrets must never live in source code. Hardcoded secrets are catastrophic because source code is copied, forked, shared, and committed to history, so a secret in a repository is effectively public to everyone with access and, once pushed, lives forever in git history even if later deleted. Automated scanners constantly crawl public repositories for leaked keys, and exposed credentials are exploited within minutes, sometimes faster than a human can react. The problem extends beyond code to configuration files, container images, CI logs, and error messages, all of which routinely leak secrets that engineers assumed were private. The first discipline is therefore strict separation of secrets from code and artifacts, so that the same codebase runs in every environment with the secret injected from outside. Recognizing that any secret touching the repository or an image is a secret that must be considered compromised is the mindset shift that secrets management requires.',
      },
      {
        heading: 'Where secrets should live',
        body: 'If secrets cannot be in code, they must be stored in a system designed to protect them, and the options form a hierarchy of safety. Environment variables are a common first step and far better than hardcoding, but they are weak protection because they leak into child processes, crash dumps, logs, and debugging tools, so they are acceptable for low-sensitivity values but not a real secrets solution. A dedicated secrets manager, such as HashiCorp Vault, AWS Secrets Manager, or a cloud key management service, is the proper home, providing encrypted storage, fine-grained access control, audit logging, and APIs that deliver secrets to applications at runtime without ever writing them to disk. These systems also support dynamic secrets, generating short-lived credentials on demand, for example a database password valid for an hour, which dramatically limits the value of any leaked credential. Encryption keys themselves belong in a key management service or hardware security module that can perform crypto operations without exposing the raw key. The principle is that secrets should be centralized in an auditable, access-controlled vault and delivered just-in-time to workloads, rather than scattered across config files and environment variables nobody can track.',
      },
      {
        heading: 'Rotation, least privilege, and dynamic secrets',
        body: 'A secret that never changes is a secret that, once leaked, grants access indefinitely, so regular rotation is essential to limit the window of exposure, and the harder truth is that rotation must be automated because manual rotation is so painful that teams avoid it until forced. Automated rotation means the secrets manager periodically generates a new credential and updates both the source system and the consumers, so a leaked secret expires on its own. Dynamic secrets take this further by issuing a fresh, short-lived credential for each consumer or session, so there is often no long-lived secret to leak at all, which is one of the most powerful patterns available. Least privilege applies as strongly to secrets as to anything else: each service should have access only to the specific secrets it needs, so a compromise of one service does not expose every credential. Scoping access tightly also makes audit logs meaningful, since you can see exactly which identity accessed which secret. Together, automated rotation, dynamic short-lived credentials, and tightly scoped access transform secrets from permanent liabilities into ephemeral, contained, auditable grants.',
      },
      {
        heading: 'Detection, response, and the human factor',
        body: 'Even with good practices, secrets leak, so a mature program assumes leaks will happen and builds detection and rapid response. Secret scanning in CI and on every commit catches credentials before they are pushed or alerts immediately when they are, and many platforms now scan pushes automatically and can revoke recognized provider keys on detection. When a leak is confirmed, the only safe response is to rotate the secret immediately, because a leaked secret must be treated as compromised regardless of how briefly it was exposed, and merely deleting it from the repository does nothing since it persists in history. Audit logging is what makes incident response possible, letting you see whether a leaked secret was actually used and what it touched. The human factor is decisive, because secrets management fails when it is inconvenient, so the tooling must make the secure path the easy path, with seamless injection into local development and CI so engineers never feel tempted to paste a key into code. The combination of prevention, detection, fast rotation, and developer-friendly tooling is what keeps a real organization safe, since any one of them alone is insufficient.',
      },
    ],
    diagrams: [
      {
        title: 'From hardcoded to managed secrets',
        description: 'The safety hierarchy: hardcoded is a breach, env vars are weak, a vault with rotation is the goal.',
        type: 'comparison',
        svgContent: svg(720, 180, [
          box(20, 50, 200, 60, 'Hardcoded in code', { stroke: 'red', sub: 'public forever in git' }),
          box(255, 50, 200, 60, 'Env variables', { stroke: 'amber', sub: 'leaks to logs/dumps' }),
          box(490, 50, 200, 60, 'Secrets manager', { stroke: 'green', sub: 'encrypted · rotated · audited' }),
          arrow(220, 80, 255, 80),
          arrow(455, 80, 490, 80),
        ].join('')),
      },
      {
        title: 'Runtime secret delivery with rotation',
        description: 'Apps fetch short-lived secrets from a vault at runtime; rotation updates source and consumers automatically.',
        type: 'architecture',
        svgContent: svg(720, 240, [
          box(40, 100, 120, 46, 'Service', { stroke: 'accent' }),
          arrow(160, 123, 270, 123, { label: 'authn + fetch' }),
          box(270, 95, 140, 56, 'Secrets manager', { stroke: 'purple', sub: 'audit + policy' }),
          arrow(410, 110, 520, 70, { label: 'dynamic cred' }),
          arrow(410, 140, 520, 180, { label: 'rotate', dashed: true }),
          box(520, 50, 160, 44, 'Short-lived DB cred', { stroke: 'green' }),
          box(520, 165, 160, 44, 'Database (updated)', { fill: 'cardAlt' }),
        ].join('')),
      },
    ],
    realWorldExamples: [
      {
        company: 'HashiCorp (Vault)',
        problem: 'Organizations had secrets scattered across config files, scripts, and environment variables with no central control, rotation, or audit.',
        solution: 'Build Vault, a central secrets manager with encrypted storage, fine-grained policies, audit logs, and dynamic secrets that generate short-lived credentials on demand.',
        outcome: 'Vault became a de facto standard for secrets management, letting teams centralize, rotate, and audit secrets and eliminate many long-lived credentials entirely.',
      },
      {
        company: 'GitHub',
        problem: 'Developers routinely committed API keys and tokens to repositories, where automated scanners and attackers exploited them within minutes.',
        solution: 'Ship secret scanning that detects known credential formats on push and partners with providers to automatically revoke recognized leaked keys.',
        outcome: 'Many leaked credentials are now caught and revoked before they can be abused, sharply reducing the impact of accidental commits.',
      },
    ],
    codeExamples: [
      {
        language: 'typescript',
        label: 'Fetch secrets at runtime, fail fast if missing',
        description: 'Load secrets from a manager at startup, never from code, and refuse to boot without them.',
        code: `interface SecretsClient {
  get(name: string): Promise<string>;
}

class Config {
  private constructor(
    readonly dbPassword: string,
    readonly stripeKey: string,
  ) {}

  // Built at startup from the secrets manager — secrets never live in code.
  static async load(client: SecretsClient): Promise<Config> {
    const [dbPassword, stripeKey] = await Promise.all([
      client.get('db/password'),
      client.get('stripe/secret_key'),
    ]);
    if (!dbPassword || !stripeKey) {
      // Fail fast: a missing secret is a fatal misconfiguration, not a default.
      throw new Error('required secret missing; refusing to start');
    }
    return new Config(dbPassword, stripeKey);
  }
}`,
      },
      {
        language: 'python',
        label: 'Pre-commit secret scanner',
        description: 'A minimal scanner that blocks commits containing high-entropy keys or known credential patterns.',
        code: `import re
import sys

PATTERNS = [
    re.compile(r"AKIA[0-9A-Z]{16}"),          # AWS access key id
    re.compile(r"sk_live_[0-9a-zA-Z]{24,}"),  # Stripe live key
    re.compile(r"-----BEGIN (RSA |EC )?PRIVATE KEY-----"),  # private key
]


def scan(diff_text: str) -> list[str]:
    hits: list[str] = []
    for line in diff_text.splitlines():
        if not line.startswith("+"):
            continue  # only inspect added lines
        for pat in PATTERNS:
            if pat.search(line):
                hits.append(line.strip())
    return hits


if __name__ == "__main__":
    findings = scan(sys.stdin.read())
    if findings:
        print("BLOCKED: possible secret in commit:")
        for f in findings:
            print("  ", f)
        sys.exit(1)  # block the commit`,
      },
    ],
    commonMistakes: [
      'Committing secrets to a repository and assuming deleting the file is enough, when git history keeps them forever.',
      'Treating environment variables as secure storage despite their leakage into logs, dumps, and child processes.',
      'Never rotating secrets, so a single leak grants indefinite access.',
      'Giving every service access to every secret instead of scoping access to least privilege.',
      'Responding to a leak by removing the secret from code instead of immediately rotating the compromised credential.',
    ],
    whenNotToUse:
      'A local-only hobby project with no sensitive data may not warrant a full vault deployment, where a gitignored env file is a reasonable starting point. Do not, however, mistake that exception for production: any system handling real user data, money, or third-party APIs needs proper secrets management from the start.',
    relatedTopics: ['encryption-at-rest-in-transit', 'zero-trust-architecture', 'owasp-top-10', 'mtls', 'ci-cd-pipeline-design'],
    industryStandard: 'HashiCorp Vault · AWS Secrets Manager / KMS · OWASP Secrets Management Cheat Sheet · NIST 800-57',
    interviewTips:
      'State the absolute rule that secrets never live in code or images, and explain why git history makes a leaked secret permanent. Walk the hierarchy from hardcoded to env vars to a real secrets manager, and emphasize automated rotation and dynamic short-lived credentials as the highest-leverage controls. Closing on secret scanning, immediate rotation on leak, and making the secure path the easy path shows operational maturity.',
  },

  {
    id: 'encryption-at-rest-in-transit',
    title: 'Encryption at Rest and in Transit',
    category: 'Security',
    difficulty: 'Senior',
    readTime: 12,
    summary:
      'Encryption protects data in two states: in transit as it moves across networks, and at rest as it sits in storage. Each addresses a different threat, and a complete design needs both plus disciplined key management.',
    whyItMatters:
      'Unencrypted data in transit can be intercepted on any network hop, and unencrypted data at rest is exposed the moment a disk, backup, or database is stolen or misconfigured. Encryption is both a baseline expectation and a frequent compliance requirement, and getting the key management wrong quietly negates all of it, so understanding both states deeply is essential.',
    content: [
      {
        heading: 'Two states, two threat models',
        body: 'Data exists in different states, and encryption protects two of them against distinct threats, which is why you need both rather than treating encryption as one thing. Encryption in transit protects data while it moves between systems, defending against an attacker who can observe or tamper with network traffic, such as someone on a shared Wi-Fi network, a malicious intermediary, or a compromised router. Encryption at rest protects data while it is stored on disk, in a database, or in a backup, defending against a different attacker, one who gains physical access to a drive, exfiltrates a backup, or exploits a misconfigured storage bucket. These threats are independent: encrypting in transit does nothing to protect a stolen backup, and encrypting at rest does nothing to protect data sniffed on the wire, so a system that does only one leaves a whole class of attacks open. There is also a third state, data in use, which is far harder to protect and addressed by emerging confidential-computing techniques. Understanding which threat each form of encryption actually defeats is the foundation, because it tells you that both are necessary and neither substitutes for the other.',
      },
      {
        heading: 'Encryption in transit: TLS done right',
        body: 'Encryption in transit on the modern internet means TLS, the protocol that secures HTTPS and most service-to-service traffic, providing confidentiality so data cannot be read, integrity so it cannot be tampered with, and authentication so the client knows it is talking to the real server. Doing TLS right means more than turning it on: you should use modern versions, TLS 1.2 or 1.3, and disable old ones like SSL and early TLS that have known weaknesses, and you should choose strong cipher suites that provide forward secrecy so that compromising a server\'s key later cannot decrypt past traffic. Certificate validation is essential and frequently bungled, because a client that does not properly verify the server\'s certificate can be transparently man-in-the-middled, defeating the entire point. TLS should be applied everywhere, not just at the public edge, because internal service-to-service traffic is also a target, which is the motivation for mutual TLS in service meshes. Certificate management, including automated issuance and renewal, is the operational reality that makes pervasive TLS sustainable. The principle is that transit encryption is only as strong as its weakest configuration choice, so version, cipher, and certificate discipline matter as much as enabling it at all.',
      },
      {
        heading: 'Encryption at rest: layers and what they actually protect',
        body: 'Encryption at rest can be applied at several layers, and understanding what each layer actually protects against is crucial because they are not equivalent. Full-disk or volume encryption protects against physical theft of the drive, but it provides no protection once the system is running and an attacker has access through the application, because the data is transparently decrypted for any authorized process. Database-level or transparent data encryption similarly protects the files on disk but not against a SQL injection or a compromised application credential, since those access the data through the legitimately decrypted path. Application-level or field-level encryption, where specific sensitive fields are encrypted before they are stored and decrypted only when needed, provides the strongest protection because the data is unreadable even to someone with full database access, but it is the most complex and limits the ability to query the encrypted fields. The right choice depends on the threat: disk encryption is a cheap baseline against theft, while field-level encryption is warranted for the most sensitive data like payment details or health records. The common mistake is assuming that because storage is encrypted, the data is safe, when in fact most application-layer attacks bypass storage encryption entirely.',
      },
      {
        heading: 'Key management is the whole game',
        body: 'Encryption merely transforms the problem of protecting data into the problem of protecting keys, so key management is where encryption succeeds or fails, and a perfectly encrypted system with poorly managed keys is not secure. The first rule is that keys must never be stored alongside the data they protect, because an attacker who steals an encrypted database and the key sitting next to it has gained nothing from the encryption. Keys belong in a dedicated key management service or hardware security module that controls access, logs usage, and can perform cryptographic operations without ever exposing the raw key material. Envelope encryption is the standard pattern at scale, where data is encrypted with a data key, the data key is itself encrypted by a master key held in the KMS, and only the master key needs the strongest protection, which makes rotation and access control tractable. Key rotation limits the damage of a compromised key and is often mandated by compliance, and it must be designed for from the start because retrofitting rotation is painful. Finally, never invent your own cryptography or key handling, because the failure modes are subtle and catastrophic, so you should rely on vetted libraries and managed key services. Done right, key management is what turns encryption from a checkbox into real protection.',
      },
    ],
    diagrams: [
      {
        title: 'Two states, two defenses',
        description: 'In transit defends against network interception; at rest defends against stolen storage. Both are needed.',
        type: 'comparison',
        svgContent: svg(720, 200, [
          box(30, 40, 300, 60, 'In transit (TLS)', { stroke: 'accent', sub: 'defeats network sniffing/MITM' }),
          box(30, 115, 280, 44, 'no help if a backup is stolen', { fill: 'cardAlt' }),
          box(390, 40, 300, 60, 'At rest (disk/field)', { stroke: 'green', sub: 'defeats stolen disk/backup' }),
          box(390, 115, 280, 44, 'no help against app-layer access', { fill: 'cardAlt' }),
        ].join('')),
      },
      {
        title: 'Envelope encryption with a KMS',
        description: 'Data is encrypted with a data key; the data key is wrapped by a master key that never leaves the KMS.',
        type: 'architecture',
        svgContent: svg(720, 230, [
          box(40, 100, 120, 46, 'Plaintext', { fill: 'cardAlt' }),
          arrow(160, 123, 260, 123, { label: 'encrypt' }),
          box(260, 100, 130, 46, 'Data key (DEK)', { stroke: 'accent' }),
          arrow(390, 123, 500, 123, { label: 'wrap' }),
          box(500, 100, 170, 46, 'Master key (KMS/HSM)', { stroke: 'purple', sub: 'never exported' }),
          box(260, 175, 130, 40, 'Ciphertext + wrapped DEK', { stroke: 'green' }),
          arrow(325, 146, 325, 175, { dashed: true }),
        ].join('')),
      },
    ],
    realWorldExamples: [
      {
        company: 'Let\'s Encrypt',
        problem: 'TLS adoption was held back by the cost and manual effort of obtaining and renewing certificates, leaving much of the web unencrypted in transit.',
        solution: 'Provide free certificates issued and renewed automatically via the ACME protocol, removing the cost and operational friction of pervasive TLS.',
        outcome: 'HTTPS adoption surged to the majority of web traffic, making encryption in transit the default rather than a premium feature.',
      },
      {
        company: 'AWS (KMS and envelope encryption)',
        problem: 'Customers needed to encrypt vast amounts of data at rest without managing master keys insecurely or building their own crypto.',
        solution: 'Offer KMS with envelope encryption, where services encrypt data with data keys that are wrapped by managed master keys, with access control, audit logging, and rotation built in.',
        outcome: 'Encryption at rest became a near-default across cloud storage and databases, with key management handled by a hardened managed service.',
      },
    ],
    codeExamples: [
      {
        language: 'typescript',
        label: 'Authenticated field encryption (AES-GCM)',
        description: 'Encrypt a sensitive field with AES-256-GCM, which provides both confidentiality and integrity.',
        code: `import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

// key comes from a KMS/secrets manager, never hardcoded.
function encryptField(plaintext: string, key: Buffer): string {
  const iv = randomBytes(12); // unique per message
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag(); // integrity check
  return Buffer.concat([iv, tag, ct]).toString('base64');
}

function decryptField(encoded: string, key: Buffer): string {
  const buf = Buffer.from(encoded, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ct = buf.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag); // throws if data was tampered with
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
}`,
      },
      {
        language: 'go',
        label: 'Strict TLS server config',
        description: 'A server that enforces modern TLS versions and forward-secret cipher suites.',
        code: `package transport

import (
	"crypto/tls"
	"net/http"
)

// HardenedServer enforces TLS 1.2+ and forward-secret ciphers only.
func HardenedServer(addr string, h http.Handler) *http.Server {
	cfg := &tls.Config{
		MinVersion: tls.VersionTLS12, // disable SSL/TLS 1.0/1.1
		CipherSuites: []uint16{
			tls.TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384, // forward secrecy
			tls.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
			tls.TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305,
		},
		PreferServerCipherSuites: true,
	}
	return &http.Server{Addr: addr, Handler: h, TLSConfig: cfg}
}`,
      },
    ],
    commonMistakes: [
      'Encrypting only in transit or only at rest, leaving the other threat model fully exposed.',
      'Disabling or skipping certificate validation, which silently allows man-in-the-middle attacks.',
      'Assuming disk or transparent database encryption protects against application-layer attacks like SQL injection.',
      'Storing encryption keys next to the encrypted data, so stealing the data steals the key too.',
      'Rolling custom crypto or key handling instead of using vetted libraries and a managed KMS.',
    ],
    whenNotToUse:
      'Truly public, non-sensitive data that is meant to be world-readable does not need at-rest encryption for confidentiality, though integrity may still matter. Field-level application encryption is overkill for data with no sensitivity and actively harmful where it blocks necessary queries, so reserve the heaviest encryption for the genuinely sensitive fields.',
    relatedTopics: ['secrets-management', 'mtls', 'security-headers', 'zero-trust-architecture', 'owasp-top-10'],
    industryStandard: 'TLS 1.3 (RFC 8446) · AES-GCM (NIST) · AWS KMS / envelope encryption · PCI DSS & HIPAA encryption requirements',
    interviewTips:
      'Separate the two states by their threat models first, since the interviewer wants to see you know in-transit and at-rest defend against different attackers and that you need both. For transit, mention TLS version, forward secrecy, and certificate validation; for at rest, distinguish disk, database, and field-level and what each truly protects. The decisive senior point is that key management is the whole game, including never co-locating keys with data and using envelope encryption with a KMS.',
  },

  {
    id: 'sql-injection-prevention',
    title: 'SQL Injection Prevention',
    category: 'Security',
    difficulty: 'Intermediate',
    readTime: 11,
    summary:
      'SQL injection happens when untrusted input is interpreted as part of a SQL command, letting attackers read, modify, or destroy data. The reliable defense is parameterized queries that keep data and code permanently separate.',
    whyItMatters:
      'SQL injection has been a top web vulnerability for decades and remains devastating because a single injectable query can dump an entire database, bypass authentication, or delete data. It is also entirely preventable with well-understood techniques, so shipping injectable code is both dangerous and inexcusable, making this knowledge mandatory for anyone who touches a database.',
    content: [
      {
        heading: 'The root cause: mixing code and data',
        body: 'SQL injection arises from a single fundamental mistake: building a SQL command by concatenating untrusted input directly into the query string, which mixes the data the user supplied with the code the database executes. When a username field is glued into a query, an attacker can supply input that is not a username at all but additional SQL, and because the database cannot tell where your intended query ends and the attacker\'s input begins, it executes the whole thing as one command. This lets the attacker break out of the intended data context and rewrite the query, for example turning a login check into one that always succeeds, or appending a statement that reads another table entirely. The classic payload that closes a quote and adds an always-true condition illustrates how a tiny input change subverts the entire query. The deep insight is that the vulnerability is not about any particular character to filter but about the architectural error of letting data become code. Every effective defense works by enforcing a strict boundary between the two, and every ineffective defense fails because it tries to clean the data while still mixing it with code.',
      },
      {
        heading: 'Parameterized queries: the real fix',
        body: 'The reliable, complete defense against SQL injection is the parameterized query, also called a prepared statement, which sends the SQL command and the data to the database separately so the data can never be interpreted as code. With parameterization, you write the query with placeholders, then pass the user input as bound parameters, and the database treats those parameters strictly as values no matter what characters they contain, so an attacker\'s SQL fragment is stored or compared as a literal string rather than executed. This works because the query structure is fixed and parsed before the data is ever introduced, eliminating the possibility of the data altering the command\'s meaning. Crucially, parameterized queries are not a filtering technique that might miss an edge case; they are a structural guarantee that closes the vulnerability by design, which is why they are the recommended defense rather than input sanitization. Every mainstream database library supports them, and using them consistently for all queries with any variable input is the single most important practice. The mistake teams make is using parameterization most of the time but concatenating in just one place, because a single injectable query is all an attacker needs.',
      },
      {
        heading: 'Defense in depth around the query',
        body: 'While parameterized queries are the primary defense, a robust system layers additional controls so that a mistake anywhere is less catastrophic. Input validation is a valuable supplement, rejecting input that does not match the expected shape, such as ensuring an ID is actually numeric, though it must be understood as defense in depth rather than the main protection, since validation alone is not a reliable defense against injection. The principle of least privilege applies strongly to database accounts: the application should connect with an account that has only the permissions it needs, so that even a successful injection cannot drop tables or read data the application never touches, dramatically limiting the blast radius. Object-relational mappers and query builders help because they parameterize by default, but they are not a free pass, since their raw-query escape hatches reintroduce the risk if used carelessly. Stored procedures can help when they use parameters internally but offer no protection if they themselves build dynamic SQL from input. The layered posture, parameterize everything, validate input, restrict database privileges, and be wary of raw-query escape hatches, ensures that the failure of any one control does not lead to total compromise.',
      },
      {
        heading: 'Detection, ORMs, and modern realities',
        body: 'Even disciplined teams benefit from detecting injection risks proactively rather than waiting for an incident, so static analysis and security scanners that flag string-concatenated queries belong in the development pipeline, and code review should treat any dynamically built SQL as a red flag requiring justification. Modern frameworks and ORMs have made injection rarer by parameterizing by default, which is genuine progress, but they have also created a false sense of safety, because developers reach for raw query methods to express something the ORM cannot, and that is exactly where injection sneaks back in. The same fundamental rule applies to every data store and query language, not just SQL: NoSQL databases, search engines, and LDAP all have their own injection variants that arise from the same code-data mixing, so the parameterization mindset generalizes. Logging and monitoring help detect attempted injection in production, since a spike in malformed inputs or database errors can indicate probing. The enduring lesson is that injection persists not because the fix is unknown but because a single careless concatenation undoes otherwise good practice, so vigilance at every query is what keeps a codebase safe. Treating parameterization as non-negotiable everywhere, and auditing for the exceptions, is the durable defense.',
      },
    ],
    diagrams: [
      {
        title: 'Concatenation versus parameterization',
        description: 'Concatenated input can become code; bound parameters are always treated as inert data.',
        type: 'comparison',
        svgContent: svg(720, 200, [
          box(20, 40, 320, 60, 'Concatenation', { stroke: 'red', sub: "... WHERE name = '\" + input + \"'" }),
          box(20, 115, 320, 44, "input: ' OR '1'='1 → bypass", { fill: 'cardAlt' }),
          box(380, 40, 320, 60, 'Parameterized', { stroke: 'green', sub: '... WHERE name = $1  (input bound)' }),
          box(380, 115, 320, 44, 'input stored as a literal string', { fill: 'cardAlt' }),
        ].join('')),
      },
      {
        title: 'How a prepared statement separates code and data',
        description: 'The query is parsed first; data is bound afterward and can never change the command structure.',
        type: 'sequence',
        svgContent: svg(720, 200, [
          box(20, 80, 130, 46, 'App', { stroke: 'accent' }),
          arrow(150, 95, 300, 95, { label: 'prepare SQL ($1)' }),
          box(300, 80, 140, 46, 'DB: parse plan', { sub: 'structure fixed' }),
          arrow(150, 120, 300, 120, { label: 'bind value' }),
          arrow(440, 103, 560, 103, { label: 'execute' }),
          box(560, 80, 130, 46, 'Value = data only', { stroke: 'green' }),
        ].join('')),
      },
    ],
    realWorldExamples: [
      {
        company: 'OWASP',
        problem: 'Injection has ranked among the most critical web vulnerabilities for years, yet developers kept reintroducing it through string-built queries.',
        solution: 'Publish the Injection guidance and cheat sheets establishing parameterized queries as the primary defense, with input validation and least privilege as supporting layers.',
        outcome: 'Parameterized queries became the industry-standard prescription, and frameworks increasingly adopted them by default, reducing injection prevalence.',
      },
      {
        company: 'Major retail breach (TalkTalk)',
        problem: 'An SQL injection vulnerability in a public web page exposed a large database of customer records to a relatively unsophisticated attacker.',
        solution: 'The incident underscored that unparameterized queries on internet-facing endpoints are catastrophic, driving mandated code review, scanning, and parameterization across the industry.',
        outcome: 'The breach became a cautionary case study, reinforcing that a single injectable query can compromise an entire customer database and incur major fines.',
      },
    ],
    codeExamples: [
      {
        language: 'typescript',
        label: 'Parameterized query (the only safe way)',
        description: 'Pass user input as bound parameters so it can never alter the query structure.',
        code: `import { Pool } from 'pg';

const pool = new Pool();

// SAFE: input is bound as a parameter, never concatenated into SQL.
async function findUser(email: string) {
  const result = await pool.query(
    'SELECT id, name FROM users WHERE email = $1',
    [email], // even "' OR '1'='1" is treated as a literal string
  );
  return result.rows[0] ?? null;
}

// UNSAFE — shown only to contrast; NEVER do this:
// await pool.query(\`SELECT * FROM users WHERE email = '\${email}'\`);`,
      },
      {
        language: 'python',
        label: 'Parameterized query + least privilege',
        description: 'Bind parameters and connect with a restricted database role to cap the blast radius.',
        code: `import psycopg2

# Connect with a least-privilege role: SELECT/INSERT only, no DROP/DDL.
conn = psycopg2.connect(dbname="app", user="app_readwrite")


def find_user(email: str):
    with conn.cursor() as cur:
        # SAFE: %s is a bound parameter, not string formatting.
        cur.execute("SELECT id, name FROM users WHERE email = %s", (email,))
        return cur.fetchone()


# UNSAFE — never build SQL with f-strings or %:
# cur.execute(f"SELECT * FROM users WHERE email = '{email}'")`,
      },
    ],
    commonMistakes: [
      'Using parameterized queries everywhere except one place where input is concatenated, which is all an attacker needs.',
      'Relying on input sanitization or escaping as the primary defense instead of parameterization.',
      'Trusting an ORM blindly while using its raw-query escape hatch with concatenated input.',
      'Connecting with a high-privilege database account, so a successful injection can drop tables or read everything.',
      'Assuming only SQL is affected and ignoring NoSQL, LDAP, and command injection variants of the same flaw.',
    ],
    whenNotToUse:
      'There is essentially no scenario where you should build queries by concatenating untrusted input; parameterization applies universally. The only nuance is that for fully static queries with no variable input there is nothing to parameterize, but the moment any value comes from outside, binding it is mandatory rather than optional.',
    relatedTopics: ['owasp-top-10', 'xss-csrf-protection', 'rest-api-best-practices', 'database-indexing', 'rbac-vs-abac'],
    industryStandard: 'OWASP Injection guidance & Query Parameterization Cheat Sheet · CWE-89 · PCI DSS',
    interviewTips:
      'Explain the root cause as mixing code and data, then present parameterized queries as a structural guarantee rather than a filtering trick, which is the distinction interviewers listen for. Add defense in depth, input validation and least-privilege database accounts, while being clear that parameterization is the primary fix and validation is not a reliable substitute. Mentioning that the same code-data principle covers NoSQL and LDAP injection shows you understand the underlying class, not just one symptom.',
  },

  {
    id: 'xss-csrf-protection',
    title: 'XSS and CSRF Protection',
    category: 'Security',
    difficulty: 'Senior',
    readTime: 12,
    summary:
      'XSS injects malicious script into pages other users view; CSRF tricks a logged-in user\'s browser into making unwanted requests. They are different attacks with different defenses, and a secure web app must address both.',
    whyItMatters:
      'XSS and CSRF are perennial web vulnerabilities that exploit the browser\'s trust model, and a successful attack can hijack sessions, steal data, or perform actions as the victim. They are frequently confused, yet their defenses are entirely different, so understanding each precisely is what lets you protect a web application rather than applying the wrong mitigation.',
    content: [
      {
        heading: 'XSS: when your page runs the attacker\'s script',
        body: 'Cross-site scripting occurs when an application includes untrusted data in a web page without proper handling, so that an attacker\'s input is interpreted by the browser as executable script rather than as inert content. Because that script runs in the victim\'s browser within the origin of your site, it inherits the victim\'s session and can read cookies and tokens, exfiltrate data, rewrite the page, or perform actions as the user, which makes XSS one of the most damaging client-side vulnerabilities. There are three main variants: stored XSS, where the malicious script is saved on the server, for example in a comment, and served to every viewer; reflected XSS, where the script comes from the request itself, such as a search term echoed into the page; and DOM-based XSS, where client-side JavaScript unsafely inserts data into the page. The common thread is the same code-versus-data confusion that underlies injection generally, applied to HTML and JavaScript instead of SQL. Understanding that XSS is fundamentally about untrusted data being treated as markup or script is what points you toward the correct defenses, which all work by ensuring user data is rendered as data.',
      },
      {
        heading: 'Defending against XSS',
        body: 'The primary defense against XSS is context-aware output encoding, meaning that whenever you place untrusted data into a page you encode it for the specific context, so that characters which would be interpreted as markup are rendered as literal text instead. Modern frameworks like React, Angular, and Vue provide enormous protection here because they escape interpolated values by default, treating them as text rather than HTML, which eliminates most XSS automatically as long as you do not bypass them. The dangerous escape hatches, such as setting raw HTML directly, reintroduce the risk and must be used only with sanitized input, ideally run through a vetted HTML sanitizer that strips dangerous tags and attributes. A strong Content Security Policy is a powerful second layer, instructing the browser to only execute scripts from approved sources and to block inline scripts, so that even if an injection slips through, the malicious script is refused execution. Storing session tokens in http-only cookies rather than JavaScript-accessible storage further limits what an XSS payload can steal. The layered approach, escape by default, sanitize when you must allow HTML, enforce a CSP, and keep tokens out of reach of script, is what reduces XSS from a likely vulnerability to a contained one.',
      },
      {
        heading: 'CSRF: abusing the browser\'s automatic credentials',
        body: 'Cross-site request forgery is a fundamentally different attack that exploits the fact that browsers automatically attach a user\'s cookies to requests for a site, regardless of what site initiated the request. An attacker who can get a logged-in victim to load a malicious page can have that page silently submit a request to your application, and because the browser includes the victim\'s session cookie, your server sees an authenticated request that the user never intended, such as a transfer of money or a change of email. The crucial distinction from XSS is that CSRF does not require injecting any script into your site; it abuses the ambient authority of the session cookie from an entirely separate origin. This is why XSS defenses do nothing for CSRF and vice versa, and why confusing them leads to systems that defend against one while remaining wide open to the other. CSRF specifically targets state-changing requests, since reading data the attacker cannot see provides little value. Recognizing that the vulnerability stems from cookies being sent automatically on cross-site requests is the key to understanding every CSRF defense, because each one works by ensuring a request genuinely originated from your own application.',
      },
      {
        heading: 'Defending against CSRF',
        body: 'The classic defense against CSRF is the anti-CSRF token, a secret, unpredictable value that your server embeds in forms and the client must return with each state-changing request, so that a malicious cross-site page cannot forge the request because it does not know the token. Because the token is tied to the user\'s session and cannot be read by another origin, its presence proves the request came from your own application rather than from an attacker\'s page. The modern and increasingly primary defense is the SameSite cookie attribute, which instructs the browser not to send the session cookie on cross-site requests, directly neutralizing the mechanism CSRF depends on, and SameSite set to Lax or Strict is now a strong baseline that browsers increasingly default to. For sensitive actions, verifying the origin or referer header adds another check that the request came from an expected source. It is also important that safe methods like GET never perform state changes, because CSRF protections assume that reads are side-effect-free and that only POST, PUT, PATCH, and DELETE need guarding. Combining SameSite cookies with anti-CSRF tokens for sensitive operations, while keeping GET truly read-only, provides robust protection. The principle across all of these is to require proof that a state-changing request originated from your application, which an attacker operating from another origin cannot supply.',
      },
    ],
    diagrams: [
      {
        title: 'XSS versus CSRF: different attacks',
        description: 'XSS runs attacker script in your page; CSRF rides the user\'s cookie from another site. Different defenses.',
        type: 'comparison',
        svgContent: svg(720, 200, [
          box(30, 40, 300, 60, 'XSS', { stroke: 'red', sub: 'inject script into your page' }),
          box(30, 115, 280, 44, 'fix: encode · CSP · sanitize', { stroke: 'green' }),
          box(390, 40, 300, 60, 'CSRF', { stroke: 'amber', sub: 'forge request with user cookie' }),
          box(390, 115, 280, 44, 'fix: SameSite · CSRF token', { stroke: 'green' }),
        ].join('')),
      },
      {
        title: 'CSRF token flow',
        description: 'The server issues a session-bound token; only requests carrying it are accepted for state changes.',
        type: 'sequence',
        svgContent: svg(720, 200, [
          box(20, 80, 120, 46, 'Browser', { stroke: 'accent' }),
          arrow(140, 95, 300, 95, { label: 'GET form' }),
          box(300, 80, 140, 46, 'Server', { stroke: 'green' }),
          arrow(300, 120, 140, 120, { label: 'form + CSRF token', dashed: true }),
          arrow(140, 140, 300, 140, { label: 'POST + token → accept' }),
          label(460, 95, 'attacker page lacks the token → rejected', { fill: 'muted', size: 11 }),
        ].join('')),
      },
    ],
    realWorldExamples: [
      {
        company: 'MySpace (Samy worm)',
        problem: 'A stored XSS vulnerability in profile pages let injected script run for every visitor, with no output encoding or CSP to stop it.',
        solution: 'The incident drove the industry toward mandatory output encoding, framework auto-escaping, and Content Security Policy as standard XSS defenses.',
        outcome: 'The self-propagating worm added over a million friends in under a day, becoming the textbook demonstration of why stored XSS is catastrophic.',
      },
      {
        company: 'Browser vendors (SameSite cookies)',
        problem: 'CSRF remained widespread because cookies were sent on all cross-site requests by default, and many sites lacked anti-CSRF tokens.',
        solution: 'Standardize the SameSite cookie attribute and shift browser defaults toward Lax, so session cookies are not sent on cross-site requests automatically.',
        outcome: 'A large class of CSRF attacks was neutralized by default at the browser level, complementing application-level token defenses.',
      },
    ],
    codeExamples: [
      {
        language: 'typescript',
        label: 'Safe rendering and HTML sanitization',
        description: 'Rely on framework escaping for text, and sanitize when raw HTML is genuinely required.',
        code: `import DOMPurify from 'isomorphic-dompurify';

// SAFE: frameworks escape interpolated text by default → rendered as data.
function Comment({ text }: { text: string }) {
  return <p>{text}</p>; // even "<script>" becomes literal text
}

// If you MUST render user HTML (e.g. rich text), sanitize first.
function RichComment({ html }: { html: string }) {
  const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS: ['b', 'i', 'a', 'p'] });
  // dangerouslySetInnerHTML is only safe with sanitized input.
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
}

// CSP header (set server-side) blocks injected/inline scripts:
// Content-Security-Policy: default-src 'self'; script-src 'self'`,
      },
      {
        language: 'python',
        label: 'CSRF token + SameSite cookie',
        description: 'Issue a session-bound CSRF token, set a SameSite session cookie, and verify the token on writes.',
        code: `import hmac
import secrets


def issue_csrf_token(session_secret: bytes, session_id: str) -> str:
    # Token bound to the session; an attacker cannot compute it.
    return hmac.new(session_secret, session_id.encode(), "sha256").hexdigest()


def set_session_cookie(response, session_id: str) -> None:
    response.set_cookie(
        "session", session_id,
        httponly=True, secure=True, samesite="Lax",  # blocks most CSRF
    )


def verify_csrf(session_secret: bytes, session_id: str, submitted: str) -> bool:
    expected = issue_csrf_token(session_secret, session_id)
    # Constant-time compare to avoid leaking the token via timing.
    return hmac.compare_digest(expected, submitted)


# On POST/PUT/PATCH/DELETE: reject if verify_csrf(...) is False.`,
      },
    ],
    commonMistakes: [
      'Confusing XSS and CSRF and applying one defense (like CSRF tokens) while leaving the other attack wide open.',
      'Using a framework\'s raw-HTML escape hatch with unsanitized user input, reintroducing XSS.',
      'Storing session tokens in localStorage where an XSS payload can steal them, instead of http-only cookies.',
      'Performing state changes on GET requests, which CSRF protections assume are side-effect-free.',
      'Relying on hidden form fields or referer checks alone, without SameSite cookies or proper anti-CSRF tokens.',
    ],
    whenNotToUse:
      'A purely static site with no user input and no authenticated state has little XSS surface and no CSRF surface, so heavy machinery there is unnecessary. CSRF tokens specifically are pointless for stateless APIs authenticated by bearer tokens in headers rather than cookies, since there is no ambient cookie credential to forge, so the right defense depends on how the request is authenticated.',
    relatedTopics: ['owasp-top-10', 'sql-injection-prevention', 'security-headers', 'auth-jwt-sessions-oauth2', 'zero-trust-architecture'],
    industryStandard: 'OWASP XSS & CSRF Prevention Cheat Sheets · Content Security Policy (W3C) · SameSite cookies (RFC 6265bis)',
    interviewTips:
      'Distinguish the two crisply up front: XSS runs attacker script in your origin, CSRF rides the user\'s cookie from another origin, and their defenses do not overlap. For XSS, cover output encoding, framework auto-escaping, sanitization for raw HTML, and CSP; for CSRF, cover SameSite cookies, anti-CSRF tokens, and keeping GET side-effect-free. Noting that CSRF tokens are unnecessary for header-based bearer-token APIs shows you reason about the actual authentication mechanism rather than reciting defenses.',
  },

  {
    id: 'ddos-protection',
    title: 'DDoS Protection',
    category: 'Security',
    difficulty: 'Senior',
    readTime: 11,
    summary:
      'A distributed denial-of-service attack overwhelms a target with traffic from many sources to make it unavailable. Defense layers absorb volume at the edge, filter malicious traffic, and shed load so legitimate users still get through.',
    whyItMatters:
      'DDoS attacks are cheap to launch, increasingly large, and can take an unprotected service offline in seconds, costing revenue and trust. Because a single origin cannot absorb a massive distributed flood, defense requires architecture rather than a quick fix, so understanding the attack types and layered mitigations is essential for anyone running internet-facing systems.',
    content: [
      {
        heading: 'What a DDoS attack actually does',
        body: 'A denial-of-service attack aims to make a service unavailable to legitimate users, and the distributed form uses many machines at once, often a botnet of compromised devices, so the traffic comes from thousands of sources and cannot simply be blocked by banning one address. The attacks fall into broad categories by which layer they target: volumetric attacks try to saturate your network bandwidth with sheer traffic volume, protocol attacks exhaust server or firewall resources by abusing how protocols work, such as half-open TCP connections, and application-layer attacks send seemingly legitimate but expensive requests that exhaust application resources like database connections or CPU. Application-layer attacks are especially insidious because each request looks valid, so they are harder to distinguish from real traffic and can be effective at far lower volume. The defining challenge is that the attacker only needs to exceed your capacity at any one layer, while you must have headroom and filtering at all of them. Understanding which layer an attack targets determines which defense applies, because a mitigation for a bandwidth flood does nothing against a flood of expensive API calls. Recognizing these categories is the starting point for any coherent defense.',
      },
      {
        heading: 'Absorbing volume at the edge',
        body: 'The first principle of DDoS defense is that you cannot absorb a massive distributed flood at a single origin, so volumetric attacks are handled by pushing the defense out to a large distributed network with far more capacity than any single data center. Content delivery networks and specialized DDoS-mitigation providers operate globally distributed edges with enormous aggregate bandwidth, so attack traffic is spread across and absorbed by that capacity rather than reaching your origin, which is why fronting a service with a CDN is one of the most effective baseline protections. Anycast routing reinforces this by announcing the same IP from many locations, so a flood is automatically dispersed across many points of presence instead of converging on one. Keeping the origin\'s real address hidden behind the edge is essential, because an attacker who discovers it can bypass the protection entirely and hit the origin directly. The edge can also perform always-on traffic scrubbing, inspecting and filtering traffic continuously so attacks are mitigated without the delay of switching modes. The architecture-level lesson is that volumetric defense is fundamentally about borrowing more capacity than the attacker can muster, which only a distributed edge can provide.',
      },
      {
        heading: 'Filtering and distinguishing good from bad',
        body: 'Beyond raw capacity, effective defense requires distinguishing malicious traffic from legitimate users so the bad is dropped and the good is served, which is harder than it sounds because sophisticated attacks mimic real traffic. Several techniques layer together: rate limiting caps how much any single client can send, which blunts simpler floods; protocol validation and SYN cookies defend against protocol attacks by refusing to commit resources to half-open connections; and behavioral analysis and reputation scoring identify clients that act like bots. For application-layer attacks, challenges like proof-of-work or, sparingly, CAPTCHAs can separate humans from automated floods, and well-tuned web application firewalls can drop requests matching attack signatures. The constant tension is false positives, since overly aggressive filtering blocks real users and effectively completes the attacker\'s goal of denying service, so mitigation must balance blocking attacks against preserving access. Machine-learning-based systems increasingly automate this discrimination at scale. The core idea is that filtering is a classification problem under adversarial pressure, and the quality of a defense is measured by how well it drops attack traffic while letting legitimate users through unharmed.',
      },
      {
        heading: 'Architecture, autoscaling, and incident readiness',
        body: 'DDoS resilience is not only about external scrubbing but also about building systems that degrade gracefully and recover, because some attack traffic will always get through and the application must survive it. Autoscaling can absorb application-layer attacks by adding capacity, but it is a double-edged sword, since scaling up in response to malicious load can incur enormous cost, turning a denial-of-service into a denial-of-wallet, which is why scaling limits and budgets matter. Designing for graceful degradation, where the system sheds non-essential work and protects its core function under overload, keeps the most important features available even when capacity is strained. Caching aggressively reduces how much attack traffic reaches the expensive origin logic, and circuit breakers and load shedding prevent an overwhelmed component from cascading. Readiness is as important as architecture: having a tested incident response plan, a relationship with a mitigation provider, and monitoring that detects attacks early turns a potential outage into a managed event. The combination of edge absorption, intelligent filtering, resilient architecture, and operational preparedness is what separates services that shrug off attacks from those that go dark, since no single layer is sufficient on its own.',
      },
    ],
    diagrams: [
      {
        title: 'Three attack layers, three defenses',
        description: 'Volumetric floods bandwidth, protocol exhausts connection state, application sends expensive requests.',
        type: 'comparison',
        svgContent: svg(720, 200, [
          box(20, 40, 215, 120, 'Volumetric', { stroke: 'red', sub: 'saturate bandwidth' }),
          box(255, 40, 200, 120, 'Protocol', { stroke: 'amber', sub: 'exhaust connections' }),
          box(475, 40, 220, 120, 'Application', { stroke: 'purple', sub: 'expensive requests' }),
          label(127, 150, 'edge / CDN absorb', { fill: 'muted', size: 10.5, anchor: 'middle' }),
          label(355, 150, 'SYN cookies', { fill: 'muted', size: 10.5, anchor: 'middle' }),
          label(585, 150, 'WAF / rate limit', { fill: 'muted', size: 10.5, anchor: 'middle' }),
        ].join('')),
      },
      {
        title: 'Scrubbing edge in front of a hidden origin',
        description: 'Distributed edge absorbs and filters the flood; the origin IP stays hidden so it cannot be hit directly.',
        type: 'architecture',
        svgContent: svg(720, 230, [
          box(30, 40, 100, 36, 'Bot'),
          box(30, 95, 100, 36, 'Bot'),
          box(30, 150, 100, 36, 'Bot'),
          arrow(130, 58, 280, 110, { stroke: 'red' }),
          arrow(130, 113, 280, 120, { stroke: 'red' }),
          arrow(130, 168, 280, 130, { stroke: 'red' }),
          box(280, 95, 150, 56, 'Scrubbing edge', { stroke: 'green', sub: 'filter + absorb' }),
          arrow(430, 123, 560, 123, { label: 'clean traffic' }),
          box(560, 100, 130, 46, 'Origin (hidden)', { fill: 'cardAlt' }),
        ].join('')),
      },
    ],
    realWorldExamples: [
      {
        company: 'GitHub',
        problem: 'Suffered one of the largest recorded volumetric attacks, a memcached-amplified flood peaking at 1.35 Tbps, far beyond any single origin\'s capacity.',
        solution: 'Route traffic through a DDoS-mitigation provider that absorbed and scrubbed the flood across a massive distributed network, returning only clean traffic to GitHub.',
        outcome: 'The service was restored within minutes despite the record-breaking volume, demonstrating that edge absorption is the only viable answer to terabit-scale attacks.',
      },
      {
        company: 'Cloudflare',
        problem: 'Customers small and large face constant, growing DDoS attacks they cannot absorb alone at their origins.',
        solution: 'Operate an always-on anycast network that absorbs volumetric floods globally, filters malicious traffic with behavioral analysis and WAF rules, and hides origin addresses.',
        outcome: 'Sites stay online through enormous attacks, and always-on scrubbing made DDoS protection a default layer rather than an emergency response.',
      },
    ],
    codeExamples: [
      {
        language: 'typescript',
        label: 'Per-client throttle plus global load shedding',
        description: 'Cap each client and shed load when total in-flight requests exceed a safe ceiling, protecting the core.',
        code: `class Overload {
  private inFlight = 0;
  private readonly perClient = new Map<string, number>();

  constructor(
    private readonly globalMax: number,
    private readonly clientMax: number,
  ) {}

  admit(clientId: string): boolean {
    // Shed load globally before the system collapses under a flood.
    if (this.inFlight >= this.globalMax) return false;
    const c = this.perClient.get(clientId) ?? 0;
    if (c >= this.clientMax) return false; // throttle abusive clients
    this.perClient.set(clientId, c + 1);
    this.inFlight += 1;
    return true;
  }

  release(clientId: string): void {
    this.inFlight = Math.max(0, this.inFlight - 1);
    const c = (this.perClient.get(clientId) ?? 1) - 1;
    if (c <= 0) this.perClient.delete(clientId);
    else this.perClient.set(clientId, c);
  }
}`,
      },
      {
        language: 'go',
        label: 'SYN-flood-resistant server limits',
        description: 'Bound connection lifetimes and concurrent connections so protocol attacks cannot exhaust resources.',
        code: `package ddos

import (
	"net"
	"net/http"
	"time"
)

// HardenServer caps idle/read time and concurrent connections so half-open
// and slowloris-style protocol attacks cannot tie up resources indefinitely.
func HardenServer(addr string, h http.Handler, maxConns int) *http.Server {
	srv := &http.Server{
		Addr:              addr,
		Handler:           h,
		ReadHeaderTimeout: 5 * time.Second,  // defeat slowloris
		ReadTimeout:       15 * time.Second,
		IdleTimeout:       30 * time.Second, // reclaim idle connections
	}
	// LimitListener caps concurrent connections (pseudo: use netutil.LimitListener).
	_ = maxConns
	var _ net.Listener
	return srv
}`,
      },
    ],
    commonMistakes: [
      'Trying to absorb a volumetric attack at a single origin instead of fronting it with a distributed edge.',
      'Leaking or failing to hide the origin IP, letting attackers bypass the scrubbing layer entirely.',
      'Autoscaling without budget limits, turning a denial-of-service into a ruinous denial-of-wallet.',
      'Filtering so aggressively that legitimate users are blocked, completing the attacker\'s goal for them.',
      'Having no tested incident response plan or mitigation provider relationship before an attack hits.',
    ],
    whenNotToUse:
      'A purely internal service with no internet exposure has little DDoS surface and does not need edge scrubbing. Heavy DDoS infrastructure is also unwarranted for a low-stakes site where brief unavailability has negligible cost, though a basic CDN front is cheap enough to be worthwhile almost everywhere.',
    relatedTopics: ['content-delivery-networks', 'rate-limiting', 'load-balancing', 'graceful-degradation', 'auto-scaling'],
    industryStandard: 'Cloudflare / AWS Shield / Akamai · anycast scrubbing · OWASP DoS guidance · BCP 38 (anti-spoofing)',
    interviewTips:
      'Classify the attack by layer first, because the defense for a bandwidth flood differs entirely from one for expensive application requests. Make the architectural point that you cannot absorb a distributed flood at one origin, so volumetric defense means borrowing a distributed edge\'s capacity and hiding the origin. Adding intelligent filtering, the false-positive tradeoff, and the denial-of-wallet risk of unbounded autoscaling shows mature, real-world judgment.',
  },

  {
    id: 'rbac-vs-abac',
    title: 'RBAC vs ABAC',
    category: 'Security',
    difficulty: 'Senior',
    readTime: 11,
    summary:
      'RBAC grants permissions through roles; ABAC grants them by evaluating attributes of the user, resource, action, and context. RBAC is simpler and auditable; ABAC is more flexible and fine-grained, and many systems combine both.',
    whyItMatters:
      'Authorization decides who can do what, and getting the model wrong leads either to rigid systems that cannot express real policy or to a tangle of rules no one can audit. Choosing between role-based and attribute-based access control, or combining them, shapes security, maintainability, and compliance for the life of a system, so the tradeoffs are core architectural knowledge.',
    content: [
      {
        heading: 'Authentication versus authorization, and why models matter',
        body: 'Authorization is distinct from authentication: authentication proves who you are, while authorization decides what you are allowed to do, and access control models are systematic ways of answering the authorization question consistently across an entire system. Without a model, authorization devolves into scattered if-statements checking specific users or conditions, which becomes impossible to reason about, audit, or change safely as the system grows. A good model centralizes and standardizes these decisions so that policy is expressed in one coherent place and applied uniformly, which is essential for both security and compliance, since auditors need to answer "who can access this" with confidence. The two dominant models are role-based access control and attribute-based access control, which represent different philosophies for organizing permissions. The choice between them is not merely technical preference but a decision about how your authorization will scale, how fine-grained it can be, and how easily it can be audited. Understanding that authorization deserves a deliberate model, rather than ad hoc checks, is the foundation, because the cost of a weak authorization design compounds as the system and its compliance obligations grow.',
      },
      {
        heading: 'RBAC: permissions through roles',
        body: 'Role-based access control organizes permissions by assigning users to roles and granting permissions to roles rather than to individuals, so a user inherits the permissions of every role they hold. This indirection is powerful because it matches how organizations actually think, in terms of job functions like administrator, editor, or viewer, and it makes administration tractable, since granting a new hire access is just assigning the appropriate role rather than enumerating dozens of individual permissions. RBAC is straightforward to understand, implement, and audit, because you can clearly enumerate which roles exist, what each can do, and who holds each role, which is exactly what compliance reviews demand. Its limitation is rigidity: RBAC struggles to express policies that depend on context or on attributes of the specific resource, such as "a manager can approve expenses only for their own team" or "documents can be edited only during business hours," because pure roles capture who you are but not the relationship between you and a particular resource. Attempts to handle this by creating ever more specific roles lead to role explosion, where the number of roles grows unmanageably as each combination of conditions becomes its own role. RBAC is the right default for many systems precisely because of its simplicity, as long as the policies it must express stay within its expressive limits.',
      },
      {
        heading: 'ABAC: permissions through attributes',
        body: 'Attribute-based access control makes authorization decisions by evaluating policies against attributes of four things: the subject (the user, with attributes like department or clearance), the resource (with attributes like owner or sensitivity), the action being attempted, and the environment (context like time, location, or device). Instead of checking membership in a role, ABAC evaluates rules such as "permit if the user\'s department equals the document\'s department and the request is during business hours," which lets it express fine-grained, context-dependent, relationship-aware policies that RBAC cannot. This flexibility is ABAC\'s great strength, enabling dynamic decisions that adapt to the specifics of each request without inventing a new role for every situation, which directly solves the role-explosion problem. The cost is complexity: ABAC policies can become intricate and harder to reason about, testing every combination of attributes is difficult, and auditing "who can access this resource" requires evaluating policies rather than reading a simple role list, since the answer depends on attribute values. ABAC also requires reliable, well-governed attribute data, because a policy is only as trustworthy as the attributes it reads. ABAC shines where authorization genuinely depends on context and relationships, but its power comes with a real burden of policy management and auditability.',
      },
      {
        heading: 'Choosing, combining, and operating them',
        body: 'In practice the choice is rarely all-or-nothing, and many mature systems combine the two, using roles as a coarse-grained first layer and attributes for the fine-grained, contextual decisions roles cannot express. A common pattern grants broad capabilities by role and then refines them with attribute-based rules, for example letting the editor role edit documents but using an attribute check to restrict that to documents the user owns or that belong to their team. The decision of how far toward ABAC to go should be driven by how context-dependent your real policies are: if authorization is mostly about job function, RBAC alone keeps things simple and auditable, while if it genuinely depends on relationships, ownership, time, or risk, ABAC earns its complexity. Regardless of model, several operational principles apply: enforce authorization on the server for every request rather than trusting the client, deny by default so that anything not explicitly permitted is refused, and centralize policy so it can be reviewed and changed in one place rather than scattered through the code. Policy-as-code engines have made externalized, testable, auditable authorization practical at scale, decoupling policy from application logic. The senior takeaway is to match the model to the actual shape of your policies, lean on RBAC\'s simplicity until you genuinely need ABAC\'s expressiveness, and operate either one with deny-by-default, server-side enforcement, and centralized auditable policy.',
      },
    ],
    diagrams: [
      {
        title: 'RBAC versus ABAC decision basis',
        description: 'RBAC asks which roles you hold; ABAC evaluates subject, resource, action, and environment attributes.',
        type: 'comparison',
        svgContent: svg(720, 210, [
          box(30, 40, 300, 70, 'RBAC', { stroke: 'accent', sub: 'user → role → permission' }),
          box(30, 125, 300, 50, 'simple · auditable · can role-explode', { fill: 'cardAlt' }),
          box(390, 40, 300, 70, 'ABAC', { stroke: 'purple', sub: 'policy(subject, resource, action, env)' }),
          box(390, 125, 300, 50, 'fine-grained · contextual · complex', { fill: 'cardAlt' }),
        ].join('')),
      },
      {
        title: 'Combined model: role gate then attribute refinement',
        description: 'A coarse role check admits the action; an attribute policy refines it to the specific resource and context.',
        type: 'flow',
        svgContent: svg(720, 190, [
          box(20, 75, 120, 46, 'Request', { stroke: 'accent' }),
          arrow(140, 98, 240, 98, { label: 'role?' }),
          box(240, 75, 130, 46, 'Has role?', { sub: 'coarse gate' }),
          arrow(370, 98, 470, 98, { label: 'yes' }),
          box(470, 75, 150, 46, 'Attribute policy', { stroke: 'purple', sub: 'owner? time? risk?' }),
          arrow(620, 98, 690, 98, { label: 'permit' }),
        ].join('')),
      },
    ],
    realWorldExamples: [
      {
        company: 'AWS (IAM)',
        problem: 'Customers needed to authorize access across millions of resources with policies that often depend on tags, ownership, and conditions, beyond what static roles express.',
        solution: 'Provide IAM combining role-like identities and policies with attribute/condition-based rules (tags, context keys), so access can be granted by both who you are and resource attributes.',
        outcome: 'Customers express both coarse role-based access and fine-grained, attribute-conditioned policies in one system, scaling authorization across vast resource sets.',
      },
      {
        company: 'Open Policy Agent (OPA)',
        problem: 'Authorization logic was scattered through application code, making policy hard to audit, test, and change consistently across services.',
        solution: 'Externalize authorization into a policy-as-code engine where attribute-based rules are written declaratively and evaluated uniformly, decoupled from application logic.',
        outcome: 'Teams centralized and tested authorization policy independently of code, and OPA became a CNCF standard for fine-grained, auditable access control.',
      },
    ],
    codeExamples: [
      {
        language: 'typescript',
        label: 'RBAC with an ABAC refinement',
        description: 'A coarse role check gates the action; an attribute rule restricts it to owned resources during business hours.',
        code: `interface User { id: string; roles: string[]; department: string }
interface Doc { ownerId: string; department: string }

const ROLE_PERMS: Record<string, string[]> = {
  viewer: ['doc:read'],
  editor: ['doc:read', 'doc:write'],
};

function can(user: User, action: string, doc: Doc, now = new Date()): boolean {
  // RBAC: does any role grant this action at all?
  const granted = user.roles.some((r) => ROLE_PERMS[r]?.includes(action));
  if (!granted) return false;

  // ABAC refinement: writes only on same-department docs during business hours.
  if (action === 'doc:write') {
    const sameDept = user.department === doc.department;
    const hour = now.getHours();
    const businessHours = hour >= 9 && hour < 18;
    return sameDept && businessHours;
  }
  return true;
}`,
      },
      {
        language: 'python',
        label: 'Deny-by-default policy evaluation',
        description: 'Evaluate attribute rules with an explicit default-deny so anything not permitted is refused.',
        code: `from dataclasses import dataclass
from typing import Callable


@dataclass(frozen=True)
class Request:
    subject: dict
    resource: dict
    action: str
    env: dict


# Each rule returns True only to PERMIT; absence of a permit means deny.
Rule = Callable[[Request], bool]


def owner_can_delete(req: Request) -> bool:
    return req.action == "delete" and req.subject["id"] == req.resource["owner_id"]


def admin_can_anything(req: Request) -> bool:
    return "admin" in req.subject.get("roles", [])


def authorize(req: Request, rules: list[Rule]) -> bool:
    # Deny by default: permit only if some rule explicitly allows it.
    return any(rule(req) for rule in rules)


rules = [owner_can_delete, admin_can_anything]
req = Request({"id": "u1", "roles": []}, {"owner_id": "u1"}, "delete", {})
print(authorize(req, rules))  # True (owner), default-deny otherwise`,
      },
    ],
    commonMistakes: [
      'Creating ever more granular roles to express contextual policy, causing unmanageable role explosion.',
      'Adopting full ABAC for simple, role-shaped policies and inheriting complexity and poor auditability for no benefit.',
      'Enforcing authorization on the client instead of the server, where it can be bypassed entirely.',
      'Defaulting to permit so anything not explicitly denied is allowed, instead of deny-by-default.',
      'Basing ABAC decisions on attributes that are untrusted or ungoverned, making policies only as reliable as bad data.',
    ],
    whenNotToUse:
      'Do not reach for ABAC when your policies are genuinely about job function and nothing more, since RBAC is simpler, faster to audit, and sufficient. Conversely, do not force RBAC onto inherently relationship- and context-dependent policies, where it leads to role explosion and brittle workarounds that ABAC handles cleanly.',
    relatedTopics: ['auth-jwt-sessions-oauth2', 'zero-trust-architecture', 'owasp-top-10', 'secrets-management', 'mtls'],
    industryStandard: 'NIST RBAC (INCITS 359) & ABAC (SP 800-162) · AWS IAM · Open Policy Agent (CNCF)',
    interviewTips:
      'Separate authentication from authorization, then contrast the models by their decision basis: RBAC checks roles, ABAC evaluates subject/resource/action/environment attributes. Name role explosion as RBAC\'s failure mode and policy complexity plus auditability as ABAC\'s cost, then recommend combining them, role gate plus attribute refinement, for most real systems. Closing on deny-by-default, server-side enforcement, and policy-as-code signals operational maturity beyond the model choice itself.',
  },

  {
    id: 'mtls',
    title: 'mTLS',
    category: 'Security',
    difficulty: 'Senior',
    readTime: 11,
    summary:
      'Mutual TLS extends ordinary TLS so both sides present and verify certificates, giving every service a cryptographic identity. It is the backbone of service-to-service authentication in Zero Trust architectures and service meshes.',
    whyItMatters:
      'Ordinary TLS authenticates only the server, so services often trust each other based on network location, exactly the implicit trust that lets one breach spread. mTLS makes every service prove who it is with a certificate, so traffic is authenticated and encrypted regardless of network position, which is foundational to modern Zero Trust security.',
    content: [
      {
        heading: 'From one-way TLS to mutual TLS',
        body: 'In ordinary TLS, the kind that secures a website, only the server presents a certificate, so the client verifies it is talking to the real server but the server has no cryptographic proof of who the client is, relying on a separate mechanism like a password or token for that. Mutual TLS extends this handshake so that the client also presents a certificate and the server verifies it, meaning both parties cryptographically authenticate each other before any application data flows. The result is that the connection itself carries a strong, verified identity for both ends, not just confidentiality and integrity but bidirectional authentication built into the transport layer. This matters enormously for service-to-service communication, because without it services typically authenticate each other weakly or not at all, trusting that a request arriving on the internal network must be legitimate. mTLS replaces that fragile network-location trust with cryptographic identity, so a service knows exactly which other service is calling it regardless of where the traffic originated. Understanding mTLS as TLS plus client-certificate verification, yielding mutual authentication, is the conceptual core from which its security benefits follow.',
      },
      {
        heading: 'Why service meshes adopted it',
        body: 'The rise of microservices created a network of many services calling each other constantly, and the old assumption that internal traffic is trustworthy became untenable because a single compromised service could freely impersonate and call others. mTLS solves this by giving each service a certificate that proves its identity, so every call is mutually authenticated and encrypted, which is precisely the property Zero Trust demands of east-west traffic. Implementing mTLS by hand across hundreds of services would be onerous, so service meshes like Istio and Linkerd emerged to provide it transparently, deploying a sidecar proxy alongside each service that handles the mTLS handshake automatically, so application code gets mutual authentication and encryption without being modified. The mesh also manages the certificates centrally, issuing short-lived ones and rotating them frequently, which would be impractical to do manually. This automation is what made pervasive mTLS realistic, turning it from a painful per-service chore into a platform feature. The service mesh became the standard delivery vehicle for mTLS precisely because it removes the operational burden that previously kept mutual authentication rare.',
      },
      {
        heading: 'Certificate lifecycle and the hard parts',
        body: 'The power of mTLS comes from certificates, and the difficulty of mTLS comes from managing them, because every service needs a valid certificate, those certificates must be issued by a trusted authority, and they must be rotated before they expire or the service goes dark. Manual certificate management does not scale to hundreds of services, so mTLS systems rely on an internal certificate authority and automated issuance and rotation, often with very short-lived certificates that are renewed continuously, which both reduces the damage of a leaked certificate and removes the cliff of a long-lived certificate expiring unexpectedly. Certificate expiry is one of the most common operational failures in mTLS deployments, where an unrenewed certificate silently breaks communication, so automation and monitoring of certificate lifetimes are essential. Revocation is the other hard part, because if a service or its key is compromised you need a way to stop trusting its certificate, which short lifetimes partly address by limiting how long a compromised certificate remains valid. The trust hierarchy itself, the root and intermediate authorities, must be protected carefully, since compromising the issuing authority undermines every certificate it signed. The lesson is that mTLS is conceptually simple but operationally demanding, and its success depends almost entirely on automated certificate lifecycle management.',
      },
      {
        heading: 'mTLS in the broader security picture',
        body: 'mTLS provides authentication and encryption of the channel, but it is one piece of a complete security design rather than the whole thing, and understanding its boundaries prevents over-reliance on it. mTLS proves which service is calling, but it does not by itself decide what that service is allowed to do, so it pairs with an authorization layer that uses the verified identity to make access decisions, which is where models like RBAC and ABAC come in. It also does not replace user authentication, since mTLS typically authenticates services to each other while a separate mechanism authenticates the end user whose request flows through them. Within a Zero Trust architecture, mTLS is the mechanism that establishes verified service identity for east-west traffic, complementing strong user identity and contextual policy at the north-south edge. The encryption mTLS provides also satisfies in-transit protection for internal traffic, which is increasingly expected rather than optional. The right mental model is that mTLS answers "who are you" cryptographically for services and secures the channel, after which authorization answers "what may you do," so it is a foundational building block of Zero Trust that must be combined with authorization and user authentication to form a complete system.',
      },
    ],
    diagrams: [
      {
        title: 'One-way TLS versus mTLS',
        description: 'Ordinary TLS verifies only the server; mTLS verifies both ends with certificates.',
        type: 'comparison',
        svgContent: svg(720, 190, [
          box(30, 40, 300, 60, 'TLS (one-way)', { stroke: 'amber', sub: 'client verifies server only' }),
          box(30, 115, 280, 44, 'client identity = separate token', { fill: 'cardAlt' }),
          box(390, 40, 300, 60, 'mTLS (mutual)', { stroke: 'green', sub: 'both present + verify certs' }),
          box(390, 115, 280, 44, 'identity built into the channel', { fill: 'cardAlt' }),
        ].join('')),
      },
      {
        title: 'Service mesh with sidecar mTLS',
        description: 'Sidecar proxies handle the mutual handshake; a central CA issues and rotates short-lived certs.',
        type: 'architecture',
        svgContent: svg(720, 240, [
          box(40, 60, 120, 44, 'Service A', { fill: 'cardAlt' }),
          box(40, 110, 120, 36, 'sidecar', { stroke: 'accent' }),
          box(470, 60, 120, 44, 'Service B', { fill: 'cardAlt' }),
          box(470, 110, 120, 36, 'sidecar', { stroke: 'accent' }),
          arrow(160, 128, 470, 128, { label: 'mTLS (both verify)' }),
          box(280, 185, 160, 40, 'Mesh CA', { stroke: 'purple', sub: 'issue + rotate certs' }),
          arrow(360, 185, 110, 146, { label: 'cert', dashed: true }),
          arrow(360, 185, 540, 146, { label: 'cert', dashed: true }),
        ].join('')),
      },
    ],
    realWorldExamples: [
      {
        company: 'Istio / Linkerd',
        problem: 'Securing service-to-service traffic in large microservice deployments by hand was impractical, leaving east-west traffic unauthenticated and unencrypted.',
        solution: 'Provide automatic mTLS via sidecar proxies with a built-in certificate authority that issues and rotates short-lived certificates transparently to applications.',
        outcome: 'Pervasive mutual authentication and encryption became a platform default, making mTLS practical across hundreds of services without code changes.',
      },
      {
        company: 'Google (ALTS / BeyondProd)',
        problem: 'Internal service traffic at massive scale needed strong mutual authentication and encryption without relying on network trust.',
        solution: 'Deploy mutual authentication for service-to-service communication (ALTS, conceptually similar to mTLS) so every service has a verified identity, underpinning the BeyondProd model.',
        outcome: 'Internal traffic became mutually authenticated and encrypted by default, providing the service-identity foundation for Google\'s Zero Trust production environment.',
      },
    ],
    codeExamples: [
      {
        language: 'typescript',
        label: 'mTLS client and server in Node',
        description: 'Configure a server to require and verify client certificates, and a client to present its own.',
        code: `import https from 'node:https';
import fs from 'node:fs';

// Server: require and verify client certificates against the trusted CA.
const server = https.createServer({
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.crt'),
  ca: fs.readFileSync('ca.crt'),
  requestCert: true,        // ask the client for a cert
  rejectUnauthorized: true, // reject clients without a valid cert
});

// Client: present its own certificate so the server can verify it.
const agent = new https.Agent({
  key: fs.readFileSync('client.key'),
  cert: fs.readFileSync('client.crt'),
  ca: fs.readFileSync('ca.crt'), // verify the server too
});

// The verified client identity is available from the peer certificate:
server.on('secureConnection', (tls) => {
  const cert = tls.getPeerCertificate();
  // cert.subject.CN is the authenticated service identity.
});`,
      },
      {
        language: 'go',
        label: 'Server requiring client certificates',
        description: 'A TLS config that demands and verifies a client certificate, yielding a verified caller identity.',
        code: `package mtls

import (
	"crypto/tls"
	"crypto/x509"
	"net/http"
	"os"
)

func MutualTLSServer(addr string, h http.Handler) (*http.Server, error) {
	caPEM, err := os.ReadFile("ca.crt")
	if err != nil {
		return nil, err
	}
	pool := x509.NewCertPool()
	pool.AppendCertsFromPEM(caPEM)

	cfg := &tls.Config{
		ClientCAs:  pool,
		// Require AND verify a client cert: this is what makes it mutual.
		ClientAuth: tls.RequireAndVerifyClientCert,
		MinVersion: tls.VersionTLS12,
	}
	return &http.Server{Addr: addr, Handler: h, TLSConfig: cfg}, nil
}`,
      },
    ],
    commonMistakes: [
      'Relying on network location to trust internal services instead of authenticating them with mTLS.',
      'Using long-lived certificates and forgetting to rotate them, leading to silent expiry outages.',
      'Treating mTLS as authorization, when it only proves identity and must be paired with an access-control layer.',
      'Managing certificates manually across many services, which does not scale and invites expiry failures.',
      'Failing to protect the certificate authority, whose compromise undermines every certificate it signed.',
    ],
    whenNotToUse:
      'mTLS is overkill for a single monolith with no internal service-to-service calls, where ordinary TLS at the edge suffices. It is also impractical to impose directly on third-party or browser clients that cannot manage certificates, so reserve mTLS for service-to-service and controlled-client scenarios rather than public user traffic.',
    relatedTopics: ['zero-trust-architecture', 'encryption-at-rest-in-transit', 'rbac-vs-abac', 'auth-jwt-sessions-oauth2', 'service-mesh'],
    industryStandard: 'TLS 1.3 client auth (RFC 8446) · Istio / Linkerd mTLS · SPIFFE/SPIRE workload identity · Google BeyondProd',
    interviewTips:
      'Define mTLS precisely as TLS where both ends present and verify certificates, giving services a cryptographic identity instead of network-location trust. Connect it to Zero Trust and service meshes, explaining that sidecars and an internal CA make pervasive mTLS practical through automated short-lived certificate rotation. The senior signal is bounding its role, mTLS authenticates and encrypts but does not authorize, so it pairs with RBAC/ABAC and separate user authentication.',
  },

  {
    id: 'security-headers',
    title: 'Security Headers',
    category: 'Security',
    difficulty: 'Intermediate',
    readTime: 10,
    summary:
      'HTTP security headers instruct the browser to enforce protections like forcing HTTPS, restricting script sources, and preventing framing. They are cheap to add and close whole classes of attacks at the browser level.',
    whyItMatters:
      'A correctly configured set of security headers turns the browser into an ally that enforces your security policy on every page, mitigating XSS, clickjacking, protocol downgrade, and information leakage. They are among the highest-leverage security measures available because they are simple to deploy yet defend against attacks that are otherwise hard to fully prevent in application code.',
    content: [
      {
        heading: 'The browser as a policy enforcement point',
        body: 'Security headers are directives a server sends in HTTP responses that tell the browser to enforce specific security behaviors, leveraging the fact that the browser is where most client-side attacks ultimately play out. Because the browser already mediates everything a page does, instructing it to restrict dangerous behaviors closes attack vectors at exactly the point where they would be exploited, which is more reliable than trying to prevent every unsafe pattern in application code alone. This makes headers a form of defense in depth: even if a bug slips through, a well-configured header can prevent the bug from becoming an exploit, such as a Content Security Policy blocking an injected script from executing. They are also remarkably cost-effective, since adding a header is a configuration change rather than a code rewrite, yet the protection applies to every response uniformly. The catch is that headers must be configured correctly, because a misconfigured or overly permissive header provides a false sense of security while leaving the hole open. Understanding headers as a way to enlist the browser in enforcing your security policy, rather than as magic toggles, is what lets you deploy them effectively.',
      },
      {
        heading: 'Forcing HTTPS and preventing downgrade',
        body: 'HTTP Strict Transport Security, sent via the Strict-Transport-Security header, tells the browser to only ever connect to your site over HTTPS for a specified duration, which prevents an entire class of attacks where an adversary downgrades a connection to plaintext or strips TLS during the initial request. Without HSTS, a user typing your domain may make a first request over insecure HTTP that an attacker can intercept and manipulate before any redirect to HTTPS happens, but with HSTS remembered, the browser refuses to make that insecure request at all. The header can include subdomains and a preload directive that bakes your domain into browsers\' built-in HSTS lists, closing even the very first-visit window. This is essential because TLS in transit is only effective if the browser actually uses it, and HSTS removes the opportunity for downgrade. The tradeoff is commitment, since once you set a long HSTS duration you must keep HTTPS working for that whole period or users will be unable to reach the site, so HSTS should be rolled out deliberately. Forcing HTTPS at the browser level is foundational, because every other security property depends on the connection actually being encrypted and authenticated.',
      },
      {
        heading: 'Controlling scripts, framing, and content type',
        body: 'Several headers restrict specific dangerous behaviors that attacks rely on. Content-Security-Policy is the most powerful, letting you declare exactly which sources scripts, styles, images, and other resources may load from, and crucially it can forbid inline scripts, which means an XSS payload injected into the page is refused execution by the browser even if it reaches the DOM, making CSP a strong second line of defense against XSS. The X-Frame-Options header, or the frame-ancestors directive in CSP, prevents your pages from being embedded in a frame on another site, defeating clickjacking attacks where an attacker overlays your page invisibly to trick users into clicking. The X-Content-Type-Options header set to nosniff stops the browser from guessing a response\'s content type, which prevents attacks that rely on the browser interpreting an uploaded file as executable script. Referrer-Policy controls how much of the originating URL is sent when navigating away, preventing sensitive information in URLs from leaking to third parties, and Permissions-Policy restricts which browser features like camera, microphone, or geolocation a page may use. Each header neutralizes a specific attack technique, and together they form a layered set of browser-enforced restrictions.',
      },
      {
        heading: 'Deploying headers correctly and avoiding pitfalls',
        body: 'The value of security headers depends entirely on configuring them correctly, because a permissive or broken policy gives false confidence while leaving the door open, so deployment requires care and testing. Content-Security-Policy in particular is powerful but easy to get wrong, since a policy that is too strict breaks legitimate functionality and one that is too loose, for example allowing unsafe-inline scripts, defeats its own purpose, which is why teams often deploy CSP first in report-only mode to observe what it would block before enforcing it. Headers should be applied consistently across all responses, ideally at a central layer like a reverse proxy or middleware so no endpoint is accidentally left unprotected. It is also important to keep policies current, since adding a new third-party script or CDN requires updating the CSP, and stale policies either break features or get loosened carelessly. Automated scanners and tools that grade your header configuration help catch missing or weak headers, and they belong in the deployment pipeline. The overarching principle is that security headers are cheap to add but only valuable when correct, so they reward deliberate configuration, testing in report-only mode where applicable, and ongoing maintenance, rather than being set once and forgotten.',
      },
    ],
    diagrams: [
      {
        title: 'Key security headers and what they stop',
        description: 'Each header instructs the browser to block a specific class of attack.',
        type: 'comparison',
        svgContent: svg(720, 220, [
          box(20, 30, 330, 40, 'Strict-Transport-Security', { stroke: 'green', sub: 'force HTTPS · stop downgrade' }),
          box(20, 80, 330, 40, 'Content-Security-Policy', { stroke: 'accent', sub: 'block injected/inline scripts' }),
          box(20, 130, 330, 40, 'X-Frame-Options', { sub: 'stop clickjacking' }),
          box(370, 30, 330, 40, 'X-Content-Type-Options', { sub: 'nosniff · no MIME guessing' }),
          box(370, 80, 330, 40, 'Referrer-Policy', { sub: 'limit URL leakage' }),
          box(370, 130, 330, 40, 'Permissions-Policy', { sub: 'restrict camera/mic/geo' }),
        ].join('')),
      },
      {
        title: 'CSP rollout: report-only then enforce',
        description: 'Observe violations safely in report-only mode, tune the policy, then switch to enforcement.',
        type: 'timeline',
        svgContent: svg(720, 170, [
          lane(40, 40, 690, 'CSP rollout'),
          box(40, 60, 170, 44, 'Report-Only', { stroke: 'amber', sub: 'log, do not block' }),
          arrow(210, 82, 300, 82, { label: 'tune' }),
          box(300, 60, 170, 44, 'Fix violations', { sub: 'whitelist real sources' }),
          arrow(470, 82, 540, 82),
          box(540, 60, 150, 44, 'Enforce', { stroke: 'green' }),
        ].join('')),
      },
    ],
    realWorldExamples: [
      {
        company: 'Google / Mozilla (header standards)',
        problem: 'Browsers needed standardized, server-controlled mechanisms to enforce security policies that application code alone could not reliably guarantee.',
        solution: 'Define and ship headers like CSP, HSTS, and X-Content-Type-Options, plus tools (Mozilla Observatory, securityheaders.com) that grade real sites\' configurations.',
        outcome: 'Security headers became a standard, measurable baseline, and grading tools pushed widespread adoption of browser-enforced protections.',
      },
      {
        company: 'HSTS preload list',
        problem: 'Even with HSTS, the very first visit to a site could occur over insecure HTTP before the header was ever seen, leaving a downgrade window.',
        solution: 'Maintain a browser-baked preload list of HSTS domains, so qualifying sites are treated as HTTPS-only from the first request without ever touching HTTP.',
        outcome: 'High-value domains closed the first-visit downgrade gap entirely, and preloading became a standard hardening step for security-sensitive sites.',
      },
    ],
    codeExamples: [
      {
        language: 'typescript',
        label: 'Applying security headers as middleware',
        description: 'Set a strong baseline of headers centrally so every response is protected uniformly.',
        code: `import express from 'express';

const app = express();

app.use((_req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none'",
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// In production, prefer a vetted library (e.g. helmet) over hand-rolling.`,
      },
      {
        language: 'python',
        label: 'CSP in report-only mode',
        description: 'Deploy CSP first as report-only to collect violations before enforcing, avoiding broken pages.',
        code: `REPORT_ONLY_CSP = (
    "default-src 'self'; "
    "script-src 'self'; "
    "report-uri /csp-violations"  # browser POSTs violations here
)


def add_security_headers(response, enforce: bool = False):
    header = "Content-Security-Policy" if enforce else "Content-Security-Policy-Report-Only"
    response.headers[header] = REPORT_ONLY_CSP
    response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response


# Start with enforce=False, analyze /csp-violations, then flip to True.`,
      },
    ],
    commonMistakes: [
      'Allowing unsafe-inline in a Content-Security-Policy, which defeats its main protection against injected scripts.',
      'Setting a long HSTS max-age before HTTPS is reliably working everywhere, locking users out on any TLS failure.',
      'Applying headers on some endpoints but not others instead of centrally, leaving gaps.',
      'Deploying a strict CSP straight to enforcement and breaking the site instead of starting in report-only mode.',
      'Setting headers once and never updating them as new scripts, CDNs, or features are added.',
    ],
    whenNotToUse:
      'There is rarely a reason to omit baseline headers like nosniff and HSTS on any production site. The nuance is policy strictness: a complex third-party-heavy application may need a more permissive CSP than a tightly controlled app, so the headers should be tuned to the app rather than skipped, and an internal tool may not need the full set a public site warrants.',
    relatedTopics: ['xss-csrf-protection', 'encryption-at-rest-in-transit', 'owasp-top-10', 'zero-trust-architecture', 'rest-api-best-practices'],
    industryStandard: 'OWASP Secure Headers Project · CSP & HSTS (W3C / RFC 6797) · Mozilla Observatory',
    interviewTips:
      'Frame headers as enlisting the browser to enforce your policy as defense in depth, then name the high-value ones and the specific attack each stops: HSTS for downgrade, CSP for XSS, X-Frame-Options for clickjacking, nosniff for MIME confusion. Emphasize that CSP is powerful but easy to misconfigure and should roll out in report-only mode first. Mentioning central application via middleware or a proxy and grading tools shows you have actually deployed them.',
  },

  {
    id: 'database-indexing',
    title: 'Database Indexing',
    category: 'Databases',
    difficulty: 'Intermediate',
    readTime: 12,
    summary:
      'An index is a data structure that lets the database find rows without scanning the whole table, turning slow linear lookups into fast ones. Indexes are the single most impactful database performance tool, but each one has a write and storage cost.',
    whyItMatters:
      'The difference between a query that scans a million rows and one that uses an index is often the difference between milliseconds and seconds, or between a working application and an outage under load. Indexing is the most common and highest-leverage database optimization, yet poor indexing, both missing and excessive, is one of the most frequent causes of real-world performance problems.',
    content: [
      {
        heading: 'What an index is and why it works',
        body: 'An index is an auxiliary data structure the database maintains alongside a table that lets it locate rows matching a condition without examining every row, much as a book index lets you find a topic without reading every page. The most common type is the B-tree, a balanced tree that keeps keys sorted and allows the database to find a value, or a range of values, in logarithmic rather than linear time, so a lookup in a million-row table takes a handful of steps instead of a million comparisons. Without an appropriate index, the database must perform a full table scan, reading every row to find the ones that match, which is acceptable on small tables but catastrophic as data grows. The performance difference is not incremental but often orders of magnitude, which is why a single missing index is frequently the root cause of a query that mysteriously takes seconds. The index works by trading some space and write overhead for dramatically faster reads, precomputing an ordered structure that makes searching cheap. Understanding that an index converts a linear search into a logarithmic one, at the cost of maintaining that structure, is the foundation for using them wisely.',
      },
      {
        heading: 'The cost side: writes and storage',
        body: 'Indexes are not free, and the most common indexing mistake after missing indexes is adding too many, because every index must be kept in sync with the table, so each insert, update, or delete must also update every index on the affected columns. This means indexes speed up reads but slow down writes, and a table with many indexes can have its write throughput significantly degraded, which matters enormously for write-heavy workloads. Indexes also consume storage, sometimes a substantial fraction of the table\'s own size, and they consume memory when the database tries to keep hot indexes cached. The practical consequence is that indexing is a balancing act between read speed and write cost, and you should add indexes that serve real, frequent queries rather than speculatively indexing every column. Unused indexes are pure cost with no benefit, silently taxing every write while accelerating no query, which is why auditing for and removing unused indexes is a real maintenance task. The discipline is to treat each index as a deliberate tradeoff justified by a query pattern, not as a default to sprinkle everywhere, because the write and storage penalties of over-indexing are as damaging in their own way as the read penalty of under-indexing.',
      },
      {
        heading: 'Composite indexes, selectivity, and order',
        body: 'Beyond single-column indexes, composite indexes span multiple columns and are essential for queries that filter or sort on several fields, but their behavior depends critically on column order, which trips up many engineers. A composite index on columns in a particular order can efficiently serve queries that filter on a leading prefix of those columns but not queries that skip the leading column, because the index is sorted by the first column, then the second within that, and so on, like a phone book sorted by last name then first name. This is the leftmost-prefix rule, and understanding it is what lets you design one composite index that serves several query shapes rather than creating redundant indexes. Selectivity also matters: an index is most valuable on a column with many distinct values, because it narrows the search dramatically, whereas an index on a low-cardinality column like a boolean flag often is not worth using since it barely narrows anything. Placing the most selective and most frequently filtered columns appropriately in a composite index is a core skill. The art is matching index structure to actual query patterns, including which columns appear in WHERE, JOIN, and ORDER BY clauses, so that the index can satisfy the query efficiently.',
      },
      {
        heading: 'Reading query plans and advanced index types',
        body: 'The only reliable way to know whether an index is actually being used is to read the query plan, which the database produces via an EXPLAIN command showing how it intends to execute a query, including whether it uses an index or falls back to a full scan. Learning to read query plans is the difference between guessing at performance and diagnosing it, because a query can have a perfectly good index that the planner declines to use due to a type mismatch, a function applied to the column, or poor statistics, and only the plan reveals this. A particularly valuable pattern is the covering index, which includes all the columns a query needs so the database can answer entirely from the index without touching the table at all, eliminating a whole step. Beyond B-trees, specialized index types serve specific needs: hash indexes for exact-match lookups, GIN or inverted indexes for full-text and array search, and spatial indexes for geographic queries, each optimized for a query pattern B-trees handle poorly. Keeping table statistics current is also essential, since the planner relies on them to choose between an index and a scan. The mature approach is to design indexes from real query patterns, verify them by reading query plans, and reach for specialized index types when the workload demands, rather than assuming an index exists and is used simply because you created it.',
      },
    ],
    diagrams: [
      {
        title: 'Full scan versus index lookup',
        description: 'A scan reads every row; a B-tree index finds matches in logarithmic steps.',
        type: 'comparison',
        svgContent: svg(720, 190, [
          box(30, 40, 300, 60, 'Full table scan', { stroke: 'red', sub: 'O(n) · read every row' }),
          box(30, 115, 280, 44, '1,000,000 rows → 1,000,000 reads', { fill: 'cardAlt' }),
          box(390, 40, 300, 60, 'B-tree index', { stroke: 'green', sub: 'O(log n) · few steps' }),
          box(390, 115, 280, 44, '1,000,000 rows → ~20 steps', { fill: 'cardAlt' }),
        ].join('')),
      },
      {
        title: 'Composite index leftmost-prefix rule',
        description: 'An index on (a, b, c) serves filters on a, on a+b, and a+b+c, but not on b or c alone.',
        type: 'flow',
        svgContent: svg(720, 180, [
          box(20, 70, 160, 46, 'Index (a, b, c)', { stroke: 'accent' }),
          arrow(180, 93, 270, 60, { label: 'WHERE a' }),
          arrow(180, 93, 270, 93, { label: 'WHERE a,b' }),
          arrow(180, 93, 270, 126, { label: 'WHERE b only' }),
          box(270, 40, 150, 38, 'used ✓', { stroke: 'green' }),
          box(270, 80, 150, 38, 'used ✓', { stroke: 'green' }),
          box(270, 120, 200, 38, 'NOT used (skips prefix)', { stroke: 'red' }),
        ].join('')),
      },
    ],
    realWorldExamples: [
      {
        company: 'Stripe / high-scale OLTP',
        problem: 'Queries against rapidly growing transactional tables degraded as full scans became untenable at scale, threatening latency on critical paths.',
        solution: 'Design composite indexes matched to actual query predicates, use covering indexes to answer hot queries from the index alone, and continuously audit query plans and unused indexes.',
        outcome: 'Critical queries stayed in the millisecond range as data grew, demonstrating that disciplined indexing is what keeps OLTP systems fast at scale.',
      },
      {
        company: 'PostgreSQL community',
        problem: 'Diverse workloads, full-text search, JSON, geospatial, needed efficient access patterns that a plain B-tree handles poorly.',
        solution: 'Provide specialized index types (GIN for full-text and JSONB, GiST for spatial, BRIN for huge ordered tables) so each workload gets an index structure suited to its query shape.',
        outcome: 'Applications run efficient searches across varied data types using the right index for each, rather than forcing every query through a B-tree.',
      },
    ],
    codeExamples: [
      {
        language: 'typescript',
        label: 'Composite index matched to a query',
        description: 'Create a composite index whose column order matches the query\'s filter and sort.',
        code: `import { Pool } from 'pg';

const pool = new Pool();

async function setup() {
  // Query: WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC
  // Index column order matches: equality cols first, then the sort column.
  await pool.query(\`
    CREATE INDEX IF NOT EXISTS idx_orders_user_status_created
    ON orders (user_id, status, created_at DESC)
  \`);
}

async function recentOpenOrders(userId: string) {
  // This query can use the composite index for both filter and sort.
  const { rows } = await pool.query(
    \`SELECT id, total FROM orders
     WHERE user_id = $1 AND status = $2
     ORDER BY created_at DESC LIMIT 20\`,
    [userId, 'open'],
  );
  return rows;
}`,
      },
      {
        language: 'python',
        label: 'Reading the query plan',
        description: 'Use EXPLAIN to confirm an index is actually used rather than assuming it is.',
        code: `import psycopg2

conn = psycopg2.connect(dbname="app")


def explain(query: str, params: tuple) -> str:
    with conn.cursor() as cur:
        cur.execute("EXPLAIN (ANALYZE, BUFFERS) " + query, params)
        return "\\n".join(row[0] for row in cur.fetchall())


plan = explain(
    "SELECT id FROM orders WHERE user_id = %s AND status = %s",
    ("u1", "open"),
)
# Look for "Index Scan using idx_orders_..." (good) vs
# "Seq Scan on orders" (bad: the index is missing or unused).
print(plan)`,
      },
    ],
    commonMistakes: [
      'Adding an index for every column speculatively, taxing every write and wasting storage on unused indexes.',
      'Getting composite index column order wrong, so the leftmost-prefix rule prevents the query from using it.',
      'Indexing low-cardinality columns where the index barely narrows the search and is rarely worth using.',
      'Assuming an index is used without checking the query plan, when a type mismatch or function silently disables it.',
      'Letting table statistics go stale, causing the planner to choose a full scan over a perfectly good index.',
    ],
    whenNotToUse:
      'Very small tables do not benefit from indexes because a full scan is already fast and the index overhead is pure cost. Write-heavy tables with few reads should be indexed sparingly, since each index slows every write, and you should avoid indexing columns that are never used in a WHERE, JOIN, or ORDER BY clause.',
    relatedTopics: ['sql-vs-nosql', 'query-optimization', 'database-sharding', 'read-replicas', 'acid-transactions'],
    industryStandard: 'B-tree indexing (every major RDBMS) · PostgreSQL/MySQL EXPLAIN · "Designing Data-Intensive Applications"',
    interviewTips:
      'Explain that an index turns an O(n) scan into an O(log n) lookup, then immediately acknowledge the write and storage cost so you show both sides. Demonstrate the leftmost-prefix rule for composite indexes and mention selectivity and covering indexes. The strongest signal is saying you would confirm index usage by reading the EXPLAIN plan rather than assuming, since interviewers know that creating an index does not guarantee it is used.',
  },

  {
    id: 'database-sharding',
    title: 'Database Sharding',
    category: 'Databases',
    difficulty: 'Senior',
    readTime: 13,
    summary:
      'Sharding splits a database horizontally across multiple machines, with each shard holding a subset of the data, so a dataset or write load too large for one server can scale out. It is powerful but adds significant complexity and should be a last resort.',
    whyItMatters:
      'When a single database can no longer hold the data or handle the write throughput, sharding is often the only way to keep scaling, and it underpins the largest systems in the world. But sharding introduces hard problems, cross-shard queries, rebalancing, and lost transactions, so understanding when and how to shard, and when not to, is critical senior knowledge.',
    content: [
      {
        heading: 'Why and when to shard',
        body: 'A single database server has limits on storage, memory, and write throughput, and while you can push those limits a long way with a bigger machine (vertical scaling), read replicas, and caching, eventually a dataset or write rate exceeds what one machine can handle, and sharding becomes necessary. Sharding is horizontal partitioning that distributes rows across multiple independent databases, called shards, each holding a distinct subset of the data, so the total capacity is the sum of the shards and you can scale by adding more. The crucial point is that sharding primarily solves a write-scaling and data-volume problem, because read scaling can usually be addressed more simply with replicas and caching, so if your bottleneck is reads you should exhaust those options first. Sharding should be approached as a last resort because it imposes lasting complexity on every part of the system, and teams frequently shard prematurely, paying that complexity tax before they have exhausted simpler scaling. The right time to shard is when you have a concrete, measured limit, on storage or write throughput, that simpler techniques cannot address. Recognizing that sharding is the heavy artillery of scaling, reserved for genuine single-node limits rather than reached for reflexively, is the first and most important judgment.',
      },
      {
        heading: 'Choosing a shard key',
        body: 'The single most consequential decision in sharding is the shard key, the attribute used to decide which shard a row lives on, because it determines how evenly data and load distribute and which queries stay efficient, and a bad choice is extremely painful to change later. A good shard key spreads data and traffic evenly across shards to avoid hot spots, where one shard receives disproportionate load and becomes a bottleneck that defeats the whole purpose, so a key like a monotonically increasing timestamp is dangerous because all new writes land on one shard. A good shard key also keeps related data that is queried together on the same shard, so common queries can be answered by a single shard rather than fanning out across all of them, for example sharding by user ID so all of one user\'s data lives together. There is tension between these goals, since spreading data evenly and keeping related data together can conflict, and resolving it requires understanding your dominant access patterns. The shard key essentially encodes a bet about how your data will be accessed, and because changing it later means re-sharding the entire dataset, it deserves careful analysis up front. Getting the shard key right is the difference between sharding that scales smoothly and sharding that creates hot spots and expensive cross-shard queries.',
      },
      {
        heading: 'Sharding strategies and rebalancing',
        body: 'There are several strategies for mapping a shard key to a shard, each with tradeoffs. Range-based sharding assigns contiguous ranges of the key to shards, which makes range queries efficient but risks hot spots if data or access is unevenly distributed across ranges. Hash-based sharding applies a hash function to the key to distribute rows evenly, which avoids hot spots but destroys the ability to do efficient range queries since adjacent keys scatter across shards. Directory-based sharding keeps an explicit lookup table mapping keys to shards, which is flexible and supports rebalancing but adds a lookup and a potential single point of failure. A central operational challenge is rebalancing: as data grows you must add shards, and naive hashing remaps almost everything when the shard count changes, which is why consistent hashing is used to minimize how much data moves when shards are added or removed. Rebalancing must happen without downtime and without losing or corrupting data, which is genuinely hard and is a major reason sharding is operationally demanding. The choice of strategy follows from your query patterns and growth, and planning for rebalancing from the start, rather than discovering its difficulty during an emergency, is what keeps a sharded system manageable.',
      },
      {
        heading: 'The hard problems sharding creates',
        body: 'Sharding scales the database but breaks several things that were free on a single node, and these costs are why it should be avoided until necessary. Cross-shard queries are the biggest pain, because any query that needs data from multiple shards, such as an aggregate across all users or a join between data on different shards, must fan out to every shard and combine results in the application, which is slow and complex compared to a single-node query. Transactions across shards are similarly difficult, since the atomicity a single database provides for free disappears, and coordinating a transaction across shards requires complex protocols like two-phase commit or a saga, which most sharded systems avoid by designing so that transactions stay within a single shard. Maintaining unique constraints and generating globally unique IDs also become harder, requiring schemes like centralized ID generation or composite keys. Operational complexity multiplies because you now run and monitor many databases, each of which can fail independently. The overarching lesson is that sharding trades the simplicity of a single node for scale, and the price is paid continuously in query complexity, lost cross-shard transactions, and operational burden, which is precisely why simpler scaling, replicas, caching, and vertical scaling, should be exhausted first and why the shard key should be chosen to keep most operations within a single shard.',
      },
    ],
    diagrams: [
      {
        title: 'Horizontal sharding by key',
        description: 'Rows are distributed across shards by the shard key; each shard is an independent database.',
        type: 'architecture',
        svgContent: svg(720, 220, [
          box(290, 20, 140, 46, 'Router / app', { stroke: 'accent', sub: 'shard(key)' }),
          arrow(310, 66, 130, 120, { label: 'A-H' }),
          arrow(360, 66, 360, 120, { label: 'I-P' }),
          arrow(410, 66, 590, 120, { label: 'Q-Z' }),
          box(60, 120, 140, 50, 'Shard 1', { fill: 'cardAlt', sub: 'users A-H' }),
          box(290, 120, 140, 50, 'Shard 2', { fill: 'cardAlt', sub: 'users I-P' }),
          box(520, 120, 140, 50, 'Shard 3', { fill: 'cardAlt', sub: 'users Q-Z' }),
          label(360, 200, 'a cross-shard query must fan out to all three', { fill: 'muted', size: 11, anchor: 'middle' }),
        ].join('')),
      },
      {
        title: 'Range versus hash sharding',
        description: 'Range keeps neighbors together (good for ranges, risks hot spots); hash spreads evenly (no range queries).',
        type: 'comparison',
        svgContent: svg(720, 180, [
          box(30, 40, 300, 60, 'Range-based', { stroke: 'amber', sub: 'efficient ranges · hot-spot risk' }),
          box(30, 115, 280, 44, 'recent writes pile on one shard', { fill: 'cardAlt' }),
          box(390, 40, 300, 60, 'Hash-based', { stroke: 'green', sub: 'even spread · no range queries' }),
          box(390, 115, 280, 44, 'use consistent hashing to rebalance', { fill: 'cardAlt' }),
        ].join('')),
      },
    ],
    realWorldExamples: [
      {
        company: 'Instagram',
        problem: 'A rapidly growing dataset of users and photos outgrew a single PostgreSQL instance, threatening both storage limits and write throughput.',
        solution: 'Shard PostgreSQL across many logical shards mapped onto physical servers, using a shard key and ID scheme that encodes the shard into globally unique IDs to keep related data together.',
        outcome: 'Instagram scaled writes and storage across shards while keeping a user\'s data co-located, a widely studied example of pragmatic application-level sharding.',
      },
      {
        company: 'Google (Spanner) / Vitess',
        problem: 'Operating sharding manually at scale is error-prone, and cross-shard transactions and rebalancing are hard to get right by hand.',
        solution: 'Build systems that automate sharding: Vitess transparently shards MySQL, and Spanner provides automatic sharding with global transactions, hiding much of the complexity from applications.',
        outcome: 'Teams scaled relational workloads across thousands of nodes with managed resharding and, in Spanner\'s case, cross-shard transactions, reducing the manual burden of sharding.',
      },
    ],
    codeExamples: [
      {
        language: 'typescript',
        label: 'Consistent-hash shard router',
        description: 'Route a key to a shard with consistent hashing so adding a shard moves minimal data.',
        code: `import { createHash } from 'node:crypto';

class ShardRouter {
  private ring: { point: number; shard: string }[] = [];

  constructor(shards: string[], virtualNodes = 100) {
    for (const shard of shards) {
      for (let i = 0; i < virtualNodes; i++) {
        this.ring.push({ point: this.hash(\`\${shard}#\${i}\`), shard });
      }
    }
    this.ring.sort((a, b) => a.point - b.point);
  }

  private hash(s: string): number {
    return parseInt(createHash('md5').update(s).digest('hex').slice(0, 8), 16);
  }

  // Same key always maps to the same shard; adding a shard remaps few keys.
  route(key: string): string {
    const h = this.hash(key);
    const node = this.ring.find((n) => n.point >= h) ?? this.ring[0];
    return node.shard;
  }
}

const router = new ShardRouter(['shard-1', 'shard-2', 'shard-3']);
console.log(router.route('user-42'));`,
      },
      {
        language: 'python',
        label: 'Shard-local writes, app-side fan-out reads',
        description: 'Keep a write on one shard, and gather a cross-shard read by querying every shard and merging.',
        code: `class ShardedStore:
    def __init__(self, shards: dict[str, object], router):
        self.shards = shards  # name -> db connection
        self.router = router

    def put(self, user_id: str, row: dict) -> None:
        # Write stays within a single shard (no cross-shard transaction).
        shard = self.shards[self.router.route(user_id)]
        shard.insert("orders", {**row, "user_id": user_id})

    def total_across_all(self) -> int:
        # Cross-shard aggregate must fan out to every shard and combine.
        total = 0
        for shard in self.shards.values():
            total += shard.scalar("SELECT COALESCE(SUM(total),0) FROM orders")
        return total  # slower and more complex than a single-node query`,
      },
    ],
    commonMistakes: [
      'Sharding prematurely for a read bottleneck that replicas and caching would have solved without the complexity.',
      'Choosing a monotonically increasing shard key (like a timestamp), creating a hot spot on one shard.',
      'Picking a shard key that scatters related data, forcing common queries to fan out across all shards.',
      'Ignoring rebalancing until an emergency, then discovering naive hashing remaps nearly all data.',
      'Assuming cross-shard transactions work like single-node ones instead of designing transactions to stay within a shard.',
    ],
    whenNotToUse:
      'Do not shard when vertical scaling, read replicas, and caching can still meet your needs, since those are far simpler and sharding imposes permanent complexity. Sharding is also the wrong tool for a read-heavy bottleneck (use replicas) or for data that is naturally small, and it should be deferred until you have a concrete, measured single-node write or storage limit.',
    relatedTopics: ['read-replicas', 'database-indexing', 'consistency-models', 'sql-vs-nosql', 'scalability-horizontal-vertical'],
    industryStandard: 'Instagram sharding · Vitess (YouTube) · Google Spanner · MongoDB/Cassandra partitioning',
    interviewTips:
      'Establish that sharding solves write-scaling and data-volume limits and is a last resort after replicas, caching, and vertical scaling, since reaching for it too early is a classic red flag. Make the shard key the centerpiece, explaining hot spots, co-location, and that it is painful to change later, then compare range, hash, and directory strategies with consistent hashing for rebalancing. The senior signal is volunteering the hard costs, cross-shard queries and lost cross-shard transactions, and designing to keep operations within a single shard.',
  },

  {
    id: 'read-replicas',
    title: 'Read Replicas',
    category: 'Databases',
    difficulty: 'Intermediate',
    readTime: 11,
    summary:
      'A read replica is a copy of a database that serves read queries, offloading the primary so it can focus on writes. Replicas are the simplest way to scale reads and add availability, but they introduce replication lag and eventual consistency.',
    whyItMatters:
      'Most applications are read-heavy, so the database\'s read load usually hits its limit long before its write load, and read replicas relieve that pressure far more simply than sharding. They also provide failover targets for availability, but the replication lag they introduce can cause subtle bugs if you read your own writes from a stale replica, so understanding the tradeoff is essential.',
    content: [
      {
        heading: 'The read-scaling problem replicas solve',
        body: 'The vast majority of applications perform many more reads than writes, often by a ratio of ten or a hundred to one, so as traffic grows it is almost always the read load that first overwhelms a single database, with the server spending most of its capacity answering queries. Read replicas address this directly by maintaining one or more copies of the database that receive a continuous stream of changes from the primary and serve read queries, so reads can be spread across many machines while all writes still go to the single primary. This is the simplest and most common way to scale reads, and it should be reached for well before more complex options like sharding, because it requires no change to the data model and is supported natively by every major database. The architecture is straightforward: the application sends writes to the primary and reads to one of the replicas, often through a load balancer that spreads read traffic. Because adding a replica is far easier than re-architecting around shards, replicas are the first tool to deploy when reads become the bottleneck. Understanding that read scaling and write scaling are different problems, and that replicas solve the more common read problem cheaply, is the key insight.',
      },
      {
        heading: 'Replication lag and eventual consistency',
        body: 'The fundamental tradeoff of read replicas is that they are not instantaneously up to date, because changes made on the primary take time to propagate to the replicas, a delay called replication lag that ranges from milliseconds under good conditions to seconds or worse under load. This means a replica is eventually consistent with the primary: it will catch up, but at any given moment it may be serving slightly stale data, and most replication is asynchronous, meaning the primary does not wait for replicas to confirm before acknowledging a write. The classic bug this causes is the read-your-writes violation, where a user updates something, the write goes to the primary, but the user\'s immediate next read hits a lagging replica that has not yet received the change, so the user sees their update vanish, which is confusing and looks like a bug. This is not a malfunction but an inherent property of asynchronous replication, and designing around it is the central challenge of using replicas. The application must decide, for each read, whether stale data is acceptable, because some reads tolerate seconds of staleness happily while others, especially reading back something the user just changed, do not. Recognizing replication lag as a guaranteed consequence rather than an occasional glitch is what lets you use replicas correctly.',
      },
      {
        heading: 'Patterns for living with lag',
        body: 'Because replication lag is inherent, applications use several patterns to get correctness where it matters while still enjoying the read scaling replicas provide. The most common is read-your-writes consistency, achieved by routing a user\'s reads to the primary for a short window after they perform a write, or by tracking the write position and only reading from a replica that has caught up to it, so the user always sees their own changes. More broadly, you classify reads by their consistency needs: critical reads that must be current, such as checking an account balance before a transaction, go to the primary, while reads that tolerate staleness, such as a feed, a dashboard, or analytics, go to replicas. Some systems offer synchronous or semi-synchronous replication for specific data, where the primary waits for a replica to confirm, trading write latency for stronger consistency, used selectively rather than everywhere. The general principle is to treat consistency as a per-query decision driven by the business meaning of the data, routing each read to the primary or a replica based on how much staleness it can tolerate. This deliberate routing is what makes replicas safe to use widely, because it confines the lag problem to the reads that genuinely cannot tolerate it while letting the bulk of read traffic scale out.',
      },
      {
        heading: 'Replicas for availability and operations',
        body: 'Beyond scaling reads, replicas serve a second major purpose: availability and disaster recovery, because a replica is a continuously updated copy that can be promoted to become the new primary if the original fails, providing a fast path to recovery. This failover capability means replicas reduce both the likelihood and the duration of a database outage, and placing replicas in different availability zones or regions protects against the loss of an entire data center. Replicas also enable operational conveniences, such as running heavy analytical queries or taking backups against a replica so that this expensive work does not burden the primary that is serving production traffic. There are operational subtleties: promoting a replica during failover must be handled carefully to avoid data loss from un-replicated writes or a split-brain situation where two nodes both think they are primary, which is why automated failover systems use careful coordination. Monitoring replication lag is itself essential, because a replica that falls too far behind is both serving very stale data and a poor failover candidate. The complete picture is that replicas are a dual-purpose tool, scaling reads and providing availability, and using them well means routing reads thoughtfully, monitoring lag, and handling failover carefully, which together make them one of the highest-value, lowest-complexity database scaling techniques available.',
      },
    ],
    diagrams: [
      {
        title: 'Primary handles writes, replicas serve reads',
        description: 'Writes go to the primary and replicate asynchronously; reads spread across replicas.',
        type: 'architecture',
        svgContent: svg(720, 230, [
          box(290, 20, 140, 46, 'Application', { stroke: 'accent' }),
          arrow(320, 66, 150, 110, { label: 'writes' }),
          arrow(390, 66, 390, 110, { label: 'reads' }),
          arrow(400, 66, 600, 110, { label: 'reads' }),
          box(80, 110, 150, 50, 'Primary', { stroke: 'green', sub: 'all writes' }),
          box(315, 110, 150, 50, 'Replica 1', { fill: 'cardAlt' }),
          box(540, 110, 150, 50, 'Replica 2', { fill: 'cardAlt' }),
          arrow(230, 135, 315, 135, { label: 'replicate (lag)', dashed: true }),
          arrow(230, 150, 540, 165, { label: 'replicate (lag)', dashed: true }),
        ].join('')),
      },
      {
        title: 'Read-your-writes routing',
        description: 'Just after a write, route the user\'s reads to the primary until the replica catches up.',
        type: 'flow',
        svgContent: svg(720, 180, [
          box(20, 70, 120, 46, 'User writes', { stroke: 'accent' }),
          arrow(140, 93, 240, 93, { label: 'then reads' }),
          box(240, 70, 140, 46, 'Recent write?', { sub: 'within window' }),
          arrow(380, 80, 480, 55, { label: 'yes → primary' }),
          arrow(380, 106, 480, 135, { label: 'no → replica' }),
          box(480, 35, 150, 40, 'Primary (fresh)', { stroke: 'green' }),
          box(480, 118, 150, 40, 'Replica (may lag)', { stroke: 'amber' }),
        ].join('')),
      },
    ],
    realWorldExamples: [
      {
        company: 'Most web platforms (read/write split)',
        problem: 'Read-heavy traffic saturated the primary database long before write load did, threatening latency across the application.',
        solution: 'Introduce read replicas and split traffic so writes hit the primary and the bulk of reads hit replicas, with critical reads routed to the primary for freshness.',
        outcome: 'Read capacity scaled out cheaply by adding replicas, deferring or avoiding the far greater complexity of sharding.',
      },
      {
        company: 'AWS (RDS / Aurora replicas)',
        problem: 'Customers needed both read scaling and high availability without operating replication and failover by hand.',
        solution: 'Provide managed read replicas and multi-AZ deployments where replicas serve reads and can be promoted automatically on primary failure, with replication and failover managed by the platform.',
        outcome: 'Teams scaled reads and gained automated failover with minimal operational effort, making read replicas a default building block.',
      },
    ],
    codeExamples: [
      {
        language: 'typescript',
        label: 'Read/write split with read-your-writes',
        description: 'Route writes to the primary and reads to a replica, but pin recent writers to the primary briefly.',
        code: `import { Pool } from 'pg';

const primary = new Pool({ host: 'primary.db' });
const replica = new Pool({ host: 'replica.db' });

const recentWriters = new Map<string, number>(); // userId -> expiry ms
const STICKY_MS = 3000; // route to primary for 3s after a write

async function write(userId: string, sql: string, params: unknown[]) {
  recentWriters.set(userId, Date.now() + STICKY_MS);
  return primary.query(sql, params);
}

async function read(userId: string, sql: string, params: unknown[]) {
  const until = recentWriters.get(userId) ?? 0;
  // Read your own writes: a just-written user reads from the primary.
  const pool = Date.now() < until ? primary : replica;
  return pool.query(sql, params);
}`,
      },
      {
        language: 'python',
        label: 'Lag-aware replica selection',
        description: 'Skip replicas whose replication lag exceeds a freshness budget for the query.',
        code: `from dataclasses import dataclass


@dataclass
class Replica:
    name: str
    lag_ms: int  # current replication lag, updated by monitoring


def pick_read_target(replicas: list[Replica], primary, max_lag_ms: int):
    # Only use a replica fresh enough for this query's tolerance.
    fresh = [r for r in replicas if r.lag_ms <= max_lag_ms]
    if not fresh:
        return primary  # all replicas too stale: fall back to primary
    # Prefer the least-lagged replica.
    return min(fresh, key=lambda r: r.lag_ms)


replicas = [Replica("r1", 50), Replica("r2", 1200)]
# A balance check (needs freshness) tolerates only 100ms of lag:
print(pick_read_target(replicas, "primary", max_lag_ms=100))  # r1`,
      },
    ],
    commonMistakes: [
      'Reading a user\'s own just-written data from a lagging replica, so their update appears to vanish.',
      'Treating replicas as strongly consistent and routing balance checks or critical reads to them.',
      'Not monitoring replication lag, so a far-behind replica silently serves very stale data and is a poor failover target.',
      'Sending all reads to replicas without classifying which ones actually tolerate staleness.',
      'Mishandling failover, risking lost un-replicated writes or a split-brain with two primaries.',
    ],
    whenNotToUse:
      'Read replicas do not help a write-bound workload, where the primary is saturated by writes rather than reads; that calls for sharding or a different data model. They are also unnecessary for small applications whose single database handles the load comfortably, and they are a poor fit for reads that cannot tolerate any staleness unless you route those specifically to the primary.',
    relatedTopics: ['database-sharding', 'consistency-models', 'caching-strategies', 'database-indexing', 'reliability-availability'],
    industryStandard: 'PostgreSQL/MySQL replication · AWS RDS/Aurora read replicas · "Designing Data-Intensive Applications"',
    interviewTips:
      'Lead with the observation that most workloads are read-heavy, so replicas solve the more common bottleneck and should precede sharding. Make replication lag and read-your-writes the centerpiece, explaining that asynchronous replication means replicas are eventually consistent and that you route reads to the primary or a replica based on each query\'s staleness tolerance. Mentioning replicas\' second role in availability and failover, plus monitoring lag, rounds out a senior answer.',
  },

  {
    id: 'acid-transactions',
    title: 'ACID Transactions',
    category: 'Databases',
    difficulty: 'Senior',
    readTime: 12,
    summary:
      'ACID, atomicity, consistency, isolation, durability, defines the guarantees a database transaction provides so that concurrent, partially-failed operations leave data correct. Understanding isolation levels in particular is essential to avoiding subtle concurrency bugs.',
    whyItMatters:
      'Transactions are what let you move money, place orders, and update related records without leaving data in a corrupt, half-finished state when things fail or when many users act at once. The ACID guarantees, and especially the isolation levels that trade correctness for performance, are where real concurrency bugs hide, so this is core knowledge for anyone building systems that must not lose or corrupt data.',
    content: [
      {
        heading: 'What ACID guarantees and why it exists',
        body: 'A transaction is a group of operations treated as a single indivisible unit, and ACID is the set of four properties that make transactions trustworthy in the face of failures and concurrency. Atomicity means all operations in a transaction succeed or none do, so a transfer that debits one account and credits another either completes entirely or leaves both accounts untouched, never debiting without crediting. Consistency means a transaction moves the database from one valid state to another, respecting all defined rules and constraints, so invariants like "account balances never go negative" hold before and after. Isolation means concurrent transactions do not interfere with each other in ways that produce incorrect results, ideally behaving as though they ran one at a time. Durability means once a transaction commits, its effects survive crashes and power loss, having been written to persistent storage. These properties exist because without them, the two unavoidable realities of real systems, failures partway through an operation and many operations happening at once, would routinely corrupt data. ACID is what lets a developer reason about a transaction as a single correct step rather than worrying about every possible interleaving and crash, which is an enormous simplification that makes correct data possible.',
      },
      {
        heading: 'Atomicity and durability in practice',
        body: 'Atomicity and durability are the properties most directly about surviving failure, and databases implement them with mechanisms worth understanding because they explain real behavior. Atomicity is typically achieved with a write-ahead log or undo log: the database records what it is about to do before doing it, so if a crash occurs mid-transaction it can roll back to a clean state, ensuring no partial transaction is ever visible. This is why a transaction that fails halfway leaves no trace, which is exactly what you want when a payment errors out after the debit but before the credit. Durability is achieved by ensuring that when a commit returns successfully, the data has been flushed to persistent storage, often the same write-ahead log, so that even an immediate power loss cannot lose the committed transaction. There is a performance tension here, because truly flushing to disk on every commit is slow, so databases offer tradeoffs and group commits to balance durability against throughput, and some systems relax durability slightly for speed. Understanding that atomicity comes from logging and rollback, and durability from flushing committed data to stable storage, demystifies why transactions behave as they do and what the performance costs of strong guarantees actually are.',
      },
      {
        heading: 'Isolation levels: the heart of concurrency bugs',
        body: 'Isolation is the most nuanced ACID property because perfect isolation, where transactions behave exactly as if run one at a time (serializable), is expensive, so databases offer weaker isolation levels that trade correctness for concurrency, and choosing among them is where subtle bugs are born. The standard levels, from weakest to strongest, are read uncommitted, read committed, repeatable read, and serializable, each permitting or preventing specific anomalies. The anomalies are the key vocabulary: a dirty read sees uncommitted data that may be rolled back, a non-repeatable read sees a row change between two reads in the same transaction, and a phantom read sees new rows appear when re-running a query. Read committed, a common default, prevents dirty reads but allows the others, while serializable prevents all of them at a higher cost. A particularly dangerous and often-overlooked anomaly is the lost update, where two transactions read a value, both modify it, and one overwrites the other, which is exactly the bug behind double-spending and incorrect counters. Choosing an isolation level means deciding which anomalies your application can tolerate, and the common mistake is using a weak default without realizing it permits an anomaly that corrupts your specific data. Understanding the levels and the anomalies each allows is what lets you pick correctly and prevent concurrency bugs by design.',
      },
      {
        heading: 'ACID, BASE, and distributed reality',
        body: 'ACID transactions are straightforward on a single database node but become genuinely hard across multiple nodes, which is why understanding their limits matters as much as understanding their guarantees. Maintaining ACID across a distributed system requires coordination protocols like two-phase commit that are slow and can block, and they collide with the CAP theorem, since insisting on strong consistency across partitions sacrifices availability. This is why many large-scale systems adopt the BASE philosophy, basically available, soft state, eventual consistency, deliberately relaxing ACID guarantees in exchange for availability and scale, accepting that data will be temporarily inconsistent and converge over time. The choice between ACID and BASE is not about one being better but about the nature of the data: financial records demand ACID because an anomaly means real money lost, while a social feed or a view counter can tolerate eventual consistency happily. Modern systems often mix the two, using ACID transactions within a single service or shard where invariants are critical and eventual consistency across services, coordinated by patterns like the saga. Newer distributed databases like Spanner work hard to provide ACID guarantees at global scale using specialized infrastructure, narrowing the old tradeoff. The mature view is that ACID is a powerful guarantee with a real coordination cost, so you apply it precisely where invariants demand it and accept weaker consistency where the data allows, rather than treating either ACID or BASE as a universal default.',
      },
    ],
    diagrams: [
      {
        title: 'The four ACID properties',
        description: 'Atomicity (all-or-nothing), Consistency (valid states), Isolation (no interference), Durability (survives crashes).',
        type: 'comparison',
        svgContent: svg(720, 130, [
          box(20, 40, 165, 60, 'Atomicity', { stroke: 'accent', sub: 'all or nothing' }),
          box(200, 40, 165, 60, 'Consistency', { sub: 'valid → valid' }),
          box(380, 40, 165, 60, 'Isolation', { stroke: 'purple', sub: 'no interference' }),
          box(560, 40, 140, 60, 'Durability', { stroke: 'green', sub: 'survives crash' }),
        ].join('')),
      },
      {
        title: 'Isolation levels and the anomalies they allow',
        description: 'Stronger levels prevent more anomalies at higher cost; weaker levels permit subtle concurrency bugs.',
        type: 'comparison',
        svgContent: svg(720, 200, [
          box(20, 40, 160, 60, 'Read Uncommitted', { stroke: 'red', sub: 'dirty reads' }),
          box(195, 40, 160, 60, 'Read Committed', { stroke: 'amber', sub: 'non-repeatable' }),
          box(370, 40, 160, 60, 'Repeatable Read', { sub: 'phantoms' }),
          box(545, 40, 155, 60, 'Serializable', { stroke: 'green', sub: 'none' }),
          arrow(20, 140, 700, 140, { label: 'weaker → stronger · more cost' }),
        ].join('')),
      },
    ],
    realWorldExamples: [
      {
        company: 'Banking / payments systems',
        problem: 'Money movement must never debit one account without crediting another, and concurrent transfers must not lose updates or allow double-spending.',
        solution: 'Wrap related operations in ACID transactions with an isolation level strong enough to prevent lost updates, often using row locking or serializable isolation for the critical path.',
        outcome: 'Financial invariants hold under concurrency and failure, which is precisely why payments systems insist on ACID despite its coordination cost.',
      },
      {
        company: 'Google (Spanner)',
        problem: 'Global services needed ACID transactions, including strong consistency, across data distributed worldwide, which classical wisdom deemed impractical.',
        solution: 'Use the TrueTime clock and Paxos to provide externally consistent, ACID transactions across a globally distributed database, narrowing the ACID-versus-availability tradeoff.',
        outcome: 'Spanner delivered global ACID transactions in production, showing that with specialized infrastructure the historical limits can be pushed back substantially.',
      },
    ],
    codeExamples: [
      {
        language: 'typescript',
        label: 'Atomic transfer in a transaction',
        description: 'Wrap a debit and credit in one transaction so they are all-or-nothing, rolling back on any error.',
        code: `import { Pool } from 'pg';

const pool = new Pool();

async function transfer(fromId: string, toId: string, cents: number) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Both updates succeed together or neither does (atomicity).
    const debit = await client.query(
      'UPDATE accounts SET balance = balance - $1 WHERE id = $2 AND balance >= $1',
      [cents, fromId],
    );
    if (debit.rowCount !== 1) throw new Error('insufficient funds'); // consistency
    await client.query(
      'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
      [cents, toId],
    );
    await client.query('COMMIT'); // durable once this returns
  } catch (err) {
    await client.query('ROLLBACK'); // leave data untouched on failure
    throw err;
  } finally {
    client.release();
  }
}`,
      },
      {
        language: 'python',
        label: 'Preventing lost updates with SELECT FOR UPDATE',
        description: 'Lock the row so concurrent transactions serialize, avoiding the read-modify-write lost-update bug.',
        code: `import psycopg2

conn = psycopg2.connect(dbname="app")


def increment_stock(product_id: str, delta: int) -> int:
    with conn:  # transaction: commits on success, rolls back on exception
        with conn.cursor() as cur:
            # FOR UPDATE locks the row so a concurrent txn waits, preventing
            # two reads-then-writes from overwriting each other (lost update).
            cur.execute(
                "SELECT stock FROM products WHERE id = %s FOR UPDATE",
                (product_id,),
            )
            (stock,) = cur.fetchone()
            new_stock = stock + delta
            cur.execute(
                "UPDATE products SET stock = %s WHERE id = %s",
                (new_stock, product_id),
            )
            return new_stock`,
      },
    ],
    commonMistakes: [
      'Relying on a weak default isolation level without realizing it permits an anomaly that corrupts your data.',
      'Doing a read-modify-write without locking or an atomic update, causing lost updates under concurrency.',
      'Assuming ACID transactions work the same across multiple services or shards as on a single node.',
      'Holding transactions open too long, creating lock contention that throttles throughput.',
      'Choosing serializable everywhere for safety and needlessly sacrificing concurrency where a weaker level suffices.',
    ],
    whenNotToUse:
      'Strong ACID transactions are unnecessary for data that is naturally append-only, independent, or tolerant of eventual consistency, such as logs, analytics events, or a social feed, where BASE-style eventual consistency scales better. Distributed multi-service transactions are best avoided entirely in favor of sagas, since coordinating ACID across services is slow and fragile.',
    relatedTopics: ['consistency-models', 'cap-theorem', 'database-sharding', 'saga-pattern', 'sql-vs-nosql'],
    industryStandard: 'ANSI SQL isolation levels · ARIES write-ahead logging · Google Spanner · "Designing Data-Intensive Applications"',
    interviewTips:
      'Define each ACID letter crisply with a transfer example, then spend most of your time on isolation levels and the anomalies, dirty reads, non-repeatable reads, phantoms, and especially lost updates, since that is where interviewers probe for real understanding. Show you would choose an isolation level by which anomalies the data can tolerate rather than defaulting blindly. The senior signal is contrasting ACID with BASE and explaining that cross-node transactions are costly, so you apply ACID where invariants demand it and accept eventual consistency elsewhere.',
  },

  {
    id: 'database-migration-strategies',
    title: 'Database Migration Strategies',
    category: 'Databases',
    difficulty: 'Senior',
    readTime: 12,
    summary:
      'A database migration changes the schema or data of a live database. Doing it safely, without downtime, data loss, or breaking running code, requires versioned, reversible, backward-compatible changes applied in careful steps.',
    whyItMatters:
      'Schema changes are among the riskiest operations in software because they touch persistent state that cannot simply be rolled back like code, and a careless migration can lock a table, break the running application, or corrupt data irreversibly. Knowing how to evolve a schema on a live, high-traffic database without downtime is a defining senior skill.',
    content: [
      {
        heading: 'Why migrations are uniquely dangerous',
        body: 'Migrations are riskier than ordinary code changes because they operate on persistent data that represents the accumulated state of the business, and unlike code, which you can redeploy or roll back instantly, a migration that deletes a column or transforms data may be impossible to undo once it has run. A migration also runs against a live database serving production traffic, so an operation that locks a large table can stall every query that touches it, effectively causing an outage even though nothing crashed. Furthermore, migrations interact with running application code, which expects a particular schema, so changing the schema out from under the deployed code can break it immediately, and changing the code to expect a new schema before the migration runs breaks it too. This three-way coupling between schema, data, and code is what makes migrations subtle, because you must keep all three compatible at every instant during a change that cannot be atomic across a fleet. The first principle is therefore to treat migrations with far more caution than code changes, recognizing that their effects on data are often permanent and their effects on a live system can be immediate. Internalizing that the database cannot be rolled back like a deployment is the mindset that drives every safe-migration technique.',
      },
      {
        heading: 'Versioned, automated, reversible migrations',
        body: 'The foundation of safe schema management is treating migrations as versioned, ordered, automated artifacts rather than ad hoc manual SQL, so that the schema has a known history and every environment can be brought to the same state deterministically. Migration tools maintain a record of which migrations have been applied and apply pending ones in order, which means the schema is reproducible and changes are reviewed in version control alongside code. Each migration should ideally be reversible, paired with a down migration that undoes it, so that a problematic change can be rolled back, though some changes like dropping data are inherently irreversible and must be treated with special care. Automating migrations also means they run as part of the deployment pipeline in a controlled, repeatable way rather than someone typing commands into a production console, which is error-prone and unauditable. Keeping migrations small and focused makes them easier to review, test, and reason about than large multi-change scripts. The discipline of versioned, automated, reviewed, and where possible reversible migrations transforms schema change from a risky manual event into a routine, traceable part of development, which is the precondition for doing the harder zero-downtime work safely.',
      },
      {
        heading: 'The expand-contract pattern for zero downtime',
        body: 'The central technique for changing a schema without downtime is the expand-contract pattern, also called parallel change, which decomposes a breaking change into a sequence of backward-compatible steps so that old and new code can both work during the transition. The expand phase adds the new schema element, such as a new column or table, without removing the old, so the database now supports both the old and new shapes and nothing breaks. Then the application is updated to write to both the old and new structures and gradually to read from the new one, often with a background backfill that copies existing data into the new shape. Only once all code reads and writes the new structure and the data is fully migrated does the contract phase remove the old element, which is now unused and safe to drop. This staged approach means at no point is the deployed code incompatible with the live schema, which is what eliminates downtime, at the cost of a multi-step process spread across several deploys. Renaming a column, for example, becomes add-new, dual-write, backfill, switch-reads, stop-writing-old, drop-old rather than a single rename that would break running code. Mastering expand-contract is the key to evolving a schema continuously on a system that can never go down.',
      },
      {
        heading: 'Operational safety: locks, backfills, and rollback',
        body: 'Even with expand-contract, the individual operations must be executed carefully on a large live table, because some schema changes acquire locks that block reads or writes for the duration, which on a big table can mean an unacceptable stall. Engineers must know which operations are safe and which lock, and use online schema-change techniques or tools that perform the change by building a new table and swapping it in to avoid long locks, since adding a column with a default or building an index naively can lock a table for a long time on some databases. Large data backfills should be done in small batches rather than one massive update, because a single huge transaction holds locks and generates enormous replication lag, whereas batched updates with pauses let the system keep serving traffic. Every migration should be tested against production-like data and volume, because a change that is instant on a small test table can take hours and lock production. A rollback plan is essential, and for irreversible operations like dropping a column, the safe practice is to deploy the code that stops using it well before the column is actually dropped, so the drop can be delayed and reversed if problems appear. Backups before risky migrations provide a last line of defense. The combination of lock-aware operations, batched backfills, realistic testing, and a deliberate rollback plan is what turns a dangerous schema change into a safe, routine one.',
      },
    ],
    diagrams: [
      {
        title: 'Expand-contract: rename a column safely',
        description: 'Add the new column, dual-write and backfill, switch reads, then drop the old, never breaking running code.',
        type: 'timeline',
        svgContent: svg(720, 180, [
          lane(20, 40, 700, 'zero-downtime rename'),
          box(20, 60, 120, 44, 'Add new col', { stroke: 'green', sub: 'expand' }),
          arrow(140, 82, 180, 82),
          box(180, 60, 130, 44, 'Dual-write + backfill', { sub: 'both shapes' }),
          arrow(310, 82, 350, 82),
          box(350, 60, 120, 44, 'Switch reads', { stroke: 'accent' }),
          arrow(470, 82, 510, 82),
          box(510, 60, 120, 44, 'Drop old col', { stroke: 'red', sub: 'contract' }),
        ].join('')),
      },
      {
        title: 'Batched backfill versus one big update',
        description: 'One massive update locks and lags; small batches keep the system serving traffic.',
        type: 'comparison',
        svgContent: svg(720, 180, [
          box(30, 40, 300, 60, 'Single huge UPDATE', { stroke: 'red', sub: 'long lock · replication lag' }),
          box(30, 115, 280, 44, 'blocks queries for minutes', { fill: 'cardAlt' }),
          box(390, 40, 300, 60, 'Batched backfill', { stroke: 'green', sub: 'small chunks + pauses' }),
          box(390, 115, 280, 44, 'system keeps serving traffic', { fill: 'cardAlt' }),
        ].join('')),
      },
    ],
    realWorldExamples: [
      {
        company: 'GitHub (gh-ost)',
        problem: 'Altering large MySQL tables locked them for unacceptable durations, making schema changes on a high-traffic database risky and disruptive.',
        solution: 'Build gh-ost, an online schema-change tool that creates a ghost copy of the table, backfills and syncs it without holding locks, then swaps it in atomically.',
        outcome: 'GitHub performed schema changes on huge tables with no downtime and full control, and gh-ost became a widely used tool for safe MySQL migrations.',
      },
      {
        company: 'Stripe / Rails ecosystem',
        problem: 'Continuous schema evolution on a live financial system risked breaking running code whenever schema and code changed out of sync.',
        solution: 'Adopt versioned migrations with the expand-contract pattern, deploying backward-compatible schema changes in stages so old and new code coexist safely during each transition.',
        outcome: 'Schema evolved continuously without downtime or broken deploys, demonstrating expand-contract as the standard discipline for safe migrations.',
      },
    ],
    codeExamples: [
      {
        language: 'typescript',
        label: 'Expand-contract migration steps',
        description: 'Express a column rename as ordered, reviewable migration steps rather than a single breaking rename.',
        code: `// Each step is a separate, deployable migration. NEVER rename in one shot.

// Step 1 (expand): add the new column, nullable, no default backfill yet.
export const up_addNewColumn = \`
  ALTER TABLE users ADD COLUMN full_name text
\`;

// Step 2 (backfill): copy data in batches (run as a job, not one UPDATE).
export const backfillBatch = \`
  UPDATE users SET full_name = name
  WHERE full_name IS NULL AND id IN (
    SELECT id FROM users WHERE full_name IS NULL LIMIT 1000
  )
\`;

// Step 3: deploy code that writes BOTH columns and reads full_name.
// Step 4 (contract): once nothing uses 'name', drop it in a later migration.
export const up_dropOldColumn = \`
  ALTER TABLE users DROP COLUMN name
\`;`,
      },
      {
        language: 'python',
        label: 'Batched backfill with pauses',
        description: 'Backfill a large table in small chunks so locks stay short and replicas keep up.',
        code: `import time


def backfill_full_name(conn, batch_size: int = 1000, pause_s: float = 0.2):
    while True:
        with conn:  # commit each batch so locks are released promptly
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE users SET full_name = name
                    WHERE id IN (
                        SELECT id FROM users
                        WHERE full_name IS NULL
                        LIMIT %s
                    )
                    """,
                    (batch_size,),
                )
                updated = cur.rowcount
        if updated == 0:
            break  # done
        time.sleep(pause_s)  # let replicas catch up, avoid hammering the DB`,
      },
    ],
    commonMistakes: [
      'Renaming or dropping a column in a single migration, breaking running code that still expects the old schema.',
      'Running a huge single-statement backfill that locks the table and floods replication lag.',
      'Performing locking schema operations on a large table without an online schema-change tool.',
      'Testing migrations only against tiny datasets, so an operation that is instant in test stalls production for hours.',
      'Dropping data irreversibly with no backup or staged rollback plan when something goes wrong.',
    ],
    whenNotToUse:
      'The full expand-contract ceremony is unnecessary for a greenfield database with no production data or users, where you can change the schema freely. Small, low-traffic systems can tolerate brief maintenance windows that make some migrations simpler, so reserve the heavy zero-downtime techniques for live, high-traffic databases where downtime and locks are genuinely unacceptable.',
    relatedTopics: ['database-indexing', 'read-replicas', 'database-sharding', 'ci-cd-pipeline-design', 'api-versioning'],
    industryStandard: 'Expand-contract / parallel change (Fowler) · GitHub gh-ost · Flyway / Liquibase / Rails migrations',
    interviewTips:
      'Start by explaining why migrations are uniquely dangerous, persistent data that cannot be rolled back like code, plus the three-way coupling of schema, data, and running code. Make expand-contract the centerpiece, walking a column rename through add, dual-write, backfill, switch-reads, and drop so old and new code always coexist. The senior signal is operational detail: lock-aware operations and online schema-change tools, batched backfills to limit locks and replication lag, realistic testing, and a rollback plan with backups.',
  },

];

/** Total number of authored articles. Useful for sidebar/header counts. */
export const DOC_ARTICLE_COUNT = DOC_ARTICLES.length;
