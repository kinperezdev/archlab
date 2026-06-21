import { useState, useEffect, useMemo } from 'react';
import type { Employee, Floor, HairStyle, Accessory } from './companyData.js';
import { employeesOnFloor, EMPLOYEES } from './companyData.js';
import { FLOOR_CONFIGS } from './floorLayouts.js';
import type { TimeState } from './timeSystem.js';
import { EmployeeSprite } from './EmployeeSprite.js';
import { levelForXp, loadGrowthState, saveGrowthState } from './growthSystem.js';
import { PORTS } from '@archlab/shared';

interface WikiEntry {
  id: string;
  projectName: string;
  decision: string;
  madeBy: string[];
  rationale: string;
  outcome?: string;
  tags: string[];
  createdAt: number;
}

export type ThreatLevel = 'green' | 'yellow' | 'red' | 'flashing';

interface FloorSceneProps {
  floor: Floor;
  timeState: TimeState;
  presentIds: ReadonlySet<string>;
  taskBadges: Record<string, { label: string; severity: 'critical' | 'high' | 'medium' | 'low' }>;
  threatLevel?: ThreatLevel;
  onSelect: (employee: Employee, dynamicStatus?: string, currentThought?: string) => void;
  payrollTrigger?: number;
  aiUpgradeTrigger?: number;
  /** When true, present employees walk out the exit door and the office empties. */
  isOffDuty?: boolean;
}

const SCENE_W = 720;
const SCENE_H = 320;
const ELEVATOR_X = SCENE_W - 56;

const SEVERITY_COLOR: Record<'critical' | 'high' | 'medium' | 'low', string> = {
  critical: '#F87171',
  high: '#FBBF24',
  medium: '#34D399',
  low: '#64748B',
};


interface DynamicStatus {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  pulsing: boolean;
}

function getDynamicStatus(
  emp: Employee,
  state: EmpState | undefined,
  badge: { label: string; severity: 'critical' | 'high' | 'medium' | 'low' } | undefined,
  mentoringIds: ReadonlySet<string>,
  timeState: TimeState
): DynamicStatus {
  if (timeState.isWeekend && !badge && !mentoringIds.has(emp.id) && emp.status !== 'gone-home') {
    const timeMinutes = Math.floor(Date.now() / (3 * 60 * 1000));
    const hash = (emp.name.length + emp.role.length + timeMinutes) % 5;
    const weekendStates = [
      { label: "Hey it's Sunday let us rest! 🛌", icon: '😭', color: '#F87171', bgColor: '#F8717122', pulsing: true },
      { label: "Where is my Sunday OT Pay? 💸", icon: '💵', color: '#F59E0B', bgColor: '#F59E0B22', pulsing: false },
      { label: "Complaining about weekend shift 😭", icon: '🗣️', color: '#EF4444', bgColor: '#EF444422', pulsing: true },
      { label: "Need coffee to survive Sunday ☕", icon: '☕', color: '#06B6D4', bgColor: '#06B6D422', pulsing: true },
      { label: "Forced Sunday Coding... 💀", icon: '⏳', color: '#64748B', bgColor: '#64748B22', pulsing: false }
    ];
    return weekendStates[hash];
  }

  if (badge) {
    return {
      label: badge.label,
      icon: '🔥',
      color: SEVERITY_COLOR[badge.severity],
      bgColor: `${SEVERITY_COLOR[badge.severity]}22`,
      pulsing: true,
    };
  }

  if (mentoringIds.has(emp.id)) {
    return {
      label: 'Mentoring Sync',
      icon: '🎓',
      color: '#10B981',
      bgColor: '#10B98122',
      pulsing: true,
    };
  }

  if (emp.status === 'gone-home') {
    return {
      label: 'Gone Home',
      icon: '🏠',
      color: '#64748B',
      bgColor: '#64748B22',
      pulsing: false,
    };
  }

  // If walking
  if (state?.isWalking) {
    // If heading to elevator on right edge
    const isHeadingToElevator = state.x > SCENE_W - 140;
    // If heading to plants/lounge on left edge
    const isHeadingToLounge = state.x < 100;
    
    if (isHeadingToLounge) {
      return {
        label: 'Coffee / Lounge Break',
        icon: '☕',
        color: '#F59E0B',
        bgColor: '#F59E0B22',
        pulsing: false,
      };
    }
    if (isHeadingToElevator) {
      return {
        label: 'Heading to Elevator',
        icon: '🛗',
        color: '#A855F7',
        bgColor: '#A855F722',
        pulsing: false,
      };
    }
    return {
      label: 'Brainstorming / Walk',
      icon: '💡',
      color: '#06B6D4',
      bgColor: '#06B6D422',
      pulsing: true,
    };
  }

  // At desk. Use deterministic pseudorandom value based on current clock minute to cycle states naturally
  const timeMinutes = Math.floor(Date.now() / (3 * 60 * 1000)); // Rotate every 3 minutes
  const hash = (emp.name.length + emp.role.length + timeMinutes) % 6;

  if (emp.department === 'engineering-backend') {
    const states = [
      { label: 'Coding Backend APIs', icon: '💻', color: '#3B82F6', bgColor: '#3B82F622', pulsing: true },
      { label: 'Optimizing Database', icon: '⚡', color: '#10B981', bgColor: '#10B98122', pulsing: true },
      { label: 'Writing Unit Tests', icon: '🧪', color: '#8B5CF6', bgColor: '#8B5CF622', pulsing: false },
      { label: 'Reviewing Pull Request', icon: '📂', color: '#F59E0B', bgColor: '#F59E0B22', pulsing: false },
      { label: 'Debugging Production', icon: '🐛', color: '#EF4444', bgColor: '#EF444422', pulsing: true },
      { label: 'Deep Thinking', icon: '💭', color: '#64748B', bgColor: '#64748B22', pulsing: false }
    ];
    return states[hash];
  }

  if (emp.department === 'engineering-frontend') {
    const states = [
      { label: 'Styling UI & Polish', icon: '🎨', color: '#EC4899', bgColor: '#EC489922', pulsing: true },
      { label: 'Developing Components', icon: '⚛️', color: '#06B6D4', bgColor: '#06B6D422', pulsing: true },
      { label: 'Fixing Responsive CSS', icon: '📐', color: '#10B981', bgColor: '#10B98122', pulsing: false },
      { label: 'Refactoring React Flow', icon: '🕸️', color: '#8B5CF6', bgColor: '#8B5CF622', pulsing: true },
      { label: 'Testing User Flows', icon: '🧪', color: '#F59E0B', bgColor: '#F59E0B22', pulsing: false },
      { label: 'Idle / Stretching', icon: '⏳', color: '#64748B', bgColor: '#64748B22', pulsing: false }
    ];
    return states[hash];
  }

  if (emp.department === 'sre-devops' || emp.department === 'security') {
    const states = [
      { label: 'Monitoring Grafana', icon: '📊', color: '#10B981', bgColor: '#10B98122', pulsing: true },
      { label: 'Auditing Security Rules', icon: '🛡️', color: '#EF4444', bgColor: '#EF444422', pulsing: true },
      { label: 'Checking Server Logs', icon: '🔍', color: '#3B82F6', bgColor: '#3B82F622', pulsing: false },
      { label: 'Scaling Microservices', icon: '🚀', color: '#8B5CF6', bgColor: '#8B5CF622', pulsing: true },
      { label: 'Configuring CI/CD', icon: '⚙️', color: '#F59E0B', bgColor: '#F59E0B22', pulsing: false },
      { label: 'On-Call Monitoring', icon: '📞', color: '#64748B', bgColor: '#64748B22', pulsing: false }
    ];
    return states[hash];
  }

  if (emp.department === 'product' || emp.department === 'design') {
    const states = [
      { label: 'Designing in Figma', icon: '🎨', color: '#EC4899', bgColor: '#EC489922', pulsing: true },
      { label: 'Writing Spec Documents', icon: '📝', color: '#F59E0B', bgColor: '#F59E0B22', pulsing: false },
      { label: 'Prototyping Interaction', icon: '💡', color: '#06B6D4', bgColor: '#06B6D422', pulsing: true },
      { label: 'Analyzing User Logs', icon: '📊', color: '#3B82F6', bgColor: '#3B82F622', pulsing: false },
      { label: 'Brainstorming Scope', icon: '🧠', color: '#8B5CF6', bgColor: '#8B5CF622', pulsing: true },
      { label: 'Resting / Planning', icon: '☕', color: '#64748B', bgColor: '#64748B22', pulsing: false }
    ];
    return states[hash];
  }

  if (emp.department === 'leadership') {
    const states = [
      { label: 'Architecture Strategy', icon: '🏛️', color: '#8B5CF6', bgColor: '#8B5CF622', pulsing: true },
      { label: 'Reviewing System Design', icon: '🗺️', color: '#06B6D4', bgColor: '#06B6D422', pulsing: true },
      { label: 'Roadmap Refinements', icon: '📅', color: '#F59E0B', bgColor: '#F59E0B22', pulsing: false },
      { label: 'Budget Allocations', icon: '💰', color: '#10B981', bgColor: '#10B98122', pulsing: false },
      { label: 'Foundational Research', icon: '🧠', color: '#EC4899', bgColor: '#EC489922', pulsing: true },
      { label: 'Deep Thinking', icon: '💭', color: '#64748B', bgColor: '#64748B22', pulsing: false }
    ];
    return states[hash];
  }

  const defaultStates = [
    { label: 'Working Hard', icon: '💼', color: '#3B82F6', bgColor: '#3B82F622', pulsing: true },
    { label: 'Brainstorming Ideas', icon: '🧠', color: '#8B5CF6', bgColor: '#8B5CF622', pulsing: true },
    { label: 'Reading Documentation', icon: '📖', color: '#06B6D4', bgColor: '#06B6D422', pulsing: false },
    { label: 'Organizing Workspace', icon: '🧹', color: '#F59E0B', bgColor: '#F59E0B22', pulsing: false },
    { label: 'Resting / Thinking', icon: '☕', color: '#64748B', bgColor: '#64748B22', pulsing: false },
    { label: 'Idle / Standing By', icon: '⏳', color: '#64748B', bgColor: '#64748B22', pulsing: false }
  ];
  return defaultStates[hash];
}

