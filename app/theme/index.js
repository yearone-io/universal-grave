import { extendTheme, theme } from '@chakra-ui/react';
import foundations from './foundations';
import { Button } from './components/button';
import { Heading } from './components/heading';
import { Text } from './components/text';
import { Link } from './components/link';

const config = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

const overrides = extendTheme({
  config,
  ...foundations,
  fonts: {
    heading: "'Bungee',  sans-serif",
    body: "'Montserrat',  sans-serif",
  },
  sizes: {
    ...theme.sizes,
    '4xs': '12rem',
    '5xs': '10rem',
  },
  styles: {
    global: {
      'html, body': {
        fontSize: '16px',
        bg: 'dark.purple.500',
        color: 'dark.purple.100',
      },
      body: {
        bg: '#00001E',
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

export default extendTheme(overrides);
