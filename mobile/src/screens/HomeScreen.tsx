import { useEffect, useRef, useState } from 'react'
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import SunMark from '../components/SunMark'
import GradientButton from '../components/GradientButton'
import LanguageToggle from '../components/LanguageToggle'
import Journal from '../components/Journal'
import ConfirmModal from '../components/ConfirmModal'
import { useAuth } from '../auth/AuthContext'
import { getGuidance, type Guidance, ApiError } from '../api/client'
import { deleteAccount } from '../api/account'
import { addEntry, removeEntry, subscribeEntries, type JournalItem } from '../journal'
import { useI18n, translate } from '../i18n'
import { PRIVACY_URL, TERMS_URL } from '../config'
import { colors, fonts } from '../theme'

type ResultItem = Guidance & { entry: string; ts: number; groupId: number }

export default function HomeScreen() {
  const { user, getToken, signOut } = useAuth()
  const { t, lang, list } = useI18n()
  const scrollRef = useRef<ScrollView>(null)
  // Keep an index (not the text) so switching language re-localizes the prompt.
  const [promptIndex] = useState(() => {
    const len = list('prompts').length || 1
    return Math.floor((Date.now() / 1000) % len)
  })
  const [entry, setEntry] = useState('')
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [result, setResult] = useState<ResultItem | null>(null)
  const [journal, setJournal] = useState<JournalItem[]>([])
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const prompts = list('prompts')
  const prompt = prompts[promptIndex] ?? prompts[0] ?? ''

  // Live-subscribe to this user's journal in Firestore.
  useEffect(() => {
    if (!user) return
    return subscribeEntries(user.uid, setJournal)
  }, [user])

  // Maps an API failure to a gentle, human notice. 401 (expired session) is
  // handled by the caller, which signs out; everything else stays soft — we
  // never surface a raw status or code.
  function noticeFor(err: unknown): string {
    if (err instanceof ApiError) {
      if (err.status === 503) return t('noticeNoKey')
      if (err.code === 'refusal') return t('noticeRefusal')
    }
    return t('noticeUnreachable')
  }

  async function onSubmit() {
    if (!entry.trim() || loading) return
    setLoading(true)
    setNotice(null)
    try {
      const token = await getToken()
      if (!token) return void signOut()
      const guidance = await getGuidance(token, entry.trim(), result?.affirmation, lang)
      // groupId anchors this moment; re-phrasings (onAnother) reuse it so the
      // journal can group them under one card.
      const ts = Date.now()
      const record: ResultItem = { ...guidance, entry: entry.trim(), ts, groupId: ts }
      setResult(record)
      // Persist to Firestore; the subscription refreshes the journal list.
      if (user) addEntry(user.uid, record).catch(() => {})
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return void signOut()
      setNotice(noticeFor(err))
    } finally {
      setLoading(false)
    }
  }

  // Regenerate a fresh affirmation for the same entry, phrased differently.
  // Each re-phrasing is logged as its own entry but shares the moment's groupId.
  async function onAnother() {
    if (!result || loading) return
    setLoading(true)
    setNotice(null)
    try {
      const token = await getToken()
      if (!token) return void signOut()
      const guidance = await getGuidance(token, result.entry, result.affirmation, lang)
      const record: ResultItem = {
        ...guidance,
        entry: result.entry,
        ts: Date.now(),
        groupId: result.groupId,
      }
      setResult(record)
      if (user) addEntry(user.uid, record).catch(() => {})
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return void signOut()
      setNotice(noticeFor(err))
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

  // Clear the input and current response, and scroll back to the top.
  function onReset() {
    setEntry('')
    setResult(null)
    setNotice(null)
    scrollRef.current?.scrollTo({ y: 0, animated: true })
  }

  function deleteEntry(id: string) {
    if (user) removeEntry(user.uid, id).catch(() => {})
  }

  function clearJournal() {
    if (!user) return
    journal.forEach((r) => removeEntry(user.uid, r.id).catch(() => {}))
  }

  // Share the signed-in user's full journal, as a human-readable .txt body or a
  // machine-readable JSON string, through the native share sheet. The data is
  // already on the device — nothing is sent anywhere the user doesn't choose.
  async function exportJournal(format: 'txt' | 'json') {
    if (!user || !journal.length) return
    const tt = (key: string, vars?: Record<string, unknown>) => translate(lang, key, vars)

    let contents: string
    if (format === 'txt') {
      const lines = [
        tt('exportTitle'),
        tt('exportExported', { date: new Date().toLocaleString(lang) }),
        journal.length === 1
          ? tt('exportEntry', { n: journal.length })
          : tt('exportEntries', { n: journal.length }),
      ]
      journal.forEach((r) => {
        lines.push(
          '',
          '─'.repeat(32),
          new Date(r.ts).toLocaleString(lang) + (r.themeLabel ? ` · ${r.themeLabel}` : ''),
          '',
          tt('exportYouWrote'),
          `  ${r.entry}`,
        )
        if (r.reflect) lines.push('', tt('exportReflection'), `  ${r.reflect}`)
        lines.push('', tt('exportAffirmation'), `  ${r.affirmation}`)
      })
      contents = lines.join('\n') + '\n'
    } else {
      contents = JSON.stringify(
        {
          app: 'Guidance',
          exportedAt: new Date().toISOString(),
          account: {
            uid: user.uid,
            email: user.email ?? null,
            name: user.displayName ?? null,
            phone: user.phoneNumber ?? null,
          },
          entryCount: journal.length,
          entries: journal.map((r) => ({
            id: r.id,
            date: new Date(r.ts).toISOString(),
            ts: r.ts,
            theme: r.themeLabel ?? null,
            entry: r.entry,
            reflection: r.reflect ?? null,
            affirmation: r.affirmation,
            source: r.source ?? null,
          })),
        },
        null,
        2,
      )
    }

    try {
      await Share.share({ title: tt('exportTitle'), message: contents })
    } catch {
      // user dismissed the share sheet, or sharing is unavailable
    }
  }

  // Permanently delete the account and every journal entry, via the backend.
  async function handleDeleteAccount() {
    if (deleting) return
    setConfirmDelete(false)
    setDeleting(true)
    setNotice(null)
    try {
      const token = await getToken()
      if (!token) return void signOut()
      await deleteAccount(token)
      await signOut()
    } catch {
      setNotice(t('noticeDeleteFailed'))
      setDeleting(false)
    }
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
        {/* Language — top left */}
        <LanguageToggle style={styles.langTop} />
        {/* Sign out — top right */}
        <Pressable style={styles.signOutTop} onPress={signOut} hitSlop={8}>
          <Text style={styles.signOut}>{t('signOut')}</Text>
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
            placeholder={t('entryPlaceholder')}
            placeholderTextColor={colors.stone400}
            multiline
            value={entry}
            onChangeText={setEntry}
            editable={!loading}
          />
          <View style={styles.inputActions}>
            <GradientButton
              label={t('receiveBtn')}
              onPress={onSubmit}
              disabled={!entry.trim()}
              loading={loading}
            />
          </View>
        </View>

        {notice && <Text style={styles.notice}>{notice}</Text>}

        {/* Loading placeholder */}
        {loading && !result && (
          <View style={styles.loadingCard}>
            <SunMark size={40} />
            <Text style={styles.loadingText}>{t('composingForYou')}</Text>
          </View>
        )}

        {/* Result */}
        {result && (
          <View>
            <View style={styles.resultCard}>
              <Pressable style={styles.copyBtn} onPress={onCopy} hitSlop={8}>
                <Text style={styles.copyBtnText}>{copied ? t('copied') : t('copy')}</Text>
              </Pressable>
              <Text style={styles.theme}>{result.themeLabel}</Text>
              <Text style={styles.reflect}>{result.reflect}</Text>
              <Text style={styles.affirmation}>{result.affirmation}</Text>

              <View style={styles.actionsRow}>
                <Pressable
                  style={({ pressed }) => [styles.anotherBtn, pressed && styles.pressed]}
                  onPress={onAnother}
                  disabled={loading}
                >
                  <Text style={styles.anotherBtnText}>{t('sayAnother')}</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.freshBtn, pressed && styles.pressed]}
                  onPress={onReset}
                >
                  <Text style={styles.freshBtnText}>{t('startFresh')}</Text>
                </Pressable>
              </View>
            </View>
            <Text style={styles.breathe}>{t('breathe')}</Text>
          </View>
        )}

        {/* Journal */}
        <Journal
          journal={journal}
          onDelete={deleteEntry}
          onClear={clearJournal}
          onExport={exportJournal}
        />

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('writtenLive')}</Text>
          <Pressable onPress={signOut} hitSlop={8}>
            <Text style={styles.signOut}>{t('signOut')}</Text>
          </Pressable>
          <View style={styles.footerLinks}>
            <Pressable onPress={() => Linking.openURL(PRIVACY_URL)} hitSlop={8}>
              <Text style={styles.footerLink}>{t('privacyShort')}</Text>
            </Pressable>
            <Text style={styles.footerDot}>·</Text>
            <Pressable onPress={() => Linking.openURL(TERMS_URL)} hitSlop={8}>
              <Text style={styles.footerLink}>{t('terms')}</Text>
            </Pressable>
            <Text style={styles.footerDot}>·</Text>
            <Pressable onPress={() => setConfirmDelete(true)} disabled={deleting} hitSlop={8}>
              <Text style={[styles.footerLink, styles.deleteLink]}>
                {deleting ? t('deleting') : t('deleteAccount')}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <ConfirmModal
        open={confirmDelete}
        title={t('deleteAccountTitle')}
        message={t('deleteAccountMsg')}
        confirmLabel={t('deleteAccount')}
        cancelLabel={t('cancel')}
        onConfirm={handleDeleteAccount}
        onCancel={() => setConfirmDelete(false)}
      />
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

  langTop: { position: 'absolute', top: 64, left: 24, zIndex: 10 },
  signOutTop: { position: 'absolute', top: 64, right: 24, zIndex: 10 },

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

  notice: {
    fontFamily: fonts.sans,
    color: colors.amber700,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },

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
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 26,
  },
  anotherBtn: {
    backgroundColor: colors.stone800,
    borderRadius: 999,
    paddingVertical: 11,
    paddingHorizontal: 22,
  },
  anotherBtnText: { fontFamily: fonts.sansSemibold, color: colors.amber50, fontSize: 15 },
  freshBtn: { borderRadius: 999, paddingVertical: 11, paddingHorizontal: 16 },
  freshBtnText: { fontFamily: fonts.sansSemibold, color: colors.stone500, fontSize: 15 },
  pressed: { opacity: 0.85 },
  breathe: {
    fontFamily: fonts.sans,
    color: colors.stone400,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },

  footer: { marginTop: 24, alignItems: 'center', gap: 10 },
  footerText: { fontFamily: fonts.sans, color: colors.stone400, fontSize: 13 },
  signOut: {
    fontFamily: fonts.sans,
    color: colors.stone400,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  footerLinks: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  footerLink: {
    fontFamily: fonts.sans,
    color: colors.stone400,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  deleteLink: {},
  footerDot: { fontFamily: fonts.sans, color: colors.stone300, fontSize: 13 },
})
