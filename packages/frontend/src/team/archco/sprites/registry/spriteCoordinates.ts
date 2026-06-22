/**
 * Sprite Registry — generated from manifest.json
 *
 * Every extracted SVG sprite keyed by its sprite ID.
 * Use `spriteUrl(entry)` to resolve a path for use in <img src>.
 */

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface SpriteEntry {
  /** Relative path from the sprites/ directory (use spriteUrl() to load). */
  file: string;
  size: { w: number; h: number };
  /** Zero-based position on the source sheet. */
  index: number;
}

/** All sprite IDs across every sheet. */
export type SpriteId =
  | 'alex-chen-only_base'
  | 'alex-chen-only_emotion-neutral'
  | 'alex-chen-only_emotion-happy'
  | 'alex-chen-only_emotion-talking'
  | 'alex-chen-only_emotion-thinking'
  | 'alex-chen-only_emotion-stressed'
  | 'alex-chen-only_emotion-excited'
  | 'alex-chen-only_emotion-concerned'
  | 'alex-chen-only_emotion-frustrated'
  | 'alex-chen-only_emotion-satisfied'
  | 'alex-chen-only_emotion-curious'
  | 'alex-chen-only_emotion-celebrating'
  | 'alex-chen-only_emotion-sleeping'
  | 'alex-chen-only_emotion-panicking'
  | 'alex-chen-only_emotion-rushing'
  | 'alex-chen-only_idle-1'
  | 'alex-chen-only_idle-2'
  | 'alex-chen-only_idle-3'
  | 'alex-chen-only_idle-4'
  | 'alex-chen-only_typing-1'
  | 'alex-chen-only_typing-2'
  | 'alex-chen-only_walk-1'
  | 'alex-chen-only_walk-2'
  | 'alex-chen-only_walk-3'
  | 'alex-chen-only_walk-4'
  | 'alex-chen-only_panic-run-1'
  | 'alex-chen-only_panic-run-2'
  | 'alex-chen-only_panic-run-3'
  | 'alex-chen-only_panic-run-4'
  | 'alex-chen-only_sitting'
  | 'alex-chen-only_standup-1'
  | 'alex-chen-only_standup-2'
  | 'alex-chen-only_standup-3'
  | 'alex-chen-only_celebrate-1'
  | 'alex-chen-only_celebrate-2'
  | 'alex-chen-only_celebrate-3'
  | 'alex-chen-only_celebrate-4'
  | 'alex-chen-only_talk-1'
  | 'alex-chen-only_talk-2'
  | 'alex-chen-only_wave'
  | 'alex-chen-only_walk-home'
  | 'alex-chen-only_levelup-1'
  | 'alex-chen-only_levelup-2'
  | 'alex-chen-only_levelup-3'
  | 'alex-chen-only_levelup-4'
  | 'alex-chen-only_levelup-5'
  | 'alex-chen-only_coffee-walk-1'
  | 'alex-chen-only_coffee-walk-2'
  | 'alex-chen-only_late-mild'
  | 'alex-chen-only_late-panic'
  | 'building-exterior_000'
  | 'casey-kim-only_base'
  | 'casey-kim-only_emotion-neutral'
  | 'casey-kim-only_emotion-happy'
  | 'casey-kim-only_emotion-talking'
  | 'casey-kim-only_emotion-thinking'
  | 'casey-kim-only_emotion-stressed'
  | 'casey-kim-only_emotion-excited'
  | 'casey-kim-only_emotion-concerned'
  | 'casey-kim-only_emotion-frustrated'
  | 'casey-kim-only_emotion-satisfied'
  | 'casey-kim-only_emotion-curious'
  | 'casey-kim-only_emotion-celebrating'
  | 'casey-kim-only_emotion-sleeping'
  | 'casey-kim-only_emotion-panicking'
  | 'casey-kim-only_emotion-rushing'
  | 'casey-kim-only_idle-1'
  | 'casey-kim-only_idle-2'
  | 'casey-kim-only_idle-3'
  | 'casey-kim-only_idle-4'
  | 'casey-kim-only_typing-1'
  | 'casey-kim-only_typing-2'
  | 'casey-kim-only_walk-1'
  | 'casey-kim-only_walk-2'
  | 'casey-kim-only_walk-3'
  | 'casey-kim-only_walk-4'
  | 'casey-kim-only_panic-run-1'
  | 'casey-kim-only_panic-run-2'
  | 'casey-kim-only_panic-run-3'
  | 'casey-kim-only_panic-run-4'
  | 'casey-kim-only_sitting'
  | 'casey-kim-only_standup-1'
  | 'casey-kim-only_standup-2'
  | 'casey-kim-only_standup-3'
  | 'casey-kim-only_celebrate-1'
  | 'casey-kim-only_celebrate-2'
  | 'casey-kim-only_celebrate-3'
  | 'casey-kim-only_celebrate-4'
  | 'casey-kim-only_talk-1'
  | 'casey-kim-only_talk-2'
  | 'casey-kim-only_wave'
  | 'casey-kim-only_walk-home'
  | 'casey-kim-only_elevator'
  | 'casey-kim-only_levelup-1'
  | 'casey-kim-only_levelup-2'
  | 'casey-kim-only_levelup-3'
  | 'casey-kim-only_levelup-4'
  | 'casey-kim-only_levelup-5'
  | 'casey-kim-only_coffee-walk-1'
  | 'casey-kim-only_coffee-walk-2'
  | 'casey-kim-only_late-mild'
  | 'casey-kim-only_late-panic'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_000'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_001'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_002'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_003'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_004'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_005'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_006'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_007'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_008'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_009'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_010'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_011'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_012'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_013'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_014'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_015'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_016'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_017'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_018'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_019'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_020'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_021'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_022'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_023'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_024'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_025'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_026'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_027'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_028'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_029'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_030'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_031'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_032'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_033'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_034'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_035'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_036'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_037'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_038'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_039'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_040'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_041'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_042'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_043'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_044'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_045'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_046'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_047'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_048'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_049'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_050'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_051'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_052'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_053'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_054'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_055'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_056'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_057'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_058'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_059'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_060'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_061'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_062'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_063'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_064'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_065'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_066'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_067'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_068'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_069'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_070'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_071'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_072'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_073'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_074'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_075'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_076'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_077'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_078'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_079'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_080'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_081'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_082'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_083'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_084'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_085'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_086'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_087'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_088'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_089'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_090'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_091'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_092'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_093'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_094'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_095'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_096'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_097'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_098'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_099'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_100'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_101'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_102'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_103'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_104'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_105'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_106'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_107'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_108'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_109'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_110'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_111'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_112'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_113'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_114'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_115'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_116'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_117'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_118'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_119'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_120'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_121'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_122'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_123'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_124'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_125'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_126'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_127'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_128'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_129'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_130'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_131'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_132'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_133'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_134'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_135'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_136'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_137'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_138'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_139'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_140'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_141'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_142'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_143'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_144'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_145'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_146'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_147'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_148'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_149'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_150'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_151'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_152'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_153'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_154'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_155'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_156'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_157'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_158'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_159'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_160'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_161'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_162'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_163'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_164'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_165'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_166'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_167'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_168'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_169'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_170'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_171'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_172'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_173'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_174'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_175'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_176'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_177'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_178'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_179'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_180'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_181'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_182'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_183'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_184'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_185'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_186'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_187'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_188'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_189'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_190'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_191'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_192'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_193'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_194'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_195'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_196'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_197'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_198'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_199'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_200'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_201'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_202'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_203'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_204'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_205'
  | 'chris-ava-fran-jamie-daniel-sofia-batch_206'
  | 'conference-table-whiteboard-kanban-coffee-machine-plant_000'
  | 'conference-table-whiteboard-kanban-coffee-machine-plant_001'
  | 'conference-table-whiteboard-kanban-coffee-machine-plant_002'
  | 'conference-table-whiteboard-kanban-coffee-machine-plant_003'
  | 'conference-table-whiteboard-kanban-coffee-machine-plant_004'
  | 'conference-table-whiteboard-kanban-coffee-machine-plant_005'
  | 'conference-table-whiteboard-kanban-coffee-machine-plant_006'
  | 'conference-table-whiteboard-kanban-coffee-machine-plant_007'
  | 'conference-table-whiteboard-kanban-coffee-machine-plant_008'
  | 'conference-table-whiteboard-kanban-coffee-machine-plant_009'
  | 'conference-table-whiteboard-kanban-coffee-machine-plant_010'
  | 'conference-table-whiteboard-kanban-coffee-machine-plant_011'
  | 'conference-table-whiteboard-kanban-coffee-machine-plant_012'
  | 'conference-table-whiteboard-kanban-coffee-machine-plant_013'
  | 'conference-table-whiteboard-kanban-coffee-machine-plant_014'
  | 'conference-table-whiteboard-kanban-coffee-machine-plant_015'
  | 'conference-table-whiteboard-kanban-coffee-machine-plant_016'
  | 'conference-table-whiteboard-kanban-coffee-machine-plant_017'
  | 'conference-table-whiteboard-kanban-coffee-machine-plant_018'
  | 'conference-table-whiteboard-kanban-coffee-machine-plant_019'
  | 'conference-table-whiteboard-kanban-coffee-machine-plant_020'
  | 'conference-table-whiteboard-kanban-coffee-machine-plant_021'
  | 'desks-and-monitor-screens_000'
  | 'desks-and-monitor-screens_001'
  | 'desks-and-monitor-screens_002'
  | 'desks-and-monitor-screens_003'
  | 'desks-and-monitor-screens_004'
  | 'desks-and-monitor-screens_005'
  | 'desks-and-monitor-screens_006'
  | 'desks-and-monitor-screens_007'
  | 'desks-and-monitor-screens_008'
  | 'desks-and-monitor-screens_009'
  | 'desks-and-monitor-screens_010'
  | 'desks-and-monitor-screens_011'
  | 'desks-and-monitor-screens_012'
  | 'desks-and-monitor-screens_013'
  | 'desks-and-monitor-screens_014'
  | 'desks-and-monitor-screens_015'
  | 'desks-and-monitor-screens_016'
  | 'desks-and-monitor-screens_017'
  | 'desks-and-monitor-screens_018'
  | 'desks-and-monitor-screens_019'
  | 'desks-and-monitor-screens_020'
  | 'desks-and-monitor-screens_021'
  | 'desks-and-monitor-screens_022'
  | 'desks-and-monitor-screens_023'
  | 'desks-and-monitor-screens_024'
  | 'desks-and-monitor-screens_025'
  | 'desks-and-monitor-screens_026'
  | 'desks-and-monitor-screens_027'
  | 'desks-and-monitor-screens_028'
  | 'desks-and-monitor-screens_029'
  | 'desks-and-monitor-screens_030'
  | 'desks-and-monitor-screens_031'
  | 'desks-and-monitor-screens_032'
  | 'effects-and-particles_000'
  | 'effects-and-particles_001'
  | 'effects-and-particles_002'
  | 'effects-and-particles_003'
  | 'effects-and-particles_004'
  | 'effects-and-particles_005'
  | 'effects-and-particles_006'
  | 'effects-and-particles_007'
  | 'effects-and-particles_008'
  | 'effects-and-particles_009'
  | 'effects-and-particles_010'
  | 'effects-and-particles_011'
  | 'effects-and-particles_012'
  | 'effects-and-particles_013'
  | 'effects-and-particles_014'
  | 'effects-and-particles_015'
  | 'effects-and-particles_016'
  | 'effects-and-particles_017'
  | 'effects-and-particles_018'
  | 'effects-and-particles_019'
  | 'effects-and-particles_020'
  | 'effects-and-particles_021'
  | 'effects-and-particles_022'
  | 'effects-and-particles_023'
  | 'effects-and-particles_024'
  | 'effects-and-particles_025'
  | 'effects-and-particles_026'
  | 'effects-and-particles_027'
  | 'effects-and-particles_028'
  | 'effects-and-particles_029'
  | 'effects-and-particles_030'
  | 'effects-and-particles_031'
  | 'effects-and-particles_032'
  | 'jordan-lee-only_base'
  | 'jordan-lee-only_emotion-neutral'
  | 'jordan-lee-only_emotion-happy'
  | 'jordan-lee-only_emotion-talking'
  | 'jordan-lee-only_emotion-thinking'
  | 'jordan-lee-only_emotion-stressed'
  | 'jordan-lee-only_emotion-excited'
  | 'jordan-lee-only_emotion-concerned'
  | 'jordan-lee-only_emotion-frustrated'
  | 'jordan-lee-only_emotion-satisfied'
  | 'jordan-lee-only_emotion-curious'
  | 'jordan-lee-only_emotion-celebrating'
  | 'jordan-lee-only_emotion-sleeping'
  | 'jordan-lee-only_emotion-panicking'
  | 'jordan-lee-only_emotion-rushing'
  | 'jordan-lee-only_idle-1'
  | 'jordan-lee-only_idle-2'
  | 'jordan-lee-only_idle-3'
  | 'jordan-lee-only_idle-4'
  | 'jordan-lee-only_typing-1'
  | 'jordan-lee-only_typing-2'
  | 'jordan-lee-only_walk-1'
  | 'jordan-lee-only_walk-2'
  | 'jordan-lee-only_walk-3'
  | 'jordan-lee-only_walk-4'
  | 'jordan-lee-only_panic-run-1'
  | 'jordan-lee-only_panic-run-2'
  | 'jordan-lee-only_panic-run-3'
  | 'jordan-lee-only_panic-run-4'
  | 'jordan-lee-only_sitting'
  | 'jordan-lee-only_standup-1'
  | 'jordan-lee-only_standup-2'
  | 'jordan-lee-only_standup-3'
  | 'jordan-lee-only_celebrate-1'
  | 'jordan-lee-only_celebrate-2'
  | 'jordan-lee-only_celebrate-3'
  | 'jordan-lee-only_celebrate-4'
  | 'jordan-lee-only_talk-1'
  | 'jordan-lee-only_talk-2'
  | 'jordan-lee-only_wave'
  | 'jordan-lee-only_walk-home'
  | 'jordan-lee-only_elevator'
  | 'jordan-lee-only_levelup-1'
  | 'jordan-lee-only_levelup-2'
  | 'jordan-lee-only_levelup-3'
  | 'jordan-lee-only_levelup-4'
  | 'jordan-lee-only_levelup-5'
  | 'jordan-lee-only_coffee-walk-1'
  | 'jordan-lee-only_coffee-walk-2'
  | 'jordan-lee-only_late-mild'
  | 'jordan-lee-only_late-panic'
  | 'jordan-lee-only_desk-1'
  | 'jordan-lee-only_desk-2'
  | 'jordan-lee-only_desk-3'
  | 'jordan-lee-only_desk-4'
  | 'jordan-lee-only_desk-5'
  | 'jordan-lee-only_desk-6'
  | 'kai-yuna-ravi-elena-batch_000'
  | 'kai-yuna-ravi-elena-batch_001'
  | 'kai-yuna-ravi-elena-batch_002'
  | 'kai-yuna-ravi-elena-batch_003'
  | 'kai-yuna-ravi-elena-batch_004'
  | 'kai-yuna-ravi-elena-batch_005'
  | 'kai-yuna-ravi-elena-batch_006'
  | 'kai-yuna-ravi-elena-batch_007'
  | 'kai-yuna-ravi-elena-batch_008'
  | 'kai-yuna-ravi-elena-batch_009'
  | 'kai-yuna-ravi-elena-batch_010'
  | 'kai-yuna-ravi-elena-batch_011'
  | 'kai-yuna-ravi-elena-batch_012'
  | 'kai-yuna-ravi-elena-batch_013'
  | 'kai-yuna-ravi-elena-batch_014'
  | 'kai-yuna-ravi-elena-batch_015'
  | 'kai-yuna-ravi-elena-batch_016'
  | 'kai-yuna-ravi-elena-batch_017'
  | 'kai-yuna-ravi-elena-batch_018'
  | 'kai-yuna-ravi-elena-batch_019'
  | 'kai-yuna-ravi-elena-batch_020'
  | 'kai-yuna-ravi-elena-batch_021'
  | 'kai-yuna-ravi-elena-batch_022'
  | 'kai-yuna-ravi-elena-batch_023'
  | 'kai-yuna-ravi-elena-batch_024'
  | 'kai-yuna-ravi-elena-batch_025'
  | 'kai-yuna-ravi-elena-batch_026'
  | 'kai-yuna-ravi-elena-batch_027'
  | 'kai-yuna-ravi-elena-batch_028'
  | 'kai-yuna-ravi-elena-batch_029'
  | 'kai-yuna-ravi-elena-batch_030'
  | 'kai-yuna-ravi-elena-batch_031'
  | 'kai-yuna-ravi-elena-batch_032'
  | 'kai-yuna-ravi-elena-batch_033'
  | 'kai-yuna-ravi-elena-batch_034'
  | 'kai-yuna-ravi-elena-batch_035'
  | 'kai-yuna-ravi-elena-batch_036'
  | 'kai-yuna-ravi-elena-batch_037'
  | 'kai-yuna-ravi-elena-batch_038'
  | 'kai-yuna-ravi-elena-batch_039'
  | 'kai-yuna-ravi-elena-batch_040'
  | 'kai-yuna-ravi-elena-batch_041'
  | 'kai-yuna-ravi-elena-batch_042'
  | 'kai-yuna-ravi-elena-batch_043'
  | 'kai-yuna-ravi-elena-batch_044'
  | 'kai-yuna-ravi-elena-batch_045'
  | 'kai-yuna-ravi-elena-batch_046'
  | 'kai-yuna-ravi-elena-batch_047'
  | 'kai-yuna-ravi-elena-batch_048'
  | 'kai-yuna-ravi-elena-batch_049'
  | 'kai-yuna-ravi-elena-batch_050'
  | 'kai-yuna-ravi-elena-batch_051'
  | 'kai-yuna-ravi-elena-batch_052'
  | 'kai-yuna-ravi-elena-batch_053'
  | 'kai-yuna-ravi-elena-batch_054'
  | 'kai-yuna-ravi-elena-batch_055'
  | 'kai-yuna-ravi-elena-batch_056'
  | 'kai-yuna-ravi-elena-batch_057'
  | 'kai-yuna-ravi-elena-batch_058'
  | 'kai-yuna-ravi-elena-batch_059'
  | 'kai-yuna-ravi-elena-batch_060'
  | 'kai-yuna-ravi-elena-batch_061'
  | 'kai-yuna-ravi-elena-batch_062'
  | 'kai-yuna-ravi-elena-batch_063'
  | 'kai-yuna-ravi-elena-batch_064'
  | 'kai-yuna-ravi-elena-batch_065'
  | 'kai-yuna-ravi-elena-batch_066'
  | 'kai-yuna-ravi-elena-batch_067'
  | 'kai-yuna-ravi-elena-batch_068'
  | 'kai-yuna-ravi-elena-batch_069'
  | 'kai-yuna-ravi-elena-batch_070'
  | 'kai-yuna-ravi-elena-batch_071'
  | 'kai-yuna-ravi-elena-batch_072'
  | 'kai-yuna-ravi-elena-batch_073'
  | 'kai-yuna-ravi-elena-batch_074'
  | 'kai-yuna-ravi-elena-batch_075'
  | 'kai-yuna-ravi-elena-batch_076'
  | 'kai-yuna-ravi-elena-batch_077'
  | 'kai-yuna-ravi-elena-batch_078'
  | 'kai-yuna-ravi-elena-batch_079'
  | 'kai-yuna-ravi-elena-batch_080'
  | 'kai-yuna-ravi-elena-batch_081'
  | 'kai-yuna-ravi-elena-batch_082'
  | 'kai-yuna-ravi-elena-batch_083'
  | 'kai-yuna-ravi-elena-batch_084'
  | 'kai-yuna-ravi-elena-batch_085'
  | 'kai-yuna-ravi-elena-batch_086'
  | 'kai-yuna-ravi-elena-batch_087'
  | 'kai-yuna-ravi-elena-batch_088'
  | 'kai-yuna-ravi-elena-batch_089'
  | 'kai-yuna-ravi-elena-batch_090'
  | 'kai-yuna-ravi-elena-batch_091'
  | 'kai-yuna-ravi-elena-batch_092'
  | 'kai-yuna-ravi-elena-batch_093'
  | 'kai-yuna-ravi-elena-batch_094'
  | 'kai-yuna-ravi-elena-batch_095'
  | 'kai-yuna-ravi-elena-batch_096'
  | 'kai-yuna-ravi-elena-batch_097'
  | 'kai-yuna-ravi-elena-batch_098'
  | 'kai-yuna-ravi-elena-batch_099'
  | 'kai-yuna-ravi-elena-batch_100'
  | 'kai-yuna-ravi-elena-batch_101'
  | 'kai-yuna-ravi-elena-batch_102'
  | 'kai-yuna-ravi-elena-batch_103'
  | 'kai-yuna-ravi-elena-batch_104'
  | 'kai-yuna-ravi-elena-batch_105'
  | 'kai-yuna-ravi-elena-batch_106'
  | 'kai-yuna-ravi-elena-batch_107'
  | 'kai-yuna-ravi-elena-batch_108'
  | 'kai-yuna-ravi-elena-batch_109'
  | 'kai-yuna-ravi-elena-batch_110'
  | 'kai-yuna-ravi-elena-batch_111'
  | 'kai-yuna-ravi-elena-batch_112'
  | 'kai-yuna-ravi-elena-batch_113'
  | 'kai-yuna-ravi-elena-batch_114'
  | 'kai-yuna-ravi-elena-batch_115'
  | 'kai-yuna-ravi-elena-batch_116'
  | 'kai-yuna-ravi-elena-batch_117'
  | 'kai-yuna-ravi-elena-batch_118'
  | 'kai-yuna-ravi-elena-batch_119'
  | 'kai-yuna-ravi-elena-batch_120'
  | 'kai-yuna-ravi-elena-batch_121'
  | 'kai-yuna-ravi-elena-batch_122'
  | 'kai-yuna-ravi-elena-batch_123'
  | 'kai-yuna-ravi-elena-batch_124'
  | 'kai-yuna-ravi-elena-batch_125'
  | 'kai-yuna-ravi-elena-batch_126'
  | 'kai-yuna-ravi-elena-batch_127'
  | 'kai-yuna-ravi-elena-batch_128'
  | 'kai-yuna-ravi-elena-batch_129'
  | 'kai-yuna-ravi-elena-batch_130'
  | 'kai-yuna-ravi-elena-batch_131'
  | 'kai-yuna-ravi-elena-batch_132'
  | 'kai-yuna-ravi-elena-batch_133'
  | 'kai-yuna-ravi-elena-batch_134'
  | 'kai-yuna-ravi-elena-batch_135'
  | 'kai-yuna-ravi-elena-batch_136'
  | 'kai-yuna-ravi-elena-batch_137'
  | 'kai-yuna-ravi-elena-batch_138'
  | 'kai-yuna-ravi-elena-batch_139'
  | 'kai-yuna-ravi-elena-batch_140'
  | 'kai-yuna-ravi-elena-batch_141'
  | 'kai-yuna-ravi-elena-batch_142'
  | 'kai-yuna-ravi-elena-batch_143'
  | 'kai-yuna-ravi-elena-batch_144'
  | 'kai-yuna-ravi-elena-batch_145'
  | 'kai-yuna-ravi-elena-batch_146'
  | 'kai-yuna-ravi-elena-batch_147'
  | 'kai-yuna-ravi-elena-batch_148'
  | 'kai-yuna-ravi-elena-batch_149'
  | 'kai-yuna-ravi-elena-batch_150'
  | 'kai-yuna-ravi-elena-batch_151'
  | 'kai-yuna-ravi-elena-batch_152'
  | 'kai-yuna-ravi-elena-batch_153'
  | 'kai-yuna-ravi-elena-batch_154'
  | 'kai-yuna-ravi-elena-batch_155'
  | 'kai-yuna-ravi-elena-batch_156'
  | 'kai-yuna-ravi-elena-batch_157'
  | 'kai-yuna-ravi-elena-batch_158'
  | 'kai-yuna-ravi-elena-batch_159'
  | 'kai-yuna-ravi-elena-batch_160'
  | 'kai-yuna-ravi-elena-batch_161'
  | 'kai-yuna-ravi-elena-batch_162'
  | 'kai-yuna-ravi-elena-batch_163'
  | 'kai-yuna-ravi-elena-batch_164'
  | 'kai-yuna-ravi-elena-batch_165'
  | 'kai-yuna-ravi-elena-batch_166'
  | 'kai-yuna-ravi-elena-batch_167'
  | 'kai-yuna-ravi-elena-batch_168'
  | 'kai-yuna-ravi-elena-batch_169'
  | 'kai-yuna-ravi-elena-batch_170'
  | 'kai-yuna-ravi-elena-batch_171'
  | 'kai-yuna-ravi-elena-batch_172'
  | 'kai-yuna-ravi-elena-batch_173'
  | 'kai-yuna-ravi-elena-batch_174'
  | 'kai-yuna-ravi-elena-batch_175'
  | 'kai-yuna-ravi-elena-batch_176'
  | 'kai-yuna-ravi-elena-batch_177'
  | 'kai-yuna-ravi-elena-batch_178'
  | 'kai-yuna-ravi-elena-batch_179'
  | 'kai-yuna-ravi-elena-batch_180'
  | 'kai-yuna-ravi-elena-batch_181'
  | 'kai-yuna-ravi-elena-batch_182'
  | 'kai-yuna-ravi-elena-batch_183'
  | 'kai-yuna-ravi-elena-batch_184'
  | 'kai-yuna-ravi-elena-batch_185'
  | 'kai-yuna-ravi-elena-batch_186'
  | 'kai-yuna-ravi-elena-batch_187'
  | 'kai-yuna-ravi-elena-batch_188'
  | 'kai-yuna-ravi-elena-batch_189'
  | 'kai-yuna-ravi-elena-batch_190'
  | 'marcus-webb-only_base'
  | 'marcus-webb-only_emotion-neutral'
  | 'marcus-webb-only_emotion-happy'
  | 'marcus-webb-only_emotion-talking'
  | 'marcus-webb-only_emotion-thinking'
  | 'marcus-webb-only_emotion-stressed'
  | 'marcus-webb-only_emotion-excited'
  | 'marcus-webb-only_emotion-concerned'
  | 'marcus-webb-only_emotion-frustrated'
  | 'marcus-webb-only_emotion-satisfied'
  | 'marcus-webb-only_emotion-curious'
  | 'marcus-webb-only_emotion-celebrating'
  | 'marcus-webb-only_emotion-sleeping'
  | 'marcus-webb-only_emotion-panicking'
  | 'marcus-webb-only_emotion-rushing'
  | 'marcus-webb-only_idle-1'
  | 'marcus-webb-only_idle-2'
  | 'marcus-webb-only_idle-3'
  | 'marcus-webb-only_idle-4'
  | 'marcus-webb-only_typing-1'
  | 'marcus-webb-only_typing-2'
  | 'marcus-webb-only_walk-1'
  | 'marcus-webb-only_walk-2'
  | 'marcus-webb-only_walk-3'
  | 'marcus-webb-only_walk-4'
  | 'marcus-webb-only_panic-run-1'
  | 'marcus-webb-only_panic-run-2'
  | 'marcus-webb-only_panic-run-3'
  | 'marcus-webb-only_panic-run-4'
  | 'marcus-webb-only_sitting'
  | 'marcus-webb-only_standup-1'
  | 'marcus-webb-only_standup-2'
  | 'marcus-webb-only_standup-3'
  | 'marcus-webb-only_celebrate-1'
  | 'marcus-webb-only_celebrate-2'
  | 'marcus-webb-only_celebrate-3'
  | 'marcus-webb-only_celebrate-4'
  | 'marcus-webb-only_talk-1'
  | 'marcus-webb-only_talk-2'
  | 'marcus-webb-only_wave'
  | 'marcus-webb-only_walk-home'
  | 'marcus-webb-only_elevator'
  | 'marcus-webb-only_levelup-1'
  | 'marcus-webb-only_levelup-2'
  | 'marcus-webb-only_levelup-3'
  | 'marcus-webb-only_levelup-4'
  | 'marcus-webb-only_levelup-5'
  | 'marcus-webb-only_coffee-walk-1'
  | 'marcus-webb-only_coffee-walk-2'
  | 'marcus-webb-only_late-mild'
  | 'marcus-webb-only_late-panic'
  | 'mia-tyler-sam-omar-batch_000'
  | 'mia-tyler-sam-omar-batch_001'
  | 'mia-tyler-sam-omar-batch_002'
  | 'mia-tyler-sam-omar-batch_003'
  | 'mia-tyler-sam-omar-batch_004'
  | 'mia-tyler-sam-omar-batch_005'
  | 'mia-tyler-sam-omar-batch_006'
  | 'mia-tyler-sam-omar-batch_007'
  | 'mia-tyler-sam-omar-batch_008'
  | 'mia-tyler-sam-omar-batch_009'
  | 'mia-tyler-sam-omar-batch_010'
  | 'mia-tyler-sam-omar-batch_011'
  | 'mia-tyler-sam-omar-batch_012'
  | 'mia-tyler-sam-omar-batch_013'
  | 'mia-tyler-sam-omar-batch_014'
  | 'mia-tyler-sam-omar-batch_015'
  | 'mia-tyler-sam-omar-batch_016'
  | 'mia-tyler-sam-omar-batch_017'
  | 'mia-tyler-sam-omar-batch_018'
  | 'mia-tyler-sam-omar-batch_019'
  | 'mia-tyler-sam-omar-batch_020'
  | 'mia-tyler-sam-omar-batch_021'
  | 'mia-tyler-sam-omar-batch_022'
  | 'mia-tyler-sam-omar-batch_023'
  | 'mia-tyler-sam-omar-batch_024'
  | 'mia-tyler-sam-omar-batch_025'
  | 'mia-tyler-sam-omar-batch_026'
  | 'mia-tyler-sam-omar-batch_027'
  | 'mia-tyler-sam-omar-batch_028'
  | 'mia-tyler-sam-omar-batch_029'
  | 'mia-tyler-sam-omar-batch_030'
  | 'mia-tyler-sam-omar-batch_031'
  | 'mia-tyler-sam-omar-batch_032'
  | 'mia-tyler-sam-omar-batch_033'
  | 'mia-tyler-sam-omar-batch_034'
  | 'mia-tyler-sam-omar-batch_035'
  | 'mia-tyler-sam-omar-batch_036'
  | 'mia-tyler-sam-omar-batch_037'
  | 'mia-tyler-sam-omar-batch_038'
  | 'mia-tyler-sam-omar-batch_039'
  | 'mia-tyler-sam-omar-batch_040'
  | 'mia-tyler-sam-omar-batch_041'
  | 'mia-tyler-sam-omar-batch_042'
  | 'mia-tyler-sam-omar-batch_043'
  | 'mia-tyler-sam-omar-batch_044'
  | 'mia-tyler-sam-omar-batch_045'
  | 'mia-tyler-sam-omar-batch_046'
  | 'mia-tyler-sam-omar-batch_047'
  | 'mia-tyler-sam-omar-batch_048'
  | 'mia-tyler-sam-omar-batch_049'
  | 'mia-tyler-sam-omar-batch_050'
  | 'mia-tyler-sam-omar-batch_051'
  | 'mia-tyler-sam-omar-batch_052'
  | 'mia-tyler-sam-omar-batch_053'
  | 'mia-tyler-sam-omar-batch_054'
  | 'mia-tyler-sam-omar-batch_055'
  | 'mia-tyler-sam-omar-batch_056'
  | 'mia-tyler-sam-omar-batch_057'
  | 'mia-tyler-sam-omar-batch_058'
  | 'mia-tyler-sam-omar-batch_059'
  | 'mia-tyler-sam-omar-batch_060'
  | 'mia-tyler-sam-omar-batch_061'
  | 'mia-tyler-sam-omar-batch_062'
  | 'mia-tyler-sam-omar-batch_063'
  | 'mia-tyler-sam-omar-batch_064'
  | 'mia-tyler-sam-omar-batch_065'
  | 'mia-tyler-sam-omar-batch_066'
  | 'mia-tyler-sam-omar-batch_067'
  | 'mia-tyler-sam-omar-batch_068'
  | 'mia-tyler-sam-omar-batch_069'
  | 'mia-tyler-sam-omar-batch_070'
  | 'mia-tyler-sam-omar-batch_071'
  | 'mia-tyler-sam-omar-batch_072'
  | 'mia-tyler-sam-omar-batch_073'
  | 'mia-tyler-sam-omar-batch_074'
  | 'mia-tyler-sam-omar-batch_075'
  | 'mia-tyler-sam-omar-batch_076'
  | 'mia-tyler-sam-omar-batch_077'
  | 'mia-tyler-sam-omar-batch_078'
  | 'mia-tyler-sam-omar-batch_079'
  | 'mia-tyler-sam-omar-batch_080'
  | 'mia-tyler-sam-omar-batch_081'
  | 'mia-tyler-sam-omar-batch_082'
  | 'mia-tyler-sam-omar-batch_083'
  | 'mia-tyler-sam-omar-batch_084'
  | 'mia-tyler-sam-omar-batch_085'
  | 'mia-tyler-sam-omar-batch_086'
  | 'mia-tyler-sam-omar-batch_087'
  | 'mia-tyler-sam-omar-batch_088'
  | 'mia-tyler-sam-omar-batch_089'
  | 'mia-tyler-sam-omar-batch_090'
  | 'mia-tyler-sam-omar-batch_091'
  | 'mia-tyler-sam-omar-batch_092'
  | 'mia-tyler-sam-omar-batch_093'
  | 'mia-tyler-sam-omar-batch_094'
  | 'mia-tyler-sam-omar-batch_095'
  | 'mia-tyler-sam-omar-batch_096'
  | 'mia-tyler-sam-omar-batch_097'
  | 'mia-tyler-sam-omar-batch_098'
  | 'mia-tyler-sam-omar-batch_099'
  | 'mia-tyler-sam-omar-batch_100'
  | 'mia-tyler-sam-omar-batch_101'
  | 'mia-tyler-sam-omar-batch_102'
  | 'mia-tyler-sam-omar-batch_103'
  | 'mia-tyler-sam-omar-batch_104'
  | 'mia-tyler-sam-omar-batch_105'
  | 'mia-tyler-sam-omar-batch_106'
  | 'mia-tyler-sam-omar-batch_107'
  | 'mia-tyler-sam-omar-batch_108'
  | 'mia-tyler-sam-omar-batch_109'
  | 'mia-tyler-sam-omar-batch_110'
  | 'mia-tyler-sam-omar-batch_111'
  | 'mia-tyler-sam-omar-batch_112'
  | 'mia-tyler-sam-omar-batch_113'
  | 'mia-tyler-sam-omar-batch_114'
  | 'mia-tyler-sam-omar-batch_115'
  | 'mia-tyler-sam-omar-batch_116'
  | 'mia-tyler-sam-omar-batch_117'
  | 'mia-tyler-sam-omar-batch_118'
  | 'mia-tyler-sam-omar-batch_119'
  | 'mia-tyler-sam-omar-batch_120'
  | 'mia-tyler-sam-omar-batch_121'
  | 'mia-tyler-sam-omar-batch_122'
  | 'mia-tyler-sam-omar-batch_123'
  | 'mia-tyler-sam-omar-batch_124'
  | 'mia-tyler-sam-omar-batch_125'
  | 'mia-tyler-sam-omar-batch_126'
  | 'mia-tyler-sam-omar-batch_127'
  | 'mia-tyler-sam-omar-batch_128'
  | 'mia-tyler-sam-omar-batch_129'
  | 'mia-tyler-sam-omar-batch_130'
  | 'mia-tyler-sam-omar-batch_131'
  | 'mia-tyler-sam-omar-batch_132'
  | 'mia-tyler-sam-omar-batch_133'
  | 'mia-tyler-sam-omar-batch_134'
  | 'mia-tyler-sam-omar-batch_135'
  | 'mia-tyler-sam-omar-batch_136'
  | 'mia-tyler-sam-omar-batch_137'
  | 'mia-tyler-sam-omar-batch_138'
  | 'mia-tyler-sam-omar-batch_139'
  | 'mia-tyler-sam-omar-batch_140'
  | 'mia-tyler-sam-omar-batch_141'
  | 'mia-tyler-sam-omar-batch_142'
  | 'mia-tyler-sam-omar-batch_143'
  | 'mia-tyler-sam-omar-batch_144'
  | 'mia-tyler-sam-omar-batch_145'
  | 'mia-tyler-sam-omar-batch_146'
  | 'mia-tyler-sam-omar-batch_147'
  | 'mia-tyler-sam-omar-batch_148'
  | 'mia-tyler-sam-omar-batch_149'
  | 'mia-tyler-sam-omar-batch_150'
  | 'mia-tyler-sam-omar-batch_151'
  | 'mia-tyler-sam-omar-batch_152'
  | 'mia-tyler-sam-omar-batch_153'
  | 'mia-tyler-sam-omar-batch_154'
  | 'mia-tyler-sam-omar-batch_155'
  | 'mia-tyler-sam-omar-batch_156'
  | 'mia-tyler-sam-omar-batch_157'
  | 'mia-tyler-sam-omar-batch_158'
  | 'mia-tyler-sam-omar-batch_159'
  | 'mia-tyler-sam-omar-batch_160'
  | 'mia-tyler-sam-omar-batch_161'
  | 'mia-tyler-sam-omar-batch_162'
  | 'mia-tyler-sam-omar-batch_163'
  | 'mia-tyler-sam-omar-batch_164'
  | 'mia-tyler-sam-omar-batch_165'
  | 'mia-tyler-sam-omar-batch_166'
  | 'mia-tyler-sam-omar-batch_167'
  | 'mia-tyler-sam-omar-batch_168'
  | 'mia-tyler-sam-omar-batch_169'
  | 'mia-tyler-sam-omar-batch_170'
  | 'mia-tyler-sam-omar-batch_171'
  | 'mia-tyler-sam-omar-batch_172'
  | 'mia-tyler-sam-omar-batch_173'
  | 'mia-tyler-sam-omar-batch_174'
  | 'mia-tyler-sam-omar-batch_175'
  | 'mia-tyler-sam-omar-batch_176'
  | 'mia-tyler-sam-omar-batch_177'
  | 'mia-tyler-sam-omar-batch_178'
  | 'mia-tyler-sam-omar-batch_179'
  | 'mia-tyler-sam-omar-batch_180'
  | 'mia-tyler-sam-omar-batch_181'
  | 'mia-tyler-sam-omar-batch_182'
  | 'mia-tyler-sam-omar-batch_183'
  | 'mia-tyler-sam-omar-batch_184'
  | 'mia-tyler-sam-omar-batch_185'
  | 'mia-tyler-sam-omar-batch_186'
  | 'mia-tyler-sam-omar-batch_187'
  | 'mia-tyler-sam-omar-batch_188'
  | 'mia-tyler-sam-omar-batch_189'
  | 'mia-tyler-sam-omar-batch_190'
  | 'mia-tyler-sam-omar-batch_191'
  | 'mia-tyler-sam-omar-batch_192'
  | 'mia-tyler-sam-omar-batch_193'
  | 'mia-tyler-sam-omar-batch_194'
  | 'mia-tyler-sam-omar-batch_195'
  | 'mia-tyler-sam-omar-batch_196'
  | 'mia-tyler-sam-omar-batch_197'
  | 'mia-tyler-sam-omar-batch_198'
  | 'mia-tyler-sam-omar-batch_199'
  | 'mia-tyler-sam-omar-batch_200'
  | 'mia-tyler-sam-omar-batch_201'
  | 'mia-tyler-sam-omar-batch_202'
  | 'mia-tyler-sam-omar-batch_203'
  | 'mia-tyler-sam-omar-batch_204'
  | 'mia-tyler-sam-omar-batch_205'
  | 'mia-tyler-sam-omar-batch_206'
  | 'mia-tyler-sam-omar-batch_207'
  | 'mia-tyler-sam-omar-batch_208'
  | 'mia-tyler-sam-omar-batch_209'
  | 'mia-tyler-sam-omar-batch_210'
  | 'mia-tyler-sam-omar-batch_211'
  | 'mia-tyler-sam-omar-batch_212'
  | 'mia-tyler-sam-omar-batch_213'
  | 'mia-tyler-sam-omar-batch_214'
  | 'mia-tyler-sam-omar-batch_215'
  | 'mia-tyler-sam-omar-batch_216'
  | 'mia-tyler-sam-omar-batch_217'
  | 'priya-sharma-only_000'
  | 'priya-sharma-only_001'
  | 'priya-sharma-only_002'
  | 'priya-sharma-only_003'
  | 'priya-sharma-only_004'
  | 'priya-sharma-only_005'
  | 'priya-sharma-only_006'
  | 'priya-sharma-only_007'
  | 'priya-sharma-only_008'
  | 'priya-sharma-only_009'
  | 'priya-sharma-only_010'
  | 'priya-sharma-only_011'
  | 'priya-sharma-only_012'
  | 'priya-sharma-only_013'
  | 'priya-sharma-only_014'
  | 'priya-sharma-only_015'
  | 'priya-sharma-only_016'
  | 'priya-sharma-only_017'
  | 'priya-sharma-only_018'
  | 'priya-sharma-only_019'
  | 'priya-sharma-only_020'
  | 'priya-sharma-only_021'
  | 'priya-sharma-only_022'
  | 'priya-sharma-only_023'
  | 'priya-sharma-only_024'
  | 'priya-sharma-only_025'
  | 'priya-sharma-only_026'
  | 'priya-sharma-only_027'
  | 'priya-sharma-only_028'
  | 'priya-sharma-only_029'
  | 'priya-sharma-only_030'
  | 'priya-sharma-only_031'
  | 'priya-sharma-only_032'
  | 'priya-sharma-only_033'
  | 'priya-sharma-only_034'
  | 'priya-sharma-only_035'
  | 'priya-sharma-only_036'
  | 'priya-sharma-only_037'
  | 'priya-sharma-only_038'
  | 'priya-sharma-only_039'
  | 'priya-sharma-only_040'
  | 'priya-sharma-only_041'
  | 'priya-sharma-only_042'
  | 'priya-sharma-only_043'
  | 'priya-sharma-only_044'
  | 'priya-sharma-only_045'
  | 'priya-sharma-only_046'
  | 'priya-sharma-only_047'
  | 'priya-sharma-only_048'
  | 'priya-sharma-only_049'
  | 'priya-sharma-only_050'
  | 'priya-sharma-only_051'
  | 'priya-sharma-only_052'
  | 'priya-sharma-only_053'
  | 'priya-sharma-only_054'
  | 'priya-sharma-only_055'
  | 'priya-sharma-only_056'
  | 'priya-sharma-only_057'
  | 'priya-sharma-only_058'
  | 'priya-sharma-only_059'
  | 'priya-sharma-only_060'
  | 'priya-sharma-only_061'
  | 'priya-sharma-only_062'
  | 'priya-sharma-only_063'
  | 'priya-sharma-only_064'
  | 'priya-sharma-only_065'
  | 'priya-sharma-only_066'
  | 'priya-sharma-only_067'
  | 'priya-sharma-only_068'
  | 'priya-sharma-only_069'
  | 'priya-sharma-only_070'
  | 'priya-sharma-only_071'
  | 'priya-sharma-only_072'
  | 'priya-sharma-only_073'
  | 'priya-sharma-only_074'
  | 'priya-sharma-only_075'
  | 'priya-sharma-only_076'
  | 'priya-sharma-only_077'
  | 'priya-sharma-only_078'
  | 'priya-sharma-only_079'
  | 'priya-sharma-only_080'
  | 'reception-bot-and-kin-founderyou_000'
  | 'reception-bot-and-kin-founderyou_001'
  | 'reception-bot-and-kin-founderyou_002'
  | 'reception-bot-and-kin-founderyou_003'
  | 'reception-bot-and-kin-founderyou_004'
  | 'reception-bot-and-kin-founderyou_005'
  | 'reception-bot-and-kin-founderyou_006'
  | 'reception-bot-and-kin-founderyou_007'
  | 'reception-bot-and-kin-founderyou_008'
  | 'reception-bot-and-kin-founderyou_009'
  | 'reception-bot-and-kin-founderyou_010'
  | 'reception-bot-and-kin-founderyou_011'
  | 'reception-bot-and-kin-founderyou_012'
  | 'reception-bot-and-kin-founderyou_013'
  | 'reception-bot-and-kin-founderyou_014'
  | 'reception-bot-and-kin-founderyou_015'
  | 'reception-bot-and-kin-founderyou_016'
  | 'reception-bot-and-kin-founderyou_017'
  | 'reception-bot-and-kin-founderyou_018'
  | 'reception-bot-and-kin-founderyou_019'
  | 'rex-and-dana-security-guards_000'
  | 'rex-and-dana-security-guards_001'
  | 'rex-and-dana-security-guards_002'
  | 'rex-and-dana-security-guards_003'
  | 'rex-and-dana-security-guards_004'
  | 'rex-and-dana-security-guards_005'
  | 'rex-and-dana-security-guards_006'
  | 'rex-and-dana-security-guards_007'
  | 'rex-and-dana-security-guards_008'
  | 'rex-and-dana-security-guards_009'
  | 'rex-and-dana-security-guards_010'
  | 'rex-and-dana-security-guards_011'
  | 'rex-and-dana-security-guards_012'
  | 'rex-and-dana-security-guards_013'
  | 'rex-and-dana-security-guards_014'
  | 'rex-and-dana-security-guards_015'
  | 'rex-and-dana-security-guards_016'
  | 'rex-and-dana-security-guards_017'
  | 'rex-and-dana-security-guards_018'
  | 'rex-and-dana-security-guards_019'
  | 'rex-and-dana-security-guards_020'
  | 'rex-and-dana-security-guards_021'
  | 'rex-and-dana-security-guards_022'
  | 'rex-and-dana-security-guards_023'
  | 'rex-and-dana-security-guards_024'
  | 'rex-and-dana-security-guards_025'
  | 'rex-and-dana-security-guards_026'
  | 'rex-and-dana-security-guards_027'
  | 'rex-and-dana-security-guards_028'
  | 'rex-and-dana-security-guards_029'
  | 'rex-and-dana-security-guards_030'
  | 'rex-and-dana-security-guards_031'
  | 'rex-and-dana-security-guards_032'
  | 'rex-and-dana-security-guards_033'
  | 'rex-and-dana-security-guards_034'
  | 'rex-and-dana-security-guards_035'
  | 'rex-and-dana-security-guards_036'
  | 'rex-and-dana-security-guards_037'
  | 'rex-and-dana-security-guards_038'
  | 'rex-and-dana-security-guards_039'
  | 'rex-and-dana-security-guards_040'
  | 'rex-and-dana-security-guards_041'
  | 'rex-and-dana-security-guards_042'
  | 'rex-and-dana-security-guards_043'
  | 'rex-and-dana-security-guards_044'
  | 'rex-and-dana-security-guards_045'
  | 'rex-and-dana-security-guards_046'
  | 'rex-and-dana-security-guards_047'
  | 'rex-and-dana-security-guards_048'
  | 'rex-and-dana-security-guards_049'
  | 'rex-and-dana-security-guards_050'
  | 'rex-and-dana-security-guards_051'
  | 'rex-and-dana-security-guards_052'
  | 'rex-and-dana-security-guards_053'
  | 'rex-and-dana-security-guards_054'
  | 'rex-and-dana-security-guards_055'
  | 'rex-and-dana-security-guards_056'
  | 'rex-and-dana-security-guards_057'
  | 'rex-and-dana-security-guards_058'
  | 'rex-and-dana-security-guards_059'
  | 'rex-and-dana-security-guards_060'
  | 'rex-and-dana-security-guards_061'
  | 'rex-and-dana-security-guards_062'
  | 'rex-and-dana-security-guards_063'
  | 'rex-and-dana-security-guards_064'
  | 'rex-and-dana-security-guards_065'
  | 'rex-and-dana-security-guards_066'
  | 'rex-and-dana-security-guards_067'
  | 'rex-and-dana-security-guards_068'
  | 'rex-and-dana-security-guards_069'
  | 'rex-and-dana-security-guards_070'
  | 'rex-and-dana-security-guards_071'
  | 'rex-and-dana-security-guards_072'
  | 'rex-and-dana-security-guards_073'
  | 'rex-and-dana-security-guards_074'
  | 'rex-and-dana-security-guards_075'
  | 'rex-and-dana-security-guards_076'
  | 'rex-and-dana-security-guards_077'
  | 'rex-and-dana-security-guards_078'
  | 'rex-and-dana-security-guards_079'
  | 'rex-and-dana-security-guards_080'
  | 'rex-and-dana-security-guards_081'
  | 'rex-and-dana-security-guards_082'
  | 'rex-and-dana-security-guards_083'
  | 'rex-and-dana-security-guards_084'
  | 'rex-and-dana-security-guards_085'
  | 'rex-and-dana-security-guards_086'
  | 'rex-and-dana-security-guards_087'
  | 'rex-and-dana-security-guards_088'
  | 'rex-and-dana-security-guards_089'
  | 'rex-and-dana-security-guards_090'
  | 'rex-and-dana-security-guards_091'
  | 'rex-and-dana-security-guards_092'
  | 'rex-and-dana-security-guards_093'
  | 'rex-and-dana-security-guards_094'
  | 'rex-and-dana-security-guards_095'
  | 'rex-and-dana-security-guards_096'
  | 'rex-and-dana-security-guards_097'
  | 'rex-and-dana-security-guards_098'
  | 'rex-and-dana-security-guards_099'
  | 'rex-and-dana-security-guards_100'
  | 'rex-and-dana-security-guards_101'
  | 'rex-and-dana-security-guards_102'
  | 'rex-and-dana-security-guards_103'
  | 'rex-and-dana-security-guards_104'
  | 'rex-and-dana-security-guards_105'
  | 'rex-and-dana-security-guards_106'
  | 'rex-and-dana-security-guards_107'
  | 'rex-and-dana-security-guards_108'
  | 'rex-and-dana-security-guards_109'
  | 'rex-and-dana-security-guards_110'
  | 'rex-and-dana-security-guards_111'
  | 'rex-and-dana-security-guards_112'
  | 'rex-and-dana-security-guards_113'
  | 'rex-and-dana-security-guards_114'
  | 'rex-and-dana-security-guards_115'
  | 'rex-and-dana-security-guards_116'
  | 'rex-and-dana-security-guards_117'
  | 'rex-and-dana-security-guards_118'
  | 'rex-and-dana-security-guards_119'
  | 'rex-and-dana-security-guards_120'
  | 'rex-and-dana-security-guards_121'
  | 'rex-and-dana-security-guards_122'
  | 'rex-and-dana-security-guards_123'
  | 'rex-and-dana-security-guards_124'
  | 'rex-and-dana-security-guards_125'
  | 'rex-and-dana-security-guards_126'
  | 'rex-and-dana-security-guards_127'
  | 'rex-and-dana-security-guards_128'
  | 'rex-and-dana-security-guards_129'
  | 'rex-and-dana-security-guards_130'
  | 'rex-and-dana-security-guards_131'
  | 'rex-and-dana-security-guards_132'
  | 'rex-and-dana-security-guards_133'
  | 'rex-and-dana-security-guards_134'
  | 'rex-and-dana-security-guards_135'
  | 'rex-and-dana-security-guards_136'
  | 'rex-and-dana-security-guards_137'
  | 'rex-and-dana-security-guards_138'
  | 'rex-and-dana-security-guards_139'
  | 'rex-and-dana-security-guards_140'
  | 'rex-and-dana-security-guards_141'
  | 'rex-and-dana-security-guards_142'
  | 'rex-and-dana-security-guards_143'
  | 'rex-and-dana-security-guards_144'
  | 'rex-and-dana-security-guards_145'
  | 'rex-and-dana-security-guards_146'
  | 'rex-and-dana-security-guards_147'
  | 'rio-tanaka-only_base'
  | 'rio-tanaka-only_emotion-neutral'
  | 'rio-tanaka-only_emotion-happy'
  | 'rio-tanaka-only_emotion-talking'
  | 'rio-tanaka-only_emotion-thinking'
  | 'rio-tanaka-only_emotion-stressed'
  | 'rio-tanaka-only_emotion-excited'
  | 'rio-tanaka-only_emotion-concerned'
  | 'rio-tanaka-only_emotion-frustrated'
  | 'rio-tanaka-only_emotion-satisfied'
  | 'rio-tanaka-only_emotion-curious'
  | 'rio-tanaka-only_emotion-celebrating'
  | 'rio-tanaka-only_emotion-sleeping'
  | 'rio-tanaka-only_emotion-panicking'
  | 'rio-tanaka-only_emotion-rushing'
  | 'rio-tanaka-only_idle-1'
  | 'rio-tanaka-only_idle-2'
  | 'rio-tanaka-only_idle-3'
  | 'rio-tanaka-only_idle-4'
  | 'rio-tanaka-only_typing-1'
  | 'rio-tanaka-only_typing-2'
  | 'rio-tanaka-only_walk-1'
  | 'rio-tanaka-only_walk-2'
  | 'rio-tanaka-only_walk-3'
  | 'rio-tanaka-only_walk-4'
  | 'rio-tanaka-only_panic-run-1'
  | 'rio-tanaka-only_panic-run-2'
  | 'rio-tanaka-only_panic-run-3'
  | 'rio-tanaka-only_panic-run-4'
  | 'rio-tanaka-only_sitting'
  | 'rio-tanaka-only_standup-1'
  | 'rio-tanaka-only_standup-2'
  | 'rio-tanaka-only_standup-3'
  | 'rio-tanaka-only_celebrate-1'
  | 'rio-tanaka-only_celebrate-2'
  | 'rio-tanaka-only_celebrate-3'
  | 'rio-tanaka-only_celebrate-4'
  | 'rio-tanaka-only_talk-1'
  | 'rio-tanaka-only_talk-2'
  | 'rio-tanaka-only_wave'
  | 'rio-tanaka-only_walk-home'
  | 'rio-tanaka-only_elevator'
  | 'rio-tanaka-only_levelup-1'
  | 'rio-tanaka-only_levelup-2'
  | 'rio-tanaka-only_levelup-3'
  | 'rio-tanaka-only_levelup-4'
  | 'rio-tanaka-only_levelup-5'
  | 'rio-tanaka-only_coffee-walk-1'
  | 'rio-tanaka-only_coffee-walk-2'
  | 'rio-tanaka-only_late-mild'
  | 'rio-tanaka-only_late-panic'
  | 'rio-tanaka-only_desk-1'
  | 'rio-tanaka-only_desk-2'
  | 'rio-tanaka-only_desk-3'
  | 'rio-tanaka-only_desk-4'
  | 'rio-tanaka-only_desk-5'
  | 'rio-tanaka-only_desk-6'
  | 'rio-tanaka-only_desk-7'
  | 'sarah-chen-only_base'
  | 'sarah-chen-only_emotion-neutral'
  | 'sarah-chen-only_emotion-happy'
  | 'sarah-chen-only_emotion-talking'
  | 'sarah-chen-only_emotion-thinking'
  | 'sarah-chen-only_emotion-stressed'
  | 'sarah-chen-only_emotion-excited'
  | 'sarah-chen-only_emotion-concerned'
  | 'sarah-chen-only_emotion-frustrated'
  | 'sarah-chen-only_emotion-satisfied'
  | 'sarah-chen-only_emotion-curious'
  | 'sarah-chen-only_emotion-celebrating'
  | 'sarah-chen-only_emotion-sleeping'
  | 'sarah-chen-only_emotion-panicking'
  | 'sarah-chen-only_emotion-rushing'
  | 'sarah-chen-only_idle-1'
  | 'sarah-chen-only_idle-2'
  | 'sarah-chen-only_idle-3'
  | 'sarah-chen-only_idle-4'
  | 'sarah-chen-only_typing-1'
  | 'sarah-chen-only_typing-2'
  | 'sarah-chen-only_walk-1'
  | 'sarah-chen-only_walk-2'
  | 'sarah-chen-only_walk-3'
  | 'sarah-chen-only_walk-4'
  | 'sarah-chen-only_panic-run-1'
  | 'sarah-chen-only_panic-run-2'
  | 'sarah-chen-only_panic-run-3'
  | 'sarah-chen-only_panic-run-4'
  | 'sarah-chen-only_sitting'
  | 'sarah-chen-only_standup-1'
  | 'sarah-chen-only_standup-2'
  | 'sarah-chen-only_standup-3'
  | 'sarah-chen-only_celebrate-1'
  | 'sarah-chen-only_celebrate-2'
  | 'sarah-chen-only_celebrate-3'
  | 'sarah-chen-only_celebrate-4'
  | 'sarah-chen-only_talk-1'
  | 'sarah-chen-only_talk-2'
  | 'sarah-chen-only_wave'
  | 'sarah-chen-only_walk-home'
  | 'sarah-chen-only_elevator'
  | 'sarah-chen-only_levelup-1'
  | 'sarah-chen-only_levelup-2'
  | 'sarah-chen-only_levelup-3'
  | 'sarah-chen-only_levelup-4'
  | 'sarah-chen-only_levelup-5'
  | 'sarah-chen-only_coffee-walk-1'
  | 'sarah-chen-only_coffee-walk-2'
  | 'sarah-chen-only_late-mild'
  | 'sarah-chen-only_late-panic'
  | 'sarah-chen-only_desk-1'
  | 'sarah-chen-only_desk-2'
  | 'sarah-chen-only_desk-3'
  | 'speech-bubbles-and-ui-elements_000'
  | 'speech-bubbles-and-ui-elements_001'
  | 'speech-bubbles-and-ui-elements_002'
  | 'speech-bubbles-and-ui-elements_003'
  | 'speech-bubbles-and-ui-elements_004'
  | 'speech-bubbles-and-ui-elements_005'
  | 'speech-bubbles-and-ui-elements_006'
  | 'speech-bubbles-and-ui-elements_007'
  | 'speech-bubbles-and-ui-elements_008'
  | 'speech-bubbles-and-ui-elements_009'
  | 'speech-bubbles-and-ui-elements_010'
  | 'speech-bubbles-and-ui-elements_011'
  | 'speech-bubbles-and-ui-elements_012'
  | 'speech-bubbles-and-ui-elements_013'
  | 'speech-bubbles-and-ui-elements_014'
  | 'speech-bubbles-and-ui-elements_015'
  | 'speech-bubbles-and-ui-elements_016'
  | 'speech-bubbles-and-ui-elements_017'
  | 'speech-bubbles-and-ui-elements_018'
  | 'speech-bubbles-and-ui-elements_019'
  | 'speech-bubbles-and-ui-elements_020'
  | 'speech-bubbles-and-ui-elements_021'
  | 'speech-bubbles-and-ui-elements_022'
  | 'speech-bubbles-and-ui-elements_023'
  | 'speech-bubbles-and-ui-elements_024'
  | 'speech-bubbles-and-ui-elements_025'
  | 'speech-bubbles-and-ui-elements_026'
  | 'speech-bubbles-and-ui-elements_027'
  | 'speech-bubbles-and-ui-elements_028'
  | 'speech-bubbles-and-ui-elements_029'
  | 'speech-bubbles-and-ui-elements_030'
  | 'speech-bubbles-and-ui-elements_031'
  | 'speech-bubbles-and-ui-elements_032'
  | 'speech-bubbles-and-ui-elements_033'
  | 'speech-bubbles-and-ui-elements_034'
  | 'speech-bubbles-and-ui-elements_035'
  | 'speech-bubbles-and-ui-elements_036'
  | 'speech-bubbles-and-ui-elements_037'
  | 'speech-bubbles-and-ui-elements_038'
  | 'speech-bubbles-and-ui-elements_039'
  | 'speech-bubbles-and-ui-elements_040'
  | 'speech-bubbles-and-ui-elements_041'
  | 'windows-and-floor-tiles-and-elevator_000'
  | 'windows-and-floor-tiles-and-elevator_001'
  | 'windows-and-floor-tiles-and-elevator_002'
  | 'windows-and-floor-tiles-and-elevator_003'
  | 'windows-and-floor-tiles-and-elevator_004'
  | 'windows-and-floor-tiles-and-elevator_005'
  | 'windows-and-floor-tiles-and-elevator_006'
  | 'windows-and-floor-tiles-and-elevator_007'
  | 'windows-and-floor-tiles-and-elevator_008'
  | 'windows-and-floor-tiles-and-elevator_009'
  | 'windows-and-floor-tiles-and-elevator_010'
  | 'windows-and-floor-tiles-and-elevator_011'
  | 'windows-and-floor-tiles-and-elevator_012'
  | 'windows-and-floor-tiles-and-elevator_013'
  | 'windows-and-floor-tiles-and-elevator_014'
  | 'windows-and-floor-tiles-and-elevator_015'
  | 'windows-and-floor-tiles-and-elevator_016'
  | 'windows-and-floor-tiles-and-elevator_017'
  | 'windows-and-floor-tiles-and-elevator_018'
  | 'windows-and-floor-tiles-and-elevator_019'
  | 'windows-and-floor-tiles-and-elevator_020'
  | 'windows-and-floor-tiles-and-elevator_021'
  | 'windows-and-floor-tiles-and-elevator_022'
  | 'windows-and-floor-tiles-and-elevator_023'
  | 'zara-leo-nadia-maya-batch_000'
  | 'zara-leo-nadia-maya-batch_001'
  | 'zara-leo-nadia-maya-batch_002'
  | 'zara-leo-nadia-maya-batch_003'
  | 'zara-leo-nadia-maya-batch_004'
  | 'zara-leo-nadia-maya-batch_005'
  | 'zara-leo-nadia-maya-batch_006'
  | 'zara-leo-nadia-maya-batch_007'
  | 'zara-leo-nadia-maya-batch_008'
  | 'zara-leo-nadia-maya-batch_009'
  | 'zara-leo-nadia-maya-batch_010'
  | 'zara-leo-nadia-maya-batch_011'
  | 'zara-leo-nadia-maya-batch_012'
  | 'zara-leo-nadia-maya-batch_013'
  | 'zara-leo-nadia-maya-batch_014'
  | 'zara-leo-nadia-maya-batch_015'
  | 'zara-leo-nadia-maya-batch_016'
  | 'zara-leo-nadia-maya-batch_017'
  | 'zara-leo-nadia-maya-batch_018'
  | 'zara-leo-nadia-maya-batch_019'
  | 'zara-leo-nadia-maya-batch_020'
  | 'zara-leo-nadia-maya-batch_021'
  | 'zara-leo-nadia-maya-batch_022'
  | 'zara-leo-nadia-maya-batch_023'
  | 'zara-leo-nadia-maya-batch_024'
  | 'zara-leo-nadia-maya-batch_025'
  | 'zara-leo-nadia-maya-batch_026'
  | 'zara-leo-nadia-maya-batch_027'
  | 'zara-leo-nadia-maya-batch_028'
  | 'zara-leo-nadia-maya-batch_029'
  | 'zara-leo-nadia-maya-batch_030'
  | 'zara-leo-nadia-maya-batch_031'
  | 'zara-leo-nadia-maya-batch_032'
  | 'zara-leo-nadia-maya-batch_033'
  | 'zara-leo-nadia-maya-batch_034'
  | 'zara-leo-nadia-maya-batch_035'
  | 'zara-leo-nadia-maya-batch_036'
  | 'zara-leo-nadia-maya-batch_037'
  | 'zara-leo-nadia-maya-batch_038'
  | 'zara-leo-nadia-maya-batch_039'
  | 'zara-leo-nadia-maya-batch_040'
  | 'zara-leo-nadia-maya-batch_041'
  | 'zara-leo-nadia-maya-batch_042'
  | 'zara-leo-nadia-maya-batch_043'
  | 'zara-leo-nadia-maya-batch_044'
  | 'zara-leo-nadia-maya-batch_045'
  | 'zara-leo-nadia-maya-batch_046'
  | 'zara-leo-nadia-maya-batch_047'
  | 'zara-leo-nadia-maya-batch_048'
  | 'zara-leo-nadia-maya-batch_049'
  | 'zara-leo-nadia-maya-batch_050'
  | 'zara-leo-nadia-maya-batch_051'
  | 'zara-leo-nadia-maya-batch_052'
  | 'zara-leo-nadia-maya-batch_053'
  | 'zara-leo-nadia-maya-batch_054'
  | 'zara-leo-nadia-maya-batch_055'
  | 'zara-leo-nadia-maya-batch_056'
  | 'zara-leo-nadia-maya-batch_057'
  | 'zara-leo-nadia-maya-batch_058'
  | 'zara-leo-nadia-maya-batch_059'
  | 'zara-leo-nadia-maya-batch_060'
  | 'zara-leo-nadia-maya-batch_061'
  | 'zara-leo-nadia-maya-batch_062'
  | 'zara-leo-nadia-maya-batch_063'
  | 'zara-leo-nadia-maya-batch_064'
  | 'zara-leo-nadia-maya-batch_065'
  | 'zara-leo-nadia-maya-batch_066'
  | 'zara-leo-nadia-maya-batch_067'
  | 'zara-leo-nadia-maya-batch_068'
  | 'zara-leo-nadia-maya-batch_069'
  | 'zara-leo-nadia-maya-batch_070'
  | 'zara-leo-nadia-maya-batch_071'
  | 'zara-leo-nadia-maya-batch_072'
  | 'zara-leo-nadia-maya-batch_073'
  | 'zara-leo-nadia-maya-batch_074'
  | 'zara-leo-nadia-maya-batch_075'
  | 'zara-leo-nadia-maya-batch_076'
  | 'zara-leo-nadia-maya-batch_077'
  | 'zara-leo-nadia-maya-batch_078'
  | 'zara-leo-nadia-maya-batch_079'
  | 'zara-leo-nadia-maya-batch_080'
  | 'zara-leo-nadia-maya-batch_081'
  | 'zara-leo-nadia-maya-batch_082'
  | 'zara-leo-nadia-maya-batch_083'
  | 'zara-leo-nadia-maya-batch_084'
  | 'zara-leo-nadia-maya-batch_085'
  | 'zara-leo-nadia-maya-batch_086'
  | 'zara-leo-nadia-maya-batch_087'
  | 'zara-leo-nadia-maya-batch_088'
  | 'zara-leo-nadia-maya-batch_089'
  | 'zara-leo-nadia-maya-batch_090'
  | 'zara-leo-nadia-maya-batch_091'
  | 'zara-leo-nadia-maya-batch_092'
  | 'zara-leo-nadia-maya-batch_093'
  | 'zara-leo-nadia-maya-batch_094'
  | 'zara-leo-nadia-maya-batch_095'
  | 'zara-leo-nadia-maya-batch_096'
  | 'zara-leo-nadia-maya-batch_097'
  | 'zara-leo-nadia-maya-batch_098'
  | 'zara-leo-nadia-maya-batch_099'
  | 'zara-leo-nadia-maya-batch_100'
  | 'zara-leo-nadia-maya-batch_101'
  | 'zara-leo-nadia-maya-batch_102'
  | 'zara-leo-nadia-maya-batch_103'
  | 'zara-leo-nadia-maya-batch_104'
  | 'zara-leo-nadia-maya-batch_105'
  | 'zara-leo-nadia-maya-batch_106'
  | 'zara-leo-nadia-maya-batch_107'
  | 'zara-leo-nadia-maya-batch_108'
  | 'zara-leo-nadia-maya-batch_109'
  | 'zara-leo-nadia-maya-batch_110'
  | 'zara-leo-nadia-maya-batch_111'
  | 'zara-leo-nadia-maya-batch_112'
  | 'zara-leo-nadia-maya-batch_113'
  | 'zara-leo-nadia-maya-batch_114'
  | 'zara-leo-nadia-maya-batch_115'
  | 'zara-leo-nadia-maya-batch_116'
  | 'zara-leo-nadia-maya-batch_117'
  | 'zara-leo-nadia-maya-batch_118'
  | 'zara-leo-nadia-maya-batch_119'
  | 'zara-leo-nadia-maya-batch_120'
  | 'zara-leo-nadia-maya-batch_121'
  | 'zara-leo-nadia-maya-batch_122'
  | 'zara-leo-nadia-maya-batch_123'
  | 'zara-leo-nadia-maya-batch_124'
  | 'zara-leo-nadia-maya-batch_125'
  | 'zara-leo-nadia-maya-batch_126'
  | 'zara-leo-nadia-maya-batch_127'
  | 'zara-leo-nadia-maya-batch_128'
  | 'zara-leo-nadia-maya-batch_129'
  | 'zara-leo-nadia-maya-batch_130'
  | 'zara-leo-nadia-maya-batch_131'
  | 'zara-leo-nadia-maya-batch_132'
  | 'zara-leo-nadia-maya-batch_133'
  | 'zara-leo-nadia-maya-batch_134'
  | 'zara-leo-nadia-maya-batch_135'
  | 'zara-leo-nadia-maya-batch_136'
  | 'zara-leo-nadia-maya-batch_137'
  | 'zara-leo-nadia-maya-batch_138'
  | 'zara-leo-nadia-maya-batch_139'
  | 'zara-leo-nadia-maya-batch_140'
  | 'zara-leo-nadia-maya-batch_141'
  | 'zara-leo-nadia-maya-batch_142'
  | 'zara-leo-nadia-maya-batch_143'
  | 'zara-leo-nadia-maya-batch_144'
  | 'zara-leo-nadia-maya-batch_145'
  | 'zara-leo-nadia-maya-batch_146'
  | 'zara-leo-nadia-maya-batch_147'
  | 'zara-leo-nadia-maya-batch_148'
  | 'zara-leo-nadia-maya-batch_149'
  | 'zara-leo-nadia-maya-batch_150'
  | 'zara-leo-nadia-maya-batch_151'
  | 'zara-leo-nadia-maya-batch_152'
  | 'zara-leo-nadia-maya-batch_153'
  | 'zara-leo-nadia-maya-batch_154'
  | 'zara-leo-nadia-maya-batch_155'
  | 'zara-leo-nadia-maya-batch_156'
  | 'zara-leo-nadia-maya-batch_157'
  | 'zara-leo-nadia-maya-batch_158'
  | 'zara-leo-nadia-maya-batch_159'
  | 'zara-leo-nadia-maya-batch_160'
  | 'zara-leo-nadia-maya-batch_161'
  | 'zara-leo-nadia-maya-batch_162'
  | 'zara-leo-nadia-maya-batch_163'
  | 'zara-leo-nadia-maya-batch_164'
  | 'zara-leo-nadia-maya-batch_165'
  | 'zara-leo-nadia-maya-batch_166'
  | 'zara-leo-nadia-maya-batch_167'
  | 'zara-leo-nadia-maya-batch_168'
  | 'zara-leo-nadia-maya-batch_169'
  | 'zara-leo-nadia-maya-batch_170'
  | 'zara-leo-nadia-maya-batch_171'
  | 'zara-leo-nadia-maya-batch_172'
  | 'zara-leo-nadia-maya-batch_173'
  | 'zara-leo-nadia-maya-batch_174'
  | 'zara-leo-nadia-maya-batch_175'
  | 'zara-leo-nadia-maya-batch_176'
  | 'zara-leo-nadia-maya-batch_177'
  | 'zara-leo-nadia-maya-batch_178'
  | 'zara-leo-nadia-maya-batch_179'
  | 'zara-leo-nadia-maya-batch_180'
  | 'zara-leo-nadia-maya-batch_181'
  | 'zara-leo-nadia-maya-batch_182'
  | 'zara-leo-nadia-maya-batch_183'
  | 'zara-leo-nadia-maya-batch_184'
  | 'zara-leo-nadia-maya-batch_185'
  | 'zara-leo-nadia-maya-batch_186'
  | 'zara-leo-nadia-maya-batch_187'
  | 'zara-leo-nadia-maya-batch_188'
  | 'zara-leo-nadia-maya-batch_189'
  | 'zara-leo-nadia-maya-batch_190'
  | 'zara-leo-nadia-maya-batch_191'
  | 'zara-leo-nadia-maya-batch_192'
  | 'zara-leo-nadia-maya-batch_193'
  | 'zara-leo-nadia-maya-batch_194'
  | 'zara-leo-nadia-maya-batch_195'
  | 'zara-leo-nadia-maya-batch_196'
  | 'zara-leo-nadia-maya-batch_197'
  | 'zara-leo-nadia-maya-batch_198'
  | 'zara-leo-nadia-maya-batch_199'
  | 'zara-leo-nadia-maya-batch_200'
  | 'zara-leo-nadia-maya-batch_201'
  | 'zara-leo-nadia-maya-batch_202'
  | 'zara-leo-nadia-maya-batch_203'
  | 'zara-leo-nadia-maya-batch_204'
  | 'zara-leo-nadia-maya-batch_205'
  | 'zara-leo-nadia-maya-batch_206'
  | 'zara-leo-nadia-maya-batch_207'
  | 'zara-leo-nadia-maya-batch_208'
  | 'zara-leo-nadia-maya-batch_209'
  | 'zara-leo-nadia-maya-batch_210'
  | 'zara-leo-nadia-maya-batch_211'
  | 'zara-leo-nadia-maya-batch_212'
  | 'zara-leo-nadia-maya-batch_213'
  | 'zara-leo-nadia-maya-batch_214'
  | 'zara-leo-nadia-maya-batch_215'
  | 'zara-leo-nadia-maya-batch_216'
  | 'zara-leo-nadia-maya-batch_217'
  | 'zara-leo-nadia-maya-batch_218'
  | 'zara-leo-nadia-maya-batch_219'
  | 'zara-leo-nadia-maya-batch_220'
  | 'zara-leo-nadia-maya-batch_221'
  | 'zara-leo-nadia-maya-batch_222'
  | 'zara-leo-nadia-maya-batch_223'
  | 'zara-leo-nadia-maya-batch_224'
  | 'zara-leo-nadia-maya-batch_225'
  | 'zara-leo-nadia-maya-batch_226'
  | 'zara-leo-nadia-maya-batch_227'
  | 'zara-leo-nadia-maya-batch_228';

