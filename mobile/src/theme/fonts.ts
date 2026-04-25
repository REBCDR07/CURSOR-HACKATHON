import type { ComponentProps } from 'react';
import { Text, TextInput } from 'react-native';

export const fontFamilies = {
  title: 'BlackOpsOne_400Regular',
  subtitle: 'Oswald_600SemiBold',
  subtitleBold: 'Oswald_700Bold',
  body: 'Poppins_400Regular',
  bodyMedium: 'Poppins_500Medium',
  bodySemi: 'Poppins_600SemiBold',
  bodyBold: 'Poppins_700Bold',
} as const;

let typographyApplied = false;

type TextWithDefaults = typeof Text & {
  defaultProps?: Partial<ComponentProps<typeof Text>>;
};

type TextInputWithDefaults = typeof TextInput & {
  defaultProps?: Partial<ComponentProps<typeof TextInput>>;
};

export function applyGlobalTypographyDefaults() {
  if (typographyApplied) return;

  const textComponent = Text as TextWithDefaults;
  const textDefaults = textComponent.defaultProps ?? {};
  textComponent.defaultProps = {
    ...textDefaults,
    style: [{ fontFamily: fontFamilies.body }, textDefaults.style],
  };

  const textInputComponent = TextInput as TextInputWithDefaults;
  const inputDefaults = textInputComponent.defaultProps ?? {};
  textInputComponent.defaultProps = {
    ...inputDefaults,
    style: [{ fontFamily: fontFamilies.body }, inputDefaults.style],
  };

  typographyApplied = true;
}
