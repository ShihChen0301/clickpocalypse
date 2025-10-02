const MAX_PARTY_SIZE = 5;

const adventurerClasses = {
    warrior: {
        name: '戰士',
        icon: 'https://opengameart.org/sites/default/files/styles/medium/public/Sword_3.png',
        baseDamage: 3,
        baseHp: 110,
        skillTiers: [
            ['powerStrike', 'shieldMastery'],
            ['bladeDance', 'ironWill'],
            ['warlordPresence', 'earthshatter'],
            ['eternalChampion', 'veteransTactics'],
        ],
        skills: {
            powerStrike: {
                name: '強力斬擊',
                description: '每級提升自身傷害 10%。',
                tier: 1,
                maxLevel: 5,
                effects: [
                    { type: 'selfDamageMultiplier', valuePerLevel: 0.1 },
                ],
            },
            shieldMastery: {
                name: '盾牌精通',
                description: '每級提升自身傷害 5%，並鼓舞全隊傷害 1.5%。',
                tier: 1,
                maxLevel: 5,
                effects: [
                    { type: 'selfDamageMultiplier', valuePerLevel: 0.05 },
                    { type: 'teamDamageMultiplier', valuePerLevel: 0.015 },
                ],
            },
            bladeDance: {
                name: '劍舞',
                description: '需求：強力斬擊等級 3。每級追加 2 點傷害並提升自身傷害 7%。',
                tier: 2,
                maxLevel: 4,
                prerequisites: [{ skillId: 'powerStrike', level: 3 }],
                effects: [
                    { type: 'selfFlatDamage', valuePerLevel: 2 },
                    { type: 'selfDamageMultiplier', valuePerLevel: 0.07 },
                ],
            },
            ironWill: {
                name: '鋼鐵意志',
                description: '需求：盾牌精通等級 3。每級讓全隊傷害提升 3%，經驗提升 2%。',
                tier: 2,
                maxLevel: 4,
                prerequisites: [{ skillId: 'shieldMastery', level: 3 }],
                effects: [
                    { type: 'teamDamageMultiplier', valuePerLevel: 0.03 },
                    { type: 'teamXpBonus', valuePerLevel: 0.02 },
                ],
            },
            warlordPresence: {
                name: '軍閥威勢',
                description: '巔峰等級 2 解鎖。每級讓全隊傷害 +5%，金幣 +4%。',
                tier: 3,
                maxLevel: 3,
                unlockRequirement: { type: 'paragon', level: 2 },
                effects: [
                    { type: 'teamDamageMultiplier', valuePerLevel: 0.05 },
                    { type: 'teamGoldBonus', valuePerLevel: 0.04 },
                ],
            },
            earthshatter: {
                name: '裂地重擊',
                description: '需求：劍舞等級 3，巔峰等級 2。每級提升自身傷害 12%，追加 4 點傷害。',
                tier: 3,
                maxLevel: 3,
                prerequisites: [{ skillId: 'bladeDance', level: 3 }],
                unlockRequirement: { type: 'paragon', level: 2 },
                effects: [
                    { type: 'selfDamageMultiplier', valuePerLevel: 0.12 },
                    { type: 'selfFlatDamage', valuePerLevel: 4 },
                ],
            },
            eternalChampion: {
                name: '永恆鬥士',
                description: '轉生 1 次解鎖。每級讓全隊傷害 +8%，經驗 +5%。',
                tier: 4,
                maxLevel: 2,
                unlockRequirement: { type: 'rebirth', count: 1 },
                effects: [
                    { type: 'teamDamageMultiplier', valuePerLevel: 0.08 },
                    { type: 'teamXpBonus', valuePerLevel: 0.05 },
                ],
            },
            veteransTactics: {
                name: '老兵戰術',
                description: '需求：鋼鐵意志等級 3，轉生 1 次。每級讓全隊金幣 +6%，傷害 +4%。',
                tier: 4,
                maxLevel: 2,
                prerequisites: [{ skillId: 'ironWill', level: 3 }],
                unlockRequirement: { type: 'rebirth', count: 1 },
                effects: [
                    { type: 'teamGoldBonus', valuePerLevel: 0.06 },
                    { type: 'teamDamageMultiplier', valuePerLevel: 0.04 },
                ],
            },
        },
    },
    mage: {
        name: '法師',
        icon: 'https://opengameart.org/sites/default/files/styles/medium/public/Runestone_Blue.png',
        baseDamage: 5,
        baseHp: 70,
        skillTiers: [
            ['fireball', 'arcaneSurge'],
            ['manaFont', 'frozenOrb'],
            ['runeOfPower', 'elementalMastery'],
            ['timeWarp', 'phoenixFlare'],
        ],
        skills: {
            fireball: {
                name: '火球術',
                description: '每級讓火球造成額外 18 點傷害。',
                tier: 1,
                maxLevel: 5,
                effects: [
                    { type: 'fireballFlat', valuePerLevel: 18 },
                ],
            },
            arcaneSurge: {
                name: '祕能奔流',
                description: '每級提升自身傷害 8%。',
                tier: 1,
                maxLevel: 5,
                effects: [
                    { type: 'selfDamageMultiplier', valuePerLevel: 0.08 },
                ],
            },
            manaFont: {
                name: '魔力泉湧',
                description: '需求：火球術等級 3。每級讓火球傷害提高 12%，並使全隊經驗 +3%。',
                tier: 2,
                maxLevel: 4,
                prerequisites: [{ skillId: 'fireball', level: 3 }],
                effects: [
                    { type: 'fireballMultiplier', valuePerLevel: 0.12 },
                    { type: 'teamXpBonus', valuePerLevel: 0.03 },
                ],
            },
            frozenOrb: {
                name: '冰晶回旋',
                description: '需求：祕能奔流等級 3。每級提升自身傷害 5%，全隊傷害 2%。',
                tier: 2,
                maxLevel: 4,
                prerequisites: [{ skillId: 'arcaneSurge', level: 3 }],
                effects: [
                    { type: 'selfDamageMultiplier', valuePerLevel: 0.05 },
                    { type: 'teamDamageMultiplier', valuePerLevel: 0.02 },
                ],
            },
            runeOfPower: {
                name: '能量符文',
                description: '巔峰等級 2 解鎖。每級讓全隊傷害 +4%，金幣 +3%。',
                tier: 3,
                maxLevel: 3,
                unlockRequirement: { type: 'paragon', level: 2 },
                effects: [
                    { type: 'teamDamageMultiplier', valuePerLevel: 0.04 },
                    { type: 'teamGoldBonus', valuePerLevel: 0.03 },
                ],
            },
            elementalMastery: {
                name: '元素宗師',
                description: '需求：冰晶回旋等級 3，巔峰等級 2。每級提升自身傷害 14%。',
                tier: 3,
                maxLevel: 3,
                prerequisites: [{ skillId: 'frozenOrb', level: 3 }],
                unlockRequirement: { type: 'paragon', level: 2 },
                effects: [
                    { type: 'selfDamageMultiplier', valuePerLevel: 0.14 },
                ],
            },
            timeWarp: {
                name: '時間扭曲',
                description: '轉生 1 次解鎖。每級讓全隊經驗 +8%，巔峰經驗 +5%。',
                tier: 4,
                maxLevel: 2,
                unlockRequirement: { type: 'rebirth', count: 1 },
                effects: [
                    { type: 'teamXpBonus', valuePerLevel: 0.08 },
                    { type: 'paragonXpBonus', valuePerLevel: 0.05 },
                ],
            },
            phoenixFlare: {
                name: '鳳凰閃焰',
                description: '需求：元素宗師等級 2，轉生 1 次。每級火球傷害 +60，火球威力再乘 20%。',
                tier: 4,
                maxLevel: 2,
                prerequisites: [{ skillId: 'elementalMastery', level: 2 }],
                unlockRequirement: { type: 'rebirth', count: 1 },
                effects: [
                    { type: 'fireballFlat', valuePerLevel: 60 },
                    { type: 'fireballMultiplier', valuePerLevel: 0.2 },
                ],
            },
        },
    },
    ranger: {
        name: '遊俠',
        icon: 'https://opengameart.org/sites/default/files/styles/medium/public/bow_0.png',
        baseDamage: 4,
        baseHp: 85,
        skillTiers: [
            ['marksmanship', 'eagleEye'],
            ['rapidVolley', 'forestBond'],
            ['shadowArrow', 'natureCall'],
            ['stormChaser', 'huntersOath'],
        ],
        skills: {
            marksmanship: {
                name: '精準射擊',
                description: '每級提升自身傷害 12%。',
                tier: 1,
                maxLevel: 5,
                effects: [
                    { type: 'selfDamageMultiplier', valuePerLevel: 0.12 },
                ],
            },
            eagleEye: {
                name: '鷹眼凝視',
                description: '每級讓全隊傷害 +2%，金幣 +2%。',
                tier: 1,
                maxLevel: 5,
                effects: [
                    { type: 'teamDamageMultiplier', valuePerLevel: 0.02 },
                    { type: 'teamGoldBonus', valuePerLevel: 0.02 },
                ],
            },
            rapidVolley: {
                name: '疾速箭雨',
                description: '需求：精準射擊等級 3。每級追加 2.5 點傷害並提升自身傷害 5%。',
                tier: 2,
                maxLevel: 4,
                prerequisites: [{ skillId: 'marksmanship', level: 3 }],
                effects: [
                    { type: 'selfFlatDamage', valuePerLevel: 2.5 },
                    { type: 'selfDamageMultiplier', valuePerLevel: 0.05 },
                ],
            },
            forestBond: {
                name: '森林契約',
                description: '需求：鷹眼凝視等級 3。每級讓全隊經驗 +3%，金幣 +3%。',
                tier: 2,
                maxLevel: 4,
                prerequisites: [{ skillId: 'eagleEye', level: 3 }],
                effects: [
                    { type: 'teamXpBonus', valuePerLevel: 0.03 },
                    { type: 'teamGoldBonus', valuePerLevel: 0.03 },
                ],
            },
            shadowArrow: {
                name: '暗影之矢',
                description: '需求：疾速箭雨等級 3，巔峰等級 2。每級提升自身傷害 10%。',
                tier: 3,
                maxLevel: 3,
                prerequisites: [{ skillId: 'rapidVolley', level: 3 }],
                unlockRequirement: { type: 'paragon', level: 2 },
                effects: [
                    { type: 'selfDamageMultiplier', valuePerLevel: 0.1 },
                ],
            },
            natureCall: {
                name: '自然召喚',
                description: '巔峰等級 2 解鎖。每級讓全隊傷害 +4%，經驗 +5%。',
                tier: 3,
                maxLevel: 3,
                unlockRequirement: { type: 'paragon', level: 2 },
                effects: [
                    { type: 'teamDamageMultiplier', valuePerLevel: 0.04 },
                    { type: 'teamXpBonus', valuePerLevel: 0.05 },
                ],
            },
            stormChaser: {
                name: '追風者',
                description: '轉生 1 次解鎖。每級讓全隊傷害 +6%，金幣 +5%。',
                tier: 4,
                maxLevel: 2,
                unlockRequirement: { type: 'rebirth', count: 1 },
                effects: [
                    { type: 'teamDamageMultiplier', valuePerLevel: 0.06 },
                    { type: 'teamGoldBonus', valuePerLevel: 0.05 },
                ],
            },
            huntersOath: {
                name: '獵人誓言',
                description: '需求：暗影之矢等級 2，轉生 1 次。每級提升自身傷害 16%。',
                tier: 4,
                maxLevel: 2,
                prerequisites: [{ skillId: 'shadowArrow', level: 2 }],
                unlockRequirement: { type: 'rebirth', count: 1 },
                effects: [
                    { type: 'selfDamageMultiplier', valuePerLevel: 0.16 },
                ],
            },
        },
    },
    cleric: {
        name: '牧師',
        icon: 'https://opengameart.org/sites/default/files/styles/medium/public/Scroll.png',
        baseDamage: 2,
        baseHp: 95,
        skillTiers: [
            ['blessing', 'healingChorus'],
            ['radiantAegis', 'divineInsight'],
            ['sanctifiedGround', 'angelicResonance'],
            ['eternalHarmony', 'seraphWard'],
        ],
        skills: {
            blessing: {
                name: '祝福',
                description: '每級讓全隊金幣獲得提升 20%。',
                tier: 1,
                maxLevel: 5,
                effects: [
                    { type: 'teamGoldBonus', valuePerLevel: 0.2 },
                ],
            },
            healingChorus: {
                name: '治癒合唱',
                description: '每級讓全隊經驗獲得提升 8%。',
                tier: 1,
                maxLevel: 5,
                effects: [
                    { type: 'teamXpBonus', valuePerLevel: 0.08 },
                ],
            },
            radiantAegis: {
                name: '聖光庇護',
                description: '需求：祝福等級 3。每級讓全隊傷害 +3%，金幣 +4%。',
                tier: 2,
                maxLevel: 4,
                prerequisites: [{ skillId: 'blessing', level: 3 }],
                effects: [
                    { type: 'teamDamageMultiplier', valuePerLevel: 0.03 },
                    { type: 'teamGoldBonus', valuePerLevel: 0.04 },
                ],
            },
            divineInsight: {
                name: '神聖洞察',
                description: '需求：治癒合唱等級 3。每級讓全隊經驗 +5%，巔峰經驗 +4%。',
                tier: 2,
                maxLevel: 4,
                prerequisites: [{ skillId: 'healingChorus', level: 3 }],
                effects: [
                    { type: 'teamXpBonus', valuePerLevel: 0.05 },
                    { type: 'paragonXpBonus', valuePerLevel: 0.04 },
                ],
            },
            sanctifiedGround: {
                name: '聖潔領域',
                description: '巔峰等級 2 解鎖。每級讓全隊傷害 +4%，經驗 +4%。',
                tier: 3,
                maxLevel: 3,
                unlockRequirement: { type: 'paragon', level: 2 },
                effects: [
                    { type: 'teamDamageMultiplier', valuePerLevel: 0.04 },
                    { type: 'teamXpBonus', valuePerLevel: 0.04 },
                ],
            },
            angelicResonance: {
                name: '天使共鳴',
                description: '需求：聖光庇護等級 2，巔峰等級 2。每級讓全隊金幣 +6%。',
                tier: 3,
                maxLevel: 3,
                prerequisites: [{ skillId: 'radiantAegis', level: 2 }],
                unlockRequirement: { type: 'paragon', level: 2 },
                effects: [
                    { type: 'teamGoldBonus', valuePerLevel: 0.06 },
                ],
            },
            eternalHarmony: {
                name: '永恆協奏',
                description: '轉生 1 次解鎖。每級讓全隊經驗 +7%，巔峰經驗 +6%。',
                tier: 4,
                maxLevel: 2,
                unlockRequirement: { type: 'rebirth', count: 1 },
                effects: [
                    { type: 'teamXpBonus', valuePerLevel: 0.07 },
                    { type: 'paragonXpBonus', valuePerLevel: 0.06 },
                ],
            },
            seraphWard: {
                name: '炽天守護',
                description: '需求：天使共鳴等級 2，轉生 1 次。每級讓全隊傷害 +6%，金幣 +5%。',
                tier: 4,
                maxLevel: 2,
                prerequisites: [{ skillId: 'angelicResonance', level: 2 }],
                unlockRequirement: { type: 'rebirth', count: 1 },
                effects: [
                    { type: 'teamDamageMultiplier', valuePerLevel: 0.06 },
                    { type: 'teamGoldBonus', valuePerLevel: 0.05 },
                ],
            },
        },
    },
    rogue: {
        name: '盜賊',
        icon: 'https://opengameart.org/sites/default/files/styles/medium/public/Dagger.PNG',
        baseDamage: 3,
        baseHp: 75,
        skillTiers: [
            ['swiftness', 'luckyFind'],
            ['venomStrike', 'blackMarket'],
            ['shadowNetwork', 'assassinsFocus'],
            ['timeThief', 'grandHeist'],
        ],
        skills: {
            swiftness: {
                name: '迅捷',
                description: '每級讓全隊經驗獲得提升 20%。',
                tier: 1,
                maxLevel: 5,
                effects: [
                    { type: 'teamXpBonus', valuePerLevel: 0.2 },
                ],
            },
            luckyFind: {
                name: '幸運嗅覺',
                description: '每級讓全隊金幣獲得提升 15%。',
                tier: 1,
                maxLevel: 5,
                effects: [
                    { type: 'teamGoldBonus', valuePerLevel: 0.15 },
                ],
            },
            venomStrike: {
                name: '劇毒突襲',
                description: '需求：迅捷等級 3。每級提升自身傷害 9%，追加 2 點傷害。',
                tier: 2,
                maxLevel: 4,
                prerequisites: [{ skillId: 'swiftness', level: 3 }],
                effects: [
                    { type: 'selfDamageMultiplier', valuePerLevel: 0.09 },
                    { type: 'selfFlatDamage', valuePerLevel: 2 },
                ],
            },
            blackMarket: {
                name: '黑市渠道',
                description: '需求：幸運嗅覺等級 3。每級讓全隊金幣 +5%，傷害 +2%。',
                tier: 2,
                maxLevel: 4,
                prerequisites: [{ skillId: 'luckyFind', level: 3 }],
                effects: [
                    { type: 'teamGoldBonus', valuePerLevel: 0.05 },
                    { type: 'teamDamageMultiplier', valuePerLevel: 0.02 },
                ],
            },
            shadowNetwork: {
                name: '影團情報網',
                description: '巔峰等級 2 解鎖。每級讓全隊金幣 +6%，經驗 +4%。',
                tier: 3,
                maxLevel: 3,
                unlockRequirement: { type: 'paragon', level: 2 },
                effects: [
                    { type: 'teamGoldBonus', valuePerLevel: 0.06 },
                    { type: 'teamXpBonus', valuePerLevel: 0.04 },
                ],
            },
            assassinsFocus: {
                name: '刺客專注',
                description: '需求：劇毒突襲等級 3，巔峰等級 2。每級提升自身傷害 14%。',
                tier: 3,
                maxLevel: 3,
                prerequisites: [{ skillId: 'venomStrike', level: 3 }],
                unlockRequirement: { type: 'paragon', level: 2 },
                effects: [
                    { type: 'selfDamageMultiplier', valuePerLevel: 0.14 },
                ],
            },
            timeThief: {
                name: '時光竊賊',
                description: '轉生 1 次解鎖。每級讓全隊經驗 +9%，巔峰經驗 +6%。',
                tier: 4,
                maxLevel: 2,
                unlockRequirement: { type: 'rebirth', count: 1 },
                effects: [
                    { type: 'teamXpBonus', valuePerLevel: 0.09 },
                    { type: 'paragonXpBonus', valuePerLevel: 0.06 },
                ],
            },
            grandHeist: {
                name: '終極劫掠',
                description: '需求：黑市渠道等級 3，轉生 1 次。每級讓全隊金幣 +8%，傷害 +4%。',
                tier: 4,
                maxLevel: 2,
                prerequisites: [{ skillId: 'blackMarket', level: 3 }],
                unlockRequirement: { type: 'rebirth', count: 1 },
                effects: [
                    { type: 'teamGoldBonus', valuePerLevel: 0.08 },
                    { type: 'teamDamageMultiplier', valuePerLevel: 0.04 },
                ],
            },
        },
    },
};

