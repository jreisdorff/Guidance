import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { formatTime } from '../format'
import { useI18n } from '../i18n'
import type { RephraseGroup } from '../journal-utils'
import { colors, fonts } from '../theme'

// One journal moment as an accordion: the collapsed preview shows what was
// written (with time + a "N ways" badge for re-phrased moments); expanding
// reveals the affirmation response(s). Remove stays at the top-right.
export default function JournalCard({
  group: g,
  onRequestRemove,
}: {
  group: RephraseGroup
  onRequestRemove: (ids: string[]) => void
}) {
  const { t, lang } = useI18n()
  const [open, setOpen] = useState(false)

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Pressable
          style={styles.headerBtn}
          onPress={() => setOpen((o) => !o)}
          accessibilityRole="button"
          hitSlop={4}
        >
          <Text style={[styles.caret, open && styles.caretOpen]}>›</Text>
          <View style={styles.headerText}>
            <View style={styles.metaRow}>
              <Text style={styles.time}>{formatTime(g.items[0].ts, lang)}</Text>
              {g.items.length > 1 && (
                <Text style={styles.ways}>{t('waysCount', { n: g.items.length })}</Text>
              )}
            </View>
            <Text style={styles.entry}>“{g.entry}”</Text>
          </View>
        </Pressable>
        <Pressable
          onPress={() => onRequestRemove(g.items.map((it) => it.id))}
          accessibilityLabel={t('remove')}
          hitSlop={8}
        >
          <Text style={styles.remove}>{t('remove')}</Text>
        </Pressable>
      </View>

      {open && (
        <View style={styles.body}>
          {g.items.map((r, i) => (
            <View key={r.id} style={i > 0 ? styles.affirmDivider : undefined}>
              <Text style={styles.affirmation}>{r.affirmation}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardSoft,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.ring,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 18 },
  headerBtn: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  caret: { fontFamily: fonts.sansBold, color: colors.stone300, fontSize: 18, marginTop: 1 },
  caretOpen: { color: colors.stone400 },
  headerText: { flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  time: {
    fontFamily: fonts.sans,
    color: colors.stone400,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  ways: { fontFamily: fonts.sans, color: colors.stone300, fontSize: 12 },
  entry: {
    fontFamily: fonts.serifItalic,
    color: colors.stone500,
    fontSize: 14,
    marginTop: 8,
  },
  remove: { fontFamily: fonts.sans, color: colors.stone400, fontSize: 12 },
  body: { paddingLeft: 40, paddingRight: 18, paddingBottom: 18, gap: 12 },
  affirmDivider: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(214, 211, 209, 0.6)',
    paddingTop: 12,
  },
  affirmation: {
    fontFamily: fonts.serif,
    color: colors.stone700,
    fontSize: 18,
    lineHeight: 28,
  },
})