// ─── Individual Sheet Consts ───────────────────────────────────────────────────

/** Alex Chen only */
export const SPRITES_ALEX_CHEN_ONLY: Record<string, SpriteEntry> = {
  'alex-chen-only_base': { file: 'individual/alex-chen-only/alex-chen-only_base.svg', size: { w: 57, h: 135 }, index: 0 },
  'alex-chen-only_emotion-neutral': { file: 'individual/alex-chen-only/alex-chen-only_emotion-neutral.svg', size: { w: 61, h: 68 }, index: 1 },
  'alex-chen-only_emotion-happy': { file: 'individual/alex-chen-only/alex-chen-only_emotion-happy.svg', size: { w: 60, h: 68 }, index: 2 },
  'alex-chen-only_emotion-talking': { file: 'individual/alex-chen-only/alex-chen-only_emotion-talking.svg', size: { w: 60, h: 68 }, index: 3 },
  'alex-chen-only_emotion-thinking': { file: 'individual/alex-chen-only/alex-chen-only_emotion-thinking.svg', size: { w: 60, h: 68 }, index: 4 },
  'alex-chen-only_emotion-stressed': { file: 'individual/alex-chen-only/alex-chen-only_emotion-stressed.svg', size: { w: 60, h: 68 }, index: 5 },
  'alex-chen-only_emotion-excited': { file: 'individual/alex-chen-only/alex-chen-only_emotion-excited.svg', size: { w: 60, h: 69 }, index: 6 },
  'alex-chen-only_emotion-concerned': { file: 'individual/alex-chen-only/alex-chen-only_emotion-concerned.svg', size: { w: 60, h: 68 }, index: 7 },
  'alex-chen-only_emotion-frustrated': { file: 'individual/alex-chen-only/alex-chen-only_emotion-frustrated.svg', size: { w: 60, h: 69 }, index: 8 },
  'alex-chen-only_emotion-satisfied': { file: 'individual/alex-chen-only/alex-chen-only_emotion-satisfied.svg', size: { w: 60, h: 69 }, index: 9 },
  'alex-chen-only_emotion-curious': { file: 'individual/alex-chen-only/alex-chen-only_emotion-curious.svg', size: { w: 65, h: 71 }, index: 10 },
  'alex-chen-only_emotion-celebrating': { file: 'individual/alex-chen-only/alex-chen-only_emotion-celebrating.svg', size: { w: 105, h: 69 }, index: 11 },
  'alex-chen-only_emotion-sleeping': { file: 'individual/alex-chen-only/alex-chen-only_emotion-sleeping.svg', size: { w: 70, h: 83 }, index: 12 },
  'alex-chen-only_emotion-panicking': { file: 'individual/alex-chen-only/alex-chen-only_emotion-panicking.svg', size: { w: 81, h: 76 }, index: 13 },
  'alex-chen-only_emotion-rushing': { file: 'individual/alex-chen-only/alex-chen-only_emotion-rushing.svg', size: { w: 96, h: 71 }, index: 14 },
  'alex-chen-only_idle-1': { file: 'individual/alex-chen-only/alex-chen-only_idle-1.svg', size: { w: 41, h: 106 }, index: 15 },
  'alex-chen-only_idle-2': { file: 'individual/alex-chen-only/alex-chen-only_idle-2.svg', size: { w: 42, h: 106 }, index: 16 },
  'alex-chen-only_idle-3': { file: 'individual/alex-chen-only/alex-chen-only_idle-3.svg', size: { w: 41, h: 105 }, index: 17 },
  'alex-chen-only_idle-4': { file: 'individual/alex-chen-only/alex-chen-only_idle-4.svg', size: { w: 42, h: 107 }, index: 18 },
  'alex-chen-only_typing-1': { file: 'individual/alex-chen-only/alex-chen-only_typing-1.svg', size: { w: 53, h: 107 }, index: 19 },
  'alex-chen-only_typing-2': { file: 'individual/alex-chen-only/alex-chen-only_typing-2.svg', size: { w: 59, h: 107 }, index: 20 },
  'alex-chen-only_walk-1': { file: 'individual/alex-chen-only/alex-chen-only_walk-1.svg', size: { w: 51, h: 106 }, index: 21 },
  'alex-chen-only_walk-2': { file: 'individual/alex-chen-only/alex-chen-only_walk-2.svg', size: { w: 51, h: 106 }, index: 22 },
  'alex-chen-only_walk-3': { file: 'individual/alex-chen-only/alex-chen-only_walk-3.svg', size: { w: 50, h: 105 }, index: 23 },
  'alex-chen-only_walk-4': { file: 'individual/alex-chen-only/alex-chen-only_walk-4.svg', size: { w: 42, h: 105 }, index: 24 },
  'alex-chen-only_panic-run-1': { file: 'individual/alex-chen-only/alex-chen-only_panic-run-1.svg', size: { w: 99, h: 102 }, index: 25 },
  'alex-chen-only_panic-run-2': { file: 'individual/alex-chen-only/alex-chen-only_panic-run-2.svg', size: { w: 109, h: 102 }, index: 26 },
  'alex-chen-only_panic-run-3': { file: 'individual/alex-chen-only/alex-chen-only_panic-run-3.svg', size: { w: 103, h: 104 }, index: 27 },
  'alex-chen-only_panic-run-4': { file: 'individual/alex-chen-only/alex-chen-only_panic-run-4.svg', size: { w: 96, h: 102 }, index: 28 },
  'alex-chen-only_sitting': { file: 'individual/alex-chen-only/alex-chen-only_sitting.svg', size: { w: 70, h: 106 }, index: 29 },
  'alex-chen-only_standup-1': { file: 'individual/alex-chen-only/alex-chen-only_standup-1.svg', size: { w: 61, h: 95 }, index: 30 },
  'alex-chen-only_standup-2': { file: 'individual/alex-chen-only/alex-chen-only_standup-2.svg', size: { w: 61, h: 89 }, index: 31 },
  'alex-chen-only_standup-3': { file: 'individual/alex-chen-only/alex-chen-only_standup-3.svg', size: { w: 38, h: 101 }, index: 32 },
  'alex-chen-only_celebrate-1': { file: 'individual/alex-chen-only/alex-chen-only_celebrate-1.svg', size: { w: 66, h: 108 }, index: 33 },
  'alex-chen-only_celebrate-2': { file: 'individual/alex-chen-only/alex-chen-only_celebrate-2.svg', size: { w: 84, h: 101 }, index: 34 },
  'alex-chen-only_celebrate-3': { file: 'individual/alex-chen-only/alex-chen-only_celebrate-3.svg', size: { w: 67, h: 105 }, index: 35 },
  'alex-chen-only_celebrate-4': { file: 'individual/alex-chen-only/alex-chen-only_celebrate-4.svg', size: { w: 67, h: 94 }, index: 36 },
  'alex-chen-only_talk-1': { file: 'individual/alex-chen-only/alex-chen-only_talk-1.svg', size: { w: 55, h: 102 }, index: 37 },
  'alex-chen-only_talk-2': { file: 'individual/alex-chen-only/alex-chen-only_talk-2.svg', size: { w: 39, h: 101 }, index: 38 },
  'alex-chen-only_wave': { file: 'individual/alex-chen-only/alex-chen-only_wave.svg', size: { w: 48, h: 97 }, index: 39 },
  'alex-chen-only_walk-home': { file: 'individual/alex-chen-only/alex-chen-only_walk-home.svg', size: { w: 35, h: 111 }, index: 40 },
  'alex-chen-only_levelup-1': { file: 'individual/alex-chen-only/alex-chen-only_levelup-1.svg', size: { w: 63, h: 121 }, index: 41 },
  'alex-chen-only_levelup-2': { file: 'individual/alex-chen-only/alex-chen-only_levelup-2.svg', size: { w: 88, h: 125 }, index: 42 },
  'alex-chen-only_levelup-3': { file: 'individual/alex-chen-only/alex-chen-only_levelup-3.svg', size: { w: 63, h: 90 }, index: 43 },
  'alex-chen-only_levelup-4': { file: 'individual/alex-chen-only/alex-chen-only_levelup-4.svg', size: { w: 35, h: 121 }, index: 44 },
  'alex-chen-only_levelup-5': { file: 'individual/alex-chen-only/alex-chen-only_levelup-5.svg', size: { w: 35, h: 88 }, index: 45 },
  'alex-chen-only_coffee-walk-1': { file: 'individual/alex-chen-only/alex-chen-only_coffee-walk-1.svg', size: { w: 65, h: 97 }, index: 46 },
  'alex-chen-only_coffee-walk-2': { file: 'individual/alex-chen-only/alex-chen-only_coffee-walk-2.svg', size: { w: 67, h: 97 }, index: 47 },
  'alex-chen-only_late-mild': { file: 'individual/alex-chen-only/alex-chen-only_late-mild.svg', size: { w: 84, h: 98 }, index: 48 },
  'alex-chen-only_late-panic': { file: 'individual/alex-chen-only/alex-chen-only_late-panic.svg', size: { w: 136, h: 108 }, index: 49 },
};

