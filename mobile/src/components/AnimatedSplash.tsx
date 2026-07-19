import { useEffect, useRef, useState } from 'react'
import { Animated, Easing, StyleSheet, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import SunMark from './SunMark'
import { colors, fonts } from '../theme'

// A warm intro animation shown over the app on launch: a soft halo pulses while
// the sun mark rises and slowly turns, then the title settles in. It holds for a
// beat (and until `ready`), then fades out to reveal the app.
export default function AnimatedSplash({
  onDone,
  ready,
}: {
  onDone: () => void
  ready: boolean
}) {
  const fade = useRef(new Animated.Value(1)).current
  const scale = useRef(new Animated.Value(0.6)).current
  const sunOpacity = useRef(new Animated.Value(0)).current
  const title = useRef(new Animated.Value(0)).current
  const spin = useRef(new Animated.Value(0)).current
  const pulse = useRef(new Animated.Value(0)).current
  const [minElapsed, setMinElapsed] = useState(false)

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 6, tension: 28, useNativeDriver: true }),
      Animated.timing(sunOpacity, { toValue: 1, duration: 650, useNativeDriver: true }),
      Animated.timing(title, {
        toValue: 1,
        duration: 700,
        delay: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start()

    // Gentle continuous motion: the sun turns slowly, the halo breathes.
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 16000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start()
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    ).start()

    const id = setTimeout(() => setMinElapsed(true), 1700)
    return () => clearTimeout(id)
  }, [fade, pulse, scale, spin, sunOpacity, title])

  // Fade out once the app is ready and we've shown the animation for a beat.
  useEffect(() => {
    if (!minElapsed || !ready) return
    Animated.timing(fade, {
      toValue: 0,
      duration: 520,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => onDone())
  }, [minElapsed, ready, fade, onDone])

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] })
  const haloScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.28] })
  const haloOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.65] })
  const titleShift = title.interpolate({ inputRange: [0, 1], outputRange: [12, 0] })

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.abs, { opacity: fade }]} pointerEvents="none">
      <LinearGradient colors={colors.bgGradient} style={styles.fill}>
        <View style={styles.center}>
          <View style={styles.markWrap}>
            <Animated.View
              style={[styles.halo, { opacity: haloOpacity, transform: [{ scale: haloScale }] }]}
            />
            <Animated.View style={{ opacity: sunOpacity, transform: [{ scale }, { rotate }] }}>
              <SunMark size={96} />
            </Animated.View>
          </View>
          <Animated.Text style={[styles.title, { opacity: title, transform: [{ translateY: titleShift }] }]}>
            Guidance
          </Animated.Text>
        </View>
      </LinearGradient>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  abs: { zIndex: 100 },
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 28 },
  markWrap: { alignItems: 'center', justifyContent: 'center' },
  halo: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: colors.glowAmber,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 40,
    color: colors.stone800,
    letterSpacing: -0.5,
  },
})
