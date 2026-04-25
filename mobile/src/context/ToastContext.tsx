import { Ionicons } from '@expo/vector-icons';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../components/UI';
import { registerToastHandler, type ToastOptions, type ToastTone } from '../lib/toast';
import { fontFamilies } from '../theme/fonts';

interface ToastContextValue {
  showToast: (message: string, options?: ToastOptions) => void;
}

interface ToastState {
  message: string;
  tone: ToastTone;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toneMeta: Record<ToastTone, { icon: keyof typeof Ionicons.glyphMap; bg: string; border: string; fg: string }> = {
  success: {
    icon: 'checkmark-circle-outline',
    bg: '#ecfdf3',
    border: '#86efac',
    fg: '#166534',
  },
  error: {
    icon: 'alert-circle-outline',
    bg: '#fef2f2',
    border: '#fca5a5',
    fg: '#991b1b',
  },
  warning: {
    icon: 'warning-outline',
    bg: '#fffbeb',
    border: '#fcd34d',
    fg: '#92400e',
  },
  info: {
    icon: 'information-circle-outline',
    bg: '#eff6ff',
    border: '#93c5fd',
    fg: '#1d4ed8',
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState | null>(null);

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (!timeoutRef.current) return;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 140,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -16,
        duration: 140,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setToast(null);
      }
    });
  }, [opacity, translateY]);

  const showToast = useCallback(
    (message: string, options?: ToastOptions) => {
      const cleaned = message.trim();
      if (!cleaned) return;

      clearTimer();

      const tone = options?.tone ?? 'info';
      const durationMs = Math.max(1200, options?.durationMs ?? 2500);

      setToast({ message: cleaned, tone });
      opacity.setValue(0);
      translateY.setValue(-20);

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 170,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 170,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();

      timeoutRef.current = setTimeout(() => {
        hideToast();
      }, durationMs);
    },
    [clearTimer, hideToast, opacity, translateY],
  );

  useEffect(() => {
    registerToastHandler(showToast);
    return () => {
      registerToastHandler(null);
      clearTimer();
    };
  }, [clearTimer, showToast]);

  const value = useMemo<ToastContextValue>(() => ({ showToast }), [showToast]);
  const tone = toast ? toneMeta[toast.tone] : null;

  return (
    <ToastContext.Provider value={value}>
      {children}

      {toast && tone ? (
        <View pointerEvents="none" style={[styles.overlay, { top: Math.max(insets.top + 8, 14) }]}>
          <Animated.View
            style={[
              styles.toast,
              {
                opacity,
                transform: [{ translateY }],
                backgroundColor: tone.bg,
                borderColor: tone.border,
              },
            ]}
          >
            <Ionicons name={tone.icon} size={16} color={tone.fg} />
            <Text style={[styles.toastText, { color: tone.fg }]}>{toast.message}</Text>
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
    paddingHorizontal: 12,
  },
  toast: {
    width: '100%',
    maxWidth: 680,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  toastText: {
    flex: 1,
    minWidth: 0,
    fontFamily: fontFamilies.bodySemi,
    fontSize: 13,
  },
});
