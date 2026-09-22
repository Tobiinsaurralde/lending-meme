'use client';

/**
 * Live Ledger detection.
 *
 * Produces the same `LedgerStep` values <LedgerSignSheet> already renders, so
 * the sheet does not change at all — it simply stops being driven by buttons
 * and starts being driven by the device.
 *
 * How each state is actually observed, rather than assumed:
 *
 *   connect  no authorised device, or the cable is out
 *   pin      the device answers, but refuses with LOCKED_DEVICE (0x5515)
 *   review   the Ethereum app is open and returned a real address
 *   signed   a signature came back
 *
 * The address is the part that matters for a demo: a hardcoded flow cannot
 * produce an address derived on the device, and pulling the cable drops the
 * sheet back a step within a second. Both are hard to fake and easy to show.
 *
 * Chrome or Edge only — WebHID does not exist in Firefox or Safari — and the
 * page must be a secure context (localhost counts).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { LedgerStep } from './LedgerSignSheet';

/** Ledger's USB vendor id. Every model reports this one. */
const LEDGER_VENDOR_ID = 0x2c97;

/** Newer firmware encodes the model in the high byte; older reports it bare. */
const MODELS: Record<number, string> = {
  0x00: 'Ledger Blue',
  0x01: 'Nano S',
  0x04: 'Nano X',
  0x05: 'Nano S Plus',
  0x06: 'Stax',
  0x07: 'Flex',
};

function modelName(productId: number): string {
  return MODELS[productId >> 8] ?? MODELS[productId] ?? 'Ledger';
}

/** First account on the standard Ethereum path. */
const ETH_PATH = "44'/60'/0'/0/0";

/** Device is powered and answering, but the PIN has not been entered. */
const LOCKED = 0x5515;

/** The user pressed reject on the device. A legitimate outcome, not a fault. */
const REJECTED = 0x6985;

export interface LedgerState {
  step: LedgerStep;
  /** True when this browser can talk to HID at all. */
  supported: boolean;
  device: string | null;
  /** Derived on the device — the evidence that none of this is staged. */
  address: string | null;
  /** Human-readable reason the flow is not progressing, when it is not. */
  hint: string | null;
  error: string | null;
  /** Set when the user rejected on the device, so the UI can say so plainly. */
  rejected: boolean;
  /** The signature the device produced, once it has produced one. */
  signature: { r: string; s: string; v: string } | null;
}

const INITIAL: LedgerState = {
  step: 'connect',
  supported: true,
  device: null,
  address: null,
  hint: null,
  error: null,
  rejected: false,
  signature: null,
};

