import { useState } from 'react'
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { COUNTRIES } from '../countries'
import { colors, fonts } from '../theme'

// Collapsed: flag + dial code (e.g. "🇺🇸 +1 ⌄"). Tapping opens a modal list
// showing flag + code + full country name.
export default function CountryPicker({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (iso: string) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const selected = COUNTRIES.find((c) => c.iso === value) ?? COUNTRIES[0]

  return (
    <>
      <Pressable
        style={styles.button}
        onPress={() => setOpen(true)}
        disabled={disabled}
      >
        <Text style={styles.buttonText}>
          {selected.flag} +{selected.dial}
        </Text>
        <Text style={styles.caret}>⌄</Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet}>
            <Text style={styles.sheetTitle}>Country</Text>
            <ScrollView>
              {COUNTRIES.map((c) => (
                <Pressable
                  key={c.iso}
                  style={({ pressed }) => [
                    styles.row,
                    c.iso === value && styles.rowSelected,
                    pressed && styles.rowPressed,
                  ]}
                  onPress={() => {
                    onChange(c.iso)
                    setOpen(false)
                  }}
                >
                  <Text style={styles.rowFlag}>{c.flag}</Text>
                  <Text style={styles.rowDial}>+{c.dial}</Text>
                  <Text style={styles.rowName}>{c.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.ring,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  buttonText: { fontFamily: fonts.sansSemibold, fontSize: 18, color: colors.stone700 },
  caret: { fontSize: 14, color: colors.stone400 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(41,37,36,0.35)',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  sheet: {
    maxHeight: '70%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 12,
  },
  sheetTitle: {
    fontFamily: fonts.sansSemibold,
    fontSize: 13,
    color: colors.stone400,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  rowSelected: { backgroundColor: colors.stone100 },
  rowPressed: { backgroundColor: colors.stone100 },
  rowFlag: { fontSize: 20 },
  rowDial: { fontFamily: fonts.sansSemibold, fontSize: 15, color: colors.stone500, width: 52 },
  rowName: { fontFamily: fonts.sans, fontSize: 16, color: colors.stone700, flex: 1 },
})