function collectSkillIds(classData) {
    if (!classData) {
        return [];
    }
    if (Array.isArray(classData.skillTiers)) {
        const ids = [];
        classData.skillTiers.forEach(tier => {
            tier.forEach(skillId => {
                if (ids.indexOf(skillId) === -1) {
                    ids.push(skillId);
                }
            });
        });
        return ids;
    }
    if (classData.skills) {
        return Object.keys(classData.skills);
    }
    return [];
}

const rarities = {
    common: { name: '普通', color: '#ffffff', powerMultiplier: 1.0, sellMultiplier: 5 },
    uncommon: { name: '罕見', color: '#1eff00', powerMultiplier: 1.6, sellMultiplier: 12 },
    rare: { name: '稀有', color: '#0070dd', powerMultiplier: 2.4, sellMultiplier: 25 },
    epic: { name: '史詩', color: '#a335ee', powerMultiplier: 3.2, sellMultiplier: 45 },
};

const itemAffixes = {
    damage: { name: '傷害加成', stat: 'damage', value: 0.05 },
    hp: { name: '生命加成', stat: 'hp', value: 0.06 },
    goldFind: { name: '金幣尋獲', stat: 'goldFind', value: 0.08 },
    xpGain: { name: '經驗獲得', stat: 'xpGain', value: 0.08 },
};