/** Building exterior */
export const SPRITES_BUILDING_EXTERIOR: Record<string, SpriteEntry> = {
  'building-exterior_000': { file: 'individual/building-exterior/building-exterior_000.svg', size: { w: 1086, h: 1448 }, index: 0 },
};

/** Casey Kim only */
export const SPRITES_CASEY_KIM_ONLY: Record<string, SpriteEntry> = {
  'casey-kim-only_base': { file: 'individual/casey-kim-only/casey-kim-only_base.svg', size: { w: 85, h: 154 }, index: 0 },
  'casey-kim-only_emotion-neutral': { file: 'individual/casey-kim-only/casey-kim-only_emotion-neutral.svg', size: { w: 95, h: 96 }, index: 1 },
  'casey-kim-only_emotion-happy': { file: 'individual/casey-kim-only/casey-kim-only_emotion-happy.svg', size: { w: 97, h: 96 }, index: 2 },
  'casey-kim-only_emotion-talking': { file: 'individual/casey-kim-only/casey-kim-only_emotion-talking.svg', size: { w: 95, h: 96 }, index: 3 },
  'casey-kim-only_emotion-thinking': { file: 'individual/casey-kim-only/casey-kim-only_emotion-thinking.svg', size: { w: 96, h: 96 }, index: 4 },
  'casey-kim-only_emotion-stressed': { file: 'individual/casey-kim-only/casey-kim-only_emotion-stressed.svg', size: { w: 95, h: 97 }, index: 5 },
  'casey-kim-only_emotion-excited': { file: 'individual/casey-kim-only/casey-kim-only_emotion-excited.svg', size: { w: 96, h: 96 }, index: 6 },
  'casey-kim-only_emotion-concerned': { file: 'individual/casey-kim-only/casey-kim-only_emotion-concerned.svg', size: { w: 96, h: 96 }, index: 7 },
  'casey-kim-only_emotion-frustrated': { file: 'individual/casey-kim-only/casey-kim-only_emotion-frustrated.svg', size: { w: 96, h: 96 }, index: 8 },
  'casey-kim-only_emotion-satisfied': { file: 'individual/casey-kim-only/casey-kim-only_emotion-satisfied.svg', size: { w: 97, h: 96 }, index: 9 },
  'casey-kim-only_emotion-curious': { file: 'individual/casey-kim-only/casey-kim-only_emotion-curious.svg', size: { w: 96, h: 102 }, index: 10 },
  'casey-kim-only_emotion-celebrating': { file: 'individual/casey-kim-only/casey-kim-only_emotion-celebrating.svg', size: { w: 188, h: 98 }, index: 11 },
  'casey-kim-only_emotion-sleeping': { file: 'individual/casey-kim-only/casey-kim-only_emotion-sleeping.svg', size: { w: 149, h: 107 }, index: 12 },
  'casey-kim-only_emotion-panicking': { file: 'individual/casey-kim-only/casey-kim-only_emotion-panicking.svg', size: { w: 137, h: 98 }, index: 13 },
  'casey-kim-only_emotion-rushing': { file: 'individual/casey-kim-only/casey-kim-only_emotion-rushing.svg', size: { w: 154, h: 99 }, index: 14 },
  'casey-kim-only_idle-1': { file: 'individual/casey-kim-only/casey-kim-only_idle-1.svg', size: { w: 64, h: 122 }, index: 15 },
  'casey-kim-only_idle-2': { file: 'individual/casey-kim-only/casey-kim-only_idle-2.svg', size: { w: 64, h: 122 }, index: 16 },
  'casey-kim-only_idle-3': { file: 'individual/casey-kim-only/casey-kim-only_idle-3.svg', size: { w: 63, h: 121 }, index: 17 },
  'casey-kim-only_idle-4': { file: 'individual/casey-kim-only/casey-kim-only_idle-4.svg', size: { w: 63, h: 121 }, index: 18 },
  'casey-kim-only_typing-1': { file: 'individual/casey-kim-only/casey-kim-only_typing-1.svg', size: { w: 74, h: 122 }, index: 19 },
  'casey-kim-only_typing-2': { file: 'individual/casey-kim-only/casey-kim-only_typing-2.svg', size: { w: 72, h: 122 }, index: 20 },
  'casey-kim-only_walk-1': { file: 'individual/casey-kim-only/casey-kim-only_walk-1.svg', size: { w: 70, h: 120 }, index: 21 },
  'casey-kim-only_walk-2': { file: 'individual/casey-kim-only/casey-kim-only_walk-2.svg', size: { w: 63, h: 120 }, index: 22 },
  'casey-kim-only_walk-3': { file: 'individual/casey-kim-only/casey-kim-only_walk-3.svg', size: { w: 72, h: 120 }, index: 23 },
  'casey-kim-only_walk-4': { file: 'individual/casey-kim-only/casey-kim-only_walk-4.svg', size: { w: 63, h: 121 }, index: 24 },
  'casey-kim-only_panic-run-1': { file: 'individual/casey-kim-only/casey-kim-only_panic-run-1.svg', size: { w: 117, h: 109 }, index: 25 },
  'casey-kim-only_panic-run-2': { file: 'individual/casey-kim-only/casey-kim-only_panic-run-2.svg', size: { w: 131, h: 108 }, index: 26 },
  'casey-kim-only_panic-run-3': { file: 'individual/casey-kim-only/casey-kim-only_panic-run-3.svg', size: { w: 130, h: 109 }, index: 27 },
  'casey-kim-only_panic-run-4': { file: 'individual/casey-kim-only/casey-kim-only_panic-run-4.svg', size: { w: 127, h: 109 }, index: 28 },
  'casey-kim-only_sitting': { file: 'individual/casey-kim-only/casey-kim-only_sitting.svg', size: { w: 86, h: 110 }, index: 29 },
  'casey-kim-only_standup-1': { file: 'individual/casey-kim-only/casey-kim-only_standup-1.svg', size: { w: 75, h: 108 }, index: 30 },
  'casey-kim-only_standup-2': { file: 'individual/casey-kim-only/casey-kim-only_standup-2.svg', size: { w: 89, h: 109 }, index: 31 },
  'casey-kim-only_standup-3': { file: 'individual/casey-kim-only/casey-kim-only_standup-3.svg', size: { w: 57, h: 112 }, index: 32 },
  'casey-kim-only_celebrate-1': { file: 'individual/casey-kim-only/casey-kim-only_celebrate-1.svg', size: { w: 103, h: 115 }, index: 33 },
  'casey-kim-only_celebrate-2': { file: 'individual/casey-kim-only/casey-kim-only_celebrate-2.svg', size: { w: 126, h: 115 }, index: 34 },
  'casey-kim-only_celebrate-3': { file: 'individual/casey-kim-only/casey-kim-only_celebrate-3.svg', size: { w: 109, h: 115 }, index: 35 },
  'casey-kim-only_celebrate-4': { file: 'individual/casey-kim-only/casey-kim-only_celebrate-4.svg', size: { w: 91, h: 112 }, index: 36 },
  'casey-kim-only_talk-1': { file: 'individual/casey-kim-only/casey-kim-only_talk-1.svg', size: { w: 60, h: 113 }, index: 37 },
  'casey-kim-only_talk-2': { file: 'individual/casey-kim-only/casey-kim-only_talk-2.svg', size: { w: 59, h: 112 }, index: 38 },
  'casey-kim-only_wave': { file: 'individual/casey-kim-only/casey-kim-only_wave.svg', size: { w: 77, h: 112 }, index: 39 },
  'casey-kim-only_walk-home': { file: 'individual/casey-kim-only/casey-kim-only_walk-home.svg', size: { w: 60, h: 112 }, index: 40 },
  'casey-kim-only_elevator': { file: 'individual/casey-kim-only/casey-kim-only_elevator.svg', size: { w: 139, h: 119 }, index: 41 },
  'casey-kim-only_levelup-1': { file: 'individual/casey-kim-only/casey-kim-only_levelup-1.svg', size: { w: 57, h: 145 }, index: 42 },
  'casey-kim-only_levelup-2': { file: 'individual/casey-kim-only/casey-kim-only_levelup-2.svg', size: { w: 97, h: 144 }, index: 43 },
  'casey-kim-only_levelup-3': { file: 'individual/casey-kim-only/casey-kim-only_levelup-3.svg', size: { w: 117, h: 152 }, index: 44 },
  'casey-kim-only_levelup-4': { file: 'individual/casey-kim-only/casey-kim-only_levelup-4.svg', size: { w: 94, h: 121 }, index: 45 },
  'casey-kim-only_levelup-5': { file: 'individual/casey-kim-only/casey-kim-only_levelup-5.svg', size: { w: 56, h: 153 }, index: 46 },
  'casey-kim-only_coffee-walk-1': { file: 'individual/casey-kim-only/casey-kim-only_coffee-walk-1.svg', size: { w: 82, h: 122 }, index: 47 },
  'casey-kim-only_coffee-walk-2': { file: 'individual/casey-kim-only/casey-kim-only_coffee-walk-2.svg', size: { w: 85, h: 121 }, index: 48 },
  'casey-kim-only_late-mild': { file: 'individual/casey-kim-only/casey-kim-only_late-mild.svg', size: { w: 107, h: 121 }, index: 49 },
  'casey-kim-only_late-panic': { file: 'individual/casey-kim-only/casey-kim-only_late-panic.svg', size: { w: 178, h: 124 }, index: 50 },
};

/** Chris, Ava, Fran, Jamie, Daniel, Sofia (batch) */
export const SPRITES_CHRIS_AVA_FRAN_JAMIE_DANIEL_SOFIA_BATCH: Record<string, SpriteEntry> = {
  'chris-ava-fran-jamie-daniel-sofia-batch_000': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_000.svg', size: { w: 87, h: 17 }, index: 0 },
  'chris-ava-fran-jamie-daniel-sofia-batch_001': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_001.svg', size: { w: 89, h: 17 }, index: 1 },
  'chris-ava-fran-jamie-daniel-sofia-batch_002': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_002.svg', size: { w: 71, h: 16 }, index: 2 },
  'chris-ava-fran-jamie-daniel-sofia-batch_003': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_003.svg', size: { w: 87, h: 17 }, index: 3 },
  'chris-ava-fran-jamie-daniel-sofia-batch_004': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_004.svg', size: { w: 103, h: 16 }, index: 4 },
  'chris-ava-fran-jamie-daniel-sofia-batch_005': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_005.svg', size: { w: 93, h: 16 }, index: 5 },
  'chris-ava-fran-jamie-daniel-sofia-batch_006': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_006.svg', size: { w: 93, h: 16 }, index: 6 },
  'chris-ava-fran-jamie-daniel-sofia-batch_007': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_007.svg', size: { w: 109, h: 16 }, index: 7 },
  'chris-ava-fran-jamie-daniel-sofia-batch_008': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_008.svg', size: { w: 71, h: 16 }, index: 8 },
  'chris-ava-fran-jamie-daniel-sofia-batch_009': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_009.svg', size: { w: 103, h: 16 }, index: 9 },
  'chris-ava-fran-jamie-daniel-sofia-batch_010': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_010.svg', size: { w: 122, h: 16 }, index: 10 },
  'chris-ava-fran-jamie-daniel-sofia-batch_011': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_011.svg', size: { w: 105, h: 16 }, index: 11 },
  'chris-ava-fran-jamie-daniel-sofia-batch_012': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_012.svg', size: { w: 43, h: 74 }, index: 12 },
  'chris-ava-fran-jamie-daniel-sofia-batch_013': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_013.svg', size: { w: 43, h: 74 }, index: 13 },
  'chris-ava-fran-jamie-daniel-sofia-batch_014': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_014.svg', size: { w: 42, h: 74 }, index: 14 },
  'chris-ava-fran-jamie-daniel-sofia-batch_015': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_015.svg', size: { w: 55, h: 73 }, index: 15 },
  'chris-ava-fran-jamie-daniel-sofia-batch_016': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_016.svg', size: { w: 57, h: 73 }, index: 16 },
  'chris-ava-fran-jamie-daniel-sofia-batch_017': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_017.svg', size: { w: 58, h: 73 }, index: 17 },
  'chris-ava-fran-jamie-daniel-sofia-batch_018': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_018.svg', size: { w: 44, h: 71 }, index: 18 },
  'chris-ava-fran-jamie-daniel-sofia-batch_019': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_019.svg', size: { w: 47, h: 73 }, index: 19 },
  'chris-ava-fran-jamie-daniel-sofia-batch_020': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_020.svg', size: { w: 46, h: 72 }, index: 20 },
  'chris-ava-fran-jamie-daniel-sofia-batch_021': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_021.svg', size: { w: 79, h: 71 }, index: 21 },
  'chris-ava-fran-jamie-daniel-sofia-batch_022': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_022.svg', size: { w: 84, h: 72 }, index: 22 },
  'chris-ava-fran-jamie-daniel-sofia-batch_023': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_023.svg', size: { w: 70, h: 72 }, index: 23 },
  'chris-ava-fran-jamie-daniel-sofia-batch_024': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_024.svg', size: { w: 68, h: 82 }, index: 24 },
  'chris-ava-fran-jamie-daniel-sofia-batch_025': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_025.svg', size: { w: 86, h: 85 }, index: 25 },
  'chris-ava-fran-jamie-daniel-sofia-batch_026': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_026.svg', size: { w: 71, h: 81 }, index: 26 },
  'chris-ava-fran-jamie-daniel-sofia-batch_027': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_027.svg', size: { w: 71, h: 79 }, index: 27 },
  'chris-ava-fran-jamie-daniel-sofia-batch_028': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_028.svg', size: { w: 71, h: 79 }, index: 28 },
  'chris-ava-fran-jamie-daniel-sofia-batch_029': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_029.svg', size: { w: 57, h: 76 }, index: 29 },
  'chris-ava-fran-jamie-daniel-sofia-batch_030': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_030.svg', size: { w: 58, h: 76 }, index: 30 },
  'chris-ava-fran-jamie-daniel-sofia-batch_031': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_031.svg', size: { w: 56, h: 74 }, index: 31 },
  'chris-ava-fran-jamie-daniel-sofia-batch_032': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_032.svg', size: { w: 43, h: 74 }, index: 32 },
  'chris-ava-fran-jamie-daniel-sofia-batch_033': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_033.svg', size: { w: 85, h: 73 }, index: 33 },
  'chris-ava-fran-jamie-daniel-sofia-batch_034': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_034.svg', size: { w: 44, h: 70 }, index: 34 },
  'chris-ava-fran-jamie-daniel-sofia-batch_035': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_035.svg', size: { w: 108, h: 17 }, index: 35 },
  'chris-ava-fran-jamie-daniel-sofia-batch_036': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_036.svg', size: { w: 92, h: 17 }, index: 36 },
  'chris-ava-fran-jamie-daniel-sofia-batch_037': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_037.svg', size: { w: 93, h: 17 }, index: 37 },
  'chris-ava-fran-jamie-daniel-sofia-batch_038': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_038.svg', size: { w: 95, h: 16 }, index: 38 },
  'chris-ava-fran-jamie-daniel-sofia-batch_039': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_039.svg', size: { w: 109, h: 16 }, index: 39 },
  'chris-ava-fran-jamie-daniel-sofia-batch_040': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_040.svg', size: { w: 79, h: 16 }, index: 40 },
  'chris-ava-fran-jamie-daniel-sofia-batch_041': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_041.svg', size: { w: 97, h: 16 }, index: 41 },
  'chris-ava-fran-jamie-daniel-sofia-batch_042': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_042.svg', size: { w: 96, h: 16 }, index: 42 },
  'chris-ava-fran-jamie-daniel-sofia-batch_043': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_043.svg', size: { w: 94, h: 16 }, index: 43 },
  'chris-ava-fran-jamie-daniel-sofia-batch_044': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_044.svg', size: { w: 123, h: 16 }, index: 44 },
  'chris-ava-fran-jamie-daniel-sofia-batch_045': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_045.svg', size: { w: 95, h: 16 }, index: 45 },
  'chris-ava-fran-jamie-daniel-sofia-batch_046': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_046.svg', size: { w: 112, h: 16 }, index: 46 },
  'chris-ava-fran-jamie-daniel-sofia-batch_047': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_047.svg', size: { w: 47, h: 63 }, index: 47 },
  'chris-ava-fran-jamie-daniel-sofia-batch_048': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_048.svg', size: { w: 47, h: 63 }, index: 48 },
  'chris-ava-fran-jamie-daniel-sofia-batch_049': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_049.svg', size: { w: 47, h: 63 }, index: 49 },
  'chris-ava-fran-jamie-daniel-sofia-batch_050': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_050.svg', size: { w: 58, h: 63 }, index: 50 },
  'chris-ava-fran-jamie-daniel-sofia-batch_051': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_051.svg', size: { w: 56, h: 63 }, index: 51 },
  'chris-ava-fran-jamie-daniel-sofia-batch_052': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_052.svg', size: { w: 56, h: 63 }, index: 52 },
  'chris-ava-fran-jamie-daniel-sofia-batch_053': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_053.svg', size: { w: 49, h: 63 }, index: 53 },
  'chris-ava-fran-jamie-daniel-sofia-batch_054': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_054.svg', size: { w: 68, h: 63 }, index: 54 },
  'chris-ava-fran-jamie-daniel-sofia-batch_055': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_055.svg', size: { w: 67, h: 63 }, index: 55 },
  'chris-ava-fran-jamie-daniel-sofia-batch_056': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_056.svg', size: { w: 70, h: 63 }, index: 56 },
  'chris-ava-fran-jamie-daniel-sofia-batch_057': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_057.svg', size: { w: 36, h: 32 }, index: 57 },
  'chris-ava-fran-jamie-daniel-sofia-batch_058': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_058.svg', size: { w: 39, h: 32 }, index: 58 },
  'chris-ava-fran-jamie-daniel-sofia-batch_059': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_059.svg', size: { w: 78, h: 81 }, index: 59 },
  'chris-ava-fran-jamie-daniel-sofia-batch_060': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_060.svg', size: { w: 55, h: 73 }, index: 60 },
  'chris-ava-fran-jamie-daniel-sofia-batch_061': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_061.svg', size: { w: 65, h: 75 }, index: 61 },
  'chris-ava-fran-jamie-daniel-sofia-batch_062': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_062.svg', size: { w: 57, h: 74 }, index: 62 },
  'chris-ava-fran-jamie-daniel-sofia-batch_063': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_063.svg', size: { w: 57, h: 74 }, index: 63 },
  'chris-ava-fran-jamie-daniel-sofia-batch_064': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_064.svg', size: { w: 71, h: 72 }, index: 64 },
  'chris-ava-fran-jamie-daniel-sofia-batch_065': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_065.svg', size: { w: 55, h: 70 }, index: 65 },
  'chris-ava-fran-jamie-daniel-sofia-batch_066': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_066.svg', size: { w: 50, h: 71 }, index: 66 },
  'chris-ava-fran-jamie-daniel-sofia-batch_067': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_067.svg', size: { w: 71, h: 71 }, index: 67 },
  'chris-ava-fran-jamie-daniel-sofia-batch_068': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_068.svg', size: { w: 70, h: 69 }, index: 68 },
  'chris-ava-fran-jamie-daniel-sofia-batch_069': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_069.svg', size: { w: 87, h: 69 }, index: 69 },
  'chris-ava-fran-jamie-daniel-sofia-batch_070': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_070.svg', size: { w: 89, h: 17 }, index: 70 },
  'chris-ava-fran-jamie-daniel-sofia-batch_071': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_071.svg', size: { w: 89, h: 17 }, index: 71 },
  'chris-ava-fran-jamie-daniel-sofia-batch_072': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_072.svg', size: { w: 82, h: 17 }, index: 72 },
  'chris-ava-fran-jamie-daniel-sofia-batch_073': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_073.svg', size: { w: 115, h: 17 }, index: 73 },
  'chris-ava-fran-jamie-daniel-sofia-batch_074': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_074.svg', size: { w: 84, h: 17 }, index: 74 },
  'chris-ava-fran-jamie-daniel-sofia-batch_075': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_075.svg', size: { w: 77, h: 17 }, index: 75 },
  'chris-ava-fran-jamie-daniel-sofia-batch_076': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_076.svg', size: { w: 92, h: 17 }, index: 76 },
  'chris-ava-fran-jamie-daniel-sofia-batch_077': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_077.svg', size: { w: 93, h: 17 }, index: 77 },
  'chris-ava-fran-jamie-daniel-sofia-batch_078': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_078.svg', size: { w: 106, h: 17 }, index: 78 },
  'chris-ava-fran-jamie-daniel-sofia-batch_079': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_079.svg', size: { w: 100, h: 17 }, index: 79 },
  'chris-ava-fran-jamie-daniel-sofia-batch_080': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_080.svg', size: { w: 107, h: 17 }, index: 80 },
  'chris-ava-fran-jamie-daniel-sofia-batch_081': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_081.svg', size: { w: 90, h: 16 }, index: 81 },
  'chris-ava-fran-jamie-daniel-sofia-batch_082': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_082.svg', size: { w: 43, h: 67 }, index: 82 },
  'chris-ava-fran-jamie-daniel-sofia-batch_083': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_083.svg', size: { w: 76, h: 67 }, index: 83 },
  'chris-ava-fran-jamie-daniel-sofia-batch_084': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_084.svg', size: { w: 82, h: 64 }, index: 84 },
  'chris-ava-fran-jamie-daniel-sofia-batch_085': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_085.svg', size: { w: 54, h: 64 }, index: 85 },
  'chris-ava-fran-jamie-daniel-sofia-batch_086': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_086.svg', size: { w: 54, h: 64 }, index: 86 },
  'chris-ava-fran-jamie-daniel-sofia-batch_087': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_087.svg', size: { w: 54, h: 63 }, index: 87 },
  'chris-ava-fran-jamie-daniel-sofia-batch_088': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_088.svg', size: { w: 44, h: 61 }, index: 88 },
  'chris-ava-fran-jamie-daniel-sofia-batch_089': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_089.svg', size: { w: 31, h: 35 }, index: 89 },
  'chris-ava-fran-jamie-daniel-sofia-batch_090': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_090.svg', size: { w: 31, h: 35 }, index: 90 },
  'chris-ava-fran-jamie-daniel-sofia-batch_091': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_091.svg', size: { w: 30, h: 35 }, index: 91 },
  'chris-ava-fran-jamie-daniel-sofia-batch_092': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_092.svg', size: { w: 40, h: 35 }, index: 92 },
  'chris-ava-fran-jamie-daniel-sofia-batch_093': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_093.svg', size: { w: 35, h: 34 }, index: 93 },
  'chris-ava-fran-jamie-daniel-sofia-batch_094': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_094.svg', size: { w: 74, h: 75 }, index: 94 },
  'chris-ava-fran-jamie-daniel-sofia-batch_095': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_095.svg', size: { w: 68, h: 74 }, index: 95 },
  'chris-ava-fran-jamie-daniel-sofia-batch_096': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_096.svg', size: { w: 80, h: 73 }, index: 96 },
  'chris-ava-fran-jamie-daniel-sofia-batch_097': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_097.svg', size: { w: 50, h: 71 }, index: 97 },
  'chris-ava-fran-jamie-daniel-sofia-batch_098': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_098.svg', size: { w: 65, h: 72 }, index: 98 },
  'chris-ava-fran-jamie-daniel-sofia-batch_099': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_099.svg', size: { w: 65, h: 70 }, index: 99 },
  'chris-ava-fran-jamie-daniel-sofia-batch_100': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_100.svg', size: { w: 47, h: 70 }, index: 100 },
  'chris-ava-fran-jamie-daniel-sofia-batch_101': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_101.svg', size: { w: 55, h: 71 }, index: 101 },
  'chris-ava-fran-jamie-daniel-sofia-batch_102': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_102.svg', size: { w: 53, h: 71 }, index: 102 },
  'chris-ava-fran-jamie-daniel-sofia-batch_103': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_103.svg', size: { w: 43, h: 70 }, index: 103 },
  'chris-ava-fran-jamie-daniel-sofia-batch_104': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_104.svg', size: { w: 90, h: 69 }, index: 104 },
  'chris-ava-fran-jamie-daniel-sofia-batch_105': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_105.svg', size: { w: 82, h: 68 }, index: 105 },
  'chris-ava-fran-jamie-daniel-sofia-batch_106': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_106.svg', size: { w: 74, h: 17 }, index: 106 },
  'chris-ava-fran-jamie-daniel-sofia-batch_107': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_107.svg', size: { w: 105, h: 17 }, index: 107 },
  'chris-ava-fran-jamie-daniel-sofia-batch_108': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_108.svg', size: { w: 76, h: 17 }, index: 108 },
  'chris-ava-fran-jamie-daniel-sofia-batch_109': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_109.svg', size: { w: 93, h: 17 }, index: 109 },
  'chris-ava-fran-jamie-daniel-sofia-batch_110': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_110.svg', size: { w: 88, h: 18 }, index: 110 },
  'chris-ava-fran-jamie-daniel-sofia-batch_111': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_111.svg', size: { w: 76, h: 17 }, index: 111 },
  'chris-ava-fran-jamie-daniel-sofia-batch_112': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_112.svg', size: { w: 85, h: 16 }, index: 112 },
  'chris-ava-fran-jamie-daniel-sofia-batch_113': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_113.svg', size: { w: 101, h: 16 }, index: 113 },
  'chris-ava-fran-jamie-daniel-sofia-batch_114': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_114.svg', size: { w: 101, h: 16 }, index: 114 },
  'chris-ava-fran-jamie-daniel-sofia-batch_115': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_115.svg', size: { w: 86, h: 16 }, index: 115 },
  'chris-ava-fran-jamie-daniel-sofia-batch_116': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_116.svg', size: { w: 110, h: 16 }, index: 116 },
  'chris-ava-fran-jamie-daniel-sofia-batch_117': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_117.svg', size: { w: 125, h: 16 }, index: 117 },
  'chris-ava-fran-jamie-daniel-sofia-batch_118': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_118.svg', size: { w: 42, h: 36 }, index: 118 },
  'chris-ava-fran-jamie-daniel-sofia-batch_119': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_119.svg', size: { w: 52, h: 36 }, index: 119 },
  'chris-ava-fran-jamie-daniel-sofia-batch_120': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_120.svg', size: { w: 50, h: 36 }, index: 120 },
  'chris-ava-fran-jamie-daniel-sofia-batch_121': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_121.svg', size: { w: 33, h: 34 }, index: 121 },
  'chris-ava-fran-jamie-daniel-sofia-batch_122': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_122.svg', size: { w: 32, h: 34 }, index: 122 },
  'chris-ava-fran-jamie-daniel-sofia-batch_123': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_123.svg', size: { w: 32, h: 35 }, index: 123 },
  'chris-ava-fran-jamie-daniel-sofia-batch_124': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_124.svg', size: { w: 49, h: 34 }, index: 124 },
  'chris-ava-fran-jamie-daniel-sofia-batch_125': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_125.svg', size: { w: 32, h: 34 }, index: 125 },
  'chris-ava-fran-jamie-daniel-sofia-batch_126': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_126.svg', size: { w: 39, h: 34 }, index: 126 },
  'chris-ava-fran-jamie-daniel-sofia-batch_127': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_127.svg', size: { w: 34, h: 35 }, index: 127 },
  'chris-ava-fran-jamie-daniel-sofia-batch_128': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_128.svg', size: { w: 31, h: 34 }, index: 128 },
  'chris-ava-fran-jamie-daniel-sofia-batch_129': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_129.svg', size: { w: 76, h: 24 }, index: 129 },
  'chris-ava-fran-jamie-daniel-sofia-batch_130': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_130.svg', size: { w: 70, h: 69 }, index: 130 },
  'chris-ava-fran-jamie-daniel-sofia-batch_131': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_131.svg', size: { w: 59, h: 67 }, index: 131 },
  'chris-ava-fran-jamie-daniel-sofia-batch_132': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_132.svg', size: { w: 61, h: 62 }, index: 132 },
  'chris-ava-fran-jamie-daniel-sofia-batch_133': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_133.svg', size: { w: 62, h: 62 }, index: 133 },
  'chris-ava-fran-jamie-daniel-sofia-batch_134': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_134.svg', size: { w: 61, h: 62 }, index: 134 },
  'chris-ava-fran-jamie-daniel-sofia-batch_135': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_135.svg', size: { w: 69, h: 58 }, index: 135 },
  'chris-ava-fran-jamie-daniel-sofia-batch_136': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_136.svg', size: { w: 86, h: 16 }, index: 136 },
  'chris-ava-fran-jamie-daniel-sofia-batch_137': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_137.svg', size: { w: 108, h: 17 }, index: 137 },
  'chris-ava-fran-jamie-daniel-sofia-batch_138': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_138.svg', size: { w: 93, h: 16 }, index: 138 },
  'chris-ava-fran-jamie-daniel-sofia-batch_139': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_139.svg', size: { w: 79, h: 16 }, index: 139 },
  'chris-ava-fran-jamie-daniel-sofia-batch_140': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_140.svg', size: { w: 87, h: 16 }, index: 140 },
  'chris-ava-fran-jamie-daniel-sofia-batch_141': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_141.svg', size: { w: 86, h: 16 }, index: 141 },
  'chris-ava-fran-jamie-daniel-sofia-batch_142': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_142.svg', size: { w: 87, h: 16 }, index: 142 },
  'chris-ava-fran-jamie-daniel-sofia-batch_143': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_143.svg', size: { w: 76, h: 17 }, index: 143 },
  'chris-ava-fran-jamie-daniel-sofia-batch_144': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_144.svg', size: { w: 77, h: 16 }, index: 144 },
  'chris-ava-fran-jamie-daniel-sofia-batch_145': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_145.svg', size: { w: 85, h: 16 }, index: 145 },
  'chris-ava-fran-jamie-daniel-sofia-batch_146': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_146.svg', size: { w: 116, h: 16 }, index: 146 },
  'chris-ava-fran-jamie-daniel-sofia-batch_147': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_147.svg', size: { w: 98, h: 16 }, index: 147 },
  'chris-ava-fran-jamie-daniel-sofia-batch_148': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_148.svg', size: { w: 33, h: 31 }, index: 148 },
  'chris-ava-fran-jamie-daniel-sofia-batch_149': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_149.svg', size: { w: 32, h: 31 }, index: 149 },
  'chris-ava-fran-jamie-daniel-sofia-batch_150': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_150.svg', size: { w: 33, h: 29 }, index: 150 },
  'chris-ava-fran-jamie-daniel-sofia-batch_151': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_151.svg', size: { w: 48, h: 31 }, index: 151 },
  'chris-ava-fran-jamie-daniel-sofia-batch_152': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_152.svg', size: { w: 45, h: 29 }, index: 152 },
  'chris-ava-fran-jamie-daniel-sofia-batch_153': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_153.svg', size: { w: 47, h: 31 }, index: 153 },
  'chris-ava-fran-jamie-daniel-sofia-batch_154': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_154.svg', size: { w: 34, h: 30 }, index: 154 },
  'chris-ava-fran-jamie-daniel-sofia-batch_155': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_155.svg', size: { w: 37, h: 30 }, index: 155 },
  'chris-ava-fran-jamie-daniel-sofia-batch_156': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_156.svg', size: { w: 62, h: 25 }, index: 156 },
  'chris-ava-fran-jamie-daniel-sofia-batch_157': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_157.svg', size: { w: 62, h: 25 }, index: 157 },
  'chris-ava-fran-jamie-daniel-sofia-batch_158': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_158.svg', size: { w: 52, h: 23 }, index: 158 },
  'chris-ava-fran-jamie-daniel-sofia-batch_159': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_159.svg', size: { w: 64, h: 63 }, index: 159 },
  'chris-ava-fran-jamie-daniel-sofia-batch_160': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_160.svg', size: { w: 67, h: 63 }, index: 160 },
  'chris-ava-fran-jamie-daniel-sofia-batch_161': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_161.svg', size: { w: 55, h: 60 }, index: 161 },
  'chris-ava-fran-jamie-daniel-sofia-batch_162': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_162.svg', size: { w: 56, h: 60 }, index: 162 },
  'chris-ava-fran-jamie-daniel-sofia-batch_163': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_163.svg', size: { w: 55, h: 56 }, index: 163 },
  'chris-ava-fran-jamie-daniel-sofia-batch_164': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_164.svg', size: { w: 45, h: 55 }, index: 164 },
  'chris-ava-fran-jamie-daniel-sofia-batch_165': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_165.svg', size: { w: 45, h: 54 }, index: 165 },
  'chris-ava-fran-jamie-daniel-sofia-batch_166': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_166.svg', size: { w: 69, h: 54 }, index: 166 },
  'chris-ava-fran-jamie-daniel-sofia-batch_167': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_167.svg', size: { w: 65, h: 53 }, index: 167 },
  'chris-ava-fran-jamie-daniel-sofia-batch_168': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_168.svg', size: { w: 36, h: 53 }, index: 168 },
  'chris-ava-fran-jamie-daniel-sofia-batch_169': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_169.svg', size: { w: 63, h: 53 }, index: 169 },
  'chris-ava-fran-jamie-daniel-sofia-batch_170': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_170.svg', size: { w: 42, h: 51 }, index: 170 },
  'chris-ava-fran-jamie-daniel-sofia-batch_171': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_171.svg', size: { w: 34, h: 50 }, index: 171 },
  'chris-ava-fran-jamie-daniel-sofia-batch_172': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_172.svg', size: { w: 22, h: 15 }, index: 172 },
  'chris-ava-fran-jamie-daniel-sofia-batch_173': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_173.svg', size: { w: 99, h: 96 }, index: 173 },
  'chris-ava-fran-jamie-daniel-sofia-batch_174': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_174.svg', size: { w: 22, h: 15 }, index: 174 },
  'chris-ava-fran-jamie-daniel-sofia-batch_175': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_175.svg', size: { w: 114, h: 96 }, index: 175 },
  'chris-ava-fran-jamie-daniel-sofia-batch_176': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_176.svg', size: { w: 22, h: 15 }, index: 176 },
  'chris-ava-fran-jamie-daniel-sofia-batch_177': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_177.svg', size: { w: 120, h: 97 }, index: 177 },
  'chris-ava-fran-jamie-daniel-sofia-batch_178': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_178.svg', size: { w: 45, h: 58 }, index: 178 },
  'chris-ava-fran-jamie-daniel-sofia-batch_179': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_179.svg', size: { w: 21, h: 15 }, index: 179 },
  'chris-ava-fran-jamie-daniel-sofia-batch_180': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_180.svg', size: { w: 81, h: 53 }, index: 180 },
  'chris-ava-fran-jamie-daniel-sofia-batch_181': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_181.svg', size: { w: 43, h: 58 }, index: 181 },
  'chris-ava-fran-jamie-daniel-sofia-batch_182': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_182.svg', size: { w: 22, h: 15 }, index: 182 },
  'chris-ava-fran-jamie-daniel-sofia-batch_183': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_183.svg', size: { w: 85, h: 97 }, index: 183 },
  'chris-ava-fran-jamie-daniel-sofia-batch_184': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_184.svg', size: { w: 42, h: 59 }, index: 184 },
  'chris-ava-fran-jamie-daniel-sofia-batch_185': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_185.svg', size: { w: 46, h: 49 }, index: 185 },
  'chris-ava-fran-jamie-daniel-sofia-batch_186': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_186.svg', size: { w: 107, h: 96 }, index: 186 },
  'chris-ava-fran-jamie-daniel-sofia-batch_187': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_187.svg', size: { w: 35, h: 48 }, index: 187 },
  'chris-ava-fran-jamie-daniel-sofia-batch_188': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_188.svg', size: { w: 96, h: 13 }, index: 188 },
  'chris-ava-fran-jamie-daniel-sofia-batch_189': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_189.svg', size: { w: 63, h: 51 }, index: 189 },
  'chris-ava-fran-jamie-daniel-sofia-batch_190': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_190.svg', size: { w: 42, h: 50 }, index: 190 },
  'chris-ava-fran-jamie-daniel-sofia-batch_191': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_191.svg', size: { w: 34, h: 49 }, index: 191 },
  'chris-ava-fran-jamie-daniel-sofia-batch_192': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_192.svg', size: { w: 33, h: 48 }, index: 192 },
  'chris-ava-fran-jamie-daniel-sofia-batch_193': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_193.svg', size: { w: 36, h: 46 }, index: 193 },
  'chris-ava-fran-jamie-daniel-sofia-batch_194': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_194.svg', size: { w: 36, h: 46 }, index: 194 },
  'chris-ava-fran-jamie-daniel-sofia-batch_195': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_195.svg', size: { w: 36, h: 46 }, index: 195 },
  'chris-ava-fran-jamie-daniel-sofia-batch_196': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_196.svg', size: { w: 44, h: 46 }, index: 196 },
  'chris-ava-fran-jamie-daniel-sofia-batch_197': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_197.svg', size: { w: 36, h: 47 }, index: 197 },
  'chris-ava-fran-jamie-daniel-sofia-batch_198': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_198.svg', size: { w: 36, h: 47 }, index: 198 },
  'chris-ava-fran-jamie-daniel-sofia-batch_199': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_199.svg', size: { w: 37, h: 47 }, index: 199 },
  'chris-ava-fran-jamie-daniel-sofia-batch_200': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_200.svg', size: { w: 35, h: 47 }, index: 200 },
  'chris-ava-fran-jamie-daniel-sofia-batch_201': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_201.svg', size: { w: 93, h: 52 }, index: 201 },
  'chris-ava-fran-jamie-daniel-sofia-batch_202': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_202.svg', size: { w: 127, h: 52 }, index: 202 },
  'chris-ava-fran-jamie-daniel-sofia-batch_203': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_203.svg', size: { w: 128, h: 52 }, index: 203 },
  'chris-ava-fran-jamie-daniel-sofia-batch_204': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_204.svg', size: { w: 131, h: 52 }, index: 204 },
  'chris-ava-fran-jamie-daniel-sofia-batch_205': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_205.svg', size: { w: 107, h: 52 }, index: 205 },
  'chris-ava-fran-jamie-daniel-sofia-batch_206': { file: 'individual/chris-ava-fran-jamie-daniel-sofia-batch/chris-ava-fran-jamie-daniel-sofia-batch_206.svg', size: { w: 112, h: 52 }, index: 206 },
};

