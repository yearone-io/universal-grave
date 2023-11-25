const solidLightVariant = {
  disabled: {
    bg: "light.gray.200",
    opacity: 0.6,
    border: "none",
    boxShadow: "none",
    color: "light.white",
  },
  active: {
    bg: "light.gray.300",
    opacity: 0.8,
    boxShadow: "0px 0px 0px 1px var(--chakra-colors-purple-darken10)",
    color: "white.darken10",
  },
  focus: {
    bg: "gray.100",
    opacity: 0.85,
    boxShadow: "0px 0px 0px 1px var(--chakra-colors-purple-darken5)",
    color: "white.darken5",
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
  color: "light.black",
  bg: "light.white",
  border: "1px solid var(--chakra-colors-light-black)",
  _hover: {
    bg: "light.gray.100",
    opacity: 0.9,
    color: "light.black",
    _disabled: solidLightVariant.disabled,
    _active: solidLightVariant.active,
    _focus: solidLightVariant.focus,
  },
  _disabled: {
    ...disabledStyles,
    _active: {},
    _focus: {},
  },
  _active: solidLightVariant.active,
  _focus: solidLightVariant.focus,
};

const solidPurpleVariant = {
  disabled: {
    bg: "dark.purple.400",
    opacity: 0.6,
    border: "none",
    boxShadow: "none",
    color: "dark.purple.200",
  },
  active: {
    bg: "dark.purple.400",
    opacity: 0.8,
    boxShadow: "0px 0px 0px 1px var(--chakra-colors-dark-purple-400)",
    color: "dark.purple.200",
  },
  focus: {
    bg: "dark.purple.400",
    opacity: 0.85,
    boxShadow: "0px 0px 0px 1px var(--chakra-colors-dark-purple-400)",
    color: "dark.purple.200",
  },
};

const solidPurple = {
  color: "dark.purple.200",
  bg: "dark.purple.400",
  border: "1px solid var(--chakra-colors-dark-purple-400)",
  _hover: {
    bg: "dark.purple.400",
    opacity: 0.8,
    color: "dark.purple.200",
    _disabled: solidPurpleVariant.disabled,
    _active: solidPurpleVariant.active,
    _focus: solidPurpleVariant.focus,
  },
  _disabled: {
    ...disabledStyles,
    _active: {},
    _focus: {},
  },
  _active: solidPurpleVariant.active,
  _focus: solidPurpleVariant.focus,
};

const primaryDark = {
  bg: "#852FBB",
  color: "white",
  _hover: {
    bg: "#9d46db",
    _disabled: {
      bg: "#852FBB",
    },
  },
  _active: {
    bg: "#7328a9",
  },
  _focus: {
    boxShadow: "0 0 0 3px rgba(255, 255, 255, 0.6)",
  },
  _disabled: {
    bg: "#852FBB",
    color: "rgba(255, 255, 255, 0.4)",
  },
};

const primaryLight = {
  bg: "#B3EDD7",
  color: "black",
  border: "1px solid black",
  _hover: {
    bg: "#90dbca",
    _disabled: {
      bg: "#B3EDD7",
    },
  },
  _active: {
    bg: "#79d6be",
  },
  _focus: {
    boxShadow: "0 0 0 3px rgba(0, 0, 0, 0.6)",
  },
  _disabled: {
    bg: "#B3EDD7",
    color: "rgba(0, 0, 0, 0.4)", // slightly transparent black
  },
};

const transparentLight = {
  color: "light.white",
  bg: "tranparent",
  border: "1px solid var(--chakra-colors-light-white)",
  _hover: {
    bg: "tranparent",
    opacity: 1,
    color: "light.white",
    border: "1px solid var(--chakra-colors-light-white)",
    _disabled: solidLightVariant.disabled,
    _active: {
      ...solidLightVariant.active,
      bg: "tranparent",
      opacity: 1,
      color: "light.white",
    },
    _focus: {
      ...solidLightVariant.focus,
      bg: "tranparent",
      opacity: 1,
      color: "light.white",
    },
  },
  _disabled: {
    ...disabledStyles,
    _active: {},
    _focus: {},
  },
  _active: {
    bg: "tranparent",
    opacity: 1,
    color: "light.white",
  },
  _focus: {
    bg: "tranparent",
    opacity: 1,
    color: "light.white",
  },
};

export const Button = {
  baseStyle: {
    fontWeight: "bold",
    borderRadius: "100px",
    color: "white",
    textTransform: "uppercase",
    letterSpacing: "0.7px",
    fontFamily: "'Bungee', sans-serif",
  },
  variants: {
    primaryLight,
    primaryDark,
    solidLight: { ...solidLight },
    solidPurple: { ...solidPurple },
    solidDark: {
      ...solidLight,
      border: "1px solid var(--chakra-colors-dark-purple-500)",
      color: "dark.purple.500",
    },
    transparentLightWhite: {
      ...transparentLight,
      border: "1px solid var(--chakra-colors-light-white)",
      bg: "transparent",
      color: "white",
    },
    transparentDark: {
      ...transparentLight,
      border: "1px solid var(--chakra-colors-dark-purple-500)",
      color: "dark.purple.500",
      bg: "transparent",
      _hover: {
        bg: "tranparent",
        opacity: 1,
        border: "1px solid var(--chakra-colors-dark-purple-500)",
        color: "dark.purple.500",
        _disabled: solidLightVariant.disabled,
        _active: {
          ...solidLightVariant.active,
          bg: "tranparent",
          opacity: 1,
          border: "1px solid var(--chakra-colors-dark-purple-500)",
          color: "dark.purple.500",
        },
        _focus: {
          ...solidLightVariant.focus,
          bg: "tranparent",
          opacity: 1,
          border: "1px solid var(--chakra-colors-dark-purple-500)",
          color: "dark.purple.500",
        },
      },
    },
  },
  defaultProps: {
    size: "md",
    variant: "solidLight",
  },
};
