import { useState, useEffect, useCallback, useRef } from "react";

const SCENARIOS = [
  {
    id: "thermal_detection",
    title: "Thermal Detection",
    category: "Core",
    difficulty: 1,
    timeLimit: 35,
    description: "You're flying at 800m AGL. Read the scene and identify where the thermal is.",
    scene: {
      clouds: [
        { x: 25, y: 15, type: "active", label: "Crisp Cu" },
        { x: 55, y: 18, type: "decaying", label: "Fuzzy Cu" },
        { x: 80, y: 12, type: "active", label: "Growing Cu" },
      ],
      terrain: [
        { x: 10, y: 85, type: "forest", w: 15, label: "Dense Forest" },
        { x: 28, y: 82, type: "quarry", w: 8, label: "Dark Quarry" },
        { x: 50, y: 85, type: "field_green", w: 18, label: "Green Crops" },
        { x: 75, y: 80, type: "town", w: 14, label: "Small Town" },
      ],
      birds: [{ x: 30, y: 45, circling: true }],
      wind: { direction: "W", speed: 15 },
      pilots: [],
    },
    question: "Where should you fly to find the best thermal?",
    options: [
      { id: "a", text: "Toward the fuzzy decaying cloud over green fields", correct: false, explanation: "Decaying clouds have soft edges — the thermal has disconnected. Green crops are poor thermal triggers (high moisture = slow heating)." },
      { id: "b", text: "Upwind of the crisp Cu, toward the quarry where birds circle", correct: true, explanation: "The crisp Cu marks active lift. Birds circling confirms a thermal. The dark quarry is an excellent trigger (absorbs heat). In westerly wind, the thermal leans east — so fly upwind (west) of the cloud toward the quarry source." },
      { id: "c", text: "Toward the growing Cu over the town", correct: false, explanation: "The town is a good trigger, but it's further away. The bird confirmation near the quarry makes that a higher-confidence choice. In XC, go for confirmed lift over speculative lift when both are available." },
      { id: "d", text: "Straight to the dense forest for ridge lift", correct: false, explanation: "Forests are poor thermal triggers (canopy insulates the ground). There's no ridge mentioned here, so no ridge lift." },
    ],
  },
  {
    id: "launch_timing",
    title: "Launch Timing",
    category: "Pre-Flight",
    difficulty: 1,
    timeLimit: 45,
    description: "You're standing at launch. The windsock shows pulsing cycles. You've timed 3 cycles.",
    scene: {
      windCycles: [
        { time: "0:00", speed: 8, direction: "SSW" },
        { time: "2:30", speed: 18, direction: "SW" },
        { time: "5:00", speed: 6, direction: "SSW" },
        { time: "7:00", speed: 20, direction: "SW" },
        { time: "9:30", speed: 5, direction: "S" },
        { time: "11:00", speed: 22, direction: "WSW" },
        { time: "14:00", speed: 7, direction: "SSW" },
      ],
      launchDirection: "SSW",
      currentTime: "14:00",
      clouds: [
        { x: 40, y: 15, type: "active", label: "Active Cu overhead" },
      ],
      terrain: [],
      birds: [],
      wind: { direction: "SSW", speed: 7 },
      pilots: [{ x: 60, y: 50, climbing: true, label: "Pilot climbing well" }],
    },
    question: "The current time is 14:00, wind is 7 km/h SSW. What do you do?",
    options: [
      { id: "a", text: "Launch immediately — wind is light and from the right direction", correct: false, explanation: "The cycle pattern shows peaks every ~2.5 minutes. At 14:00 you're in a lull. If you launch now, you'll be in the air when the next gust hits — potentially 20+ km/h with a direction shift. Wait to understand the cycle." },
      { id: "b", text: "Wait for the next strong gust to launch in strong wind", correct: false, explanation: "The gusts reach 20+ km/h and shift to WSW — that's cross to your SSW launch direction. Launching in a gust is dangerous: you risk being lifted off before you're ready, and the direction shift could push you sideways." },
      { id: "c", text: "Launch as the wind begins to build from the lull, in the SSW phase", correct: true, explanation: "The pattern shows lulls in SSW (on-heading) building to gusts that shift to SW/WSW. Launch in the building phase — around 10-12 km/h, still SSW. You'll be airborne and established before the gust peak, and can connect with the thermal that's causing the cycle. The climbing pilot confirms conditions are flyable." },
      { id: "d", text: "Don't launch — the wind shifts are too dangerous", correct: false, explanation: "While the shifts are notable, a 30° variation (SSW to SW) is common in thermal conditions. The pilot already climbing well confirms it's flyable. The key is timing your launch correctly within the cycle, not avoiding the conditions entirely." },
    ],
  },
  {
    id: "cloud_reading",
    title: "Cloud Street Strategy",
    category: "XC Navigation",
    difficulty: 2,
    timeLimit: 35,
    description: "You're at cloudbase (1800m) and can see the sky ahead. Three options present themselves.",
    scene: {
      clouds: [
        { x: 15, y: 10, type: "street", label: "Cloud street (crosswind)" },
        { x: 40, y: 8, type: "active", label: "Big isolated Cu" },
        { x: 65, y: 12, type: "street_aligned", label: "Cloud street (on track)" },
      ],
      terrain: [
        { x: 60, y: 85, type: "ridge", w: 25, label: "Ridge line" },
      ],
      birds: [],
      wind: { direction: "NW", speed: 25 },
      pilots: [],
      goalDirection: "East",
    },
    question: "Your goal is EAST. Wind is NW at 25km/h. Which line do you take?",
    options: [
      { id: "a", text: "Fly along the crosswind cloud street", correct: false, explanation: "A crosswind cloud street runs perpendicular to your goal direction. You'd gain altitude but not distance. Cloud streets let you dolphin-fly without stopping, but only if they're aligned with your track." },
      { id: "b", text: "Fly to the big isolated Cu for a strong climb", correct: false, explanation: "An isolated Cu might give a great climb, but then you're back to gliding through sink to find the next one. A cloud street on-track gives continuous lift — far more efficient for distance." },
      { id: "c", text: "Fly along the on-track cloud street, dolphin-flying", correct: true, explanation: "A cloud street aligned with your track is XC gold. You can dolphin-fly (speed up in sink between clouds, slow down in lift under clouds) without stopping to circle. This can double your average speed compared to stop-and-climb thermalling." },
      { id: "d", text: "Fly to the ridge for reliable ridge lift", correct: false, explanation: "Ridge lift is reliable but keeps you low and along the ridge. You're at cloudbase already — using the cloud street maintains your altitude and keeps you on track. Ridge lift is a survival tool when you're low, not a distance strategy when you're high." },
    ],
  },
  {
    id: "sink_management",
    title: "Sink Recognition",
    category: "Decision Making",
    difficulty: 2,
    timeLimit: 30,
    description: "You're gliding between thermals at 1200m. Your vario has been showing -2.5 m/s for 30 seconds. Normal sink rate for your glider at trim is -1.2 m/s.",
    scene: {
      clouds: [
        { x: 70, y: 15, type: "active", label: "Active Cu ahead" },
        { x: 30, y: 20, type: "decaying", label: "Decaying Cu behind" },
      ],
      terrain: [
        { x: 45, y: 80, type: "field_dark", w: 12, label: "Dark field below" },
      ],
      birds: [],
      wind: { direction: "W", speed: 20 },
      pilots: [{ x: 72, y: 40, climbing: true, label: "Pilot climbing at Cu" }],
      vario: -2.5,
      altitude: 1200,
    },
    question: "You're in -2.5 m/s (1.3 m/s worse than expected). What do you do?",
    options: [
      { id: "a", text: "Slow down to minimum sink speed to conserve altitude", correct: false, explanation: "WRONG — slowing down in sink means you spend MORE time in the sinking air. You lose more total altitude. Speed-to-fly theory says: fly FAST through sink to escape it quickly." },
      { id: "b", text: "Speed up to best glide or faster and push through to the active Cu", correct: true, explanation: "Correct. Push the bar, increase speed, and get through the sink zone as fast as possible. The pilot climbing at the active Cu ahead confirms lift exists there. Every second spent in -2.5 m/s sink costs you altitude — minimize that time by flying fast." },
      { id: "c", text: "Turn around and go back to the decaying cloud", correct: false, explanation: "The cloud behind is decaying — soft edges, losing structure. There's likely no lift there anymore, and possibly sink beneath it. Going backward wastes distance and time." },
      { id: "d", text: "Circle to search for lift in the dark field below", correct: false, explanation: "At 1200m with an active thermal confirmed ahead, circling over a speculative trigger wastes time. The dark field might produce a thermal, but you have a CONFIRMED climb ahead. Go for certainty." },
    ],
  },
  {
    id: "gaggle_tactics",
    title: "Gaggle Decision",
    category: "Tactics",
    difficulty: 3,
    timeLimit: 35,
    description: "You arrive at a thermal where 6 pilots are circling. You're in a comp. The thermal is giving +2 m/s. Average for the day has been +3.5 m/s. You're at 1000m, cloudbase is 2000m. You can see a fresh Cu developing 5km ahead on your course line.",
    scene: {
      clouds: [
        { x: 35, y: 15, type: "active", label: "Cu here (6 pilots)" },
        { x: 75, y: 10, type: "developing", label: "Fresh Cu developing" },
      ],
      terrain: [
        { x: 50, y: 85, type: "ridge", w: 20, label: "Low ridge" },
      ],
      birds: [],
      wind: { direction: "W", speed: 18 },
      pilots: [
        { x: 33, y: 35, climbing: true, label: "Gaggle: 6 pilots" },
      ],
      altitude: 1000,
      cloudbase: 2000,
    },
    question: "Do you stop and thermal with the gaggle or push on?",
    options: [
      { id: "a", text: "Join the gaggle and climb to cloudbase", correct: false, explanation: "At +2 m/s in a day averaging +3.5, this is a below-average thermal. Climbing 1000m at 2 m/s takes ~8 minutes. The gaggle will also make centring harder (crowded thermal). The fresh Cu ahead likely offers a stronger climb." },
      { id: "b", text: "Take a few turns to gain 200-300m, then leave for the fresh Cu", correct: true, explanation: "Smart compromise. Take enough height to ensure you can reach the fresh Cu with margin (5km glide from 1200-1300m is comfortable). Don't waste time climbing to cloudbase in a weak thermal when a stronger one is developing on course. This is the 'conservative aggression' of elite XC." },
      { id: "c", text: "Ignore the thermal completely and glide straight to the fresh Cu", correct: false, explanation: "Risky. At 1000m, a 5km glide into headwind may leave you very low if the fresh Cu doesn't produce. Taking a few turns first gives you insurance altitude. Never gamble your flight on a single unconfirmed thermal." },
      { id: "d", text: "Wait for other gaggle pilots to leave and follow them", correct: false, explanation: "Passive strategy. You're in a comp — time matters. The other pilots might be less experienced or making poor decisions. Trust your own observation: the fresh Cu is a better bet, and acting on it first gives you position advantage." },
    ],
  },
  {
    id: "wing_feedback",
    title: "Wing Feedback Reading",
    category: "Micro-Observation",
    difficulty: 2,
    timeLimit: 25,
    description: "You're flying straight on a glide. Suddenly: your left brake feels heavier, the wing pitches slightly forward, and you feel a slight push upward in your harness. Your vario hasn't reacted yet.",
    scene: {
      clouds: [
        { x: 50, y: 15, type: "active", label: "Cu" },
      ],
      terrain: [],
      birds: [],
      wind: { direction: "W", speed: 15 },
      pilots: [],
      wingFeedback: {
        leftBrake: "heavy",
        rightBrake: "normal",
        pitch: "forward",
        harness: "push up",
      },
    },
    question: "What is happening and what should you do?",
    options: [
      { id: "a", text: "Turbulence — apply both brakes to stabilise", correct: false, explanation: "This isn't random turbulence. The asymmetric brake pressure, pitch-up, and upward push are classic thermal entry signals. Braking both sides would slow you down at the worst moment." },
      { id: "b", text: "Thermal on the left — turn left immediately", correct: true, explanation: "The heavier left brake means higher airspeed/pressure on the left side = lift is to your left. The pitch forward means the wing has been accelerated by rising air. The upward harness push is the 'elevator' sensation of entering lift. Turn LEFT now — don't wait for the vario. You've just detected a thermal 1-3 seconds before your instruments." },
      { id: "c", text: "Thermal on the right — turn right toward the lighter side", correct: false, explanation: "Backwards. Heavier brake = MORE pressure = MORE airflow = LIFT on that side. The thermal is LEFT. Think of it as the wing being 'pushed up' harder on the left, creating more apparent wind on that side." },
      { id: "d", text: "Wind gust — hold course and wait for vario confirmation", correct: false, explanation: "Waiting for vario confirmation wastes 1-3 seconds of thermal detection advantage. Elite pilots react to wing feedback BEFORE instruments confirm. The asymmetric nature (left only) confirms this is localised lift, not a uniform gust." },
    ],
  },
  {
    id: "overdevelopment",
    title: "Overdevelopment Warning",
    category: "Safety",
    difficulty: 3,
    timeLimit: 30,
    description: "It's 14:30 on a strong day. You're at 1600m, 40km into an XC. You notice: clouds ahead are growing vertically fast, bases are darkening, a cloud to the north has developed an anvil shape. The wind at your altitude has shifted 40° in the last 15 minutes.",
    scene: {
      clouds: [
        { x: 30, y: 8, type: "overdeveloping", label: "Dark base, growing fast" },
        { x: 60, y: 5, type: "anvil", label: "Anvil shape (Cb)" },
        { x: 80, y: 15, type: "active", label: "Still active Cu" },
      ],
      terrain: [],
      birds: [],
      wind: { direction: "SW→W", speed: 30 },
      pilots: [],
      altitude: 1600,
    },
    question: "What is the correct response?",
    options: [
      { id: "a", text: "Push on — the active Cu to the east still looks good", correct: false, explanation: "DANGEROUS. Anvil clouds = cumulonimbus = thunderstorm. The 40° wind shift means the storm's outflow is already affecting your area. A Cb can produce violent sink (>10 m/s), extreme turbulence, lightning, hail, and gust fronts. 'It still looks okay ahead' has killed pilots." },
      { id: "b", text: "Climb as high as possible to have maximum altitude margin", correct: false, explanation: "DANGEROUS. Climbing toward overdeveloping clouds risks being sucked into the cloud base by powerful updrafts. Cloud suck near a Cb can be uncontrollable. You need to get DOWN and AWAY, not up." },
      { id: "c", text: "Immediately begin landing — head for the nearest safe landing field away from the storm track", correct: true, explanation: "Correct. This is a survival situation, not an XC situation. The anvil confirms Cb development. The wind shift confirms outflow is reaching you. Land NOW while you still can. Choose a field AWAY from the storm's direction of travel. A Cb can produce a gust front that reaches you 20-30km away. Don't try to fly around it." },
      { id: "d", text: "Fly south to get around the storm and continue the XC", correct: false, explanation: "Storms can move at 40-60 km/h. You can't outrun one, and flying near a Cb is extremely dangerous even at distance. Gust fronts, mammatus turbulence, and rain can extend far from the visible storm. The only safe choice is to land immediately." },
    ],
  },
  {
    id: "speed_to_fly",
    title: "Speed-to-Fly Decision",
    category: "XC Efficiency",
    difficulty: 3,
    timeLimit: 35,
    description: "Strong day. Average climb rate: 4 m/s. You're at cloudbase (2200m). Your next thermal trigger is 12km ahead. Your glider's best L/D is 10:1 at 38 km/h, but 8:1 at 50 km/h. Wind is a 10 km/h headwind. There's a weak thermal (est. +1.5 m/s) 4km ahead, and a stronger one (est. +4 m/s) at the 12km trigger.",
    scene: {
      clouds: [
        { x: 30, y: 15, type: "wispy", label: "Weak Cu (est. +1.5)" },
        { x: 80, y: 10, type: "active", label: "Strong Cu (est. +4)" },
      ],
      terrain: [
        { x: 78, y: 82, type: "quarry", w: 8, label: "Quarry trigger" },
      ],
      birds: [],
      wind: { direction: "W", speed: 10, headwind: true },
      pilots: [],
      altitude: 2200,
      cloudbase: 2200,
    },
    question: "How do you fly this 12km leg?",
    options: [
      { id: "a", text: "Fly at best L/D (38 km/h) to maximise glide range, stop at both thermals", correct: false, explanation: "On a strong day (4 m/s average climbs), stopping in a +1.5 thermal wastes time. At 38 km/h groundspeed (28 km/h effective into headwind), this 12km takes 25+ minutes. Time is distance in XC." },
      { id: "b", text: "Fly fast (50+ km/h), skip the weak thermal, push to the strong one", correct: true, explanation: "MacCready theory: on a 4 m/s day, you should skip any thermal below ~3 m/s. The weak thermal at +1.5 is well below your threshold. Flying fast (50+ km/h) costs glide ratio but saves time. From 2200m with 8:1 effective glide into 10 km/h headwind, you can reach the 12km trigger with adequate margin. Time saved = distance gained over the whole flight." },
      { id: "c", text: "Fly at best L/D, skip the weak thermal, coast to the strong one", correct: false, explanation: "Flying slowly through sink between thermals is the classic intermediate error. You spend more time in sinking air, losing more total altitude. Speed-to-fly says: fly fast in sink, slow in lift. If conditions are strong, fly fast between thermals." },
      { id: "d", text: "Fly fast, but stop at the weak thermal to top up just in case", correct: false, explanation: "'Just in case' thermalling in weak lift is the biggest time-waster in XC. At +1.5 m/s, gaining 500m takes over 5 minutes. In that time at 50 km/h, you'd cover 4+ km. The strong thermal ahead will give you that 500m in just over 2 minutes. Trust your plan." },
    ],
  },
  {
    id: "convergence",
    title: "Convergence Line",
    category: "Advanced",
    difficulty: 3,
    timeLimit: 35,
    description: "You're flying in the afternoon near the coast. You notice: a distinct line of Cu running parallel to the coast about 8km inland. Upwind of this line, clouds are sparse. Downwind (seaward), it's blue. Wind at the surface has been backing (shifting anticlockwise) over the last hour. You feel a distinct temperature drop.",
    scene: {
      clouds: [
        { x: 20, y: 12, type: "line", label: "Distinct Cu line" },
        { x: 22, y: 16, type: "line", label: "" },
        { x: 24, y: 11, type: "line", label: "" },
        { x: 50, y: 30, type: "none", label: "Blue (no cloud)" },
      ],
      terrain: [
        { x: 85, y: 85, type: "coast", w: 15, label: "Coastline" },
      ],
      birds: [],
      wind: { direction: "backing", speed: 12, seaBreeze: true },
      pilots: [],
    },
    question: "What are you observing and how should you fly?",
    options: [
      { id: "a", text: "It's just a cloud street — fly along it on course", correct: false, explanation: "Cloud streets align WITH the wind. This line is perpendicular to the wind flow (parallel to coast with onshore wind). The temperature drop and wind backing are sea breeze signatures, not cloud street indicators." },
      { id: "b", text: "Sea breeze convergence — fly along the Cu line for continuous strong lift", correct: true, explanation: "Classic sea breeze front. The cool maritime air pushes inland, undercutting the warm thermal air. Where they meet, the warm air is forced up violently, creating a convergence line marked by the Cu. Flying ALONG this line gives continuous, often powerful lift without circling. The backing wind and temperature drop confirm the front has reached you. This is one of the most powerful lift sources in paragliding." },
      { id: "c", text: "Approaching front — land immediately for safety", correct: false, explanation: "A sea breeze front is not a weather front. It's a local phenomenon caused by differential heating of land and sea. While it can produce strong lift and turbulence at the boundary, it's not inherently dangerous — in fact, experienced pilots actively seek convergence lines for long flights." },
      { id: "d", text: "Fly seaward (toward the blue) to stay clear of the clouds", correct: false, explanation: "Seaward of the convergence, the cool marine air has killed thermal activity — that's why it's blue. You'll find only sink and stable air. The lift is AT the convergence line, not beyond it." },
    ],
  },
  {
    id: "low_save",
    title: "Low Save Tactics",
    category: "Survival",
    difficulty: 2,
    timeLimit: 30,
    description: "You've fallen to 300m AGL after crossing a valley. There's a south-facing rocky slope to your east (200m away), a flat harvested wheat field below you, and a road with a car park to your west. Wind is light from the south (8 km/h). Time is 13:30 on a summer day.",
    scene: {
      clouds: [
        { x: 50, y: 20, type: "wispy", label: "Thin wisp forming" },
      ],
      terrain: [
        { x: 65, y: 75, type: "cliff_south", w: 12, label: "S-facing rocks" },
        { x: 40, y: 85, type: "field_dry", w: 15, label: "Harvested field" },
        { x: 20, y: 85, type: "town", w: 10, label: "Car park" },
      ],
      birds: [{ x: 63, y: 60, circling: false }],
      wind: { direction: "S", speed: 8 },
      pilots: [],
      altitude: 300,
    },
    question: "At 300m AGL in light south wind — where's your best chance?",
    options: [
      { id: "a", text: "Circle over the harvested field hoping for a thermal", correct: false, explanation: "Circling in hope without thermal indicators wastes your precious 300m. The field MIGHT produce a thermal, but at 300m you can't afford to gamble on 'might.' You need the highest-probability lift source." },
      { id: "b", text: "Fly to the south-facing rocks — they combine thermal trigger and ridge lift potential", correct: true, explanation: "South-facing rocks in a south wind at 13:30 in summer — this is the triple combination: solar-heated rock face produces thermals, south wind provides ridge lift on the south face, and the slope amplifies both. Even 8 km/h south wind on a sun-baked cliff face can produce usable lift. The wisp forming above confirms thermal activity. At 300m and 200m away, you can reach it with altitude to spare." },
      { id: "c", text: "Head to the car park — dark tarmac is a good thermal trigger", correct: false, explanation: "Car parks can trigger thermals, but a car park in light wind will produce small, weak thermals. The south-facing rocks are a dramatically more powerful trigger, especially when wind reinforces them. At 300m AGL, you go for the strongest source." },
      { id: "d", text: "Fly figure-8s to cover more ground and search for lift", correct: false, explanation: "Figure-8 searching wastes altitude through constant turning. At 300m, every turn costs you 5-10m. You need a directed plan — fly TO the best lift source, not randomly around hoping to hit one." },
    ],
  },
];

