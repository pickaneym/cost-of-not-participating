# OneQrew Slidev Presentation Template

Starter Slidev deck using the same OneQrew presentation theming from the hexagonal architecture talk.

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Export

```bash
npm run export
```

## Structure

- `slides/index.md` wires the slide files together.
- `slides/slides/` contains the deck content.
- `slides/layouts/` contains the custom cover, light-sidebar, and dark-sidebar layouts.
- `slides/styles/index.css` contains the OneQrew color, typography, and layout styling.
- `slides/public/` contains images available from `/filename.ext` inside slides.

## Slide Layouts

Use `layout: cover` for title slides.

Use `layout: default` for a light sidebar with dark main content.

Use `layout: sidebar-invert` for a dark sidebar with light main content.

Common frontmatter options:

```yaml
layout: sidebar-invert
sidebarKicker: Section
sidebarTitle: Slide sidebar title
sidebarCaption: Short sidebar caption
sidebarBody:
  - Optional supporting text
footerText: OneQrew Digital Services
```
