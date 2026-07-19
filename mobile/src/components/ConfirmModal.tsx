import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, fonts } from '../theme'

// A small styled confirmation dialog for destructive actions, in the app's own
// voice. Ported from the web app's ConfirmDialog — closes on a backdrop tap.
export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message?: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
        {/* Stop taps inside the card from dismissing it. */}
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
              onPress={onCancel}
            >
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.confirmBtn, pressed && styles.pressed]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(28, 25, 23, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#1c1917',
    shadowOpacity: 0.25,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 16 },
    elevation: 12,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 20,
    color: colors.stone800,
    textAlign: 'center',
  },
  message: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: colors.stone500,
    textAlign: 'center',
    marginTop: 8,
  },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24, alignSelf: 'stretch' },
  cancelBtn: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.stone200,
    alignItems: 'center',
  },
  cancelText: { fontFamily: fonts.sansSemibold, color: colors.stone500, fontSize: 15 },
  confirmBtn: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 12,
    backgroundColor: colors.rose500,
    alignItems: 'center',
  },
  confirmText: { fontFamily: fonts.sansSemibold, color: '#ffffff', fontSize: 15 },
  pressed: { opacity: 0.85 },
})
