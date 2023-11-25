import { css } from '@emotion/react';

export const GlobalStyles = css`
  /*
  This will hide the focus indicator if the element receives focus via the mouse,
  but it will still show up on keyboard focus.
  */
  .js-focus-visible :focus:not([data-focus-visible-added]) {
    outline: none;
    box-shadow: none;
  }
  .bn-onboard-modal {
    z-index: 999;
  }
  a:focus:not(:focus-visible) {
    box-shadow: none;
  }
  button:focus:not(:focus-visible) {
    box-shadow: none;
  }
  textarea:focus:not(:focus-visible) {
    box-shadow: none;
  }
  input:focus:not(:focus-visible) {
    box-shadow: none;
  }
  select:focus:not(:focus-visible) {
    box-shadow: none;
  }
`;
