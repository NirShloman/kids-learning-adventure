import type { AdventureMission } from "../../../types/adventure.types";

// The same paths are used by SVG and Canvas so the silhouette never changes
// when the child moves from choosing a paint pot to finger painting.
export const gardenPaths = {
  flower:
    "M150 80C85 5 50 90 98 122C5 105 30 200 100 177C70 270 165 280 170 205C245 265 285 180 215 145C300 110 238 30 190 92C205 15 120 5 150 80Z",
  butterfly:
    "M148 140C40 5 4 95 65 157C-4 215 77 280 146 175L154 175C223 280 304 215 235 157C296 95 260 5 152 140Z",
  pot: "M62 108H238L211 257H89ZM49 78H251V114H49Z",
  balloon:
    "M150 28C30 28 32 172 142 223L130 243H170L158 223C268 172 270 28 150 28Z",
  birdhouse: "M55 121L150 41L245 121H221V259H79V121Z",
  snail: "M154 67A83 83 0 1 0 154 233A83 83 0 1 0 154 67Z",
  lantern: "M84 61H216L235 231H65ZM94 38H206V65H94Z",
  flag: "M48 49H250L150 230Z",
  sun: "M150 28L173 72L222 56L216 109L265 130L222 162L240 213L185 210L150 264L115 210L60 213L78 162L35 130L84 109L78 56L127 72Z",
  tree: "M151 23C108 7 80 34 85 70C27 43 15 129 62 145C13 211 119 244 149 205C198 247 282 220 243 157C300 119 256 54 217 73C220 20 170 10 151 23Z",
} as const;
export type GardenKind = keyof typeof gardenPaths;

export function gardenKind(mission: AdventureMission): GardenKind {
  if (mission.activity === "paint")
    return (["flower", "butterfly", "pot", "balloon"] as const)[
      mission.variant
    ];
  if (mission.activity === "color-apply")
    return (["birdhouse", "snail", "lantern", "flag"] as const)[
      mission.variant
    ];
  return (["sun", "tree", "flower", "butterfly"] as const)[mission.variant];
}

export function GardenArtwork({
  kind,
  fill,
  playing = false,
}: {
  kind: GardenKind;
  fill: string;
  playing?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 300 300"
      className={playing ? "garden-art is-alive" : "garden-art"}
      aria-hidden="true"
    >
      {kind === "flower" && (
        <path
          d="M150 165Q120 228 150 294M139 256Q55 194 64 258Q100 290 145 270"
          stroke="#598b62"
          strokeWidth="10"
          fill="#8ec584"
        />
      )}
      {kind === "balloon" && (
        <path
          d="M150 233Q120 260 158 284"
          stroke="#aa8063"
          strokeWidth="4"
          fill="none"
        />
      )}
      {kind === "tree" && <path d="M143 151H163L181 289H125Z" fill="#a8794e" />}
      {kind === "snail" && (
        <path
          d="M53 239Q115 266 249 237L256 169M249 184L230 166"
          stroke="#9abc88"
          strokeWidth="24"
          strokeLinecap="round"
          fill="none"
        />
      )}
      <path
        d={gardenPaths[kind]}
        fill={fill}
        stroke="#fff8e5"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      {kind === "snail" && (
        <path
          d="M168 195C83 219 96 105 165 114C216 121 208 180 159 173C133 169 139 140 159 144"
          stroke="#fff9dc"
          opacity=".65"
          strokeWidth="8"
          fill="none"
        />
      )}
      {kind === "pot" && (
        <path
          d="M150 78V24M150 64Q85 3 99 55Q110 75 150 64M150 58Q208 0 201 46Q190 65 150 58"
          fill="#91bf85"
          stroke="#6d9d6d"
          strokeWidth="5"
        />
      )}
      {kind === "butterfly" && (
        <path
          d="M150 123V197M150 130L134 110M150 130L167 110"
          stroke="#715744"
          strokeWidth="9"
          strokeLinecap="round"
        />
      )}
      {kind === "birdhouse" ? (
        <>
          <circle cx="150" cy="172" r="33" fill="#6c5947" />
          <path d="M138 176Q153 147 169 177" fill="#efc563" />
          <path
            d="M111 221H189"
            stroke="#bd965f"
            strokeWidth="10"
            strokeLinecap="round"
          />
        </>
      ) : (
        <g fill="#71513b">
          <circle cx="132" cy="151" r="5" />
          <circle cx="168" cy="151" r="5" />
          <path
            d="M139 169Q150 180 161 169"
            stroke="#71513b"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      )}
    </svg>
  );
}
