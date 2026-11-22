# Flow cards and settings in detail

The detail behind the short lists in the [README](../README.md). Like the README, this page describes the test version (0.15.x).

## Brew a product

The "Brew a product" action covers any product your specific machine has, with an optional strength and an optional amount in ml.
The amount works as described under [Settings](#settings).

## Brew checks

A brew is not sent when:

- the machine is busy with a drink, a rinse or a programme (also one whose start the app missed, for example after a reconnect);
- it needs attention (fill water, empty the drip tray or grounds container, insert the tray);
- it is not ready yet ("please wait", or "heating up" on six models);
- it is switching off.

The tile or flow card says why. An empty bean hopper does not stop a brew.
Turning off the setting "Do not brew while the machine reports an alarm" switches off the attention, not-ready and switching-off checks, not the busy check.

The texts you get:

- Busy: "The machine is busy (a drink or a rinse is running), so this brew command was not sent. Try again when it is done."
- Needs attention: "The machine needs attention (fill water), so this brew command was not sent. Fix it and try again."
- Not ready yet: "The machine is not ready yet (please wait), so this brew command was not sent. Try again in a moment."
- Switching off: "The machine is switching off, so this brew command was not sent."

A brew is also refused as busy when the machine shows a drink, a rinse or a programme (such as cleaning) whose start the app did not see: after the app reconnected in the middle of it, or during a very long programme.
The text is then "The machine is busy (a drink, a rinse or a programme is running), so this brew command was not sent. Try again when it is done."
It ends with the next status from the machine, or two minutes after the last progress message if none comes. The setting does not switch this one off.

## Machine became ready to brew

"Machine became ready to brew" is a trigger and "Machine is / isn't ready to brew" is a condition.
Ready means: connected, a fresh status shows "coffee ready", and no alarm and no busy state (a drink, a rinse, heating up, switching off) for 4 seconds in a row.
The machine's own settings menu and the display lock do not count as an alarm or a busy state here.
The trigger fires each time the machine becomes ready again: after a drink or a rinse, a solved alarm, or switching it on.
It does not fire when the app or Homey starts. A model that does not report "coffee ready" is never ready.

> Watch out for loops. A flow on this trigger that brews keeps brewing: "When Machine became ready to brew, brew a coffee" makes one cup after another. For a set number of cups, use "Brew a product several times".
> The trigger also fires after every cup of a series, so up to 10 times for one series. Do not start a series from it or from "A brew series ended": that loops.

## Cleaning finished and Descaling finished

Both are triggers. They fire once when the machine resets its cleaning or descaling percentage after the programme, usually shortly after it ends.
If Homey was not connected then, they fire as soon as the app reads the machine again. There is no such card for the filter.
They have only been checked on one machine, see [Limits](#limits).

## Brew a product several times

An action: a product, 1 to 10 cups, an optional strength and an optional amount in ml (the same for every cup).
The card is done once the machine accepts the first cup.
Each next cup goes as soon as the previous cup was seen and the machine is ready to brew again, with no pause of its own, so every cup goes into whatever is under the spout.
A model that does not report "coffee ready" gets only the first cup.

The series stops when:

- the machine needs attention or switches off;
- a cup is not seen, or the machine is not ready again within 4 minutes after it accepted a cup;
- a brew command fails;
- you use "Stop the brew series";
- you change the IP address or the machine model;
- the app or Homey restarts (the remaining cups are not brewed later).

Other taps and flows are not blocked during a series, so they can come in between the cups. After one, the series waits a few seconds before its next cup.
"Machine became ready to brew" fires after every cup, see [the loop warning](#machine-became-ready-to-brew).

## Stop the brew series

An action: no further cup is sent. A cup that is already being brewed is not stopped.
Stopping a cup with the button on the machine stops only that cup, not the series: the next cup follows a few seconds later, as the machine becomes ready again. To stop the series, use this card or switch the machine off.

## A brew series ended

A trigger that fires once per series (not when the app or Homey restarts), with the tokens Cups accepted, Cups asked, All cups accepted and Reason.
An accepted cup is a command the machine took, not proof that a cup came out.
When the machine stops a series (attention, switched off, a timeout, a failed brew command) there is also one timeline message.

## Alarm and maintenance cards

Each alarm has a trigger and a condition. Each maintenance type has a "crossed above X%" trigger and an "is above X%" condition.
The maintenance "crossed above" triggers have a "Percent" token. The ready and finished triggers have no tokens.
"Total brews" and the maintenance percentages are in the device settings, under Statistics.

## Device tile

### On/off

The on/off switch is read-only and follows the machine, so Homey's own "Turned off", "Turned on" and "Is turned on" cards work.
When you switch the machine off, it goes to off and the tile becomes unavailable with "The machine is switched off." It goes back to on as soon as the machine answers again. A lost connection without that announcement leaves it as it is.
Switching the machine on or off from Homey (the toggle on the tile, or Homey's own cards for switching on and off) is refused with a message: the dongle ignores that command.

### Needs attention

This shows a real fault.
Switching off, heating up and the machine's own settings menu are normal states, not faults. They do not turn on "Needs attention" or put a warning on the tile, on any model. A real fault at the same time still does.

### Alarms

Alarms follow the status the machine sends by itself, so they show within seconds.
Short events, such as taking out the drip tray to empty it, trigger your flows too. A flow that sends a notification fires each time one of these happens.
The alarms are the ones in the [README](../README.md#features): Water alarm, Beans, Tray full, Tray removed, Outlet missing and Rear cover missing.

### 2x buttons

"Brew 2x espresso" and "Brew 2x coffee": the machine's own 2-cup product at its default amount and strength (the Coffee and Espresso settings do not apply).
Only on models with both products: 45 of the 72, the E4 included.
The buttons are added automatically when you update the app or pair the machine, and removed only when you change the machine model in the settings.

The E4 (EF1031) also gets "2x Espresso" and "2x Coffee" in "Brew a product" and the 2x buttons.
Jura's data marks both as inactive on this model, but they were brewed on a real E4. They have no strength setting, so the machine uses its own default.

## Settings

### Water amounts

Water amounts (ml) for coffee, espresso and hot water. 0 uses the default from the machine's own profile.
Any other amount has to fit what your machine allows for that drink, and that differs per drink and per machine (an E8 takes 25 to 240 ml for coffee and 15 to 80 ml for espresso, in steps of 5).
An amount outside that is rejected when you save, with a message such as "Espresso (ml) must be between 15 and 80 ml, in steps of 5, for this machine."

The amount in ml on the brew cards replaces this setting for that card, with the same limits, and nothing is sent when it does not fit; empty or 0 keeps the setting.
Drinks without an adjustable amount, such as milk foam, ignore it.
Drinks that add extra water by default, such as Cafe Barista and Barista Lungo, do not take an amount in a flow yet.

### Strength

Strength for coffee and espresso is the level number your machine itself shows, on whatever scale that machine uses: a numeric scale (e.g. 1 to 10, or 3 to 10 on some E6/E8 models), or a named scale where 1 is the mildest (e.g. 1 = mild, 2 = normal, 3 = strong).
The label above each field shows the numbers your specific machine has.
0 uses the default strength from the machine's profile, not whatever you have dialled in on the machine itself (the app cannot read that).
A value your machine does not have is rejected when you save.

### Do not brew while the machine reports an alarm

On by default (see [Brew checks](#brew-checks)).
Turn it off if a brew is refused while the machine itself can brew. It takes effect at the next tap, without a reconnect.

### Machine IP address

Filled in at pairing. Change it if your router gave the machine a new address.
UDP discovery does not cross VLANs: use the manual IP field and pick the model yourself.
That field, and this setting, only accept an IPv4 address on your local network: 192.168.x.x, 10.x.x.x or 172.16.x.x to 172.31.x.x (169.254.x.x and 100.64.x.x to 100.127.x.x work too).
Host names, internet addresses, spaces and leading zeros are refused.

## Limits

If the app connects while the machine is already busy (for example halfway through the rinse after switching on), it only learns that from the first progress message the machine sends, usually within a second or two.
A brew sent in that first moment may still be reported as accepted while the machine ignores it.
From the first progress message on, the app refuses a brew as busy, also when it missed the start of the drink or a rinse (see [Brew checks](#brew-checks)).

The checks for an alarm, "not ready yet" and switching off need a recent status from the machine.
Right after a connection was lost or made, until the machine has sent its status, a brew is sent as before and the machine itself decides.

"Cleaning finished" and "Descaling finished" have only been checked against the logs of one machine (an E8).
A programme that is broken off, or another model, may behave differently; a report helps.