/** Conference table, whiteboard, kanban, coffee machine, plant */
export const SPRITES_CONFERENCE_TABLE_WHITEBOARD_KANBAN_COFFEE_MACHINE_PLANT: Record<string, SpriteEntry> = {
  'conference-table-whiteboard-kanban-coffee-machine-plant_000': { file: 'individual/conference-table-whiteboard-kanban-coffee-machine-plant/conference-table-whiteboard-kanban-coffee-machine-plant_000.svg', size: { w: 170, h: 24 }, index: 0 },
  'conference-table-whiteboard-kanban-coffee-machine-plant_001': { file: 'individual/conference-table-whiteboard-kanban-coffee-machine-plant/conference-table-whiteboard-kanban-coffee-machine-plant_001.svg', size: { w: 130, h: 23 }, index: 1 },
  'conference-table-whiteboard-kanban-coffee-machine-plant_002': { file: 'individual/conference-table-whiteboard-kanban-coffee-machine-plant/conference-table-whiteboard-kanban-coffee-machine-plant_002.svg', size: { w: 131, h: 23 }, index: 2 },
  'conference-table-whiteboard-kanban-coffee-machine-plant_003': { file: 'individual/conference-table-whiteboard-kanban-coffee-machine-plant/conference-table-whiteboard-kanban-coffee-machine-plant_003.svg', size: { w: 170, h: 23 }, index: 3 },
  'conference-table-whiteboard-kanban-coffee-machine-plant_004': { file: 'individual/conference-table-whiteboard-kanban-coffee-machine-plant/conference-table-whiteboard-kanban-coffee-machine-plant_004.svg', size: { w: 130, h: 23 }, index: 4 },
  'conference-table-whiteboard-kanban-coffee-machine-plant_005': { file: 'individual/conference-table-whiteboard-kanban-coffee-machine-plant/conference-table-whiteboard-kanban-coffee-machine-plant_005.svg', size: { w: 30, h: 23 }, index: 5 },
  'conference-table-whiteboard-kanban-coffee-machine-plant_006': { file: 'individual/conference-table-whiteboard-kanban-coffee-machine-plant/conference-table-whiteboard-kanban-coffee-machine-plant_006.svg', size: { w: 69, h: 23 }, index: 6 },
  'conference-table-whiteboard-kanban-coffee-machine-plant_007': { file: 'individual/conference-table-whiteboard-kanban-coffee-machine-plant/conference-table-whiteboard-kanban-coffee-machine-plant_007.svg', size: { w: 49, h: 23 }, index: 7 },
  'conference-table-whiteboard-kanban-coffee-machine-plant_008': { file: 'individual/conference-table-whiteboard-kanban-coffee-machine-plant/conference-table-whiteboard-kanban-coffee-machine-plant_008.svg', size: { w: 413, h: 370 }, index: 8 },
  'conference-table-whiteboard-kanban-coffee-machine-plant_009': { file: 'individual/conference-table-whiteboard-kanban-coffee-machine-plant/conference-table-whiteboard-kanban-coffee-machine-plant_009.svg', size: { w: 450, h: 370 }, index: 9 },
  'conference-table-whiteboard-kanban-coffee-machine-plant_010': { file: 'individual/conference-table-whiteboard-kanban-coffee-machine-plant/conference-table-whiteboard-kanban-coffee-machine-plant_010.svg', size: { w: 545, h: 311 }, index: 10 },
  'conference-table-whiteboard-kanban-coffee-machine-plant_011': { file: 'individual/conference-table-whiteboard-kanban-coffee-machine-plant/conference-table-whiteboard-kanban-coffee-machine-plant_011.svg', size: { w: 129, h: 23 }, index: 11 },
  'conference-table-whiteboard-kanban-coffee-machine-plant_012': { file: 'individual/conference-table-whiteboard-kanban-coffee-machine-plant/conference-table-whiteboard-kanban-coffee-machine-plant_012.svg', size: { w: 131, h: 23 }, index: 12 },
  'conference-table-whiteboard-kanban-coffee-machine-plant_013': { file: 'individual/conference-table-whiteboard-kanban-coffee-machine-plant/conference-table-whiteboard-kanban-coffee-machine-plant_013.svg', size: { w: 148, h: 22 }, index: 13 },
  'conference-table-whiteboard-kanban-coffee-machine-plant_014': { file: 'individual/conference-table-whiteboard-kanban-coffee-machine-plant/conference-table-whiteboard-kanban-coffee-machine-plant_014.svg', size: { w: 129, h: 23 }, index: 14 },
  'conference-table-whiteboard-kanban-coffee-machine-plant_015': { file: 'individual/conference-table-whiteboard-kanban-coffee-machine-plant/conference-table-whiteboard-kanban-coffee-machine-plant_015.svg', size: { w: 128, h: 24 }, index: 15 },
  'conference-table-whiteboard-kanban-coffee-machine-plant_016': { file: 'individual/conference-table-whiteboard-kanban-coffee-machine-plant/conference-table-whiteboard-kanban-coffee-machine-plant_016.svg', size: { w: 58, h: 18 }, index: 16 },
  'conference-table-whiteboard-kanban-coffee-machine-plant_017': { file: 'individual/conference-table-whiteboard-kanban-coffee-machine-plant/conference-table-whiteboard-kanban-coffee-machine-plant_017.svg', size: { w: 246, h: 380 }, index: 17 },
  'conference-table-whiteboard-kanban-coffee-machine-plant_018': { file: 'individual/conference-table-whiteboard-kanban-coffee-machine-plant/conference-table-whiteboard-kanban-coffee-machine-plant_018.svg', size: { w: 11, h: 379 }, index: 18 },
  'conference-table-whiteboard-kanban-coffee-machine-plant_019': { file: 'individual/conference-table-whiteboard-kanban-coffee-machine-plant/conference-table-whiteboard-kanban-coffee-machine-plant_019.svg', size: { w: 629, h: 379 }, index: 19 },
  'conference-table-whiteboard-kanban-coffee-machine-plant_020': { file: 'individual/conference-table-whiteboard-kanban-coffee-machine-plant/conference-table-whiteboard-kanban-coffee-machine-plant_020.svg', size: { w: 58, h: 12 }, index: 20 },
  'conference-table-whiteboard-kanban-coffee-machine-plant_021': { file: 'individual/conference-table-whiteboard-kanban-coffee-machine-plant/conference-table-whiteboard-kanban-coffee-machine-plant_021.svg', size: { w: 260, h: 355 }, index: 21 },
};

/** Desks and monitor screens */
export const SPRITES_DESKS_AND_MONITOR_SCREENS: Record<string, SpriteEntry> = {
  'desks-and-monitor-screens_000': { file: 'individual/desks-and-monitor-screens/desks-and-monitor-screens_000.svg', size: { w: 157, h: 26 }, index: 0 },
  'desks-and-monitor-screens_001': { file: 'individual/desks-and-monitor-screens/desks-and-monitor-screens_001.svg', size: { w: 136, h: 25 }, index: 1 },
  'desks-and-monitor-screens_002': { file: 'individual/desks-and-monitor-screens/desks-and-monitor-screens_002.svg', size: { w: 144, h: 24 }, index: 2 },
  'desks-and-monitor-screens_003': { file: 'individual/desks-and-monitor-screens/desks-and-monitor-screens_003.svg', size: { w: 31, h: 24 }, index: 3 },
  'desks-and-monitor-screens_004': { file: 'individual/desks-and-monitor-screens/desks-and-monitor-screens_004.svg', size: { w: 41, h: 24 }, index: 4 },
  'desks-and-monitor-screens_005': { file: 'individual/desks-and-monitor-screens/desks-and-monitor-screens_005.svg', size: { w: 31, h: 22 }, index: 5 },
  'desks-and-monitor-screens_006': { file: 'individual/desks-and-monitor-screens/desks-and-monitor-screens_006.svg', size: { w: 51, h: 24 }, index: 6 },
  'desks-and-monitor-screens_007': { file: 'individual/desks-and-monitor-screens/desks-and-monitor-screens_007.svg', size: { w: 30, h: 22 }, index: 7 },
  'desks-and-monitor-screens_008': { file: 'individual/desks-and-monitor-screens/desks-and-monitor-screens_008.svg', size: { w: 31, h: 22 }, index: 8 },
  'desks-and-monitor-screens_009': { file: 'individual/desks-and-monitor-screens/desks-and-monitor-screens_009.svg', size: { w: 137, h: 24 }, index: 9 },
  'desks-and-monitor-screens_010': { file: 'individual/desks-and-monitor-screens/desks-and-monitor-screens_010.svg', size: { w: 30, h: 23 }, index: 10 },
  'desks-and-monitor-screens_011': { file: 'individual/desks-and-monitor-screens/desks-and-monitor-screens_011.svg', size: { w: 73, h: 28 }, index: 11 },
  'desks-and-monitor-screens_012': { file: 'individual/desks-and-monitor-screens/desks-and-monitor-screens_012.svg', size: { w: 51, h: 25 }, index: 12 },
  'desks-and-monitor-screens_013': { file: 'individual/desks-and-monitor-screens/desks-and-monitor-screens_013.svg', size: { w: 41, h: 26 }, index: 13 },
  'desks-and-monitor-screens_014': { file: 'individual/desks-and-monitor-screens/desks-and-monitor-screens_014.svg', size: { w: 52, h: 23 }, index: 14 },
  'desks-and-monitor-screens_015': { file: 'individual/desks-and-monitor-screens/desks-and-monitor-screens_015.svg', size: { w: 484, h: 402 }, index: 15 },
  'desks-and-monitor-screens_016': { file: 'individual/desks-and-monitor-screens/desks-and-monitor-screens_016.svg', size: { w: 486, h: 395 }, index: 16 },
  'desks-and-monitor-screens_017': { file: 'individual/desks-and-monitor-screens/desks-and-monitor-screens_017.svg', size: { w: 457, h: 373 }, index: 17 },
  'desks-and-monitor-screens_018': { file: 'individual/desks-and-monitor-screens/desks-and-monitor-screens_018.svg', size: { w: 59, h: 29 }, index: 18 },
  'desks-and-monitor-screens_019': { file: 'individual/desks-and-monitor-screens/desks-and-monitor-screens_019.svg', size: { w: 143, h: 30 }, index: 19 },
  'desks-and-monitor-screens_020': { file: 'individual/desks-and-monitor-screens/desks-and-monitor-screens_020.svg', size: { w: 50, h: 23 }, index: 20 },
  'desks-and-monitor-screens_021': { file: 'individual/desks-and-monitor-screens/desks-and-monitor-screens_021.svg', size: { w: 132, h: 25 }, index: 21 },
  'desks-and-monitor-screens_022': { file: 'individual/desks-and-monitor-screens/desks-and-monitor-screens_022.svg', size: { w: 132, h: 24 }, index: 22 },
  'desks-and-monitor-screens_023': { file: 'individual/desks-and-monitor-screens/desks-and-monitor-screens_023.svg', size: { w: 30, h: 25 }, index: 23 },
  'desks-and-monitor-screens_024': { file: 'individual/desks-and-monitor-screens/desks-and-monitor-screens_024.svg', size: { w: 31, h: 25 }, index: 24 },
  'desks-and-monitor-screens_025': { file: 'individual/desks-and-monitor-screens/desks-and-monitor-screens_025.svg', size: { w: 32, h: 22 }, index: 25 },
  'desks-and-monitor-screens_026': { file: 'individual/desks-and-monitor-screens/desks-and-monitor-screens_026.svg', size: { w: 52, h: 25 }, index: 26 },
  'desks-and-monitor-screens_027': { file: 'individual/desks-and-monitor-screens/desks-and-monitor-screens_027.svg', size: { w: 31, h: 22 }, index: 27 },
  'desks-and-monitor-screens_028': { file: 'individual/desks-and-monitor-screens/desks-and-monitor-screens_028.svg', size: { w: 138, h: 24 }, index: 28 },
  'desks-and-monitor-screens_029': { file: 'individual/desks-and-monitor-screens/desks-and-monitor-screens_029.svg', size: { w: 208, h: 21 }, index: 29 },
  'desks-and-monitor-screens_030': { file: 'individual/desks-and-monitor-screens/desks-and-monitor-screens_030.svg', size: { w: 481, h: 394 }, index: 30 },
  'desks-and-monitor-screens_031': { file: 'individual/desks-and-monitor-screens/desks-and-monitor-screens_031.svg', size: { w: 475, h: 390 }, index: 31 },
  'desks-and-monitor-screens_032': { file: 'individual/desks-and-monitor-screens/desks-and-monitor-screens_032.svg', size: { w: 487, h: 388 }, index: 32 },
};

/** Effects and particles */
export const SPRITES_EFFECTS_AND_PARTICLES: Record<string, SpriteEntry> = {
  'effects-and-particles_000': { file: 'individual/effects-and-particles/effects-and-particles_000.svg', size: { w: 163, h: 25 }, index: 0 },
  'effects-and-particles_001': { file: 'individual/effects-and-particles/effects-and-particles_001.svg', size: { w: 115, h: 22 }, index: 1 },
  'effects-and-particles_002': { file: 'individual/effects-and-particles/effects-and-particles_002.svg', size: { w: 162, h: 25 }, index: 2 },
  'effects-and-particles_003': { file: 'individual/effects-and-particles/effects-and-particles_003.svg', size: { w: 122, h: 22 }, index: 3 },
  'effects-and-particles_004': { file: 'individual/effects-and-particles/effects-and-particles_004.svg', size: { w: 162, h: 23 }, index: 4 },
  'effects-and-particles_005': { file: 'individual/effects-and-particles/effects-and-particles_005.svg', size: { w: 122, h: 21 }, index: 5 },
  'effects-and-particles_006': { file: 'individual/effects-and-particles/effects-and-particles_006.svg', size: { w: 35, h: 33 }, index: 6 },
  'effects-and-particles_007': { file: 'individual/effects-and-particles/effects-and-particles_007.svg', size: { w: 33, h: 32 }, index: 7 },
  'effects-and-particles_008': { file: 'individual/effects-and-particles/effects-and-particles_008.svg', size: { w: 33, h: 106 }, index: 8 },
  'effects-and-particles_009': { file: 'individual/effects-and-particles/effects-and-particles_009.svg', size: { w: 144, h: 26 }, index: 9 },
  'effects-and-particles_010': { file: 'individual/effects-and-particles/effects-and-particles_010.svg', size: { w: 152, h: 23 }, index: 10 },
  'effects-and-particles_011': { file: 'individual/effects-and-particles/effects-and-particles_011.svg', size: { w: 115, h: 22 }, index: 11 },
  'effects-and-particles_012': { file: 'individual/effects-and-particles/effects-and-particles_012.svg', size: { w: 115, h: 22 }, index: 12 },
  'effects-and-particles_013': { file: 'individual/effects-and-particles/effects-and-particles_013.svg', size: { w: 115, h: 22 }, index: 13 },
  'effects-and-particles_014': { file: 'individual/effects-and-particles/effects-and-particles_014.svg', size: { w: 144, h: 25 }, index: 14 },
  'effects-and-particles_015': { file: 'individual/effects-and-particles/effects-and-particles_015.svg', size: { w: 476, h: 290 }, index: 15 },
  'effects-and-particles_016': { file: 'individual/effects-and-particles/effects-and-particles_016.svg', size: { w: 205, h: 93 }, index: 16 },
  'effects-and-particles_017': { file: 'individual/effects-and-particles/effects-and-particles_017.svg', size: { w: 297, h: 49 }, index: 17 },
  'effects-and-particles_018': { file: 'individual/effects-and-particles/effects-and-particles_018.svg', size: { w: 205, h: 77 }, index: 18 },
  'effects-and-particles_019': { file: 'individual/effects-and-particles/effects-and-particles_019.svg', size: { w: 297, h: 59 }, index: 19 },
  'effects-and-particles_020': { file: 'individual/effects-and-particles/effects-and-particles_020.svg', size: { w: 122, h: 23 }, index: 20 },
  'effects-and-particles_021': { file: 'individual/effects-and-particles/effects-and-particles_021.svg', size: { w: 123, h: 23 }, index: 21 },
  'effects-and-particles_022': { file: 'individual/effects-and-particles/effects-and-particles_022.svg', size: { w: 47, h: 25 }, index: 22 },
  'effects-and-particles_023': { file: 'individual/effects-and-particles/effects-and-particles_023.svg', size: { w: 38, h: 22 }, index: 23 },
  'effects-and-particles_024': { file: 'individual/effects-and-particles/effects-and-particles_024.svg', size: { w: 28, h: 22 }, index: 24 },
  'effects-and-particles_025': { file: 'individual/effects-and-particles/effects-and-particles_025.svg', size: { w: 105, h: 25 }, index: 25 },
  'effects-and-particles_026': { file: 'individual/effects-and-particles/effects-and-particles_026.svg', size: { w: 29, h: 25 }, index: 26 },
  'effects-and-particles_027': { file: 'individual/effects-and-particles/effects-and-particles_027.svg', size: { w: 122, h: 22 }, index: 27 },
  'effects-and-particles_028': { file: 'individual/effects-and-particles/effects-and-particles_028.svg', size: { w: 163, h: 26 }, index: 28 },
  'effects-and-particles_029': { file: 'individual/effects-and-particles/effects-and-particles_029.svg', size: { w: 192, h: 23 }, index: 29 },
  'effects-and-particles_030': { file: 'individual/effects-and-particles/effects-and-particles_030.svg', size: { w: 480, h: 268 }, index: 30 },
  'effects-and-particles_031': { file: 'individual/effects-and-particles/effects-and-particles_031.svg', size: { w: 480, h: 265 }, index: 31 },
  'effects-and-particles_032': { file: 'individual/effects-and-particles/effects-and-particles_032.svg', size: { w: 327, h: 145 }, index: 32 },
};

/** Jordan Lee only */
export const SPRITES_JORDAN_LEE_ONLY: Record<string, SpriteEntry> = {
  'jordan-lee-only_base': { file: 'individual/jordan-lee-only/jordan-lee-only_base.svg', size: { w: 80, h: 149 }, index: 0 },
  'jordan-lee-only_emotion-neutral': { file: 'individual/jordan-lee-only/jordan-lee-only_emotion-neutral.svg', size: { w: 90, h: 96 }, index: 1 },
  'jordan-lee-only_emotion-happy': { file: 'individual/jordan-lee-only/jordan-lee-only_emotion-happy.svg', size: { w: 90, h: 97 }, index: 2 },
  'jordan-lee-only_emotion-talking': { file: 'individual/jordan-lee-only/jordan-lee-only_emotion-talking.svg', size: { w: 89, h: 95 }, index: 3 },
  'jordan-lee-only_emotion-thinking': { file: 'individual/jordan-lee-only/jordan-lee-only_emotion-thinking.svg', size: { w: 91, h: 97 }, index: 4 },
  'jordan-lee-only_emotion-stressed': { file: 'individual/jordan-lee-only/jordan-lee-only_emotion-stressed.svg', size: { w: 91, h: 97 }, index: 5 },
  'jordan-lee-only_emotion-excited': { file: 'individual/jordan-lee-only/jordan-lee-only_emotion-excited.svg', size: { w: 91, h: 95 }, index: 6 },
  'jordan-lee-only_emotion-concerned': { file: 'individual/jordan-lee-only/jordan-lee-only_emotion-concerned.svg', size: { w: 91, h: 95 }, index: 7 },
  'jordan-lee-only_emotion-frustrated': { file: 'individual/jordan-lee-only/jordan-lee-only_emotion-frustrated.svg', size: { w: 89, h: 95 }, index: 8 },
  'jordan-lee-only_emotion-satisfied': { file: 'individual/jordan-lee-only/jordan-lee-only_emotion-satisfied.svg', size: { w: 89, h: 95 }, index: 9 },
  'jordan-lee-only_emotion-curious': { file: 'individual/jordan-lee-only/jordan-lee-only_emotion-curious.svg', size: { w: 116, h: 96 }, index: 10 },
  'jordan-lee-only_emotion-celebrating': { file: 'individual/jordan-lee-only/jordan-lee-only_emotion-celebrating.svg', size: { w: 177, h: 93 }, index: 11 },
  'jordan-lee-only_emotion-sleeping': { file: 'individual/jordan-lee-only/jordan-lee-only_emotion-sleeping.svg', size: { w: 132, h: 95 }, index: 12 },
  'jordan-lee-only_emotion-panicking': { file: 'individual/jordan-lee-only/jordan-lee-only_emotion-panicking.svg', size: { w: 130, h: 93 }, index: 13 },
  'jordan-lee-only_emotion-rushing': { file: 'individual/jordan-lee-only/jordan-lee-only_emotion-rushing.svg', size: { w: 137, h: 93 }, index: 14 },
  'jordan-lee-only_idle-1': { file: 'individual/jordan-lee-only/jordan-lee-only_idle-1.svg', size: { w: 59, h: 119 }, index: 15 },
  'jordan-lee-only_idle-2': { file: 'individual/jordan-lee-only/jordan-lee-only_idle-2.svg', size: { w: 59, h: 120 }, index: 16 },
  'jordan-lee-only_idle-3': { file: 'individual/jordan-lee-only/jordan-lee-only_idle-3.svg', size: { w: 60, h: 120 }, index: 17 },
  'jordan-lee-only_idle-4': { file: 'individual/jordan-lee-only/jordan-lee-only_idle-4.svg', size: { w: 58, h: 120 }, index: 18 },
  'jordan-lee-only_typing-1': { file: 'individual/jordan-lee-only/jordan-lee-only_typing-1.svg', size: { w: 71, h: 120 }, index: 19 },
  'jordan-lee-only_typing-2': { file: 'individual/jordan-lee-only/jordan-lee-only_typing-2.svg', size: { w: 70, h: 120 }, index: 20 },
  'jordan-lee-only_walk-1': { file: 'individual/jordan-lee-only/jordan-lee-only_walk-1.svg', size: { w: 71, h: 119 }, index: 21 },
  'jordan-lee-only_walk-2': { file: 'individual/jordan-lee-only/jordan-lee-only_walk-2.svg', size: { w: 58, h: 120 }, index: 22 },
  'jordan-lee-only_walk-3': { file: 'individual/jordan-lee-only/jordan-lee-only_walk-3.svg', size: { w: 60, h: 119 }, index: 23 },
  'jordan-lee-only_walk-4': { file: 'individual/jordan-lee-only/jordan-lee-only_walk-4.svg', size: { w: 57, h: 120 }, index: 24 },
  'jordan-lee-only_panic-run-1': { file: 'individual/jordan-lee-only/jordan-lee-only_panic-run-1.svg', size: { w: 136, h: 109 }, index: 25 },
  'jordan-lee-only_panic-run-2': { file: 'individual/jordan-lee-only/jordan-lee-only_panic-run-2.svg', size: { w: 139, h: 109 }, index: 26 },
  'jordan-lee-only_panic-run-3': { file: 'individual/jordan-lee-only/jordan-lee-only_panic-run-3.svg', size: { w: 139, h: 109 }, index: 27 },
  'jordan-lee-only_panic-run-4': { file: 'individual/jordan-lee-only/jordan-lee-only_panic-run-4.svg', size: { w: 142, h: 109 }, index: 28 },
  'jordan-lee-only_sitting': { file: 'individual/jordan-lee-only/jordan-lee-only_sitting.svg', size: { w: 85, h: 110 }, index: 29 },
  'jordan-lee-only_standup-1': { file: 'individual/jordan-lee-only/jordan-lee-only_standup-1.svg', size: { w: 75, h: 105 }, index: 30 },
  'jordan-lee-only_standup-2': { file: 'individual/jordan-lee-only/jordan-lee-only_standup-2.svg', size: { w: 84, h: 110 }, index: 31 },
  'jordan-lee-only_standup-3': { file: 'individual/jordan-lee-only/jordan-lee-only_standup-3.svg', size: { w: 57, h: 110 }, index: 32 },
  'jordan-lee-only_celebrate-1': { file: 'individual/jordan-lee-only/jordan-lee-only_celebrate-1.svg', size: { w: 100, h: 114 }, index: 33 },
  'jordan-lee-only_celebrate-2': { file: 'individual/jordan-lee-only/jordan-lee-only_celebrate-2.svg', size: { w: 122, h: 114 }, index: 34 },
  'jordan-lee-only_celebrate-3': { file: 'individual/jordan-lee-only/jordan-lee-only_celebrate-3.svg', size: { w: 108, h: 114 }, index: 35 },
  'jordan-lee-only_celebrate-4': { file: 'individual/jordan-lee-only/jordan-lee-only_celebrate-4.svg', size: { w: 86, h: 121 }, index: 36 },
  'jordan-lee-only_talk-1': { file: 'individual/jordan-lee-only/jordan-lee-only_talk-1.svg', size: { w: 65, h: 112 }, index: 37 },
  'jordan-lee-only_talk-2': { file: 'individual/jordan-lee-only/jordan-lee-only_talk-2.svg', size: { w: 58, h: 112 }, index: 38 },
  'jordan-lee-only_wave': { file: 'individual/jordan-lee-only/jordan-lee-only_wave.svg', size: { w: 75, h: 114 }, index: 39 },
  'jordan-lee-only_walk-home': { file: 'individual/jordan-lee-only/jordan-lee-only_walk-home.svg', size: { w: 61, h: 112 }, index: 40 },
  'jordan-lee-only_elevator': { file: 'individual/jordan-lee-only/jordan-lee-only_elevator.svg', size: { w: 126, h: 115 }, index: 41 },
  'jordan-lee-only_levelup-1': { file: 'individual/jordan-lee-only/jordan-lee-only_levelup-1.svg', size: { w: 54, h: 133 }, index: 42 },
  'jordan-lee-only_levelup-2': { file: 'individual/jordan-lee-only/jordan-lee-only_levelup-2.svg', size: { w: 92, h: 133 }, index: 43 },
  'jordan-lee-only_levelup-3': { file: 'individual/jordan-lee-only/jordan-lee-only_levelup-3.svg', size: { w: 102, h: 135 }, index: 44 },
  'jordan-lee-only_levelup-4': { file: 'individual/jordan-lee-only/jordan-lee-only_levelup-4.svg', size: { w: 92, h: 129 }, index: 45 },
  'jordan-lee-only_levelup-5': { file: 'individual/jordan-lee-only/jordan-lee-only_levelup-5.svg', size: { w: 55, h: 131 }, index: 46 },
  'jordan-lee-only_coffee-walk-1': { file: 'individual/jordan-lee-only/jordan-lee-only_coffee-walk-1.svg', size: { w: 83, h: 115 }, index: 47 },
  'jordan-lee-only_coffee-walk-2': { file: 'individual/jordan-lee-only/jordan-lee-only_coffee-walk-2.svg', size: { w: 84, h: 115 }, index: 48 },
  'jordan-lee-only_late-mild': { file: 'individual/jordan-lee-only/jordan-lee-only_late-mild.svg', size: { w: 106, h: 116 }, index: 49 },
  'jordan-lee-only_late-panic': { file: 'individual/jordan-lee-only/jordan-lee-only_late-panic.svg', size: { w: 171, h: 118 }, index: 50 },
  'jordan-lee-only_desk-1': { file: 'individual/jordan-lee-only/jordan-lee-only_desk-1.svg', size: { w: 177, h: 76 }, index: 51 },
  'jordan-lee-only_desk-2': { file: 'individual/jordan-lee-only/jordan-lee-only_desk-2.svg', size: { w: 67, h: 78 }, index: 52 },
  'jordan-lee-only_desk-3': { file: 'individual/jordan-lee-only/jordan-lee-only_desk-3.svg', size: { w: 168, h: 77 }, index: 53 },
  'jordan-lee-only_desk-4': { file: 'individual/jordan-lee-only/jordan-lee-only_desk-4.svg', size: { w: 64, h: 75 }, index: 54 },
  'jordan-lee-only_desk-5': { file: 'individual/jordan-lee-only/jordan-lee-only_desk-5.svg', size: { w: 57, h: 76 }, index: 55 },
  'jordan-lee-only_desk-6': { file: 'individual/jordan-lee-only/jordan-lee-only_desk-6.svg', size: { w: 131, h: 78 }, index: 56 },
};

