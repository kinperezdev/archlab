/**
 * Tool catalog — known third-party services ArchLab detects in source files.
 *
 * Detection is content-based (pattern + import matching) and purely local; the
 * catalog also carries metadata used downstream: brand color, icon, whether the
 * tool talks to the internet, its connection type, known MCP server URL, and a
 * package name for version/CVE checks.
 */

import type { DetectedToolSummary } from '@archlab/shared';

export type ToolCategory =
  | 'database'
  | 'auth'
  | 'payment'
  | 'ai'
  | 'messaging'
  | 'storage'
  | 'realtime'
  | 'analytics'
  | 'devtools'
  | 'api-client'
  | 'monitoring';

export interface DetectedTool {
  id: string;
  name: string;
  category: ToolCategory;
  color: string;
  icon: string;
  detectionPatterns: string[];
  importPatterns: string[];
  mcpServerUrl?: string;
  mcpDocsUrl?: string;
  isInternetConnected: boolean;
  connectionType:
    | 'api'
    | 'database'
    | 'auth'
    | 'payment'
    | 'messaging'
    | 'ai'
    | 'storage'
    | 'realtime'
    | 'analytics'
    | 'devtools'
    | 'api-client'
    | 'monitoring';
  securityNotes?: string;
  latestVersionCheck?: string;
}

