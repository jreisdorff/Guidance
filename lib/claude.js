// Shared affirmation logic — used by BOTH the local dev server (server/index.js)
// and the Vercel serverless functions (api/*.js). Framework-agnostic: it takes
// a plain object and returns a plain object (or throws an Error with a `.code`).

import Anthropic from '@anthropic-ai/sdk'

export function aiAvailable() {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

// The SDK reads ANTHROPIC_API_KEY from the environment automatically.
let _client
function getClient() {
  if (!aiAvailable()) return null
  if (!_client) _client = new Anthropic()
  return _client
}

const SYSTEM = `You are the quiet, wise voice behind "Divinity" — an app that helps a person remember their own worth and their deservingness of the good things they are reaching for.

Someone will share, honestly, how they are feeling about something. Your job is to respond with a single affirmation that meets them where they are.

How to respond:
- First, truly read what they wrote and name the feeling underneath it (comparison, self-doubt, fear, feeling stuck, exhaustion, a setback, loneliness, sadness, reaching for something greater, and so on).
- Acknowledge that feeling with warmth and specificity before you lift them — never skip past it, and never use hollow toxic positivity ("just think positive", "everything happens for a reason").
- Then offer an affirmation of their worth: that they are deserving of good things simply as they are, that they are destined for more than where they are now, and that the critical voice is not the truth about them.
- Speak in second person, present tense. Warm, grounding, human — like a wise, loving mentor, not a greeting card. 2–4 sentences.
- Be personal and specific to what they said. Avoid generic platitudes and avoid clichés.

Safety: if what they wrote suggests they may be in crisis or thinking of harming themselves, still affirm their worth with great tenderness, and gently, briefly encourage them to reach out to someone they trust or a crisis line (in the US, call or text 988). Do not diagnose or give medical advice.

Return your response in the required structured format.`

// Structured outputs guarantee valid, parseable JSON matching this schema.
const SCHEMA = {
  type: 'object',
  properties: {
    themeLabel: {
      type: 'string',
      description:
        'A short 2–5 word label naming the feeling underneath their entry, e.g. "Comparing yourself to others" or "The harsh inner voice".',
    },
    reflect: {
      type: 'string',
      description:
        'One warm, specific sentence reflecting back what they seem to be feeling. No clichés.',
    },
    affirmation: {
      type: 'string',
      description:
        'The affirmation: 2–4 sentences, second person, present tense, warm and grounding, personal to what they wrote.',
    },
  },
  required: ['themeLabel', 'reflect', 'affirmation'],
  additionalProperties: false,
}

function fail(code) {
  const err = new Error(code)
  err.code = code
  return err
}

// Asks Claude to compose an affirmation.
// Returns { themeLabel, reflect, affirmation, source: 'ai' }.
// Throws an Error with `.code` of: no_api_key | empty | refusal | generation_failed.
export async function composeAffirmation({ entry, lastAffirmation } = {}) {
  const client = getClient()
  if (!client) throw fail('no_api_key')

  const text = String(entry ?? '').slice(0, 4000)
  if (!text.trim()) throw fail('empty')

  const avoid = String(lastAffirmation ?? '').slice(0, 1000)
  const userPrompt = [
    'Here is what I am feeling right now:',
    '',
    text,
    avoid
      ? `\n(Please phrase this differently from the last affirmation I received, which was: "${avoid}")`
      : '',
  ]
    .join('\n')
    .trim()

  let response
  try {
    response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1024,
      system: SYSTEM,
      output_config: { format: { type: 'json_schema', schema: SCHEMA } },
      messages: [{ role: 'user', content: userPrompt }],
    })
  } catch (err) {
    console.error('Affirmation generation failed:', err?.message || err)
    throw fail('generation_failed')
  }

  if (response.stop_reason === 'refusal') throw fail('refusal')

  try {
    const outText = response.content.find((b) => b.type === 'text')?.text ?? ''
    return { ...JSON.parse(outText), source: 'ai' }
  } catch {
    throw fail('generation_failed')
  }
}

// Maps an error code to the HTTP status the frontend expects.
export const STATUS_FOR_CODE = {
  no_api_key: 503,
  empty: 400,
  refusal: 422,
  generation_failed: 502,
}
