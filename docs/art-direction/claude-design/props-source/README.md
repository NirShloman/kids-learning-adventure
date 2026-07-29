# Props cut from the supplied render sheet

Source: `uploads/pasted-1785302721105-0.png` (4 × 4 magenta sheet)
Process: distance-based chroma key on the sampled key colour (246,2,247) with a
100→190 alpha ramp and spill suppression on halo pixels only, alpha trim, then
centred at 92% fill on a 512 × 512 transparent PNG-32 canvas.
No text, no frame guides, no blockouts.

## letter_factory
- prop_letters_piece_tile.png — purple letter tile
- prop_letters_reward_star.png — yellow star (shared reward across all worlds)

## feed_the_monster
- prop_monster_monster_idle.png — purple monster, idle
- prop_monster_food_apple.png
- prop_monster_food_strawberry.png

## building_workshop
- prop_build_shape_square_yellow.png
- prop_build_shape_triangle_red.png
- prop_build_shape_circle_blue.png

## magic_garden
- prop_garden_brush_clean.png
- prop_garden_pot_red_full.png
- prop_garden_pot_blue_full.png
- prop_garden_pot_yellow_full.png
- prop_garden_pot_green_full.png
- prop_garden_flower_coloured.png
- prop_garden_balloon_red.png

## characters
- char_explorer_boy.png — a different character (safari outfit). NOT part of the
  Nir / Shir set. Kept for reference only.

## Notes
- The source art carries no baked contact shadow. Add the soft 18% ellipse on
  export, or draw it in engine, so every prop matches the spec.
- Palette check: these renders are more saturated than the site palette
  (primary red / blue / green vs. teal + pastel). Fine as toys inside a scene;
  worth a pass if they are to sit directly against the teal UI.
- Still to render, per props.json: empty/used pot states, uncoloured flower,
  socket hover/locked states, monster chew + cheer frames, the remaining shapes,
  foods, crate, conveyor tile, basket, delivery target, sun, bush, workbench,
  and the house / robot / vehicle parts.