const baseItems = {
    weapon: [
        { name: '長劍' },
        { name: '法杖' },
        { name: '短弓' },
        { name: '匕首' },
    ],
    armor: [
        { name: '鍊甲' },
        { name: '法袍' },
        { name: '皮甲' },
        { name: '聖衣' },
    ],
    accessory: [
        { name: '金戒指' },
        { name: '翡翠護符' },
        { name: '水晶耳環' },
    ],
};

const GAME_TICK_MS = 200;
const FIREBALL_INTERVAL_S = 5;
const SAVE_INTERVAL_S = 15;
const LEVEL_CAP = 50;

const XP_BASE_REQUIREMENT = 100;
const XP_CAP_PER_LEVEL = 5000000;
const XP_GROWTH_STAGES = [
    { maxLevel: 10, growth: 1.35 },
    { maxLevel: 20, growth: 1.3 },
    { maxLevel: 35, growth: 1.22 },
    { maxLevel: LEVEL_CAP - 1, growth: 1.16 },
];

const PARAGON_XP_BASE = 5000;
const PARAGON_XP_GROWTH = 1.3;
const PARAGON_DAMAGE_BONUS_PER_LEVEL = 0.05;
const PARAGON_GOLD_BONUS_PER_LEVEL = 0.05;

const REBIRTH_DAMAGE_BONUS_PER_COUNT = 0.15;
const REBIRTH_GOLD_BONUS_PER_COUNT = 0.1;
const REBIRTH_XP_BONUS_PER_COUNT = 0.2;
const REBIRTH_REQUIREMENT = { paragonLevel: 5 };

