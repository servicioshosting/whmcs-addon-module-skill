# whmcs-addon-module

Agent skill for scaffolding and extending **general-purpose WHMCS addon modules**.

It covers the entry file lifecycle (`_config` / `_activate` / `_upgrade` / `_output` / `_clientarea`), PSR-4 `lib/` layout (Module singleton, Admin/Client dispatchers and services), Eloquent models, Monolog logging, optional standalone JSON endpoints, optional HMAC webhooks, `hooks.php` patterns, and an optional Svelte + Vite admin SPA.

The skill is **self-contained** — agents should scaffold from `SKILL.md` alone and not need an example addon checkout.

## Install

With the [skills](https://skills.sh) CLI (global, all projects):

```bash
npx skills add <YOUR-GITHUB-USER>/whmcs-addon-module -g -y
```

Project-local install (omit `-g`):

```bash
npx skills add <YOUR-GITHUB-USER>/whmcs-addon-module -y
```

Update later:

```bash
npx skills update whmcs-addon-module -g
```

Manual install: copy or clone this repo into `~/.agents/skills/whmcs-addon-module/` (or your project's `.agents/skills/whmcs-addon-module/`).

## Repository layout

```
whmcs-addon-module/
├── SKILL.md    # Agent-facing skill (required)
├── README.md   # Human install / usage notes
└── LICENSE     # Apache License 2.0
```

## When to use

Use this skill when creating or extending WHMCS addon modules — e.g. prompts like “create WHMCS addon”, “scaffold addon module”, or work inside a WHMCS modules repo (`addons/`, `gateways/`, `admin-ui/`, `push.sh` / `pull.sh`).

## License

Copyright 2026 Gustavo López

Licensed under the Apache License, Version 2.0. See [LICENSE](./LICENSE).
