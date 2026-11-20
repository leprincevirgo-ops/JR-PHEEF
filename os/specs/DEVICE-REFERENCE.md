# JR PHEEF Phone — Reference Device Requirements

**Status:** Proposed target profile; not a purchase order or selected model.

## Functional requirements
- JR-first interface with standard OS recovery and emergency functions retained.
- LTE minimum; 5G preferred where supported by target-market bands.
- Wi-Fi, Bluetooth, GNSS and optional NFC.
- USB-C, fingerprint, front/rear camera, microphones and speaker.
- Local encrypted storage; hardware-backed cryptographic keys.
- Secure boot, verified updates, rollback/recovery and maintainable vendor firmware.
- Accessibility features, screen reader support, scalable text and reduced motion.
- Repairable battery/display where feasible; documented spare-parts path.

## Initial target profile
- Display: 6.5–6.8 inch, FHD+, 90 Hz preferred.
- SoC: supported 64-bit ARM platform with vendor BSP and Android compatibility.
- RAM: 8 GB target.
- Storage: 128–256 GB target.
- Battery: approximately 5,000 mAh.
- Sensors: accelerometer, gyroscope, proximity and ambient light; compass where supported.
- Camera: serviceable main and front cameras; no requirement for flagship imaging.

## Supplier selection gates
1. Obtain exact chipset, modem and supported band documentation.
2. Confirm BSP access, kernel/vendor source obligations and update process.
3. Confirm bootloader unlocking for development and secure relocking for production.
4. Review TEE/Keystore, Verified Boot, FBE and OTA implementation.
5. Review thermal limits, sustained performance, battery safety and repairability.
6. Obtain engineering samples and run a hardware validation plan.
7. Confirm target-country radio/type approvals, warranty, spare parts and security support duration.

No component or supplier is approved until evidence is reviewed.
