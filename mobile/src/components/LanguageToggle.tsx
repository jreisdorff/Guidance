import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native'
import { useI18n } from '../i18n'
import { colors, fonts } from '../theme'

// A tiny switch showing the other language as its call to action
// (English ⇄ Español). Used on both the sign-in screen and the app.
export default function LanguageToggle({ style }: { style?: StyleProp<ViewStyle> }) {
  const { lang, setLang, t } = useI18n()
  return (
    <Pressable
      onPress={() => setLang(lang === 'es' ? 'en' : 'es')}
      accessibilityLabel={t('changeLanguage')}
      hitSlop={8}
      style={style}
    >
      <Text style={styles.text}>{lang === 'es' ? 'English' : 'Español'}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  text: {
    fontFamily: fonts.sansSemibold,
    color: colors.stone400,
    fontSize: 14,
  },
})
