import { motion } from "motion/react";
import { colorHex } from "../../../content/adventureMissions";
import type { AdventureMission } from "../../../types/adventure.types";
import { Food, ToyCreation } from "./AdventurePieces";
import { GardenArtwork, gardenKind } from "./GardenArtwork";

export function WorldCreation({
  mission,
  seed = 0,
  playing = false,
}: {
  mission: AdventureMission;
  seed?: number;
  playing?: boolean;
}) {
  if (mission.gameId === "shapes")
    return <ToyCreation mission={mission} playing={playing} />;
  const letter = [...(mission.letterSet ?? "א")][
    Math.abs(seed) % (mission.letterSet?.length ?? 1)
  ];
  const variant = mission.variant;
  return (
    <motion.div
      className={`adventure-world-creation creation-${mission.gameId}`}
      role="img"
      aria-label={mission.reward}
      animate={
        playing ? { y: [0, -8, 0], rotate: [0, -3, 3, 0] } : { y: 0, rotate: 0 }
      }
      transition={{ duration: 2.4, repeat: playing ? Infinity : 0 }}
    >
      {mission.gameId === "colors" ? (
        <GardenArtwork
          kind={gardenKind(mission)}
          fill={
            colorHex[mission.colors![Math.abs(seed) % mission.colors!.length]]
          }
          playing={playing}
        />
      ) : mission.gameId === "numbers" ? (
        <div
          className={`adventure-meal meal-${mission.activity} meal-${variant}`}
        >
          <img
            src={`/assets/experience/v2/monster-${playing ? "eat" : "idle"}.webp`}
            alt=""
          />
          <div>
            {Array.from({ length: variant + 2 }, (_, i) => (
              <Food
                key={i}
                kind={
                  mission.activity === "share" && variant === 1
                    ? "cookie"
                    : ["apple", "strawberry", "cookie", "carrot"][variant]
                }
              />
            ))}
          </div>
        </div>
      ) : (
        <svg viewBox="0 0 260 220" aria-hidden="true">
          <ellipse cx="130" cy="204" rx="113" ry="9" fill="#a48a622b" />
          {mission.activity === "letter-build" ? (
            variant === 0 ? (
              <path
                d="M20 190V100Q130 13 240 100V190H210V115Q130 55 50 115V190Z"
                fill="#d8b679"
              />
            ) : variant === 1 ? (
              <>
                <path
                  d="M82 40Q130-10 178 40"
                  stroke="#7d6c59"
                  fill="none"
                  strokeWidth="8"
                />
                <path d="M75 40H185L200 190H60Z" fill="#e5b75f" />
                <path
                  d="M97 53H163L174 166H86Z"
                  fill={playing ? "#ffe993" : "#f2d49b"}
                />
              </>
            ) : variant === 2 ? (
              <>
                <path d="M20 105H240V175H20Z" fill="#6fb6b9" />
                <path d="M25 70H87V110H25Z" fill="#e3b862" />
                {[55, 120, 210].map((x) => (
                  <circle key={x} cx={x} cy="183" r="20" fill="#826285" />
                ))}
              </>
            ) : (
              <>
                <path
                  d="M130 12L215 97L130 171L45 97Z"
                  fill="#e3a0b4"
                  stroke="#f6d493"
                  strokeWidth="6"
                />
                <path
                  d="M130 171Q180 199 125 210"
                  stroke="#a17b6b"
                  strokeWidth="5"
                  fill="none"
                />
              </>
            )
          ) : mission.activity === "letter-find" ? (
            variant === 0 ? (
              <>
                <path d="M65 49Q130 5 195 49V161H65Z" fill="#8cb5c4" />
                <path d="M95 87H165" stroke="#fff1c8" strokeWidth="10" />
                <path d="M122 162V203" stroke="#ac875c" strokeWidth="18" />
              </>
            ) : variant === 1 ? (
              <path
                d="M130 12L160 72L231 83L180 131L192 200L130 170L67 200L80 131L30 83L99 72Z"
                fill="#efcc7f"
              />
            ) : variant === 2 ? (
              <>
                <path d="M35 153H225L209 198H51Z" fill="#b98e65" />
                {[70, 130, 190].map((x) => (
                  <g key={x}>
                    <path d={`M${x} 159V90`} stroke="#7daf7d" strokeWidth="9" />
                    <circle cx={x} cy="79" r="28" fill="#e5acc1" />
                  </g>
                ))}
              </>
            ) : (
              <>
                <path d="M20 25H240V195H20Z" fill="#ad819e" />
                <path d="M57 50H203V176H57Z" fill="#f8e1b4" />
                <path
                  d="M20 25L85 60L30 176M240 25L175 60L230 176"
                  fill="#c5879a"
                />
              </>
            )
          ) : (
            <>
              <path
                d="M35 92L130 22L225 92V195H35Z"
                fill={["#8cb5c4", "#d4a46f", "#91b894", "#b696c9"][variant]}
              />
              <path
                d="M20 92L130 12L240 92"
                stroke="#efd1a0"
                strokeWidth="17"
                fill="none"
              />
              <rect
                x="72"
                y="86"
                width="116"
                height="81"
                rx="16"
                fill="#fff1d1"
              />
            </>
          )}
          <text
            x="130"
            y={
              mission.activity === "letter-find" && variant === 2
                ? "100"
                : "139"
            }
            textAnchor="middle"
            fontFamily="Heebo Variable"
            fontWeight="800"
            fontSize="65"
            fill="#75558e"
          >
            {letter}
          </text>
        </svg>
      )}
    </motion.div>
  );
}