/** Kai, Yuna, Ravi, Elena (batch) */
export const SPRITES_KAI_YUNA_RAVI_ELENA_BATCH: Record<string, SpriteEntry> = {
  'kai-yuna-ravi-elena-batch_000': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_000.svg', size: { w: 52, h: 78 }, index: 0 },
  'kai-yuna-ravi-elena-batch_001': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_001.svg', size: { w: 53, h: 77 }, index: 1 },
  'kai-yuna-ravi-elena-batch_002': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_002.svg', size: { w: 52, h: 77 }, index: 2 },
  'kai-yuna-ravi-elena-batch_003': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_003.svg', size: { w: 53, h: 77 }, index: 3 },
  'kai-yuna-ravi-elena-batch_004': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_004.svg', size: { w: 52, h: 77 }, index: 4 },
  'kai-yuna-ravi-elena-batch_005': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_005.svg', size: { w: 52, h: 77 }, index: 5 },
  'kai-yuna-ravi-elena-batch_006': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_006.svg', size: { w: 52, h: 77 }, index: 6 },
  'kai-yuna-ravi-elena-batch_007': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_007.svg', size: { w: 52, h: 77 }, index: 7 },
  'kai-yuna-ravi-elena-batch_008': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_008.svg', size: { w: 50, h: 75 }, index: 8 },
  'kai-yuna-ravi-elena-batch_009': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_009.svg', size: { w: 115, h: 57 }, index: 9 },
  'kai-yuna-ravi-elena-batch_010': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_010.svg', size: { w: 87, h: 57 }, index: 10 },
  'kai-yuna-ravi-elena-batch_011': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_011.svg', size: { w: 121, h: 57 }, index: 11 },
  'kai-yuna-ravi-elena-batch_012': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_012.svg', size: { w: 88, h: 57 }, index: 12 },
  'kai-yuna-ravi-elena-batch_013': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_013.svg', size: { w: 69, h: 56 }, index: 13 },
  'kai-yuna-ravi-elena-batch_014': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_014.svg', size: { w: 48, h: 72 }, index: 14 },
  'kai-yuna-ravi-elena-batch_015': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_015.svg', size: { w: 48, h: 72 }, index: 15 },
  'kai-yuna-ravi-elena-batch_016': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_016.svg', size: { w: 47, h: 72 }, index: 16 },
  'kai-yuna-ravi-elena-batch_017': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_017.svg', size: { w: 47, h: 72 }, index: 17 },
  'kai-yuna-ravi-elena-batch_018': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_018.svg', size: { w: 55, h: 71 }, index: 18 },
  'kai-yuna-ravi-elena-batch_019': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_019.svg', size: { w: 48, h: 71 }, index: 19 },
  'kai-yuna-ravi-elena-batch_020': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_020.svg', size: { w: 44, h: 71 }, index: 20 },
  'kai-yuna-ravi-elena-batch_021': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_021.svg', size: { w: 57, h: 71 }, index: 21 },
  'kai-yuna-ravi-elena-batch_022': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_022.svg', size: { w: 49, h: 70 }, index: 22 },
  'kai-yuna-ravi-elena-batch_023': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_023.svg', size: { w: 45, h: 70 }, index: 23 },
  'kai-yuna-ravi-elena-batch_024': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_024.svg', size: { w: 85, h: 60 }, index: 24 },
  'kai-yuna-ravi-elena-batch_025': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_025.svg', size: { w: 79, h: 60 }, index: 25 },
  'kai-yuna-ravi-elena-batch_026': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_026.svg', size: { w: 52, h: 62 }, index: 26 },
  'kai-yuna-ravi-elena-batch_027': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_027.svg', size: { w: 42, h: 63 }, index: 27 },
  'kai-yuna-ravi-elena-batch_028': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_028.svg', size: { w: 84, h: 59 }, index: 28 },
  'kai-yuna-ravi-elena-batch_029': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_029.svg', size: { w: 86, h: 59 }, index: 29 },
  'kai-yuna-ravi-elena-batch_030': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_030.svg', size: { w: 55, h: 62 }, index: 30 },
  'kai-yuna-ravi-elena-batch_031': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_031.svg', size: { w: 50, h: 62 }, index: 31 },
  'kai-yuna-ravi-elena-batch_032': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_032.svg', size: { w: 42, h: 62 }, index: 32 },
  'kai-yuna-ravi-elena-batch_033': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_033.svg', size: { w: 129, h: 151 }, index: 33 },
  'kai-yuna-ravi-elena-batch_034': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_034.svg', size: { w: 117, h: 150 }, index: 34 },
  'kai-yuna-ravi-elena-batch_035': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_035.svg', size: { w: 123, h: 150 }, index: 35 },
  'kai-yuna-ravi-elena-batch_036': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_036.svg', size: { w: 131, h: 146 }, index: 36 },
  'kai-yuna-ravi-elena-batch_037': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_037.svg', size: { w: 125, h: 151 }, index: 37 },
  'kai-yuna-ravi-elena-batch_038': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_038.svg', size: { w: 122, h: 150 }, index: 38 },
  'kai-yuna-ravi-elena-batch_039': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_039.svg', size: { w: 116, h: 150 }, index: 39 },
  'kai-yuna-ravi-elena-batch_040': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_040.svg', size: { w: 111, h: 148 }, index: 40 },
  'kai-yuna-ravi-elena-batch_041': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_041.svg', size: { w: 132, h: 151 }, index: 41 },
  'kai-yuna-ravi-elena-batch_042': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_042.svg', size: { w: 86, h: 17 }, index: 42 },
  'kai-yuna-ravi-elena-batch_043': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_043.svg', size: { w: 114, h: 16 }, index: 43 },
  'kai-yuna-ravi-elena-batch_044': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_044.svg', size: { w: 109, h: 17 }, index: 44 },
  'kai-yuna-ravi-elena-batch_045': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_045.svg', size: { w: 124, h: 17 }, index: 45 },
  'kai-yuna-ravi-elena-batch_046': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_046.svg', size: { w: 123, h: 16 }, index: 46 },
  'kai-yuna-ravi-elena-batch_047': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_047.svg', size: { w: 121, h: 17 }, index: 47 },
  'kai-yuna-ravi-elena-batch_048': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_048.svg', size: { w: 116, h: 17 }, index: 48 },
  'kai-yuna-ravi-elena-batch_049': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_049.svg', size: { w: 121, h: 15 }, index: 49 },
  'kai-yuna-ravi-elena-batch_050': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_050.svg', size: { w: 117, h: 15 }, index: 50 },
  'kai-yuna-ravi-elena-batch_051': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_051.svg', size: { w: 117, h: 15 }, index: 51 },
  'kai-yuna-ravi-elena-batch_052': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_052.svg', size: { w: 128, h: 16 }, index: 52 },
  'kai-yuna-ravi-elena-batch_053': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_053.svg', size: { w: 45, h: 62 }, index: 53 },
  'kai-yuna-ravi-elena-batch_054': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_054.svg', size: { w: 45, h: 62 }, index: 54 },
  'kai-yuna-ravi-elena-batch_055': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_055.svg', size: { w: 46, h: 62 }, index: 55 },
  'kai-yuna-ravi-elena-batch_056': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_056.svg', size: { w: 45, h: 61 }, index: 56 },
  'kai-yuna-ravi-elena-batch_057': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_057.svg', size: { w: 45, h: 62 }, index: 57 },
  'kai-yuna-ravi-elena-batch_058': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_058.svg', size: { w: 46, h: 62 }, index: 58 },
  'kai-yuna-ravi-elena-batch_059': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_059.svg', size: { w: 46, h: 62 }, index: 59 },
  'kai-yuna-ravi-elena-batch_060': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_060.svg', size: { w: 46, h: 62 }, index: 60 },
  'kai-yuna-ravi-elena-batch_061': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_061.svg', size: { w: 47, h: 62 }, index: 61 },
  'kai-yuna-ravi-elena-batch_062': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_062.svg', size: { w: 47, h: 62 }, index: 62 },
  'kai-yuna-ravi-elena-batch_063': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_063.svg', size: { w: 51, h: 62 }, index: 63 },
  'kai-yuna-ravi-elena-batch_064': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_064.svg', size: { w: 46, h: 64 }, index: 64 },
  'kai-yuna-ravi-elena-batch_065': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_065.svg', size: { w: 47, h: 64 }, index: 65 },
  'kai-yuna-ravi-elena-batch_066': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_066.svg', size: { w: 47, h: 64 }, index: 66 },
  'kai-yuna-ravi-elena-batch_067': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_067.svg', size: { w: 46, h: 65 }, index: 67 },
  'kai-yuna-ravi-elena-batch_068': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_068.svg', size: { w: 46, h: 63 }, index: 68 },
  'kai-yuna-ravi-elena-batch_069': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_069.svg', size: { w: 47, h: 63 }, index: 69 },
  'kai-yuna-ravi-elena-batch_070': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_070.svg', size: { w: 50, h: 63 }, index: 70 },
  'kai-yuna-ravi-elena-batch_071': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_071.svg', size: { w: 48, h: 63 }, index: 71 },
  'kai-yuna-ravi-elena-batch_072': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_072.svg', size: { w: 47, h: 64 }, index: 72 },
  'kai-yuna-ravi-elena-batch_073': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_073.svg', size: { w: 23, h: 15 }, index: 73 },
  'kai-yuna-ravi-elena-batch_074': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_074.svg', size: { w: 122, h: 145 }, index: 74 },
  'kai-yuna-ravi-elena-batch_075': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_075.svg', size: { w: 36, h: 80 }, index: 75 },
  'kai-yuna-ravi-elena-batch_076': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_076.svg', size: { w: 127, h: 145 }, index: 76 },
  'kai-yuna-ravi-elena-batch_077': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_077.svg', size: { w: 174, h: 147 }, index: 77 },
  'kai-yuna-ravi-elena-batch_078': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_078.svg', size: { w: 102, h: 146 }, index: 78 },
  'kai-yuna-ravi-elena-batch_079': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_079.svg', size: { w: 22, h: 81 }, index: 79 },
  'kai-yuna-ravi-elena-batch_080': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_080.svg', size: { w: 153, h: 146 }, index: 80 },
  'kai-yuna-ravi-elena-batch_081': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_081.svg', size: { w: 22, h: 15 }, index: 81 },
  'kai-yuna-ravi-elena-batch_082': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_082.svg', size: { w: 101, h: 143 }, index: 82 },
  'kai-yuna-ravi-elena-batch_083': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_083.svg', size: { w: 129, h: 143 }, index: 83 },
  'kai-yuna-ravi-elena-batch_084': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_084.svg', size: { w: 123, h: 143 }, index: 84 },
  'kai-yuna-ravi-elena-batch_085': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_085.svg', size: { w: 147, h: 144 }, index: 85 },
  'kai-yuna-ravi-elena-batch_086': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_086.svg', size: { w: 151, h: 143 }, index: 86 },
  'kai-yuna-ravi-elena-batch_087': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_087.svg', size: { w: 57, h: 67 }, index: 87 },
  'kai-yuna-ravi-elena-batch_088': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_088.svg', size: { w: 56, h: 67 }, index: 88 },
  'kai-yuna-ravi-elena-batch_089': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_089.svg', size: { w: 55, h: 67 }, index: 89 },
  'kai-yuna-ravi-elena-batch_090': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_090.svg', size: { w: 55, h: 67 }, index: 90 },
  'kai-yuna-ravi-elena-batch_091': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_091.svg', size: { w: 54, h: 67 }, index: 91 },
  'kai-yuna-ravi-elena-batch_092': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_092.svg', size: { w: 56, h: 67 }, index: 92 },
  'kai-yuna-ravi-elena-batch_093': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_093.svg', size: { w: 55, h: 67 }, index: 93 },
  'kai-yuna-ravi-elena-batch_094': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_094.svg', size: { w: 56, h: 67 }, index: 94 },
  'kai-yuna-ravi-elena-batch_095': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_095.svg', size: { w: 53, h: 67 }, index: 95 },
  'kai-yuna-ravi-elena-batch_096': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_096.svg', size: { w: 53, h: 65 }, index: 96 },
  'kai-yuna-ravi-elena-batch_097': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_097.svg', size: { w: 54, h: 65 }, index: 97 },
  'kai-yuna-ravi-elena-batch_098': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_098.svg', size: { w: 57, h: 68 }, index: 98 },
  'kai-yuna-ravi-elena-batch_099': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_099.svg', size: { w: 57, h: 68 }, index: 99 },
  'kai-yuna-ravi-elena-batch_100': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_100.svg', size: { w: 56, h: 70 }, index: 100 },
  'kai-yuna-ravi-elena-batch_101': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_101.svg', size: { w: 61, h: 67 }, index: 101 },
  'kai-yuna-ravi-elena-batch_102': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_102.svg', size: { w: 57, h: 67 }, index: 102 },
  'kai-yuna-ravi-elena-batch_103': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_103.svg', size: { w: 58, h: 67 }, index: 103 },
  'kai-yuna-ravi-elena-batch_104': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_104.svg', size: { w: 55, h: 66 }, index: 104 },
  'kai-yuna-ravi-elena-batch_105': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_105.svg', size: { w: 53, h: 67 }, index: 105 },
  'kai-yuna-ravi-elena-batch_106': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_106.svg', size: { w: 56, h: 68 }, index: 106 },
  'kai-yuna-ravi-elena-batch_107': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_107.svg', size: { w: 55, h: 66 }, index: 107 },
  'kai-yuna-ravi-elena-batch_108': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_108.svg', size: { w: 56, h: 70 }, index: 108 },
  'kai-yuna-ravi-elena-batch_109': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_109.svg', size: { w: 58, h: 69 }, index: 109 },
  'kai-yuna-ravi-elena-batch_110': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_110.svg', size: { w: 55, h: 69 }, index: 110 },
  'kai-yuna-ravi-elena-batch_111': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_111.svg', size: { w: 55, h: 67 }, index: 111 },
  'kai-yuna-ravi-elena-batch_112': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_112.svg', size: { w: 56, h: 68 }, index: 112 },
  'kai-yuna-ravi-elena-batch_113': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_113.svg', size: { w: 103, h: 68 }, index: 113 },
  'kai-yuna-ravi-elena-batch_114': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_114.svg', size: { w: 55, h: 68 }, index: 114 },
  'kai-yuna-ravi-elena-batch_115': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_115.svg', size: { w: 56, h: 67 }, index: 115 },
  'kai-yuna-ravi-elena-batch_116': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_116.svg', size: { w: 102, h: 73 }, index: 116 },
  'kai-yuna-ravi-elena-batch_117': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_117.svg', size: { w: 76, h: 64 }, index: 117 },
  'kai-yuna-ravi-elena-batch_118': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_118.svg', size: { w: 130, h: 77 }, index: 118 },
  'kai-yuna-ravi-elena-batch_119': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_119.svg', size: { w: 101, h: 13 }, index: 119 },
  'kai-yuna-ravi-elena-batch_120': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_120.svg', size: { w: 129, h: 13 }, index: 120 },
  'kai-yuna-ravi-elena-batch_121': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_121.svg', size: { w: 123, h: 13 }, index: 121 },
  'kai-yuna-ravi-elena-batch_122': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_122.svg', size: { w: 137, h: 13 }, index: 122 },
  'kai-yuna-ravi-elena-batch_123': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_123.svg', size: { w: 137, h: 14 }, index: 123 },
  'kai-yuna-ravi-elena-batch_124': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_124.svg', size: { w: 129, h: 13 }, index: 124 },
  'kai-yuna-ravi-elena-batch_125': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_125.svg', size: { w: 116, h: 14 }, index: 125 },
  'kai-yuna-ravi-elena-batch_126': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_126.svg', size: { w: 131, h: 14 }, index: 126 },
  'kai-yuna-ravi-elena-batch_127': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_127.svg', size: { w: 137, h: 13 }, index: 127 },
  'kai-yuna-ravi-elena-batch_128': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_128.svg', size: { w: 151, h: 13 }, index: 128 },
  'kai-yuna-ravi-elena-batch_129': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_129.svg', size: { w: 55, h: 68 }, index: 129 },
  'kai-yuna-ravi-elena-batch_130': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_130.svg', size: { w: 56, h: 68 }, index: 130 },
  'kai-yuna-ravi-elena-batch_131': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_131.svg', size: { w: 55, h: 68 }, index: 131 },
  'kai-yuna-ravi-elena-batch_132': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_132.svg', size: { w: 55, h: 68 }, index: 132 },
  'kai-yuna-ravi-elena-batch_133': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_133.svg', size: { w: 55, h: 67 }, index: 133 },
  'kai-yuna-ravi-elena-batch_134': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_134.svg', size: { w: 56, h: 67 }, index: 134 },
  'kai-yuna-ravi-elena-batch_135': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_135.svg', size: { w: 54, h: 67 }, index: 135 },
  'kai-yuna-ravi-elena-batch_136': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_136.svg', size: { w: 54, h: 67 }, index: 136 },
  'kai-yuna-ravi-elena-batch_137': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_137.svg', size: { w: 54, h: 66 }, index: 137 },
  'kai-yuna-ravi-elena-batch_138': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_138.svg', size: { w: 55, h: 66 }, index: 138 },
  'kai-yuna-ravi-elena-batch_139': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_139.svg', size: { w: 97, h: 14 }, index: 139 },
  'kai-yuna-ravi-elena-batch_140': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_140.svg', size: { w: 124, h: 13 }, index: 140 },
  'kai-yuna-ravi-elena-batch_141': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_141.svg', size: { w: 138, h: 13 }, index: 141 },
  'kai-yuna-ravi-elena-batch_142': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_142.svg', size: { w: 133, h: 13 }, index: 142 },
  'kai-yuna-ravi-elena-batch_143': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_143.svg', size: { w: 144, h: 13 }, index: 143 },
  'kai-yuna-ravi-elena-batch_144': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_144.svg', size: { w: 89, h: 14 }, index: 144 },
  'kai-yuna-ravi-elena-batch_145': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_145.svg', size: { w: 102, h: 14 }, index: 145 },
  'kai-yuna-ravi-elena-batch_146': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_146.svg', size: { w: 107, h: 15 }, index: 146 },
  'kai-yuna-ravi-elena-batch_147': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_147.svg', size: { w: 113, h: 15 }, index: 147 },
  'kai-yuna-ravi-elena-batch_148': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_148.svg', size: { w: 106, h: 14 }, index: 148 },
  'kai-yuna-ravi-elena-batch_149': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_149.svg', size: { w: 57, h: 65 }, index: 149 },
  'kai-yuna-ravi-elena-batch_150': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_150.svg', size: { w: 56, h: 65 }, index: 150 },
  'kai-yuna-ravi-elena-batch_151': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_151.svg', size: { w: 55, h: 65 }, index: 151 },
  'kai-yuna-ravi-elena-batch_152': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_152.svg', size: { w: 55, h: 65 }, index: 152 },
  'kai-yuna-ravi-elena-batch_153': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_153.svg', size: { w: 54, h: 65 }, index: 153 },
  'kai-yuna-ravi-elena-batch_154': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_154.svg', size: { w: 53, h: 64 }, index: 154 },
  'kai-yuna-ravi-elena-batch_155': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_155.svg', size: { w: 53, h: 64 }, index: 155 },
  'kai-yuna-ravi-elena-batch_156': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_156.svg', size: { w: 54, h: 65 }, index: 156 },
  'kai-yuna-ravi-elena-batch_157': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_157.svg', size: { w: 56, h: 65 }, index: 157 },
  'kai-yuna-ravi-elena-batch_158': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_158.svg', size: { w: 55, h: 65 }, index: 158 },
  'kai-yuna-ravi-elena-batch_159': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_159.svg', size: { w: 56, h: 65 }, index: 159 },
  'kai-yuna-ravi-elena-batch_160': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_160.svg', size: { w: 127, h: 76 }, index: 160 },
  'kai-yuna-ravi-elena-batch_161': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_161.svg', size: { w: 105, h: 75 }, index: 161 },
  'kai-yuna-ravi-elena-batch_162': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_162.svg', size: { w: 128, h: 75 }, index: 162 },
  'kai-yuna-ravi-elena-batch_163': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_163.svg', size: { w: 120, h: 76 }, index: 163 },
  'kai-yuna-ravi-elena-batch_164': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_164.svg', size: { w: 111, h: 76 }, index: 164 },
  'kai-yuna-ravi-elena-batch_165': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_165.svg', size: { w: 86, h: 76 }, index: 165 },
  'kai-yuna-ravi-elena-batch_166': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_166.svg', size: { w: 126, h: 76 }, index: 166 },
  'kai-yuna-ravi-elena-batch_167': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_167.svg', size: { w: 111, h: 76 }, index: 167 },
  'kai-yuna-ravi-elena-batch_168': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_168.svg', size: { w: 128, h: 76 }, index: 168 },
  'kai-yuna-ravi-elena-batch_169': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_169.svg', size: { w: 118, h: 76 }, index: 169 },
  'kai-yuna-ravi-elena-batch_170': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_170.svg', size: { w: 126, h: 13 }, index: 170 },
  'kai-yuna-ravi-elena-batch_171': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_171.svg', size: { w: 112, h: 14 }, index: 171 },
  'kai-yuna-ravi-elena-batch_172': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_172.svg', size: { w: 112, h: 13 }, index: 172 },
  'kai-yuna-ravi-elena-batch_173': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_173.svg', size: { w: 115, h: 13 }, index: 173 },
  'kai-yuna-ravi-elena-batch_174': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_174.svg', size: { w: 116, h: 13 }, index: 174 },
  'kai-yuna-ravi-elena-batch_175': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_175.svg', size: { w: 115, h: 14 }, index: 175 },
  'kai-yuna-ravi-elena-batch_176': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_176.svg', size: { w: 102, h: 14 }, index: 176 },
  'kai-yuna-ravi-elena-batch_177': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_177.svg', size: { w: 82, h: 15 }, index: 177 },
  'kai-yuna-ravi-elena-batch_178': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_178.svg', size: { w: 120, h: 14 }, index: 178 },
  'kai-yuna-ravi-elena-batch_179': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_179.svg', size: { w: 108, h: 13 }, index: 179 },
  'kai-yuna-ravi-elena-batch_180': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_180.svg', size: { w: 58, h: 67 }, index: 180 },
  'kai-yuna-ravi-elena-batch_181': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_181.svg', size: { w: 56, h: 67 }, index: 181 },
  'kai-yuna-ravi-elena-batch_182': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_182.svg', size: { w: 55, h: 67 }, index: 182 },
  'kai-yuna-ravi-elena-batch_183': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_183.svg', size: { w: 55, h: 67 }, index: 183 },
  'kai-yuna-ravi-elena-batch_184': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_184.svg', size: { w: 55, h: 66 }, index: 184 },
  'kai-yuna-ravi-elena-batch_185': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_185.svg', size: { w: 56, h: 66 }, index: 185 },
  'kai-yuna-ravi-elena-batch_186': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_186.svg', size: { w: 55, h: 66 }, index: 186 },
  'kai-yuna-ravi-elena-batch_187': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_187.svg', size: { w: 56, h: 65 }, index: 187 },
  'kai-yuna-ravi-elena-batch_188': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_188.svg', size: { w: 102, h: 72 }, index: 188 },
  'kai-yuna-ravi-elena-batch_189': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_189.svg', size: { w: 76, h: 63 }, index: 189 },
  'kai-yuna-ravi-elena-batch_190': { file: 'individual/kai-yuna-ravi-elena-batch/kai-yuna-ravi-elena-batch_190.svg', size: { w: 35, h: 31 }, index: 190 },
};

/** Marcus Webb only */
export const SPRITES_MARCUS_WEBB_ONLY: Record<string, SpriteEntry> = {
  'marcus-webb-only_base': { file: 'individual/marcus-webb-only/marcus-webb-only_base.svg', size: { w: 71, h: 154 }, index: 0 },
  'marcus-webb-only_emotion-neutral': { file: 'individual/marcus-webb-only/marcus-webb-only_emotion-neutral.svg', size: { w: 89, h: 99 }, index: 1 },
  'marcus-webb-only_emotion-happy': { file: 'individual/marcus-webb-only/marcus-webb-only_emotion-happy.svg', size: { w: 88, h: 99 }, index: 2 },
  'marcus-webb-only_emotion-talking': { file: 'individual/marcus-webb-only/marcus-webb-only_emotion-talking.svg', size: { w: 86, h: 98 }, index: 3 },
  'marcus-webb-only_emotion-thinking': { file: 'individual/marcus-webb-only/marcus-webb-only_emotion-thinking.svg', size: { w: 85, h: 98 }, index: 4 },
  'marcus-webb-only_emotion-stressed': { file: 'individual/marcus-webb-only/marcus-webb-only_emotion-stressed.svg', size: { w: 87, h: 99 }, index: 5 },
  'marcus-webb-only_emotion-excited': { file: 'individual/marcus-webb-only/marcus-webb-only_emotion-excited.svg', size: { w: 89, h: 99 }, index: 6 },
  'marcus-webb-only_emotion-concerned': { file: 'individual/marcus-webb-only/marcus-webb-only_emotion-concerned.svg', size: { w: 88, h: 99 }, index: 7 },
  'marcus-webb-only_emotion-frustrated': { file: 'individual/marcus-webb-only/marcus-webb-only_emotion-frustrated.svg', size: { w: 86, h: 98 }, index: 8 },
  'marcus-webb-only_emotion-satisfied': { file: 'individual/marcus-webb-only/marcus-webb-only_emotion-satisfied.svg', size: { w: 87, h: 98 }, index: 9 },
  'marcus-webb-only_emotion-curious': { file: 'individual/marcus-webb-only/marcus-webb-only_emotion-curious.svg', size: { w: 85, h: 91 }, index: 10 },
  'marcus-webb-only_emotion-celebrating': { file: 'individual/marcus-webb-only/marcus-webb-only_emotion-celebrating.svg', size: { w: 176, h: 92 }, index: 11 },
  'marcus-webb-only_emotion-sleeping': { file: 'individual/marcus-webb-only/marcus-webb-only_emotion-sleeping.svg', size: { w: 112, h: 103 }, index: 12 },
  'marcus-webb-only_emotion-panicking': { file: 'individual/marcus-webb-only/marcus-webb-only_emotion-panicking.svg', size: { w: 118, h: 93 }, index: 13 },
  'marcus-webb-only_emotion-rushing': { file: 'individual/marcus-webb-only/marcus-webb-only_emotion-rushing.svg', size: { w: 132, h: 92 }, index: 14 },
  'marcus-webb-only_idle-1': { file: 'individual/marcus-webb-only/marcus-webb-only_idle-1.svg', size: { w: 57, h: 132 }, index: 15 },
  'marcus-webb-only_idle-2': { file: 'individual/marcus-webb-only/marcus-webb-only_idle-2.svg', size: { w: 58, h: 132 }, index: 16 },
  'marcus-webb-only_idle-3': { file: 'individual/marcus-webb-only/marcus-webb-only_idle-3.svg', size: { w: 57, h: 131 }, index: 17 },
  'marcus-webb-only_idle-4': { file: 'individual/marcus-webb-only/marcus-webb-only_idle-4.svg', size: { w: 59, h: 131 }, index: 18 },
  'marcus-webb-only_typing-1': { file: 'individual/marcus-webb-only/marcus-webb-only_typing-1.svg', size: { w: 75, h: 131 }, index: 19 },
  'marcus-webb-only_typing-2': { file: 'individual/marcus-webb-only/marcus-webb-only_typing-2.svg', size: { w: 68, h: 131 }, index: 20 },
  'marcus-webb-only_walk-1': { file: 'individual/marcus-webb-only/marcus-webb-only_walk-1.svg', size: { w: 84, h: 132 }, index: 21 },
  'marcus-webb-only_walk-2': { file: 'individual/marcus-webb-only/marcus-webb-only_walk-2.svg', size: { w: 80, h: 131 }, index: 22 },
  'marcus-webb-only_walk-3': { file: 'individual/marcus-webb-only/marcus-webb-only_walk-3.svg', size: { w: 71, h: 132 }, index: 23 },
  'marcus-webb-only_walk-4': { file: 'individual/marcus-webb-only/marcus-webb-only_walk-4.svg', size: { w: 61, h: 131 }, index: 24 },
  'marcus-webb-only_panic-run-1': { file: 'individual/marcus-webb-only/marcus-webb-only_panic-run-1.svg', size: { w: 142, h: 114 }, index: 25 },
  'marcus-webb-only_panic-run-2': { file: 'individual/marcus-webb-only/marcus-webb-only_panic-run-2.svg', size: { w: 136, h: 113 }, index: 26 },
  'marcus-webb-only_panic-run-3': { file: 'individual/marcus-webb-only/marcus-webb-only_panic-run-3.svg', size: { w: 144, h: 112 }, index: 27 },
  'marcus-webb-only_panic-run-4': { file: 'individual/marcus-webb-only/marcus-webb-only_panic-run-4.svg', size: { w: 151, h: 113 }, index: 28 },
  'marcus-webb-only_sitting': { file: 'individual/marcus-webb-only/marcus-webb-only_sitting.svg', size: { w: 86, h: 117 }, index: 29 },
  'marcus-webb-only_standup-1': { file: 'individual/marcus-webb-only/marcus-webb-only_standup-1.svg', size: { w: 72, h: 103 }, index: 30 },
  'marcus-webb-only_standup-2': { file: 'individual/marcus-webb-only/marcus-webb-only_standup-2.svg', size: { w: 85, h: 112 }, index: 31 },
  'marcus-webb-only_standup-3': { file: 'individual/marcus-webb-only/marcus-webb-only_standup-3.svg', size: { w: 51, h: 115 }, index: 32 },
  'marcus-webb-only_celebrate-1': { file: 'individual/marcus-webb-only/marcus-webb-only_celebrate-1.svg', size: { w: 106, h: 122 }, index: 33 },
  'marcus-webb-only_celebrate-2': { file: 'individual/marcus-webb-only/marcus-webb-only_celebrate-2.svg', size: { w: 122, h: 122 }, index: 34 },
  'marcus-webb-only_celebrate-3': { file: 'individual/marcus-webb-only/marcus-webb-only_celebrate-3.svg', size: { w: 121, h: 122 }, index: 35 },
  'marcus-webb-only_celebrate-4': { file: 'individual/marcus-webb-only/marcus-webb-only_celebrate-4.svg', size: { w: 90, h: 131 }, index: 36 },
  'marcus-webb-only_talk-1': { file: 'individual/marcus-webb-only/marcus-webb-only_talk-1.svg', size: { w: 73, h: 122 }, index: 37 },
  'marcus-webb-only_talk-2': { file: 'individual/marcus-webb-only/marcus-webb-only_talk-2.svg', size: { w: 53, h: 121 }, index: 38 },
  'marcus-webb-only_wave': { file: 'individual/marcus-webb-only/marcus-webb-only_wave.svg', size: { w: 55, h: 122 }, index: 39 },
  'marcus-webb-only_walk-home': { file: 'individual/marcus-webb-only/marcus-webb-only_walk-home.svg', size: { w: 74, h: 120 }, index: 40 },
  'marcus-webb-only_elevator': { file: 'individual/marcus-webb-only/marcus-webb-only_elevator.svg', size: { w: 136, h: 119 }, index: 41 },
  'marcus-webb-only_levelup-1': { file: 'individual/marcus-webb-only/marcus-webb-only_levelup-1.svg', size: { w: 49, h: 139 }, index: 42 },
  'marcus-webb-only_levelup-2': { file: 'individual/marcus-webb-only/marcus-webb-only_levelup-2.svg', size: { w: 97, h: 139 }, index: 43 },
  'marcus-webb-only_levelup-3': { file: 'individual/marcus-webb-only/marcus-webb-only_levelup-3.svg', size: { w: 112, h: 144 }, index: 44 },
  'marcus-webb-only_levelup-4': { file: 'individual/marcus-webb-only/marcus-webb-only_levelup-4.svg', size: { w: 86, h: 118 }, index: 45 },
  'marcus-webb-only_levelup-5': { file: 'individual/marcus-webb-only/marcus-webb-only_levelup-5.svg', size: { w: 49, h: 148 }, index: 46 },
  'marcus-webb-only_coffee-walk-1': { file: 'individual/marcus-webb-only/marcus-webb-only_coffee-walk-1.svg', size: { w: 85, h: 131 }, index: 47 },
  'marcus-webb-only_coffee-walk-2': { file: 'individual/marcus-webb-only/marcus-webb-only_coffee-walk-2.svg', size: { w: 88, h: 131 }, index: 48 },
  'marcus-webb-only_late-mild': { file: 'individual/marcus-webb-only/marcus-webb-only_late-mild.svg', size: { w: 116, h: 131 }, index: 49 },
  'marcus-webb-only_late-panic': { file: 'individual/marcus-webb-only/marcus-webb-only_late-panic.svg', size: { w: 178, h: 135 }, index: 50 },
};

/** Mia, Tyler, Sam, Omar (batch) */
export const SPRITES_MIA_TYLER_SAM_OMAR_BATCH: Record<string, SpriteEntry> = {
  'mia-tyler-sam-omar-batch_000': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_000.svg', size: { w: 54, h: 17 }, index: 0 },
  'mia-tyler-sam-omar-batch_001': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_001.svg', size: { w: 115, h: 17 }, index: 1 },
  'mia-tyler-sam-omar-batch_002': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_002.svg', size: { w: 82, h: 17 }, index: 2 },
  'mia-tyler-sam-omar-batch_003': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_003.svg', size: { w: 89, h: 17 }, index: 3 },
  'mia-tyler-sam-omar-batch_004': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_004.svg', size: { w: 121, h: 17 }, index: 4 },
  'mia-tyler-sam-omar-batch_005': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_005.svg', size: { w: 107, h: 17 }, index: 5 },
  'mia-tyler-sam-omar-batch_006': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_006.svg', size: { w: 119, h: 17 }, index: 6 },
  'mia-tyler-sam-omar-batch_007': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_007.svg', size: { w: 126, h: 17 }, index: 7 },
  'mia-tyler-sam-omar-batch_008': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_008.svg', size: { w: 126, h: 17 }, index: 8 },
  'mia-tyler-sam-omar-batch_009': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_009.svg', size: { w: 42, h: 60 }, index: 9 },
  'mia-tyler-sam-omar-batch_010': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_010.svg', size: { w: 42, h: 60 }, index: 10 },
  'mia-tyler-sam-omar-batch_011': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_011.svg', size: { w: 41, h: 60 }, index: 11 },
  'mia-tyler-sam-omar-batch_012': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_012.svg', size: { w: 40, h: 60 }, index: 12 },
  'mia-tyler-sam-omar-batch_013': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_013.svg', size: { w: 41, h: 60 }, index: 13 },
  'mia-tyler-sam-omar-batch_014': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_014.svg', size: { w: 42, h: 60 }, index: 14 },
  'mia-tyler-sam-omar-batch_015': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_015.svg', size: { w: 42, h: 60 }, index: 15 },
  'mia-tyler-sam-omar-batch_016': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_016.svg', size: { w: 41, h: 60 }, index: 16 },
  'mia-tyler-sam-omar-batch_017': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_017.svg', size: { w: 41, h: 60 }, index: 17 },
  'mia-tyler-sam-omar-batch_018': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_018.svg', size: { w: 91, h: 16 }, index: 18 },
  'mia-tyler-sam-omar-batch_019': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_019.svg', size: { w: 137, h: 16 }, index: 19 },
  'mia-tyler-sam-omar-batch_020': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_020.svg', size: { w: 125, h: 16 }, index: 20 },
  'mia-tyler-sam-omar-batch_021': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_021.svg', size: { w: 127, h: 16 }, index: 21 },
  'mia-tyler-sam-omar-batch_022': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_022.svg', size: { w: 121, h: 17 }, index: 22 },
  'mia-tyler-sam-omar-batch_023': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_023.svg', size: { w: 70, h: 47 }, index: 23 },
  'mia-tyler-sam-omar-batch_024': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_024.svg', size: { w: 49, h: 47 }, index: 24 },
  'mia-tyler-sam-omar-batch_025': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_025.svg', size: { w: 42, h: 46 }, index: 25 },
  'mia-tyler-sam-omar-batch_026': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_026.svg', size: { w: 42, h: 47 }, index: 26 },
  'mia-tyler-sam-omar-batch_027': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_027.svg', size: { w: 48, h: 46 }, index: 27 },
  'mia-tyler-sam-omar-batch_028': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_028.svg', size: { w: 35, h: 35 }, index: 28 },
  'mia-tyler-sam-omar-batch_029': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_029.svg', size: { w: 104, h: 137 }, index: 29 },
  'mia-tyler-sam-omar-batch_030': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_030.svg', size: { w: 103, h: 138 }, index: 30 },
  'mia-tyler-sam-omar-batch_031': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_031.svg', size: { w: 105, h: 135 }, index: 31 },
  'mia-tyler-sam-omar-batch_032': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_032.svg', size: { w: 105, h: 135 }, index: 32 },
  'mia-tyler-sam-omar-batch_033': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_033.svg', size: { w: 105, h: 135 }, index: 33 },
  'mia-tyler-sam-omar-batch_034': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_034.svg', size: { w: 105, h: 135 }, index: 34 },
  'mia-tyler-sam-omar-batch_035': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_035.svg', size: { w: 89, h: 136 }, index: 35 },
  'mia-tyler-sam-omar-batch_036': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_036.svg', size: { w: 199, h: 133 }, index: 36 },
  'mia-tyler-sam-omar-batch_037': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_037.svg', size: { w: 105, h: 132 }, index: 37 },
  'mia-tyler-sam-omar-batch_038': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_038.svg', size: { w: 98, h: 74 }, index: 38 },
  'mia-tyler-sam-omar-batch_039': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_039.svg', size: { w: 84, h: 71 }, index: 39 },
  'mia-tyler-sam-omar-batch_040': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_040.svg', size: { w: 54, h: 76 }, index: 40 },
  'mia-tyler-sam-omar-batch_041': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_041.svg', size: { w: 60, h: 64 }, index: 41 },
  'mia-tyler-sam-omar-batch_042': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_042.svg', size: { w: 60, h: 74 }, index: 42 },
  'mia-tyler-sam-omar-batch_043': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_043.svg', size: { w: 49, h: 62 }, index: 43 },
  'mia-tyler-sam-omar-batch_044': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_044.svg', size: { w: 40, h: 64 }, index: 44 },
  'mia-tyler-sam-omar-batch_045': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_045.svg', size: { w: 39, h: 64 }, index: 45 },
  'mia-tyler-sam-omar-batch_046': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_046.svg', size: { w: 57, h: 63 }, index: 46 },
  'mia-tyler-sam-omar-batch_047': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_047.svg', size: { w: 52, h: 63 }, index: 47 },
  'mia-tyler-sam-omar-batch_048': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_048.svg', size: { w: 60, h: 64 }, index: 48 },
  'mia-tyler-sam-omar-batch_049': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_049.svg', size: { w: 61, h: 61 }, index: 49 },
  'mia-tyler-sam-omar-batch_050': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_050.svg', size: { w: 36, h: 71 }, index: 50 },
  'mia-tyler-sam-omar-batch_051': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_051.svg', size: { w: 96, h: 66 }, index: 51 },
  'mia-tyler-sam-omar-batch_052': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_052.svg', size: { w: 42, h: 65 }, index: 52 },
  'mia-tyler-sam-omar-batch_053': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_053.svg', size: { w: 45, h: 65 }, index: 53 },
  'mia-tyler-sam-omar-batch_054': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_054.svg', size: { w: 45, h: 65 }, index: 54 },
  'mia-tyler-sam-omar-batch_055': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_055.svg', size: { w: 44, h: 63 }, index: 55 },
  'mia-tyler-sam-omar-batch_056': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_056.svg', size: { w: 44, h: 63 }, index: 56 },
  'mia-tyler-sam-omar-batch_057': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_057.svg', size: { w: 43, h: 62 }, index: 57 },
  'mia-tyler-sam-omar-batch_058': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_058.svg', size: { w: 44, h: 62 }, index: 58 },
  'mia-tyler-sam-omar-batch_059': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_059.svg', size: { w: 44, h: 62 }, index: 59 },
  'mia-tyler-sam-omar-batch_060': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_060.svg', size: { w: 44, h: 62 }, index: 60 },
  'mia-tyler-sam-omar-batch_061': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_061.svg', size: { w: 44, h: 62 }, index: 61 },
  'mia-tyler-sam-omar-batch_062': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_062.svg', size: { w: 99, h: 16 }, index: 62 },
  'mia-tyler-sam-omar-batch_063': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_063.svg', size: { w: 134, h: 16 }, index: 63 },
  'mia-tyler-sam-omar-batch_064': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_064.svg', size: { w: 117, h: 16 }, index: 64 },
  'mia-tyler-sam-omar-batch_065': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_065.svg', size: { w: 122, h: 16 }, index: 65 },
  'mia-tyler-sam-omar-batch_066': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_066.svg', size: { w: 123, h: 16 }, index: 66 },
  'mia-tyler-sam-omar-batch_067': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_067.svg', size: { w: 99, h: 16 }, index: 67 },
  'mia-tyler-sam-omar-batch_068': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_068.svg', size: { w: 82, h: 16 }, index: 68 },
  'mia-tyler-sam-omar-batch_069': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_069.svg', size: { w: 95, h: 16 }, index: 69 },
  'mia-tyler-sam-omar-batch_070': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_070.svg', size: { w: 102, h: 16 }, index: 70 },
  'mia-tyler-sam-omar-batch_071': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_071.svg', size: { w: 108, h: 16 }, index: 71 },
  'mia-tyler-sam-omar-batch_072': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_072.svg', size: { w: 106, h: 16 }, index: 72 },
  'mia-tyler-sam-omar-batch_073': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_073.svg', size: { w: 88, h: 16 }, index: 73 },
  'mia-tyler-sam-omar-batch_074': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_074.svg', size: { w: 98, h: 16 }, index: 74 },
  'mia-tyler-sam-omar-batch_075': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_075.svg', size: { w: 48, h: 56 }, index: 75 },
  'mia-tyler-sam-omar-batch_076': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_076.svg', size: { w: 49, h: 57 }, index: 76 },
  'mia-tyler-sam-omar-batch_077': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_077.svg', size: { w: 47, h: 57 }, index: 77 },
  'mia-tyler-sam-omar-batch_078': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_078.svg', size: { w: 31, h: 33 }, index: 78 },
  'mia-tyler-sam-omar-batch_079': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_079.svg', size: { w: 36, h: 33 }, index: 79 },
  'mia-tyler-sam-omar-batch_080': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_080.svg', size: { w: 36, h: 33 }, index: 80 },
  'mia-tyler-sam-omar-batch_081': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_081.svg', size: { w: 31, h: 31 }, index: 81 },
  'mia-tyler-sam-omar-batch_082': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_082.svg', size: { w: 30, h: 31 }, index: 82 },
  'mia-tyler-sam-omar-batch_083': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_083.svg', size: { w: 31, h: 31 }, index: 83 },
  'mia-tyler-sam-omar-batch_084': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_084.svg', size: { w: 59, h: 62 }, index: 84 },
  'mia-tyler-sam-omar-batch_085': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_085.svg', size: { w: 73, h: 62 }, index: 85 },
  'mia-tyler-sam-omar-batch_086': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_086.svg', size: { w: 77, h: 63 }, index: 86 },
  'mia-tyler-sam-omar-batch_087': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_087.svg', size: { w: 73, h: 62 }, index: 87 },
  'mia-tyler-sam-omar-batch_088': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_088.svg', size: { w: 39, h: 61 }, index: 88 },
  'mia-tyler-sam-omar-batch_089': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_089.svg', size: { w: 40, h: 65 }, index: 89 },
  'mia-tyler-sam-omar-batch_090': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_090.svg', size: { w: 49, h: 61 }, index: 90 },
  'mia-tyler-sam-omar-batch_091': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_091.svg', size: { w: 49, h: 62 }, index: 91 },
  'mia-tyler-sam-omar-batch_092': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_092.svg', size: { w: 46, h: 62 }, index: 92 },
  'mia-tyler-sam-omar-batch_093': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_093.svg', size: { w: 48, h: 62 }, index: 93 },
  'mia-tyler-sam-omar-batch_094': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_094.svg', size: { w: 46, h: 63 }, index: 94 },
  'mia-tyler-sam-omar-batch_095': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_095.svg', size: { w: 79, h: 65 }, index: 95 },
  'mia-tyler-sam-omar-batch_096': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_096.svg', size: { w: 37, h: 54 }, index: 96 },
  'mia-tyler-sam-omar-batch_097': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_097.svg', size: { w: 37, h: 54 }, index: 97 },
  'mia-tyler-sam-omar-batch_098': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_098.svg', size: { w: 38, h: 55 }, index: 98 },
  'mia-tyler-sam-omar-batch_099': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_099.svg', size: { w: 37, h: 54 }, index: 99 },
  'mia-tyler-sam-omar-batch_100': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_100.svg', size: { w: 38, h: 54 }, index: 100 },
  'mia-tyler-sam-omar-batch_101': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_101.svg', size: { w: 36, h: 55 }, index: 101 },
  'mia-tyler-sam-omar-batch_102': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_102.svg', size: { w: 36, h: 55 }, index: 102 },
  'mia-tyler-sam-omar-batch_103': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_103.svg', size: { w: 38, h: 55 }, index: 103 },
  'mia-tyler-sam-omar-batch_104': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_104.svg', size: { w: 37, h: 53 }, index: 104 },
  'mia-tyler-sam-omar-batch_105': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_105.svg', size: { w: 36, h: 54 }, index: 105 },
  'mia-tyler-sam-omar-batch_106': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_106.svg', size: { w: 120, h: 16 }, index: 106 },
  'mia-tyler-sam-omar-batch_107': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_107.svg', size: { w: 125, h: 16 }, index: 107 },
  'mia-tyler-sam-omar-batch_108': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_108.svg', size: { w: 120, h: 16 }, index: 108 },
  'mia-tyler-sam-omar-batch_109': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_109.svg', size: { w: 113, h: 16 }, index: 109 },
  'mia-tyler-sam-omar-batch_110': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_110.svg', size: { w: 122, h: 16 }, index: 110 },
  'mia-tyler-sam-omar-batch_111': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_111.svg', size: { w: 87, h: 16 }, index: 111 },
  'mia-tyler-sam-omar-batch_112': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_112.svg', size: { w: 88, h: 16 }, index: 112 },
  'mia-tyler-sam-omar-batch_113': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_113.svg', size: { w: 88, h: 16 }, index: 113 },
  'mia-tyler-sam-omar-batch_114': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_114.svg', size: { w: 89, h: 16 }, index: 114 },
  'mia-tyler-sam-omar-batch_115': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_115.svg', size: { w: 105, h: 16 }, index: 115 },
  'mia-tyler-sam-omar-batch_116': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_116.svg', size: { w: 97, h: 16 }, index: 116 },
  'mia-tyler-sam-omar-batch_117': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_117.svg', size: { w: 92, h: 15 }, index: 117 },
  'mia-tyler-sam-omar-batch_118': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_118.svg', size: { w: 87, h: 15 }, index: 118 },
  'mia-tyler-sam-omar-batch_119': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_119.svg', size: { w: 133, h: 177 }, index: 119 },
  'mia-tyler-sam-omar-batch_120': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_120.svg', size: { w: 131, h: 156 }, index: 120 },
  'mia-tyler-sam-omar-batch_121': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_121.svg', size: { w: 99, h: 140 }, index: 121 },
  'mia-tyler-sam-omar-batch_122': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_122.svg', size: { w: 32, h: 80 }, index: 122 },
  'mia-tyler-sam-omar-batch_123': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_123.svg', size: { w: 111, h: 140 }, index: 123 },
  'mia-tyler-sam-omar-batch_124': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_124.svg', size: { w: 22, h: 79 }, index: 124 },
  'mia-tyler-sam-omar-batch_125': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_125.svg', size: { w: 21, h: 78 }, index: 125 },
  'mia-tyler-sam-omar-batch_126': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_126.svg', size: { w: 105, h: 138 }, index: 126 },
  'mia-tyler-sam-omar-batch_127': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_127.svg', size: { w: 23, h: 79 }, index: 127 },
  'mia-tyler-sam-omar-batch_128': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_128.svg', size: { w: 22, h: 79 }, index: 128 },
  'mia-tyler-sam-omar-batch_129': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_129.svg', size: { w: 121, h: 140 }, index: 129 },
  'mia-tyler-sam-omar-batch_130': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_130.svg', size: { w: 131, h: 138 }, index: 130 },
  'mia-tyler-sam-omar-batch_131': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_131.svg', size: { w: 116, h: 129 }, index: 131 },
  'mia-tyler-sam-omar-batch_132': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_132.svg', size: { w: 113, h: 128 }, index: 132 },
  'mia-tyler-sam-omar-batch_133': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_133.svg', size: { w: 23, h: 80 }, index: 133 },
  'mia-tyler-sam-omar-batch_134': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_134.svg', size: { w: 21, h: 15 }, index: 134 },
  'mia-tyler-sam-omar-batch_135': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_135.svg', size: { w: 102, h: 131 }, index: 135 },
  'mia-tyler-sam-omar-batch_136': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_136.svg', size: { w: 22, h: 15 }, index: 136 },
  'mia-tyler-sam-omar-batch_137': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_137.svg', size: { w: 100, h: 72 }, index: 137 },
  'mia-tyler-sam-omar-batch_138': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_138.svg', size: { w: 97, h: 83 }, index: 138 },
  'mia-tyler-sam-omar-batch_139': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_139.svg', size: { w: 34, h: 53 }, index: 139 },
  'mia-tyler-sam-omar-batch_140': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_140.svg', size: { w: 34, h: 53 }, index: 140 },
  'mia-tyler-sam-omar-batch_141': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_141.svg', size: { w: 35, h: 52 }, index: 141 },
  'mia-tyler-sam-omar-batch_142': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_142.svg', size: { w: 34, h: 52 }, index: 142 },
  'mia-tyler-sam-omar-batch_143': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_143.svg', size: { w: 34, h: 52 }, index: 143 },
  'mia-tyler-sam-omar-batch_144': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_144.svg', size: { w: 36, h: 52 }, index: 144 },
  'mia-tyler-sam-omar-batch_145': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_145.svg', size: { w: 34, h: 52 }, index: 145 },
  'mia-tyler-sam-omar-batch_146': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_146.svg', size: { w: 35, h: 52 }, index: 146 },
  'mia-tyler-sam-omar-batch_147': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_147.svg', size: { w: 35, h: 52 }, index: 147 },
  'mia-tyler-sam-omar-batch_148': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_148.svg', size: { w: 34, h: 52 }, index: 148 },
  'mia-tyler-sam-omar-batch_149': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_149.svg', size: { w: 33, h: 51 }, index: 149 },
  'mia-tyler-sam-omar-batch_150': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_150.svg', size: { w: 33, h: 51 }, index: 150 },
  'mia-tyler-sam-omar-batch_151': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_151.svg', size: { w: 102, h: 100 }, index: 151 },
  'mia-tyler-sam-omar-batch_152': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_152.svg', size: { w: 100, h: 100 }, index: 152 },
  'mia-tyler-sam-omar-batch_153': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_153.svg', size: { w: 23, h: 14 }, index: 153 },
  'mia-tyler-sam-omar-batch_154': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_154.svg', size: { w: 83, h: 99 }, index: 154 },
  'mia-tyler-sam-omar-batch_155': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_155.svg', size: { w: 22, h: 62 }, index: 155 },
  'mia-tyler-sam-omar-batch_156': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_156.svg', size: { w: 23, h: 14 }, index: 156 },
  'mia-tyler-sam-omar-batch_157': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_157.svg', size: { w: 70, h: 99 }, index: 157 },
  'mia-tyler-sam-omar-batch_158': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_158.svg', size: { w: 23, h: 62 }, index: 158 },
  'mia-tyler-sam-omar-batch_159': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_159.svg', size: { w: 23, h: 14 }, index: 159 },
  'mia-tyler-sam-omar-batch_160': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_160.svg', size: { w: 76, h: 99 }, index: 160 },
  'mia-tyler-sam-omar-batch_161': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_161.svg', size: { w: 24, h: 62 }, index: 161 },
  'mia-tyler-sam-omar-batch_162': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_162.svg', size: { w: 23, h: 14 }, index: 162 },
  'mia-tyler-sam-omar-batch_163': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_163.svg', size: { w: 92, h: 99 }, index: 163 },
  'mia-tyler-sam-omar-batch_164': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_164.svg', size: { w: 23, h: 14 }, index: 164 },
  'mia-tyler-sam-omar-batch_165': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_165.svg', size: { w: 22, h: 14 }, index: 165 },
  'mia-tyler-sam-omar-batch_166': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_166.svg', size: { w: 104, h: 99 }, index: 166 },
  'mia-tyler-sam-omar-batch_167': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_167.svg', size: { w: 22, h: 14 }, index: 167 },
  'mia-tyler-sam-omar-batch_168': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_168.svg', size: { w: 100, h: 99 }, index: 168 },
  'mia-tyler-sam-omar-batch_169': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_169.svg', size: { w: 109, h: 98 }, index: 169 },
  'mia-tyler-sam-omar-batch_170': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_170.svg', size: { w: 111, h: 98 }, index: 170 },
  'mia-tyler-sam-omar-batch_171': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_171.svg', size: { w: 100, h: 98 }, index: 171 },
  'mia-tyler-sam-omar-batch_172': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_172.svg', size: { w: 109, h: 97 }, index: 172 },
  'mia-tyler-sam-omar-batch_173': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_173.svg', size: { w: 118, h: 13 }, index: 173 },
  'mia-tyler-sam-omar-batch_174': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_174.svg', size: { w: 121, h: 13 }, index: 174 },
  'mia-tyler-sam-omar-batch_175': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_175.svg', size: { w: 140, h: 12 }, index: 175 },
  'mia-tyler-sam-omar-batch_176': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_176.svg', size: { w: 119, h: 13 }, index: 176 },
  'mia-tyler-sam-omar-batch_177': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_177.svg', size: { w: 101, h: 13 }, index: 177 },
  'mia-tyler-sam-omar-batch_178': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_178.svg', size: { w: 34, h: 51 }, index: 178 },
  'mia-tyler-sam-omar-batch_179': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_179.svg', size: { w: 34, h: 51 }, index: 179 },
  'mia-tyler-sam-omar-batch_180': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_180.svg', size: { w: 36, h: 50 }, index: 180 },
  'mia-tyler-sam-omar-batch_181': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_181.svg', size: { w: 35, h: 50 }, index: 181 },
  'mia-tyler-sam-omar-batch_182': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_182.svg', size: { w: 34, h: 50 }, index: 182 },
  'mia-tyler-sam-omar-batch_183': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_183.svg', size: { w: 33, h: 49 }, index: 183 },
  'mia-tyler-sam-omar-batch_184': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_184.svg', size: { w: 34, h: 50 }, index: 184 },
  'mia-tyler-sam-omar-batch_185': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_185.svg', size: { w: 34, h: 49 }, index: 185 },
  'mia-tyler-sam-omar-batch_186': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_186.svg', size: { w: 35, h: 49 }, index: 186 },
  'mia-tyler-sam-omar-batch_187': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_187.svg', size: { w: 35, h: 48 }, index: 187 },
  'mia-tyler-sam-omar-batch_188': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_188.svg', size: { w: 34, h: 47 }, index: 188 },
  'mia-tyler-sam-omar-batch_189': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_189.svg', size: { w: 33, h: 47 }, index: 189 },
  'mia-tyler-sam-omar-batch_190': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_190.svg', size: { w: 122, h: 13 }, index: 190 },
  'mia-tyler-sam-omar-batch_191': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_191.svg', size: { w: 113, h: 13 }, index: 191 },
  'mia-tyler-sam-omar-batch_192': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_192.svg', size: { w: 113, h: 13 }, index: 192 },
  'mia-tyler-sam-omar-batch_193': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_193.svg', size: { w: 106, h: 13 }, index: 193 },
  'mia-tyler-sam-omar-batch_194': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_194.svg', size: { w: 32, h: 49 }, index: 194 },
  'mia-tyler-sam-omar-batch_195': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_195.svg', size: { w: 55, h: 48 }, index: 195 },
  'mia-tyler-sam-omar-batch_196': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_196.svg', size: { w: 39, h: 49 }, index: 196 },
  'mia-tyler-sam-omar-batch_197': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_197.svg', size: { w: 69, h: 47 }, index: 197 },
  'mia-tyler-sam-omar-batch_198': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_198.svg', size: { w: 69, h: 47 }, index: 198 },
  'mia-tyler-sam-omar-batch_199': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_199.svg', size: { w: 43, h: 49 }, index: 199 },
  'mia-tyler-sam-omar-batch_200': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_200.svg', size: { w: 44, h: 49 }, index: 200 },
  'mia-tyler-sam-omar-batch_201': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_201.svg', size: { w: 49, h: 48 }, index: 201 },
  'mia-tyler-sam-omar-batch_202': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_202.svg', size: { w: 62, h: 49 }, index: 202 },
  'mia-tyler-sam-omar-batch_203': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_203.svg', size: { w: 69, h: 46 }, index: 203 },
  'mia-tyler-sam-omar-batch_204': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_204.svg', size: { w: 43, h: 49 }, index: 204 },
  'mia-tyler-sam-omar-batch_205': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_205.svg', size: { w: 69, h: 45 }, index: 205 },
  'mia-tyler-sam-omar-batch_206': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_206.svg', size: { w: 111, h: 51 }, index: 206 },
  'mia-tyler-sam-omar-batch_207': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_207.svg', size: { w: 99, h: 51 }, index: 207 },
  'mia-tyler-sam-omar-batch_208': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_208.svg', size: { w: 109, h: 50 }, index: 208 },
  'mia-tyler-sam-omar-batch_209': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_209.svg', size: { w: 109, h: 50 }, index: 209 },
  'mia-tyler-sam-omar-batch_210': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_210.svg', size: { w: 111, h: 50 }, index: 210 },
  'mia-tyler-sam-omar-batch_211': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_211.svg', size: { w: 105, h: 50 }, index: 211 },
  'mia-tyler-sam-omar-batch_212': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_212.svg', size: { w: 121, h: 50 }, index: 212 },
  'mia-tyler-sam-omar-batch_213': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_213.svg', size: { w: 117, h: 50 }, index: 213 },
  'mia-tyler-sam-omar-batch_214': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_214.svg', size: { w: 113, h: 50 }, index: 214 },
  'mia-tyler-sam-omar-batch_215': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_215.svg', size: { w: 102, h: 50 }, index: 215 },
  'mia-tyler-sam-omar-batch_216': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_216.svg', size: { w: 100, h: 50 }, index: 216 },
  'mia-tyler-sam-omar-batch_217': { file: 'individual/mia-tyler-sam-omar-batch/mia-tyler-sam-omar-batch_217.svg', size: { w: 100, h: 50 }, index: 217 },
};

