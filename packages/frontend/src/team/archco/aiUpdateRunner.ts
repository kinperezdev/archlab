/**
 * AI Update runner — evolves every employee's personality, mood, knowledge,
 * opinions, catchphrases, and conversation topics via the active AI provider,
 * then persists the result into each employee's living data.
 *
 * Runs in batches of 3 so a full roster update doesn't fire 20 calls at once.
 */

import { EMPLOYEES, type Employee } from './companyData.js';
import { completeWithFallback, type AIProviderConfig } from './multiProviderAI.js';
import { getLivingData, updateLivingData, addConversationTopic } from './employeeLivingStore.js';
import type { ConversationTopic, EmployeeMood } from './employeeLivingStore.js';

const VALID_EMPLOYEE_IDS = new Set(EMPLOYEES.map((e) => e.id));

export interface AIUpdateResult {
  employeeId: string;
  evolvedPersonality: string;
  currentOpinions: string[];
  learnedPatterns: string[];
  evolvedCatchphrases: string[];
  currentMood: string;
  moodReason: string;
  specialInsights: string[];
  newConversationTopics: ConversationTopic[];
  tokensUsed: number;
}

type ProgressStatus = 'updating' | 'done' | 'error';

export async function runAIUpdate(
  providers: AIProviderConfig[],
  brainInsights: string[],
  projectContext: string,
  onProgress: (employeeId: string, status: ProgressStatus) => void,
): Promise<AIUpdateResult[]> {
  if (providers.length === 0) throw new Error('No AI provider configured. Add an API key in Settings.');
  const results: AIUpdateResult[] = [];
  const failures: string[] = [];

  const batches: Employee[][] = [];
  for (let i = 0; i < EMPLOYEES.length; i += 3) {
    batches.push(EMPLOYEES.slice(i, i + 3));
  }

  for (const batch of batches) {
    await Promise.all(
      batch.map(async (employee) => {
        onProgress(employee.id, 'updating');
        const living = getLivingData(employee.id);

        const systemPrompt = `You are generating a personality and knowledge update for ${employee.name}, ${employee.role}.
Current personality: ${living?.evolvedPersonality ?? employee.personality}
Specializations: ${employee.specialization.join(', ')}
Level: ${living?.level ?? employee.level}
Tasks completed: ${living?.tasksCompleted ?? employee.tasksCompleted}
Previous catchphrases: ${(living?.evolvedCatchphrases ?? employee.catchphrases ?? []).join(', ')}
Return ONLY valid JSON, no markdown, no explanation.`;

        // Real colleagues so generated topics wire to varied teammates,
        // not a single hardcoded id.
        const colleagues = EMPLOYEES.filter((e) => e.id !== employee.id);
        const colleagueList = colleagues
          .map((c) => `${c.id} (${c.name}, ${c.role})`)
          .join('; ');
        const sampleColleague = colleagues[0]?.id ?? employee.id;

        const userPrompt = `Project context: ${projectContext}
Brain insights: ${brainInsights.slice(0, 3).join('. ')}

Colleagues (pick 1-2 RELEVANT, DIFFERENT teammates for conversation topics — use their exact id from this list):
${colleagueList}

Generate a personality upgrade. Return this exact JSON shape:
{
  "evolvedPersonality": "updated personality showing growth (2-3 sentences)",
  "currentOpinions": ["opinion 1", "opinion 2", "opinion 3"],
  "learnedPatterns": ["pattern 1", "pattern 2"],
  "evolvedCatchphrases": ["catchphrase 1", "catchphrase 2", "catchphrase 3"],
  "currentMood": "focused",
  "moodReason": "one sentence",
  "specialInsights": ["insight 1", "insight 2"],
  "newConversationTopics": [
    { "withEmployeeId": "${sampleColleague}", "topic": "topic", "messages": [ {"speakerId": "${employee.id}", "text": "message"}, {"speakerId": "${sampleColleague}", "text": "reply"} ], "priority": "normal", "generatedAt": ${Date.now()} }
  ]
}`;

        try {
          const { text, tokensUsed, error, provider } = await completeWithFallback(
            providers,
            systemPrompt,
            userPrompt,
            500,
          );
          if (error) throw new Error(text || error);
          const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());

          // Keep only topics aimed at a real, different colleague.
          const validTopics: ConversationTopic[] = (parsed.newConversationTopics ?? []).filter(
            (t: ConversationTopic) =>
              t?.withEmployeeId &&
              t.withEmployeeId !== employee.id &&
              VALID_EMPLOYEE_IDS.has(t.withEmployeeId),
          );
          parsed.newConversationTopics = validTopics;

          results.push({
            employeeId: employee.id,
            evolvedPersonality: parsed.evolvedPersonality ?? '',
            currentOpinions: parsed.currentOpinions ?? [],
            learnedPatterns: parsed.learnedPatterns ?? [],
            evolvedCatchphrases: parsed.evolvedCatchphrases ?? [],
            currentMood: parsed.currentMood ?? 'focused',
            moodReason: parsed.moodReason ?? '',
            specialInsights: parsed.specialInsights ?? [],
            newConversationTopics: parsed.newConversationTopics ?? [],
            tokensUsed,
          });

          await updateLivingData(employee.id, {
            evolvedPersonality: parsed.evolvedPersonality,
            currentMood: (parsed.currentMood ?? 'focused') as EmployeeMood,
            moodReason: parsed.moodReason,
            currentOpinions: parsed.currentOpinions ?? [],
            learnedPatterns: [...(living?.learnedPatterns ?? []), ...(parsed.learnedPatterns ?? [])].slice(-20),
            specialInsights: [...(living?.specialInsights ?? []), ...(parsed.specialInsights ?? [])].slice(-20),
            evolvedCatchphrases: parsed.evolvedCatchphrases ?? [],
            conversationTopics: parsed.newConversationTopics ?? [],
            knowledgeLevel: Math.min(10, (living?.knowledgeLevel ?? 1) + 1),
            aiUpdateCount: (living?.aiUpdateCount ?? 0) + 1,
            lastAIUpdate: Date.now(),
            aiUpdateHistory: [
              ...(living?.aiUpdateHistory ?? []),
              {
                updatedAt: Date.now(),
                provider,
                previousPersonality: living?.evolvedPersonality ?? employee.personality,
                newPersonality: parsed.evolvedPersonality ?? '',
                moodBefore: living?.currentMood ?? 'focused',
                moodAfter: parsed.currentMood ?? 'focused',
                tokensUsed,
              },
            ].slice(-20),
          });

          onProgress(employee.id, 'done');
        } catch (err) {
          failures.push(err instanceof Error ? err.message : String(err));
          onProgress(employee.id, 'error');
        }
      }),
    );
  }

  // If every employee failed, surface the real reason instead of pretending
  // the update succeeded (e.g. provider quota exhausted, bad key).
  if (results.length === 0) {
    throw new Error(failures[0] ?? 'AI update failed for every employee.');
  }

  // Wire each topic into the *other* employee too, so both sides have the
  // conversation queued (the floor can then trigger it from either desk).
  // Done after all batches to avoid clobbering concurrent living-data writes.
  for (const r of results) {
    for (const topic of r.newConversationTopics) {
      addConversationTopic(topic.withEmployeeId, {
        ...topic,
        withEmployeeId: r.employeeId,
      });
    }
  }

  return results;
}
