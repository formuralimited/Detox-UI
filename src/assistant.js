/* Detox assistant: one adapter, three ways to answer.
   1. Published artifact: asks Claude through the page's "sample" capability (real AI).
   2. Your own build: set VITE_ASSISTANT_URL to a backend endpoint (for example one that calls OpenAI).
      The endpoint receives { system, messages } and returns { text }. Keep API keys on the server.
   3. Neither available: short offline replies, clearly labeled. */

let samplePromise = null;
function getSample() {
  if (!samplePromise) {
    samplePromise = (async () => {
      try {
        if (typeof window !== 'undefined' && window.claude && typeof window.claude.use === 'function') {
          return await window.claude.use('sample');
        }
      } catch { /* not available */ }
      return null;
    })();
  }
  return samplePromise;
}

const BACKEND = (import.meta.env && import.meta.env.VITE_ASSISTANT_URL) || '';

export async function assistantMode() {
  if (await getSample()) return 'ai';
  if (BACKEND) return 'backend';
  return 'offline';
}

export const STYLES = [
  { value: 'analytical', label: 'Direct', hint: 'Short, structured, numbers first' },
  { value: 'warm', label: 'Warm', hint: 'Encouraging and personal' },
  { value: 'playful', label: 'Playful', hint: 'Light and energetic' },
];

export function systemPrompt(ctx, style) {
  const st = STYLES.find((s) => s.value === style) || STYLES[0];
  return [
    'You are the Detox assistant inside a digital detox app. Your job: help the user regain focus, cut screen time step by step, understand their own phone habits, and spend the time they win back on real-world activities and people.',
    'Rules:',
    '- Reply in plain text. No markdown, no lists with symbols, no emojis. Keep replies under 90 words unless the user asks for more.',
    '- Be practical. Suggest one concrete next step, often a focus session, an offline activity, the block schedule, or reaching out to someone in their accountability circle.',
    '- Use the user\'s real numbers below when relevant. Never invent other data about them.',
    '- Do not shame the user. Name the habit plainly and move to what they can do now.',
    '- You are not a therapist or doctor. If the user mentions self-harm, crisis, abuse or feeling unsafe, tell them to contact their local emergency number now, and point them to Health, Safety in this app for licensed counselors and partner churches near them.',
    `- Reply style: ${st.label}. ${st.hint}. This mirrors how the user writes.`,
    '- You can start a focus session with the start_focus_session tool when the user agrees to one.',
    '',
    'User data today:',
    JSON.stringify(ctx),
  ].join('\n');
}

const REPLIES = {
  urge: {
    analytical: 'Urges peak for about 10 minutes. Option 1: start a 25 minute block now. Option 2: walk 500 steps. Which one?',
    warm: 'That pull is real, and you noticed it. Stay with me for ten minutes and it will ease. Want me to start a short block?',
    playful: 'The scroll monster is knocking. Let us not answer. Ten minutes, you and me, then a snack for me?',
  },
  sleep: {
    analytical: 'You slept 6 h 24 min against a 7 h 30 min goal. Biggest lever: phone out of the bedroom by 22:30.',
    warm: 'A short night makes everything harder. Be kind to yourself today. Tonight, let us put the phone to bed early.',
    playful: 'Six hours? I nap more than that in a pond. Tonight the phone sleeps in the hallway.',
  },
  move: {
    analytical: 'You are at 4,380 of 6,000 steps. A 15 minute walk covers the gap and earns 25 Star Dust.',
    warm: 'A little walk would do you good, and me too. Fifteen minutes is enough to reach your goal.',
    playful: 'Hop time. 1,620 steps to go. I will count, you walk.',
  },
  low: {
    analytical: 'Thank you for telling me. Two steps that help: message one person in your circle, and look at Support near you in the Safety tab.',
    warm: 'I am glad you told me. You do not have to carry this alone. Your circle is here, and the Safety tab lists people near you who can help.',
    playful: 'Thank you for saying it out loud. Let us get you some real company. Your circle is one tap away, and the Safety tab has people who can help.',
  },
  other: {
    analytical: 'Noted. You have used 93 of your 120 social media minutes today. A 25 minute focus session now would keep you on track.',
    warm: 'I hear you. You are doing well today, and I am growing because of it.',
    playful: 'Ribbit. Tell me more. Also, you are winning today.',
  },
};
const topicOf = (t) =>
  /scroll|urge|instagram|tiktok|phone|feed|crav/i.test(t) ? 'urge' :
  /sleep|tired|slept|awake|night/i.test(t) ? 'sleep' :
  /walk|step|exercise|run|gym|move/i.test(t) ? 'move' :
  /sad|low|lonely|down|stress|anxious|hard|alone/i.test(t) ? 'low' : 'other';

export function offlineReply(text, style) {
  return REPLIES[topicOf(text)][style] || REPLIES[topicOf(text)].analytical;
}

/* history: [{ role: 'user' | 'assistant', content }], ending with the user's message. */
export async function askAssistant({ history, ctx, style, tools, onText, signal }) {
  const system = systemPrompt(ctx, style);
  const sample = await getSample();
  if (sample) {
    const messages = [
      { role: 'user', content: `${system}\n\nReply "Ready." to confirm.` },
      { role: 'assistant', content: 'Ready.' },
      ...history,
    ];
    const res = await sample(messages, { onText, signal, tools, cache: false, modelTier: 'quick' });
    return { text: res.text, mode: 'ai' };
  }
  if (BACKEND) {
    const r = await fetch(BACKEND, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ system, messages: history }), signal });
    if (!r.ok) throw new Error(`The assistant service answered ${r.status}.`);
    const data = await r.json();
    if (onText) onText({ text: data.text });
    return { text: data.text, mode: 'backend' };
  }
  await new Promise((res) => setTimeout(res, 600));
  const text = offlineReply(history[history.length - 1].content, style);
  if (onText) onText({ text });
  return { text, mode: 'offline' };
}
