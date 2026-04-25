import type { StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

export function BrandLogo({ size = 88, style }: { size?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ width: size, maxWidth: '100%', aspectRatio: 1 }, style]}>
      <Svg width="100%" height="100%" viewBox="0 0 512 512" fill="none">
        <Defs>
          <LinearGradient id="bgGrad" x1="64" y1="64" x2="448" y2="448" gradientUnits="userSpaceOnUse">
            <Stop stopColor="#1B4332" />
            <Stop offset="1" stopColor="#0E2A1F" />
          </LinearGradient>
          <LinearGradient id="accentGrad" x1="256" y1="176" x2="256" y2="336" gradientUnits="userSpaceOnUse">
            <Stop stopColor="#F59E0B" />
            <Stop offset="1" stopColor="#D97706" />
          </LinearGradient>
        </Defs>

        <Rect x="32" y="32" width="448" height="448" rx="120" fill="url(#bgGrad)" />
        <Path
          d="M256 108C302 144 345 150 380 150V246C380 326 327 395 256 418C185 395 132 326 132 246V150C167 150 210 144 256 108Z"
          fill="#F8FAFC"
        />
        <Path
          d="M256 196C280 172 317 176 336 198C355 220 355 255 336 277L256 350L176 277C157 255 157 220 176 198C195 176 232 172 256 196Z"
          fill="url(#accentGrad)"
        />
        <Rect x="244" y="218" width="24" height="94" rx="8" fill="#FFFFFF" />
        <Rect x="210" y="252" width="92" height="24" rx="8" fill="#FFFFFF" />
      </Svg>
    </View>
  );
}
