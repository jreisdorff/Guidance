// Shared design tokens, ported from the web app (Tailwind "stone" + warm
// amber/rose sunrise palette, Fraunces serif + Nunito Sans).

export const colors = {
  // Sunrise background gradient (amber-50 → rose-50 → orange-100)
  bgGradient: ['#fffbeb', '#fff1f2', '#ffedd5'] as const,
  // Warm accent gradient (amber-500 → rose-500)
  accentGradient: ['#f59e0b', '#f43f5e'] as const,
  glowAmber: 'rgba(253, 230, 138, 0.55)', // amber-200/55
  glowRose: 'rgba(254, 205, 211, 0.5)', // rose-200/50

  stone800: '#292524',
  stone700: '#44403c',
  stone600: '#57534e',
  stone500: '#78716c',
  stone400: '#a8a29e',
  stone300: '#d6d3d1',
  stone200: '#e7e5e4',
  stone100: '#f5f5f4',

  amber700: '#b45309',
  amber600: '#d97706',
  amber50: '#fffbeb',
  rose500: '#f43f5e',

  cardStrong: 'rgba(255, 255, 255, 0.8)',
  card: 'rgba(255, 255, 255, 0.7)',
  cardSoft: 'rgba(255, 255, 255, 0.6)',
  ring: 'rgba(255, 255, 255, 0.7)',
}

export const fonts = {
  serif: 'Fraunces_500Medium',
  serifRegular: 'Fraunces_400Regular',
  serifItalic: 'Fraunces_400Regular_Italic',
  serifSemibold: 'Fraunces_600SemiBold',
  sans: 'NunitoSans_400Regular',
  sansSemibold: 'NunitoSans_600SemiBold',
  sansBold: 'NunitoSans_700Bold',
}

export const PROMPTS = [
  'What is weighing on you right now?',
  'What are you feeling about yourself today?',
  'What thought has been circling in your mind?',
  'What is the critical voice saying to you?',
  'What do you wish you could believe about yourself?',
]
