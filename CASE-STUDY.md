# FORM — a digital exhibition in shape, light, and matter

## Brief

Create a distinctive portfolio concept for Asifur Rahman Bhuiyan: a dark cinematic sculpture gallery with original procedural artwork and meaningful interaction.

## Art direction

An oversized ivory wordmark establishes scale. Near-black surfaces let studio reflections define the sculptures. Small catalogue labels and restrained green accents provide structure; italic editorial typography introduces a quieter rhythm below the hero.

## Three studies

Fold sweeps a flattened elliptical profile around a continuous knotted path. Its polished surface traces the changing curvature through reflections.

Void modifies the radius and thickness of a ring to create a soft, irregular vessel. The central opening becomes part of the composition.

Tension places two curved loops in an interlocking arrangement. A lightly tinted transmissive material explores overlapping surfaces and highlights.

## Interaction

Each object can be inspected through direct rotation, material switching, and two lighting environments. Wireframe view reveals the construction. Reset and object navigation make exploration reversible. Keyboard controls and a reduced-motion preference extend the experience beyond pointer interaction.

## Implementation decisions

One renderer moves between the hero and modal inspector. Static WebP posters preserve the gallery while 3D initializes and avoid rendering three separate animated canvases. Studio reflections are generated procedurally, avoiding external environment-map downloads. Render resolution is capped, and idle or offscreen scenes stop drawing.

## Validation and limits

Desktop and mobile-width layouts and the core inspector interactions were checked in the in-app Chromium browser. Screenshots are saved under `qa/` locally. There are no measured conversion claims, client endorsements, or fabricated outcomes. Real mobile hardware and cross-browser performance still require a separate device-testing pass.

## Attribution

An independent portfolio concept for Asifur Rahman Bhuiyan, created with AI design and development assistance. Three.js provides rendering; the original shapes, studio setup, artwork previews, and interface were created for this project.