export function useLedgerDevice(enabled: boolean) {
  const [state, setState] = useState<LedgerState>(INITIAL);

  // Held across polls so a transport is opened once, not once per second.
  const transportRef = useRef<{ close: () => Promise<void> } | null>(null);
  const busy = useRef(false);
  const signed = useRef(false);
  /** True while a signature is in flight; polling must not interleave. */
  const signing = useRef(false);

  /** Ask the browser for permission. Must be called from a click. */
  const requestPermission = useCallback(async () => {
    if (!('hid' in navigator)) return;
    try {
      await (navigator as Navigator & { hid: HIDDevice2 }).hid.requestDevice({
        filters: [{ vendorId: LEDGER_VENDOR_ID }],
      });
    } catch (err) {
      setState((s) => ({ ...s, error: (err as Error).message }));
    }
  }, []);

  /**
   * Asks the device to sign, and waits.
   *
   * The await is the review step: `signTransaction` does not resolve until the
   * user has scrolled the transaction on the device and pressed approve, so the
   * sheet showing "Review on your Ledger" is telling the literal truth for as
   * long as this promise is pending.
   *
   * `tx` is a viem transaction request. It is serialised here rather than by
   * the caller so there is one place that decides what the device is shown.
   */
  const sign = useCallback(async (tx: UnsignedTx) => {
    if (!transportRef.current) {
      setState((s) => ({ ...s, error: 'No device connected.' }));
      return null;
    }

    // The poll also talks to the device. Two conversations over one HID pipe
    // corrupts both, so polling stands down for the duration.
    signing.current = true;
    setState((s) => ({ ...s, rejected: false, error: null, hint: 'Approve on the device.' }));

    try {
      const { serializeTransaction } = await import('viem');
      const { default: Eth } = await import('@ledgerhq/hw-app-eth');

      // Ledger wants the unsigned RLP without the 0x prefix.
      const serialized = serializeTransaction({ ...tx, type: 'eip1559' }).slice(2);

      const eth = new Eth(transportRef.current as never);
      const sig = await eth.signTransaction(ETH_PATH, serialized, null);

      signed.current = true;
      setState((s) => ({
        ...s,
        step: 'signed',
        hint: null,
        signature: { r: `0x${sig.r}`, s: `0x${sig.s}`, v: `0x${sig.v}` },
      }));
      return sig;
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === REJECTED) {
        // Rejection is a real answer. It must be visible, not swallowed.
        setState((s) => ({
          ...s,
          step: 'review',
          rejected: true,
          hint: 'Rejected on the device. Nothing was signed.',
        }));
      } else {
        setState((s) => ({ ...s, hint: null, error: (err as Error).message }));
      }
      return null;
    } finally {
      signing.current = false;
    }
  }, []);

  /**
   * Asks the device to sign EIP-712 typed data, and waits.
   *
   * This is the escalation path: the approval registry accepts a `ContextLockApproval` signature,
   * and the device shows the domain and every field before the user approves. Newer Ethereum apps
   * sign the structured message directly (clear signing); a Nano S, or an app that predates full
   * EIP-712, refuses with a status code and gets the hashed form instead — the same digest, so the
   * registry cannot tell the two apart, but the device screen then shows two hashes rather than
   * fields. Which path signed is reported so the panel can say so.
   *
   * Returns a 65-byte `0x…` signature (r ‖ s ‖ v) or null on rejection / failure.
   */
  const signTypedData = useCallback(async (typed: TypedDataForDevice): Promise<{ signature: `0x${string}`; clearSigned: boolean } | null> => {
    if (!transportRef.current) {
      setState((s) => ({ ...s, error: 'No device connected.' }));
      return null;
    }
    signing.current = true;
    setState((s) => ({ ...s, rejected: false, error: null, hint: 'Approve on the device.' }));
    try {
      const { default: Eth } = await import('@ledgerhq/hw-app-eth');
      const eth = new Eth(transportRef.current as never);
      const message = {
        domain: typed.domain,
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
          ],
          ...typed.types,
        },
        primaryType: typed.primaryType,
        message: typed.message,
      };
      let sig: { r: string; s: string; v: number };
      let clearSigned = true;
      try {
        sig = await eth.signEIP712Message(ETH_PATH, message as never);
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === REJECTED) throw err;
        // Anything else is the app declining structured 712 (Nano S, or an older app): fall back to
        // the hashed form, which every Ethereum app since 1.6 signs.
        const { hashDomain, hashStruct } = await import('viem');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const domainSeparator = (hashDomain as any)({ domain: typed.domain, types: message.types }).slice(2) as string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const structHash = (hashStruct as any)({ data: typed.message, primaryType: typed.primaryType, types: typed.types }).slice(2) as string;
        clearSigned = false;
        setState((s) => ({ ...s, hint: 'This app signs the EIP-712 hashes: compare the domain and message hash shown on the device.' }));
        sig = await eth.signEIP712HashedMessage(ETH_PATH, domainSeparator, structHash);
      }
      const v = (sig.v < 27 ? sig.v + 27 : sig.v).toString(16).padStart(2, '0');
      const signature = `0x${sig.r}${sig.s}${v}` as `0x${string}`;
      signed.current = true;
      setState((s) => ({ ...s, step: 'signed', hint: null, signature: { r: `0x${sig.r}`, s: `0x${sig.s}`, v: `0x${v}` } }));
      return { signature, clearSigned };
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === REJECTED) {
        setState((s) => ({ ...s, step: 'review', rejected: true, hint: 'Rejected on the device. Nothing was signed.' }));
      } else {
        setState((s) => ({ ...s, hint: null, error: (err as Error).message }));
      }
      return null;
    } finally {
      signing.current = false;
    }
  }, []);

  /** Back to `review` so another message can be signed on the same connection. */
  const rearm = useCallback(() => {
    signed.current = false;
    setState((s) => ({ ...s, step: s.address ? 'review' : s.step, rejected: false, signature: null, hint: null, error: null }));
  }, []);

  const reset = useCallback(() => {
    signed.current = false;
    signing.current = false;
    setState((s) => ({ ...s, step: 'connect', rejected: false, signature: null, hint: null, error: null }));
  }, []);

  useEffect(() => {
    if (!enabled) return;

    if (typeof navigator === 'undefined' || !('hid' in navigator)) {
      setState((s) => ({ ...s, supported: false, hint: 'WebHID needs Chrome or Edge over https or localhost.' }));
      return;
    }

    let alive = true;
    let timer: number | undefined;

    const closeTransport = async () => {
      try { await transportRef.current?.close(); } catch { /* already gone */ }
      transportRef.current = null;
    };

    async function poll() {
      // Polls overlap if the device is slow to answer; skip rather than queue.
      if (!alive || busy.current || signed.current || signing.current) return;
      busy.current = true;

      try {
        const hid = (navigator as Navigator & { hid: HIDDevice2 }).hid;
        const devices = (await hid.getDevices()).filter((d) => d.vendorId === LEDGER_VENDOR_ID);

        if (devices.length === 0) {
          await closeTransport();
          setState((s) => ({
            ...s,
            step: 'connect',
            device: null,
            address: null,
            hint: 'No Ledger authorised yet.',
          }));
          return;
        }

        const name = modelName(devices[0].productId);

        if (!transportRef.current) {
          const { default: TransportWebHID } = await import('@ledgerhq/hw-transport-webhid');
          transportRef.current = await TransportWebHID.create();
        }

        const { default: Eth } = await import('@ledgerhq/hw-app-eth');
        const eth = new Eth(transportRef.current as never);

        try {
          // The one call that distinguishes every remaining state.
          const { address } = await eth.getAddress(ETH_PATH, false);
          setState((s) => ({ ...s, step: 'review', device: name, address, hint: null, error: null }));
        } catch (err) {
          const status = (err as { statusCode?: number }).statusCode;
          if (status === LOCKED) {
            setState((s) => ({ ...s, step: 'pin', device: name, address: null, hint: 'Enter your PIN on the device.' }));
          } else {
            // Any other status means it answered but the Ethereum app is not
            // frontmost — the dashboard, or a different app.
            setState((s) => ({
              ...s,
              step: 'pin',
              device: name,
              address: null,
              hint: 'Open the Ethereum app on the device.',
            }));
          }
        }
      } catch (err) {
        // The cable came out mid-call, or Ledger Live grabbed the device.
        await closeTransport();
        setState((s) => ({
          ...s,
          step: 'connect',
          address: null,
          hint: 'Device unavailable — is Ledger Live open?',
          error: (err as Error).message,
        }));
      } finally {
        busy.current = false;
      }
    }

    // Events give an instant reaction to the cable; the poll catches everything
    // the device does on its own screen, which fires no event at all.
    const onChange = () => void poll();
    const hid = (navigator as Navigator & { hid: HIDDevice2 }).hid;
    hid.addEventListener('connect', onChange);
    hid.addEventListener('disconnect', onChange);

    void poll();
    timer = window.setInterval(poll, 1200);

    return () => {
      alive = false;
      if (timer) window.clearInterval(timer);
      hid.removeEventListener('connect', onChange);
      hid.removeEventListener('disconnect', onChange);
      void closeTransport();
    };
  }, [enabled]);

  return { ...state, requestPermission, sign, signTypedData, rearm, reset };
}

/** EIP-712 typed data as the device wants it: the domain, the struct types (without EIP712Domain), one message. */
export interface TypedDataForDevice {
  domain: { name: string; version: string; chainId: number; verifyingContract: string };
  types: Record<string, Array<{ name: string; type: string }>>;
  primaryType: string;
  message: Record<string, string | number>;
}

/** The fields the device is asked to display and sign. */
export interface UnsignedTx {
  chainId: number;
  nonce: number;
  to: `0x${string}`;
  value: bigint;
  gas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  data?: `0x${string}`;
}

/* Minimal shape of the WebHID API; TS does not ship these lib types yet. */
interface HIDDevice2 {
  getDevices(): Promise<{ vendorId: number; productId: number; productName?: string }[]>;
  requestDevice(options: { filters: { vendorId: number }[] }): Promise<unknown[]>;
  addEventListener(type: 'connect' | 'disconnect', cb: () => void): void;
  removeEventListener(type: 'connect' | 'disconnect', cb: () => void): void;
}
