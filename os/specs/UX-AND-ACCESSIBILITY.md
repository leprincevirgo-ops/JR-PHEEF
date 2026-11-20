# JR PHEEF OS — Experience and Accessibility Specification

**Status:** Product requirements for future implementation.

## Experience principles
- JR is the primary entry point, but users can reach settings, emergency functions, accessibility controls and recovery without voice interaction.
- One coherent JR visual language across devices; layouts adapt to phone, tablet, desktop, watch and TV.
- Voice, text, touch, keyboard, switch access and assistive technology are first-class input methods.
- Never force voice input or an always-listening microphone.
- Users can understand when JR is listening, processing, accessing a tool or waiting for approval.
- Keep user intent and action preview visible before consequential execution.
- Preserve familiar OS navigation and emergency escape routes.

## Phone navigation
- Home: JR conversation and contextual entry.
- Worlds: discover services, workspaces and capabilities.
- JR: full assistant experience.
- Command Center: profile, messages, notifications, account status and personal controls.
- Settings: identity, privacy, security, permissions, appearance, connected devices and support.

The four-zone mobile navigation remains the target direction from the existing JR product work. Avoid duplicating existing navigation without first inspecting the current application shell.

## Accessibility acceptance
- TalkBack labels and logical focus order.
- Dynamic font scaling without clipping.
- Sufficient text/control contrast.
- Minimum touch target sizing consistent with Android guidance.
- Reduced motion and no essential information conveyed only by color.
- Captions/transcripts for supported audio/video experiences.
- Clear language, error recovery and keyboard/switch navigation.
- Voice features always have a visible alternative.
- Test with people using assistive technologies; automated checks alone are insufficient.

## Privacy cues
- Visible system microphone/camera indicators remain intact.
- Clear location and background-access explanations.
- Permission requests appear at the point of need.
- User can inspect and revoke connected devices and integrations.
