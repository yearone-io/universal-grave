const solidWhitePurple = {
  color: 'dark.purple.500',
  _hover: {
    bg: 'dark.white',
    opacity: 0.9,
    color: 'dark.purple.500',
    textDecoration: 'none',
  },
  _disabled: {
    bg: 'dark.white',
    opacity: 0.6,
    color: 'dark.purple.500',
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
    solidWhite: { ...solidWhitePurple },
  },
  defaultProps: {
    size: 'md',
    variant: 'solidWhite',
  },
};
