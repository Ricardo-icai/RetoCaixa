import type { Extraction, Session } from './contracts.ts';
import { extractLocally, validateFacts } from './language.ts';
import { LANGUAGE_SYSTEM_PROMPT } from './prompts.ts';

// A concrete vendor adapter is intentionally not selected: the user is choosing the provider.
export interface LanguageProvider {
  extract(input: { systemPrompt: string; text: string; pending: Session['pending']; language: Session['language']; history: { role: string; text: string }[]; signal: AbortSignal }): Promise<unknown>;
}
export async function interpret(text: string, session: Session, provider?: LanguageProvider): Promise<{ extraction: Extraction; mode: 'demo' | 'configured' | 'fallback' }> {
  const local = extractLocally(text, session);
  if (!provider) return { extraction: local, mode: 'demo' };
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const raw = await Promise.race([
      provider.extract({ systemPrompt: LANGUAGE_SYSTEM_PROMPT, text, pending: session.pending, language: session.language, history: session.messages.slice(-12).map(({ role, text }) => ({ role, text })), signal: controller.signal }),
      new Promise<never>((_, reject) => { timeout = setTimeout(() => { controller.abort(); reject(new Error('provider_timeout')); }, 3500); }),
    ]);
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('provider_schema');
    const result = raw as Extraction;
    if (!['profile', 'advice', 'education', 'market', 'panic', 'fomo', 'human'].includes(result.intent) || !result.facts || typeof result.facts !== 'object' || Array.isArray(result.facts)) throw new Error('provider_schema');
    // A language model cannot suppress locally detected ambiguity or behavioural signals.
    const intent = ['fomo', 'panic', 'human'].includes(local.intent) ? local.intent : result.intent;
    return { extraction: { facts: validateFacts(result.facts), intent, topic: text, uncertain: local.uncertain || result.uncertain === true }, mode: 'configured' };
  } catch {
    return { extraction: { ...local, uncertain: true }, mode: 'fallback' };
  } finally { if (timeout) clearTimeout(timeout); }
}
