import Svg, {
  Circle,
  Defs,
  G,
  Line,
  RadialGradient,
  Stop,
} from 'react-native-svg'

// The sunrise mark from the web app (src/App.jsx SunMark).
export default function SunMark({ size = 56 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Defs>
        <RadialGradient id="sun" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#fbbf24" />
          <Stop offset="100%" stopColor="#f43f5e" />
        </RadialGradient>
      </Defs>
      <Circle cx="16" cy="16" r="8.5" fill="url(#sun)" />
      <G stroke="#f59e0b" strokeWidth={2} strokeLinecap="round" opacity={0.85}>
        <Line x1="16" y1="2.5" x2="16" y2="5.5" />
        <Line x1="16" y1="26.5" x2="16" y2="29.5" />
        <Line x1="2.5" y1="16" x2="5.5" y2="16" />
        <Line x1="26.5" y1="16" x2="29.5" y2="16" />
        <Line x1="6.5" y1="6.5" x2="8.6" y2="8.6" />
        <Line x1="23.4" y1="23.4" x2="25.5" y2="25.5" />
        <Line x1="25.5" y1="6.5" x2="23.4" y2="8.6" />
        <Line x1="8.6" y1="23.4" x2="6.5" y2="25.5" />
      </G>
    </Svg>
  )
}
