import { developerInboxAbi, developerInboxBytecode } from '@/lib/market/developerInboxArtifact';

/** Owner wallet that reviews token requests and opens markets. */
export const BAGFI_OWNER = '0xA4d36d0D15E0B36544Ad536DcA518e1Ff0Df0d96' as const;

/** This browser remembers a desk deployed before the env address is published. */
export const INBOX_STORAGE = 'bagfi.developerInbox.v1';

/** DeveloperInbox deployed by the owner wallet on 27 Sep 2026. */
export const LIVE_DEVELOPER_INBOX = '0x2871504f88ce7e29cf023966e76d80ba66af2420' as const;

const raw = process.env.NEXT_PUBLIC_DEVELOPER_INBOX ?? '';

export const DEVELOPER_INBOX: `0x${string}` =
  /^0x[0-9a-fA-F]{40}$/.test(raw) && !/^0x0{40}$/i.test(raw) ? (raw as `0x${string}`) : LIVE_DEVELOPER_INBOX;

export { developerInboxAbi, developerInboxBytecode };
