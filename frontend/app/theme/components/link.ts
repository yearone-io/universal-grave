// --chakra-colors-gray-100
const solidLightVariant = {
  disabled: {
    bg: 'light.gray.200',
    opacity: 0.6,
    border: 'none',
    boxShadow: 'none',
    color: 'light.white',
  },
  active: {
    bg: 'light.gray.300',
    opacity: 0.8,
    boxShadow: '0px 0px 0px 1px var(--chakra-colors-purple-darken10)',
    color: 'white.darken10',
  },
  focus: {
    bg: 'gray.100',
    opacity: 0.85,
    boxShadow: '0px 0px 0px 1px var(--chakra-colors-purple-darken5)',
    color: 'white.darken5',
  },
};

const disabledStyles = {
  ...solidLightVariant.disabled,
  _hover: {
    ...solidLightVariant.disabled,
    _disabled: { ...solidLightVariant.disabled },
    _active: solidLightVariant.disabled,
    _focus: solidLightVariant.disabled,
  },
  _disabled: { ...solidLightVariant.disabled },
  _active: solidLightVariant.disabled,
  _focus: solidLightVariant.disabled,
};

const solidLight = {
  color: 'light.black',
  bg: 'light.white',
  border: '1px solid var(--chakra-colors-light-black)',
  _hover: {
    bg: 'light.gray.100',
    opacity: 0.9,
    color: 'light.black',
    _disabled: solidLightVariant.disabled,
    _active: solidLightVariant.active,
    _focus: solidLightVariant.focus,
    textDecoration: 'none',
  },
  _disabled: {
    ...disabledStyles,
    _active: {},
    _focus: {},
  },
  _active: solidLightVariant.active,
  _focus: solidLightVariant.focus,
};

export const Link = {
  baseStyle: {
    fontWeight: 'bold',
    borderRadius: '100px',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    padding: '4px 16px',
  },
  variants: {
    solidLight: { ...solidLight },
    solidDark: {
      ...solidLight,
      border: '1px solid var(--chakra-colors-dark-purple-500)',
      color: 'dark.purple.500',
    },
  },
  defaultProps: {
    size: 'md',
    variant: 'solidLightVariant',
  },
};
