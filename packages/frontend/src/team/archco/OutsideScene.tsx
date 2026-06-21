/**
 * ArchCo HQ exterior — the ground-level "Outside" view.
 *
 * Building facade with the single front EXIT, a parking lot, a street with
 * trees, a day/night sky and time-tied weather. Employees leave through the
 * exit, walk to a car in the lot, get in, and drive off.
 *
 * The SVG scene scales to fill an aspect-ratio box, so the HTML sprite/car
 * overlay is positioned in percentages of the logical 720x320 space to stay
 * aligned at any width.
 */

import { useEffect, useRef, useState } from 'react';
import { EMPLOYEES } from './companyData.js';
import { EmployeeSprite } from './EmployeeSprite.js';
import { getWeather, type TimeState } from './timeSystem.js';

const SCENE_W = 720;
const SCENE_H = 320;
const DOOR_X = 159;
// Walkers travel along the upper sidewalk, above the parked cars, so a person
// never renders on top of a car (the HTML sprite layer sits above the SVG).
const SIDEWALK_Y = 188;
// Parking-lot slot x positions (logical units).
const LOT_SLOTS = [336, 432, 528, 624];
const LOT_Y = 232;
const CAR_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7'];

const px = (v: number, total: number) => `${(v / total) * 100}%`;

interface Walker {
  id: string;
  x: number;
  emotion: string | null;
}
interface DriveCar {
  key: number;
  x: number;
  y: number;
  color: string;
}

const CASUAL_LINES = [
  'Good work today! 💪',
  'See you tomorrow! 👋',
  'Catch the game later? ⚽',
  'Drive safe! 🚗',
  'Ship it Monday! 🚀',
  'Heading to my car… 🅿️',
];

/** Side-view car (drive-away). Fills its container so it scales with the scene. */
function CarGlyph({ color }: { color: string }) {
  return (
    <svg width="100%" viewBox="0 0 68 34" aria-hidden="true" style={{ display: 'block' }}>
      <rect x="0" y="14" width="68" height="16" rx="6" fill={color} />
      <rect x="12" y="2" width="44" height="15" rx="5" fill={color} opacity="0.92" />
      <rect x="18" y="5" width="32" height="10" rx="2" fill="#0f172a" opacity="0.6" />
      <circle cx="16" cy="31" r="6" fill="#0f172a" />
      <circle cx="52" cy="31" r="6" fill="#0f172a" />
      <circle cx="16" cy="31" r="2.5" fill="#475569" />
      <circle cx="52" cy="31" r="2.5" fill="#475569" />
    </svg>
  );
}

