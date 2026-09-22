# Ledger signing sheet — handoff

An AirPods-style progressive sheet for hardware signing. The device drives it:
each panel appears because the Ledger reported that state, not because a timer
or a button said so.

Demo route: **`/ledger-demo`** (Chrome or Edge, localhost or https).

---

## Status: complete end to end

Connect → PIN → review → **signed**, all driven by the hardware. The signature
is real; it is produced by `eth.signTransaction` and comes back as r/s/v from
the device.

**The transaction is signed but not broadcast.** That is deliberate — the demo
needs no funded account and spends nothing, and the signature is equally real
either way. To actually send it, take the r/s/v, rebuild the signed RLP with
viem's `serializeTransaction(tx, signature)` and push it through any Sepolia RPC.

Two behaviours worth knowing before changing this code:

- `sign()` **stays pending** while the user reviews on the device. That await is
  the review step — it is what makes the "Review on your Ledger" panel literally
  true rather than a guess.
- **Rejection (`0x6985`) is handled as an answer, not an error.** The sheet
  returns to `review`, `rejected` goes true, and the evidence panel offers "Ask
  again". A refused signature is a legitimate outcome for this product and must
  stay visible.

The demo transaction is a **plain Sepolia ETH transfer** so that every field is
readable on the device screen and blind signing is not required. A contract call
(a real Aave repay) would need blind signing enabled on the device, or a clear
signing plugin — worth knowing before swapping the payload.

---

## Running it

From the repo root:

```bash
cd frontend
npm install          # picks up lottie-web + the two @ledgerhq packages
npm run dev
```

Then open **http://localhost:3000/ledger-demo** in **Chrome or Edge**.

If port 3000 is taken Next picks another and prints it — use whatever it says.
Any localhost port is a secure context, which is all WebHID needs.

### Before plugging in

1. **Quit Ledger Live.** It holds the device exclusively and the browser gets
   nothing while it runs. Far and away the most common cause of "it does not
   work".
2. **Install the Ethereum app** on the device (Ledger Live → My Ledger) if it is
   not already there.
3. Use a **data** USB cable — charge-only cables do not enumerate at all.

### Walking the flow

| You do | The page does |
|---|---|
| Click **Connect**, pick the device in Chrome's picker | permission granted, sheet leaves `connect` |
| Leave it locked | sheet sits on **Enter your PIN** |
| Enter the PIN | sheet moves to **Review**; address appears in the evidence panel |
| Open the Ethereum app, if it is not open | hint says so until it is |
| Approve on the device | sheet moves to **Signed**, signature `r` appears |
| Or press reject | back to review — *"Rejected. Nothing was signed."* + **Ask again** |

Chrome remembers the device after the first pick, so later reloads skip the
picker and go straight to reading state.

### Proving it is live

Pull the cable mid-flow: the sheet drops to `connect` within about a second and
returns when replugged. The address in the evidence panel is derived on the
device and can be read against the Ledger's own screen. Neither is something a
scripted sequence can do.

### If nothing happens

| Symptom | Cause |
|---|---|
| `WebHID: unsupported browser` | Firefox or Safari — use Chrome or Edge |
| Picker opens but lists nothing | charge-only cable, or not plugged in |
| `Device unavailable — is Ledger Live open?` | exactly that; quit it |
| Stuck on **Enter your PIN** after unlocking | Ethereum app is not frontmost on the device |
| Nothing at all after clicking Connect | permission needs the click itself; check the console |

---

## Files

| Path | What |
|---|---|
| `components/studio/ledger/LedgerSignSheet.tsx` | the sheet. Controlled, dumb, no device knowledge |
| `components/studio/ledger/useLedgerDevice.ts` | WebHID detection → emits `LedgerStep` |
| `public/ledger/{light,dark}/{pin,continue}.json` | Ledger's own Lottie animations |
| `public/ledger/LEDGER-LICENSE.txt` | MIT licence — must stay with the JSON |
| `public/styles/ledger-sheet.css` | styles. Own file, linked where used |
| `app/ledger-demo/` | demo harness. Delete once mounted for real |

Dependencies added: `lottie-web`, `@ledgerhq/hw-transport-webhid`,
`@ledgerhq/hw-app-eth`.

---

## How it fits together

The split is deliberate: **the sheet never learns a Ledger exists.**

```
useLedgerDevice()  ──emits──>  LedgerStep  ──renders──>  <LedgerSignSheet />
   (WebHID)                'connect'|'pin'|             (Lottie + layout)
                           'review'|'signed'
```

