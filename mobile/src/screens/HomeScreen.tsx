import { useRef, useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import SunMark from '../components/SunMark'
import GradientButton from '../components/GradientButton'
import { useAuth } from '../auth/AuthContext'
import { getGuidance, type Guidance, ApiError } from '../api/client'
import { colors, fonts, PROMPTS } from '../theme'

type JournalItem = Guidance & { entry: string; ts: number }

function formatDate(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function HomeScreen() {
  const { getToken, signOut } = useAuth()
  const scrollRef = useRef<ScrollView>(null)
  const [prompt] = useState(
    () => PROMPTS[Math.floor((Date.now() / 1000) % PROMPTS.length)],
  )
  const [entry, setEntry] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<JournalItem | null>(null)
  const [journal, setJournal] = useState<JournalItem[]>([])
  const [showJournal, setShowJournal] = useState(false)
  const [copied, setCopied] = useState(false)

  async function onSubmit() {
    if (!entry.trim() || loading) return
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      if (!token) {
        await signOut()
        return
      }
      const guidance = await getGuidance(token, entry.trim(), result?.affirmation)
      setResult({ ...guidance, entry: entry.trim(), ts: Date.now() })
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await signOut()
        return
      }
      setError('Could not reach Guidance right now. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function onCopy() {
    if (!result) return
    try {
      const Clipboard = require('expo-clipboard')
      await Clipboard.setStringAsync(result.affirmation)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable in this build
    }
  }

  // Move the current response into the journal, clear the input, scroll up.
  function onNext() {
    if (!result) return
    setJournal((prev) => [result, ...prev].slice(0, 100))
    setResult(null)
    setEntry('')
    setError(null)
    scrollRef.current?.scrollTo({ y: 0, animated: true })
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Sign out — top right */}
        <Pressable style={styles.signOutTop} onPress={signOut} hitSlop={8}>
          <Text style={styles.signOut}>Sign out</Text>
        </Pressable>

        {/* Header */}
        <View style={styles.header}>
          <SunMark size={52} />
          <Text style={styles.title}>Guidance</Text>
        </View>

        {/* Input */}
        <Text style={styles.prompt}>{prompt}</Text>
        <View style={styles.inputCard}>
          <TextInput
            style={styles.input}
            placeholder="Type honestly…"
            placeholderTextColor={colors.stone400}
            multiline
            value={entry}
            onChangeText={setEntry}
            editable={!loading}
          />
          <View style={styles.inputActions}>
            <GradientButton
              label="Receive an affirmation"
              onPress={onSubmit}
              disabled={!entry.trim()}
              loading={loading}
            />
          </View>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        {/* Loading placeholder */}
        {loading && !result && (
          <View style={styles.loadingCard}>
            <SunMark size={40} />
            <Text style={styles.loadingText}>
              Composing something just for you…
            </Text>
          </View>
        )}

        {/* Result */}
        {result && (
          <View>
            <View style={styles.resultCard}>
              <Pressable style={styles.copyBtn} onPress={onCopy} hitSlop={8}>
                <Text style={styles.copyBtnText}>
                  {copied ? 'Copied' : 'Copy'}
                </Text>
              </Pressable>
              <Text style={styles.theme}>{result.themeLabel}</Text>
              <Text style={styles.reflect}>{result.reflect}</Text>
              <Text style={styles.affirmation}>{result.affirmation}</Text>

              <Pressable
                style={({ pressed }) => [styles.nextBtn, pressed && styles.pressed]}
                onPress={onNext}
              >
                <Text style={styles.nextBtnText}>Next</Text>
              </Pressable>
            </View>
            <Text style={styles.breathe}>
              Read it slowly. Take one full breath before you move on.
            </Text>
          </View>
        )}

        {/* Journal */}
        <View style={styles.journalSection}>
          <Pressable
            style={styles.journalToggle}
            onPress={() => setShowJournal((s) => !s)}
            hitSlop={8}
          >
            <Text style={styles.caret}>{showJournal ? '⌄' : '›'}</Text>
            <Text style={styles.journalToggleText}>Your journal</Text>
            {journal.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{journal.length}</Text>
              </View>
            )}
          </Pressable>

          {showJournal && (
            <View style={styles.journalList}>
              {journal.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>
                    Nothing here yet. What you share will be saved for you to
                    return to.
                  </Text>
                </View>
              ) : (
                journal.map((r, i) => (
                  <View key={i} style={styles.journalCard}>
                    <Text style={styles.journalTime}>{formatDate(r.ts)}</Text>
                    <Text style={styles.journalEntry}>“{r.entry}”</Text>
                    <Text style={styles.journalAffirmation}>{r.affirmation}</Text>
                  </View>
                ))
              )}
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Written for you 🌅</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const cardBase = {
  backgroundColor: colors.card,
  borderRadius: 28,
  borderWidth: 1,
  borderColor: colors.ring,
  shadowColor: '#7c2d12',
  shadowOpacity: 0.08,
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 12 },
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 72, paddingBottom: 48, gap: 20 },

  signOutTop: {
    position: 'absolute',
    top: 64,
    right: 24,
    zIndex: 10,
  },

  header: { alignItems: 'center', gap: 12 },
  title: {
    fontFamily: fonts.serif,
    fontSize: 44,
    color: colors.stone800,
    letterSpacing: -0.5,
  },

  prompt: {
    fontFamily: fonts.serifItalic,
    fontSize: 18,
    color: colors.stone500,
    textAlign: 'center',
    marginTop: 4,
  },

  inputCard: { ...cardBase, padding: 10 },
  input: {
    minHeight: 120,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.sans,
    fontSize: 17,
    lineHeight: 26,
    color: colors.stone700,
    textAlignVertical: 'top',
  },
  inputActions: { alignItems: 'flex-end', paddingHorizontal: 6, paddingBottom: 4 },

  error: { fontFamily: fonts.sans, color: colors.rose500, fontSize: 15, textAlign: 'center' },

  loadingCard: {
    ...cardBase,
    backgroundColor: colors.cardSoft,
    padding: 36,
    alignItems: 'center',
    gap: 14,
  },
  loadingText: {
    fontFamily: fonts.serifItalic,
    fontSize: 17,
    color: colors.stone500,
    textAlign: 'center',
  },

  resultCard: { ...cardBase, backgroundColor: colors.cardStrong, padding: 28 },
  copyBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.stone100,
  },
  copyBtnText: { fontFamily: fonts.sansSemibold, color: colors.stone500, fontSize: 13 },
  theme: {
    fontFamily: fonts.sansSemibold,
    color: colors.amber600,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 2,
    paddingRight: 64,
  },
  reflect: {
    fontFamily: fonts.sans,
    color: colors.stone500,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
  },
  affirmation: {
    fontFamily: fonts.serif,
    color: colors.stone800,
    fontSize: 25,
    lineHeight: 36,
    marginTop: 18,
  },
  nextBtn: {
    marginTop: 26,
    alignSelf: 'flex-start',
    backgroundColor: colors.stone800,
    borderRadius: 999,
    paddingVertical: 11,
    paddingHorizontal: 22,
  },
  nextBtnText: { fontFamily: fonts.sansSemibold, color: colors.amber50, fontSize: 15 },
  pressed: { opacity: 0.85 },
  breathe: {
    fontFamily: fonts.sans,
    color: colors.stone400,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },

  journalSection: { marginTop: 12 },
  journalToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  caret: { fontFamily: fonts.sansBold, color: colors.stone500, fontSize: 18 },
  journalToggleText: { fontFamily: fonts.sansSemibold, color: colors.stone500, fontSize: 15 },
  badge: {
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 1,
  },
  badgeText: { fontFamily: fonts.sans, color: colors.stone400, fontSize: 12 },

  journalList: { marginTop: 14, gap: 12 },
  emptyCard: {
    backgroundColor: colors.cardSoft,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  emptyText: {
    fontFamily: fonts.sans,
    color: colors.stone400,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },
  journalCard: {
    backgroundColor: colors.cardSoft,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.ring,
    padding: 18,
  },
  journalTime: {
    fontFamily: fonts.sans,
    color: colors.stone400,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  journalEntry: {
    fontFamily: fonts.serifItalic,
    color: colors.stone500,
    fontSize: 14,
    marginTop: 8,
  },
  journalAffirmation: {
    fontFamily: fonts.serif,
    color: colors.stone700,
    fontSize: 17,
    lineHeight: 26,
    marginTop: 10,
  },

  footer: { marginTop: 24, alignItems: 'center', gap: 10 },
  footerText: { fontFamily: fonts.sans, color: colors.stone400, fontSize: 13 },
  signOut: {
    fontFamily: fonts.sans,
    color: colors.stone400,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
})