const CATEGORIES = ["All", "Core", "Pre-Flight", "XC Navigation", "Decision Making", "Tactics", "Micro-Observation", "Safety", "XC Efficiency", "Advanced", "Survival"];

function SceneRenderer({ scene, compact }) {
  const h = compact ? 420 : 500;
  return (
    <svg viewBox="0 0 100 100" className="w-full" style={{ height: h, background: "linear-gradient(180deg, #1a3a5c 0%, #4a8bc2 25%, #7bb8e8 50%, #a8d4a0 75%, #6b8f5e 100%)" }}>
      {scene.clouds?.map((c, i) => {
        const colors = {
          active: "#fff",
          decaying: "#b0b0b0",
          developing: "#e8e8ff",
          overdeveloping: "#505050",
          anvil: "#383838",
          street: "#e8e8e8",
          street_aligned: "#fff",
          wispy: "#d0d8e8",
          line: "#eee",
          none: "transparent",
        };
        const fill = colors[c.type] || "#fff";
        if (c.type === "none") return null;
        if (c.type === "anvil") {
          return (
            <g key={i}>
              <ellipse cx={c.x} cy={c.y} rx={8} ry={2.5} fill={fill} opacity={0.9} />
              <rect x={c.x - 2} y={c.y} width={4} height={8} fill="#444" opacity={0.8} />
              <ellipse cx={c.x} cy={c.y + 8} rx={5} ry={2.5} fill="#3a3a3a" opacity={0.85} />
              {c.label && <text x={c.x} y={c.y - 5} textAnchor="middle" fill="#ffcc00" fontSize="2.3" fontWeight="bold">{c.label}</text>}
            </g>
          );
        }
        if (c.type === "overdeveloping") {
          return (
            <g key={i}>
              <ellipse cx={c.x} cy={c.y + 3} rx={6} ry={2} fill="#333" opacity={0.7} />
              <ellipse cx={c.x} cy={c.y} rx={5} ry={4} fill={fill} opacity={0.85} />
              {c.label && <text x={c.x} y={c.y - 6} textAnchor="middle" fill="#ff6644" fontSize="2.2" fontWeight="bold">{c.label}</text>}
            </g>
          );
        }
        return (
          <g key={i}>
            <ellipse cx={c.x} cy={c.y + 1.5} rx={5} ry={1.5} fill="rgba(0,0,0,0.1)" />
            <ellipse cx={c.x - 2} cy={c.y} rx={3} ry={2.2} fill={fill} opacity={c.type === "wispy" ? 0.4 : 0.9} />
            <ellipse cx={c.x + 1.5} cy={c.y - 0.8} rx={3.5} ry={2.5} fill={fill} opacity={c.type === "wispy" ? 0.35 : 0.85} />
            <ellipse cx={c.x + 4} cy={c.y + 0.3} rx={2.5} ry={1.8} fill={fill} opacity={c.type === "wispy" ? 0.3 : 0.8} />
            {c.label && <text x={c.x} y={c.y - 4.5} textAnchor="middle" fill="#fff" fontSize="2" fontWeight="600" style={{ textShadow: "0 0 3px rgba(0,0,0,0.6)" }}>{c.label}</text>}
          </g>
        );
      })}
      {scene.terrain?.map((t, i) => {
        const colors = {
          forest: "#2d5a27",
          quarry: "#4a4036",
          field_green: "#5a8a4a",
          field_dark: "#3a3020",
          field_dry: "#a89060",
          town: "#8a7060",
          ridge: "#6a6a5a",
          coast: "#4488aa",
          cliff_south: "#8a7a60",
        };
        return (
          <g key={i}>
            <rect x={t.x} y={t.y} width={t.w} height={12} fill={colors[t.type] || "#777"} rx={1} opacity={0.9} />
            {t.label && <text x={t.x + t.w / 2} y={t.y + 7} textAnchor="middle" fill="#fff" fontSize="2" fontWeight="500">{t.label}</text>}
          </g>
        );
      })}
      {scene.birds?.map((b, i) => (
        <g key={i}>
          {b.circling ? (
            <>
              <circle cx={b.x} cy={b.y} r={3} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={0.3} strokeDasharray="1 1">
                <animateTransform attributeName="transform" type="rotate" from={`0 ${b.x} ${b.y}`} to={`360 ${b.x} ${b.y}`} dur="4s" repeatCount="indefinite" />
              </circle>
              <text x={b.x + 2} y={b.y - 1} fontSize="3" fill="#222">🦅</text>
              <text x={b.x} y={b.y + 6} textAnchor="middle" fill="#ffe066" fontSize="1.8" fontWeight="bold">Bird circling</text>
            </>
          ) : (
            <text x={b.x} y={b.y} fontSize="2.5" fill="#333">🐦</text>
          )}
        </g>
      ))}
      {scene.pilots?.map((p, i) => (
        <g key={i}>
          <text x={p.x} y={p.y} fontSize="3.5">🪂</text>
          {p.climbing && (
            <line x1={p.x + 1.5} y1={p.y + 1} x2={p.x + 1.5} y2={p.y - 5} stroke="#00ff88" strokeWidth={0.4} strokeDasharray="0.8 0.5">
              <animate attributeName="y2" values={`${p.y - 3};${p.y - 6};${p.y - 3}`} dur="2s" repeatCount="indefinite" />
            </line>
          )}
          {p.label && <text x={p.x} y={p.y + 5} textAnchor="middle" fill="#aaffaa" fontSize="1.8" fontWeight="600">{p.label}</text>}
        </g>
      ))}
      {scene.wind && (
        <g>
          <rect x={2} y={2} width={18} height={7} rx={1} fill="rgba(0,0,0,0.5)" />
          <text x={3} y={5.5} fill="#88ccff" fontSize="2" fontWeight="bold">Wind: {typeof scene.wind.direction === 'string' ? scene.wind.direction : ''}</text>
          <text x={3} y={8} fill="#aaddff" fontSize="1.8">{scene.wind.speed} km/h{scene.wind.headwind ? " (headwind)" : ""}</text>
        </g>
      )}
      {scene.altitude && (
        <g>
          <rect x={78} y={2} width={20} height={scene.cloudbase ? 9 : 5} rx={1} fill="rgba(0,0,0,0.5)" />
          <text x={79} y={5.5} fill="#ffcc44" fontSize="2" fontWeight="bold">ALT: {scene.altitude}m</text>
          {scene.cloudbase && <text x={79} y={9} fill="#aaaaff" fontSize="1.8">CB: {scene.cloudbase}m</text>}
        </g>
      )}
    </svg>
  );
}