That means the sheet can be tested with any step source, and the detection can
be replaced (WebUSB, Bluetooth, a different wallet) without touching the UI.

```tsx
const device = useLedgerDevice(open);

// Hand the transaction over as soon as the Ethereum app is open.
useEffect(() => {
  if (device.step === 'review' && !device.rejected && !device.signature) {
    void device.sign(tx);          // resolves only after approval on the device
  }
}, [device.step, device.rejected, device.signature]);

<LedgerSignSheet
  open={open}
  step={device.step}
  onConnect={device.requestPermission}   // must be called from a real click
  onDismiss={() => setOpen(false)}
  agentName="guardian.treasury.ctxlock.eth"
  transaction={{ action, amount, to, network, withinPolicy }}
  signer={{ device, address, txHash }}
/>
```

`useLedgerDevice` returns `{ step, supported, device, address, signature,
rejected, hint, error, requestPermission, sign, reset }`.

There is no prop that can fake a transition. `onConnect` only asks for browser
permission; every later step comes from the hardware.

---

## How each state is detected

One `eth.getAddress()` call separates all of them — the error code says where
the user is.

| Step | Observed as |
|---|---|
| `connect` | no authorised device, or the cable is out |
| `pin` | device answers but refuses with `0x5515` (LOCKED_DEVICE) |
| `review` | Ethereum app open, returned an address derived on the device |
| `signed` | `signTransaction` returned r/s/v from the device |

Any non-`0x5515` error means the device answered but the Ethereum app is not
frontmost (dashboard, or another app), so the sheet stays on `pin` with a
different hint.

**Why both polling and events:** `connect`/`disconnect` fire instantly for the
cable, but entering a PIN on the device fires *no browser event at all* —
nothing happens over USB until you ask. Hence the 1.2s poll.

---

## Gotchas that will cost an hour each

1. **Chrome or Edge only.** WebHID does not exist in Firefox or Safari.
2. **Ledger Live must be closed.** It holds the device exclusively; the browser
   then gets nothing. Surfaces as *"Device unavailable — is Ledger Live open?"*
3. **Secure context required.** localhost counts, `file://` does not.
4. **Permission needs a real user gesture** — that is why `Connect` is a button.
   Chrome remembers the choice afterwards.
5. **Charge-only USB cables do not enumerate.** If nothing appears at all, try a
   different cable before debugging code.
6. **The Ethereum app must be installed** on the device via Ledger Live.
7. **Polling stands down during signing.** The poll and the signature share one
   HID pipe, and two conversations over it corrupts both. If you add another
   device call, it must respect the same `signing` guard.

---

## Animations

Ledger open-sources Ledger Live, and the device animations ship as Lottie JSON
under **MIT**:

```
LedgerHQ/ledger-live
  features/platform/device-action-content/src/animations/web/nanoSP/
```

So these are the same animations a user already sees in Ledger Live — which is
the point. The licence obliges keeping the copyright notice, which is why
`LEDGER-LICENSE.txt` sits beside the JSON and a credit line renders under the
sheet.

**Nano S Plus upstream only has `pin` and `continue`.** The older Nano S has a
fuller set (`OpenApp`, `QuitApp`, `AllowManager`, `Validate`) but those render a
Nano S, so they are wrong for a Nano S Plus demo. If an "open the Ethereum app"
panel is wanted, reuse `continue` rather than mixing device art.

Both `light` and `dark` are copied in; the `theme` prop picks which loads.

---

## Performance notes worth preserving

- `lottie-web` touches `document` on import, so it is behind a dynamic
  `import()` that only runs once the sheet opens. It never enters the server
  bundle, and a closed sheet costs nothing.
- Each animation is parsed **once** and held. Re-parsing 100KB on every step
  change is a visible stutter exactly when the sheet should feel smooth.
- Only the visible animation plays; the rest are paused. Four 60fps players
  behind `opacity:0` compete for the main thread.
- Panels are absolutely stacked so they can crossfade, which takes them out of
  flow — so the card's height is set explicitly from the active panel via
  `ResizeObserver`. Remove that and the card jumps between sizes and the whole
  effect dies.

---

## Demoing it

Plug in → **Connect** → pick the device in Chrome's picker → the sheet walks
itself as the PIN is entered and the Ethereum app opened.

The credibility move: **pull the cable mid-demo.** The sheet falls back to
`connect` within a second and returns when replugged. The address shown is
derived on the device and can be read aloud against the Ledger screen — neither
is something a scripted sequence can do.

The `/ledger-demo` page keeps a live "Read from the device" panel for exactly
this reason. Keep it visible when presenting.
