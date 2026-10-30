# FORM

A dark cinematic digital sculpture exhibition for Asifur Rahman Bhuiyan.

## Run locally

Run `node serve.mjs` from this directory, then open http://127.0.0.1:4173.
The checked-in `dist/` directory is the complete static website. No build step or package installation is required to serve it. The package lock records the Three.js version used to produce the vendored browser modules. The license is retained in `dist/vendor/LICENSE`.

## GitHub and Vercel

Source repository: https://github.com/AtomicWorks/form-gallery (private).

Production: https://form-gallery.vercel.app

`vercel.json` configures a static deployment from `dist/`, with dependency installation skipped because the browser modules are vendored. `npm run build` verifies local assets and points social-preview metadata to the Vercel production hostname when its deployment environment supplies one. `npm run check` checks JavaScript syntax.

Import this repository into Vercel with the repository root as the root directory. The framework preset is Other; the configuration supplies the build command and output directory. No application secrets or environment variables are required. Alternatively, use `vercel --prod` from this directory after signing in and linking the project.

Local Vercel settings, environment files, and QA screenshots are excluded from Git. The `.vercelignore` file also excludes Sites-specific metadata from Vercel uploads.

## Experience

- Three original procedural sculptures: Fold, Void, and Tension.
- Drag the hero sculpture to rotate it directly; automatic rotation pauses while held and resumes on release, unless manually paused or reduced motion is enabled. Vertical touch scrolling remains available on the hero.
- Oversized typography, dark surfaces, restrained green accents, and custom studio reflections.
- Object inspector with pointer and keyboard rotation, chrome / ceramic / glass materials, warm / cool environments, wireframe, reset, and previous / next navigation.
- Native modal focus containment, Escape dismissal, restored trigger focus, reduced-motion support, and a rotation pause control.
- Responsive collection and process sections, including original construction linework.
- Local, pre-rendered WebP artwork previews; one active WebGL canvas, capped rendering resolution, and offscreen / hidden-tab animation suspension.

## Structure

- `dist/index.html`: accessible content and inspector controls.
- `dist/style.css`: responsive layout, typography, and visual styling.
- `dist/app.js`: procedural geometry, studio environments, renderer lifecycle, and interactions.
- `dist/images/`: artwork posters rendered from the same procedural geometry.
- `dist/vendor/`: pinned Three.js browser modules and license.
- `.openai/hosting.json`: private Sites project and static deployment configuration.

## Validation

Checked in the Codex in-app Chromium browser at approximately 1440 × 1000 and 390 × 844 CSS pixels:

- Hero and collection composition; actual sculpture previews load.
- No horizontal page overflow at the mobile test size.
- Inspector open/close, all three objects, material and lighting selections.
- Wireframe toggle, arrow-key input, reset, pointer dragging, Escape dismissal, and focus return.
- No JavaScript errors in the captured browser console during the tested interactions.
- JavaScript syntax and local HTTP asset availability checked separately.

Real mobile hardware, Safari/Firefox, and GPU performance benchmarks have not been tested. Reduced-motion and unavailable-WebGL paths are implemented but were not emulated in this browser test. A vendor shader precision warning was observed during initial compilation; rendering completed successfully.

## Credits

Exhibition identity: Asifur Rahman Bhuiyan.
Self-initiated concept, designed and implemented with AI assistance. Sculptures and lighting are procedural; no external 3D models or stock artworks are used. Rendering uses Three.js (MIT). System fonts are used. No contact destination was supplied, so the site uses a collection link instead of an invented address.
