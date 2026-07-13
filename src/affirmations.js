// The smart local engine.
//
// It reads what you wrote, scores it against a set of emotional "themes"
// (comparison, self-doubt, fear, feeling stuck, and so on), and returns an
// affirmation matched to whatever weighed heaviest. Everything runs on your
// machine — nothing you type ever leaves this page.

// Each theme has:
//   id / label   — what it is
//   keywords     — phrases that hint at this feeling (weighted by specificity)
//   reflect      — a short, warm acknowledgement of the feeling
//   affirmations — the truths returned to you
const THEMES = [
  {
    id: 'comparison',
    label: 'Comparing yourself to others',
    keywords: [
      ['everyone else', 3],
      ['everyone is ahead', 3],
      ['ahead of me', 3],
      ['behind', 2],
      ['compare', 2],
      ['comparing', 2],
      ['comparison', 2],
      ['better than me', 3],
      ['they have', 2],
      ['further along', 3],
      ['left behind', 3],
      ['keeping up', 2],
      ['falling behind', 3],
      ['others', 1],
    ],
    reflect: 'It sounds like you are measuring your road against someone else’s.',
    affirmations: [
      'Your path is not late — it is yours. You are not behind anyone; you are exactly where your own growth needs you to be.',
      'The people you compare yourself to were handed a different map. You are not losing a race — you are walking a road built only for you.',
      'A flower does not bloom faster by watching the garden. Your season is coming, and it will arrive right on time.',
      'What looks like someone being “ahead” is only them being further along a road that was never yours to walk. Yours is unfolding perfectly.',
      'You are allowed to admire others without shrinking yourself. There is room in this world for their light and all of yours.',
    ],
  },
  {
    id: 'worthiness',
    label: 'Doubting that you deserve good things',
    keywords: [
      ['deserve', 3],
      ['deserving', 3],
      ["don't deserve", 3],
      ['dont deserve', 3],
      ['worthy', 3],
      ['worthiness', 3],
      ['unworthy', 3],
      ['not enough', 3],
      ['good enough', 3],
      ['impostor', 3],
      ['imposter', 3],
      ['fraud', 3],
      ['fluke', 2],
      ['luck', 1],
      ['undeserving', 3],
      ['earned', 1],
    ],
    reflect: 'It sounds like a part of you is questioning whether you are allowed to have what you want.',
    affirmations: [
      'You do not have to earn your worth — you were born holding it. The good things you reach for are meant for the person you already are.',
      'Worthiness is not a prize for finishing. It is the ground you stand on. You are deserving of the life you are building, right now, as you are.',
      'The dreams that found you did not choose the wrong person. You are worthy of every good thing you have set your heart on.',
      'You are not an impostor in your own life. What you have built, you built. What you want, you are allowed to have.',
      'Deserving is not a debt you pay off. You are already enough, and the greater things ahead are simply meeting you where you belong.',
    ],
  },
  {
    id: 'self-criticism',
    label: 'The harsh inner voice',
    keywords: [
      ['hate myself', 3],
      ['hate my', 2],
      ['stupid', 3],
      ['idiot', 3],
      ['worthless', 3],
      ['pathetic', 3],
      ['hard on myself', 3],
      ['critical', 2],
      ['inner critic', 3],
      ['self-critical', 3],
      ['not good', 2],
      ['a failure', 2],
      ['loser', 3],
      ['disappointed in myself', 3],
      ['ashamed', 2],
    ],
    reflect: 'It sounds like the critical voice has been loud today.',
    affirmations: [
      'That harsh voice is not the truth about you — it is only fear wearing your voice. You may thank it, and then let it go quiet.',
      'You would never speak to someone you love the way that voice speaks to you. Offer yourself that same gentleness — you have earned it.',
      'The critic inside you is not your judge. It is a frightened part asking to feel safe. You can hold it kindly and still know your own worth.',
      'You are not the cruel things you tell yourself in hard moments. You are the steady, worthy person who is still here, still trying.',
      'Let the voice speak, then answer it with the truth: you are doing better than it says, and you are far more than it can see.',
    ],
  },
  {
    id: 'fear',
    label: 'Fear and anxiety',
    keywords: [
      ['scared', 3],
      ['afraid', 3],
      ['fear', 2],
      ['anxious', 3],
      ['anxiety', 3],
      ['worried', 2],
      ['worry', 2],
      ['nervous', 2],
      ['terrified', 3],
      ['panic', 3],
      ['what if', 2],
      ['dread', 3],
      ['uncertain', 2],
      ['unknown', 1],
    ],
    reflect: 'It sounds like fear is sitting close to you right now.',
    affirmations: [
      'Fear shows up loudest right before something meaningful. It is not a wall — it is a doorway, and you are allowed to walk through it.',
      'You have survived every hard day you were once terrified of. You will meet this one with the same quiet strength.',
      'Courage is not the absence of fear — it is fear walking beside you while you move forward anyway. You are already doing it.',
      'The unknown ahead is not a threat. It is unwritten space, and you get to be the one who fills it. You are equal to what is coming.',
      'Breathe. You do not have to solve the whole future tonight. You only have to trust that the person facing it — you — is capable.',
    ],
  },
  {
    id: 'stuck',
    label: 'Feeling stuck or stagnant',
    keywords: [
      ['stuck', 3],
      ['trapped', 3],
      ['no progress', 3],
      ['going nowhere', 3],
      ['same place', 3],
      ['stagnant', 3],
      ['spinning my wheels', 3],
      ['not moving', 2],
      ['stalled', 2],
      ['plateau', 2],
      ['no growth', 2],
      ['where i am', 2],
      ['still here', 2],
      ['rut', 3],
    ],
    reflect: 'It sounds like you feel rooted in place, waiting for movement.',
    affirmations: [
      'Feeling stuck is not proof that you have stopped — it is often the quiet before a leap. Roots grow deep in the seasons that look still.',
      'You are not where you will end up. You are in the middle of a story, and the middle always feels the longest. Keep turning the page.',
      'Stillness is not the same as staying. Even now, unseen, you are becoming the person who steps into the greater things ahead.',
      'The ground beneath you is not a trap — it is a launchpad. What feels like being stuck is momentum gathering.',
      'You have moved before, from places that once felt permanent. You will move again. This chapter is not the whole book.',
    ],
  },
  {
    id: 'overwhelm',
    label: 'Overwhelm and exhaustion',
    keywords: [
      ['overwhelmed', 3],
      ['overwhelm', 3],
      ['too much', 3],
      ['exhausted', 3],
      ['burnt out', 3],
      ['burned out', 3],
      ['burnout', 3],
      ['drained', 2],
      ['tired', 2],
      ['so much to do', 3],
      ["can't keep up", 3],
      ['cant keep up', 3],
      ['no energy', 2],
      ['spread thin', 3],
    ],
    reflect: 'It sounds like you are carrying a great deal right now.',
    affirmations: [
      'You do not have to hold everything at once. Set some of it down. The weight you carry is proof of how much you care — not a test of your worth.',
      'Rest is not falling behind. It is how you make room for the greater things to reach you. You are allowed to slow down.',
      'You are one person doing the work of someone who cares deeply. Be as patient with yourself as you are generous with everyone else.',
      'The fact that it feels like too much means you have been strong for a long time. It is okay to breathe. It is okay to pause.',
      'You are not required to earn rest by breaking first. Lay the load down for a moment — the world will keep, and so will you.',
    ],
  },
  {
    id: 'failure',
    label: 'Setbacks and mistakes',
    keywords: [
      ['failed', 3],
      ['failure', 2],
      ['mistake', 3],
      ['mistakes', 3],
      ['screwed up', 3],
      ['messed up', 3],
      ['ruined', 2],
      ['wrong', 1],
      ['lost', 1],
      ['rejected', 3],
      ['rejection', 3],
      ['didn’t work', 2],
      ["didn't work", 2],
      ['setback', 3],
      ['gave up', 2],
    ],
    reflect: 'It sounds like something did not go the way you hoped.',
    affirmations: [
      'A setback is not a verdict on who you are. It is a single moment in a long life, and it does not get to define the greatness still ahead of you.',
      'You did not fail — you found one way that did not work, which means you are closer than the person who never tried.',
      'The mistake is behind you already. The worthy, capable person who learns from it is who moves forward. That person is you.',
      'Rejection is redirection. What did not open for you was not your door. The one that is meant for you is still ahead.',
      'You are allowed to stumble on the way to the life you are building. Falling is part of walking toward something great.',
    ],
  },
  {
    id: 'lonely',
    label: 'Loneliness',
    keywords: [
      ['alone', 3],
      ['lonely', 3],
      ['loneliness', 3],
      ['no one', 3],
      ['nobody', 3],
      ['isolated', 3],
      ['left out', 2],
      ['unseen', 2],
      ['no friends', 3],
      ['by myself', 2],
      ['disconnected', 2],
    ],
    reflect: 'It sounds like you are feeling alone in this.',
    affirmations: [
      'Feeling alone does not mean you are unlovable — it means you are a person who longs to connect, and that longing is beautiful and worthy.',
      'You are worth being known. The solitude you feel now is not the shape of your whole life; the right people are still on their way to you.',
      'Even in the quiet, you are not without worth. You are the steady companion who has never once left your own side.',
      'The connection you crave is not a sign of weakness — it is proof of a heart that has love to give. That heart deserves love in return.',
      'You are seen, even when it does not feel that way. And you are learning to be your own warm company — that, too, is a kind of home.',
    ],
  },
  {
    id: 'aspiration',
    label: 'Reaching for something greater',
    keywords: [
      ['dream', 2],
      ['dreams', 2],
      ['goal', 2],
      ['goals', 2],
      ['want to be', 2],
      ['destined', 3],
      ['destiny', 3],
      ['meant for more', 3],
      ['greater things', 3],
      ['success', 2],
      ['succeed', 2],
      ['bigger', 1],
      ['more than this', 3],
      ['purpose', 2],
      ['ambition', 2],
      ['potential', 2],
    ],
    reflect: 'It sounds like you are reaching toward something bigger for yourself.',
    affirmations: [
      'The size of your dream is not a mistake. You were given that vision because you are the one capable of carrying it into being.',
      'You are allowed to want more — not because what you have is not enough, but because you sense the greatness you were made to grow into.',
      'The pull you feel toward greater things is not arrogance. It is your own potential calling you by name. Answer it.',
      'You are destined for more, and destiny is not luck — it is the steady meeting of a worthy person and the work only they can do. That is you.',
      'The vision you hold did not choose the wrong dreamer. Trust it. You are becoming exactly the person who makes it real.',
    ],
  },
  {
    id: 'sad',
    label: 'Sadness and heaviness',
    keywords: [
      ['sad', 2],
      ['depressed', 3],
      ['depression', 3],
      ['hopeless', 3],
      ['empty', 2],
      ['numb', 2],
      ['crying', 2],
      ['heavy', 2],
      ['down', 1],
      ['low', 1],
      ["can't go on", 3],
      ['dark place', 3],
      ['heartbroken', 3],
    ],
    reflect: 'It sounds like there is a real heaviness with you right now.',
    affirmations: [
      'This heaviness is real, and so is your strength for carrying it. Feelings move like weather — this sky, too, will change.',
      'You do not have to be bright to be worthy. Even here, in the low places, your worth has not dimmed by a single degree.',
      'Sadness is not a flaw in you — it is a sign of how deeply you feel and how much you care. Be tender with yourself tonight.',
      'You have made it through every dark day so far, and here you still are. That quiet endurance is its own kind of greatness.',
      'The light has not left you — it is only resting behind the clouds. You are still whole, still worthy, still here.',
    ],
  },
]

