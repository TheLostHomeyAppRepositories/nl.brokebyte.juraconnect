# Jura Connect for Homey

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/woutvanderaa)

A Homey app (SDK v3) for Jura coffee machines fitted with the WiFi Connect
module, talking directly to the dongle over TCP port 51515. Fully local:
no cloud, no Jura account.

> This app is not made by, affiliated with, or endorsed by Jura
> Elektroapparate AG. "Jura" is a trademark of Jura Elektroapparate AG;
> this app is an independent, community-driven project.

## Install

Available on the Homey App Store:
**https://homey.app/a/nl.brokebyte.juraconnect/**

Requirement: the WiFi Connect dongle must already be paired to your
network via the J.O.E. app.

## Supported models

All 72 models from the J.O.E. app's own catalogue are bundled, one
profile per EF code. Confirmed on real hardware so far:

| Model | Profile | Verified | Source |
|---|---|---|---|
| E8 (EB) | EF538 | Full: pairing, status, brewing, maintenance percentages, alarms | My own machine |
| ENA 4 (EA) | EF1013 | Pairing, coffee, espresso, water alarm, tray-missing alarm | [GitHub issue #1](https://github.com/WoutvanderAa/homey-jura-connect/issues/1) |
| S8 (NAB) | EF1151 | Pairing only, with a security PIN | [GitHub issue #4](https://github.com/WoutvanderAa/homey-jura-connect/issues/4) |
| E8 (EC) | EF1092 | Alarms | [Homey forum](https://community.homey.app/t/158080) |

Only the fully confirmed models above, currently the E8 (EF538) and
the ENA 4 (EF1013), appear in the app without the "experimental,
untested" label; the S8 and E8 EC still show it, since only pairing
or alarms have been confirmed on those two so far.

Every other bundled model shows as "experimental, untested" in the
pairing and settings picker. Does it work on your model, or not?
Report it via the [Model verification report](https://github.com/WoutvanderAa/homey-jura-connect/issues/new?template=model_verification.yml)
issue template, that's how a model gets flipped to verified.

Coffee and espresso can be brewed on the Z10 (EB), Z10 (EC), S10 (EA)
and E10 (EA) from version 0.13.1. Before that, these drinks could not
be brewed on those four models at all. It has not been tried on a real
machine yet, so the four stay experimental. If you own one, please
brew a coffee or an espresso and send the result with the model
verification report. A report that it does not work helps just as much.

On the E4 (EF1031), the "Brew a product" card also offers "2x Espresso"
and "2x Coffee" from version 0.14.0. The machine data of that model
marks them as inactive, so they were never offered before. They have
not been confirmed on a real E4 yet; a report helps here too.
"2x Espresso" has since been brewed on a real E4 through the "Brew a
product" card (one brew with two cycles). "2x Coffee" is still not
confirmed on a real E4. The 2x buttons (see Features) follow for the E4
once both are confirmed. The 2x products of the E4 have no strength
setting in Jura's data, so the machine uses its own default strength.

## Pairing

1. Switch the machine on and close the J.O.E. app if it is connected.
   The dongle only accepts one connection at a time.
2. In Homey, add a device and choose Jura Connect. The app scans your
   network and lists each machine it finds. Under the name is a line
   with the address, firmware, article number (art.) and hardware code
   (hwId), and under that the model the app made of it. Tap your
   machine. If it is not listed (for example on another VLAN), type
   its IP address in the field under the list.
3. If that line says "Model not recognised: you pick it on the next
   screen", or you typed the IP address, you pick your model from a
   list on the next screen. Choose the closest match, you can correct
   it later in the device settings. Is your model missing? See
   [Reporting a problem](#reporting-a-problem).

While it connects, two things can come up:

- The machine shows a "Connect" prompt on its own display. Confirm it
  there within about a minute (usually OK or the checkmark, on some
  models the bean button). If you miss it, the app shows an error and
  a "Try again" button.
- If you set a PIN in the J.O.E. app, the app asks for it. It is
  hidden while you type. If the machine refuses it, the app says so
  and you can try again.

## Features

| Capability | What it shows |
|---|---|
| `onoff` | On/off state, read-only. It follows the machine being switched off and on, so Homey's own "Turned off", "Turned on" and "Is turned on" cards work |
| `alarm_generic` | Needs attention (a real fault; normal states such as heating up, switching off or the machine's own settings menu do not count) |
| `alarm_water` | Water tank empty |
| `alarm_beans` | Out of beans |
| `alarm_tray` | Drip tray or grounds container full |
| `alarm_tray_missing` | Drip tray not inserted |
| `alarm_outlet_missing` | Coffee spout not attached |
| `alarm_rear_cover_missing` | Rear access panel not attached |
| `jura_maintenance_cleaning` / `_filter` / `_descale` | Percent until due, higher = sooner |
| `brew_coffee_button` / `brew_espresso_button` | Quick-brew buttons on the device tile |
| `brew_hotwater_button` | Same, only added on machines that actually have this product |
| `brew_espresso_double_button` / `brew_coffee_double_button` | "Brew 2x espresso" and "Brew 2x coffee", only added on machines whose data has an active 2-cup espresso and 2-cup coffee (44 of the bundled models; not yet the E4, see the E4 note). They brew the machine's own 2-cup product at its default amount; the Coffee and Espresso amount and strength settings do not apply. Paired devices get them at the first start of 0.15.0. They are only removed when the machine model in the settings changes |

Flow cards: a "Brew a product" action covering any product your
specific machine has, with an optional strength and an optional amount
in ml; a trigger and a condition for each alarm above; and a "crossed
above X%" trigger plus an "is above X%" condition for each maintenance
type. "Total brews" and the maintenance percentages are available in
the device settings, under Statistics.

Since 0.14.0 there are also:

- "Machine became ready to brew" (trigger) and "Machine is / isn't
  ready to brew" (condition). The machine counts as ready when it is
  connected, a fresh status shows "coffee ready", no alarm and no busy
  state (a drink, a rinse, heating up, switching off) is showing, and
  that has been so for 4 seconds in a row. The trigger fires once each
  time the machine becomes ready after it was seen not ready: after a
  drink or a rinse, a solved alarm, or switching it on. It does not
  fire when the app or Homey starts, and a model that does not report
  "coffee ready" is never ready. The machine's own settings menu and
  the display lock are not counted as an alarm or a busy state here.
  A flow on this trigger that brews makes the machine busy and then
  ready again, so the trigger fires again after that drink: "When
  Machine became ready to brew, brew a coffee" keeps brewing one cup
  after another. To brew a set number of cups, count them in a number
  variable and brew only while it is above 0.
- "Cleaning finished" and "Descaling finished" (triggers). They fire
  once when the machine resets its cleaning or descaling percentage
  after the programme, usually shortly after it ends. If Homey was not
  connected then, they fire as soon as the app reads the machine
  again. There is no such card for the filter.
- None of these three triggers has tokens.
- The `onoff` capability goes to off when the machine is switched
  off, just before the tile becomes unavailable, and back to on as
  soon as the machine answers again. A connection that is lost
  without the machine announcing that it is switching off leaves it
  as it is. That is what makes Homey's own "Turned off", "Turned on"
  and "Is turned on" cards work. Switching the machine on or off from
  Homey (the toggle on the tile, or Homey's own cards for switching on
  and off) is still refused with a message: the dongle ignores that
  command, see Known limitations.

Since 0.15.0 there are also:

- "Brew a product several times" (action): a product, 1 to 5 cups,
  an optional strength and an optional amount in ml (the same for every
  cup). The card is done once the machine accepts the
  first cup. The app brews each next cup once the previous cup was seen
  and the machine is ready to brew again (the same rule as the ready
  trigger, on two checks in a row). There is no pause in between, so the
  cups go into whatever is under the spout. The series stops when the
  machine needs attention or switches off, when a cup is not seen or
  the machine is not ready again within 4 minutes after it accepted a
  cup, when a brew command fails, on the stop card, on a change of the
  connection settings, and when the app or Homey restarts (the
  remaining cups are not brewed later). A model that does not report
  "coffee ready" gets only the first cup.
- "Stop the brew series" (action): stops the series after the cup that
  is on its way.
- "A brew series ended" (trigger): fires once per series (not when the
  app or Homey restarts), with the
  tokens Cups accepted, Cups asked, All cups accepted and Reason. An
  accepted cup is a command the machine took, not proof that a cup came
  out. When the machine stops a series (attention, switched off, a
  timeout, a failed brew command) there is also one timeline message.
- Do not start a series from "Machine became ready to brew" or from
  "A brew series ended": that loops.
- Other taps and flows are not blocked during a series. After one, the
  series waits a few seconds before its next cup.

### How it behaves

- Alarms follow the status the machine sends by itself, so they show
  within seconds.
- Short events, such as taking out the drip tray to empty it, trigger
  your flows too. A flow that sends a notification fires each time
  one of these happens.
- When you switch the machine off, `onoff` goes to off and then the
  tile becomes unavailable at once with "The machine is switched
  off.".
- Switching off, heating up and the machine's own settings menu are
  normal states, not faults. They do not turn on "Needs attention" or
  put a warning on the tile, on any model. A real fault at the same
  time still does.
- A brew asked for while the machine is still busy with a drink or a
  rinse is not sent. The tile or flow card says so: "The machine is
  busy (a drink or a rinse is running), so this brew command was not
  sent. Try again when it is done."
- Since 0.14.0 a brew is also not sent while the machine shows
  something that needs attention (fill water, empty the drip tray or
  grounds container, insert the tray), while it is not ready yet
  ("please wait", or "heating up" on the six models whose machine
  data marks it as an error) or while it is switching off. The button or
  flow action says why, for example "The machine needs attention (fill
  water), so this brew command was not sent. Fix it and try again.",
  "The machine is not ready yet (please wait), so this brew command
  was not sent. Try again in a moment." or "The machine is switching
  off, so this brew command was not sent." An empty bean hopper does
  not stop a brew. Turning off the setting "Do not brew while the
  machine reports an alarm" (see Settings) switches these three checks
  off.
- Since 0.14.0 a brew is also refused as busy when the machine shows
  a drink, a rinse or a programme (such as cleaning) whose start the
  app did not see: after the app reconnected in the middle of it, or
  during a very long programme. The text is then "The machine is busy
  (a drink, a rinse or a programme is running), so this brew command
  was not sent. Try again when it is done." It ends with the next
  status from the machine, or two minutes after the last progress
  message if none comes. The setting does not switch this one off.

## Settings

Water amounts (ml) for coffee, espresso and hot water. 0 uses the
default from the machine's own profile. Any other amount has to fit
what your machine allows for that drink, and that differs per drink
and per machine (an E8 takes 25 to 240 ml for coffee and 15 to 80 ml
for espresso, in steps of 5). An amount outside that is rejected when
you save, with a message such as "Espresso (ml) must be between 15
and 80 ml, in steps of 5, for this machine."

The two brew cards also have an optional amount in ml. Filled in, it
replaces the setting for that card, with the same limits, and nothing
is sent when it does not fit. Left empty, nothing changes. Drinks
without an adjustable amount, such as milk foam, ignore it. Drinks that
add extra water by default, such as Cafe Barista and Barista Lungo, do
not take an amount in a flow yet.

Strength for coffee and espresso is the level number your machine
itself shows, on whatever scale that machine uses: a numeric scale
(e.g. 1 to 10, or 3 to 10 on some E6/E8 models), or a named scale
where 1 is the mildest (e.g. 1 = mild, 2 = normal, 3 = strong). The
label above each field shows the numbers your specific machine has.
0 uses the default strength from the machine's profile, not whatever
you've dialled in on the machine itself (the app can't read that). A
value your machine doesn't have is rejected when you save.

Brewing has one checkbox, "Do not brew while the machine reports an
alarm", on by default. It decides whether a brew command is sent while
the machine shows something that needs attention, is not ready yet or
is switching off, see How it behaves. Turn it off if a brew is refused
while the machine itself can brew. It takes effect at the next tap,
without a reconnect. The refusal for a machine that is busy with a
drink, a rinse or a programme is not part of it.

Machine IP address is filled in at pairing. Change it if your router
gave the machine a new address. The same rule applies as for the
manual IP field, see Known limitations.

## Known limitations

- UDP discovery doesn't cross VLANs: use the manual IP field and pick
  the model yourself. That field, and the Machine IP address setting,
  only accept an IPv4 address on your local network: 192.168.x.x,
  10.x.x.x or 172.16.x.x to 172.31.x.x (169.254.x.x and 100.64.x.x to
  100.127.x.x work too). Host names, internet addresses, spaces and
  leading zeros are refused.
- After the machine's own auto-off timer kicks in, the dongle goes
  unreachable too. There's no way to wake it remotely.
- Remote on/off isn't possible; the dongle ignores that command.
- The J.O.E. app can't connect while Homey is connected. The dongle
  only accepts one connection at a time.
- If the app connects while the machine is already busy (for example
  halfway through the rinse after switching on), it only learns that
  from the first progress message the machine sends, usually within a
  second or two. A brew sent in that first moment may still be
  reported as accepted while the machine ignores it. From the first
  progress message on, the app refuses a brew as busy, also when it
  missed the start of the drink or rinse (see How it behaves).
- The checks for an alarm, "not ready yet" and switching off need a
  recent status from the machine. Right after a connection was lost
  or made, until the machine has sent its status, a brew is sent as
  before and the machine itself decides.
- "Cleaning finished" and "Descaling finished" have only been checked
  against the logs of one machine (an E8). A programme that is broken
  off, or another model, may behave differently; a report helps.
- There's no way to remotely abort a brew already in progress.
- A brew series is not resumed after a restart of the app or Homey: the
  remaining cups are not brewed later.
- A cup counted by a brew series is a command the machine accepted, not
  proof that a cup was delivered.
- Other brews (a tap, another flow) are not blocked during a series, so
  they can come in between the cups of a series.

## LAN security

The Jura WiFi protocol lets anyone on the same network replay the
handshake and read the PIN when it is sent. A fake machine on the
network could also ask Jura Connect for the PIN. This is how Jura's
protocol works, and the app cannot change it.

Keep the machine on a network you trust, and never forward port 51515
to the internet.

## Reporting a problem

Use the GitHub issue templates: bug report, feature request, model
request (your machine is not in the list yet), or model verification.
Including a Homey diagnostics report ID helps a lot.

The model forms ask for the firmware, article number (art.) and hwId
of your machine. With app version 0.13.1 or later they are shown on
the Homey pairing screen, in the line under the name of each machine
the scan found. Copy only the firmware, art. and hwId, not the
address. Already paired? Choose Add device again and stop at the
list, you do not have to pick anything.

A machine you added with the IP address field is not in the scan list
and shows no hwId. In the [Model request form](https://github.com/WoutvanderAa/homey-jura-connect/issues/new?template=model_request.yml)
write "not found" for the hwId and firmware (the article number is
also on the machine's type plate). In the model verification form,
leave the hwId empty.

Please do not post your PIN, your WiFi password or your IP address.

## Credits

JavaScript port of **[`jura_connect`](https://github.com/makefu/jura-connect)**
(PyPI package `jura-connect`) by **makefu**, and by extension of the
J.O.E. Android app it was itself derived from. The Home Assistant
integration **[`jura-connect-hass`](https://github.com/makefu/jura-connect-hass)**
is by the same author.

### Image credits

**App Store banner photo**: a real Jura Z8 brewing coffee, by
**coffee-rank** ([source](https://www.flickr.com/photos/189612330@N06/50330277776)),
licensed [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/),
cropped from the original.

## Development

```
npx homey app validate --level publish
npx homey app run --remote
```

No dependencies. Without `--remote`, the CLI asks for Docker instead.

- `lib/`: protocol layer (crypto, framing, discovery) and the bundled
  per-model profiles
- `drivers/jura-machine/`: the driver, device, and pairing views

## License

MIT, see `LICENSE`.