export const TOOL_CATALOG: DetectedTool[] = [
  // Databases
  { id: 'supabase', name: 'Supabase', category: 'database', color: '#3ECF8E', icon: 'Database', detectionPatterns: ['createClient', 'supabase', '@supabase/supabase-js'], importPatterns: ['@supabase/supabase-js', '@supabase/auth-helpers'], mcpServerUrl: 'https://mcp.supabase.com/sse', mcpDocsUrl: 'https://supabase.com/docs/guides/getting-started/mcp', isInternetConnected: true, connectionType: 'database', securityNotes: 'Ensure RLS policies are enabled on all tables', latestVersionCheck: '@supabase/supabase-js' },
  { id: 'prisma', name: 'Prisma', category: 'database', color: '#5A67D8', icon: 'Database', detectionPatterns: ['PrismaClient', '@prisma/client', 'prisma.'], importPatterns: ['@prisma/client', 'prisma'], mcpServerUrl: 'https://mcp.prisma.io/sse', isInternetConnected: false, connectionType: 'database', latestVersionCheck: '@prisma/client' },
  { id: 'mongodb', name: 'MongoDB', category: 'database', color: '#47A248', icon: 'Database', detectionPatterns: ['mongoose', 'MongoClient', 'mongodb'], importPatterns: ['mongoose', 'mongodb'], isInternetConnected: false, connectionType: 'database', latestVersionCheck: 'mongoose' },
  { id: 'firebase', name: 'Firebase', category: 'database', color: '#FFCA28', icon: 'Flame', detectionPatterns: ['initializeApp', 'getFirestore', 'firebase'], importPatterns: ['firebase', 'firebase/app', 'firebase/firestore'], mcpServerUrl: 'https://firebase.tools/mcp', isInternetConnected: true, connectionType: 'realtime', securityNotes: 'Check Firestore security rules', latestVersionCheck: 'firebase' },
  { id: 'redis', name: 'Redis', category: 'database', color: '#DC382D', icon: 'Zap', detectionPatterns: ['createClient', 'ioredis', 'Redis'], importPatterns: ['ioredis', 'redis', '@upstash/redis'], isInternetConnected: false, connectionType: 'database', latestVersionCheck: 'ioredis' },
  { id: 'planetscale', name: 'PlanetScale', category: 'database', color: '#FA5E01', icon: 'Database', detectionPatterns: ['planetscale', 'pscale'], importPatterns: ['@planetscale/database'], isInternetConnected: true, connectionType: 'database' },
  { id: 'neon', name: 'Neon', category: 'database', color: '#00E5BF', icon: 'Database', detectionPatterns: ['neon', '@neondatabase'], importPatterns: ['@neondatabase/serverless'], isInternetConnected: true, connectionType: 'database' },

  // Auth
  { id: 'clerk', name: 'Clerk', category: 'auth', color: '#6C47FF', icon: 'Shield', detectionPatterns: ['ClerkProvider', 'useUser', '@clerk'], importPatterns: ['@clerk/nextjs', '@clerk/clerk-react', '@clerk/clerk-sdk-node'], mcpServerUrl: 'https://mcp.clerk.com/sse', isInternetConnected: true, connectionType: 'auth', securityNotes: 'Verify webhook signatures', latestVersionCheck: '@clerk/nextjs' },
  { id: 'auth0', name: 'Auth0', category: 'auth', color: '#EB5424', icon: 'Shield', detectionPatterns: ['Auth0Provider', 'useAuth0', 'auth0'], importPatterns: ['@auth0/auth0-react', '@auth0/nextjs-auth0'], isInternetConnected: true, connectionType: 'auth', latestVersionCheck: '@auth0/auth0-react' },
  { id: 'nextauth', name: 'NextAuth', category: 'auth', color: '#000000', icon: 'Shield', detectionPatterns: ['NextAuth', 'getServerSession', 'next-auth'], importPatterns: ['next-auth', '@auth/core'], isInternetConnected: true, connectionType: 'auth', latestVersionCheck: 'next-auth' },
  { id: 'supabase-auth', name: 'Supabase Auth', category: 'auth', color: '#3ECF8E', icon: 'Shield', detectionPatterns: ['signInWithPassword', 'signUp', 'onAuthStateChange'], importPatterns: ['@supabase/supabase-js'], isInternetConnected: true, connectionType: 'auth' },

  // Payments
  { id: 'stripe', name: 'Stripe', category: 'payment', color: '#635BFF', icon: 'CreditCard', detectionPatterns: ['Stripe', 'loadStripe', 'stripe.checkout', 'stripe.subscriptions'], importPatterns: ['stripe', '@stripe/stripe-js', '@stripe/react-stripe-js'], mcpServerUrl: 'https://mcp.stripe.com/sse', mcpDocsUrl: 'https://stripe.com/docs/stripe-apps/mcp', isInternetConnected: true, connectionType: 'payment', securityNotes: 'Always verify webhook signatures. Never expose secret key client-side', latestVersionCheck: 'stripe' },
  { id: 'paypal', name: 'PayPal', category: 'payment', color: '#003087', icon: 'CreditCard', detectionPatterns: ['paypal', 'PayPalButtons', 'createOrder'], importPatterns: ['@paypal/react-paypal-js', '@paypal/checkout-server-sdk'], isInternetConnected: true, connectionType: 'payment', securityNotes: 'Verify IPN messages server-side' },
  { id: 'lemon-squeezy', name: 'Lemon Squeezy', category: 'payment', color: '#FFC233', icon: 'CreditCard', detectionPatterns: ['lemonsqueezy', 'LemonSqueezy'], importPatterns: ['@lemonsqueezy/lemonsqueezy-js'], isInternetConnected: true, connectionType: 'payment' },

  // AI
  { id: 'openai', name: 'OpenAI', category: 'ai', color: '#00A67E', icon: 'Brain', detectionPatterns: ['OpenAI', 'openai.chat', 'gpt-4', 'gpt-3', 'createCompletion', 'ChatCompletion'], importPatterns: ['openai', '@openai/agents'], isInternetConnected: true, connectionType: 'ai', securityNotes: 'Never expose API key client-side', latestVersionCheck: 'openai' },
  { id: 'anthropic', name: 'Anthropic', category: 'ai', color: '#D97757', icon: 'Brain', detectionPatterns: ['Anthropic', 'claude', 'anthropic.messages'], importPatterns: ['@anthropic-ai/sdk', 'anthropic'], isInternetConnected: true, connectionType: 'ai', securityNotes: 'Never expose API key client-side', latestVersionCheck: '@anthropic-ai/sdk' },
  { id: 'gemini', name: 'Google Gemini', category: 'ai', color: '#4285F4', icon: 'Brain', detectionPatterns: ['GoogleGenerativeAI', 'gemini-pro', 'genai'], importPatterns: ['@google/generative-ai', '@google-ai/generativelanguage'], isInternetConnected: true, connectionType: 'ai', securityNotes: 'Never expose API key client-side' },
  { id: 'langchain', name: 'LangChain', category: 'ai', color: '#1C3C3C', icon: 'Link', detectionPatterns: ['ChatOpenAI', 'LangChain', 'langchain'], importPatterns: ['langchain', '@langchain/core', '@langchain/openai'], isInternetConnected: true, connectionType: 'ai', latestVersionCheck: 'langchain' },
  { id: 'vercel-ai', name: 'Vercel AI SDK', category: 'ai', color: '#000000', icon: 'Zap', detectionPatterns: ['useChat', 'useCompletion', 'streamText', 'generateText'], importPatterns: ['ai', '@ai-sdk/openai', '@ai-sdk/anthropic'], isInternetConnected: true, connectionType: 'ai', latestVersionCheck: 'ai' },
  { id: 'replicate', name: 'Replicate', category: 'ai', color: '#E62B2B', icon: 'Brain', detectionPatterns: ['Replicate', 'replicate.run'], importPatterns: ['replicate'], isInternetConnected: true, connectionType: 'ai' },

  // Messaging
  { id: 'twilio', name: 'Twilio', category: 'messaging', color: '#F22F46', icon: 'MessageSquare', detectionPatterns: ['twilio', 'Twilio', 'client.messages.create'], importPatterns: ['twilio'], isInternetConnected: true, connectionType: 'messaging', securityNotes: 'Validate webhook signatures', latestVersionCheck: 'twilio' },
  { id: 'sendgrid', name: 'SendGrid', category: 'messaging', color: '#1A82E2', icon: 'Mail', detectionPatterns: ['sendgrid', 'SendGrid', 'sgMail'], importPatterns: ['@sendgrid/mail'], isInternetConnected: true, connectionType: 'messaging', latestVersionCheck: '@sendgrid/mail' },
  { id: 'resend', name: 'Resend', category: 'messaging', color: '#000000', icon: 'Mail', detectionPatterns: ['Resend', 'resend.emails'], importPatterns: ['resend'], isInternetConnected: true, connectionType: 'messaging', latestVersionCheck: 'resend' },
  { id: 'pusher', name: 'Pusher', category: 'messaging', color: '#300D4F', icon: 'Zap', detectionPatterns: ['Pusher', 'pusher.trigger', 'pusher-js'], importPatterns: ['pusher', 'pusher-js'], isInternetConnected: true, connectionType: 'realtime', latestVersionCheck: 'pusher' },

  // Storage
  { id: 'aws-s3', name: 'AWS S3', category: 'storage', color: '#FF9900', icon: 'Cloud', detectionPatterns: ['S3Client', 'PutObjectCommand', 'aws-sdk', 's3.upload'], importPatterns: ['@aws-sdk/client-s3', 'aws-sdk'], isInternetConnected: true, connectionType: 'storage', securityNotes: 'Never make buckets public. Use signed URLs', latestVersionCheck: '@aws-sdk/client-s3' },
  { id: 'cloudinary', name: 'Cloudinary', category: 'storage', color: '#3448C5', icon: 'Image', detectionPatterns: ['cloudinary', 'Cloudinary', 'v2.uploader'], importPatterns: ['cloudinary', 'next-cloudinary'], isInternetConnected: true, connectionType: 'storage', latestVersionCheck: 'cloudinary' },
  { id: 'uploadthing', name: 'UploadThing', category: 'storage', color: '#EF4444', icon: 'Upload', detectionPatterns: ['createUploadthing', 'UTApi', 'uploadthing'], importPatterns: ['uploadthing', '@uploadthing/react'], isInternetConnected: true, connectionType: 'storage', latestVersionCheck: 'uploadthing' },

  // Analytics + Monitoring
  { id: 'posthog', name: 'PostHog', category: 'analytics', color: '#F54E00', icon: 'BarChart', detectionPatterns: ['posthog', 'PostHog', 'posthog.capture'], importPatterns: ['posthog-js', 'posthog-node'], isInternetConnected: true, connectionType: 'analytics', latestVersionCheck: 'posthog-js' },
  { id: 'mixpanel', name: 'Mixpanel', category: 'analytics', color: '#7856FF', icon: 'BarChart', detectionPatterns: ['mixpanel', 'Mixpanel', 'mixpanel.track'], importPatterns: ['mixpanel-browser', 'mixpanel'], isInternetConnected: true, connectionType: 'analytics', latestVersionCheck: 'mixpanel-browser' },
  { id: 'segment', name: 'Segment', category: 'analytics', color: '#52BD95', icon: 'BarChart', detectionPatterns: ['analytics.track', 'analytics.identify', 'segment'], importPatterns: ['@segment/analytics-next', 'analytics.js'], isInternetConnected: true, connectionType: 'analytics' },
  { id: 'sentry', name: 'Sentry', category: 'monitoring', color: '#362D59', icon: 'AlertTriangle', detectionPatterns: ['Sentry.init', 'captureException', '@sentry'], importPatterns: ['@sentry/nextjs', '@sentry/react', '@sentry/node'], isInternetConnected: true, connectionType: 'monitoring', latestVersionCheck: '@sentry/react' },

  // DevTools
  { id: 'github', name: 'GitHub', category: 'devtools', color: '#181717', icon: 'Github', detectionPatterns: ['Octokit', 'octokit', 'github.rest'], importPatterns: ['@octokit/rest', 'octokit'], mcpServerUrl: 'https://api.githubcopilot.com/mcp/', isInternetConnected: true, connectionType: 'api-client', latestVersionCheck: '@octokit/rest' },
  { id: 'linear', name: 'Linear', category: 'devtools', color: '#5E6AD2', icon: 'Layers', detectionPatterns: ['LinearClient', 'linear.issue'], importPatterns: ['@linear/sdk'], mcpServerUrl: 'https://mcp.linear.app/sse', isInternetConnected: true, connectionType: 'api-client' },
  { id: 'notion', name: 'Notion', category: 'devtools', color: '#000000', icon: 'FileText', detectionPatterns: ['NotionAPI', 'notion.databases'], importPatterns: ['@notionhq/client'], mcpServerUrl: 'https://mcp.notion.com/sse', isInternetConnected: true, connectionType: 'api-client' },

  // HTTP Clients
  { id: 'axios', name: 'Axios', category: 'api-client', color: '#5A29E4', icon: 'Globe', detectionPatterns: ['axios.get', 'axios.post', 'axios.create'], importPatterns: ['axios'], isInternetConnected: true, connectionType: 'api-client', latestVersionCheck: 'axios' },
  { id: 'trpc', name: 'tRPC', category: 'api-client', color: '#2596BE', icon: 'Zap', detectionPatterns: ['createTRPCRouter', 'initTRPC', 't.procedure'], importPatterns: ['@trpc/server', '@trpc/client', '@trpc/next'], isInternetConnected: false, connectionType: 'api-client', latestVersionCheck: '@trpc/server' },
  { id: 'graphql', name: 'GraphQL', category: 'api-client', color: '#E10098', icon: 'GitBranch', detectionPatterns: ['useQuery', 'useMutation', 'ApolloClient'], importPatterns: ['graphql', '@apollo/client', 'urql'], isInternetConnected: true, connectionType: 'api-client' },
];