function getParagonXpForLevel(level) {
    return Math.floor(PARAGON_XP_BASE * Math.pow(PARAGON_XP_GROWTH, level));
}

function createSkillMap(classData) {
    const ids = collectSkillIds(classData);
    const map = {};
    ids.forEach(skillId => {
        map[skillId] = 0;
    });
    return map;
}

function getXpGrowthForLevel(level) {
    for (let i = 0; i < XP_GROWTH_STAGES.length; i += 1) {
        const stage = XP_GROWTH_STAGES[i];
        if (level <= stage.maxLevel) {
            return stage.growth;
        }
    }
    return XP_GROWTH_STAGES[XP_GROWTH_STAGES.length - 1].growth;
}

const xpRequirementsTable = (() => {
    const table = [];
    let requirement = XP_BASE_REQUIREMENT;
    table[0] = 0;
    for (let level = 1; level < LEVEL_CAP; level += 1) {
        table[level] = Math.min(Math.floor(requirement), XP_CAP_PER_LEVEL);
        const nextGrowth = getXpGrowthForLevel(level + 1);
        requirement = Math.min(requirement * nextGrowth, XP_CAP_PER_LEVEL);
    }
    table[LEVEL_CAP] = XP_CAP_PER_LEVEL;
    return table;
})();

function getXpRequirementForLevel(level) {
    if (level <= 1) {
        return XP_BASE_REQUIREMENT;
    }
    const clamped = Math.min(Math.max(1, level), LEVEL_CAP);
    return xpRequirementsTable[clamped] || XP_CAP_PER_LEVEL;
}