/** Priya Sharma only */
export const SPRITES_PRIYA_SHARMA_ONLY: Record<string, SpriteEntry> = {
  'priya-sharma-only_000': { file: 'individual/priya-sharma-only/priya-sharma-only_000.svg', size: { w: 97, h: 164 }, index: 0 },
  'priya-sharma-only_001': { file: 'individual/priya-sharma-only/priya-sharma-only_001.svg', size: { w: 104, h: 105 }, index: 1 },
  'priya-sharma-only_002': { file: 'individual/priya-sharma-only/priya-sharma-only_002.svg', size: { w: 398, h: 107 }, index: 2 },
  'priya-sharma-only_003': { file: 'individual/priya-sharma-only/priya-sharma-only_003.svg', size: { w: 254, h: 106 }, index: 3 },
  'priya-sharma-only_004': { file: 'individual/priya-sharma-only/priya-sharma-only_004.svg', size: { w: 106, h: 106 }, index: 4 },
  'priya-sharma-only_005': { file: 'individual/priya-sharma-only/priya-sharma-only_005.svg', size: { w: 158, h: 106 }, index: 5 },
  'priya-sharma-only_006': { file: 'individual/priya-sharma-only/priya-sharma-only_006.svg', size: { w: 106, h: 105 }, index: 6 },
  'priya-sharma-only_007': { file: 'individual/priya-sharma-only/priya-sharma-only_007.svg', size: { w: 109, h: 21 }, index: 7 },
  'priya-sharma-only_008': { file: 'individual/priya-sharma-only/priya-sharma-only_008.svg', size: { w: 96, h: 20 }, index: 8 },
  'priya-sharma-only_009': { file: 'individual/priya-sharma-only/priya-sharma-only_009.svg', size: { w: 106, h: 21 }, index: 9 },
  'priya-sharma-only_010': { file: 'individual/priya-sharma-only/priya-sharma-only_010.svg', size: { w: 430, h: 140 }, index: 10 },
  'priya-sharma-only_011': { file: 'individual/priya-sharma-only/priya-sharma-only_011.svg', size: { w: 126, h: 21 }, index: 11 },
  'priya-sharma-only_012': { file: 'individual/priya-sharma-only/priya-sharma-only_012.svg', size: { w: 133, h: 21 }, index: 12 },
  'priya-sharma-only_013': { file: 'individual/priya-sharma-only/priya-sharma-only_013.svg', size: { w: 123, h: 20 }, index: 13 },
  'priya-sharma-only_014': { file: 'individual/priya-sharma-only/priya-sharma-only_014.svg', size: { w: 145, h: 108 }, index: 14 },
  'priya-sharma-only_015': { file: 'individual/priya-sharma-only/priya-sharma-only_015.svg', size: { w: 163, h: 107 }, index: 15 },
  'priya-sharma-only_016': { file: 'individual/priya-sharma-only/priya-sharma-only_016.svg', size: { w: 107, h: 112 }, index: 16 },
  'priya-sharma-only_017': { file: 'individual/priya-sharma-only/priya-sharma-only_017.svg', size: { w: 101, h: 22 }, index: 17 },
  'priya-sharma-only_018': { file: 'individual/priya-sharma-only/priya-sharma-only_018.svg', size: { w: 101, h: 22 }, index: 18 },
  'priya-sharma-only_019': { file: 'individual/priya-sharma-only/priya-sharma-only_019.svg', size: { w: 120, h: 20 }, index: 19 },
  'priya-sharma-only_020': { file: 'individual/priya-sharma-only/priya-sharma-only_020.svg', size: { w: 100, h: 20 }, index: 20 },
  'priya-sharma-only_021': { file: 'individual/priya-sharma-only/priya-sharma-only_021.svg', size: { w: 103, h: 21 }, index: 21 },
  'priya-sharma-only_022': { file: 'individual/priya-sharma-only/priya-sharma-only_022.svg', size: { w: 110, h: 19 }, index: 22 },
  'priya-sharma-only_023': { file: 'individual/priya-sharma-only/priya-sharma-only_023.svg', size: { w: 117, h: 20 }, index: 23 },
  'priya-sharma-only_024': { file: 'individual/priya-sharma-only/priya-sharma-only_024.svg', size: { w: 97, h: 20 }, index: 24 },
  'priya-sharma-only_025': { file: 'individual/priya-sharma-only/priya-sharma-only_025.svg', size: { w: 72, h: 20 }, index: 25 },
  'priya-sharma-only_026': { file: 'individual/priya-sharma-only/priya-sharma-only_026.svg', size: { w: 100, h: 21 }, index: 26 },
  'priya-sharma-only_027': { file: 'individual/priya-sharma-only/priya-sharma-only_027.svg', size: { w: 75, h: 129 }, index: 27 },
  'priya-sharma-only_028': { file: 'individual/priya-sharma-only/priya-sharma-only_028.svg', size: { w: 77, h: 129 }, index: 28 },
  'priya-sharma-only_029': { file: 'individual/priya-sharma-only/priya-sharma-only_029.svg', size: { w: 74, h: 129 }, index: 29 },
  'priya-sharma-only_030': { file: 'individual/priya-sharma-only/priya-sharma-only_030.svg', size: { w: 76, h: 129 }, index: 30 },
  'priya-sharma-only_031': { file: 'individual/priya-sharma-only/priya-sharma-only_031.svg', size: { w: 84, h: 129 }, index: 31 },
  'priya-sharma-only_032': { file: 'individual/priya-sharma-only/priya-sharma-only_032.svg', size: { w: 83, h: 130 }, index: 32 },
  'priya-sharma-only_033': { file: 'individual/priya-sharma-only/priya-sharma-only_033.svg', size: { w: 81, h: 129 }, index: 33 },
  'priya-sharma-only_034': { file: 'individual/priya-sharma-only/priya-sharma-only_034.svg', size: { w: 75, h: 128 }, index: 34 },
  'priya-sharma-only_035': { file: 'individual/priya-sharma-only/priya-sharma-only_035.svg', size: { w: 75, h: 128 }, index: 35 },
  'priya-sharma-only_036': { file: 'individual/priya-sharma-only/priya-sharma-only_036.svg', size: { w: 83, h: 127 }, index: 36 },
  'priya-sharma-only_037': { file: 'individual/priya-sharma-only/priya-sharma-only_037.svg', size: { w: 141, h: 21 }, index: 37 },
  'priya-sharma-only_038': { file: 'individual/priya-sharma-only/priya-sharma-only_038.svg', size: { w: 141, h: 21 }, index: 38 },
  'priya-sharma-only_039': { file: 'individual/priya-sharma-only/priya-sharma-only_039.svg', size: { w: 125, h: 19 }, index: 39 },
  'priya-sharma-only_040': { file: 'individual/priya-sharma-only/priya-sharma-only_040.svg', size: { w: 124, h: 20 }, index: 40 },
  'priya-sharma-only_041': { file: 'individual/priya-sharma-only/priya-sharma-only_041.svg', size: { w: 148, h: 20 }, index: 41 },
  'priya-sharma-only_042': { file: 'individual/priya-sharma-only/priya-sharma-only_042.svg', size: { w: 103, h: 20 }, index: 42 },
  'priya-sharma-only_043': { file: 'individual/priya-sharma-only/priya-sharma-only_043.svg', size: { w: 116, h: 20 }, index: 43 },
  'priya-sharma-only_044': { file: 'individual/priya-sharma-only/priya-sharma-only_044.svg', size: { w: 117, h: 20 }, index: 44 },
  'priya-sharma-only_045': { file: 'individual/priya-sharma-only/priya-sharma-only_045.svg', size: { w: 142, h: 115 }, index: 45 },
  'priya-sharma-only_046': { file: 'individual/priya-sharma-only/priya-sharma-only_046.svg', size: { w: 146, h: 115 }, index: 46 },
  'priya-sharma-only_047': { file: 'individual/priya-sharma-only/priya-sharma-only_047.svg', size: { w: 148, h: 115 }, index: 47 },
  'priya-sharma-only_048': { file: 'individual/priya-sharma-only/priya-sharma-only_048.svg', size: { w: 96, h: 117 }, index: 48 },
  'priya-sharma-only_049': { file: 'individual/priya-sharma-only/priya-sharma-only_049.svg', size: { w: 100, h: 117 }, index: 49 },
  'priya-sharma-only_050': { file: 'individual/priya-sharma-only/priya-sharma-only_050.svg', size: { w: 67, h: 120 }, index: 50 },
  'priya-sharma-only_051': { file: 'individual/priya-sharma-only/priya-sharma-only_051.svg', size: { w: 147, h: 114 }, index: 51 },
  'priya-sharma-only_052': { file: 'individual/priya-sharma-only/priya-sharma-only_052.svg', size: { w: 86, h: 116 }, index: 52 },
  'priya-sharma-only_053': { file: 'individual/priya-sharma-only/priya-sharma-only_053.svg', size: { w: 100, h: 136 }, index: 53 },
  'priya-sharma-only_054': { file: 'individual/priya-sharma-only/priya-sharma-only_054.svg', size: { w: 115, h: 124 }, index: 54 },
  'priya-sharma-only_055': { file: 'individual/priya-sharma-only/priya-sharma-only_055.svg', size: { w: 140, h: 125 }, index: 55 },
  'priya-sharma-only_056': { file: 'individual/priya-sharma-only/priya-sharma-only_056.svg', size: { w: 122, h: 125 }, index: 56 },
  'priya-sharma-only_057': { file: 'individual/priya-sharma-only/priya-sharma-only_057.svg', size: { w: 75, h: 122 }, index: 57 },
  'priya-sharma-only_058': { file: 'individual/priya-sharma-only/priya-sharma-only_058.svg', size: { w: 143, h: 124 }, index: 58 },
  'priya-sharma-only_059': { file: 'individual/priya-sharma-only/priya-sharma-only_059.svg', size: { w: 69, h: 121 }, index: 59 },
  'priya-sharma-only_060': { file: 'individual/priya-sharma-only/priya-sharma-only_060.svg', size: { w: 86, h: 120 }, index: 60 },
  'priya-sharma-only_061': { file: 'individual/priya-sharma-only/priya-sharma-only_061.svg', size: { w: 69, h: 121 }, index: 61 },
  'priya-sharma-only_062': { file: 'individual/priya-sharma-only/priya-sharma-only_062.svg', size: { w: 66, h: 166 }, index: 62 },
  'priya-sharma-only_063': { file: 'individual/priya-sharma-only/priya-sharma-only_063.svg', size: { w: 128, h: 163 }, index: 63 },
  'priya-sharma-only_064': { file: 'individual/priya-sharma-only/priya-sharma-only_064.svg', size: { w: 105, h: 132 }, index: 64 },
  'priya-sharma-only_065': { file: 'individual/priya-sharma-only/priya-sharma-only_065.svg', size: { w: 188, h: 134 }, index: 65 },
  'priya-sharma-only_066': { file: 'individual/priya-sharma-only/priya-sharma-only_066.svg', size: { w: 91, h: 133 }, index: 66 },
  'priya-sharma-only_067': { file: 'individual/priya-sharma-only/priya-sharma-only_067.svg', size: { w: 95, h: 131 }, index: 67 },
  'priya-sharma-only_068': { file: 'individual/priya-sharma-only/priya-sharma-only_068.svg', size: { w: 116, h: 131 }, index: 68 },
  'priya-sharma-only_069': { file: 'individual/priya-sharma-only/priya-sharma-only_069.svg', size: { w: 68, h: 126 }, index: 69 },
  'priya-sharma-only_070': { file: 'individual/priya-sharma-only/priya-sharma-only_070.svg', size: { w: 108, h: 126 }, index: 70 },
  'priya-sharma-only_071': { file: 'individual/priya-sharma-only/priya-sharma-only_071.svg', size: { w: 146, h: 139 }, index: 71 },
  'priya-sharma-only_072': { file: 'individual/priya-sharma-only/priya-sharma-only_072.svg', size: { w: 111, h: 170 }, index: 72 },
  'priya-sharma-only_073': { file: 'individual/priya-sharma-only/priya-sharma-only_073.svg', size: { w: 129, h: 170 }, index: 73 },
  'priya-sharma-only_074': { file: 'individual/priya-sharma-only/priya-sharma-only_074.svg', size: { w: 126, h: 153 }, index: 74 },
  'priya-sharma-only_075': { file: 'individual/priya-sharma-only/priya-sharma-only_075.svg', size: { w: 145, h: 173 }, index: 75 },
  'priya-sharma-only_076': { file: 'individual/priya-sharma-only/priya-sharma-only_076.svg', size: { w: 107, h: 175 }, index: 76 },
  'priya-sharma-only_077': { file: 'individual/priya-sharma-only/priya-sharma-only_077.svg', size: { w: 128, h: 158 }, index: 77 },
  'priya-sharma-only_078': { file: 'individual/priya-sharma-only/priya-sharma-only_078.svg', size: { w: 144, h: 157 }, index: 78 },
  'priya-sharma-only_079': { file: 'individual/priya-sharma-only/priya-sharma-only_079.svg', size: { w: 121, h: 158 }, index: 79 },
  'priya-sharma-only_080': { file: 'individual/priya-sharma-only/priya-sharma-only_080.svg', size: { w: 188, h: 156 }, index: 80 },
};

/** Reception Bot and Kin (founderyou) */
export const SPRITES_RECEPTION_BOT_AND_KIN_FOUNDERYOU: Record<string, SpriteEntry> = {
  'reception-bot-and-kin-founderyou_000': { file: 'individual/reception-bot-and-kin-founderyou/reception-bot-and-kin-founderyou_000.svg', size: { w: 205, h: 28 }, index: 0 },
  'reception-bot-and-kin-founderyou_001': { file: 'individual/reception-bot-and-kin-founderyou/reception-bot-and-kin-founderyou_001.svg', size: { w: 204, h: 30 }, index: 1 },
  'reception-bot-and-kin-founderyou_002': { file: 'individual/reception-bot-and-kin-founderyou/reception-bot-and-kin-founderyou_002.svg', size: { w: 208, h: 30 }, index: 2 },
  'reception-bot-and-kin-founderyou_003': { file: 'individual/reception-bot-and-kin-founderyou/reception-bot-and-kin-founderyou_003.svg', size: { w: 207, h: 30 }, index: 3 },
  'reception-bot-and-kin-founderyou_004': { file: 'individual/reception-bot-and-kin-founderyou/reception-bot-and-kin-founderyou_004.svg', size: { w: 196, h: 28 }, index: 4 },
  'reception-bot-and-kin-founderyou_005': { file: 'individual/reception-bot-and-kin-founderyou/reception-bot-and-kin-founderyou_005.svg', size: { w: 167, h: 319 }, index: 5 },
  'reception-bot-and-kin-founderyou_006': { file: 'individual/reception-bot-and-kin-founderyou/reception-bot-and-kin-founderyou_006.svg', size: { w: 167, h: 319 }, index: 6 },
  'reception-bot-and-kin-founderyou_007': { file: 'individual/reception-bot-and-kin-founderyou/reception-bot-and-kin-founderyou_007.svg', size: { w: 244, h: 319 }, index: 7 },
  'reception-bot-and-kin-founderyou_008': { file: 'individual/reception-bot-and-kin-founderyou/reception-bot-and-kin-founderyou_008.svg', size: { w: 225, h: 318 }, index: 8 },
  'reception-bot-and-kin-founderyou_009': { file: 'individual/reception-bot-and-kin-founderyou/reception-bot-and-kin-founderyou_009.svg', size: { w: 171, h: 318 }, index: 9 },
  'reception-bot-and-kin-founderyou_010': { file: 'individual/reception-bot-and-kin-founderyou/reception-bot-and-kin-founderyou_010.svg', size: { w: 95, h: 29 }, index: 10 },
  'reception-bot-and-kin-founderyou_011': { file: 'individual/reception-bot-and-kin-founderyou/reception-bot-and-kin-founderyou_011.svg', size: { w: 139, h: 29 }, index: 11 },
  'reception-bot-and-kin-founderyou_012': { file: 'individual/reception-bot-and-kin-founderyou/reception-bot-and-kin-founderyou_012.svg', size: { w: 128, h: 29 }, index: 12 },
  'reception-bot-and-kin-founderyou_013': { file: 'individual/reception-bot-and-kin-founderyou/reception-bot-and-kin-founderyou_013.svg', size: { w: 132, h: 29 }, index: 13 },
  'reception-bot-and-kin-founderyou_014': { file: 'individual/reception-bot-and-kin-founderyou/reception-bot-and-kin-founderyou_014.svg', size: { w: 161, h: 29 }, index: 14 },
  'reception-bot-and-kin-founderyou_015': { file: 'individual/reception-bot-and-kin-founderyou/reception-bot-and-kin-founderyou_015.svg', size: { w: 40, h: 19 }, index: 15 },
  'reception-bot-and-kin-founderyou_016': { file: 'individual/reception-bot-and-kin-founderyou/reception-bot-and-kin-founderyou_016.svg', size: { w: 186, h: 311 }, index: 16 },
  'reception-bot-and-kin-founderyou_017': { file: 'individual/reception-bot-and-kin-founderyou/reception-bot-and-kin-founderyou_017.svg', size: { w: 274, h: 311 }, index: 17 },
  'reception-bot-and-kin-founderyou_018': { file: 'individual/reception-bot-and-kin-founderyou/reception-bot-and-kin-founderyou_018.svg', size: { w: 225, h: 311 }, index: 18 },
  'reception-bot-and-kin-founderyou_019': { file: 'individual/reception-bot-and-kin-founderyou/reception-bot-and-kin-founderyou_019.svg', size: { w: 197, h: 310 }, index: 19 },
};

/** Rex and Dana security guards */
export const SPRITES_REX_AND_DANA_SECURITY_GUARDS: Record<string, SpriteEntry> = {
  'rex-and-dana-security-guards_000': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_000.svg', size: { w: 65, h: 19 }, index: 0 },
  'rex-and-dana-security-guards_001': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_001.svg', size: { w: 87, h: 19 }, index: 1 },
  'rex-and-dana-security-guards_002': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_002.svg', size: { w: 64, h: 19 }, index: 2 },
  'rex-and-dana-security-guards_003': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_003.svg', size: { w: 97, h: 19 }, index: 3 },
  'rex-and-dana-security-guards_004': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_004.svg', size: { w: 98, h: 19 }, index: 4 },
  'rex-and-dana-security-guards_005': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_005.svg', size: { w: 65, h: 19 }, index: 5 },
  'rex-and-dana-security-guards_006': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_006.svg', size: { w: 91, h: 19 }, index: 6 },
  'rex-and-dana-security-guards_007': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_007.svg', size: { w: 91, h: 19 }, index: 7 },
  'rex-and-dana-security-guards_008': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_008.svg', size: { w: 90, h: 19 }, index: 8 },
  'rex-and-dana-security-guards_009': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_009.svg', size: { w: 85, h: 19 }, index: 9 },
  'rex-and-dana-security-guards_010': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_010.svg', size: { w: 84, h: 19 }, index: 10 },
  'rex-and-dana-security-guards_011': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_011.svg', size: { w: 72, h: 81 }, index: 11 },
  'rex-and-dana-security-guards_012': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_012.svg', size: { w: 96, h: 80 }, index: 12 },
  'rex-and-dana-security-guards_013': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_013.svg', size: { w: 47, h: 50 }, index: 13 },
  'rex-and-dana-security-guards_014': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_014.svg', size: { w: 92, h: 47 }, index: 14 },
  'rex-and-dana-security-guards_015': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_015.svg', size: { w: 46, h: 49 }, index: 15 },
  'rex-and-dana-security-guards_016': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_016.svg', size: { w: 47, h: 49 }, index: 16 },
  'rex-and-dana-security-guards_017': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_017.svg', size: { w: 46, h: 49 }, index: 17 },
  'rex-and-dana-security-guards_018': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_018.svg', size: { w: 47, h: 49 }, index: 18 },
  'rex-and-dana-security-guards_019': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_019.svg', size: { w: 46, h: 49 }, index: 19 },
  'rex-and-dana-security-guards_020': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_020.svg', size: { w: 91, h: 46 }, index: 20 },
  'rex-and-dana-security-guards_021': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_021.svg', size: { w: 49, h: 48 }, index: 21 },
  'rex-and-dana-security-guards_022': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_022.svg', size: { w: 64, h: 19 }, index: 22 },
  'rex-and-dana-security-guards_023': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_023.svg', size: { w: 92, h: 19 }, index: 23 },
  'rex-and-dana-security-guards_024': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_024.svg', size: { w: 93, h: 19 }, index: 24 },
  'rex-and-dana-security-guards_025': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_025.svg', size: { w: 93, h: 19 }, index: 25 },
  'rex-and-dana-security-guards_026': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_026.svg', size: { w: 96, h: 19 }, index: 26 },
  'rex-and-dana-security-guards_027': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_027.svg', size: { w: 71, h: 19 }, index: 27 },
  'rex-and-dana-security-guards_028': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_028.svg', size: { w: 80, h: 19 }, index: 28 },
  'rex-and-dana-security-guards_029': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_029.svg', size: { w: 102, h: 19 }, index: 29 },
  'rex-and-dana-security-guards_030': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_030.svg', size: { w: 67, h: 19 }, index: 30 },
  'rex-and-dana-security-guards_031': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_031.svg', size: { w: 110, h: 19 }, index: 31 },
  'rex-and-dana-security-guards_032': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_032.svg', size: { w: 101, h: 77 }, index: 32 },
  'rex-and-dana-security-guards_033': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_033.svg', size: { w: 106, h: 79 }, index: 33 },
  'rex-and-dana-security-guards_034': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_034.svg', size: { w: 92, h: 79 }, index: 34 },
  'rex-and-dana-security-guards_035': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_035.svg', size: { w: 105, h: 79 }, index: 35 },
  'rex-and-dana-security-guards_036': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_036.svg', size: { w: 64, h: 83 }, index: 36 },
  'rex-and-dana-security-guards_037': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_037.svg', size: { w: 94, h: 50 }, index: 37 },
  'rex-and-dana-security-guards_038': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_038.svg', size: { w: 45, h: 52 }, index: 38 },
  'rex-and-dana-security-guards_039': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_039.svg', size: { w: 57, h: 52 }, index: 39 },
  'rex-and-dana-security-guards_040': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_040.svg', size: { w: 55, h: 52 }, index: 40 },
  'rex-and-dana-security-guards_041': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_041.svg', size: { w: 47, h: 51 }, index: 41 },
  'rex-and-dana-security-guards_042': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_042.svg', size: { w: 76, h: 19 }, index: 42 },
  'rex-and-dana-security-guards_043': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_043.svg', size: { w: 100, h: 19 }, index: 43 },
  'rex-and-dana-security-guards_044': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_044.svg', size: { w: 100, h: 19 }, index: 44 },
  'rex-and-dana-security-guards_045': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_045.svg', size: { w: 78, h: 19 }, index: 45 },
  'rex-and-dana-security-guards_046': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_046.svg', size: { w: 92, h: 19 }, index: 46 },
  'rex-and-dana-security-guards_047': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_047.svg', size: { w: 149, h: 19 }, index: 47 },
  'rex-and-dana-security-guards_048': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_048.svg', size: { w: 125, h: 19 }, index: 48 },
  'rex-and-dana-security-guards_049': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_049.svg', size: { w: 147, h: 19 }, index: 49 },
  'rex-and-dana-security-guards_050': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_050.svg', size: { w: 146, h: 19 }, index: 50 },
  'rex-and-dana-security-guards_051': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_051.svg', size: { w: 63, h: 53 }, index: 51 },
  'rex-and-dana-security-guards_052': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_052.svg', size: { w: 51, h: 53 }, index: 52 },
  'rex-and-dana-security-guards_053': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_053.svg', size: { w: 67, h: 52 }, index: 53 },
  'rex-and-dana-security-guards_054': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_054.svg', size: { w: 64, h: 52 }, index: 54 },
  'rex-and-dana-security-guards_055': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_055.svg', size: { w: 63, h: 52 }, index: 55 },
  'rex-and-dana-security-guards_056': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_056.svg', size: { w: 122, h: 52 }, index: 56 },
  'rex-and-dana-security-guards_057': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_057.svg', size: { w: 123, h: 52 }, index: 57 },
  'rex-and-dana-security-guards_058': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_058.svg', size: { w: 124, h: 52 }, index: 58 },
  'rex-and-dana-security-guards_059': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_059.svg', size: { w: 123, h: 52 }, index: 59 },
  'rex-and-dana-security-guards_060': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_060.svg', size: { w: 98, h: 19 }, index: 60 },
  'rex-and-dana-security-guards_061': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_061.svg', size: { w: 120, h: 18 }, index: 61 },
  'rex-and-dana-security-guards_062': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_062.svg', size: { w: 98, h: 18 }, index: 62 },
  'rex-and-dana-security-guards_063': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_063.svg', size: { w: 121, h: 18 }, index: 63 },
  'rex-and-dana-security-guards_064': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_064.svg', size: { w: 96, h: 18 }, index: 64 },
  'rex-and-dana-security-guards_065': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_065.svg', size: { w: 60, h: 77 }, index: 65 },
  'rex-and-dana-security-guards_066': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_066.svg', size: { w: 89, h: 45 }, index: 66 },
  'rex-and-dana-security-guards_067': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_067.svg', size: { w: 88, h: 45 }, index: 67 },
  'rex-and-dana-security-guards_068': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_068.svg', size: { w: 87, h: 44 }, index: 68 },
  'rex-and-dana-security-guards_069': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_069.svg', size: { w: 88, h: 43 }, index: 69 },
  'rex-and-dana-security-guards_070': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_070.svg', size: { w: 69, h: 19 }, index: 70 },
  'rex-and-dana-security-guards_071': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_071.svg', size: { w: 111, h: 19 }, index: 71 },
  'rex-and-dana-security-guards_072': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_072.svg', size: { w: 91, h: 19 }, index: 72 },
  'rex-and-dana-security-guards_073': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_073.svg', size: { w: 99, h: 19 }, index: 73 },
  'rex-and-dana-security-guards_074': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_074.svg', size: { w: 99, h: 19 }, index: 74 },
  'rex-and-dana-security-guards_075': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_075.svg', size: { w: 93, h: 19 }, index: 75 },
  'rex-and-dana-security-guards_076': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_076.svg', size: { w: 69, h: 19 }, index: 76 },
  'rex-and-dana-security-guards_077': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_077.svg', size: { w: 69, h: 19 }, index: 77 },
  'rex-and-dana-security-guards_078': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_078.svg', size: { w: 69, h: 19 }, index: 78 },
  'rex-and-dana-security-guards_079': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_079.svg', size: { w: 64, h: 19 }, index: 79 },
  'rex-and-dana-security-guards_080': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_080.svg', size: { w: 63, h: 19 }, index: 80 },
  'rex-and-dana-security-guards_081': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_081.svg', size: { w: 96, h: 81 }, index: 81 },
  'rex-and-dana-security-guards_082': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_082.svg', size: { w: 73, h: 79 }, index: 82 },
  'rex-and-dana-security-guards_083': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_083.svg', size: { w: 43, h: 50 }, index: 83 },
  'rex-and-dana-security-guards_084': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_084.svg', size: { w: 44, h: 50 }, index: 84 },
  'rex-and-dana-security-guards_085': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_085.svg', size: { w: 46, h: 49 }, index: 85 },
  'rex-and-dana-security-guards_086': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_086.svg', size: { w: 43, h: 49 }, index: 86 },
  'rex-and-dana-security-guards_087': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_087.svg', size: { w: 44, h: 49 }, index: 87 },
  'rex-and-dana-security-guards_088': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_088.svg', size: { w: 94, h: 47 }, index: 88 },
  'rex-and-dana-security-guards_089': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_089.svg', size: { w: 93, h: 47 }, index: 89 },
  'rex-and-dana-security-guards_090': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_090.svg', size: { w: 45, h: 47 }, index: 90 },
  'rex-and-dana-security-guards_091': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_091.svg', size: { w: 41, h: 46 }, index: 91 },
  'rex-and-dana-security-guards_092': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_092.svg', size: { w: 65, h: 19 }, index: 92 },
  'rex-and-dana-security-guards_093': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_093.svg', size: { w: 119, h: 19 }, index: 93 },
  'rex-and-dana-security-guards_094': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_094.svg', size: { w: 96, h: 20 }, index: 94 },
  'rex-and-dana-security-guards_095': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_095.svg', size: { w: 96, h: 19 }, index: 95 },
  'rex-and-dana-security-guards_096': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_096.svg', size: { w: 95, h: 19 }, index: 96 },
  'rex-and-dana-security-guards_097': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_097.svg', size: { w: 105, h: 19 }, index: 97 },
  'rex-and-dana-security-guards_098': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_098.svg', size: { w: 83, h: 19 }, index: 98 },
  'rex-and-dana-security-guards_099': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_099.svg', size: { w: 96, h: 19 }, index: 99 },
  'rex-and-dana-security-guards_100': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_100.svg', size: { w: 90, h: 18 }, index: 100 },
  'rex-and-dana-security-guards_101': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_101.svg', size: { w: 68, h: 18 }, index: 101 },
  'rex-and-dana-security-guards_102': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_102.svg', size: { w: 92, h: 78 }, index: 102 },
  'rex-and-dana-security-guards_103': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_103.svg', size: { w: 64, h: 82 }, index: 103 },
  'rex-and-dana-security-guards_104': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_104.svg', size: { w: 51, h: 82 }, index: 104 },
  'rex-and-dana-security-guards_105': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_105.svg', size: { w: 95, h: 51 }, index: 105 },
  'rex-and-dana-security-guards_106': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_106.svg', size: { w: 44, h: 50 }, index: 106 },
  'rex-and-dana-security-guards_107': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_107.svg', size: { w: 88, h: 45 }, index: 107 },
  'rex-and-dana-security-guards_108': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_108.svg', size: { w: 42, h: 48 }, index: 108 },
  'rex-and-dana-security-guards_109': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_109.svg', size: { w: 57, h: 48 }, index: 109 },
  'rex-and-dana-security-guards_110': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_110.svg', size: { w: 91, h: 41 }, index: 110 },
  'rex-and-dana-security-guards_111': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_111.svg', size: { w: 82, h: 39 }, index: 111 },
  'rex-and-dana-security-guards_112': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_112.svg', size: { w: 84, h: 19 }, index: 112 },
  'rex-and-dana-security-guards_113': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_113.svg', size: { w: 134, h: 19 }, index: 113 },
  'rex-and-dana-security-guards_114': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_114.svg', size: { w: 108, h: 19 }, index: 114 },
  'rex-and-dana-security-guards_115': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_115.svg', size: { w: 81, h: 19 }, index: 115 },
  'rex-and-dana-security-guards_116': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_116.svg', size: { w: 118, h: 19 }, index: 116 },
  'rex-and-dana-security-guards_117': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_117.svg', size: { w: 109, h: 19 }, index: 117 },
  'rex-and-dana-security-guards_118': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_118.svg', size: { w: 128, h: 18 }, index: 118 },
  'rex-and-dana-security-guards_119': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_119.svg', size: { w: 129, h: 19 }, index: 119 },
  'rex-and-dana-security-guards_120': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_120.svg', size: { w: 109, h: 19 }, index: 120 },
  'rex-and-dana-security-guards_121': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_121.svg', size: { w: 63, h: 50 }, index: 121 },
  'rex-and-dana-security-guards_122': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_122.svg', size: { w: 62, h: 50 }, index: 122 },
  'rex-and-dana-security-guards_123': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_123.svg', size: { w: 61, h: 50 }, index: 123 },
  'rex-and-dana-security-guards_124': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_124.svg', size: { w: 61, h: 49 }, index: 124 },
  'rex-and-dana-security-guards_125': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_125.svg', size: { w: 50, h: 47 }, index: 125 },
  'rex-and-dana-security-guards_126': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_126.svg', size: { w: 122, h: 48 }, index: 126 },
  'rex-and-dana-security-guards_127': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_127.svg', size: { w: 121, h: 48 }, index: 127 },
  'rex-and-dana-security-guards_128': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_128.svg', size: { w: 120, h: 46 }, index: 128 },
  'rex-and-dana-security-guards_129': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_129.svg', size: { w: 121, h: 46 }, index: 129 },
  'rex-and-dana-security-guards_130': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_130.svg', size: { w: 100, h: 19 }, index: 130 },
  'rex-and-dana-security-guards_131': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_131.svg', size: { w: 123, h: 19 }, index: 131 },
  'rex-and-dana-security-guards_132': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_132.svg', size: { w: 145, h: 19 }, index: 132 },
  'rex-and-dana-security-guards_133': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_133.svg', size: { w: 102, h: 19 }, index: 133 },
  'rex-and-dana-security-guards_134': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_134.svg', size: { w: 101, h: 19 }, index: 134 },
  'rex-and-dana-security-guards_135': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_135.svg', size: { w: 71, h: 19 }, index: 135 },
  'rex-and-dana-security-guards_136': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_136.svg', size: { w: 72, h: 19 }, index: 136 },
  'rex-and-dana-security-guards_137': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_137.svg', size: { w: 47, h: 82 }, index: 137 },
  'rex-and-dana-security-guards_138': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_138.svg', size: { w: 70, h: 82 }, index: 138 },
  'rex-and-dana-security-guards_139': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_139.svg', size: { w: 47, h: 82 }, index: 139 },
  'rex-and-dana-security-guards_140': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_140.svg', size: { w: 66, h: 79 }, index: 140 },
  'rex-and-dana-security-guards_141': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_141.svg', size: { w: 90, h: 79 }, index: 141 },
  'rex-and-dana-security-guards_142': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_142.svg', size: { w: 91, h: 79 }, index: 142 },
  'rex-and-dana-security-guards_143': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_143.svg', size: { w: 66, h: 80 }, index: 143 },
  'rex-and-dana-security-guards_144': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_144.svg', size: { w: 71, h: 80 }, index: 144 },
  'rex-and-dana-security-guards_145': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_145.svg', size: { w: 62, h: 80 }, index: 145 },
  'rex-and-dana-security-guards_146': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_146.svg', size: { w: 31, h: 33 }, index: 146 },
  'rex-and-dana-security-guards_147': { file: 'individual/rex-and-dana-security-guards/rex-and-dana-security-guards_147.svg', size: { w: 32, h: 33 }, index: 147 },
};

