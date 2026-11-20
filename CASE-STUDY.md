# FORM — a digital exhibition in shape, light, and matter

## Brief

Create a distinctive portfolio concept for Asifur Rahman Bhuiyan: a dark cinematic sculpture gallery with original procedural artwork and meaningful interaction.

## Art direction

An oversized ivory wordmark establishes scale. Near-black surfaces let studio reflections define the sculptures. Small catalogue labels and restrained green accents provide structure; italic editorial typography introduces a quieter rhythm below the hero.

## Three studies

Fibre projects the Hopf fibration into three dimensions: two nested tori of circles, 23 in all, each linked through every other. In polished chrome, every ring reflects its neighbours.

Bloom places 200 cupped petals by the golden angle, the same rule as a sunflower's seeds. They rise upright at the bud and splay open toward the rim, in a glazed ceramic finish.

Paradox is a Klein bottle: its neck bends back and passes through its own wall, giving a single surface with no inside. Clear, lightly tinted glass shows the crossing. A dark backdrop drawn only into the refraction pass keeps the glass clear on a transparent canvas.

## Interaction

Each object can be inspected through direct rotation, material switching, and two lighting environments. Wireframe view reveals the construction. Reset and object navigation make exploration reversible. Keyboard controls and a reduced-motion preference extend the experience beyond pointer interaction.

## Implementation decisions

One renderer moves between the hero and modal inspector. Static WebP posters preserve the gallery while 3D initializes and avoid rendering three separate animated canvases. Studio reflections are generated procedurally, avoiding external environment-map downloads. Render resolution is capped, and idle or offscreen scenes stop drawing.

## Validation and limits

Desktop and mobile-width layouts and the core inspector interactions were checked in the in-app Chromium browser. Screenshots are saved under `qa/` locally. There are no measured conversion claims, client endorsements, or fabricated outcomes. Real mobile hardware and cross-browser performance still require a separate device-testing pass.

## Attribution

An independent portfolio concept for Asifur Rahman Bhuiyan, created with AI design and development assistance. Three.js provides rendering; the original shapes, studio setup, artwork previews, and interface were created for this project.