const gameState = {
    gold: 0,
    party: [
        {
            id: 0,
            class: 'warrior',
            name: `${adventurerClasses.warrior.name} 1`,
            level: 1,
            xp: 0,
            xpToNextLevel: getXpRequirementForLevel(1),
            skillPoints: 0,
            skills: createSkillMap(adventurerClasses.warrior),
            equipment: { weapon: null, armor: null, accessory: null },
        },
    ],
    inventory: [],
    paragon: {
        level: 0,
        xp: 0,
        xpToNext: getParagonXpForLevel(0),
    },
    rebirth: {
        count: 0,
        bestParagonLevel: 0,
    },
    upgrades: {
        partyDamage: {
            level: 0,
            cost: 10,
            costMultiplier: 1.8,
            damageMultiplierBonus: 0.1,
        },
    },
    recruitment: {
        cost: 50,
        costMultiplier: 2.5,
    },
    unlockedMaps: ['forest'],
    currentMapId: 'forest',
    mapProgress: {
        forest: {
            clears: 0,
        },
    },
    currentMonsterIndex: 0,
    timers: {
        fireball: 0,
    },
    lastSaveTimestamp: null,
};

const maps = [
    {
        id: 'forest',
        name: '幽暗森林',
        description: '潮濕陰暗的森林，充滿最初的危機，用來磨練新人。',
        unlockCondition: { type: 'default' },
        goldModifier: 1,
        monsters: [
            { name: '史萊姆', maxHp: 28, xp: 12, gold: 3, dropChance: 0.1, image: 'https://opengameart.org/sites/default/files/styles/medium/public/slime_0.png' },
            { name: '哥布林', maxHp: 60, xp: 28, gold: 7, dropChance: 0.18, image: 'https://opengameart.org/sites/default/files/styles/medium/public/goblin_2.png' },
            { name: '獸人戰士', maxHp: 140, xp: 70, gold: 18, dropChance: 0.24, image: 'https://opengameart.org/sites/default/files/styles/medium/public/orc_1.png' },
            { name: '巨蝙蝠', maxHp: 220, xp: 120, gold: 32, dropChance: 0.3, image: 'https://opengameart.org/sites/default/files/bat.png' },
            { name: '石頭巨人', maxHp: 420, xp: 240, gold: 70, dropChance: 0.42, image: 'https://opengameart.org/sites/default/files/styles/medium/public/Golem_0.png' },
        ],
    },
    {
        id: 'frost',
        name: '冰封隘口',
        description: '嚴寒凜冬的高地，怪物血量與攻擊皆翻倍，適合作為巔峰之後的挑戰。',
        unlockCondition: { type: 'paragon', level: 2 },
        goldModifier: 0.9,
        monsters: [
            { name: '寒霜狼', maxHp: 520, xp: 320, gold: 110, dropChance: 0.34, image: 'https://opengameart.org/sites/default/files/styles/medium/public/wolf_gray.png' },
            { name: '冰霜薩滿', maxHp: 680, xp: 410, gold: 150, dropChance: 0.36, image: 'https://opengameart.org/sites/default/files/styles/medium/public/shaman.png' },
            { name: '雪巨魔', maxHp: 840, xp: 520, gold: 210, dropChance: 0.38, image: 'https://opengameart.org/sites/default/files/styles/medium/public/troll_0.png' },
            { name: '寒冰飛龍', maxHp: 1020, xp: 680, gold: 260, dropChance: 0.4, image: 'https://opengameart.org/sites/default/files/styles/medium/public/dragon.png' },
        ],
    },
    {
        id: 'ember',
        name: '烈焰深淵',
        description: '轉生者獨享的火焰之地，掉落稀有裝備與大量金幣。',
        unlockCondition: { type: 'rebirth', count: 1 },
        goldModifier: 0.75,
        monsters: [
            { name: '熔岩小鬼', maxHp: 1350, xp: 880, gold: 340, dropChance: 0.42, image: 'https://opengameart.org/sites/default/files/styles/medium/public/imp.png' },
            { name: '灰燼術士', maxHp: 1680, xp: 1080, gold: 420, dropChance: 0.44, image: 'https://opengameart.org/sites/default/files/styles/medium/public/mage_0.png' },
            { name: '活化火山', maxHp: 2100, xp: 1350, gold: 520, dropChance: 0.46, image: 'https://opengameart.org/sites/default/files/styles/medium/public/volcano.png' },
            { name: '焚世炎魔', maxHp: 2600, xp: 1680, gold: 660, dropChance: 0.5, image: 'https://opengameart.org/sites/default/files/styles/medium/public/demon.png' },
        ],
    },
];

const mapLookup = Object.fromEntries(maps.map(map => [map.id, map]));

const defaultGameState = JSON.parse(JSON.stringify(gameState));

let currentMonster = null;