interface EmpState {
  x: number;
  y: number;
  isWalking: boolean;
  flip: boolean;
  emotion: string | null;
  /** Raise the speech bubble so two people talking don't cover each other. */
  emotionRaised?: boolean;
}

export function FloorScene({
  floor,
  timeState,
  presentIds,
  taskBadges,
  threatLevel = 'green',
  onSelect,
  payrollTrigger = 0,
  aiUpgradeTrigger = 0,
  isOffDuty = false,
}: FloorSceneProps) {
  const config = FLOOR_CONFIGS[floor];
  // Stable per floor: employeesOnFloor() filters a fresh array each call, so we
  // memoize it. Without this, every render produced a new array identity, which
  // re-ran the position-init effect below and reset sprites to their desks (and
  // wiped emotion bubbles) on every render — the "steady sprites" and the
  // "rapid payroll bubble glitch" both trace back to that.
  const employees = useMemo(() => employeesOnFloor(floor), [floor]);
  const lit = timeState.lightLevel;

  // Track dynamic state for walking/emotions
  const [empStates, setEmpStates] = useState<Record<string, EmpState>>({});
  const [mentoringIds, setMentoringIds] = useState<ReadonlySet<string>>(new Set());
  // Employees who have walked out the exit door for the day (off-duty).
  const [leftForDay, setLeftForDay] = useState<ReadonlySet<string>>(new Set());
  
  // Floor 5 Visitor state
  const [visitor, setVisitor] = useState<{
    id: string;
    name: string;
    role: string;
    color: string;
    skinTone: string;
    hairStyle: HairStyle;
    hairColor: string;
    accessory?: Accessory;
    x: number;
    y: number;
    isWalking: boolean;
    flip: boolean;
    emotion: string | null;
  } | null>(null);

  // Floor 6 Founder Visitor state & interactive HUD
  const [founderVisitor, setFounderVisitor] = useState<{
    id: string;
    name: string;
    role: string;
    color: string;
    skinTone: string;
    hairStyle: HairStyle;
    hairColor: string;
    accessory?: Accessory;
    x: number;
    y: number;
    isWalking: boolean;
    flip: boolean;
    emotion: string | null;
    questionCount: number;
  } | null>(null);
  const [showChatInput, setShowChatInput] = useState(false);
  const [chatText, setChatText] = useState('');
  const [wikiEntries, setWikiEntries] = useState<WikiEntry[]>([]);

  // Fetch wiki entries for Floor 1 meeting board
  useEffect(() => {
    fetch(`http://127.0.0.1:${PORTS.backend}/brain/archco-wiki`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data)) setWikiEntries(data);
      })
      .catch(() => {});
  }, [floor]);

  // Seed positions for any employee on this floor that doesn't have a state yet,
  // and drop states for employees no longer on the floor. Runs only when the
  // floor's roster actually changes — never on every render — so live positions
  // and emotion bubbles are preserved between ticks.
  useEffect(() => {
    setEmpStates((prev) => {
      const next: Record<string, EmpState> = {};
      for (const emp of employees) {
        next[emp.id] =
          prev[emp.id] ?? {
            x: Math.min(emp.deskPosition.x, ELEVATOR_X - 60),
            y: emp.deskPosition.y + 40,
            isWalking: false,
            flip: false,
            emotion: null,
          };
      }
      return next;
    });
    setVisitor(null);
    setFounderVisitor(null);
    setMentoringIds(new Set());
  }, [employees]);

  // Listen for payroll triggers to make present employees celebrate!
  useEffect(() => {
    if (payrollTrigger === 0) return;

    setEmpStates((prev) => {
      const next = { ...prev };
      for (const emp of employees) {
        if (presentIds.has(emp.id)) {
          const reactions = [
            "Thanks for the salary! 💰",
            "Payroll day! 🎉",
            "Weekend double pay! 💸",
            "Salary received! 💵",
            "Thanks boss! 👍"
          ];
          next[emp.id] = {
            ...next[emp.id],
            emotion: reactions[Math.floor(Math.random() * reactions.length)]
          };
        }
      }
      return next;
    });

    const timer = setTimeout(() => {
      setEmpStates((prev) => {
        const next = { ...prev };
        for (const emp of employees) {
          if (presentIds.has(emp.id)) {
            next[emp.id] = {
              ...next[emp.id],
              emotion: null
            };
          }
        }
        return next;
      });
    }, 4000);

    return () => clearTimeout(timer);
  }, [payrollTrigger, employees, presentIds]);

  // Listen for AI Upgrade triggers to make present employees celebrate!
  useEffect(() => {
    if (aiUpgradeTrigger === 0) return;

    setEmpStates((prev) => {
      const next = { ...prev };
      for (const emp of employees) {
        if (presentIds.has(emp.id)) {
          next[emp.id] = {
            ...next[emp.id],
            emotion: "AI Brain upgraded! 🤖 +150 XP"
          };
        }
      }
      return next;
    });

    const timer = setTimeout(() => {
      setEmpStates((prev) => {
        const next = { ...prev };
        for (const emp of employees) {
          if (presentIds.has(emp.id)) {
            next[emp.id] = {
              ...next[emp.id],
              emotion: null
            };
          }
        }
        return next;
      });
    }, 4000);

    return () => clearTimeout(timer);
  }, [aiUpgradeTrigger, employees, presentIds]);

  // Off-duty: present employees walk to the exit door and head home; on return
  // they reappear at their desks. Driven purely by the isOffDuty flag.
  useEffect(() => {
    if (isOffDuty) {
      // Everyone rides the elevator down to the ground floor (single exit is
      // outside), so they walk to the elevator on the right and head down.
      const goodbyes = ['Heading down! 🛗', 'Night, everyone! 🌙', 'Calling it a day! 👋', 'Logging off! 💤'];
      setEmpStates((prev) => {
        const next = { ...prev };
        for (const emp of employees) {
          if (presentIds.has(emp.id) && next[emp.id]) {
            next[emp.id] = {
              ...next[emp.id],
              x: ELEVATOR_X - 65,
              isWalking: true,
              flip: false,
              emotion: goodbyes[Math.floor(Math.random() * goodbyes.length)],
            };
          }
        }
        return next;
      });
      // After the walk completes, mark them as gone for the day (office empties).
      const timer = setTimeout(() => {
        setLeftForDay(new Set(employees.filter((e) => presentIds.has(e.id)).map((e) => e.id)));
      }, 4800);
      return () => clearTimeout(timer);
    }

    // Back on duty: clear the "left" set and settle everyone at their desks.
    setLeftForDay(new Set());
    setEmpStates((prev) => {
      const next = { ...prev };
      for (const emp of employees) {
        if (next[emp.id]) {
          next[emp.id] = {
            ...next[emp.id],
            x: Math.min(emp.deskPosition.x, ELEVATOR_X - 60),
            y: emp.deskPosition.y + 40,
            isWalking: false,
            flip: false,
            emotion: null,
          };
        }
      }
      return next;
    });
  }, [isOffDuty, employees, presentIds]);

  // XP Reward & Local Persistence Saver
  const rewardXP = (empId: string, amount: number) => {
    const emp = EMPLOYEES.find((e) => e.id === empId);
    if (emp) {
      emp.xp += amount;
      const newLvl = levelForXp(emp.xp);
      if (newLvl > emp.level) {
        emp.level = newLvl;
      }
      loadGrowthState().then((current) => {
        const item = current[empId] || {
          employeeId: empId,
          level: emp.level,
          xp: emp.xp,
          xpToNextLevel: emp.xpToNextLevel,
          tasksCompleted: emp.tasksCompleted,
          specializations: emp.specialization,
          unlockedAbilities: [],
          recentAchievements: [],
        };
        item.xp = emp.xp;
        item.level = emp.level;
        saveGrowthState({ ...current, [empId]: item });
      });
    }
  };

  // Interactive Founder Chat Response handler
  const handleFounderReply = () => {
    if (!founderVisitor || !chatText.trim()) return;

    const nextCount = founderVisitor.questionCount + 1;
    setChatText('');

    if (nextCount < 2) {
      // SRE/Dev is not satisfied yet, asks a follow-up question
      const followUps = [
        'Are you sure? What if the migration locks the tables? 😰',
        'Should we notify the CTO first, or just go for it? 👥',
        'How does this affect our token burn rate budget? 📈',
        'Will this require a database rollback script? 💾',
        'Got it, but should we write E2E integration tests first? 💻'
      ];
      const randQ = followUps[Math.floor(Math.random() * followUps.length)];
      setFounderVisitor((v) => v ? { ...v, emotion: randQ, questionCount: nextCount } : null);
    } else {
      // Clear input, say thank you, reward XP, walk back to elevator
      setShowChatInput(false);
      setFounderVisitor((v) => v ? { ...v, emotion: 'Thank you Sir! Will continue the work. 🫡' } : null);

      setTimeout(() => {
        // Start walking back to elevator
        setFounderVisitor((v) => v ? { ...v, x: ELEVATOR_X - 65, isWalking: true, flip: false, emotion: 'Upgraded! 🎓 +150XP' } : null);
        // (walk-back budget aligned with the normal 1.8s pace below)
        rewardXP(founderVisitor.id, 150);

        // Despawn/exit
        setTimeout(() => {
          setFounderVisitor(null);
        }, 4800);
      }, 3500);
    }
  };

  // Roaming, emotion, and mentoring tick loop
  useEffect(() => {
    if (employees.length === 0) return;
    
    const tick = setInterval(() => {
      // Nobody is around while the office is off-duty — skip all activity.
      if (isOffDuty) return;
      // -------------------------------------------------------------
      // CASE A: FLOORS 1-4 MENTORING WALK TRIGGER
      // -------------------------------------------------------------
      if (floor !== 5 && Math.random() < 0.08 && mentoringIds.size === 0) {
        const activeIds = employees.filter((e) => presentIds.has(e.id)).map((e) => e.id);
        if (activeIds.length > 0) {
          const randId = activeIds[Math.floor(Math.random() * activeIds.length)];
          const emp = employees.find((e) => e.id === randId)!;
          const defaultX = Math.min(emp.deskPosition.x, ELEVATOR_X - 60);

          // Phase 1: Speak and walk to elevator
          setEmpStates((prev) => {
            const current = prev[randId];
            if (!current) return prev;
            return {
              ...prev,
              [randId]: {
                ...current,
                emotion: 'Heading up for advice! ✈️',
                x: ELEVATOR_X - 65,
                isWalking: true,
                flip: false,
              },
            };
          });

          // Phase 2: Enter elevator (disappear)
          setTimeout(() => {
            setMentoringIds((prev) => new Set([...prev, randId]));
            setEmpStates((prev) => {
              const current = prev[randId];
              if (!current) return prev;
              return { ...prev, [randId]: { ...current, emotion: null, isWalking: false } };
            });
          }, 4800);

          // Phase 3: Spend time on Floor 5 being coached (8 seconds), then return
          setTimeout(() => {
            // Emerge from elevator
            setMentoringIds((prev) => {
              const next = new Set(prev);
              next.delete(randId);
              return next;
            });
            // Position at elevator, and walk back to desk
            setEmpStates((prev) => {
              const current = prev[randId];
              if (!current) return prev;
              return {
                ...prev,
                [randId]: {
                  ...current,
                  x: defaultX,
                  isWalking: true,
                  flip: true,
                },
              };
            });

            // Arrive back at desk, settle, level up/gain XP!
            setTimeout(() => {
              setEmpStates((prev) => {
                const current = prev[randId];
                if (!current) return prev;
                return {
                  ...prev,
                  [randId]: {
                    ...current,
                    isWalking: false,
                    flip: false,
                    emotion: 'Leveled up! 🎓 +100XP',
                  },
                };
              });
              rewardXP(randId, 100);

              // Clear XP bubble
              setTimeout(() => {
                setEmpStates((prev) => {
                  const current = prev[randId];
                  if (!current) return prev;
                  return { ...prev, [randId]: { ...current, emotion: null } };
                });
              }, 3000);
            }, 4800);

          }, 12500);
          return; // skip other actions on this tick to prevent overlaps
        }
      }

      // -------------------------------------------------------------
      // CASE B: FLOOR 5 VISITOR MENTORING SIMULATION
      // -------------------------------------------------------------
      if (floor === 5 && !visitor && Math.random() < 0.15) {
        // Find SREs/Devs present in the company excluding CTO
        const candidates = EMPLOYEES.filter((e) => e.id !== 'alex-chen' && presentIds.has(e.id));
        if (candidates.length > 0) {
          const cand = candidates[Math.floor(Math.random() * candidates.length)];
          const initialVisitor = {
            id: cand.id,
            name: cand.name,
            role: cand.role,
            color: cand.color,
            skinTone: cand.skinTone,
            hairStyle: cand.hairStyle,
            hairColor: cand.hairColor,
            accessory: cand.accessory,
            x: ELEVATOR_X - 65,
            y: 120 + 40,
            isWalking: true,
            flip: true,
            emotion: 'I am stuck, need advice 🤔',
          };
          setVisitor(initialVisitor);

          // Phase 1: Walk visitor to CTO desk (x = 480)
          setTimeout(() => {
            setVisitor((v) => (v ? { ...v, x: 480, isWalking: true, flip: true } : null));
          }, 100);

          // Phase 2: Arrived! Ask questions
          setTimeout(() => {
            setVisitor((v) => (v ? { ...v, isWalking: false, emotion: 'Hey Alex, need help! 🙏' } : null));
            
            // Phase 3: CTO Alex Chen responds with guidance
            setTimeout(() => {
              setEmpStates((prev) => {
                const cto = prev['alex-chen'];
                if (!cto) return prev;
                return { ...prev, ['alex-chen']: { ...cto, emotion: 'Check this ref! 💡' } };
              });
              setVisitor((v) => (v ? { ...v, emotion: 'Wassup, got it! 🎯' } : null));
            }, 4800);

            // Phase 4: Visitor understands, gains XP and levels up
            setTimeout(() => {
              setEmpStates((prev) => {
                const cto = prev['alex-chen'];
                if (!cto) return prev;
                return { ...prev, ['alex-chen']: { ...cto, emotion: null } };
              });
              setVisitor((v) => (v ? { ...v, emotion: 'Upgraded! 🎓 +100XP' } : null));
              rewardXP(cand.id, 100);
            }, 4800);

            // Phase 5: Settle and walk back to elevator
            setTimeout(() => {
              setVisitor((v) => (v ? { ...v, x: ELEVATOR_X - 65, isWalking: true, flip: false, emotion: 'Heading back down!' } : null));
            }, 7500);

            // Phase 6: Reach elevator and despawn
            setTimeout(() => {
              setVisitor(null);
            }, 12000);

          }, 4800);
          return;
        }
      }

      // -------------------------------------------------------------
      // CASE B2: FLOOR 6 FOUNDER MENTORING SIMULATION
      // -------------------------------------------------------------
      if (floor === 6 && !founderVisitor && Math.random() < 0.20) {
        const candidates = EMPLOYEES.filter((e) => e.id !== 'alex-chen' && presentIds.has(e.id));
        if (candidates.length > 0) {
          const cand = candidates[Math.floor(Math.random() * candidates.length)];
          const initialVisitor = {
            id: cand.id,
            name: cand.name,
            role: cand.role,
            color: cand.color,
            skinTone: cand.skinTone,
            hairStyle: cand.hairStyle,
            hairColor: cand.hairColor,
            accessory: cand.accessory,
            x: ELEVATOR_X - 65,
            y: 120 + 40,
            isWalking: true,
            flip: true,
            emotion: 'Seeking Founder guidance...',
            questionCount: 0,
          };
          setFounderVisitor(initialVisitor);

          // Phase 1: Walk visitor to Founder Meeting Table stage (x = 520)
          setTimeout(() => {
            setFounderVisitor((v) => (v ? { ...v, x: 520, isWalking: true, flip: true } : null));
          }, 100);

          // Phase 2: Arrived at Founder's presentation stage, present first clarification question
          setTimeout(() => {
            const initialQuestions = [
              'Should we deploy this critical DB change now? ⚠️',
              'Is this TypeScript refactor worth the risk? 🤔',
              'Do you want rate limits on this feature, Boss? 🌐',
              'Should we rewrite this backend logic in Go? 🚀',
              'Should we merge this PR without a senior review? 📂'
            ];
            const randQ = initialQuestions[Math.floor(Math.random() * initialQuestions.length)];
            setFounderVisitor((v) => (v ? { ...v, isWalking: false, emotion: randQ } : null));
          }, 4800);
          return;
        }
      }

      // -------------------------------------------------------------
      // CASE B3: CROSS-FLOOR VISIT — a colleague rides the elevator in from
      // another floor to ask someone present on THIS floor a question.
      // -------------------------------------------------------------
      if (floor !== 5 && floor !== 6 && !visitor && mentoringIds.size === 0 && Math.random() < 0.12) {
        // Hosts: people present on the current floor who can be asked.
        const hosts = employees.filter((e) => presentIds.has(e.id));
        // Guests: people whose home floor is elsewhere but who are in today.
        const guests = EMPLOYEES.filter((e) => e.floor !== floor && presentIds.has(e.id));
        if (hosts.length > 0 && guests.length > 0) {
          const guest = guests[Math.floor(Math.random() * guests.length)];
          const host = hosts[Math.floor(Math.random() * hosts.length)];
          const hostX = Math.min(host.deskPosition.x, ELEVATOR_X - 60);
          const hostY = host.deskPosition.y + 40;
          const hostFirst = host.name.split(' ')[0];
          const questions = [
            `Hey ${hostFirst}, can you review my PR? 🔍`,
            `${hostFirst}, quick question on the API? 🤔`,
            `Got a sec, ${hostFirst}? Need a second pair of eyes 👀`,
            `${hostFirst}, how do you handle this edge case? 🧩`,
            `Can you unblock me on this, ${hostFirst}? 🙏`,
          ];
          const randQ = questions[Math.floor(Math.random() * questions.length)];

          setVisitor({
            id: guest.id,
            name: guest.name,
            role: guest.role,
            color: guest.color,
            skinTone: guest.skinTone,
            hairStyle: guest.hairStyle,
            hairColor: guest.hairColor,
            accessory: guest.accessory,
            x: ELEVATOR_X - 65,
            y: hostY,
            isWalking: true,
            flip: true,
            emotion: `Heading to ${config.name}... 🛗`,
          });

          // Phase 1: walk over near the host (leaving room for both bubbles).
          setTimeout(() => {
            setVisitor((v) => (v ? { ...v, x: hostX + 60, isWalking: true, flip: true } : null));
          }, 100);

          // Phase 2: arrive and ask.
          setTimeout(() => {
            setVisitor((v) => (v ? { ...v, isWalking: false, emotion: randQ } : null));

            // Phase 3: host answers.
            setTimeout(() => {
              setEmpStates((prev) => {
                const h = prev[host.id];
                if (!h) return prev;
                return { ...prev, [host.id]: { ...h, emotion: 'Sure! Here you go 💡', emotionRaised: true } };
              });
            }, 1600);

            // Phase 4: visitor thanks + both gain a little XP.
            setTimeout(() => {
              setVisitor((v) => (v ? { ...v, emotion: 'Thanks, appreciate it! 🙏 +25XP' } : null));
              rewardXP(guest.id, 25);
              rewardXP(host.id, 25);
            }, 3600);

            // Phase 5: clear host bubble, visitor heads back to the elevator.
            setTimeout(() => {
              setEmpStates((prev) => {
                const h = prev[host.id];
                if (!h) return prev;
                return { ...prev, [host.id]: { ...h, emotion: null, emotionRaised: false } };
              });
              setVisitor((v) =>
                v ? { ...v, x: ELEVATOR_X - 65, isWalking: true, flip: false, emotion: 'Back to my floor!' } : null,
              );
            }, 5600);

            // Phase 6: despawn at the elevator.
            setTimeout(() => setVisitor(null), 9600);
          }, 4800);
          return;
        }
      }

      // -------------------------------------------------------------
      // CASE E: COLLEAGUE SYNC AND COLLABORATION (Floors 1-4)
      // -------------------------------------------------------------
      if (floor !== 5 && floor !== 6 && Math.random() < 0.28 && mentoringIds.size === 0) {
        const candidates = employees.filter((e) => presentIds.has(e.id) && !mentoringIds.has(e.id));
        if (candidates.length >= 2) {
          const idx1 = Math.floor(Math.random() * candidates.length);
          let idx2 = Math.floor(Math.random() * candidates.length);
          while (idx2 === idx1) {
            idx2 = Math.floor(Math.random() * candidates.length);
          }
          const sender = candidates[idx1];
          const receiver = candidates[idx2];
          
          const senderState = empStates[sender.id];
          const receiverState = empStates[receiver.id];

          if (senderState && receiverState && !senderState.isWalking && !receiverState.isWalking) {
            const senderDefaultX = Math.min(sender.deskPosition.x, ELEVATOR_X - 60);
            const receiverDefaultX = Math.min(receiver.deskPosition.x, ELEVATOR_X - 60);
            // Stand a comfortable distance apart so their speech bubbles have room.
            const approachFromLeft = senderDefaultX < receiverDefaultX;
            const targetX = receiverDefaultX + (approachFromLeft ? -52 : 52);

            // 1. Sender starts walking and tells receiver they are heading over
            setEmpStates((prev) => {
              const s = prev[sender.id];
              if (!s) return prev;
              return {
                ...prev,
                [sender.id]: {
                  ...s,
                  emotion: `Going to chat with ${receiver.name.split(' ')[0]}... 🏃‍♂️`,
                  x: targetX,
                  isWalking: true,
                  flip: targetX < s.x
                }
              };
            });

            // Prevent other interactions from choosing them during the walk & talk
            setMentoringIds((prev) => new Set([...prev, sender.id, receiver.id]));

            // 2. Sender arrives at receiver's desk
            setTimeout(() => {
              setEmpStates((prev) => {
                const s = prev[sender.id];
                if (!s) return prev;
                const questions = [
                  "Yo! Did you check that PR? 📂",
                  "Hey, how's the refactor going? 🛠️",
                  "Got a sec to look at this bug? 🔍",
                  "Is the production build green? 🚀",
                  "Do you want to grab lunch after this? 🍕",
                  "Need a hand with this module? 🤝",
                  "Did you run the security scanners? 🚨"
                ];
                return {
                  ...prev,
                  [sender.id]: {
                    ...s,
                    isWalking: false,
                    emotion: questions[Math.floor(Math.random() * questions.length)]
                  }
                };
              });

              // 3. Receiver responds shortly after
              setTimeout(() => {
                setEmpStates((prev) => {
                  const r = prev[receiver.id];
                  if (!r) return prev;
                  const lookLeft = senderDefaultX < receiverDefaultX;
                  const responses = [
                    "Yeah, checking it now! 👍",
                    "All good, just finished! 🔥",
                    "Let me review the logs... 💻",
                    "Yep, tests are passing! ✅",
                    "Sure, let's go! ☕",
                    "Almost done, will ping you! ⏳",
                    "No threats detected! 🛡️"
                  ];
                  return {
                    ...prev,
                    [receiver.id]: {
                      ...r,
                      flip: lookLeft,
                      // Raise the responder's bubble so it stacks above the
                      // asker's instead of covering it.
                      emotionRaised: true,
                      emotion: responses[Math.floor(Math.random() * responses.length)]
                    }
                  };
                });
              }, 1800);

              // 4. Conversation ends, sender heads back
              setTimeout(() => {
                setEmpStates((prev) => {
                  const r = prev[receiver.id];
                  if (!r) return prev;
                  return { ...prev, [receiver.id]: { ...r, emotion: null, emotionRaised: false } };
                });

                setEmpStates((prev) => {
                  const s = prev[sender.id];
                  if (!s) return prev;
                  return {
                    ...prev,
                    [sender.id]: {
                      ...s,
                      emotion: "Got it! Heading back. 🚶‍♂️",
                      x: senderDefaultX,
                      isWalking: true,
                      flip: senderDefaultX < s.x
                    }
                  };
                });
              }, 5000);

              // 5. Sender arrives back at desk, thinks, then goes back to standby/work
              setTimeout(() => {
                setEmpStates((prev) => {
                  const s = prev[sender.id];
                  if (!s) return prev;
                  const thoughts = [
                    "💭 Hmm, need to optimize that connection pooling...",
                    "💭 Okay, let me write some unit tests for this query...",
                    "💭 Let's rebase the branch now.",
                    "💭 Need to update the API documentation.",
                    "💭 Wait, did I check the cache expiration?",
                    "💭 Let's refactor that component to use hooks."
                  ];
                  return {
                    ...prev,
                    [sender.id]: {
                      ...s,
                      isWalking: false,
                      flip: false,
                      emotion: thoughts[Math.floor(Math.random() * thoughts.length)]
                    }
                  };
                });

                // Free them up for future tasks
                setMentoringIds((prev) => {
                  const next = new Set(prev);
                  next.delete(sender.id);
                  next.delete(receiver.id);
                  return next;
                });

                // 6. Clear thought bubble
                setTimeout(() => {
                  setEmpStates((prev) => {
                    const s = prev[sender.id];
                    if (!s) return prev;
                    return { ...prev, [sender.id]: { ...s, emotion: null } };
                  });
                }, 3000);

              }, 9800); // 5000 conversation + 4800 walk back

            }, 4800); // Walk to receiver desk

            return; // skip other random actions on this tick
          }
        }
      }

      // -------------------------------------------------------------
      // CASE C: STANDARD OFFICE ROAMING (if not mentoring / Floor 5 visitor)
      // -------------------------------------------------------------
      if (Math.random() < 0.45) {
        const activeIds = employees.filter((e) => presentIds.has(e.id) && !mentoringIds.has(e.id)).map((e) => e.id);
        if (activeIds.length > 0) {
          const randId = activeIds[Math.floor(Math.random() * activeIds.length)];
          const emp = employees.find((e) => e.id === randId)!;
          const defaultX = Math.min(emp.deskPosition.x, ELEVATOR_X - 60);
          const defaultY = emp.deskPosition.y + 40;

          let chosenEmotion: string | null = null;
          let targetX = defaultX;
          let targetY = defaultY;

          setEmpStates((prev) => {
            const current = prev[randId];
            if (!current) return prev;

            const atDesk = Math.abs(current.x - defaultX) < 5 && Math.abs(current.y - defaultY) < 5;

            if (atDesk) {
              const roll = Math.random();
              if (roll < 0.35) {
                targetX = ELEVATOR_X - 65; // walk to elevator
                chosenEmotion = "Taking a quick break! 🚶‍♂️";
              } else if (roll < 0.70) {
                targetX = 45; // walk to left plants / lounge
                chosenEmotion = "Heading to grab coffee! ☕";
              } else {
                targetX = 140 + Math.random() * 280; // random walk
                chosenEmotion = "Brainstorming stretch... 💡";
              }
              // Gentle vertical wander, clamped to the floor band so they never
              // drift up into the wall or down off the bottom edge.
              targetY = Math.min(SCENE_H - 60, Math.max(96, defaultY + (Math.random() * 44 - 22)));
            }

            return {
              ...prev,
              [randId]: {
                ...current,
                x: targetX,
                y: targetY,
                isWalking: targetX !== current.x || targetY !== current.y,
                flip: targetX < current.x,
                emotion: chosenEmotion || current.emotion,
              },
            };
          });

          // If they went to get coffee, show arrival bubble
          if (targetX === 45) {
            setTimeout(() => {
              setEmpStates((prev) => {
                const curr = prev[randId];
                if (!curr || Math.abs(curr.x - 45) > 5) return prev;
                return { ...prev, [randId]: { ...curr, emotion: "Ah, coffee! ☕ Chilling... 🛋️" } };
              });
            }, 3800);
          }

          // Return to desk after a random timeout
          setTimeout(() => {
            setEmpStates((prev) => {
              const current = prev[randId];
              if (!current) return prev;
              const headingBackEmotion = targetX === 45 ? "Refreshed! Back to code. 💻" : "Back to my desk! 🏃‍♂️";
              return {
                ...prev,
                [randId]: {
                  ...current,
                  x: defaultX,
                  y: defaultY,
                  isWalking: defaultX !== current.x || defaultY !== current.y,
                  flip: defaultX < current.x,
                  emotion: headingBackEmotion,
                },
              };
            });

            // Clear returning emotion bubble after arrival
            setTimeout(() => {
              setEmpStates((prev) => {
                const current = prev[randId];
                if (!current) return prev;
                return {
                  ...prev,
                  [randId]: { ...current, emotion: null },
                };
              });
            }, 3000);

          }, 6000 + Math.random() * 3000);
        }
      }

      // -------------------------------------------------------------
      // CASE D: STANDARD EMOTIONS & CONVERSATIONS (if not mentoring / Floor 5 visitor)
      // -------------------------------------------------------------
      if (Math.random() < 0.40) {
        const activeIds = employees.filter((e) => presentIds.has(e.id) && !mentoringIds.has(e.id)).map((e) => e.id);
        if (activeIds.length > 0) {
          const randId = activeIds[Math.floor(Math.random() * activeIds.length)];
          const hasBadge = Boolean(taskBadges[randId]);
          const badgeSev = taskBadges[randId]?.severity;
          // The actual finding this person was assigned in the team review.
          const task = taskBadges[randId]?.label ?? 'the issue';

          let potentialEmotions = [
            'Wassup man! ☕',
            'How are you? Good? 👋',
            'You good homie? 💬',
            'Need help with this? 🛠️',
            'Let\'s code this! 💻',
            'Nice code! 👍',
            'Vibing with the grind 🎸',
            'Gotta check the logs... 🔍',
            'Coffee is life ☕',
            'Wait, let me double check... 🤔',
            'Looks clean! 🔥',
            'Who broke the build? 😭',
            'LGTM! Approve it! ✅',
            'Pushing to main... 🚀',
            'Rebasing this branch 🌿',
            'Did you see the new feature? ✨',
            'Another day, another line of code 💻',
            'That design is fire! 🔥',
            'Testing this in local... 🧪',
            'Let me grab a snack real quick 🍩',
            'Meeting in 5 minutes! 👥',
            'Can you review my PR? 📂',
            'No way that works... 😂',
            'It works on my machine! 🤷',
            'Refactoring this mess 🧹',
            'Wait, where is the documentation? 📖',
            'Lunch soon? 🍕',
            'Gotta love typescript! ❤️',
            'Almost done with this sprint 🏃',
            'Yo, check this out! 🤩'
          ];

          if (timeState.isWeekend) {
            potentialEmotions = [
              "Hey, it's Sunday, let us rest! 🛌",
              "Boss, it's Sunday! Why are we working? 😭",
              "I should be sleeping at home... 😴",
              "Is there weekend double pay? 💸",
              "Sunday grind is rough... ☕",
              "Sunday code compile hits different 💀",
              "Let us rest, boss! 🛌",
              "Hey, it's Sunday! Let us rest! 😭"
            ];
          } else if (badgeSev === 'critical' || badgeSev === 'high' || (floor === 4 && threatLevel === 'red')) {
            potentialEmotions = [
              `🚨 Critical: ${task}`,
              `Fixing ASAP: ${task} ⚡`,
              `Triaging: ${task} 💢`,
              `On it: ${task} 🔥`,
              `Rolling back: ${task} 🚨`,
              `Investigating: ${task} 🔍`,
            ];
          } else if (hasBadge) {
            potentialEmotions = [
              `Reviewing: ${task} 🔍`,
              `Fixing: ${task} 🛠️`,
              `Brainstorming a fix for ${task} 💡`,
              `Checking the code for ${task} 👀`,
              `Writing a patch for ${task} ✏️`,
              `Testing the fix for ${task} 🧪`,
              `Almost done with ${task} ✅`,
            ];
          }

          const emotion = potentialEmotions[Math.floor(Math.random() * potentialEmotions.length)];

          setEmpStates((prev) => {
            const current = prev[randId];
            if (!current) return prev;
            return {
              ...prev,
              [randId]: { ...current, emotion },
            };
          });

          // Clear emotion bubble
          setTimeout(() => {
            setEmpStates((prev) => {
              const current = prev[randId];
              if (!current) return prev;
              return {
                ...prev,
                [randId]: { ...current, emotion: null },
              };
            });
          }, 3000);
        }
      }
    }, 2200);

    return () => clearInterval(tick);
  }, [employees, presentIds, taskBadges, floor, threatLevel, mentoringIds, visitor, isOffDuty]);


  return (
    <div className="archco-scene-wrap" style={{ background: config.backgroundColor }}>
      {/* Lighting overlay tracks day/night. */}
      <div
        className="archco-light-overlay"
        style={{ opacity: (1 - lit) * 0.45 }}
        aria-hidden="true"
      />
      {floor === 4 && (
        <div className={`archco-threat-tint threat-${threatLevel}`} aria-hidden="true" />
      )}

      <svg
        viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
        className="archco-scene-svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="lamp-light-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FDE047" stopOpacity="0.5" />
            <stop offset="40%" stopColor="#FDE047" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#FDE047" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="window-sky-gradient" x1="0" y1="0" x2="0" y2="1">
            {(timeState.timeOfDay === 'day' || (timeState.timeOfDay === 'weekend' && timeState.lightLevel > 0.5)) ? (
              <>
                <stop offset="0%" stopColor="#60A5FA" />
                <stop offset="100%" stopColor="#93C5FD" />
              </>
            ) : timeState.timeOfDay === 'dawn' ? (
              <>
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#FECACA" />
              </>
            ) : timeState.timeOfDay === 'evening' ? (
              <>
                <stop offset="0%" stopColor="#4F46E5" />
                <stop offset="100%" stopColor="#EC4899" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#0B132B" />
                <stop offset="100%" stopColor="#1C2541" />
              </>
            )}
          </linearGradient>
        </defs>

        {/* Back wall + floor band */}
        <rect x="0" y="0" width={SCENE_W} height={SCENE_H} fill={config.backgroundColor} />
        <rect x="0" y="0" width={SCENE_W} height="70" fill={config.wallColor} />
        <rect x="0" y={SCENE_H - 40} width={SCENE_W} height="40" fill={config.wallColor} opacity="0.6" />

        {/* Windows with dynamic cityscape sky and glass reflections */}
        <g>
          {/* Window 1 */}
          <rect x="80" y="15" width="60" height="40" fill="url(#window-sky-gradient)" stroke="#475569" strokeWidth="1.5" rx="1.5" />
          <line x1="110" y1="15" x2="110" y2="55" stroke="#FFFFFF" strokeWidth="0.8" opacity="0.25" />
          <line x1="80" y1="35" x2="140" y2="35" stroke="#FFFFFF" strokeWidth="0.8" opacity="0.25" />
          
          {/* Window 2 */}
          <rect x="240" y="15" width="60" height="40" fill="url(#window-sky-gradient)" stroke="#475569" strokeWidth="1.5" rx="1.5" />
          <line x1="270" y1="15" x2="270" y2="55" stroke="#FFFFFF" strokeWidth="0.8" opacity="0.25" />
          <line x1="240" y1="35" x2="300" y2="35" stroke="#FFFFFF" strokeWidth="0.8" opacity="0.25" />
          
          {/* Window 3 */}
          <rect x="400" y="15" width="60" height="40" fill="url(#window-sky-gradient)" stroke="#475569" strokeWidth="1.5" rx="1.5" />
          <line x1="430" y1="15" x2="430" y2="55" stroke="#FFFFFF" strokeWidth="0.8" opacity="0.25" />
          <line x1="400" y1="35" x2="460" y2="35" stroke="#FFFFFF" strokeWidth="0.8" opacity="0.25" />

          {/* Dynamic Celestial Details (Sun/Cloud or Moon/Stars) inside windows */}
          {(timeState.timeOfDay === 'day' || (timeState.timeOfDay === 'weekend' && timeState.lightLevel > 0.5)) ? (
            <>
              {/* Sun in Window 1 */}
              <circle cx="92" cy="24" r="3.5" fill="#FEF08A" opacity="0.9" pointerEvents="none" />
              {/* Clouds */}
              <ellipse cx="282" cy="24" rx="6" ry="3.5" fill="#FFFFFF" opacity="0.75" pointerEvents="none" />
              <ellipse cx="422" cy="23" rx="5" ry="3" fill="#FFFFFF" opacity="0.75" pointerEvents="none" />
            </>
          ) : (timeState.timeOfDay === 'night' || (timeState.timeOfDay === 'weekend' && timeState.lightLevel <= 0.5)) ? (
            <>
              {/* Moon in Window 1 */}
              <circle cx="95" cy="25" r="3" fill="#FDE047" opacity="0.8" pointerEvents="none" />
              {/* Stars */}
              <circle cx="285" cy="23" r="0.8" fill="#FFFFFF" opacity="0.9" pointerEvents="none" />
              <circle cx="415" cy="26" r="0.8" fill="#FFFFFF" opacity="0.9" pointerEvents="none" />
            </>
          ) : null}
        </g>

        {/* Pendant Ceiling Lamps (hanging lights with active glowing light cones) */}
        <g>
          {/* Light Cones casting warm workspace light */}
          <polygon points="176,33 184,33 240,320 120,320" fill="url(#lamp-light-gradient)" opacity={0.3 + (1 - lit) * 0.45} pointerEvents="none" />
          <polygon points="336,33 344,33 400,320 280,320" fill="url(#lamp-light-gradient)" opacity={0.3 + (1 - lit) * 0.45} pointerEvents="none" />
          <polygon points="496,33 504,33 560,320 440,320" fill="url(#lamp-light-gradient)" opacity={0.3 + (1 - lit) * 0.45} pointerEvents="none" />

          {/* Lamp 1 */}
          <line x1="180" y1="0" x2="180" y2="25" stroke="#475569" strokeWidth="1" />
          <path d="M 172 25 L 188 25 L 184 32 L 176 32 Z" fill="#64748B" />
          <ellipse cx="180" cy="33" rx="3" ry="1.5" fill="#FDE047" opacity="0.9" />
          
          {/* Lamp 2 */}
          <line x1="340" y1="0" x2="340" y2="25" stroke="#475569" strokeWidth="1" />
          <path d="M 332 25 L 348 25 L 344 32 L 336 32 Z" fill="#64748B" />
          <ellipse cx="340" cy="33" rx="3" ry="1.5" fill="#FDE047" opacity="0.9" />
          
          {/* Lamp 3 */}
          <line x1="500" y1="0" x2="500" y2="25" stroke="#475569" strokeWidth="1" />
          <path d="M 492 25 L 508 25 L 504 32 L 496 32 Z" fill="#64748B" />
          <ellipse cx="500" cy="33" rx="3" ry="1.5" fill="#FDE047" opacity="0.9" />
        </g>

        {/* Floor-specific visual props */}
        {floor === 1 && (
          <g>
            {/* Reception Desk */}
            <rect x="25" y="220" width="60" height="24" fill="#334155" rx="1.5" />
            <rect x="25" y="220" width="60" height="4" fill="#1E293B" />
            {/* Reception Sign */}
            <rect x="42" y="206" width="26" height="12" fill="#0F172A" stroke="#334155" strokeWidth="0.8" />
            <text x="55" y="215" fill="#10B981" fontSize="7" fontWeight="bold" textAnchor="middle">INFO</text>
            
            {/* Lounge Sofa */}
            <rect x="130" y="224" width="46" height="18" fill="#7F1D1D" rx="2" />
            <rect x="134" y="214" width="38" height="12" fill="#991B1B" rx="1.5" />
            <rect x="126" y="220" width="6" height="20" fill="#991B1B" rx="1" />
            <rect x="172" y="220" width="6" height="20" fill="#991B1B" rx="1" />

            {/* Interactive Wall Projector Screen displaying weekly reviews / wiki outputs */}
            <rect x="210" y="90" width="160" height="90" fill="#0F172A" stroke="#475569" strokeWidth="2" rx="4" />
            <rect x="210" y="90" width="160" height="14" fill="#1E293B" />
            <text x="290" y="100" fill="#6366F1" fontSize="7" fontWeight="bold" textAnchor="middle">WEEKLY MEETING BOARD</text>
            
            {wikiEntries.length > 0 ? (
              <>
                <text x="220" y="120" fill="#E2E8F0" fontSize="7" fontWeight="bold">
                  Project: {wikiEntries[wikiEntries.length - 1].projectName.slice(0, 24)}
                </text>
                <text x="220" y="138" fill="#38BDF8" fontSize="6">
                  {wikiEntries[wikiEntries.length - 1].decision.length > 38 
                    ? wikiEntries[wikiEntries.length - 1].decision.slice(0, 35) + '...' 
                    : wikiEntries[wikiEntries.length - 1].decision}
                </text>
                <text x="220" y="152" fill="#A7F3D0" fontSize="5.5" opacity="0.8">
                  {wikiEntries[wikiEntries.length - 1].rationale.length > 42 
                    ? wikiEntries[wikiEntries.length - 1].rationale.slice(0, 39) + '...' 
                    : wikiEntries[wikiEntries.length - 1].rationale}
                </text>
                <text x="220" y="168" fill="#FCD34D" fontSize="6" fontWeight="bold">
                  Status: COMPLETED ✅
                </text>
              </>
            ) : (
              <>
                <text x="290" y="136" fill="#64748B" fontSize="7" textAnchor="middle">No weekly updates yet...</text>
                <text x="290" y="152" fill="#64748B" fontSize="6" textAnchor="middle" opacity="0.7">Run a Team Review to generate output</text>
              </>
            )}
            
            {/* Projector stand */}
            <line x1="250" y1="180" x2="230" y2="216" stroke="#475569" strokeWidth="1.5" />
            <line x1="330" y1="180" x2="350" y2="216" stroke="#475569" strokeWidth="1.5" />
          </g>
        )}

        {floor === 2 && (
          <g>
            {/* Server Rack Cabinet */}
            <rect x="26" y="100" width="30" height="110" fill="#0F172A" stroke="#334155" strokeWidth="1.5" />
            <rect x="29" y="104" width="24" height="102" fill="#1E293B" />
            {/* Blinking LEDs (connected to standard css blink) */}
            <circle cx="34" cy="112" r="1" fill="#10B981" className="archco-led-blink" />
            <circle cx="41" cy="112" r="1" fill="#10B981" className="archco-led-blink" />
            <circle cx="48" cy="112" r="1" fill="#EF4444" className="archco-led-blink" />
            
            <circle cx="34" cy="122" r="1" fill="#10B981" className="archco-led-blink" />
            <circle cx="41" cy="122" r="1" fill="#EF4444" className="archco-led-blink" />
            <circle cx="48" cy="122" r="1" fill="#10B981" className="archco-led-blink" />

            <circle cx="34" cy="132" r="1" fill="#FBBF24" className="archco-led-blink" />
            <circle cx="41" cy="132" r="1" fill="#10B981" className="archco-led-blink" />
            <circle cx="48" cy="132" r="1" fill="#10B981" className="archco-led-blink" />

            <circle cx="34" cy="142" r="1" fill="#10B981" className="archco-led-blink" />
            <circle cx="41" cy="142" r="1" fill="#10B981" className="archco-led-blink" />
            <circle cx="48" cy="142" r="1" fill="#EF4444" className="archco-led-blink" />
          </g>
        )}

        {floor === 3 && (
          <g>
            {/* Whiteboard with UI sketching wireframe doodles */}
            <rect x="25" y="105" width="56" height="38" fill="#F8FAFC" stroke="#475569" strokeWidth="1.8" />
            {/* Board stand */}
            <line x1="33" y1="143" x2="28" y2="162" stroke="#475569" strokeWidth="1.5" />
            <line x1="73" y1="143" x2="78" y2="162" stroke="#475569" strokeWidth="1.5" />
            <line x1="28" y1="162" x2="35" y2="162" stroke="#475569" strokeWidth="1.5" />
            <line x1="78" y1="162" x2="71" y2="162" stroke="#475569" strokeWidth="1.5" />
            {/* Doodles */}
            <rect x="30" y="110" width="12" height="18" fill="none" stroke="#2563EB" strokeWidth="0.8" />
            <circle cx="36" cy="115" r="2" fill="none" stroke="#2563EB" strokeWidth="0.6" />
            <line x1="32" y1="122" x2="40" y2="122" stroke="#2563EB" strokeWidth="0.6" />
            <rect x="47" y="110" width="28" height="8" fill="none" stroke="#D97706" strokeWidth="0.8" />
            <line x1="49" y1="121" x2="71" y2="121" stroke="#10B981" strokeWidth="1" />
            <line x1="49" y1="126" x2="66" y2="126" stroke="#10B981" strokeWidth="1" />
          </g>
        )}

        {floor === 6 && (
          <g>
            {/* Founder's Desk (Futuristic glassmorphic green style) */}
            <rect x="290" y="210" width="80" height="28" fill="rgba(16, 185, 129, 0.2)" stroke="#10B981" strokeWidth="1.5" rx="4" />
            <rect x="290" y="210" width="80" height="5" fill="#10B981" />
            
            {/* Holographic Glowing AI Brain Projection */}
            <ellipse cx="330" cy="150" rx="20" ry="16" fill="rgba(16, 185, 129, 0.15)" stroke="#10B981" strokeWidth="1" strokeDasharray="3 3" className="archco-led-blink" />
            <circle cx="320" cy="144" r="3" fill="#34D399" />
            <circle cx="340" cy="144" r="3" fill="#34D399" />
            <path d="M 318 156 Q 330 168 342 156" fill="none" stroke="#10B981" strokeWidth="1.5" />
            <line x1="330" y1="166" x2="330" y2="210" stroke="#10B981" strokeWidth="0.5" strokeDasharray="2 2" />

            {/* AI Console Screen Monitor */}
            <rect x="250" y="110" width="34" height="20" rx="2" fill="#0F172A" stroke="#475569" strokeWidth="1" />
            <rect x="252" y="112" width="30" height="13" fill="#059669" />
            <text x="267" y="121" fill="#FFFFFF" fontSize="6" fontWeight="bold" textAnchor="middle">AI BRAIN</text>
            <line x1="267" y1="130" x2="267" y2="210" stroke="#475569" strokeWidth="1" />

            {/* Retro Screens on Left Wall */}
            <rect x="20" y="80" width="40" height="60" fill="#1E293B" stroke="#475569" rx="2" />
            <rect x="24" y="84" width="32" height="52" fill="#0284C7" />
            <line x1="24" y1="96" x2="56" y2="96" stroke="#38BDF8" strokeWidth="0.8" />
            <line x1="24" y1="110" x2="56" y2="110" stroke="#38BDF8" strokeWidth="0.8" />
            <text x="40" y="124" fill="#FFFFFF" fontSize="6" textAnchor="middle">STATUS: OK</text>

            {/* PENTHOUSE SHOWCASE MEETING ROOM SETTINGS */}
            {/* Presentation Showcase Screen */}
            <rect x="450" y="80" width="140" height="74" fill="#0F172A" stroke="#10B981" strokeWidth="1.5" rx="3" />
            <rect x="450" y="80" width="140" height="12" fill="#1E293B" />
            <text x="520" y="89" fill="#10B981" fontSize="6" fontWeight="bold" textAnchor="middle">FOUNDER SHOWCASE STAGE</text>
            
            {founderVisitor && !founderVisitor.isWalking ? (
              <>
                <text x="460" y="106" fill="#34D399" fontSize="6" fontWeight="bold">SHOWCASING OUTPUT:</text>
                <text x="460" y="120" fill="#FFFFFF" fontSize="6" width="120">
                  {founderVisitor.role.toUpperCase()} Update
                </text>
                <text x="460" y="132" fill="#94A3B8" fontSize="5">
                  Confirming implementation choices
                </text>
                <circle cx="566" cy="126" r="3" fill="#10B981" className="archco-led-blink" />
              </>
            ) : (
              <>
                <text x="520" y="118" fill="#475569" fontSize="6" textAnchor="middle">STAGE IDLE</text>
                <text x="520" y="130" fill="#475569" fontSize="5" textAnchor="middle">Waiting for review candidate...</text>
              </>
            )}

            {/* Large Penthouse Meeting Table */}
            <ellipse cx="520" cy="225" rx="60" ry="12" fill="#1E293B" stroke="#334155" strokeWidth="1.5" />
            {/* Desk chair backs behind table */}
            <rect x="475" y="206" width="16" height="12" rx="2" fill="#0F172A" />
            <rect x="545" y="206" width="16" height="12" rx="2" fill="#0F172A" />
          </g>
        )}

        {/* Potted Office Plants */}
        <g>
          {/* Plant 1 (Left) */}
          <rect x="34" y="270" width="12" height="12" fill="#B45309" rx="1" />
          <path d="M 32 270 Q 24 254 38 258" fill="none" stroke="#15803D" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 40 270 Q 48 250 42 256" fill="none" stroke="#166534" strokeWidth="3" strokeLinecap="round" />
          <path d="M 46 270 Q 56 260 44 262" fill="none" stroke="#15803D" strokeWidth="2.5" strokeLinecap="round" />
          
          {/* Plant 2 (Middle-Right) */}
          <rect x="524" y="270" width="12" height="12" fill="#B45309" rx="1" />
          <path d="M 522 270 Q 514 252 528 256" fill="none" stroke="#15803D" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 530 270 Q 538 248 532 254" fill="none" stroke="#166534" strokeWidth="3" strokeLinecap="round" />
        </g>

        {/* Corporate office decor (standard floors) — gives the space a real
            office feel: ceiling lights, a wall clock, framed art, a water
            cooler, and a lounge coffee table. */}
        {floor <= 4 && (
          <g>
            {/* Recessed ceiling light panels */}
            <rect x="120" y="2" width="80" height="5" rx="2.5" fill="#E2E8F0" opacity="0.16" />
            <rect x="320" y="2" width="80" height="5" rx="2.5" fill="#E2E8F0" opacity="0.16" />
            <rect x="520" y="2" width="80" height="5" rx="2.5" fill="#E2E8F0" opacity="0.16" />

            {/* Wall clock */}
            <circle cx="610" cy="34" r="11" fill="#0F172A" stroke="#475569" strokeWidth="1.5" />
            <circle cx="610" cy="34" r="1.3" fill="#94A3B8" />
            <line x1="610" y1="34" x2="610" y2="27" stroke="#CBD5E1" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="610" y1="34" x2="615" y2="34" stroke="#CBD5E1" strokeWidth="1.2" strokeLinecap="round" />

            {/* Framed wall art */}
            <rect x="150" y="20" width="26" height="20" rx="1" fill="#1E293B" stroke="#64748B" strokeWidth="1.2" />
            <path d="M153 37 L160 29 L165 33 L170 26 L173 37 Z" fill="#334155" />

            {/* Water cooler (lounge) */}
            <rect x="92" y="246" width="14" height="22" rx="2" fill="#CBD5E1" stroke="#64748B" strokeWidth="1" />
            <rect x="95" y="234" width="8" height="13" rx="3" fill="#38BDF8" opacity="0.7" />
            <rect x="96" y="258" width="6" height="3" fill="#0F172A" />

            {/* Lounge coffee table */}
            <ellipse cx="150" cy="272" rx="34" ry="4" fill="#000000" opacity="0.2" />
            <rect x="120" y="258" width="60" height="8" rx="2" fill="#3F2A1A" stroke="#5B3A22" strokeWidth="1" />
            <rect x="124" y="266" width="4" height="8" fill="#2A1C10" />
            <rect x="172" y="266" width="4" height="8" fill="#2A1C10" />
            {/* Coffee cup + steam on the table */}
            <ellipse cx="138" cy="258" rx="5" ry="1.6" fill="#94A3B8" />
            <rect x="135" y="254" width="6" height="4" rx="1" fill="#F8FAFC" />
            <path d="M141 255 q3 0 3 2 q0 2 -3 2" fill="none" stroke="#F8FAFC" strokeWidth="0.8" />
            {/* Stacked magazines */}
            <rect x="156" y="256" width="16" height="2.5" rx="0.5" fill="#6366F1" />
            <rect x="158" y="253.5" width="14" height="2.5" rx="0.5" fill="#10B981" />
          </g>
        )}

        {/* Desks and monitors for employees */}
        {employees.map((emp) => {
          const present = presentIds.has(emp.id);
          const x = Math.min(emp.deskPosition.x, ELEVATOR_X - 60);
          const y = emp.deskPosition.y + 40;
          
          const deskX = x - 9;
          const deskY = y + 26;

          return (
            <g key={`desk-${emp.id}`} opacity={present ? 1 : 0.45}>
              {/* Static office chair — stays at the workstation even when the
                  employee gets up and roams, so every desk reads as "theirs". */}
              <ellipse cx={x + 16} cy={y + 36} rx="13" ry="3" fill="#000000" opacity="0.2" />
              <rect x={x + 4} y={y + 4} width="24" height="20" rx="4" fill="#283548" stroke="#1E293B" strokeWidth="1" />
              <rect x={x + 7} y={y + 22} width="18" height="6" rx="2" fill="#334155" />
              <rect x={x + 15} y={y + 28} width="2" height="6" fill="#1E293B" />
              <rect x={x + 10} y={y + 33} width="12" height="2.5" rx="1" fill="#1E293B" />

              {/* Desk Shadow */}
              <ellipse cx={x + 16} cy={deskY + 12} rx="28" ry="3" fill="#000000" opacity="0.25" />
              
              {/* Desk Frame (Modern grey metal) */}
              <rect x={deskX} y={deskY + 4} width="4" height="10" fill="#334155" />
              <rect x={deskX + 46} y={deskY + 4} width="4" height="10" fill="#334155" />
              {/* Desk Top */}
              <rect x={deskX - 2} y={deskY} width="54" height="4" fill="#475569" rx="1.5" />
              <rect x={deskX - 2} y={deskY} width="54" height="1.5" fill="#64748B" rx="0.5" />
              
              {/* Computer Stand */}
              <rect x={x + 14} y={deskY - 8} width="4" height="8" fill="#1E293B" />
              <rect x={x + 11} y={deskY - 1} width="10" height="1.5" fill="#334155" />
              
              {/* Computer Monitor */}
              <rect x={x + 3} y={deskY - 20} width="26" height="13" rx="1.5" fill="#0F172A" stroke="#1E293B" strokeWidth="1" />
              {/* Glowing screen content */}
              <rect x={x + 5} y={deskY - 18} width="22" height="9" fill={present ? '#0284C7' : '#1E293B'} />
              {present && (
                <>
                  {/* Subtle code lines on screen */}
                  <line x1={x + 7} y1={deskY - 15} x2={x + 18} y2={deskY - 15} stroke="#38BDF8" strokeWidth="1" opacity="0.8" />
                  <line x1={x + 7} y1={deskY - 12} x2={x + 14} y2={deskY - 12} stroke="#34D399" strokeWidth="1" opacity="0.8" />
                  <line x1={x + 7} y1={deskY - 10} x2={x + 22} y2={deskY - 10} stroke="#F472B6" strokeWidth="1" opacity="0.8" />
                </>
              )}

              {/* Keyboard */}
              <rect x={x + 8} y={deskY - 1} width="16" height="1.5" fill="#334155" />
              {/* Mouse */}
              <rect x={x + 26} y={deskY - 0.5} width="2" height="1" fill="#475569" />

              {/* Coffee mug */}
              <rect x={deskX + 3} y={deskY - 3} width="3" height="3.5" rx="0.5" fill="#EF4444" />
              <path d={`M ${deskX + 6} ${deskY - 2} C ${deskX + 7.5} ${deskY - 2}, ${deskX + 7.5} ${deskY - 1}, ${deskX + 6} ${deskY - 1}`} stroke="#EF4444" strokeWidth="0.8" fill="none" />
            </g>
          );
        })}

        {/* Elevator on the right edge */}
        <g>
          <rect
            x={ELEVATOR_X}
            y="140"
            width="44"
            height="90"
            rx="4"
            fill="#10101A"
            stroke={config.accentColor}
            strokeWidth="1.5"
          />
          <line
            x1={ELEVATOR_X + 22}
            y1="144"
            x2={ELEVATOR_X + 22}
            y2="226"
            stroke={config.accentColor}
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <text x={ELEVATOR_X + 22} y="134" textAnchor="middle" fill={config.accentColor} fontSize="10">
            ▲ {floor}
          </text>
        </g>

        {/* Floor 4 threat indicator */}
        {floor === 4 && (
          <g>
            <rect x="20" y="14" width="150" height="26" rx="4" fill="#160808" stroke="#7F1D1D" />
            <text x="30" y="31" fill="#F87171" fontSize="12" fontWeight="700">
              THREAT: {threatLevel.toUpperCase()}
            </text>
          </g>
        )}
      </svg>

      {/* Employees layered over the SVG (HTML for crisp text + click). */}
      <div className="archco-employee-layer">
        {employees.map((emp) => {
          const present = presentIds.has(emp.id) && !leftForDay.has(emp.id);
          const badge = taskBadges[emp.id];
          const state = empStates[emp.id];
          const x = state ? state.x : Math.min(emp.deskPosition.x, ELEVATOR_X - 60);
          const y = state ? state.y : emp.deskPosition.y + 40;
          return (
            <button
              key={emp.id}
              className="archco-employee"
              style={{ left: `${(x / SCENE_W) * 100}%`, top: `${(y / SCENE_H) * 100}%` }}
              onClick={() => {
                const dynStatus = getDynamicStatus(emp, state, badge, mentoringIds, timeState);
                const ambientMsg = emp.ambientMessages[Math.floor((emp.name.length + emp.role.length) % emp.ambientMessages.length)];
                const thought = state?.emotion || ambientMsg;
                onSelect(emp, dynStatus.label, thought);
              }}
              title={`${emp.name} · ${emp.role}`}
            >
              {/* Floating Emotion Speech Bubble */}
              {present && state?.emotion && (
                <div className={`archco-emotion-bubble${state.emotionRaised ? ' raised' : ''}`}>
                  {state.emotion}
                </div>
              )}
              {present && (() => {
                const dynStatus = getDynamicStatus(emp, state, badge, mentoringIds, timeState);
                return (
                  <span
                    className={`archco-task-badge${dynStatus.pulsing ? ' pulsing' : ''}`}
                    style={{
                      background: dynStatus.bgColor,
                      borderColor: dynStatus.color,
                      color: dynStatus.color,
                    }}
                  >
                    {dynStatus.icon} {dynStatus.label}
                  </span>
                );
              })()}
              <EmployeeSprite
                employee={emp}
                scale={2}
                absent={!present}
                working={present && !timeState.isWeekend && emp.status === 'working' && !state?.isWalking}
                isWalking={present && state?.isWalking}
                flip={present && state?.flip}
              />
              <span className="archco-employee-name">{emp.name.split(' ')[0]}</span>
            </button>
          );
        })}

        {/* Visitor rendering — a colleague who travelled in from another floor */}
        {visitor && (
          <button
            className="archco-employee archco-visitor"
            style={{ left: `${(visitor.x / SCENE_W) * 100}%`, top: `${(visitor.y / SCENE_H) * 100}%` }}
            onClick={() => {
              const fullEmp = EMPLOYEES.find(e => e.id === visitor.id);
              if (fullEmp) {
                const status = floor === 5 ? 'Visiting CTO Suite 👥' : `Visiting ${config.name} 👋`;
                onSelect(fullEmp, status, visitor.emotion || 'Asking a colleague... 💬');
              }
            }}
            title={`${visitor.name} · ${visitor.role} (Visiting)`}
          >
            {visitor.emotion && (
              <div className="archco-emotion-bubble">
                {visitor.emotion}
              </div>
            )}
            <EmployeeSprite
              employee={EMPLOYEES.find(e => e.id === visitor.id) || {
                id: visitor.id,
                name: visitor.name,
                role: visitor.role,
                department: 'engineering-backend',
                floor: 1,
                color: visitor.color,
                skinTone: visitor.skinTone,
                hairStyle: visitor.hairStyle,
                hairColor: visitor.hairColor,
                accessory: visitor.accessory,
                personality: '',
                deskPosition: { x: 0, y: 0 },
                level: 1,
                xp: 0,
                xpToNextLevel: 100,
                tasksCompleted: 0,
                status: 'working',
                catchphrases: [],
                ambientMessages: [],
                specialization: []
              }}
              scale={2}
              absent={false}
              working={!visitor.isWalking}
              isWalking={visitor.isWalking}
              flip={visitor.flip}
            />
            <span className="archco-employee-name">{visitor.name.split(' ')[0]}</span>
          </button>
        )}

        {/* Floor 6 Interactive Founder Dialog Visitor rendering */}
        {floor === 6 && founderVisitor && (
          <>
            <button
              className="archco-employee archco-visitor founder-visitor-btn"
              style={{ left: `${(founderVisitor.x / SCENE_W) * 100}%`, top: `${(founderVisitor.y / SCENE_H) * 100}%` }}
              onClick={() => {
                // Clicking the worker opens the chat overlay input modal
                if (!founderVisitor.isWalking) {
                  setShowChatInput(true);
                }
              }}
              title={`${founderVisitor.name} · ${founderVisitor.role} (Asking Founder)`}
            >
              {founderVisitor.emotion && (
                <div className="archco-emotion-bubble founder-bubble">
                  💬 {founderVisitor.emotion}
                </div>
              )}
              <EmployeeSprite
                employee={EMPLOYEES.find(e => e.id === founderVisitor.id) || {
                  id: founderVisitor.id,
                  name: founderVisitor.name,
                  role: founderVisitor.role,
                  department: 'engineering-backend',
                  floor: 1,
                  color: founderVisitor.color,
                  skinTone: founderVisitor.skinTone,
                  hairStyle: founderVisitor.hairStyle,
                  hairColor: founderVisitor.hairColor,
                  accessory: founderVisitor.accessory,
                  personality: '',
                  deskPosition: { x: 0, y: 0 },
                  level: 1,
                  xp: 0,
                  xpToNextLevel: 100,
                  tasksCompleted: 0,
                  status: 'working',
                  catchphrases: [],
                  ambientMessages: [],
                  specialization: []
                }}
                scale={2}
                absent={false}
                working={!founderVisitor.isWalking}
                isWalking={founderVisitor.isWalking}
                flip={founderVisitor.flip}
              />
              <span className="archco-employee-name" style={{ color: '#34D399' }}>{founderVisitor.name.split(' ')[0]}</span>
            </button>

            {/* Founder Chat Input Dialog HUD */}
            {showChatInput && (
              <div 
                className="founder-chat-overlay"
                style={{
                  position: 'absolute',
                  bottom: '20px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(15, 23, 42, 0.95)',
                  border: '2px solid #10B981',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  width: '320px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.7)',
                  zIndex: 100,
                  color: '#F1F5F9',
                  fontFamily: 'monospace'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '10px', color: '#10B981', borderBottom: '1px solid #334155', paddingBottom: '4px' }}>
                  <span>Q&A: {founderVisitor.name}</span>
                  <button onClick={() => setShowChatInput(false)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
                </div>
                <p style={{ fontSize: '11px', margin: '4px 0 12px 0', lineHeight: '1.4' }}>
                  <span style={{ color: '#FBBF24' }}>{founderVisitor.name.split(' ')[0]}: </span>
                  "{founderVisitor.emotion}"
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    placeholder="Type advice bro..."
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleFounderReply();
                    }}
                    style={{
                      flex: 1,
                      background: '#0F172A',
                      border: '1px solid #475569',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      color: '#F1F5F9',
                      fontSize: '11px',
                      outline: 'none'
                    }}
                  />
                  <button 
                    onClick={handleFounderReply}
                    style={{
                      background: '#10B981',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 12px',
                      color: '#0F172A',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Reply
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export const ARCHCO_SCENE_W = SCENE_W;
export const ARCHCO_SCENE_H = SCENE_H;
