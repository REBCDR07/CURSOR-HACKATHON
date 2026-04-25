import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import { useEffect, useRef } from 'react';
import { BrandLogo } from './BrandLogo';
import { colors } from './UI';
import { fontFamilies } from '../theme/fonts';

export function LoadingScreen({ label = 'Chargement...' }: { label?: string }) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web',
      }),
    );

    loop.start();

    return () => {
      loop.stop();
      spin.stopAnimation();
    };
  }, [spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <BrandLogo size={96} />
      <Text style={styles.title}>HealthPocket</Text>

      <View style={styles.spinnerWrap}>
        <Animated.View style={[styles.spinner, { transform: [{ rotate }] }]} />
        <View style={styles.spinnerCore} />
      </View>

      <Text style={styles.label}>{label}</Text>
      <Text style={styles.hint}>Preparation de votre espace sante securise</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    gap: 12,
    paddingHorizontal: 24,
  },
  title: {
    color: colors.primary,
    fontSize: 34,
    fontFamily: fontFamilies.title,
    letterSpacing: 0.8,
  },
  spinnerWrap: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  spinner: {
    width: 58,
    height: 58,
    borderRadius: 999,
    borderWidth: 4,
    borderColor: '#d9dfe7',
    borderTopColor: colors.primary,
    borderRightColor: colors.accent,
  },
  spinnerCore: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    color: colors.muted,
    fontFamily: fontFamilies.subtitle,
    textAlign: 'center',
  },
  hint: {
    color: colors.muted,
    fontFamily: fontFamilies.body,
    textAlign: 'center',
    fontSize: 13,
  },
});
