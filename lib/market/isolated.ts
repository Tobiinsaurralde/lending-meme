export const ISOLATED_KEY = 'bagfi.isolated.v1';
export const EXTRAS_KEY = 'bagfi.extras.v1';

export interface IsolatedDeployment {
  factory: `0x${string}`;
  quote: `0x${string}`;
  router: `0x${string}`;
}

/** Markets deployed from the owner wallet on 24 Sep 2026. */
export const LIVE_ISOLATED: IsolatedDeployment = {
  factory: '0xF35E497b1498375cFE76D0321731349C190da92b',
  quote: '0x9A3B73FeDed7a0d8E7FE71A8Ea269b060B63737d',
  router: '0x69f9e0745647C71d95A10327300f848D9e36F82b',
};

export interface ExtrasDeployment {
  flash: `0x${string}`;
  nft: `0x${string}`;
  vault: `0x${string}`;
  ballot: `0x${string}`;
  buyer: `0x${string}`;
}
