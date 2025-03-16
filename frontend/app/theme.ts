import { extendTheme, type ThemeConfig } from '@chakra-ui/react';
import foundations from '../theme/foundations';
import { Button } from '../theme/components/button';
import { Heading } from '../theme/components/heading';
import { Text } from '../theme/components/text';
import { Link } from '../theme/components/link';

const config = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

const theme = extendTheme({
  ...config,
  ...foundations,
  fonts: {
    heading: "'Bungee',  sans-serif",
    body: "'Montserrat',  sans-serif",
  },
  sizes: {
    '4xs': '12rem',
    '5xs': '10rem',
  },
  styles: {
    global: {
      body: {
        color: 'dark.purple.100',
        bg: 'dark.purple.500',
      },
      html: {
        color: 'dark.purple.100',
        bg: 'dark.purple.500',
      },
      div: {
        bg: 'transparent',
      },
    },
  },
  components: {
    Heading,
    Button,
    Text,
    Link,
  },
});

export default theme;
