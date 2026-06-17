/* eslint-disable no-console */
import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.join(process.cwd(), 'artifacts');
const OUT_JSON = path.join(OUT_DIR, 'stress-test-report.json');
const OUT_MD = path.join(OUT_DIR, 'stress-test-report.md');

const readUtf8 = (relPath) => fs.readFileSync(path.join(process.cwd(), relPath), 'utf8');

const checkHarnessFiles = () => {
  const cases = [
    {
      name: 'protocol_parser',
      file: 'services/ai/storyResponseParser.ts',
      needles: ['协议标签列表', '变量规划', '短期记忆', '行动选项']
    },
    {
      name: 'system_prompt_builder',
      file: 'hooks/useGame/systemPromptBuilder.ts',
      needles: ['构建系统提示词', 'worldbooks', 'memoryData', 'promptPool']
    },
    {
      name: 'state_command_guard',
      file: 'utils/stateHelpers.ts',
      needles: ['normalizeStateCommandKey', 'applyStateCommand', '是否废弃命令根路径']
    },
    {
      name: 'save_coordinator',
      file: 'hooks/useGame/saveCoordinator.ts',
      needles: ['创建存档数据', '保存存档并读取', '场景图片档案', '角色锚点列表']
    }
  ];

  return cases.map((item) => {
    const source = readUtf8(item.file);
    const missing = item.needles.filter((needle) => !source.includes(needle));
    return {
      ...item,
      passed: missing.length === 0,
      missing
    };
  });
};

const deepClone = (value) => JSON.parse(JSON.stringify(value));