function WindCycleChart({ cycles }) {
  if (!cycles) return null;
  const maxSpeed = Math.max(...cycles.map(c => c.speed));
  return (
    <div className="my-3 p-3 rounded-lg" style={{ background: "rgba(20,30,50,0.6)" }}>
      <div className="text-xs font-semibold mb-2" style={{ color: "#88ccff" }}>Wind Cycle Log</div>
      <svg viewBox="0 0 200 60" className="w-full" style={{ height: 80 }}>
        {cycles.map((c, i) => {
          const x = (i / (cycles.length - 1)) * 180 + 10;
          const h = (c.speed / maxSpeed) * 40;
          return (
            <g key={i}>
              <rect x={x - 5} y={50 - h} width={10} height={h} fill={c.speed > 18 ? "#ff6644" : c.speed > 12 ? "#ffaa44" : "#44cc88"} rx={1} opacity={0.85} />
              <text x={x} y={57} textAnchor="middle" fill="#aaa" fontSize="5">{c.time}</text>
              <text x={x} y={47 - h} textAnchor="middle" fill="#ddd" fontSize="4.5">{c.speed}</text>
              <text x={x} y={43 - h} textAnchor="middle" fill="#88aacc" fontSize="3.5">{c.direction}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Timer({ seconds, running, onTimeout }) {
  const [left, setLeft] = useState(seconds);
  const intervalRef = useRef(null);
  useEffect(() => {
    setLeft(seconds);
    if (running) {
      intervalRef.current = setInterval(() => {
        setLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            onTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [seconds, running]);

  const pct = (left / seconds) * 100;
  const color = pct > 50 ? "#44cc88" : pct > 25 ? "#ffaa44" : "#ff4444";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color, transition: "width 1s linear" }} />
      </div>
      <span className="text-sm font-mono font-bold" style={{ color }}>{left}s</span>
    </div>
  );
}

export default function ParaglidingObservationSim() {
  const [screen, setScreen] = useState("menu");
  const [currentScenario, setCurrentScenario] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [stats, setStats] = useState({ correct: 0, wrong: 0, timedOut: 0, streak: 0, bestStreak: 0 });
  const [completedIds, setCompletedIds] = useState(new Set());
  const [filterCat, setFilterCat] = useState("All");
  const [challengeMode, setChallengeMode] = useState(false);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [quizResults, setQuizResults] = useState([]);

  const startScenario = useCallback((scenario) => {
    setCurrentScenario(scenario);
    setSelectedAnswer(null);
    setAnswered(false);
    setTimedOut(false);
    setTimerRunning(true);
    setScreen("scenario");
  }, []);

  const handleAnswer = useCallback((option) => {
    if (answered || timedOut) return;
    setSelectedAnswer(option.id);
    setAnswered(true);
    setTimerRunning(false);
    const isCorrect = option.correct;
    setStats(prev => ({
      ...prev,
      correct: prev.correct + (isCorrect ? 1 : 0),
      wrong: prev.wrong + (isCorrect ? 0 : 1),
      streak: isCorrect ? prev.streak + 1 : 0,
      bestStreak: isCorrect ? Math.max(prev.bestStreak, prev.streak + 1) : prev.bestStreak,
    }));
    setCompletedIds(prev => new Set([...prev, currentScenario.id]));
    if (challengeMode) {
      setQuizResults(prev => [...prev, { scenario: currentScenario, answer: option, correct: isCorrect }]);
    }
  }, [answered, timedOut, currentScenario, challengeMode]);

  const handleTimeout = useCallback(() => {
    if (!answered) {
      setTimedOut(true);
      setTimerRunning(false);
      setStats(prev => ({ ...prev, timedOut: prev.timedOut + 1, streak: 0 }));
      if (challengeMode) {
        setQuizResults(prev => [...prev, { scenario: currentScenario, answer: null, correct: false, timedOut: true }]);
      }
    }
  }, [answered, currentScenario, challengeMode]);

  const nextScenario = useCallback(() => {
    if (challengeMode) {
      const next = challengeIndex + 1;
      if (next >= SCENARIOS.length) {
        setScreen("results");
      } else {
        setChallengeIndex(next);
        startScenario(SCENARIOS[next]);
      }
    } else {
      setScreen("menu");
    }
  }, [challengeMode, challengeIndex, startScenario]);

  const startChallenge = useCallback(() => {
    setChallengeMode(true);
    setChallengeIndex(0);
    setQuizResults([]);
    setStats({ correct: 0, wrong: 0, timedOut: 0, streak: 0, bestStreak: 0 });
    startScenario(SCENARIOS[0]);
  }, [startScenario]);

  const filtered = filterCat === "All" ? SCENARIOS : SCENARIOS.filter(s => s.category === filterCat);
  const totalAnswered = stats.correct + stats.wrong + stats.timedOut;

  if (screen === "results") {
    const score = stats.correct;
    const total = SCENARIOS.length;
    const pct = Math.round((score / total) * 100);
    const grade = pct >= 90 ? "Elite XC Pilot" : pct >= 70 ? "Competent XC Pilot" : pct >= 50 ? "Developing Pilot" : "Keep Training";
    const gradeColor = pct >= 90 ? "#44ffaa" : pct >= 70 ? "#88ccff" : pct >= 50 ? "#ffaa44" : "#ff6644";
    return (
      <div className="min-h-screen p-4" style={{ background: "linear-gradient(135deg, #0a1628 0%, #162a4a 50%, #1a3355 100%)", color: "#e0e8f0", fontFamily: "'Avenir Next', 'Segoe UI', sans-serif" }}>
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🏆</div>
            <h1 className="text-2xl font-bold" style={{ color: gradeColor }}>{grade}</h1>
            <p className="text-5xl font-bold mt-3" style={{ color: gradeColor }}>{pct}%</p>
            <p className="text-sm mt-1 opacity-70">{score} / {total} correct</p>
          </div>
          <div className="space-y-2 mb-6">
            {quizResults.map((r, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded" style={{ background: r.correct ? "rgba(68,204,136,0.15)" : "rgba(255,68,68,0.15)" }}>
                <span>{r.correct ? "✅" : r.timedOut ? "⏰" : "❌"}</span>
                <span className="text-sm flex-1">{r.scenario.title}</span>
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.1)" }}>{r.scenario.category}</span>
              </div>
            ))}
          </div>
          <button onClick={() => { setScreen("menu"); setChallengeMode(false); }} className="w-full py-3 rounded-lg font-bold text-lg" style={{ background: "linear-gradient(135deg, #2a6cb8, #1a4a8a)", color: "#fff" }}>
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  if (screen === "scenario" && currentScenario) {
    const s = currentScenario;
    return (
      <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0a1628 0%, #162a4a 50%, #1a3355 100%)", color: "#e0e8f0", fontFamily: "'Avenir Next', 'Segoe UI', sans-serif" }}>
        <div className="max-w-2xl mx-auto p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(68,136,204,0.3)", color: "#88ccff" }}>{s.category}</span>
              <span className="text-xs opacity-50">{"★".repeat(s.difficulty)}{"☆".repeat(3 - s.difficulty)}</span>
            </div>
            {challengeMode && <span className="text-xs opacity-50">{challengeIndex + 1} / {SCENARIOS.length}</span>}
          </div>

          <h2 className="text-lg font-bold mb-2" style={{ color: "#aaddff" }}>{s.title}</h2>
          <p className="text-sm mb-3 leading-relaxed opacity-80">{s.description}</p>

          <div className="rounded-xl overflow-hidden mb-2" style={{ border: "1px solid rgba(136,204,255,0.15)" }}>
            <SceneRenderer scene={s.scene} compact />
          </div>

          {s.scene.windCycles && <WindCycleChart cycles={s.scene.windCycles} />}

          <div className="mb-3">
            <Timer seconds={s.timeLimit} running={timerRunning} onTimeout={handleTimeout} />
          </div>

          <div className="p-3 rounded-lg mb-3" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(136,204,255,0.1)" }}>
            <p className="text-sm font-semibold" style={{ color: "#ffdd88" }}>{s.question}</p>
          </div>

          {timedOut && !answered && (
            <div className="p-3 rounded-lg mb-3" style={{ background: "rgba(255,68,68,0.15)", border: "1px solid rgba(255,68,68,0.3)" }}>
              <p className="text-sm font-bold" style={{ color: "#ff8866" }}>⏰ Time's up! In real flying, hesitation costs altitude.</p>
              <p className="text-xs mt-1 opacity-70">The correct answer was: {s.options.find(o => o.correct)?.text}</p>
              <p className="text-xs mt-2 opacity-80">{s.options.find(o => o.correct)?.explanation}</p>
            </div>
          )}

          <div className="space-y-2 mb-4">
            {s.options.map((opt) => {
              let bg = "rgba(255,255,255,0.05)";
              let border = "rgba(136,204,255,0.1)";
              let labelColor = "#88ccff";
              if (answered || timedOut) {
                if (opt.correct) { bg = "rgba(68,204,136,0.15)"; border = "rgba(68,204,136,0.4)"; labelColor = "#44cc88"; }
                else if (opt.id === selectedAnswer && !opt.correct) { bg = "rgba(255,68,68,0.15)"; border = "rgba(255,68,68,0.4)"; labelColor = "#ff6644"; }
                else { bg = "rgba(255,255,255,0.02)"; }
              }
              return (
                <button key={opt.id} onClick={() => handleAnswer(opt)} disabled={answered || timedOut}
                  className="w-full text-left p-3 rounded-lg transition-all"
                  style={{ background: bg, border: `1px solid ${border}`, opacity: (answered || timedOut) && !opt.correct && opt.id !== selectedAnswer ? 0.4 : 1, cursor: answered || timedOut ? "default" : "pointer" }}>
                  <div className="flex gap-2">
                    <span className="font-bold text-sm" style={{ color: labelColor }}>{opt.id.toUpperCase()}</span>
                    <span className="text-sm">{opt.text}</span>
                  </div>
                  {(answered || timedOut) && (opt.correct || opt.id === selectedAnswer) && (
                    <p className="text-xs mt-2 pl-5 leading-relaxed" style={{ color: opt.correct ? "#88ddaa" : "#ffaa88" }}>{opt.explanation}</p>
                  )}
                </button>
              );
            })}
          </div>

          {(answered || timedOut) && (
            <button onClick={nextScenario} className="w-full py-3 rounded-lg font-bold"
              style={{ background: "linear-gradient(135deg, #2a6cb8, #1a4a8a)", color: "#fff" }}>
              {challengeMode && challengeIndex < SCENARIOS.length - 1 ? "Next Scenario →" : challengeMode ? "See Results" : "Back to Menu"}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0a1628 0%, #162a4a 50%, #1a3355 100%)", color: "#e0e8f0", fontFamily: "'Avenir Next', 'Segoe UI', sans-serif" }}>
      <div className="max-w-2xl mx-auto p-4">
        <div className="text-center mb-6">
          <div className="text-3xl mb-1">🪂</div>
          <h1 className="text-xl font-bold" style={{ color: "#aaddff" }}>Observation Simulator</h1>
          <p className="text-xs opacity-50 mt-1">Train your eyes to see the invisible air</p>
        </div>

        {totalAnswered > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { label: "Correct", val: stats.correct, color: "#44cc88" },
              { label: "Wrong", val: stats.wrong, color: "#ff6644" },
              { label: "Timed Out", val: stats.timedOut, color: "#ffaa44" },
              { label: "Best Streak", val: stats.bestStreak, color: "#88ccff" },
            ].map(s => (
              <div key={s.label} className="text-center p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.05)" }}>
                <div className="text-lg font-bold" style={{ color: s.color }}>{s.val}</div>
                <div className="text-xs opacity-50">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <button onClick={startChallenge} className="w-full py-3 rounded-xl font-bold text-base mb-4"
          style={{ background: "linear-gradient(135deg, #cc6622, #aa4400)", color: "#fff", boxShadow: "0 4px 20px rgba(204,102,34,0.3)" }}>
          🔥 Full Challenge — All {SCENARIOS.length} Scenarios (Timed)
        </button>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setFilterCat(cat)} className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
              style={{ background: filterCat === cat ? "rgba(68,136,204,0.4)" : "rgba(255,255,255,0.05)", color: filterCat === cat ? "#aaddff" : "#889aaa", border: `1px solid ${filterCat === cat ? "rgba(68,136,204,0.5)" : "transparent"}` }}>
              {cat}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {filtered.map(s => (
            <button key={s.id} onClick={() => { setChallengeMode(false); startScenario(s); }}
              className="w-full text-left p-3 rounded-lg transition-all"
              style={{ background: completedIds.has(s.id) ? "rgba(68,204,136,0.08)" : "rgba(255,255,255,0.04)", border: `1px solid ${completedIds.has(s.id) ? "rgba(68,204,136,0.2)" : "rgba(136,204,255,0.08)"}` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {completedIds.has(s.id) && <span className="text-xs">✅</span>}
                  <span className="font-semibold text-sm" style={{ color: "#aaddff" }}>{s.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)", color: "#889aaa" }}>{s.category}</span>
                  <span className="text-xs opacity-40">{"★".repeat(s.difficulty)}</span>
                </div>
              </div>
              <p className="text-xs opacity-50 mt-1 line-clamp-1">{s.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
