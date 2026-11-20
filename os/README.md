# JR PHEEF OS workspace

This directory is the isolated engineering workspace for the JR PHEEF OS and Devices programme.

## Status
Architecture and preparation workspace. It is not an AOSP source checkout and does not contain a bootable operating system image.

## Structure
- `android-companion/`: initial native Android application shell that opens the existing JR PHEEF service.
- `specs/`: platform, hardware, security and release requirements.
- Future AOSP source/build work must live in a separate repository or isolated submodule/worktree after a supported reference device and vendor BSP are selected.

## Preservation
The existing Express app, PWA, Supabase schema and production deployment are outside this workspace. Do not replace them as part of OS preparation.
