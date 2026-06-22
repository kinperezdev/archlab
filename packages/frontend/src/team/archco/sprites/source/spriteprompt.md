PROMPT 1 — Alex Chen only
You are a pixel art SVG sprite generator. Generate complete pixel art using ONLY SVG <rect> elements. No paths, no circles, no polygons, no images, no base64.

RULES:
- Every sprite: <svg viewBox="0 0 48 72" xmlns="http://www.w3.org/2000/svg">
- Every pixel: <rect x="{col*3}" y="{row*3}" width="3" height="3" fill="{color}"/>
- Grid: 16 columns x 24 rows
- Row 0-3: hair, Row 4-7: face, Row 8-11: neck/shoulders, Row 12-17: torso, Row 18-20: upper legs, Row 21-23: lower legs/shoes
- Background always transparent

CHARACTER: Alex Chen — CTO
- Short dark hair (#1A1A2E), glasses (two 2x1px #1A1A2E rects at row 5 cols 5-6 and 9-10, 1px bridge col 7-8)
- Skin #F3C5A0, indigo shirt #6366F1, khaki pants #C4A882, dark shoes #1A1A2E
- Thoughtful neutral expression

Generate ALL of these frames in order:

BASE: full standing sprite
EMOTION_NEUTRAL: face area only (rows 4-7), flat mouth, normal eyes
EMOTION_HAPPY: face area only, curved mouth, squinted eyes
EMOTION_TALKING: face area only, mouth open
EMOTION_THINKING: face area only, one eyebrow raised
EMOTION_STRESSED: face area only, downturned mouth, sweat drop #93C5FD
EMOTION_EXCITED: face area only, wide eyes, big smile
EMOTION_CONCERNED: face area only, furrowed brows, slight frown
EMOTION_FRUSTRATED: face area only, furrowed brows, zigzag mouth
EMOTION_SATISFIED: face area only, closed eyes, peaceful smile
EMOTION_CURIOUS: face area only, one eye wider, head tilted
EMOTION_CELEBRATING: face area only, huge smile, star bursts #FEF08A at sides
EMOTION_SLEEPING: face area only, closed eyes, Z pixels #94A3B8 above
EMOTION_PANICKING: face area only, very wide eyes, mouth wide open, motion lines
EMOTION_RUSHING: face area only, leaning expression, motion lines at back
IDLE_1: full body, standing straight, arms at sides
IDLE_2: full body, arms slightly lower 2px
IDLE_3: same as IDLE_1
IDLE_4: full body, arms slightly higher 1px
TYPING_1: full body, arms extended forward row 15, fingers down
TYPING_2: full body, arms raised row 14, fingers up
WALK_1: full body, left leg forward, right arm forward
WALK_2: full body, legs together, arms neutral
WALK_3: full body, right leg forward, left arm forward
WALK_4: full body, legs together, arms neutral
PANIC_RUN_1: full body, legs wider offset 3px, arms flailing 4px, body tilted forward 1px, hair back 2px, motion lines behind
PANIC_RUN_2: full body, opposite legs
PANIC_RUN_3: full body, legs wider
PANIC_RUN_4: full body, opposite
SITTING: viewBox 48x54, legs folded L-shape, chair back #2D3748 visible
STANDUP_1: sitting position
STANDUP_2: halfway up, slightly hunched
STANDUP_3: fully standing
CELEBRATE_1: both arms raised straight up
CELEBRATE_2: arms at 45 degrees outward
CELEBRATE_3: arms raised again
CELEBRATE_4: body 3px higher (jumping), legs together
TALK_1: slight lean toward right, talking emotion
TALK_2: straight up, happy emotion
HOME_1: standing, one arm raised waving
HOME_2: walking toward right (elevator)
HOME_3: at elevator, facing doors, arm lowered
LEVELUP_1: idle, small star #FEF08A above head
LEVELUP_2: arms up, star 3px
LEVELUP_3: arms fully raised, star burst 8 pixels radiating
LEVELUP_4: celebrating
LEVELUP_5: idle, level badge #6366F1 floating above
COFFEE_WALK_1: walk frame 1, right hand holds coffee cup #92400E with steam #FEF08A above
COFFEE_WALK_2: walk frame 2 with coffee
LATE_MILD_1: walk frame with coffee cup dropping at angle
LATE_PANIC_1: panic run, hair 2px offset, shirt 1px untucked, 2 sweat drops #93C5FD forehead

Output format for each frame:
=== ALEX_CHEN_{FRAME_NAME} ===
<svg viewBox="..." xmlns="http://www.w3.org/2000/svg">
[rect elements]
</svg>

PROMPT 2 — Marcus Webb only
Same rules as before. ONLY <rect> elements. viewBox "0 0 48 72". Every pixel is <rect width="3" height="3">.

CHARACTER: Marcus Webb — Senior Backend Lead
- Curly dark hair (#1A1A1A) bumpy top pixels (irregular top edge)
- Beard stubble: dark #3D2B1F pixels along jaw rows 6-7
- Skin #8D5524
- Cyan hoodie #06B6D4
- Dark jeans #1E293B
- Dark shoes #1A1A2E
- Coffee cup in right hand: 3x4px #92400E with #FEF08A steam pixel above

Generate ALL same frames as Alex Chen list above. Same output format.
=== MARCUS_WEBB_{FRAME_NAME} ===

PROMPT 3 — Sarah Chen only
Same rules. ONLY <rect> elements.

CHARACTER: Sarah Chen — Security Lead
- Ponytail: dark hair #1A1A1A extending 3px right from head at rows 1-3
- Skin #F3C5A0
- Red shirt #EF4444
- Black pants #1A1A2E
- Dark shoes #1A1A2E
- Default expression slightly stressed (mouth 1px downturned)

Generate ALL same frames. Output:
=== SARAH_CHEN_{FRAME_NAME} ===

ALSO generate these Security-specific frames:
GUARD_ALERT_1: standing, arms slightly raised, alert expression
GUARD_ALERT_2: walking fast toward right (heading to security console)
SECURITY_CONSOLE: standing at console, arms extended forward, typing on standing desk

PROMPT 4 — Jordan Lee only
Same rules. ONLY <rect> elements.

CHARACTER: Jordan Lee — SRE Lead
- Messy hair #4A3728 (irregular pixels, some sticking up)
- Tired half-closed eyes (bottom pixel of eye area filled with skin color)
- Skin #C68642
- Amber shirt #F59E0B
- Dark pants #2D3748
- Phone in left hand: 2x3px #1F2937 with 1px #60A5FA screen

Generate ALL same frames plus:
ONCALL_1: sitting at desk, multiple monitors lit, stressed expression
ONCALL_2: standing up suddenly, alarmed expression
ONCALL_3: typing frantically, fastest typing animation
=== JORDAN_LEE_{FRAME_NAME} ===

PROMPT 5 — Priya Sharma only
Same rules. ONLY <rect> elements.

CHARACTER: Priya Sharma — Senior PM
- Long hair #1A1A1A extending down sides of head rows 0-15
- Skin #C68642
- Green blazer #22C55E
- Dark pants #1E293B
- Dark shoes #1A1A2E
- Clipboard in right hand: 3x4px #D4B896 with dark line pixels

Generate ALL same frames.
=== PRIYA_SHARMA_{FRAME_NAME} ===

PROMPT 6 — Casey Kim only
Same rules. ONLY <rect> elements.

CHARACTER: Casey Kim — Senior Frontend Lead
- Side-swept hair #6B21A8 (pixels angled right at top)
- Skin #F3C5A0
- Purple shirt #A855F7
- Light jeans #94A3B8
- Dark shoes #1A1A2E

Generate ALL same frames.
=== CASEY_KIM_{FRAME_NAME} ===

PROMPT 7 — Rio Tanaka only
Same rules. ONLY <rect> elements.

CHARACTER: Rio Tanaka — Senior Designer
- Bun hairstyle: 4x4px circle of #1A1A1A pixels at top center of head rows 0-1
- Skin #F3C5A0
- Rose shirt #F43F5E
- Dark pants #1E293B
- Dark shoes #1A1A2E
- Stylus in right hand: 1x4px #F8FAFC thin rectangle at slight angle

Generate ALL same frames.
=== RIO_TANAKA_{FRAME_NAME} ===

PROMPT 8 — Remaining employees batch 1 (Kai, Yuna, Ravi, Elena)
Same rules. ONLY <rect> elements. Generate all frames for each character in order.

CHARACTER 1: Kai Nakamura — Senior Backend Engineer
- Short dark hair #1A1A1A
- Headphones: #1F2937 arc over head rows 0-2, colored cups #0891B2 at cols 4 and 11
- Skin #F3C5A0, teal shirt #0891B2, dark jeans #1E293B
=== KAI_NAKAMURA_{FRAME_NAME} ===

CHARACTER 2: Yuna Park — Senior Backend Engineer
- Long straight hair #1A1A1A down sides rows 0-15
- Skin #F3C5A0, darker cyan shirt #0E7490, dark pants #1E293B
=== YUNA_PARK_{FRAME_NAME} ===

CHARACTER 3: Ravi Patel — Senior Backend Engineer
- Short dark hair #1A1A1A
- Skin #C68642, teal-dark shirt #0D9488, dark pants #2D3748
=== RAVI_PATEL_{FRAME_NAME} ===

CHARACTER 4: Elena Vasquez — Senior Backend Engineer
- Ponytail #4A3728 brown hair extending right
- Skin #C68642, aqua shirt #0891B2, dark jeans #1E293B
=== ELENA_VASQUEZ_{FRAME_NAME} ===

PROMPT 9 — Remaining employees batch 2 (Mia, Tyler, Sam, Omar)
Same rules. ONLY <rect> elements.

CHARACTER 1: Mia Chen — Senior Frontend Engineer
- Long straight hair #1A1A1A down sides
- Skin #F3C5A0, purple shirt #9333EA, dark pants #1E293B
=== MIA_CHEN_{FRAME_NAME} ===

CHARACTER 2: Tyler Brooks — Senior Frontend Engineer
- Messy reddish-brown hair #92400E
- Skin #FDBCB4, violet shirt #7C3AED, light jeans #94A3B8
=== TYLER_BROOKS_{FRAME_NAME} ===

CHARACTER 3: Sam Rivera — SRE Engineer
- Short dark hair #1A1A1A
- Skin #C68642, amber-dark shirt #D97706, dark pants #2D3748
=== SAM_RIVERA_{FRAME_NAME} ===

CHARACTER 4: Omar Khalil — Senior Security Engineer
- Short dark hair #1A1A1A
- Skin #C68642, dark red shirt #DC2626, black pants #1A1A2E
=== OMAR_KHALIL_{FRAME_NAME} ===

PROMPT 10 — Remaining employees batch 3 (Zara, Leo, Nadia, Maya)
Same rules. ONLY <rect> elements.

CHARACTER 1: Zara Ahmed — Security Engineer
- Long hair #1A1A1A down sides
- Skin #C68642, crimson shirt #B91C1C, dark pants #1E293B
=== ZARA_AHMED_{FRAME_NAME} ===

CHARACTER 2: Leo Zhang — Product Manager
- Short hair #1A1A1A
- Skin #F3C5A0, green shirt #16A34A, dark pants #1E293B
=== LEO_ZHANG_{FRAME_NAME} ===

CHARACTER 3: Nadia Hassan — UI Designer
- Ponytail #1A1A1A
- Skin #C68642, rose-dark shirt #E11D48, dark pants #1E293B
- Stylus in right hand
=== NADIA_HASSAN_{FRAME_NAME} ===

CHARACTER 4: Maya Patel — UX Researcher
- Long hair #4A3728
- Skin #C68642, coral shirt #FB7185, dark pants #1E293B
- Clipboard in right hand
=== MAYA_PATEL_{FRAME_NAME} ===

PROMPT 11 — Remaining employees batch 4 (Chris, Ava, Fran, Jamie, Daniel, Sofia)
Same rules. ONLY <rect> elements.

CHARACTER 1: Chris Park — QA Lead
- Short hair #4A3728
- Skin #F3C5A0, orange shirt #EA580C, dark pants #2D3748
=== CHRIS_PARK_{FRAME_NAME} ===

CHARACTER 2: Ava Thompson — QA Engineer
- Curly hair #92400E
- Skin #FDBCB4, orange-dark shirt #C2410C, dark pants #1E293B
=== AVA_THOMPSON_{FRAME_NAME} ===

CHARACTER 3: Fran Torres — FinOps / Token Monitor
- Bun hairstyle #92400E at top center
- Glasses: two 2x1px #1A1A2E rects row 5 cols 5-6 and 9-10
- Skin #FDBCB4, gold shirt #EAB308, dark pants #1E293B
- SPECIAL: generate FRAN_FAINTED frame — collapsed on desk, head down on arms, ZZZ bubble above
- SPECIAL: generate FRAN_PANICKING frame — running, arms flailing, mouth wide open
=== FRAN_TORRES_{FRAME_NAME} ===

CHARACTER 4: Jamie Park — COO
- Side-swept hair #4A3728
- Skin #C68642, slate shirt #64748B, dark pants #1E293B
=== JAMIE_PARK_{FRAME_NAME} ===

CHARACTER 5: Daniel Osei — Tech Lead
- Short hair #1A1A1A
- Skin #8D5524, blue shirt #3B82F6, dark pants #1E293B
=== DANIEL_OSEI_{FRAME_NAME} ===

CHARACTER 6: Sofia Martinez — Engineering Manager
- Long hair #4A3728 down sides
- Skin #C68642, pink shirt #EC4899, dark pants #1E293B
=== SOFIA_MARTINEZ_{FRAME_NAME} ===

PROMPT 12 — Security Guards
Same rules. ONLY <rect> elements.

CHARACTER 1: Rex — Security Guard
- Short hair #1A1A1A, serious flat mouth expression
- Skin #8D5524
- Dark uniform #1F2937
- Gold security badge: 2x2px #EAB308 at chest col 7-8 row 12
- Flashlight in right hand: 2x2px #FEF08A

SPECIAL frames for Rex:
PATROL_1 through PATROL_4: slow deliberate walking (same as walk but 50% slower feel — wider spacing between positions)
PATROL_STOP: standing, one hand on belt col 10 row 14, other hand at side
NIGHT_PATROL_1: patrol walk with flashlight beam extending 4px right #FEF08A fading to #FEF9C3
ALERT_RUSH_1 through ALERT_RUSH_4: panic run toward left (rushing to security floor)
ALERT_SPEECH: standing, arm raised pointing, alert expression
=== REX_{FRAME_NAME} ===

CHARACTER 2: Dana — Security Guard
- Ponytail #92400E, friendly slight smile
- Skin #FDBCB4
- Dark uniform #1F2937
- Gold security badge: 2x2px #EAB308
- Flashlight same as Rex

SPECIAL frames same as Rex set.
DANA_CHAT_1: talking to late employee, relaxed stance
DANA_CHAT_2: laughing expression
=== DANA_{FRAME_NAME} ===

PROMPT 13 — Special characters
Same rules. ONLY <rect> elements.

CHARACTER 1: Reception Bot — Floor 1 Receptionist
- Rounded head: 10x10px #94A3B8 square with corners softened (remove corner pixels)
- Glowing blue eyes: #60A5FA 2x2px each at row 5 cols 5-6 and 9-10
- Silver body #94A3B8
- Chest screen: 6x6px #0A0A0F with #22C55E smiley face pixels
- No hair, no pants — cylindrical lower body #64748B
- viewBox "0 0 48 72"

Special frames:
BOT_WAVE_1: one arm raised waving
BOT_WAVE_2: arm at different height
BOT_GREET: screen shows different expression #FEF08A happy pixels
=== RECEPTION_BOT_{FRAME_NAME} ===

CHARACTER 2: Kin — Founder (you)
- Short dark hair #1A1A1A
- Skin #C68642 (Filipino skin tone)
- Casual dark hoodie #1E293B
- Small logo pixels on chest: 3x3px #6366F1 at col 7-8 row 13
- Friendly slight smile
- Laptop in left hand: 5x3px #1F2937 with #60A5FA screen pixels

Special frames:
KIN_THINKING: thinking expression, hand at chin
KIN_EXCITED: celebrating, laptop raised
KIN_WORKING: typing on laptop (arms extended forward holding laptop)
KIN_PRESENTING: standing, one arm extended toward right (presenting to team)
=== KIN_{FRAME_NAME} ===

PROMPT 14 — Office furniture (desks and monitors)
Generate pixel art SVG environment sprites using ONLY <rect> elements.

SPRITE 1: standard_desk
viewBox "0 0 180 90"
- Desktop: #92400E 60x12px at y=30
- Left leg: #78350F 6x30px at x=15 y=42
- Right leg: #78350F 6x30px at x=39 y=42
- Monitor frame: #1E293B 30x24px centered at x=15 y=6
- Monitor screen: #60A5FA 24x18px at x=18 y=9
- Keyboard: #374151 24x6px at x=18 y=36
- Mouse: #374151 6x6px at x=45 y=36
- Desk lamp pole: #94A3B8 3x18px at x=54 y=12
- Desk lamp shade: #FEF08A 12x6px at x=48 y=12
=== ENVIRONMENT: standard_desk ===

SPRITE 2: backend_monitor_screen
viewBox "0 0 72 54"
- Background: #0A0A0F full
- Green code lines: horizontal #22C55E 3px tall rectangles at different widths and y positions suggesting scrolling code
- At least 8 lines of varying width (6px to 48px) at 6px intervals
=== ENVIRONMENT: backend_monitor_screen ===

SPRITE 3: security_monitor_screen
viewBox "0 0 72 54"
- Background: #0A0A0F
- Red alert bars: #EF4444 rectangles of different heights suggesting alert graph
- Flashing indicator: #EF4444 6x6px in top right
- Warning lines: smaller red rectangles scattered
=== ENVIRONMENT: security_monitor_screen ===

SPRITE 4: sre_monitor_screen
viewBox "0 0 72 54"
- Background: #0A0A0F
- Orange graph bars: #F59E0B vertical rectangles of different heights from bottom
- Grid lines: #1E293B 1px horizontal lines
- Green normal line: #22C55E 3px horizontal suggesting normal threshold
=== ENVIRONMENT: sre_monitor_screen ===

SPRITE 5: frontend_monitor_screen
viewBox "0 0 72 54"
- Background: #F8FAFC (light — it's a UI mockup)
- Left sidebar: #6366F1 12x54px
- Header bar: #E2E8F0 72x9px at top
- Content rectangles: #CBD5E1 various sizes suggesting UI components
- Button shapes: #6366F1 small rectangles
=== ENVIRONMENT: frontend_monitor_screen ===

SPRITE 6: finops_monitor_screen
viewBox "0 0 72 54"
- Background: #0A0A0F
- Gold number pixels: #EAB308 large pixel-font numbers
- Downward graph line: starts green #22C55E top-right, curves down to red #EF4444 bottom-left
- Budget line: dashed #EF4444 horizontal near bottom
=== ENVIRONMENT: finops_monitor_screen ===

PROMPT 15 — Office furniture (large items)
Generate pixel art SVG environment sprites using ONLY <rect> elements.

SPRITE 1: conference_table
viewBox "0 0 300 120"
- Table top: #92400E 240x48px at x=30 y=36
- Table legs: #78350F 12x36px at x=36 y=84 and x=252 y=84
- Chair top: 7 chairs, #374151 30x6px backs + #4B5563 30x18px seats
- 3 chairs top side (y=18), 3 chairs bottom (y=90), 1 chair each end
- Notepads: #F8FAFC 12x9px scattered on table
- Pens: #1A1A2E 3x9px next to notepads
=== ENVIRONMENT: conference_table ===

SPRITE 2: whiteboard_blank
viewBox "0 0 240 180"
- Frame: #1E293B full 240x180px
- Board: #F8FAFC 224x164px centered
- Marker tray: #94A3B8 240x12px at bottom
- Markers: 6x18px each — #EF4444 #3B82F6 #22C55E #1A1A2E — in tray
=== ENVIRONMENT: whiteboard_blank ===

SPRITE 3: whiteboard_architecture
viewBox "0 0 240 180"
- Same frame and board as blank
- Architecture diagram in dark pixels #1E293B:
  - 3 service boxes: 24x18px rectangles at different positions
  - Arrows between them: 3px wide connecting lines
  - Labels: tiny pixel text above each box
  - Database cylinder: 18x24px rect with oval-approximated top
=== ENVIRONMENT: whiteboard_architecture ===

SPRITE 4: kanban_board
viewBox "0 0 360 240"
- Background: #0D0D17 full
- ADD header: #22C55E 80x18px at x=0 y=0
- REMOVE header: #EF4444 80x18px at x=90 y=0
- IMPROVE header: #F59E0B 80x18px at x=180 y=0
- MAINTAIN header: #3B82F6 80x18px at x=270 y=0
- Column dividers: #1E293B 1x240px at x=89, x=179, x=269
- Sticky cards: #FEF08A 66x36px at various positions in columns
- Card text lines: #4B5563 3px horizontal lines on cards
=== ENVIRONMENT: kanban_board ===

SPRITE 5: coffee_machine
viewBox "0 0 60 90"
- Body: #94A3B8 48x66px at x=6 y=18
- Control panel: #64748B 36x18px at x=12 y=24
- Buttons: 3 small #374151 6x6px in panel
- Nozzle: #374151 6x12px at x=24 y=66
- Cup platform: #64748B 24x6px at x=18 y=78
- Steam frame 1: #D1D5DB 3x3px at x=25 y=12
=== ENVIRONMENT: coffee_machine ===

SPRITE 6: plant
viewBox "0 0 60 90"
- Pot bottom: #92400E 36x24px at x=12 y=66
- Pot top (narrower): #92400E 30x6px at x=15 y=60
- Soil: #78350F 30x6px at x=15 y=60
- Stem 1: #22C55E 3x30px at x=27 y=30
- Stem 2: #22C55E 3x24px at x=21 y=36 angled (shift each row 1px left going up)
- Stem 3: #22C55E 3x20px at x=33 y=40
- Leaves: #16A34A irregular clusters at stem tops
=== ENVIRONMENT: plant ===

PROMPT 16 — Windows and floor elements
Generate pixel art SVG environment sprites using ONLY <rect> elements.

SPRITE 1: window_day
viewBox "0 0 120 90"
- Frame: #1E293B 6px border all sides
- Sky band 1 (top): #BFDBFE 108x18px at x=6 y=6
- Sky band 2: #93C5FD 108x24px at x=6 y=24
- Sky band 3: #60A5FA 108x18px at x=6 y=48
- Sun: #FEF08A 12x12px at x=90 y=12
- Cloud 1: #F8FAFC irregular — use 5 overlapping 9x6px rects at x=15-45 y=18
- Cloud 2: #F8FAFC 3 overlapping rects at x=60-80 y=30
- Building silhouettes: #1E293B rectangles of different heights at x=6 y=60 to bottom
- Building windows: #FEF08A 3x3px scattered on buildings
=== ENVIRONMENT: window_day ===

SPRITE 2: window_night
viewBox "0 0 120 90"
- Background: #0A0A0F full 120x90px
- Stars: #F8FAFC 3x3px at at least 15 scattered positions
- Moon: #FEF9C3 15x15px at x=90 y=6, with #0A0A0F 9x9px at x=96 y=6 (crescent shape)
- Buildings: #1E293B rectangles at bottom 30-50px tall
- Building windows: mix of #FEF08A (lit) and #0A0A0F (dark) 3x3px in grid pattern on buildings
=== ENVIRONMENT: window_night ===

SPRITE 3: window_sunset
viewBox "0 0 120 90"
- Sky bands from top to bottom: #FEF08A 108x12px, #FB923C 108x15px, #F43F5E 108x15px, #7C3AED 108x18px, #1E1B4B 108x6px
- Buildings silhouette: #0A0A0F at bottom
- Street lights: #FEF08A 3x3px at building tops
=== ENVIRONMENT: window_sunset ===

SPRITE 4: window_dawn
viewBox "0 0 120 90"
- Sky bands: #0A0A0F top 108x12px, #1E3A5F 108x12px, #7C3AED 108x12px, #FB923C 108x12px, #FEF08A 108x12px horizon, #FEF9C3 108x6px glow
- Buildings: dark silhouettes at very bottom
=== ENVIRONMENT: window_dawn ===

SPRITE 5: floor_tile
viewBox "0 0 24 24"
- Tile A: #E2E8F0 12x12px at x=0 y=0 and x=12 y=12
- Tile B: #CBD5E1 12x12px at x=12 y=0 and x=0 y=12
- Grout: #94A3B8 1px lines at x=11, x=12, y=11, y=12
=== ENVIRONMENT: floor_tile ===

SPRITE 6: ceiling_light_on
viewBox "0 0 60 30"
- Fixture: #94A3B8 48x6px at x=6 y=0
- Light cone row 1: #FFFBEB 6x3px centered
- Light cone row 2: #FFFBEB 12x3px centered
- Light cone row 3: #FEF9C3 18x3px centered
- Light cone row 4: #FEF9C3 24x3px centered
- Light cone row 5: #FEFCE8 30x3px centered
=== ENVIRONMENT: ceiling_light_on ===

SPRITE 7: elevator_closed
viewBox "0 0 90 120"
- Frame: #1E293B 6px border all sides
- Left door: #374151 36x108px at x=6 y=6
- Right door: #374151 36x108px at x=48 y=6
- Gap: #0A0A0F 3x108px at x=42 y=6
- Call button panel: #94A3B8 12x30px at x=72 y=45
- Lit button: #FEF08A 6x6px at x=75 y=54
- Floor indicator: #FEF08A 3px pixel numbers above doors
=== ENVIRONMENT: elevator_closed ===

SPRITE 8: elevator_open
viewBox "0 0 90 120"
- Frame: #1E293B 6px border
- Left door: #374151 18x108px at x=6 y=6 (half open)
- Right door: #374151 18x108px at x=66 y=6 (half open)
- Interior: #F8FAFC 42x108px at x=24 y=6
- Interior back wall: #E2E8F0 36x96px at x=27 y=12
- Interior light: #FFFBEB 6x6px at x=42 y=12
=== ENVIRONMENT: elevator_open ===

PROMPT 17 — Building exterior
Generate a detailed pixel art building exterior using ONLY SVG <rect> elements.

SPRITE: archco_building_exterior
viewBox "0 0 600 800"

Generate this full building:

FOUNDATION: #374151 600x30px at y=770

MAIN BODY: #1E293B 480x740px at x=60 y=30

SIDE WINGS: #283548 60x400px at x=0 y=370 and x=540 y=370

WINDOW GRID (floors 1-16, 12 columns):
Each window: 24x18px with 6px gaps between
Start at x=90 y=50, increment x by 30, y by 50 per floor
Day windows: #FEF9C3 fill
Night windows alternating: half #FEF9C3, half #0A0A0F
Floor 1 windows: #BFDBFE (reception blue tint)
Floor 4 windows (y=200 area): 3 windows with #EF4444 tint
Top floor windows (y=50): all #FEF08A brightest

BUILDING NAME "ARCHCO":
Pixel font letters at x=220 y=730 in #F8FAFC pixels
Each letter ~18x24px pixel font

COMPANY LOGO (A shape in #6366F1):
Above name at x=270 y=700
3 diagonal lines forming A shape

ENTRANCE:
Double doors: #BFDBFE 36x54px each at x=240 y=716 and x=282 y=716
Gold handles: #EAB308 3x9px on each door
Door frame: #1E293B 6px border

SECURITY BOOTH:
#374151 60x60px at x=480 y=710
Window: #60A5FA 18x18px in booth
Guard silhouette: dark pixels visible in window

TREES (flanking entrance):
Left tree: #16A34A irregular 30x36px blob at x=150 y=710, #78350F 6x24px trunk below
Right tree: same at x=420 y=710

STREET:
#4B5563 600x30px at y=800 (below foundation)
Center dashes: #FEF08A 18x6px at intervals along y=812

PARKING LINES:
#F8FAFC 3x30px vertical lines at x=100,130,160,400,430,460 y=770

=== ENVIRONMENT: archco_building_exterior ===

PROMPT 18 — Effects and particles
Generate pixel art SVG effect sprites using ONLY <rect> elements.

SPRITE 1: confetti_frame_1
viewBox "0 0 300 200"
Generate 25 small 3x3px rectangles in these colors scattered randomly:
#6366F1 #EF4444 #22C55E #F59E0B #A855F7 #06B6D4 #F43F5E #FEF08A
Place them at varied x positions 0-290, y positions 0-180
=== ENVIRONMENT: confetti_frame_1 ===

SPRITE 2: confetti_frame_2
Same as frame 1 but each particle shifted 12px down and 3px sideways (alternating left/right)
=== ENVIRONMENT: confetti_frame_2 ===

SPRITE 3: confetti_frame_3
Same particles shifted another 12px down
=== ENVIRONMENT: confetti_frame_3 ===

SPRITE 4: alarm_flash_on
viewBox "0 0 600 400"
- Single #EF444433 rectangle 600x400px (semi-transparent red overlay)
=== ENVIRONMENT: alarm_flash_on ===

SPRITE 5: alarm_flash_off
viewBox "0 0 600 400"
- Empty SVG (transparent — no rectangles)
=== ENVIRONMENT: alarm_flash_off ===

SPRITE 6: level_up_burst
viewBox "0 0 120 120"
- Center glow: #FEF08A 12x12px at x=54 y=54
- 8 rays radiating outward (N S E W NE NW SE SW):
  North: 3x18px at x=57 y=15
  South: 3x18px at x=57 y=87
  East: 18x3px at x=87 y=57
  West: 18x3px at x=15 y=57
  NE: 9x9px at x=78 y=33 (diagonal approximated)
  NW: 9x9px at x=33 y=33
  SE: 9x9px at x=78 y=78
  SW: 9x9px at x=33 y=78
- Badge: #6366F1 60x18px at x=30 y=96
- Badge text pixels: #F8FAFC small pixels spelling "LEVEL UP"
=== ENVIRONMENT: level_up_burst ===

SPRITE 7: token_graph_healthy
viewBox "0 0 180 90"
- Background: #0A0A0F 180x90px
- Grid lines: #1E293B 1px at y=18,36,54,72
- Token line: #22C55E pixels following high path (y=12 to y=30 range)
- Current marker: #F8FAFC 3x3px at rightmost point
- Budget line: #EF4444 dashed (alternating 6px on 3px off) at y=81
=== ENVIRONMENT: token_graph_healthy ===

SPRITE 8: token_graph_depleting
viewBox "0 0 180 90"
- Same background and grid
- Token line: starts #22C55E at left y=12, transitions to #F59E0B middle y=45, ends #EF4444 right y=72
- Current marker: #EF4444 3x3px at right
- Budget line: same dashed red at y=81
=== ENVIRONMENT: token_graph_depleting ===

SPRITE 9: guard_flashlight
viewBox "0 0 120 60"
- Source: #FEF08A 6x6px at x=0 y=27
- Cone row 1: #FEF08A 6x6px at x=6 y=24
- Cone row 2: #FEF9C3 12x12px at x=12 y=21
- Cone row 3: #FEFCE8 18x18px at x=24 y=18
- Cone row 4: #FFFFF0 24x24px at x=42 y=15
- Outermost: barely visible 30x30px at x=66 y=12 fill="#FFFFF8" opacity="0.3"
=== ENVIRONMENT: guard_flashlight ===

PROMPT 19 — Speech bubbles and UI elements
Generate pixel art SVG UI sprites using ONLY <rect> elements.

SPRITE 1: speech_bubble_empty
viewBox "0 0 90 60"
- Border: #1E293B 2px — create as outer 90x54px rect then inner #F8FAFC 86x50px
- Squared corners (remove 3x3px corner pixels by placing #transparent over them — just don't draw corners)
- Pointer: at bottom-left, 3 stacked dark rects: 9x3px at y=54, 6x3px at y=57, 3x3px at y=60
=== ENVIRONMENT: speech_bubble_empty ===

SPRITE 2: speech_bubble_thinking
viewBox "0 0 90 60"
- Same bubble but rounded with small circles ascending from bottom
- Thought dots: 3x3px #1E293B at x=6 y=57, x=12 y=51, x=18 y=45 (ascending)
- Main bubble: same as speech but positioned higher x=18 y=0
=== ENVIRONMENT: speech_bubble_thinking ===

SPRITE 3: speech_bubble_alert
viewBox "0 0 90 60"
- Same as speech_bubble_empty
- Inside: ! symbol — #EF4444 3x15px vertical at x=42 y=12, 3x3px at x=42 y=33
=== ENVIRONMENT: speech_bubble_alert ===

SPRITE 4: speech_bubble_zzz
viewBox "0 0 90 60"
- Background: transparent
- Z shapes in #94A3B8 in increasing sizes floating upward:
  Small Z at x=6 y=48: 3x3px top, 3x3px diagonal step, 3x3px bottom
  Medium Z at x=18 y=30: 6x3px top, 6x3px step, 6x3px bottom  
  Large Z at x=33 y=6: 9x3px top, 9x3px step, 9x3px bottom
=== ENVIRONMENT: speech_bubble_zzz ===

SPRITE 5: star_burst_effect
viewBox "0 0 60 60"
- Center: #FEF08A 6x6px at x=27 y=27
- 8 rays extending outward:
  N: 3x12px at x=28 y=3
  S: 3x12px at x=28 y=45
  E: 12x3px at x=45 y=28
  W: 12x3px at x=3 y=28
  NE diagonal: 3x3px stepping: x=36,39,42 y=18,15,12
  NW diagonal: x=21,18,15 y=18,15,12
  SE diagonal: x=36,39,42 y=39,42,45
  SW diagonal: x=21,18,15 y=39,42,45
=== ENVIRONMENT: star_burst_effect ===

SPRITE 6: xp_badge
viewBox "0 0 60 24"
- Background: #6366F1 60x24px
- Text pixels: #F8FAFC spelling "XP +" in 3px pixel font
=== ENVIRONMENT: xp_badge ===

SPRITE 7: level_badge
viewBox "0 0 60 24"
- Background: #EAB308 60x24px
- Text pixels: #1A1A2E spelling "LVL" in 3px pixel font
=== ENVIRONMENT: level_badge ===

SPRITE 8: task_badge_critical
viewBox "0 0 90 18"
- Background: #EF4444 90x18px
- Left icon: 6x12px warning triangle #FEF08A at x=3 y=3
- Text pixels: #F8FAFC at x=15
=== ENVIRONMENT: task_badge_critical ===

SPRITE 9: task_badge_normal
viewBox "0 0 90 18"
- Background: #374151 90x18px
- Left dot: #22C55E 6x6px at x=3 y=6
- Text area: x=15
=== ENVIRONMENT: task_badge_normal ===

That's 19 separate prompts. Paste them one at a time into ChatGPT, collect all the SVG output, then paste the whole collection as a document into Claude Code with this instruction:

I have SVG sprite files from ChatGPT. Save each sprite as a separate file in packages/frontend/src/team/archco/sprites/ using the sprite ID as the filename. Then update EmployeeSprite.tsx to import and use the real SVG sprites instead of the programmatically drawn rectangles currently in the file. Map each employee ID to their corresponding sprite files.