// Returned when nothing specific is detected — steady, universal encouragement.
const GENERAL = {
  id: 'general',
  label: 'A moment of reflection',
  reflect: 'Thank you for putting words to what you are feeling.',
  affirmations: [
    'Whatever you are carrying today, none of it lowers your worth. You are deserving of good things simply because you exist.',
    'You are becoming, quietly and steadily, the person who steps into the greater life ahead. Trust the version of you that is on the way.',
    'You are allowed to take up space, to want more, and to believe you are worthy of it — because you are.',
    'The fact that you paused to check in with yourself is proof of how deeply you care. That care is the root of everything good ahead.',
    'You do not have to have it all figured out to be worthy of wonderful things. You only have to keep being the person who tries. That is enough.',
    'There is a greatness in you that no hard day can cancel. It is patient. It is waiting. And it is unmistakably yours.',
  ],
}

function normalize(text) {
  return ` ${text.toLowerCase().replace(/[’']/g, "'")} `
}

// Score every theme by how strongly its keywords appear, then return the winner.
function detectTheme(text) {
  const haystack = normalize(text)
  let best = null
  let bestScore = 0

  for (const theme of THEMES) {
    let score = 0
    for (const [phrase, weight] of theme.keywords) {
      const needle = phrase.toLowerCase().replace(/[’']/g, "'")
      if (haystack.includes(needle)) score += weight
    }
    if (score > bestScore) {
      bestScore = score
      best = theme
    }
  }

  // Require a little signal before committing to a theme.
  if (!best || bestScore < 2) return GENERAL
  return best
}

// Pick an affirmation from the theme, avoiding the one shown last time.
function pick(list, avoid) {
  if (list.length === 1) return list[0]
  const options = list.filter((a) => a !== avoid)
  const pool = options.length ? options : list
  const index = Math.floor((Date.now() / 137) % pool.length)
  return pool[index]
}

export function generateAffirmation(text, lastAffirmation) {
  const theme = detectTheme(text)
  const affirmation = pick(theme.affirmations, lastAffirmation)
  return {
    themeId: theme.id,
    themeLabel: theme.label,
    reflect: theme.reflect,
    affirmation,
  }
}

export function themeCount() {
  return THEMES.length
}