const createRng = (seed = 20260616) => {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

const rollInt = (rng, min, max) => Math.floor(rng() * (max - min + 1)) + min;

const formatTime = (env) => {
  const pad = (value) => String(Math.trunc(value)).padStart(2, '0');
  return `${env.day}:${pad(env.hour)}:${pad(env.minute)}`;
};

const advanceMinutes = (env, minutes) => {
  const next = deepClone(env);
  next.minute += minutes;
  while (next.minute >= 60) {
    next.minute -= 60;
    next.hour += 1;
  }
  while (next.hour >= 24) {
    next.hour -= 24;
    next.day += 1;
  }
  return next;
};

const createInitialState = () => ({
  env: {
    day: 1,
    hour: 9,
    minute: 20,
    area: '海川市',
    district: '旧港片区',
    place: '临街咖啡店'
  },
  player: {
    name: '陈砚秋',
    energy: 82,
    maxEnergy: 100,
    money: 3200,
    stress: 18,
    focus: 64,
    items: [
      { name: '手机', count: 1 },
      { name: '钥匙串', count: 1 },
      { name: '便携记录本', count: 1 }
    ]
  },
  social: [
    { id: 'npc_xuzhixia', name: '许知夏', relation: 42, present: true, role: '合租旧友' }
  ],
  tasks: [
    { id: 'task_rent_contract', title: '核对租约异常', progress: 0, total: 3, status: '进行中' }
  ],
  memory: []
});

const addCommand = (commands, action, key, value) => {
  commands.push(`${action} ${key} = ${JSON.stringify(value)}`);
};

const scenarioExplore = (state, rng) => {
  const next = deepClone(state);
  const minutes = rollInt(rng, 12, 28);
  next.env = advanceMinutes(next.env, minutes);
  next.env.place = rollInt(rng, 0, 1) === 0 ? '旧港派出所门口' : '出租屋楼下';
  next.player.energy = Math.max(0, next.player.energy - rollInt(rng, 4, 9));
  next.player.focus = Math.min(100, next.player.focus + rollInt(rng, 1, 4));
  const commands = [];
  addCommand(commands, 'set', '环境.时间', formatTime(next.env));
  addCommand(commands, 'set', '环境.具体地点', next.env.place);
  addCommand(commands, 'set', '角色.当前精力', next.player.energy);
  addCommand(commands, 'add', '角色.专注度', next.player.focus - state.player.focus);
  return {
    name: 'explore',
    title: '城市线索推进',
    next,
    commands,
    memory: `第${next.env.day}天 ${next.env.place}：主角推进租约异常线索。`
  };
};

const scenarioSocial = (state, rng) => {
  const next = deepClone(state);
  const delta = rollInt(rng, 2, 8);
  next.social[0].relation += delta;
  next.player.stress = Math.max(0, next.player.stress - rollInt(rng, 2, 6));
  const commands = [];
  addCommand(commands, 'add', '社交[0].好感度', delta);
  addCommand(commands, 'set', '社交[0].是否在场', true);
  addCommand(commands, 'set', '角色.压力', next.player.stress);
  return {
    name: 'social',
    title: '同伴沟通',
    next,
    commands,
    memory: `许知夏与主角复盘线索，关系推进 ${delta}。`
  };
};

const scenarioInventory = (state, rng) => {
  const next = deepClone(state);
  const cost = rollInt(rng, 12, 35);
  next.player.money = Math.max(0, next.player.money - cost);
  const itemName = rollInt(rng, 0, 1) === 0 ? '打印材料' : '一次性雨衣';
  const existing = next.player.items.find((item) => item.name === itemName);
  if (existing) existing.count += 1;
  else next.player.items.push({ name: itemName, count: 1 });
  const commands = [];
  addCommand(commands, 'add', '角色.金钱.baseAmount', -cost);
  addCommand(commands, 'push', '角色.物品列表', { 名称: itemName, 数量: 1 });
  return {
    name: 'inventory',
    title: '物品账务',
    next,
    commands,
    memory: `主角花费 ${cost} 元取得${itemName}。`
  };
};

const scenarioTask = (state, rng) => {
  const next = deepClone(state);
  const task = next.tasks[0];
  const delta = rollInt(rng, 1, 2);
  task.progress = Math.min(task.total, task.progress + delta);
  if (task.progress >= task.total) task.status = '已完成';
  const commands = [];
  addCommand(commands, 'set', '任务列表[0].当前进度', task.progress);
  addCommand(commands, 'set', '任务列表[0].当前状态', task.status);
  return {
    name: 'task',
    title: '任务推进',
    next,
    commands,
    memory: `${task.title} 进度推进到 ${task.progress}/${task.total}。`
  };
};

const scenarioConflict = (state, rng) => {
  const next = deepClone(state);
  const energyCost = rollInt(rng, 6, 14);
  const stressGain = rollInt(rng, 2, 7);
  next.player.energy = Math.max(0, next.player.energy - energyCost);
  next.player.stress = Math.min(100, next.player.stress + stressGain);
  const commands = [];
  addCommand(commands, 'set', '角色.当前精力', next.player.energy);
  addCommand(commands, 'set', '角色.压力', next.player.stress);
  addCommand(commands, 'push', '剧情.历史卷宗', `一次现实冲突造成精力-${energyCost}，压力+${stressGain}`);
  return {
    name: 'conflict',
    title: '轻量对抗占位',
    next,
    commands,
    memory: '主角处理一次现实冲突；只落地角色状态和剧情记录，不写旧结构化对抗根。'
  };
};

const scenarios = [scenarioExplore, scenarioSocial, scenarioInventory, scenarioTask, scenarioConflict];
const retiredCommandRootPattern = /^(?:set|add|push|delete)\s+(?:战斗|改编剧情规划|改编女主剧情规划)(?:\.|\[|\s|=)/u;

const buildMockResponse = (result) => {
  const body = [
    `【旁白】${result.title}完成。`,
    `【旁白】${result.memory}`
  ].join('\n');
  return [
    '<thinking>略</thinking>',
    `<正文>\n${body}\n</正文>`,
    `<短期记忆>\n${result.memory}\n</短期记忆>`,
    `<变量规划>\n本回合只更新当前场景确立的角色、环境、社交、任务或物品状态。\n</变量规划>`,
    `<命令>\n${result.commands.join('\n')}\n</命令>`,
    '<行动选项>\n- 继续追查\n- 和同伴商量\n- 整理随身物品\n</行动选项>'
  ].join('\n');
};

const validateResult = (before, result) => {
  const issues = [];
  const response = buildMockResponse(result);
  ['<正文>', '</正文>', '<短期记忆>', '</短期记忆>', '<变量规划>', '</变量规划>', '<命令>', '</命令>']
    .forEach((tag) => {
      if (!response.includes(tag)) issues.push(`缺少协议标签 ${tag}`);
    });
  result.commands.forEach((command) => {
    if (retiredCommandRootPattern.test(command)) {
      issues.push(`命令写入退役状态根：${command}`);
    }
  });
  if (result.next.player.energy < 0 || result.next.player.energy > result.next.player.maxEnergy) {
    issues.push(`精力越界：${result.next.player.energy}/${result.next.player.maxEnergy}`);
  }
  if (result.next.player.money < 0) {
    issues.push(`金钱为负：${result.next.player.money}`);
  }
  if (!Array.isArray(result.next.tasks) || result.next.tasks.length === 0) {
    issues.push('任务列表丢失');
  }
  if (before.social.length > 0 && result.next.social.length <= 0) {
    issues.push('社交列表被清空');
  }
  return { response, issues };
};

const runSimulation = () => {
  const rng = createRng();
  let state = createInitialState();
  const rounds = [];
  const order = ['explore', 'social', 'inventory', 'task', 'conflict', 'task', 'explore', 'social'];
  for (const scene of order) {
    const before = deepClone(state);
    const runner = scenarios.find((item) => item(deepClone(state), createRng(1)).name === scene);
    const result = runner(state, rng);
    const validation = validateResult(before, result);
    state = result.next;
    rounds.push({
      scene,
      title: result.title,
      commands: result.commands,
      issues: validation.issues,
      responsePreview: validation.response.slice(0, 360)
    });
  }
  return { finalState: state, rounds };
};

const writeReport = (report) => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 2), 'utf8');

  const lines = [];
  lines.push('# Prompt Stress Test Report');
  lines.push('');
  lines.push(`Generated at: ${report.generatedAt}`);
  lines.push('');
  lines.push('## Harness Checks');
  report.harnessChecks.forEach((check) => {
    lines.push(`- ${check.passed ? 'PASS' : 'FAIL'} ${check.name} (${check.file})`);
    if (check.missing.length > 0) lines.push(`  - Missing: ${check.missing.join(', ')}`);
  });
  lines.push('');
  lines.push('## Scenario Rounds');
  report.simulation.rounds.forEach((round, index) => {
    lines.push(`- Round ${index + 1}: ${round.title}`);
    lines.push(`  - Commands: ${round.commands.length}`);
    lines.push(`  - Issues: ${round.issues.length > 0 ? round.issues.join('; ') : 'none'}`);
  });
  lines.push('');
  lines.push('## Final State');
  lines.push('```json');
  lines.push(JSON.stringify(report.simulation.finalState, null, 2));
  lines.push('```');
  fs.writeFileSync(OUT_MD, `${lines.join('\n')}\n`, 'utf8');
};

const main = () => {
  const harnessChecks = checkHarnessFiles();
  const simulation = runSimulation();
  const report = {
    generatedAt: new Date().toISOString(),
    harnessChecks,
    simulation
  };
  writeReport(report);

  const failedChecks = harnessChecks.filter((item) => !item.passed);
  const scenarioIssues = simulation.rounds.flatMap((round) => round.issues.map((issue) => `${round.scene}: ${issue}`));
  console.log(`Prompt stress test report written: ${OUT_MD}`);
  if (failedChecks.length > 0 || scenarioIssues.length > 0) {
    if (failedChecks.length > 0) {
      console.error(`Harness check failures: ${failedChecks.map((item) => item.name).join(', ')}`);
    }
    if (scenarioIssues.length > 0) {
      console.error(`Scenario issues:\n${scenarioIssues.map((item) => `- ${item}`).join('\n')}`);
    }
    process.exitCode = 1;
  }
};

main();
