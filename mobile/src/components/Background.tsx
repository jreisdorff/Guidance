import { type ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { colors } from '../theme'

// Warm sunrise backdrop: a top-to-bottom gradient with two soft glow blobs,
// mirroring the web app's background.
export default function Background({ children }: { children: ReactNode }) {
  return (
    <LinearGradient colors={colors.bgGradient} style={styles.fill}>
      <View pointerEvents="none" style={styles.overlay}>
        <View style={[styles.glow, styles.glowTop]} />
        <View style={[styles.glow, styles.glowBottom]} />
      </View>
      <View style={styles.fill}>{children}</View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  glow: { position: 'absolute', borderRadius: 9999 },
  glowTop: {
    top: -160,
    alignSelf: 'center',
    width: 460,
    height: 460,
    backgroundColor: colors.glowAmber,
  },
  glowBottom: {
    bottom: -180,
    right: -100,
    width: 380,
    height: 380,
    backgroundColor: colors.glowRose,
  },
})
