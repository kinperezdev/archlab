/**
 * AI Update runner — evolves every employee's personality, mood, knowledge,
 * opinions, catchphrases, and conversation topics via the active AI provider,
 * then persists the result into each employee's living data.
 *
 * Runs in batches of 3 so a full roster update doesn't fire 20 calls at once.
 */

import { EMPLOYEES, type Employee } from './companyData.js';
import { completeWithProvider, type AIProviderConfig } from './multiProviderAI.js';
import { getLivingData, updateLivingData } from './employeeLivingStore.js';
import type { ConversationTopic, EmployeeMood } from './employeeLivingStore.js';

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
  providerConfig: AIProviderConfig,
  brainInsights: string[],
  projectContext: string,
  onProgress: (employeeId: string, status: ProgressStatus) => void,
): Promise<AIUpdateResult[]> {
  const results: AIUpdateResult[] = [];

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

        const userPrompt = `Project context: ${projectContext}
Brain insights: ${brainInsights.slice(0, 3).join('. ')}

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
    { "withEmployeeId": "marcus-webb", "topic": "topic", "messages": [ {"speakerId": "${employee.id}", "text": "message"}, {"speakerId": "marcus-webb", "text": "reply"} ], "priority": "normal", "generatedAt": ${Date.now()} }
  ]
}`;

        try {
          const { text, tokensUsed, error } = await completeWithProvider(
            providerConfig,
            systemPrompt,
            userPrompt,
            500,
          );
          if (error) throw new Error(error);
          const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());

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
                provider: providerConfig.provider,
                previousPersonality: living?.evolvedPersonality ?? employee.personality,
                newPersonality: parsed.evolvedPersonality ?? '',
                moodBefore: living?.currentMood ?? 'focused',
                moodAfter: parsed.currentMood ?? 'focused',
                tokensUsed,
              },
            ].slice(-20),
          });

          onProgress(employee.id, 'done');
        } catch {
          onProgress(employee.id, 'error');
        }
      }),
    );
  }

  return results;
}
