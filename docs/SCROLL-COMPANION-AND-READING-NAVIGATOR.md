# JR PHEEF — Scroll companion and reading navigator

## Product decision
The reading navigator is a user-selectable interface aid, not a mandatory mascot. The default is **JR Flow**, a neutral abstract light trail. The spider is optional and must never be the only available appearance.

## Available appearances
- **JR Flow:** abstract light trail; recommended default.
- **JR Spider:** optional eight-legged guide.
- **JR Orb:** glowing sphere.
- **JR Butterfly:** optional flying companion.
- **Classic scrollbar:** familiar non-character control.
- **No companion:** disable the overlay and retain ordinary browser scrolling.

The selected appearance is saved locally on the device. Do not infer or store a user's phobia, diagnosis, or other health information.

## Gestures
Gestures are recognised only when performed directly on the companion handle. This avoids hijacking ordinary page swipes, text selection, links, forms, and mobile operating-system edge gestures:
- Swipe left: forward through JR's in-app page/view history.
- Swipe right: back through JR's in-app page/view history.
- Swipe up: move to the bottom of the current page.
- Swipe down: move to the top of the current page.
- Tap: open appearance settings.
- Arrow keys: same directional actions; Enter opens settings.

The navigator delegates to the existing page-navigation controls. It does not create a second navigation history.

## Accessibility and safety
- Respect operating-system reduced-motion preference.
- Keep the companion keyboard-operable and clearly labelled for assistive technology.
- Keep standard scrolling, selection, typing, links and buttons unaffected.
- Provide a no-companion option.
- Never force animal imagery, animation, sound, vibration or sudden movement.
- Do not obscure page text or controls; keep the panel dismissible with Escape.
- A future text-guidance layer may point to headings and high-confidence important phrases, but must not reorder paragraphs or cover text. It must be independently switchable.

## Current implementation boundary
The initial implementation provides appearance choice, local persistence, and directional navigation through the existing page history/top/bottom controls. Semantic text analysis and spider-leg word pointing remain a separate later phase and must be tested for readability before activation.
