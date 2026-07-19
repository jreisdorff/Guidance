import { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useI18n } from '../i18n'
import { groupByDate, groupRephrasings, recentThemes } from '../journal-utils'
import type { JournalItem } from '../journal'
import { colors, fonts } from '../theme'
import ConfirmModal from './ConfirmModal'
import JournalCard from './JournalCard'

type ExportFormat = 'txt' | 'json'

// Pending destructive action awaiting confirmation.
type Confirm = null | { type: 'clear' } | { type: 'entry'; ids: string[] }

// The collapsible journal: recent-theme chips, search, and the day-grouped list
// of entries (with re-phrasings of one moment collapsed into a single card).
// Owns its own display state; the parent owns the data and the actions.
export default function Journal({
  journal,
  onDelete,
  onClear,
  onExport,
}: {
  journal: JournalItem[]
  onDelete: (id: string) => void
  onClear: () => void
  onExport: (format: ExportFormat) => void
}) {
  const { t, lang } = useI18n()
  const [showJournal, setShowJournal] = useState(false)
  const [journalQuery, setJournalQuery] = useState('')
  const [activeThemes, setActiveThemes] = useState<string[]>([])
  const [showExport, setShowExport] = useState(false)
  const [confirm, setConfirm] = useState<Confirm>(null)

  function runConfirm() {
    if (!confirm) return
    if (confirm.type === 'clear') onClear()
    else if (confirm.type === 'entry') confirm.ids.forEach(onDelete)
    setConfirm(null)
  }

  function toggleTheme(theme: string) {
    setActiveThemes((cur) =>
      cur.includes(theme) ? cur.filter((x) => x !== theme) : [...cur, theme],
    )
  }

  function choose(format: ExportFormat) {
    setShowExport(false)
    onExport(format)
  }

  const themes = recentThemes(journal)
  const journalQ = journalQuery.trim().toLowerCase()
  const filtering = journalQ !== '' || activeThemes.length > 0
  const filteredJournal = journal.filter((r) => {
    const matchesText =
      !journalQ ||
      (r.entry || '').toLowerCase().includes(journalQ) ||
      (r.affirmation || '').toLowerCase().includes(journalQ)
    const matchesTheme =
      activeThemes.length === 0 || activeThemes.includes(r.themeLabel)
    return matchesText && matchesTheme
  })

  return (
    <View style={styles.section}>
      <View style={styles.headerBar}>
        <Pressable
          style={styles.toggle}
          onPress={() => setShowJournal((s) => !s)}
          hitSlop={8}
        >
          <Text style={[styles.caret, showJournal && styles.caretOpen]}>›</Text>
          <Text style={styles.toggleText}>{t('yourJournal')}</Text>
          {journal.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{journal.length}</Text>
            </View>
          )}
        </Pressable>

        {showJournal && journal.length > 0 && (
          <View style={styles.headerActions}>
            <View>
              <Pressable onPress={() => setShowExport((o) => !o)} hitSlop={8}>
                <Text style={styles.actionLink}>{t('exportLabel')} ▾</Text>
              </Pressable>
              {showExport && (
                <View style={styles.exportMenu}>
                  <Pressable style={styles.exportItem} onPress={() => choose('txt')}>
                    <Text style={styles.exportItemText}>{t('exportTxt')}</Text>
                  </Pressable>
                  <Pressable style={styles.exportItem} onPress={() => choose('json')}>
                    <Text style={styles.exportItemText}>{t('exportJson')}</Text>
                  </Pressable>
                </View>
              )}
            </View>
            <Pressable onPress={() => setConfirm({ type: 'clear' })} hitSlop={8}>
              <Text style={styles.clearLink}>{t('clearAll')}</Text>
            </Pressable>
          </View>
        )}
      </View>

      {showJournal && (
        <View style={styles.list}>
          {journal.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>{t('emptyJournal')}</Text>
            </View>
          )}

          {themes.length > 0 && (
            <View style={styles.themesCard}>
              <View style={styles.themesHead}>
                <Text style={styles.themesLabel}>{t('latelyFeeling')}</Text>
                {activeThemes.length > 0 && (
                  <Pressable onPress={() => setActiveThemes([])} hitSlop={8}>
                    <Text style={styles.clearFilters}>{t('clearFilters')}</Text>
                  </Pressable>
                )}
              </View>
              <View style={styles.chips}>
                {themes.map((theme) => {
                  const active = activeThemes.includes(theme)
                  return (
                    <Pressable
                      key={theme}
                      onPress={() => toggleTheme(theme)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {theme}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            </View>
          )}

          {journal.length > 5 && (
            <TextInput
              style={styles.search}
              value={journalQuery}
              onChangeText={setJournalQuery}
              placeholder={t('searchPlaceholder')}
              placeholderTextColor={colors.stone400}
              returnKeyType="search"
            />
          )}

          {filtering && filteredJournal.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>{t('noMatches')}</Text>
            </View>
          )}

          {groupByDate(filteredJournal, lang).map((group) => (
            <View key={group.label} style={styles.dateGroup}>
              <Text style={styles.dateLabel}>{group.label}</Text>
              {groupRephrasings(group.items).map((g) => (
                <JournalCard
                  key={g.gid}
                  group={g}
                  onRequestRemove={(ids) => setConfirm({ type: 'entry', ids })}
                />
              ))}
            </View>
          ))}
        </View>
      )}

      <ConfirmModal
        open={!!confirm}
        title={confirm?.type === 'clear' ? t('clearTitle') : t('removeTitle')}
        message={
          confirm?.type === 'clear'
            ? t('clearMsg')
            : confirm && confirm.ids.length > 1
              ? t('removeMsgMulti', { n: confirm.ids.length })
              : t('removeMsg')
        }
        confirmLabel={confirm?.type === 'clear' ? t('clearAll') : t('remove')}
        cancelLabel={t('cancel')}
        onConfirm={runConfirm}
        onCancel={() => setConfirm(null)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  section: { marginTop: 12 },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  caret: { fontFamily: fonts.sansBold, color: colors.stone500, fontSize: 18 },
  caretOpen: { transform: [{ rotate: '90deg' }] },
  toggleText: { fontFamily: fonts.sansSemibold, color: colors.stone500, fontSize: 15 },
  badge: {
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 1,
  },
  badgeText: { fontFamily: fonts.sans, color: colors.stone400, fontSize: 12 },

  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  actionLink: { fontFamily: fonts.sans, color: colors.stone400, fontSize: 13 },
  clearLink: { fontFamily: fonts.sans, color: colors.stone400, fontSize: 13 },
  exportMenu: {
    position: 'absolute',
    top: 22,
    right: 0,
    width: 150,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 6,
    zIndex: 30,
    shadowColor: '#1c1917',
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  exportItem: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12 },
  exportItemText: { fontFamily: fonts.sans, color: colors.stone700, fontSize: 14 },

  list: { marginTop: 16, gap: 20 },

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

  themesCard: {
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  themesHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  themesLabel: {
    fontFamily: fonts.sans,
    color: colors.stone400,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  clearFilters: { fontFamily: fonts.sans, color: colors.stone400, fontSize: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.ring,
    backgroundColor: colors.card,
  },
  chipActive: { backgroundColor: colors.stone800, borderColor: colors.stone800 },
  chipText: { fontFamily: fonts.sans, color: colors.stone600, fontSize: 14 },
  chipTextActive: { color: colors.amber50 },

  search: {
    backgroundColor: colors.cardSoft,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.ring,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.stone700,
  },

  dateGroup: { gap: 12 },
  dateLabel: {
    fontFamily: fonts.sansSemibold,
    color: colors.stone400,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    paddingHorizontal: 2,
  },
})