/** Rio Tanaka only */
export const SPRITES_RIO_TANAKA_ONLY: Record<string, SpriteEntry> = {
  'rio-tanaka-only_base': { file: 'individual/rio-tanaka-only/rio-tanaka-only_base.svg', size: { w: 60, h: 130 }, index: 0 },
  'rio-tanaka-only_emotion-neutral': { file: 'individual/rio-tanaka-only/rio-tanaka-only_emotion-neutral.svg', size: { w: 64, h: 85 }, index: 1 },
  'rio-tanaka-only_emotion-happy': { file: 'individual/rio-tanaka-only/rio-tanaka-only_emotion-happy.svg', size: { w: 64, h: 85 }, index: 2 },
  'rio-tanaka-only_emotion-talking': { file: 'individual/rio-tanaka-only/rio-tanaka-only_emotion-talking.svg', size: { w: 65, h: 85 }, index: 3 },
  'rio-tanaka-only_emotion-thinking': { file: 'individual/rio-tanaka-only/rio-tanaka-only_emotion-thinking.svg', size: { w: 64, h: 85 }, index: 4 },
  'rio-tanaka-only_emotion-stressed': { file: 'individual/rio-tanaka-only/rio-tanaka-only_emotion-stressed.svg', size: { w: 64, h: 85 }, index: 5 },
  'rio-tanaka-only_emotion-excited': { file: 'individual/rio-tanaka-only/rio-tanaka-only_emotion-excited.svg', size: { w: 64, h: 85 }, index: 6 },
  'rio-tanaka-only_emotion-concerned': { file: 'individual/rio-tanaka-only/rio-tanaka-only_emotion-concerned.svg', size: { w: 66, h: 85 }, index: 7 },
  'rio-tanaka-only_emotion-frustrated': { file: 'individual/rio-tanaka-only/rio-tanaka-only_emotion-frustrated.svg', size: { w: 63, h: 85 }, index: 8 },
  'rio-tanaka-only_emotion-satisfied': { file: 'individual/rio-tanaka-only/rio-tanaka-only_emotion-satisfied.svg', size: { w: 64, h: 85 }, index: 9 },
  'rio-tanaka-only_emotion-curious': { file: 'individual/rio-tanaka-only/rio-tanaka-only_emotion-curious.svg', size: { w: 69, h: 87 }, index: 10 },
  'rio-tanaka-only_emotion-celebrating': { file: 'individual/rio-tanaka-only/rio-tanaka-only_emotion-celebrating.svg', size: { w: 202, h: 91 }, index: 11 },
  'rio-tanaka-only_emotion-sleeping': { file: 'individual/rio-tanaka-only/rio-tanaka-only_emotion-sleeping.svg', size: { w: 69, h: 92 }, index: 12 },
  'rio-tanaka-only_emotion-panicking': { file: 'individual/rio-tanaka-only/rio-tanaka-only_emotion-panicking.svg', size: { w: 36, h: 64 }, index: 13 },
  'rio-tanaka-only_emotion-rushing': { file: 'individual/rio-tanaka-only/rio-tanaka-only_emotion-rushing.svg', size: { w: 119, h: 92 }, index: 14 },
  'rio-tanaka-only_idle-1': { file: 'individual/rio-tanaka-only/rio-tanaka-only_idle-1.svg', size: { w: 126, h: 92 }, index: 15 },
  'rio-tanaka-only_idle-2': { file: 'individual/rio-tanaka-only/rio-tanaka-only_idle-2.svg', size: { w: 50, h: 120 }, index: 16 },
  'rio-tanaka-only_idle-3': { file: 'individual/rio-tanaka-only/rio-tanaka-only_idle-3.svg', size: { w: 51, h: 119 }, index: 17 },
  'rio-tanaka-only_idle-4': { file: 'individual/rio-tanaka-only/rio-tanaka-only_idle-4.svg', size: { w: 50, h: 119 }, index: 18 },
  'rio-tanaka-only_typing-1': { file: 'individual/rio-tanaka-only/rio-tanaka-only_typing-1.svg', size: { w: 51, h: 120 }, index: 19 },
  'rio-tanaka-only_typing-2': { file: 'individual/rio-tanaka-only/rio-tanaka-only_typing-2.svg', size: { w: 63, h: 121 }, index: 20 },
  'rio-tanaka-only_walk-1': { file: 'individual/rio-tanaka-only/rio-tanaka-only_walk-1.svg', size: { w: 62, h: 121 }, index: 21 },
  'rio-tanaka-only_walk-2': { file: 'individual/rio-tanaka-only/rio-tanaka-only_walk-2.svg', size: { w: 60, h: 120 }, index: 22 },
  'rio-tanaka-only_walk-3': { file: 'individual/rio-tanaka-only/rio-tanaka-only_walk-3.svg', size: { w: 50, h: 120 }, index: 23 },
  'rio-tanaka-only_walk-4': { file: 'individual/rio-tanaka-only/rio-tanaka-only_walk-4.svg', size: { w: 59, h: 120 }, index: 24 },
  'rio-tanaka-only_panic-run-1': { file: 'individual/rio-tanaka-only/rio-tanaka-only_panic-run-1.svg', size: { w: 52, h: 121 }, index: 25 },
  'rio-tanaka-only_panic-run-2': { file: 'individual/rio-tanaka-only/rio-tanaka-only_panic-run-2.svg', size: { w: 128, h: 109 }, index: 26 },
  'rio-tanaka-only_panic-run-3': { file: 'individual/rio-tanaka-only/rio-tanaka-only_panic-run-3.svg', size: { w: 129, h: 109 }, index: 27 },
  'rio-tanaka-only_panic-run-4': { file: 'individual/rio-tanaka-only/rio-tanaka-only_panic-run-4.svg', size: { w: 129, h: 112 }, index: 28 },
  'rio-tanaka-only_sitting': { file: 'individual/rio-tanaka-only/rio-tanaka-only_sitting.svg', size: { w: 139, h: 117 }, index: 29 },
  'rio-tanaka-only_standup-1': { file: 'individual/rio-tanaka-only/rio-tanaka-only_standup-1.svg', size: { w: 79, h: 115 }, index: 30 },
  'rio-tanaka-only_standup-2': { file: 'individual/rio-tanaka-only/rio-tanaka-only_standup-2.svg', size: { w: 68, h: 109 }, index: 31 },
  'rio-tanaka-only_standup-3': { file: 'individual/rio-tanaka-only/rio-tanaka-only_standup-3.svg', size: { w: 79, h: 111 }, index: 32 },
  'rio-tanaka-only_celebrate-1': { file: 'individual/rio-tanaka-only/rio-tanaka-only_celebrate-1.svg', size: { w: 49, h: 114 }, index: 33 },
  'rio-tanaka-only_celebrate-2': { file: 'individual/rio-tanaka-only/rio-tanaka-only_celebrate-2.svg', size: { w: 101, h: 113 }, index: 34 },
  'rio-tanaka-only_celebrate-3': { file: 'individual/rio-tanaka-only/rio-tanaka-only_celebrate-3.svg', size: { w: 125, h: 113 }, index: 35 },
  'rio-tanaka-only_celebrate-4': { file: 'individual/rio-tanaka-only/rio-tanaka-only_celebrate-4.svg', size: { w: 106, h: 115 }, index: 36 },
  'rio-tanaka-only_talk-1': { file: 'individual/rio-tanaka-only/rio-tanaka-only_talk-1.svg', size: { w: 85, h: 124 }, index: 37 },
  'rio-tanaka-only_talk-2': { file: 'individual/rio-tanaka-only/rio-tanaka-only_talk-2.svg', size: { w: 60, h: 111 }, index: 38 },
  'rio-tanaka-only_wave': { file: 'individual/rio-tanaka-only/rio-tanaka-only_wave.svg', size: { w: 47, h: 111 }, index: 39 },
  'rio-tanaka-only_walk-home': { file: 'individual/rio-tanaka-only/rio-tanaka-only_walk-home.svg', size: { w: 65, h: 111 }, index: 40 },
  'rio-tanaka-only_elevator': { file: 'individual/rio-tanaka-only/rio-tanaka-only_elevator.svg', size: { w: 53, h: 110 }, index: 41 },
  'rio-tanaka-only_levelup-1': { file: 'individual/rio-tanaka-only/rio-tanaka-only_levelup-1.svg', size: { w: 119, h: 112 }, index: 42 },
  'rio-tanaka-only_levelup-2': { file: 'individual/rio-tanaka-only/rio-tanaka-only_levelup-2.svg', size: { w: 46, h: 129 }, index: 43 },
  'rio-tanaka-only_levelup-3': { file: 'individual/rio-tanaka-only/rio-tanaka-only_levelup-3.svg', size: { w: 91, h: 128 }, index: 44 },
  'rio-tanaka-only_levelup-4': { file: 'individual/rio-tanaka-only/rio-tanaka-only_levelup-4.svg', size: { w: 102, h: 132 }, index: 45 },
  'rio-tanaka-only_levelup-5': { file: 'individual/rio-tanaka-only/rio-tanaka-only_levelup-5.svg', size: { w: 84, h: 126 }, index: 46 },
  'rio-tanaka-only_coffee-walk-1': { file: 'individual/rio-tanaka-only/rio-tanaka-only_coffee-walk-1.svg', size: { w: 43, h: 133 }, index: 47 },
  'rio-tanaka-only_coffee-walk-2': { file: 'individual/rio-tanaka-only/rio-tanaka-only_coffee-walk-2.svg', size: { w: 72, h: 116 }, index: 48 },
  'rio-tanaka-only_late-mild': { file: 'individual/rio-tanaka-only/rio-tanaka-only_late-mild.svg', size: { w: 76, h: 115 }, index: 49 },
  'rio-tanaka-only_late-panic': { file: 'individual/rio-tanaka-only/rio-tanaka-only_late-panic.svg', size: { w: 93, h: 117 }, index: 50 },
  'rio-tanaka-only_desk-1': { file: 'individual/rio-tanaka-only/rio-tanaka-only_desk-1.svg', size: { w: 162, h: 118 }, index: 51 },
  'rio-tanaka-only_desk-2': { file: 'individual/rio-tanaka-only/rio-tanaka-only_desk-2.svg', size: { w: 71, h: 78 }, index: 52 },
  'rio-tanaka-only_desk-3': { file: 'individual/rio-tanaka-only/rio-tanaka-only_desk-3.svg', size: { w: 82, h: 78 }, index: 53 },
  'rio-tanaka-only_desk-4': { file: 'individual/rio-tanaka-only/rio-tanaka-only_desk-4.svg', size: { w: 180, h: 81 }, index: 54 },
  'rio-tanaka-only_desk-5': { file: 'individual/rio-tanaka-only/rio-tanaka-only_desk-5.svg', size: { w: 165, h: 81 }, index: 55 },
  'rio-tanaka-only_desk-6': { file: 'individual/rio-tanaka-only/rio-tanaka-only_desk-6.svg', size: { w: 100, h: 80 }, index: 56 },
  'rio-tanaka-only_desk-7': { file: 'individual/rio-tanaka-only/rio-tanaka-only_desk-7.svg', size: { w: 187, h: 81 }, index: 57 },
};

/** Sarah Chen only */
export const SPRITES_SARAH_CHEN_ONLY: Record<string, SpriteEntry> = {
  'sarah-chen-only_base': { file: 'individual/sarah-chen-only/sarah-chen-only_base.svg', size: { w: 94, h: 142 }, index: 0 },
  'sarah-chen-only_emotion-neutral': { file: 'individual/sarah-chen-only/sarah-chen-only_emotion-neutral.svg', size: { w: 100, h: 84 }, index: 1 },
  'sarah-chen-only_emotion-happy': { file: 'individual/sarah-chen-only/sarah-chen-only_emotion-happy.svg', size: { w: 100, h: 83 }, index: 2 },
  'sarah-chen-only_emotion-talking': { file: 'individual/sarah-chen-only/sarah-chen-only_emotion-talking.svg', size: { w: 100, h: 84 }, index: 3 },
  'sarah-chen-only_emotion-thinking': { file: 'individual/sarah-chen-only/sarah-chen-only_emotion-thinking.svg', size: { w: 101, h: 84 }, index: 4 },
  'sarah-chen-only_emotion-stressed': { file: 'individual/sarah-chen-only/sarah-chen-only_emotion-stressed.svg', size: { w: 101, h: 84 }, index: 5 },
  'sarah-chen-only_emotion-excited': { file: 'individual/sarah-chen-only/sarah-chen-only_emotion-excited.svg', size: { w: 101, h: 83 }, index: 6 },
  'sarah-chen-only_emotion-concerned': { file: 'individual/sarah-chen-only/sarah-chen-only_emotion-concerned.svg', size: { w: 102, h: 84 }, index: 7 },
  'sarah-chen-only_emotion-frustrated': { file: 'individual/sarah-chen-only/sarah-chen-only_emotion-frustrated.svg', size: { w: 102, h: 84 }, index: 8 },
  'sarah-chen-only_emotion-satisfied': { file: 'individual/sarah-chen-only/sarah-chen-only_emotion-satisfied.svg', size: { w: 101, h: 84 }, index: 9 },
  'sarah-chen-only_emotion-curious': { file: 'individual/sarah-chen-only/sarah-chen-only_emotion-curious.svg', size: { w: 99, h: 87 }, index: 10 },
  'sarah-chen-only_emotion-celebrating': { file: 'individual/sarah-chen-only/sarah-chen-only_emotion-celebrating.svg', size: { w: 190, h: 87 }, index: 11 },
  'sarah-chen-only_emotion-sleeping': { file: 'individual/sarah-chen-only/sarah-chen-only_emotion-sleeping.svg', size: { w: 130, h: 91 }, index: 12 },
  'sarah-chen-only_emotion-panicking': { file: 'individual/sarah-chen-only/sarah-chen-only_emotion-panicking.svg', size: { w: 127, h: 88 }, index: 13 },
  'sarah-chen-only_emotion-rushing': { file: 'individual/sarah-chen-only/sarah-chen-only_emotion-rushing.svg', size: { w: 137, h: 86 }, index: 14 },
  'sarah-chen-only_idle-1': { file: 'individual/sarah-chen-only/sarah-chen-only_idle-1.svg', size: { w: 70, h: 121 }, index: 15 },
  'sarah-chen-only_idle-2': { file: 'individual/sarah-chen-only/sarah-chen-only_idle-2.svg', size: { w: 72, h: 122 }, index: 16 },
  'sarah-chen-only_idle-3': { file: 'individual/sarah-chen-only/sarah-chen-only_idle-3.svg', size: { w: 72, h: 122 }, index: 17 },
  'sarah-chen-only_idle-4': { file: 'individual/sarah-chen-only/sarah-chen-only_idle-4.svg', size: { w: 71, h: 121 }, index: 18 },
  'sarah-chen-only_typing-1': { file: 'individual/sarah-chen-only/sarah-chen-only_typing-1.svg', size: { w: 79, h: 121 }, index: 19 },
  'sarah-chen-only_typing-2': { file: 'individual/sarah-chen-only/sarah-chen-only_typing-2.svg', size: { w: 76, h: 121 }, index: 20 },
  'sarah-chen-only_walk-1': { file: 'individual/sarah-chen-only/sarah-chen-only_walk-1.svg', size: { w: 78, h: 122 }, index: 21 },
  'sarah-chen-only_walk-2': { file: 'individual/sarah-chen-only/sarah-chen-only_walk-2.svg', size: { w: 71, h: 121 }, index: 22 },
  'sarah-chen-only_walk-3': { file: 'individual/sarah-chen-only/sarah-chen-only_walk-3.svg', size: { w: 72, h: 121 }, index: 23 },
  'sarah-chen-only_walk-4': { file: 'individual/sarah-chen-only/sarah-chen-only_walk-4.svg', size: { w: 70, h: 121 }, index: 24 },
  'sarah-chen-only_panic-run-1': { file: 'individual/sarah-chen-only/sarah-chen-only_panic-run-1.svg', size: { w: 137, h: 104 }, index: 25 },
  'sarah-chen-only_panic-run-2': { file: 'individual/sarah-chen-only/sarah-chen-only_panic-run-2.svg', size: { w: 138, h: 107 }, index: 26 },
  'sarah-chen-only_panic-run-3': { file: 'individual/sarah-chen-only/sarah-chen-only_panic-run-3.svg', size: { w: 137, h: 106 }, index: 27 },
  'sarah-chen-only_panic-run-4': { file: 'individual/sarah-chen-only/sarah-chen-only_panic-run-4.svg', size: { w: 143, h: 107 }, index: 28 },
  'sarah-chen-only_sitting': { file: 'individual/sarah-chen-only/sarah-chen-only_sitting.svg', size: { w: 87, h: 111 }, index: 29 },
  'sarah-chen-only_standup-1': { file: 'individual/sarah-chen-only/sarah-chen-only_standup-1.svg', size: { w: 78, h: 106 }, index: 30 },
  'sarah-chen-only_standup-2': { file: 'individual/sarah-chen-only/sarah-chen-only_standup-2.svg', size: { w: 86, h: 105 }, index: 31 },
  'sarah-chen-only_standup-3': { file: 'individual/sarah-chen-only/sarah-chen-only_standup-3.svg', size: { w: 57, h: 109 }, index: 32 },
  'sarah-chen-only_celebrate-1': { file: 'individual/sarah-chen-only/sarah-chen-only_celebrate-1.svg', size: { w: 108, h: 115 }, index: 33 },
  'sarah-chen-only_celebrate-2': { file: 'individual/sarah-chen-only/sarah-chen-only_celebrate-2.svg', size: { w: 129, h: 115 }, index: 34 },
  'sarah-chen-only_celebrate-3': { file: 'individual/sarah-chen-only/sarah-chen-only_celebrate-3.svg', size: { w: 112, h: 115 }, index: 35 },
  'sarah-chen-only_celebrate-4': { file: 'individual/sarah-chen-only/sarah-chen-only_celebrate-4.svg', size: { w: 93, h: 122 }, index: 36 },
  'sarah-chen-only_talk-1': { file: 'individual/sarah-chen-only/sarah-chen-only_talk-1.svg', size: { w: 73, h: 112 }, index: 37 },
  'sarah-chen-only_talk-2': { file: 'individual/sarah-chen-only/sarah-chen-only_talk-2.svg', size: { w: 61, h: 112 }, index: 38 },
  'sarah-chen-only_wave': { file: 'individual/sarah-chen-only/sarah-chen-only_wave.svg', size: { w: 67, h: 111 }, index: 39 },
  'sarah-chen-only_walk-home': { file: 'individual/sarah-chen-only/sarah-chen-only_walk-home.svg', size: { w: 59, h: 110 }, index: 40 },
  'sarah-chen-only_elevator': { file: 'individual/sarah-chen-only/sarah-chen-only_elevator.svg', size: { w: 129, h: 116 }, index: 41 },
  'sarah-chen-only_levelup-1': { file: 'individual/sarah-chen-only/sarah-chen-only_levelup-1.svg', size: { w: 66, h: 134 }, index: 42 },
  'sarah-chen-only_levelup-2': { file: 'individual/sarah-chen-only/sarah-chen-only_levelup-2.svg', size: { w: 94, h: 134 }, index: 43 },
  'sarah-chen-only_levelup-3': { file: 'individual/sarah-chen-only/sarah-chen-only_levelup-3.svg', size: { w: 99, h: 137 }, index: 44 },
  'sarah-chen-only_levelup-4': { file: 'individual/sarah-chen-only/sarah-chen-only_levelup-4.svg', size: { w: 89, h: 133 }, index: 45 },
  'sarah-chen-only_levelup-5': { file: 'individual/sarah-chen-only/sarah-chen-only_levelup-5.svg', size: { w: 56, h: 135 }, index: 46 },
  'sarah-chen-only_coffee-walk-1': { file: 'individual/sarah-chen-only/sarah-chen-only_coffee-walk-1.svg', size: { w: 86, h: 116 }, index: 47 },
  'sarah-chen-only_coffee-walk-2': { file: 'individual/sarah-chen-only/sarah-chen-only_coffee-walk-2.svg', size: { w: 85, h: 116 }, index: 48 },
  'sarah-chen-only_late-mild': { file: 'individual/sarah-chen-only/sarah-chen-only_late-mild.svg', size: { w: 107, h: 116 }, index: 49 },
  'sarah-chen-only_late-panic': { file: 'individual/sarah-chen-only/sarah-chen-only_late-panic.svg', size: { w: 179, h: 118 }, index: 50 },
  'sarah-chen-only_desk-1': { file: 'individual/sarah-chen-only/sarah-chen-only_desk-1.svg', size: { w: 93, h: 75 }, index: 51 },
  'sarah-chen-only_desk-2': { file: 'individual/sarah-chen-only/sarah-chen-only_desk-2.svg', size: { w: 136, h: 74 }, index: 52 },
  'sarah-chen-only_desk-3': { file: 'individual/sarah-chen-only/sarah-chen-only_desk-3.svg', size: { w: 133, h: 75 }, index: 53 },
};

/** Speech bubbles and UI elements */
export const SPRITES_SPEECH_BUBBLES_AND_UI_ELEMENTS: Record<string, SpriteEntry> = {
  'speech-bubbles-and-ui-elements_000': { file: 'individual/speech-bubbles-and-ui-elements/speech-bubbles-and-ui-elements_000.svg', size: { w: 121, h: 22 }, index: 0 },
  'speech-bubbles-and-ui-elements_001': { file: 'individual/speech-bubbles-and-ui-elements/speech-bubbles-and-ui-elements_001.svg', size: { w: 114, h: 22 }, index: 1 },
  'speech-bubbles-and-ui-elements_002': { file: 'individual/speech-bubbles-and-ui-elements/speech-bubbles-and-ui-elements_002.svg', size: { w: 28, h: 22 }, index: 2 },
  'speech-bubbles-and-ui-elements_003': { file: 'individual/speech-bubbles-and-ui-elements/speech-bubbles-and-ui-elements_003.svg', size: { w: 38, h: 25 }, index: 3 },
  'speech-bubbles-and-ui-elements_004': { file: 'individual/speech-bubbles-and-ui-elements/speech-bubbles-and-ui-elements_004.svg', size: { w: 38, h: 23 }, index: 4 },
  'speech-bubbles-and-ui-elements_005': { file: 'individual/speech-bubbles-and-ui-elements/speech-bubbles-and-ui-elements_005.svg', size: { w: 47, h: 25 }, index: 5 },
  'speech-bubbles-and-ui-elements_006': { file: 'individual/speech-bubbles-and-ui-elements/speech-bubbles-and-ui-elements_006.svg', size: { w: 47, h: 25 }, index: 6 },
  'speech-bubbles-and-ui-elements_007': { file: 'individual/speech-bubbles-and-ui-elements/speech-bubbles-and-ui-elements_007.svg', size: { w: 28, h: 25 }, index: 7 },
  'speech-bubbles-and-ui-elements_008': { file: 'individual/speech-bubbles-and-ui-elements/speech-bubbles-and-ui-elements_008.svg', size: { w: 122, h: 22 }, index: 8 },
  'speech-bubbles-and-ui-elements_009': { file: 'individual/speech-bubbles-and-ui-elements/speech-bubbles-and-ui-elements_009.svg', size: { w: 122, h: 22 }, index: 9 },
  'speech-bubbles-and-ui-elements_010': { file: 'individual/speech-bubbles-and-ui-elements/speech-bubbles-and-ui-elements_010.svg', size: { w: 191, h: 24 }, index: 10 },
  'speech-bubbles-and-ui-elements_011': { file: 'individual/speech-bubbles-and-ui-elements/speech-bubbles-and-ui-elements_011.svg', size: { w: 194, h: 24 }, index: 11 },
  'speech-bubbles-and-ui-elements_012': { file: 'individual/speech-bubbles-and-ui-elements/speech-bubbles-and-ui-elements_012.svg', size: { w: 68, h: 19 }, index: 12 },
  'speech-bubbles-and-ui-elements_013': { file: 'individual/speech-bubbles-and-ui-elements/speech-bubbles-and-ui-elements_013.svg', size: { w: 72, h: 19 }, index: 13 },
  'speech-bubbles-and-ui-elements_014': { file: 'individual/speech-bubbles-and-ui-elements/speech-bubbles-and-ui-elements_014.svg', size: { w: 29, h: 270 }, index: 14 },
  'speech-bubbles-and-ui-elements_015': { file: 'individual/speech-bubbles-and-ui-elements/speech-bubbles-and-ui-elements_015.svg', size: { w: 340, h: 199 }, index: 15 },
  'speech-bubbles-and-ui-elements_016': { file: 'individual/speech-bubbles-and-ui-elements/speech-bubbles-and-ui-elements_016.svg', size: { w: 359, h: 294 }, index: 16 },
  'speech-bubbles-and-ui-elements_017': { file: 'individual/speech-bubbles-and-ui-elements/speech-bubbles-and-ui-elements_017.svg', size: { w: 354, h: 287 }, index: 17 },
  'speech-bubbles-and-ui-elements_018': { file: 'individual/speech-bubbles-and-ui-elements/speech-bubbles-and-ui-elements_018.svg', size: { w: 103, h: 86 }, index: 18 },
  'speech-bubbles-and-ui-elements_019': { file: 'individual/speech-bubbles-and-ui-elements/speech-bubbles-and-ui-elements_019.svg', size: { w: 81, h: 50 }, index: 19 },
  'speech-bubbles-and-ui-elements_020': { file: 'individual/speech-bubbles-and-ui-elements/speech-bubbles-and-ui-elements_020.svg', size: { w: 31, h: 32 }, index: 20 },
  'speech-bubbles-and-ui-elements_021': { file: 'individual/speech-bubbles-and-ui-elements/speech-bubbles-and-ui-elements_021.svg', size: { w: 51, h: 51 }, index: 21 },
  'speech-bubbles-and-ui-elements_022': { file: 'individual/speech-bubbles-and-ui-elements/speech-bubbles-and-ui-elements_022.svg', size: { w: 30, h: 31 }, index: 22 },
  'speech-bubbles-and-ui-elements_023': { file: 'individual/speech-bubbles-and-ui-elements/speech-bubbles-and-ui-elements_023.svg', size: { w: 115, h: 22 }, index: 23 },
  'speech-bubbles-and-ui-elements_024': { file: 'individual/speech-bubbles-and-ui-elements/speech-bubbles-and-ui-elements_024.svg', size: { w: 171, h: 22 }, index: 24 },
  'speech-bubbles-and-ui-elements_025': { file: 'individual/speech-bubbles-and-ui-elements/speech-bubbles-and-ui-elements_025.svg', size: { w: 122, h: 23 }, index: 25 },
  'speech-bubbles-and-ui-elements_026': { file: 'individual/speech-bubbles-and-ui-elements/speech-bubbles-and-ui-elements_026.svg', size: { w: 123, h: 22 }, index: 26 },
  'speech-bubbles-and-ui-elements_027': { file: 'individual/speech-bubbles-and-ui-elements/speech-bubbles-and-ui-elements_027.svg', size: { w: 114, h: 22 }, index: 27 },
  'speech-bubbles-and-ui-elements_028': { file: 'individual/speech-bubbles-and-ui-elements/speech-bubbles-and-ui-elements_028.svg', size: { w: 89, h: 23 }, index: 28 },
  'speech-bubbles-and-ui-elements_029': { file: 'individual/speech-bubbles-and-ui-elements/speech-bubbles-and-ui-elements_029.svg', size: { w: 25, h: 80 }, index: 29 },
  'speech-bubbles-and-ui-elements_030': { file: 'individual/speech-bubbles-and-ui-elements/speech-bubbles-and-ui-elements_030.svg', size: { w: 111, h: 170 }, index: 30 },
  'speech-bubbles-and-ui-elements_031': { file: 'individual/speech-bubbles-and-ui-elements/speech-bubbles-and-ui-elements_031.svg', size: { w: 110, h: 170 }, index: 31 },
  'speech-bubbles-and-ui-elements_032': { file: 'individual/speech-bubbles-and-ui-elements/speech-bubbles-and-ui-elements_032.svg', size: { w: 307, h: 127 }, index: 32 },
  'speech-bubbles-and-ui-elements_033': { file: 'individual/speech-bubbles-and-ui-elements/speech-bubbles-and-ui-elements_033.svg', size: { w: 309, h: 128 }, index: 33 },
  'speech-bubbles-and-ui-elements_034': { file: 'individual/speech-bubbles-and-ui-elements/speech-bubbles-and-ui-elements_034.svg', size: { w: 46, h: 45 }, index: 34 },
  'speech-bubbles-and-ui-elements_035': { file: 'individual/speech-bubbles-and-ui-elements/speech-bubbles-and-ui-elements_035.svg', size: { w: 25, h: 78 }, index: 35 },
  'speech-bubbles-and-ui-elements_036': { file: 'individual/speech-bubbles-and-ui-elements/speech-bubbles-and-ui-elements_036.svg', size: { w: 116, h: 22 }, index: 36 },
  'speech-bubbles-and-ui-elements_037': { file: 'individual/speech-bubbles-and-ui-elements/speech-bubbles-and-ui-elements_037.svg', size: { w: 194, h: 22 }, index: 37 },
  'speech-bubbles-and-ui-elements_038': { file: 'individual/speech-bubbles-and-ui-elements/speech-bubbles-and-ui-elements_038.svg', size: { w: 175, h: 26 }, index: 38 },
  'speech-bubbles-and-ui-elements_039': { file: 'individual/speech-bubbles-and-ui-elements/speech-bubbles-and-ui-elements_039.svg', size: { w: 122, h: 23 }, index: 39 },
  'speech-bubbles-and-ui-elements_040': { file: 'individual/speech-bubbles-and-ui-elements/speech-bubbles-and-ui-elements_040.svg', size: { w: 473, h: 113 }, index: 40 },
  'speech-bubbles-and-ui-elements_041': { file: 'individual/speech-bubbles-and-ui-elements/speech-bubbles-and-ui-elements_041.svg', size: { w: 458, h: 111 }, index: 41 },
};