const BY_ID = new Map(TOOL_CATALOG.map((t) => [t.id, t]));
export function toolById(id: string): DetectedTool | undefined {
  return BY_ID.get(id);
}

/** Detect every catalog tool referenced by a file's content. */
export function detectToolsInFile(content: string, _filePath: string): DetectedTool[] {
  const detected: DetectedTool[] = [];
  const contentLower = content.toLowerCase();
  for (const tool of TOOL_CATALOG) {
    const matchesPattern = tool.detectionPatterns.some(
      (pattern) => content.includes(pattern) || contentLower.includes(pattern.toLowerCase()),
    );
    const matchesImport = tool.importPatterns.some(
      (pkg) =>
        content.includes(`from '${pkg}'`) ||
        content.includes(`from "${pkg}"`) ||
        content.includes(`require('${pkg}')`) ||
        content.includes(`require("${pkg}")`),
    );
    if (matchesPattern || matchesImport) detected.push(tool);
  }
  return detected;
}

/** Compact, client-facing view of a detected tool, attached to canvas nodes. */
export function toToolSummary(t: DetectedTool): DetectedToolSummary {
  return {
    id: t.id,
    name: t.name,
    color: t.color,
    icon: t.icon,
    isInternetConnected: t.isInternetConnected,
    connectionType: t.connectionType,
    category: t.category,
    mcpServerUrl: t.mcpServerUrl,
    mcpDocsUrl: t.mcpDocsUrl,
    securityNotes: t.securityNotes,
    latestVersionCheck: t.latestVersionCheck,
  };
}
