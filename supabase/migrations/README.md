# JR PHEEF migration history

The connected production project reports 60 applied migration versions. Some early versions were applied directly to the database before their SQL source was tracked in this repository. The current repository therefore cannot reconstruct a clean-install schema from those historical files alone.

The comment-only migration files in this directory are **history-alignment records**, not schema creation scripts. They correspond only to versions already recorded as applied in the production database and are intended to let Supabase preview branches cloned from that production schema compare migration history correctly without replaying those changes.

Existing SQL migration files have been restored to the version numbers recorded by Supabase. No production migration history or database schema was modified by this repository change.

**Important:** this folder is not yet a verified fresh-project bootstrap. Before creating a new empty JR PHEEF database from scratch, export and review a complete schema baseline (tables, functions, triggers, views, policies, grants, extensions and storage configuration), then test a clean restore. New schema changes must continue to use incremental, reviewed SQL migration files.