export function OutsideScene({
  timeState,
  isOffDuty = false,
  presentIds,
}: {
  timeState: TimeState;
  isOffDuty?: boolean;
  presentIds?: ReadonlySet<string>;
}) {
  const weather = getWeather(timeState);
  // Day/night straight from the local clock hour (weekend-proof).
  const h = timeState.hour;
  const isNight = h < 6 || h >= 19;
  const isEvening = !isNight && (h < 8 || h >= 17);
  const litWindows = isNight || isEvening;

  // Direction depends on duty/time: people arrive in the morning/day and leave
  // in the evening, at night, or when the office goes off-duty.
  const mode: 'arriving' | 'leaving' = isOffDuty || h >= 17 || h < 6 ? 'leaving' : 'arriving';
  const doorLabel = mode === 'arriving' ? 'ENTER' : 'EXIT';

  const [walker, setWalker] = useState<Walker | null>(null);
  const [drive, setDrive] = useState<DriveCar | null>(null);
  // People already processed this cycle (left for leaving / arrived for arriving)
  // so the street empties out instead of looping forever. Held in refs so the
  // animation interval never restarts mid-departure.
  const processedRef = useRef<Set<string>>(new Set());
  const presentRef = useRef(presentIds);
  presentRef.current = presentIds;

  // Reset who's been processed whenever the direction flips.
  useEffect(() => {
    processedRef.current = new Set();
  }, [mode]);

  // One person at a time. Leaving: walk to a car → drive off. Arriving: a car
  // drives in and parks → the person walks to the entrance. Paced as a walk
  // (slow linear transitions), never a sprint.
  useEffect(() => {
    const timers: number[] = [];
    const wait = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));

    const run = () => {
      if (walker || drive) return;
      // Pool: leaving → people still in the building; arriving → people due in.
      const present = presentRef.current ? [...presentRef.current] : EMPLOYEES.map((e) => e.id);
      const pool = (mode === 'leaving' ? present : EMPLOYEES.map((e) => e.id)).filter(
        (id) => !processedRef.current.has(id),
      );
      if (pool.length === 0) return; // everyone has come/gone — street is quiet
      const empId = pool[Math.floor(Math.random() * pool.length)];
      const emp = EMPLOYEES.find((e) => e.id === empId);
      if (!emp) return;
      const slotX = LOT_SLOTS[Math.floor(Math.random() * LOT_SLOTS.length)];
      const color = CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)];
      const rainNote = weather.kind === 'rain' ? 'Bring an umbrella! ☔' : null;
      const markDone = () => {
        processedRef.current = new Set([...processedRef.current, empId]);
      };

      if (mode === 'leaving') {
        setWalker({ id: emp.id, x: DOOR_X, emotion: 'Heading to my car… 🅿️' });
        wait(120, () => setWalker((w) => (w ? { ...w, x: slotX } : w)));
        wait(3000, () =>
          setWalker((w) =>
            w ? { ...w, emotion: rainNote ?? CASUAL_LINES[Math.floor(Math.random() * CASUAL_LINES.length)] } : w,
          ),
        );
        // Reached the car (after the slow ~5.5s walk): get in, then drive off.
        wait(5900, () => {
          setWalker(null);
          markDone();
          const key = Date.now();
          setDrive({ key, x: slotX, y: LOT_Y + 18, color });
          wait(90, () => setDrive((d) => (d && d.key === key ? { ...d, x: SCENE_W + 140 } : d)));
          wait(5200, () => setDrive((d) => (d && d.key === key ? null : d)));
        });
      } else {
        // Arriving: car drives in from the right and parks in a slot.
        const key = Date.now();
        setDrive({ key, x: SCENE_W + 140, y: LOT_Y + 18, color });
        wait(90, () => setDrive((d) => (d && d.key === key ? { ...d, x: slotX } : d)));
        // Parked (after the ~5s drive-in): the driver gets out and walks to the entrance.
        wait(5200, () => {
          setDrive((d) => (d && d.key === key ? null : d));
          setWalker({ id: emp.id, x: slotX, emotion: rainNote ?? 'Morning! ☕' });
          wait(120, () => setWalker((w) => (w ? { ...w, x: DOOR_X } : w)));
          wait(5900, () => {
            setWalker(null);
            markDone();
          });
        });
      }
    };

    const id = window.setInterval(run, 7600);
    run();
    return () => {
      window.clearInterval(id);
      timers.forEach((t) => window.clearTimeout(t));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weather.kind, mode]);

  const skyId = `out-sky-${timeState.timeOfDay}`;

  return (
    <div className="archco-scene-wrap outside-wrap">
      <svg viewBox={`0 0 ${SCENE_W} ${SCENE_H}`} className="archco-scene-svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id={skyId} x1="0" y1="0" x2="0" y2="1">
            {isNight ? (
              <>
                <stop offset="0%" stopColor="#0b1026" />
                <stop offset="100%" stopColor="#1c2541" />
              </>
            ) : isEvening ? (
              <>
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="55%" stopColor="#fb7185" />
                <stop offset="100%" stopColor="#6d28d9" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#bae6fd" />
              </>
            )}
          </linearGradient>
        </defs>

        {/* Sky */}
        <rect x="0" y="0" width={SCENE_W} height="210" fill={`url(#${skyId})`} />

        {/* Sun / moon */}
        <circle cx={isNight ? 600 : 92} cy="58" r={isNight ? 17 : 26} fill={isNight ? '#e2e8f0' : '#fde047'} />
        {isNight && <circle cx="592" cy="52" r="17" fill="#1c2541" />}

        {/* Stars */}
        {isNight &&
          [...Array(28)].map((_, i) => (
            <circle
              key={i}
              cx={(i * 53) % SCENE_W}
              cy={(i * 29) % 150}
              r={i % 3 === 0 ? 1.2 : 0.7}
              fill="#e2e8f0"
              className="out-star"
              style={{ animationDelay: `${(i % 5) * 0.4}s` }}
            />
          ))}

        {/* Clouds */}
        {weather.kind !== 'clear' && (
          <g className="out-clouds" opacity={isNight ? 0.5 : 0.85}>
            <ellipse cx="250" cy="44" rx="42" ry="14" fill="#f8fafc" opacity="0.85" />
            <ellipse cx="284" cy="50" rx="30" ry="12" fill="#e2e8f0" opacity="0.8" />
            <ellipse cx="470" cy="36" rx="46" ry="15" fill="#f1f5f9" opacity="0.8" />
            <ellipse cx="512" cy="42" rx="28" ry="11" fill="#e2e8f0" opacity="0.75" />
          </g>
        )}

        {/* Sidewalk + parking lot surface + road */}
        <rect x="0" y="206" width={SCENE_W} height="50" fill="#475569" />
        <rect x="0" y="206" width={SCENE_W} height="3" fill="#64748b" />
        {/* Parking lot slot lines */}
        {LOT_SLOTS.map((sx) => (
          <g key={`slot-${sx}`}>
            <rect x={sx - 34} y="220" width="2" height="34" fill="#e2e8f0" opacity="0.4" />
            <rect x={sx + 34} y="220" width="2" height="34" fill="#e2e8f0" opacity="0.4" />
          </g>
        ))}
        <text x={LOT_SLOTS[0] - 30} y="218" fill="#cbd5e1" fontSize="7" fontWeight="700" opacity="0.6">
          🅿 PARKING
        </text>
        <rect x="0" y="256" width={SCENE_W} height="64" fill="#1f2937" />
        {[...Array(9)].map((_, i) => (
          <rect key={i} x={20 + i * 80} y="286" width="36" height="4" rx="2" fill="#fbbf24" opacity="0.7" />
        ))}

        {/* Building facade */}
        <g>
          <rect x="40" y="60" width="244" height="146" fill={isNight ? '#1e293b' : '#334155'} stroke="#0f172a" strokeWidth="2" />
          <rect x="98" y="48" width="128" height="16" rx="3" fill="#0f172a" stroke="#6366f1" strokeWidth="1" />
          <text x="162" y="60" textAnchor="middle" fill="#818cf8" fontSize="11" fontWeight="800" letterSpacing="2">
            ARCHCO
          </text>
          {[...Array(3)].map((_, row) =>
            [...Array(6)].map((_, col) => {
              const lit = litWindows && (row + col) % 2 === 0;
              return (
                <rect
                  key={`${row}-${col}`}
                  x={54 + col * 37}
                  y={74 + row * 32}
                  width="25"
                  height="21"
                  rx="1.5"
                  fill={lit ? '#fde68a' : isNight ? '#0f172a' : '#7dd3fc'}
                  stroke="#0f172a"
                  strokeWidth="1"
                  opacity={lit ? 0.95 : 0.8}
                />
              );
            }),
          )}
          {/* Entrance + single EXIT door */}
          <rect x="124" y="174" width="78" height="32" fill="#0f172a" />
          <rect x="124" y="168" width="78" height="8" rx="2" fill="#6366f1" />
          <rect x="135" y="178" width="25" height="28" rx="1.5" fill="#1e293b" stroke="#475569" strokeWidth="1" />
          <rect x="162" y="178" width="25" height="28" rx="1.5" fill="#1e293b" stroke="#475569" strokeWidth="1" />
          <rect x="146" y="162" width="32" height="9" rx="2" fill="#052e16" stroke="#16a34a" strokeWidth="1" />
          <text x="162" y="169" textAnchor="middle" fill="#4ade80" fontSize="6" fontWeight="700">
            {doorLabel}
          </text>
        </g>

        {/* Trees (far side) */}
        {[660, 700].map((tx, i) => (
          <g key={tx}>
            <rect x={tx - 3} y={184} width="6" height="24" rx="1.5" fill="#7c4a1e" />
            <circle cx={tx} cy={176} r={16 + (i % 2) * 4} fill={isNight ? '#14532d' : '#22c55e'} />
          </g>
        ))}

        {/* Parked cars in the lot */}
        {LOT_SLOTS.map((sx, i) => (
          <g key={`car-${sx}`} transform={`translate(${sx - 28}, ${LOT_Y - 2})`}>
            <rect x="0" y="14" width="56" height="14" rx="5" fill={CAR_COLORS[i % CAR_COLORS.length]} opacity="0.92" />
            <rect x="10" y="4" width="36" height="12" rx="4" fill={CAR_COLORS[i % CAR_COLORS.length]} opacity="0.85" />
            <rect x="15" y="6" width="26" height="8" rx="2" fill="#0f172a" opacity="0.55" />
            <circle cx="14" cy="29" r="5" fill="#0f172a" />
            <circle cx="42" cy="29" r="5" fill="#0f172a" />
          </g>
        ))}

        {/* Rain */}
        {weather.kind === 'rain' && (
          <g className="out-rain" opacity="0.5">
            {[...Array(40)].map((_, i) => (
              <line
                key={i}
                x1={(i * 37) % SCENE_W}
                y1={-10}
                x2={((i * 37) % SCENE_W) - 6}
                y2={6}
                stroke="#bae6fd"
                strokeWidth="1.2"
                style={{ animationDelay: `${(i % 10) * 0.12}s` }}
              />
            ))}
          </g>
        )}

        {isNight && <rect x="0" y="0" width={SCENE_W} height={SCENE_H} fill="#0b1026" opacity="0.28" />}
      </svg>

      {/* Weather + time label */}
      <div className="outside-weather">
        <span className="outside-weather-icon">{weather.icon}</span>
        <span>{weather.label}</span>
      </div>

      {/* HTML overlay: walking employee + driving car (percentage-positioned) */}
      <div className="archco-employee-layer">
        {walker &&
          (() => {
            const emp = EMPLOYEES.find((e) => e.id === walker.id);
            if (!emp) return null;
            return (
              <div
                className="archco-employee outside-walker"
                style={{ left: px(walker.x, SCENE_W), top: px(SIDEWALK_Y, SCENE_H) }}
              >
                {walker.emotion && <div className="archco-emotion-bubble">{walker.emotion}</div>}
                <EmployeeSprite employee={emp} scale={2.4} isWalking flip={false} />
                <span className="archco-employee-name">{emp.name.split(' ')[0]}</span>
              </div>
            );
          })()}

        {drive && (
          <div
            key={drive.key}
            className="outside-drive"
            style={{
              left: px(drive.x - 30, SCENE_W),
              top: px(drive.y, SCENE_H),
              width: px(64, SCENE_W),
            }}
          >
            <CarGlyph color={drive.color} />
          </div>
        )}
      </div>
    </div>
  );
}
