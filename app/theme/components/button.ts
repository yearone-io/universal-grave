const solidPurpleVariant = {
  disabled: {
    bg: 'dark.purple.400',
    opacity: 0.6,
    border: 'none',
    boxShadow: 'none',
    color: 'dark.purple.200',
  },
  active: {
    bg: 'dark.purple.400',
    opacity: 0.8,
    boxShadow: '0px 0px 0px 1px var(--chakra-colors-dark-purple-400)',
    color: 'dark.purple.200',
  },
  focus: {
    bg: 'dark.purple.400',
    opacity: 0.85,
    boxShadow: '0px 0px 0px 1px var(--chakra-colors-dark-purple-400)',
    color: 'dark.purple.200',
  },
};

const solidPurple = {
  color: 'dark.purple.200',
  bg: 'dark.purple.400',
  border: '1px solid var(--chakra-colors-dark-purple-400)',
  _hover: {
    bg: 'dark.purple.400',
    opacity: 0.8,
    color: 'dark.purple.200',
    _disabled: solidPurpleVariant.disabled,
    _active: solidPurpleVariant.active,
    _focus: solidPurpleVariant.focus,
  },
  _disabled: {
    bg: 'dark.purple.400',
    opacity: 0.6,
    border: 'none',
    boxShadow: 'none',
    color: 'dark.purple.200',
    _active: {},
    _focus: {},
  },
  _active: solidPurpleVariant.active,
  _focus: solidPurpleVariant.focus,
};

const primaryDark = {
  bg: '#852FBB',
  color: 'white',
  _hover: {
    bg: '#9d46db',
    _disabled: {
      bg: '#852FBB',
    },
  },
  _active: {
    bg: '#7328a9',
  },
  _focus: {
    boxShadow: '0 0 0 3px rgba(255, 255, 255, 0.6)',
  },
  _disabled: {
    bg: '#852FBB',
    color: 'rgba(255, 255, 255, 0.4)',
  },
};

const transparentWhite = {
  color: 'white',
  bg: 'transparent',
  border: '1px solid white',
  _hover: {
    bg: 'transparent',
    opacity: 0.8,
    color: 'white',
    border: '1px solid white',
  },
  _disabled: {
    bg: 'transparent',
    opacity: 0.4,
    color: 'white',
    _active: {},
    _focus: {},
  },
  _active: {
    bg: 'transparent',
    opacity: 0.8,
    color: 'white',
  },
  _focus: {
    bg: 'transparent',
    opacity: 0.85,
    color: 'white',
    boxShadow: '0px 0px 0px 1px rgba(255, 255, 255, 0.5)',
  },
};

export const Button = {
  baseStyle: {
    fontWeight: 'bold',
    borderRadius: '100px',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: '0.7px',
    fontFamily: "'Bungee', sans-serif",
  },
  variants: {
    primaryDark,
    solidPurple: { ...solidPurple },
    solidWhite: {
      color: 'dark.purple.500',
      bg: 'dark.white',
      border: '1px solid var(--chakra-colors-dark-purple-500)',
      _hover: {
        bg: 'dark.white',
        opacity: 0.9,
        color: 'dark.purple.500',
      },
      _disabled: {
        bg: 'dark.white',
        opacity: 0.6,
        _active: {},
        _focus: {},
      },
      _active: {
        bg: 'dark.white',
        opacity: 0.8,
      },
      _focus: {
        bg: 'dark.white',
        opacity: 0.85,
      },
    },
    transparentWhite: { ...transparentWhite },
    transparentDark: {
      color: 'dark.purple.500',
      bg: 'transparent',
      border: '1px solid var(--chakra-colors-dark-purple-500)',
      _hover: {
        bg: 'transparent',
        opacity: 0.8,
        border: '1px solid var(--chakra-colors-dark-purple-500)',
        color: 'dark.purple.500',
      },
      _disabled: {
        bg: 'transparent',
        opacity: 0.4,
        _active: {},
        _focus: {},
      },
      _active: {
        bg: 'transparent',
        opacity: 0.8,
      },
      _focus: {
        bg: 'transparent',
        opacity: 0.85,
        boxShadow: '0px 0px 0px 1px var(--chakra-colors-dark-purple-500)',
      },
    },
  },
  defaultProps: {
    size: 'md',
    variant: 'primaryDark',
  },
};
