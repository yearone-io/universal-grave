const UNIVERSAL_PROFILES_NATIVE_PREFIX =
  'io.universaleverything.universalprofiles';

const UNIVERSAL_PROFILES_HOME_LINK = `${UNIVERSAL_PROFILES_NATIVE_PREFIX}://`;

/**
 * UP app WalletConnect link. `redirectUrl` is a top-level query param.
 * Putting it inside the `wc:` URI corrupts the pairing handshake.
 */
export function buildUpWalletConnectDeepLink(wcUri?: string | null): string {
  if (typeof wcUri !== 'string' || !wcUri.startsWith('wc:')) {
    return UNIVERSAL_PROFILES_HOME_LINK;
  }

  try {
    const dataUrl = new URL(wcUri);
    const deepLink = `${UNIVERSAL_PROFILES_NATIVE_PREFIX}://wallet-connect/${dataUrl.pathname}${dataUrl.search}`;
    if (typeof location === 'undefined') return deepLink;

    const redirectUrl = new URL(location.href);
    redirectUrl.searchParams.delete('modalTemplate');
    redirectUrl.searchParams.delete('modalSize');

    const deepLinkWithRedirect = new URL(deepLink);
    deepLinkWithRedirect.searchParams.append(
      'redirectUrl',
      `${redirectUrl.origin}${redirectUrl.pathname}${redirectUrl.search}`
    );
    return deepLinkWithRedirect.toString();
  } catch {
    return UNIVERSAL_PROFILES_HOME_LINK;
  }
}