/** Windows and floor tiles and elevator */
export const SPRITES_WINDOWS_AND_FLOOR_TILES_AND_ELEVATOR: Record<string, SpriteEntry> = {
  'windows-and-floor-tiles-and-elevator_000': { file: 'individual/windows-and-floor-tiles-and-elevator/windows-and-floor-tiles-and-elevator_000.svg', size: { w: 123, h: 23 }, index: 0 },
  'windows-and-floor-tiles-and-elevator_001': { file: 'individual/windows-and-floor-tiles-and-elevator/windows-and-floor-tiles-and-elevator_001.svg', size: { w: 122, h: 23 }, index: 1 },
  'windows-and-floor-tiles-and-elevator_002': { file: 'individual/windows-and-floor-tiles-and-elevator/windows-and-floor-tiles-and-elevator_002.svg', size: { w: 121, h: 23 }, index: 2 },
  'windows-and-floor-tiles-and-elevator_003': { file: 'individual/windows-and-floor-tiles-and-elevator/windows-and-floor-tiles-and-elevator_003.svg', size: { w: 122, h: 23 }, index: 3 },
  'windows-and-floor-tiles-and-elevator_004': { file: 'individual/windows-and-floor-tiles-and-elevator/windows-and-floor-tiles-and-elevator_004.svg', size: { w: 125, h: 26 }, index: 4 },
  'windows-and-floor-tiles-and-elevator_005': { file: 'individual/windows-and-floor-tiles-and-elevator/windows-and-floor-tiles-and-elevator_005.svg', size: { w: 130, h: 25 }, index: 5 },
  'windows-and-floor-tiles-and-elevator_006': { file: 'individual/windows-and-floor-tiles-and-elevator/windows-and-floor-tiles-and-elevator_006.svg', size: { w: 106, h: 20 }, index: 6 },
  'windows-and-floor-tiles-and-elevator_007': { file: 'individual/windows-and-floor-tiles-and-elevator/windows-and-floor-tiles-and-elevator_007.svg', size: { w: 114, h: 19 }, index: 7 },
  'windows-and-floor-tiles-and-elevator_008': { file: 'individual/windows-and-floor-tiles-and-elevator/windows-and-floor-tiles-and-elevator_008.svg', size: { w: 358, h: 402 }, index: 8 },
  'windows-and-floor-tiles-and-elevator_009': { file: 'individual/windows-and-floor-tiles-and-elevator/windows-and-floor-tiles-and-elevator_009.svg', size: { w: 355, h: 402 }, index: 9 },
  'windows-and-floor-tiles-and-elevator_010': { file: 'individual/windows-and-floor-tiles-and-elevator/windows-and-floor-tiles-and-elevator_010.svg', size: { w: 357, h: 402 }, index: 10 },
  'windows-and-floor-tiles-and-elevator_011': { file: 'individual/windows-and-floor-tiles-and-elevator/windows-and-floor-tiles-and-elevator_011.svg', size: { w: 356, h: 402 }, index: 11 },
  'windows-and-floor-tiles-and-elevator_012': { file: 'individual/windows-and-floor-tiles-and-elevator/windows-and-floor-tiles-and-elevator_012.svg', size: { w: 154, h: 26 }, index: 12 },
  'windows-and-floor-tiles-and-elevator_013': { file: 'individual/windows-and-floor-tiles-and-elevator/windows-and-floor-tiles-and-elevator_013.svg', size: { w: 117, h: 22 }, index: 13 },
  'windows-and-floor-tiles-and-elevator_014': { file: 'individual/windows-and-floor-tiles-and-elevator/windows-and-floor-tiles-and-elevator_014.svg', size: { w: 100, h: 21 }, index: 14 },
  'windows-and-floor-tiles-and-elevator_015': { file: 'individual/windows-and-floor-tiles-and-elevator/windows-and-floor-tiles-and-elevator_015.svg', size: { w: 117, h: 22 }, index: 15 },
  'windows-and-floor-tiles-and-elevator_016': { file: 'individual/windows-and-floor-tiles-and-elevator/windows-and-floor-tiles-and-elevator_016.svg', size: { w: 116, h: 22 }, index: 16 },
  'windows-and-floor-tiles-and-elevator_017': { file: 'individual/windows-and-floor-tiles-and-elevator/windows-and-floor-tiles-and-elevator_017.svg', size: { w: 117, h: 22 }, index: 17 },
  'windows-and-floor-tiles-and-elevator_018': { file: 'individual/windows-and-floor-tiles-and-elevator/windows-and-floor-tiles-and-elevator_018.svg', size: { w: 127, h: 21 }, index: 18 },
  'windows-and-floor-tiles-and-elevator_019': { file: 'individual/windows-and-floor-tiles-and-elevator/windows-and-floor-tiles-and-elevator_019.svg', size: { w: 144, h: 19 }, index: 19 },
  'windows-and-floor-tiles-and-elevator_020': { file: 'individual/windows-and-floor-tiles-and-elevator/windows-and-floor-tiles-and-elevator_020.svg', size: { w: 352, h: 394 }, index: 20 },
  'windows-and-floor-tiles-and-elevator_021': { file: 'individual/windows-and-floor-tiles-and-elevator/windows-and-floor-tiles-and-elevator_021.svg', size: { w: 348, h: 394 }, index: 21 },
  'windows-and-floor-tiles-and-elevator_022': { file: 'individual/windows-and-floor-tiles-and-elevator/windows-and-floor-tiles-and-elevator_022.svg', size: { w: 298, h: 319 }, index: 22 },
  'windows-and-floor-tiles-and-elevator_023': { file: 'individual/windows-and-floor-tiles-and-elevator/windows-and-floor-tiles-and-elevator_023.svg', size: { w: 344, h: 204 }, index: 23 },
};

/** Zara, Leo, Nadia, Maya (batch) */
export const SPRITES_ZARA_LEO_NADIA_MAYA_BATCH: Record<string, SpriteEntry> = {
  'zara-leo-nadia-maya-batch_000': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_000.svg', size: { w: 79, h: 17 }, index: 0 },
  'zara-leo-nadia-maya-batch_001': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_001.svg', size: { w: 127, h: 17 }, index: 1 },
  'zara-leo-nadia-maya-batch_002': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_002.svg', size: { w: 92, h: 17 }, index: 2 },
  'zara-leo-nadia-maya-batch_003': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_003.svg', size: { w: 126, h: 17 }, index: 3 },
  'zara-leo-nadia-maya-batch_004': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_004.svg', size: { w: 114, h: 17 }, index: 4 },
  'zara-leo-nadia-maya-batch_005': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_005.svg', size: { w: 111, h: 17 }, index: 5 },
  'zara-leo-nadia-maya-batch_006': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_006.svg', size: { w: 95, h: 17 }, index: 6 },
  'zara-leo-nadia-maya-batch_007': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_007.svg', size: { w: 126, h: 17 }, index: 7 },
  'zara-leo-nadia-maya-batch_008': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_008.svg', size: { w: 124, h: 16 }, index: 8 },
  'zara-leo-nadia-maya-batch_009': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_009.svg', size: { w: 124, h: 16 }, index: 9 },
  'zara-leo-nadia-maya-batch_010': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_010.svg', size: { w: 44, h: 61 }, index: 10 },
  'zara-leo-nadia-maya-batch_011': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_011.svg', size: { w: 42, h: 60 }, index: 11 },
  'zara-leo-nadia-maya-batch_012': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_012.svg', size: { w: 43, h: 59 }, index: 12 },
  'zara-leo-nadia-maya-batch_013': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_013.svg', size: { w: 45, h: 59 }, index: 13 },
  'zara-leo-nadia-maya-batch_014': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_014.svg', size: { w: 45, h: 59 }, index: 14 },
  'zara-leo-nadia-maya-batch_015': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_015.svg', size: { w: 47, h: 59 }, index: 15 },
  'zara-leo-nadia-maya-batch_016': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_016.svg', size: { w: 42, h: 59 }, index: 16 },
  'zara-leo-nadia-maya-batch_017': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_017.svg', size: { w: 42, h: 60 }, index: 17 },
  'zara-leo-nadia-maya-batch_018': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_018.svg', size: { w: 42, h: 60 }, index: 18 },
  'zara-leo-nadia-maya-batch_019': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_019.svg', size: { w: 42, h: 60 }, index: 19 },
  'zara-leo-nadia-maya-batch_020': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_020.svg', size: { w: 115, h: 16 }, index: 20 },
  'zara-leo-nadia-maya-batch_021': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_021.svg', size: { w: 118, h: 16 }, index: 21 },
  'zara-leo-nadia-maya-batch_022': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_022.svg', size: { w: 112, h: 16 }, index: 22 },
  'zara-leo-nadia-maya-batch_023': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_023.svg', size: { w: 113, h: 17 }, index: 23 },
  'zara-leo-nadia-maya-batch_024': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_024.svg', size: { w: 106, h: 16 }, index: 24 },
  'zara-leo-nadia-maya-batch_025': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_025.svg', size: { w: 42, h: 48 }, index: 25 },
  'zara-leo-nadia-maya-batch_026': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_026.svg', size: { w: 42, h: 48 }, index: 26 },
  'zara-leo-nadia-maya-batch_027': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_027.svg', size: { w: 70, h: 48 }, index: 27 },
  'zara-leo-nadia-maya-batch_028': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_028.svg', size: { w: 51, h: 48 }, index: 28 },
  'zara-leo-nadia-maya-batch_029': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_029.svg', size: { w: 69, h: 48 }, index: 29 },
  'zara-leo-nadia-maya-batch_030': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_030.svg', size: { w: 35, h: 36 }, index: 30 },
  'zara-leo-nadia-maya-batch_031': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_031.svg', size: { w: 33, h: 34 }, index: 31 },
  'zara-leo-nadia-maya-batch_032': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_032.svg', size: { w: 100, h: 17 }, index: 32 },
  'zara-leo-nadia-maya-batch_033': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_033.svg', size: { w: 86, h: 17 }, index: 33 },
  'zara-leo-nadia-maya-batch_034': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_034.svg', size: { w: 71, h: 17 }, index: 34 },
  'zara-leo-nadia-maya-batch_035': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_035.svg', size: { w: 86, h: 17 }, index: 35 },
  'zara-leo-nadia-maya-batch_036': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_036.svg', size: { w: 107, h: 17 }, index: 36 },
  'zara-leo-nadia-maya-batch_037': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_037.svg', size: { w: 79, h: 17 }, index: 37 },
  'zara-leo-nadia-maya-batch_038': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_038.svg', size: { w: 108, h: 17 }, index: 38 },
  'zara-leo-nadia-maya-batch_039': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_039.svg', size: { w: 75, h: 17 }, index: 39 },
  'zara-leo-nadia-maya-batch_040': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_040.svg', size: { w: 93, h: 17 }, index: 40 },
  'zara-leo-nadia-maya-batch_041': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_041.svg', size: { w: 79, h: 17 }, index: 41 },
  'zara-leo-nadia-maya-batch_042': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_042.svg', size: { w: 40, h: 56 }, index: 42 },
  'zara-leo-nadia-maya-batch_043': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_043.svg', size: { w: 39, h: 55 }, index: 43 },
  'zara-leo-nadia-maya-batch_044': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_044.svg', size: { w: 38, h: 56 }, index: 44 },
  'zara-leo-nadia-maya-batch_045': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_045.svg', size: { w: 39, h: 56 }, index: 45 },
  'zara-leo-nadia-maya-batch_046': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_046.svg', size: { w: 47, h: 56 }, index: 46 },
  'zara-leo-nadia-maya-batch_047': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_047.svg', size: { w: 53, h: 56 }, index: 47 },
  'zara-leo-nadia-maya-batch_048': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_048.svg', size: { w: 49, h: 56 }, index: 48 },
  'zara-leo-nadia-maya-batch_049': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_049.svg', size: { w: 47, h: 56 }, index: 49 },
  'zara-leo-nadia-maya-batch_050': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_050.svg', size: { w: 46, h: 55 }, index: 50 },
  'zara-leo-nadia-maya-batch_051': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_051.svg', size: { w: 42, h: 56 }, index: 51 },
  'zara-leo-nadia-maya-batch_052': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_052.svg', size: { w: 115, h: 17 }, index: 52 },
  'zara-leo-nadia-maya-batch_053': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_053.svg', size: { w: 101, h: 17 }, index: 53 },
  'zara-leo-nadia-maya-batch_054': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_054.svg', size: { w: 116, h: 17 }, index: 54 },
  'zara-leo-nadia-maya-batch_055': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_055.svg', size: { w: 116, h: 17 }, index: 55 },
  'zara-leo-nadia-maya-batch_056': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_056.svg', size: { w: 103, h: 17 }, index: 56 },
  'zara-leo-nadia-maya-batch_057': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_057.svg', size: { w: 90, h: 17 }, index: 57 },
  'zara-leo-nadia-maya-batch_058': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_058.svg', size: { w: 109, h: 17 }, index: 58 },
  'zara-leo-nadia-maya-batch_059': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_059.svg', size: { w: 94, h: 17 }, index: 59 },
  'zara-leo-nadia-maya-batch_060': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_060.svg', size: { w: 81, h: 17 }, index: 60 },
  'zara-leo-nadia-maya-batch_061': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_061.svg', size: { w: 100, h: 17 }, index: 61 },
  'zara-leo-nadia-maya-batch_062': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_062.svg', size: { w: 86, h: 17 }, index: 62 },
  'zara-leo-nadia-maya-batch_063': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_063.svg', size: { w: 59, h: 59 }, index: 63 },
  'zara-leo-nadia-maya-batch_064': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_064.svg', size: { w: 61, h: 59 }, index: 64 },
  'zara-leo-nadia-maya-batch_065': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_065.svg', size: { w: 89, h: 59 }, index: 65 },
  'zara-leo-nadia-maya-batch_066': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_066.svg', size: { w: 90, h: 59 }, index: 66 },
  'zara-leo-nadia-maya-batch_067': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_067.svg', size: { w: 92, h: 60 }, index: 67 },
  'zara-leo-nadia-maya-batch_068': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_068.svg', size: { w: 55, h: 62 }, index: 68 },
  'zara-leo-nadia-maya-batch_069': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_069.svg', size: { w: 43, h: 63 }, index: 69 },
  'zara-leo-nadia-maya-batch_070': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_070.svg', size: { w: 45, h: 63 }, index: 70 },
  'zara-leo-nadia-maya-batch_071': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_071.svg', size: { w: 42, h: 64 }, index: 71 },
  'zara-leo-nadia-maya-batch_072': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_072.svg', size: { w: 47, h: 61 }, index: 72 },
  'zara-leo-nadia-maya-batch_073': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_073.svg', size: { w: 87, h: 55 }, index: 73 },
  'zara-leo-nadia-maya-batch_074': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_074.svg', size: { w: 89, h: 16 }, index: 74 },
  'zara-leo-nadia-maya-batch_075': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_075.svg', size: { w: 90, h: 17 }, index: 75 },
  'zara-leo-nadia-maya-batch_076': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_076.svg', size: { w: 90, h: 17 }, index: 76 },
  'zara-leo-nadia-maya-batch_077': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_077.svg', size: { w: 92, h: 17 }, index: 77 },
  'zara-leo-nadia-maya-batch_078': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_078.svg', size: { w: 72, h: 16 }, index: 78 },
  'zara-leo-nadia-maya-batch_079': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_079.svg', size: { w: 71, h: 17 }, index: 79 },
  'zara-leo-nadia-maya-batch_080': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_080.svg', size: { w: 122, h: 17 }, index: 80 },
  'zara-leo-nadia-maya-batch_081': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_081.svg', size: { w: 92, h: 17 }, index: 81 },
  'zara-leo-nadia-maya-batch_082': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_082.svg', size: { w: 113, h: 16 }, index: 82 },
  'zara-leo-nadia-maya-batch_083': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_083.svg', size: { w: 108, h: 17 }, index: 83 },
  'zara-leo-nadia-maya-batch_084': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_084.svg', size: { w: 104, h: 16 }, index: 84 },
  'zara-leo-nadia-maya-batch_085': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_085.svg', size: { w: 51, h: 58 }, index: 85 },
  'zara-leo-nadia-maya-batch_086': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_086.svg', size: { w: 47, h: 58 }, index: 86 },
  'zara-leo-nadia-maya-batch_087': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_087.svg', size: { w: 48, h: 58 }, index: 87 },
  'zara-leo-nadia-maya-batch_088': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_088.svg', size: { w: 48, h: 58 }, index: 88 },
  'zara-leo-nadia-maya-batch_089': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_089.svg', size: { w: 48, h: 58 }, index: 89 },
  'zara-leo-nadia-maya-batch_090': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_090.svg', size: { w: 51, h: 58 }, index: 90 },
  'zara-leo-nadia-maya-batch_091': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_091.svg', size: { w: 54, h: 58 }, index: 91 },
  'zara-leo-nadia-maya-batch_092': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_092.svg', size: { w: 52, h: 58 }, index: 92 },
  'zara-leo-nadia-maya-batch_093': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_093.svg', size: { w: 117, h: 67 }, index: 93 },
  'zara-leo-nadia-maya-batch_094': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_094.svg', size: { w: 47, h: 57 }, index: 94 },
  'zara-leo-nadia-maya-batch_095': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_095.svg', size: { w: 56, h: 57 }, index: 95 },
  'zara-leo-nadia-maya-batch_096': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_096.svg', size: { w: 63, h: 73 }, index: 96 },
  'zara-leo-nadia-maya-batch_097': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_097.svg', size: { w: 54, h: 72 }, index: 97 },
  'zara-leo-nadia-maya-batch_098': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_098.svg', size: { w: 85, h: 72 }, index: 98 },
  'zara-leo-nadia-maya-batch_099': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_099.svg', size: { w: 84, h: 75 }, index: 99 },
  'zara-leo-nadia-maya-batch_100': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_100.svg', size: { w: 47, h: 86 }, index: 100 },
  'zara-leo-nadia-maya-batch_101': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_101.svg', size: { w: 62, h: 17 }, index: 101 },
  'zara-leo-nadia-maya-batch_102': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_102.svg', size: { w: 102, h: 18 }, index: 102 },
  'zara-leo-nadia-maya-batch_103': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_103.svg', size: { w: 110, h: 17 }, index: 103 },
  'zara-leo-nadia-maya-batch_104': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_104.svg', size: { w: 131, h: 17 }, index: 104 },
  'zara-leo-nadia-maya-batch_105': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_105.svg', size: { w: 121, h: 17 }, index: 105 },
  'zara-leo-nadia-maya-batch_106': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_106.svg', size: { w: 106, h: 17 }, index: 106 },
  'zara-leo-nadia-maya-batch_107': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_107.svg', size: { w: 104, h: 18 }, index: 107 },
  'zara-leo-nadia-maya-batch_108': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_108.svg', size: { w: 126, h: 17 }, index: 108 },
  'zara-leo-nadia-maya-batch_109': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_109.svg', size: { w: 131, h: 17 }, index: 109 },
  'zara-leo-nadia-maya-batch_110': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_110.svg', size: { w: 113, h: 17 }, index: 110 },
  'zara-leo-nadia-maya-batch_111': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_111.svg', size: { w: 45, h: 63 }, index: 111 },
  'zara-leo-nadia-maya-batch_112': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_112.svg', size: { w: 45, h: 63 }, index: 112 },
  'zara-leo-nadia-maya-batch_113': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_113.svg', size: { w: 52, h: 63 }, index: 113 },
  'zara-leo-nadia-maya-batch_114': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_114.svg', size: { w: 47, h: 63 }, index: 114 },
  'zara-leo-nadia-maya-batch_115': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_115.svg', size: { w: 45, h: 63 }, index: 115 },
  'zara-leo-nadia-maya-batch_116': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_116.svg', size: { w: 45, h: 63 }, index: 116 },
  'zara-leo-nadia-maya-batch_117': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_117.svg', size: { w: 38, h: 33 }, index: 117 },
  'zara-leo-nadia-maya-batch_118': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_118.svg', size: { w: 47, h: 33 }, index: 118 },
  'zara-leo-nadia-maya-batch_119': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_119.svg', size: { w: 40, h: 33 }, index: 119 },
  'zara-leo-nadia-maya-batch_120': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_120.svg', size: { w: 41, h: 33 }, index: 120 },
  'zara-leo-nadia-maya-batch_121': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_121.svg', size: { w: 114, h: 17 }, index: 121 },
  'zara-leo-nadia-maya-batch_122': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_122.svg', size: { w: 122, h: 16 }, index: 122 },
  'zara-leo-nadia-maya-batch_123': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_123.svg', size: { w: 117, h: 17 }, index: 123 },
  'zara-leo-nadia-maya-batch_124': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_124.svg', size: { w: 112, h: 17 }, index: 124 },
  'zara-leo-nadia-maya-batch_125': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_125.svg', size: { w: 111, h: 17 }, index: 125 },
  'zara-leo-nadia-maya-batch_126': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_126.svg', size: { w: 71, h: 53 }, index: 126 },
  'zara-leo-nadia-maya-batch_127': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_127.svg', size: { w: 38, h: 30 }, index: 127 },
  'zara-leo-nadia-maya-batch_128': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_128.svg', size: { w: 39, h: 29 }, index: 128 },
  'zara-leo-nadia-maya-batch_129': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_129.svg', size: { w: 39, h: 26 }, index: 129 },
  'zara-leo-nadia-maya-batch_130': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_130.svg', size: { w: 49, h: 24 }, index: 130 },
  'zara-leo-nadia-maya-batch_131': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_131.svg', size: { w: 72, h: 17 }, index: 131 },
  'zara-leo-nadia-maya-batch_132': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_132.svg', size: { w: 142, h: 17 }, index: 132 },
  'zara-leo-nadia-maya-batch_133': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_133.svg', size: { w: 122, h: 18 }, index: 133 },
  'zara-leo-nadia-maya-batch_134': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_134.svg', size: { w: 131, h: 16 }, index: 134 },
  'zara-leo-nadia-maya-batch_135': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_135.svg', size: { w: 108, h: 16 }, index: 135 },
  'zara-leo-nadia-maya-batch_136': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_136.svg', size: { w: 125, h: 16 }, index: 136 },
  'zara-leo-nadia-maya-batch_137': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_137.svg', size: { w: 122, h: 16 }, index: 137 },
  'zara-leo-nadia-maya-batch_138': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_138.svg', size: { w: 120, h: 16 }, index: 138 },
  'zara-leo-nadia-maya-batch_139': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_139.svg', size: { w: 124, h: 16 }, index: 139 },
  'zara-leo-nadia-maya-batch_140': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_140.svg', size: { w: 119, h: 16 }, index: 140 },
  'zara-leo-nadia-maya-batch_141': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_141.svg', size: { w: 130, h: 16 }, index: 141 },
  'zara-leo-nadia-maya-batch_142': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_142.svg', size: { w: 52, h: 62 }, index: 142 },
  'zara-leo-nadia-maya-batch_143': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_143.svg', size: { w: 53, h: 62 }, index: 143 },
  'zara-leo-nadia-maya-batch_144': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_144.svg', size: { w: 51, h: 62 }, index: 144 },
  'zara-leo-nadia-maya-batch_145': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_145.svg', size: { w: 53, h: 64 }, index: 145 },
  'zara-leo-nadia-maya-batch_146': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_146.svg', size: { w: 52, h: 64 }, index: 146 },
  'zara-leo-nadia-maya-batch_147': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_147.svg', size: { w: 53, h: 65 }, index: 147 },
  'zara-leo-nadia-maya-batch_148': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_148.svg', size: { w: 53, h: 67 }, index: 148 },
  'zara-leo-nadia-maya-batch_149': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_149.svg', size: { w: 55, h: 67 }, index: 149 },
  'zara-leo-nadia-maya-batch_150': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_150.svg', size: { w: 52, h: 64 }, index: 150 },
  'zara-leo-nadia-maya-batch_151': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_151.svg', size: { w: 53, h: 64 }, index: 151 },
  'zara-leo-nadia-maya-batch_152': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_152.svg', size: { w: 44, h: 30 }, index: 152 },
  'zara-leo-nadia-maya-batch_153': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_153.svg', size: { w: 121, h: 17 }, index: 153 },
  'zara-leo-nadia-maya-batch_154': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_154.svg', size: { w: 132, h: 17 }, index: 154 },
  'zara-leo-nadia-maya-batch_155': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_155.svg', size: { w: 128, h: 17 }, index: 155 },
  'zara-leo-nadia-maya-batch_156': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_156.svg', size: { w: 110, h: 17 }, index: 156 },
  'zara-leo-nadia-maya-batch_157': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_157.svg', size: { w: 111, h: 17 }, index: 157 },
  'zara-leo-nadia-maya-batch_158': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_158.svg', size: { w: 38, h: 21 }, index: 158 },
  'zara-leo-nadia-maya-batch_159': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_159.svg', size: { w: 37, h: 20 }, index: 159 },
  'zara-leo-nadia-maya-batch_160': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_160.svg', size: { w: 36, h: 20 }, index: 160 },
  'zara-leo-nadia-maya-batch_161': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_161.svg', size: { w: 37, h: 20 }, index: 161 },
  'zara-leo-nadia-maya-batch_162': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_162.svg', size: { w: 37, h: 20 }, index: 162 },
  'zara-leo-nadia-maya-batch_163': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_163.svg', size: { w: 117, h: 17 }, index: 163 },
  'zara-leo-nadia-maya-batch_164': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_164.svg', size: { w: 79, h: 16 }, index: 164 },
  'zara-leo-nadia-maya-batch_165': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_165.svg', size: { w: 113, h: 16 }, index: 165 },
  'zara-leo-nadia-maya-batch_166': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_166.svg', size: { w: 103, h: 16 }, index: 166 },
  'zara-leo-nadia-maya-batch_167': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_167.svg', size: { w: 111, h: 16 }, index: 167 },
  'zara-leo-nadia-maya-batch_168': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_168.svg', size: { w: 129, h: 16 }, index: 168 },
  'zara-leo-nadia-maya-batch_169': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_169.svg', size: { w: 115, h: 16 }, index: 169 },
  'zara-leo-nadia-maya-batch_170': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_170.svg', size: { w: 112, h: 16 }, index: 170 },
  'zara-leo-nadia-maya-batch_171': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_171.svg', size: { w: 125, h: 16 }, index: 171 },
  'zara-leo-nadia-maya-batch_172': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_172.svg', size: { w: 130, h: 17 }, index: 172 },
  'zara-leo-nadia-maya-batch_173': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_173.svg', size: { w: 120, h: 16 }, index: 173 },
  'zara-leo-nadia-maya-batch_174': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_174.svg', size: { w: 49, h: 56 }, index: 174 },
  'zara-leo-nadia-maya-batch_175': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_175.svg', size: { w: 48, h: 55 }, index: 175 },
  'zara-leo-nadia-maya-batch_176': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_176.svg', size: { w: 51, h: 55 }, index: 176 },
  'zara-leo-nadia-maya-batch_177': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_177.svg', size: { w: 49, h: 55 }, index: 177 },
  'zara-leo-nadia-maya-batch_178': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_178.svg', size: { w: 49, h: 55 }, index: 178 },
  'zara-leo-nadia-maya-batch_179': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_179.svg', size: { w: 49, h: 56 }, index: 179 },
  'zara-leo-nadia-maya-batch_180': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_180.svg', size: { w: 51, h: 57 }, index: 180 },
  'zara-leo-nadia-maya-batch_181': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_181.svg', size: { w: 49, h: 57 }, index: 181 },
  'zara-leo-nadia-maya-batch_182': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_182.svg', size: { w: 49, h: 60 }, index: 182 },
  'zara-leo-nadia-maya-batch_183': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_183.svg', size: { w: 51, h: 59 }, index: 183 },
  'zara-leo-nadia-maya-batch_184': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_184.svg', size: { w: 50, h: 59 }, index: 184 },
  'zara-leo-nadia-maya-batch_185': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_185.svg', size: { w: 111, h: 16 }, index: 185 },
  'zara-leo-nadia-maya-batch_186': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_186.svg', size: { w: 122, h: 16 }, index: 186 },
  'zara-leo-nadia-maya-batch_187': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_187.svg', size: { w: 142, h: 16 }, index: 187 },
  'zara-leo-nadia-maya-batch_188': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_188.svg', size: { w: 113, h: 16 }, index: 188 },
  'zara-leo-nadia-maya-batch_189': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_189.svg', size: { w: 110, h: 16 }, index: 189 },
  'zara-leo-nadia-maya-batch_190': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_190.svg', size: { w: 52, h: 50 }, index: 190 },
  'zara-leo-nadia-maya-batch_191': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_191.svg', size: { w: 52, h: 50 }, index: 191 },
  'zara-leo-nadia-maya-batch_192': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_192.svg', size: { w: 53, h: 50 }, index: 192 },
  'zara-leo-nadia-maya-batch_193': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_193.svg', size: { w: 52, h: 50 }, index: 193 },
  'zara-leo-nadia-maya-batch_194': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_194.svg', size: { w: 61, h: 50 }, index: 194 },
  'zara-leo-nadia-maya-batch_195': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_195.svg', size: { w: 111, h: 13 }, index: 195 },
  'zara-leo-nadia-maya-batch_196': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_196.svg', size: { w: 129, h: 13 }, index: 196 },
  'zara-leo-nadia-maya-batch_197': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_197.svg', size: { w: 115, h: 13 }, index: 197 },
  'zara-leo-nadia-maya-batch_198': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_198.svg', size: { w: 112, h: 13 }, index: 198 },
  'zara-leo-nadia-maya-batch_199': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_199.svg', size: { w: 125, h: 13 }, index: 199 },
  'zara-leo-nadia-maya-batch_200': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_200.svg', size: { w: 117, h: 13 }, index: 200 },
  'zara-leo-nadia-maya-batch_201': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_201.svg', size: { w: 49, h: 60 }, index: 201 },
  'zara-leo-nadia-maya-batch_202': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_202.svg', size: { w: 48, h: 60 }, index: 202 },
  'zara-leo-nadia-maya-batch_203': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_203.svg', size: { w: 51, h: 59 }, index: 203 },
  'zara-leo-nadia-maya-batch_204': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_204.svg', size: { w: 49, h: 59 }, index: 204 },
  'zara-leo-nadia-maya-batch_205': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_205.svg', size: { w: 49, h: 59 }, index: 205 },
  'zara-leo-nadia-maya-batch_206': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_206.svg', size: { w: 49, h: 60 }, index: 206 },
  'zara-leo-nadia-maya-batch_207': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_207.svg', size: { w: 51, h: 61 }, index: 207 },
  'zara-leo-nadia-maya-batch_208': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_208.svg', size: { w: 49, h: 60 }, index: 208 },
  'zara-leo-nadia-maya-batch_209': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_209.svg', size: { w: 49, h: 62 }, index: 209 },
  'zara-leo-nadia-maya-batch_210': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_210.svg', size: { w: 51, h: 62 }, index: 210 },
  'zara-leo-nadia-maya-batch_211': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_211.svg', size: { w: 50, h: 62 }, index: 211 },
  'zara-leo-nadia-maya-batch_212': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_212.svg', size: { w: 113, h: 14 }, index: 212 },
  'zara-leo-nadia-maya-batch_213': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_213.svg', size: { w: 111, h: 13 }, index: 213 },
  'zara-leo-nadia-maya-batch_214': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_214.svg', size: { w: 122, h: 13 }, index: 214 },
  'zara-leo-nadia-maya-batch_215': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_215.svg', size: { w: 142, h: 13 }, index: 215 },
  'zara-leo-nadia-maya-batch_216': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_216.svg', size: { w: 110, h: 14 }, index: 216 },
  'zara-leo-nadia-maya-batch_217': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_217.svg', size: { w: 52, h: 56 }, index: 217 },
  'zara-leo-nadia-maya-batch_218': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_218.svg', size: { w: 52, h: 55 }, index: 218 },
  'zara-leo-nadia-maya-batch_219': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_219.svg', size: { w: 53, h: 55 }, index: 219 },
  'zara-leo-nadia-maya-batch_220': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_220.svg', size: { w: 52, h: 55 }, index: 220 },
  'zara-leo-nadia-maya-batch_221': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_221.svg', size: { w: 61, h: 55 }, index: 221 },
  'zara-leo-nadia-maya-batch_222': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_222.svg', size: { w: 28, h: 38 }, index: 222 },
  'zara-leo-nadia-maya-batch_223': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_223.svg', size: { w: 26, h: 38 }, index: 223 },
  'zara-leo-nadia-maya-batch_224': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_224.svg', size: { w: 175, h: 26 }, index: 224 },
  'zara-leo-nadia-maya-batch_225': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_225.svg', size: { w: 70, h: 25 }, index: 225 },
  'zara-leo-nadia-maya-batch_226': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_226.svg', size: { w: 98, h: 26 }, index: 226 },
  'zara-leo-nadia-maya-batch_227': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_227.svg', size: { w: 68, h: 15 }, index: 227 },
  'zara-leo-nadia-maya-batch_228': { file: 'individual/zara-leo-nadia-maya-batch/zara-leo-nadia-maya-batch_228.svg', size: { w: 67, h: 15 }, index: 228 },
};

// ─── Master Registry ─────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SPRITE_REGISTRY = {
  ...SPRITES_ALEX_CHEN_ONLY,
  ...SPRITES_BUILDING_EXTERIOR,
  ...SPRITES_CASEY_KIM_ONLY,
  ...SPRITES_CHRIS_AVA_FRAN_JAMIE_DANIEL_SOFIA_BATCH,
  ...SPRITES_CONFERENCE_TABLE_WHITEBOARD_KANBAN_COFFEE_MACHINE_PLANT,
  ...SPRITES_DESKS_AND_MONITOR_SCREENS,
  ...SPRITES_EFFECTS_AND_PARTICLES,
  ...SPRITES_JORDAN_LEE_ONLY,
  ...SPRITES_KAI_YUNA_RAVI_ELENA_BATCH,
  ...SPRITES_MARCUS_WEBB_ONLY,
  ...SPRITES_MIA_TYLER_SAM_OMAR_BATCH,
  ...SPRITES_PRIYA_SHARMA_ONLY,
  ...SPRITES_RECEPTION_BOT_AND_KIN_FOUNDERYOU,
  ...SPRITES_REX_AND_DANA_SECURITY_GUARDS,
  ...SPRITES_RIO_TANAKA_ONLY,
  ...SPRITES_SARAH_CHEN_ONLY,
  ...SPRITES_SPEECH_BUBBLES_AND_UI_ELEMENTS,
  ...SPRITES_WINDOWS_AND_FLOOR_TILES_AND_ELEVATOR,
  ...SPRITES_ZARA_LEO_NADIA_MAYA_BATCH,
} as Record<SpriteId, SpriteEntry>;

// ─── Character → Sheet mapping ───────────────────────────────────────────────

/** Employee id → the sheet var that contains their sprites. */
export const EMPLOYEE_SPRITE_SHEET: Record<string, Record<string, SpriteEntry>> = {
  'alex-chen': SPRITES_ALEX_CHEN_ONLY,
  'marcus-webb': SPRITES_MARCUS_WEBB_ONLY,
  'kai-nakamura': SPRITES_KAI_YUNA_RAVI_ELENA_BATCH,
  'yuna-park': SPRITES_KAI_YUNA_RAVI_ELENA_BATCH,
  'ravi-patel': SPRITES_KAI_YUNA_RAVI_ELENA_BATCH,
  'elena-vasquez': SPRITES_KAI_YUNA_RAVI_ELENA_BATCH,
  'casey-kim': SPRITES_CASEY_KIM_ONLY,
  'mia-chen': SPRITES_MIA_TYLER_SAM_OMAR_BATCH,
  'tyler-brooks': SPRITES_MIA_TYLER_SAM_OMAR_BATCH,
  'sam-rivera': SPRITES_MIA_TYLER_SAM_OMAR_BATCH,
  'omar-khalil': SPRITES_MIA_TYLER_SAM_OMAR_BATCH,
  'jordan-lee': SPRITES_JORDAN_LEE_ONLY,
  'priya-sharma': SPRITES_PRIYA_SHARMA_ONLY,
  'leo-zhang': SPRITES_ZARA_LEO_NADIA_MAYA_BATCH,
  'rio-tanaka': SPRITES_RIO_TANAKA_ONLY,
  'nadia-hassan': SPRITES_ZARA_LEO_NADIA_MAYA_BATCH,
  'maya-patel': SPRITES_ZARA_LEO_NADIA_MAYA_BATCH,
  'sarah-chen': SPRITES_SARAH_CHEN_ONLY,
  'zara-ahmed': SPRITES_ZARA_LEO_NADIA_MAYA_BATCH,
  'chris-park': SPRITES_CHRIS_AVA_FRAN_JAMIE_DANIEL_SOFIA_BATCH,
  'ava-thompson': SPRITES_CHRIS_AVA_FRAN_JAMIE_DANIEL_SOFIA_BATCH,
  'fran-torres': SPRITES_CHRIS_AVA_FRAN_JAMIE_DANIEL_SOFIA_BATCH,
  'jamie-park': SPRITES_CHRIS_AVA_FRAN_JAMIE_DANIEL_SOFIA_BATCH,
  // Special characters
  'reception-bot': SPRITES_RECEPTION_BOT_AND_KIN_FOUNDERYOU,
  'kin-founder': SPRITES_RECEPTION_BOT_AND_KIN_FOUNDERYOU,
  'rex-guard': SPRITES_REX_AND_DANA_SECURITY_GUARDS,
  'dana-guard': SPRITES_REX_AND_DANA_SECURITY_GUARDS,
};

// ─── Environment / Prop sheets ───────────────────────────────────────────────
export const ENV_SPRITES = {
  desks: SPRITES_DESKS_AND_MONITOR_SCREENS,
  furniture: SPRITES_CONFERENCE_TABLE_WHITEBOARD_KANBAN_COFFEE_MACHINE_PLANT,
  effects: SPRITES_EFFECTS_AND_PARTICLES,
  speechBubbles: SPRITES_SPEECH_BUBBLES_AND_UI_ELEMENTS,
  windowsTiles: SPRITES_WINDOWS_AND_FLOOR_TILES_AND_ELEVATOR,
  building: SPRITES_BUILDING_EXTERIOR,
} as const;

// ─── Utilities ───────────────────────────────────────────────────────────────

/**
 * Resolve an SVG sprite to its URL for use in <img> or CSS.
 *
 * Usage:
 *   const url = spriteUrl(SPRITE_REGISTRY['alex-chen-only_000']);
 *   <img src={url} style={{ imageRendering: 'pixelated' }} />
 */
// Eagerly resolve every individual sprite SVG to its served URL. We cannot use
// `new URL(`../${entry.file}`, import.meta.url)` because Vite cannot statically
// analyze a dynamic template that spans nested folders — it compiles to an empty
// lookup map and returns `.../undefined` (broken image / "?"). import.meta.glob
// builds the real path→URL map at transform time.
const SPRITE_URLS = import.meta.glob<string>('../individual/**/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
});

export function spriteUrl(entry: SpriteEntry): string {
  // Glob keys are relative to this file, e.g. '../individual/alex-chen-only/…svg'.
  const url = SPRITE_URLS[`../${entry.file}`];
  if (!url) {
    console.warn(`[sprites] missing asset for ${entry.file}`);
    return '';
  }
  return url;
}

/**
 * Get all sprite entries for a specific employee.
 *
 * Usage:
 *   const sprites = getEmployeeSprites('alex-chen');
 *   // sprites is Record<string, SpriteEntry> from their sheet
 */
export function getEmployeeSprites(employeeId: string): Record<string, SpriteEntry> | undefined {
  return EMPLOYEE_SPRITE_SHEET[employeeId];
}

/**
 * Look up a single sprite by its full id.
 *   const entry = getSpriteById('alex-chen-only_000');
 */
export function getSpriteById(id: SpriteId): SpriteEntry {
  return SPRITE_REGISTRY[id];
}
