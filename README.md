# Jura Connect for Homey

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/woutvanderaa)

Control your Jura coffee machine from Homey: brew drinks, see alarms for water, beans and the tray,
and follow the cleaning, filter and descaling status. It needs Jura's WiFi Connect dongle and talks
to it directly over your home network. Fully local: no cloud, no Jura account.

> This app is not made by, affiliated with, or endorsed by Jura Elektroapparate AG. "Jura" is a
> trademark of Jura Elektroapparate AG; this app is an independent, community-driven project.

## Install

You need a Jura machine with the WiFi Connect dongle, already set up on your network with Jura's
J.O.E. app.

- Live version (0.13.1): **https://homey.app/a/nl.brokebyte.juraconnect/**
- Test version (0.15.x, has the newest features): **https://homey.app/a/nl.brokebyte.juraconnect/test/**

This README describes the test version. Not in the live version yet, among other things:

- The "Machine became ready to brew" trigger, the "Machine is / isn't ready to brew" condition and
  the "Cleaning finished" and "Descaling finished" triggers
- The brew series cards: "Brew a product several times", "Stop the brew series" and "A brew series
  ended", and the amount in ml on the brew cards
- The "Brew 2x espresso" and "Brew 2x coffee" buttons
- The brew checks and their setting, "Do not brew while the machine reports an alarm"
- Homey's own "Turned on", "Turned off" and "Is turned on" cards, and the C3 as a confirmed model

## Supported models

All 72 models in the J.O.E. app's catalogue are included. Confirmed on real hardware so far:

| Model | Profile | Verified | Source |
|---|---|---|---|
| E8 (EB) | EF538 | Full: pairing, status, brewing, maintenance percentages, alarms | My own machine |
| ENA 4 (EA) | EF1013 | Pairing with the model picked by hand, status, coffee, espresso, water alarm, tray-missing alarm | [GitHub issue #1](https://github.com/WoutvanderAa/homey-jura-connect/issues/1) |
| C3 (EA) | EF1089 | Pairing, status, brewing, water, beans, tray full and tray missing alarms, maintenance percentages | [GitHub issue #5](https://github.com/WoutvanderAa/homey-jura-connect/issues/5) |
| S8 (NAB) | EF1151 | Pairing only, with a security PIN | [GitHub issue #4](https://github.com/WoutvanderAa/homey-jura-connect/issues/4) |
| E8 (EC) | EF1092 | Alarms | [Homey forum](https://community.homey.app/t/158080) |

Only the E8 (EB), the ENA 4 and the C3 appear without the label "experimental, untested" in the
pairing and settings picker. The other models still show it.

Tell us if it works on your model, or not: use the
[Model verification report](https://github.com/WoutvanderAa/homey-jura-connect/issues/new?template=model_verification.yml).
That is how a model becomes verified.

The Z10 (EB), Z10 (EC), S10 (EA) and E10 (EA) can brew coffee and espresso since 0.13.1, untested so far.

## Pairing

1. Switch the machine on and close the J.O.E. app: the dongle only accepts one connection at a time.
2. In Homey, add a device and choose Jura Connect. Tap your machine in the scan list. Under each
   machine's name you see its address, firmware, article number (art.), hardware code (hwId) and the
   model the app recognised. Not listed, for example on another VLAN? Type its IP address under the
   list.
3. Model not recognised, or you typed the IP address? Pick the closest model on the next screen; you
   can change it later in the device settings. Model missing? See
   [Reporting a problem](#reporting-a-problem).

While it connects, two things can come up:

- The machine shows a "Connect" prompt on its display. Confirm it there within about a minute
  (usually OK or the checkmark, on some models the bean button). Missed it? Tap "Try again".
- If you set a PIN in the J.O.E. app, enter it. It is hidden while you type; if the machine refuses
  it, you can try again.

## Features

What you see on the device tile:

| On the tile | What it shows |
|---|---|
| On/off | On or off, read-only. It follows the machine |
| Needs attention | A real fault (heating up, switching off and the machine's own settings menu do not count) |
| Water alarm, Beans | Water tank empty, out of beans |
| Tray full, Tray removed | Drip tray or grounds container full, drip tray not inserted |
| Outlet missing, Rear cover missing | Coffee spout not attached, rear access panel not attached |
| Cleaning due, Filter due, Descale due | Percent until due, higher = sooner |
| Brew coffee, Brew espresso, Brew hot water | Quick-brew buttons (hot water only on machines that have it) |
| Brew 2x espresso, Brew 2x coffee | Only on machines that have both ([details](docs/flow-cards.md#2x-buttons)) |

Flow cards (details in [docs/flow-cards.md](docs/flow-cards.md)):

- "Brew a product" (action): any product your machine has, with an optional strength and an optional
  amount in ml.
- "Brew a product several times" (action): 1 to 10 cups, one by one. "Stop the brew series" (action)
  and "A brew series ended" (trigger) go with it.
- "Machine became ready to brew" (trigger) and "Machine is / isn't ready to brew" (condition). The
  trigger also fires after every cup of a series, up to 10 times. Do not start a series from it or
  from "A brew series ended": that loops.
- "Cleaning finished" and "Descaling finished" (triggers).
- A trigger and a condition for each alarm, and "crossed above X%" (trigger) and "is above X%"
  (condition) for each maintenance type.

## Settings

Details: [docs/flow-cards.md](docs/flow-cards.md#settings).

- Coffee, Espresso and Hot water (ml): 0 uses the machine's own default.
- Coffee and Espresso strength: the level number your machine shows. 0 uses the profile's default.
- "Do not brew while the machine reports an alarm" (on by default): turn it off if a brew is refused
  while the machine itself can brew.
- Machine IP address: filled in at pairing. Change it if your router gave the machine a new address.
- Statistics: total brews and the maintenance percentages, read-only.

## Known limitations

- After the machine's own auto-off timer kicks in, the dongle is unreachable too and cannot be woken
  remotely. Switch the machine on.
- Remote on/off is not possible: the dongle ignores that command, so the tile toggle and Homey's own
  cards for switching it on and off are refused with a message.
- By default a brew is not sent while the machine is busy, needs attention, is not ready yet or is
  switching off. The tile or flow card says why, see [docs/flow-cards.md](docs/flow-cards.md#brew-checks).
- A brew that is already running cannot be aborted from Homey. "Stop the brew series" only stops the
  cups that follow.
- The dongle accepts one connection at a time, so Jura's J.O.E. app cannot connect while Homey is connected.
- More limits: [docs/flow-cards.md](docs/flow-cards.md#limits).

## LAN security

The Jura WiFi protocol lets anyone on the same network replay the handshake and read the PIN when it
is sent. A fake machine on the network could also ask Jura Connect for the PIN. This is how Jura's
protocol works, and the app cannot change it.

Keep the machine on a network you trust, and never forward port 51515 to the internet.

## Reporting a problem

Use the GitHub issue templates: bug report, feature request, model request (your machine is not in
the list yet), or model verification. Including a Homey diagnostics report ID helps a lot.

The model forms ask for the firmware, article number (art.) and hwId. You find them under each
machine on the Homey pairing screen (already paired? Add the device again and stop at the list).
Copy only those three, not the address. Added by IP address? Write "not found" for the hwId in the [Model request form](https://github.com/WoutvanderAa/homey-jura-connect/issues/new?template=model_request.yml)
and leave it empty in the model verification form.

Please do not post your PIN, your WiFi password or your IP address.

## Credits

JavaScript port of **[`jura_connect`](https://github.com/makefu/jura-connect)** (PyPI package `jura-connect`) by
**makefu**, and by extension of the J.O.E. Android app it was itself derived from. The Home Assistant
integration **[`jura-connect-hass`](https://github.com/makefu/jura-connect-hass)** is by the same author.

App Store banner photo: a real Jura Z8 brewing coffee, by **coffee-rank**
([source](https://www.flickr.com/photos/189612330@N06/50330277776)), licensed
[CC BY 2.0](https://creativecommons.org/licenses/by/2.0/), cropped from the original.

## Development

A Homey app (SDK v3) that talks to the dongle over TCP port 51515. Validate with
`npx homey app validate --level publish`, run with `npx homey app run --remote` (without `--remote`,
the CLI asks for Docker). No dependencies. `lib/`: protocol layer (crypto, framing, discovery) and
the bundled per-model profiles. `drivers/jura-machine/`: the driver, device, and pairing views.

## License

MIT, see `LICENSE`.
