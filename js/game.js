let itemToEquipId = null;
let uiNeedsUpdate = false;

function getCurrentMap(state = gameState) {
    if (!state || !state.currentMapId) {
        return maps[0];
    }
    return mapLookup[state.currentMapId] || maps[0];
}

function resetGameStateToDefault() {
    const baseState = JSON.parse(JSON.stringify(defaultGameState));
    Object.keys(gameState).forEach(key => {
        delete gameState[key];
    });
    Object.assign(gameState, baseState);
}

function getSkillDataForMember(member, skillId) {
    if (!member) {
        return null;
    }
    const classData = adventurerClasses[member.class];
    if (!classData || !classData.skills) {
        return null;
    }
    return classData.skills[skillId] || null;
}

function isSkillUnlockedForState(skillData, state) {
    if (!skillData || !skillData.unlockRequirement) {
        return true;
    }
    const requirement = skillData.unlockRequirement;
    if (!requirement.type) {
        return true;
    }
    if (requirement.type === 'paragon') {
        const needed = requirement.level || 0;
        const current = state?.paragon?.level || 0;
        return current >= needed;
    }
    if (requirement.type === 'rebirth') {
        const needed = requirement.count || 0;
        const current = state?.rebirth?.count || 0;
        return current >= needed;
    }
    return true;
}

function formatUnlockRequirement(skillData) {
    if (!skillData || !skillData.unlockRequirement) {
        return '';
    }
    const requirement = skillData.unlockRequirement;
    if (requirement.type === 'paragon') {
        return `需要巔峰等級 ${requirement.level || 0}`;
    }
    if (requirement.type === 'rebirth') {
        return `需要轉生次數 ${requirement.count || 0}`;
    }
    return '尚未解鎖';
}

function checkSkillPrerequisites(member, skillData) {
    if (!skillData || !Array.isArray(skillData.prerequisites) || skillData.prerequisites.length === 0) {
        return { met: true, message: '' };
    }
    const unmet = [];
    const classData = adventurerClasses[member.class];
    skillData.prerequisites.forEach(prerequisite => {
        if (!prerequisite || !prerequisite.skillId) {
            return;
        }
        const requiredLevel = prerequisite.level || 1;
        const currentLevel = member.skills?.[prerequisite.skillId] || 0;
        if (currentLevel < requiredLevel) {
            const requiredSkill = classData?.skills?.[prerequisite.skillId];
            const skillName = requiredSkill ? requiredSkill.name : prerequisite.skillId;
            unmet.push(`${skillName} 等級 ${requiredLevel}`);
        }
    });

    if (unmet.length === 0) {
        return { met: true, message: '' };
    }
    return { met: false, message: `需求：${unmet.join('、')}` };
}

function getSkillStatus(member, skillId, state = gameState) {
    const skillData = getSkillDataForMember(member, skillId);
    const currentLevel = member?.skills?.[skillId] || 0;
    const maxLevel = skillData?.maxLevel || 0;
    const unlocked = isSkillUnlockedForState(skillData, state);
    const unlockReason = unlocked ? '' : formatUnlockRequirement(skillData);
    const prereqResult = unlocked ? checkSkillPrerequisites(member, skillData) : { met: false, message: '' };
    const atMax = maxLevel > 0 && currentLevel >= maxLevel;

    return {
        skillId,
        skillData,
        currentLevel,
        maxLevel,
        isUnlocked: unlocked,
        unlockReason,
        prerequisitesMet: prereqResult.met,
        prerequisiteReason: prereqResult.met ? '' : prereqResult.message,
        atMax,
        canUpgrade: unlocked && prereqResult.met && !atMax,
    };
}

function collectSkillEffects(member) {
    const effects = {
        selfDamageMultiplier: 1,
        selfFlatDamage: 0,
        teamDamageBonus: 0,
        teamGoldBonus: 0,
        teamXpBonus: 0,
        fireballFlat: 0,
        fireballMultiplier: 0,
        paragonXpBonus: 0,
        mapGoldModifier: 0,
    };

    if (!member) {
        return effects;
    }

    const classData = adventurerClasses[member.class];
    if (!classData || !classData.skills) {
        return effects;
    }

    const skillLevels = member.skills || {};
    Object.keys(skillLevels).forEach(skillId => {
        const level = skillLevels[skillId] || 0;
        if (level <= 0) {
            return;
        }
        const skillData = classData.skills[skillId];
        if (!skillData || !Array.isArray(skillData.effects)) {
            return;
        }

        skillData.effects.forEach(effect => {
            if (!effect || !effect.type) {
                return;
            }
            let perLevel = 0;
            if (effect.valuePerLevel != null) {
                perLevel = effect.valuePerLevel;
            } else if (effect.value != null) {
                perLevel = effect.value;
            }
            if (perLevel === 0) {
                return;
            }
            const totalValue = perLevel * level;
            switch (effect.type) {
                case 'selfDamageMultiplier':
                    effects.selfDamageMultiplier += totalValue;
                    break;
                case 'selfFlatDamage':
                    effects.selfFlatDamage += totalValue;
                    break;
                case 'teamDamageMultiplier':
                    effects.teamDamageBonus += totalValue;
                    break;
                case 'teamGoldBonus':
                    effects.teamGoldBonus += totalValue;
                    break;
                case 'teamXpBonus':
                    effects.teamXpBonus += totalValue;
                    break;
                case 'mapGoldModifier':
                    effects.mapGoldModifier += totalValue;
                    break;
                case 'fireballFlat':
                    effects.fireballFlat += totalValue;
                    break;
                case 'fireballMultiplier':
                    effects.fireballMultiplier += totalValue;
                    break;
                case 'paragonXpBonus':
                    effects.paragonXpBonus += totalValue;
                    break;
                default:
                    break;
            }
        });
    });

    return effects;
}

function getTeamSkillAggregates(state = gameState) {
    const aggregates = {
        teamDamageBonus: 0,
        teamGoldBonus: 0,
        teamXpBonus: 0,
        paragonXpBonus: 0,
        mapGoldBonus: 0,
        memberEffects: {},
    };

    (state.party || []).forEach(member => {
        const effects = collectSkillEffects(member);
        aggregates.memberEffects[member.id] = effects;
        aggregates.teamDamageBonus += effects.teamDamageBonus;
        aggregates.teamGoldBonus += effects.teamGoldBonus;
        aggregates.teamXpBonus += effects.teamXpBonus;
        aggregates.paragonXpBonus += effects.paragonXpBonus;
        aggregates.mapGoldBonus += effects.mapGoldModifier || 0;
    });

    return aggregates;
}

function getMonsterList(state = gameState) {
    const map = getCurrentMap(state);
    return map && Array.isArray(map.monsters) && map.monsters.length > 0 ? map.monsters : maps[0].monsters;
}

function getGoldScalingFactor(avgLevel) {
    if (!avgLevel || avgLevel <= 20) {
        return 1;
    }
    if (avgLevel <= 40) {
        return 1 + (avgLevel - 20) * 0.02;
    }
    if (avgLevel <= 70) {
        return 1.4 + (avgLevel - 40) * 0.015;
    }
    return Math.min(2.3, 1.85 + (avgLevel - 70) * 0.005);
}

function canUnlockMap(map, state = gameState) {
    if (!map || !map.unlockCondition) {
        return true;
    }
    const condition = map.unlockCondition;
    if (condition.type === 'default') {
        return true;
    }
    if (condition.type === 'paragon') {
        const paragonLevel = state.paragon?.level || 0;
        return paragonLevel >= (condition.level || 0);
    }
    if (condition.type === 'rebirth') {
        const rebirthCount = state.rebirth?.count || 0;
        return rebirthCount >= (condition.count || 0);
    }
    return false;
}

function checkMapUnlocks(state = gameState) {
    if (!Array.isArray(state.unlockedMaps)) {
        state.unlockedMaps = [];
    }
    maps.forEach(map => {
        if (state.unlockedMaps.includes(map.id)) {
            return;
        }
        if (canUnlockMap(map, state)) {
            state.unlockedMaps.push(map.id);
            state.mapProgress = state.mapProgress || {};
            if (!state.mapProgress[map.id]) {
                state.mapProgress[map.id] = { clears: 0 };
            }
            addLogMessage(`<span style="color:#4fc3f7">解鎖新地圖：${map.name}</span>`);
            uiNeedsUpdate = true;
        }
    });
}

function updateRebirthBestParagon() {
    if (!gameState.rebirth) {
        gameState.rebirth = { count: 0, bestParagonLevel: 0 };
    }
    const best = gameState.rebirth.bestParagonLevel || 0;
    const current = gameState.paragon?.level || 0;
    if (current > best) {
        gameState.rebirth.bestParagonLevel = current;
    }
}

function getScaledMonster(monsterIndex, state) {
    const monsterList = getMonsterList(state);
    const base = monsterList[monsterIndex % monsterList.length];
    const party = state.party && state.party.length > 0 ? state.party : gameState.party;
    const avgLevel = party.reduce((sum, member) => sum + (member.level || 1), 0) / party.length;
    const scaling = 1 + Math.min(avgLevel - 1, 80) * 0.45;
    const goldScaling = scaling * getGoldScalingFactor(avgLevel);

    return {
        name: base.name,
        dropChance: base.dropChance,
        image: base.image,
        maxHp: Math.max(1, Math.round(base.maxHp * scaling)),
        xp: Math.max(1, Math.round(base.xp * scaling)),
        gold: Math.max(1, Math.round(base.gold * goldScaling)),
        avgLevel,
    };
}

function attackMonster() {
    if (!currentMonster) {
        return;
    }

    const damage = calculateDamage();
    currentMonster.hp -= damage;
    if (currentMonster.hp < 0) {
        currentMonster.hp = 0;
    }
    uiNeedsUpdate = true;

    if (currentMonster.hp <= 0) {
        handleMonsterDefeat();
    }
}

function handleMonsterDefeat() {
    addLogMessage(`擊敗了 ${currentMonster.name}！`);
    gainGold(currentMonster.gold);
    gainXP(currentMonster.xp);

    if (Math.random() < currentMonster.dropChance) {
        const newItem = generateRandomItem();
        gameState.inventory.push(newItem);
        addLogMessage(`找到 <span style="color:${rarities[newItem.rarity].color}">${newItem.name}</span>。`);
    }

    spawnNextMonster();
}

function handleMapClear() {
    const map = getCurrentMap(gameState);
    gameState.mapProgress = gameState.mapProgress || {};
    if (!gameState.mapProgress[map.id]) {
        gameState.mapProgress[map.id] = { clears: 0 };
    }
    gameState.mapProgress[map.id].clears += 1;
    addLogMessage(`<span style="color:#81c784">完成 ${map.name} 第 ${gameState.mapProgress[map.id].clears} 輪！</span>`);
    checkMapUnlocks();
}

function switchMap(mapId) {
    const targetMap = mapLookup[mapId];
    if (!targetMap) {
        addLogMessage('<span style="color:#ff5252">找不到該地圖。</span>');
        return;
    }
    if (!Array.isArray(gameState.unlockedMaps) || gameState.unlockedMaps.indexOf(mapId) === -1) {
        addLogMessage('<span style="color:#ff5252">尚未解鎖該地圖。</span>');
        return;
    }
    if (gameState.currentMapId === mapId) {
        addLogMessage(`<span style="color:#90caf9">已在 ${targetMap.name} 探險中。</span>`);
        return;
    }

    gameState.currentMapId = mapId;
    gameState.currentMonsterIndex = 0;
    currentMonster = null;
    spawnMonster(0);
    addLogMessage(`<span style="color:#64b5f6">轉往 ${targetMap.name}，重新整隊出發！</span>`);
    uiNeedsUpdate = true;
}

function generateRandomItem() {
    const roll = Math.random();
    let rarity = 'common';
    if (roll < 0.05) {
        rarity = 'epic';
    } else if (roll < 0.2) {
        rarity = 'rare';
    } else if (roll < 0.5) {
        rarity = 'uncommon';
    }
    const rarityData = rarities[rarity];

    const slots = Object.keys(baseItems);
    const slot = slots[Math.floor(Math.random() * slots.length)];
    const baseItem = baseItems[slot][Math.floor(Math.random() * baseItems[slot].length)];

    const item = {
        id: Date.now() + Math.random(),
        name: `${rarityData.name} ${baseItem.name}`,
        slot,
        rarity,
        affixes: [],
    };

    const possibleAffixes = Object.keys(itemAffixes);
    const affixCount = 1 + Math.floor(Math.random() * Math.max(1, rarityData.powerMultiplier));
    for (let i = 0; i < affixCount && possibleAffixes.length > 0; i++) {
        const index = Math.floor(Math.random() * possibleAffixes.length);
        const affixId = possibleAffixes.splice(index, 1)[0];
        const affixData = itemAffixes[affixId];
        const valueRoll = affixData.value * (0.6 + Math.random() * rarityData.powerMultiplier);
        item.affixes.push({
            id: affixId,
            name: affixData.name,
            stat: affixData.stat,
            value: Number(valueRoll.toFixed(4)),
        });
    }

    return item;
}

function spawnNextMonster() {
    const monsterList = getMonsterList(gameState);
    const nextIndex = (gameState.currentMonsterIndex + 1) % monsterList.length;
    spawnMonster(nextIndex);
    if (nextIndex === 0) {
        handleMapClear();
    }
}

function spawnMonster(index) {
    const monsterList = getMonsterList(gameState);
    const scaled = getScaledMonster(index % monsterList.length, gameState);
    currentMonster = {
        name: scaled.name,
        maxHp: scaled.maxHp,
        hp: scaled.maxHp,
        xp: scaled.xp,
        gold: scaled.gold,
        dropChance: scaled.dropChance,
        image: scaled.image,
    };
    gameState.currentMonsterIndex = index % monsterList.length;

    const map = getCurrentMap(gameState);
    addLogMessage(`出現了等級 ${Math.max(1, Math.floor(scaled.avgLevel))} 的 ${map.name}怪物 ${currentMonster.name}！`);
    uiNeedsUpdate = true;
}

function gainGold(amount) {
    let goldMultiplier = 1;
    const aggregates = getTeamSkillAggregates(gameState);
    goldMultiplier += aggregates.teamGoldBonus || 0;

    gameState.party.forEach(member => {
        Object.values(member.equipment || {}).forEach(item => {
            if (!item) {
                return;
            }
            item.affixes.forEach(affix => {
                if (affix.stat === 'goldFind') {
                    goldMultiplier += affix.value;
                }
            });
        });
    });

    const paragonBonus = 1 + (gameState.paragon?.level || 0) * PARAGON_GOLD_BONUS_PER_LEVEL;
    const rebirthBonus = 1 + (gameState.rebirth?.count || 0) * REBIRTH_GOLD_BONUS_PER_COUNT;
    const mapModifier = getCurrentMap(gameState)?.goldModifier || 1;
    const skillMapBonus = 1 + (aggregates.mapGoldBonus || 0);
    const finalAmount = Math.max(1, Math.round(amount * goldMultiplier * paragonBonus * rebirthBonus * mapModifier * skillMapBonus));
    gameState.gold += finalAmount;
    addLogMessage(`獲得 ${finalAmount} 金幣。`);
    uiNeedsUpdate = true;
}

function gainXP(amount) {
    let xpMultiplier = 1;
    const aggregates = getTeamSkillAggregates(gameState);
    xpMultiplier += aggregates.teamXpBonus || 0;

    gameState.party.forEach(member => {
        Object.values(member.equipment || {}).forEach(item => {
            if (!item) {
                return;
            }
            item.affixes.forEach(affix => {
                if (affix.stat === 'xpGain') {
                    xpMultiplier += affix.value;
                }
            });
        });
    });

    const rebirthBonus = 1 + (gameState.rebirth?.count || 0) * REBIRTH_XP_BONUS_PER_COUNT;
    const finalAmount = Math.max(1, Math.round(amount * xpMultiplier * rebirthBonus));
    let paragonEligibleMembers = 0;
    gameState.party.forEach(member => {
        member.xp = (member.xp || 0) + finalAmount;
        processMemberLevelUps(member);
        if (member.level >= LEVEL_CAP) {
            paragonEligibleMembers += 1;
        }
    });

    addLogMessage(`全隊獲得 ${finalAmount} 經驗。`);
    if (paragonEligibleMembers > 0) {
        const paragonSkillBonus = 1 + (aggregates.paragonXpBonus || 0);
        const paragonXpGain = Math.round(finalAmount * paragonEligibleMembers * paragonSkillBonus);
        addParagonXp(paragonXpGain);
    }
    uiNeedsUpdate = true;
}

function addParagonXp(amount, state, silent) {
    const targetState = state || gameState;
    if (!targetState.paragon) {
        targetState.paragon = {
            level: 0,
            xp: 0,
            xpToNext: getParagonXpForLevel(0),
        };
    }
    if (amount <= 0) {
        return;
    }

    targetState.paragon.xp += amount;
    let leveledUp = false;
    while (targetState.paragon.xp >= targetState.paragon.xpToNext) {
        targetState.paragon.xp -= targetState.paragon.xpToNext;
        targetState.paragon.level += 1;
        targetState.paragon.xpToNext = getParagonXpForLevel(targetState.paragon.level);
        leveledUp = true;
        if (targetState === gameState) {
            updateRebirthBestParagon();
            if (!silent) {
                addLogMessage(`<span style="color:#ffa726">巔峰等級提升至 ${targetState.paragon.level}！</span>`);
            }
            checkMapUnlocks();
        } else {
            if (!targetState.rebirth) {
                targetState.rebirth = { count: 0, bestParagonLevel: 0 };
            }
            if (targetState.paragon.level > (targetState.rebirth.bestParagonLevel || 0)) {
                targetState.rebirth.bestParagonLevel = targetState.paragon.level;
            }
        }
    }
    if (targetState === gameState && (leveledUp || amount > 0) && !silent) {
        uiNeedsUpdate = true;
    }
}

function canRebirth() {
    if (!REBIRTH_REQUIREMENT) {
        return true;
    }
    if (REBIRTH_REQUIREMENT.paragonLevel != null) {
        const currentParagon = gameState.paragon?.level || 0;
        if (currentParagon < REBIRTH_REQUIREMENT.paragonLevel) {
            return false;
        }
    }
    return true;
}

function performRebirth() {
    if (!canRebirth()) {
        addLogMessage('<span style="color:#ff5252">尚未達成轉生條件。</span>');
        return;
    }

    const newRebirthCount = (gameState.rebirth?.count || 0) + 1;
    const bestParagonLevel = Math.max(gameState.rebirth?.bestParagonLevel || 0, gameState.paragon?.level || 0);

    resetGameStateToDefault();

    gameState.rebirth = {
        count: newRebirthCount,
        bestParagonLevel,
    };
    gameState.paragon = {
        level: 0,
        xp: 0,
        xpToNext: getParagonXpForLevel(0),
    };
    gameState.unlockedMaps = ['forest'];
    gameState.currentMapId = 'forest';
    gameState.mapProgress = {
        forest: {
            clears: 0,
        },
    };
    gameState.lastSaveTimestamp = Date.now();

    currentMonster = null;
    spawnMonster(0);
    addLogMessage(`<span style="color:#ff7043">第 ${gameState.rebirth.count} 次轉生完成，永久屬性提升！</span>`);
    checkMapUnlocks();
    uiNeedsUpdate = true;
    saveGame();
}

function processMemberLevelUps(member) {
    while (member.level < LEVEL_CAP && member.xp >= member.xpToNextLevel) {
        levelUp(member);
    }
    if (member.level >= LEVEL_CAP && member.xp > member.xpToNextLevel) {
        member.xp = member.xpToNextLevel;
    }
}

function levelUp(member) {
    if (member.level >= LEVEL_CAP) {
        member.level = LEVEL_CAP;
        member.xp = member.xpToNextLevel;
        return;
    }

    member.level += 1;
    member.xp -= member.xpToNextLevel;
    member.skillPoints = (member.skillPoints || 0) + 1;
    if (member.level >= LEVEL_CAP) {
        member.level = LEVEL_CAP;
        member.xp = member.xpToNextLevel;
        addLogMessage(`${member.name} 已達巔峰等級 ${LEVEL_CAP}，額外技能點 +1！`);
    } else {
        member.xpToNextLevel = getXpRequirementForLevel(member.level);
        addLogMessage(`${member.name} 升到 ${member.level} 級，獲得 1 點技能點。`);
    }
}

function calculateDamage() {
    return calculateDamageWithState(gameState);
}

function calculateDamageWithState(state) {
    const upgrade = state.upgrades?.partyDamage;
    const globalMultiplier = 1 + (upgrade ? upgrade.level * upgrade.damageMultiplierBonus : 0);
    const paragonLevel = state.paragon?.level || 0;
    const rebirthCount = state.rebirth?.count || 0;
    const paragonMultiplier = 1 + paragonLevel * PARAGON_DAMAGE_BONUS_PER_LEVEL;
    const rebirthMultiplier = 1 + rebirthCount * REBIRTH_DAMAGE_BONUS_PER_COUNT;
    const aggregates = getTeamSkillAggregates(state);
    const teamDamageMultiplier = 1 + (aggregates.teamDamageBonus || 0);

    let total = 0;
    (state.party || []).forEach(member => {
        const classData = adventurerClasses[member.class];
        if (!classData) {
            return;
        }

        const memberEffects = aggregates.memberEffects[member.id] || collectSkillEffects(member);

        let baseDamage = classData.baseDamage + ((member.level || 1) - 1) + (memberEffects.selfFlatDamage || 0);
        let skillMultiplier = memberEffects.selfDamageMultiplier || 1;

        let equipmentMultiplier = 1;
        Object.values(member.equipment || {}).forEach(item => {
            if (!item) {
                return;
            }
            item.affixes.forEach(affix => {
                if (affix.stat === 'damage') {
                    equipmentMultiplier += affix.value;
                }
            });
        });

        total += baseDamage * skillMultiplier * equipmentMultiplier;
    });

    return total * globalMultiplier * paragonMultiplier * rebirthMultiplier * teamDamageMultiplier;
}

function buyDamageUpgrade() {
    const upgrade = gameState.upgrades.partyDamage;
    if (gameState.gold < upgrade.cost) {
        addLogMessage('金幣不足，無法購買強化。');
        return;
    }

    gameState.gold -= upgrade.cost;
    upgrade.level += 1;
    upgrade.cost = Math.floor(upgrade.cost * upgrade.costMultiplier);
    addLogMessage(`隊伍輸出提升至等級 ${upgrade.level}。`);
    uiNeedsUpdate = true;
}

function recruitAdventurer(className) {
    if (gameState.party.length >= MAX_PARTY_SIZE) {
        addLogMessage('隊伍已滿。');
        return;
    }

    const classData = adventurerClasses[className];
    if (!classData) {
        addLogMessage('無法招募未知職業。');
        return;
    }

    if (gameState.gold < gameState.recruitment.cost) {
        addLogMessage('金幣不足，無法招募。');
        return;
    }

    gameState.gold -= gameState.recruitment.cost;
    const nextId = gameState.party.reduce((max, member) => Math.max(max, member.id), -1) + 1;
    const sameClassCount = gameState.party.filter(member => member.class === className).length;

    const newMember = {
        id: nextId,
        class: className,
        name: `${classData.name} ${sameClassCount + 1}`,
        level: 1,
        xp: 0,
        xpToNextLevel: getXpRequirementForLevel(1),
        skillPoints: 0,
        skills: createSkillMap(classData),
        equipment: { weapon: null, armor: null, accessory: null },
    };

    gameState.party.push(newMember);
    gameState.recruitment.cost = Math.floor(gameState.recruitment.cost * gameState.recruitment.costMultiplier);
    addLogMessage(`招募了一位新的 ${classData.name}！`);
    uiNeedsUpdate = true;
}

function castFireball() {
    const aggregates = getTeamSkillAggregates(gameState);
    let totalDamage = 0;
    gameState.party.forEach(member => {
        if (member.class !== 'mage') {
            return;
        }
        const effects = aggregates.memberEffects[member.id] || collectSkillEffects(member);
        const baseDamage = effects.fireballFlat || 0;
        const multiplier = 1 + (effects.fireballMultiplier || 0);
        if (baseDamage <= 0 && multiplier <= 1) {
            return;
        }
        totalDamage += baseDamage * multiplier;
    });

    if (totalDamage <= 0 || !currentMonster) {
        return;
    }

    currentMonster.hp -= totalDamage;
    addLogMessage(`施放火球造成 ${Math.round(totalDamage)} 點傷害！`);
    if (currentMonster.hp < 0) {
        currentMonster.hp = 0;
    }
    uiNeedsUpdate = true;

    if (currentMonster.hp <= 0) {
        handleMonsterDefeat();
    }
}

function upgradeSkill(memberId, skillId) {
    const member = gameState.party.find(m => m.id === memberId);
    if (!member) {
        return;
    }

    if (member.skillPoints <= 0) {
        addLogMessage('技能點不足。');
        return;
    }

    const status = getSkillStatus(member, skillId);
    const skillData = status.skillData;
    if (!skillData) {
        addLogMessage('無法升級未知技能。');
        return;
    }

    if (!status.isUnlocked) {
        addLogMessage(status.unlockReason || '技能尚未解鎖。');
        return;
    }

    if (!status.prerequisitesMet) {
        addLogMessage(status.prerequisiteReason || '尚未滿足前置條件。');
        return;
    }

    if (status.atMax) {
        addLogMessage(`${skillData.name} 已達到上限。`);
        return;
    }

    member.skillPoints -= 1;
    member.skills[skillId] = status.currentLevel + 1;
    addLogMessage(`${member.name} 的 ${skillData.name} 升至等級 ${member.skills[skillId]}。`);
    uiNeedsUpdate = true;
}

function equipItem(itemId, memberId) {
    const member = gameState.party.find(m => m.id === memberId);
    const itemIndex = gameState.inventory.findIndex(item => item.id === itemId);
    if (!member || itemIndex === -1) {
        return;
    }

    const item = gameState.inventory[itemIndex];
    const slot = item.slot;
    if (member.equipment[slot]) {
        gameState.inventory.push(member.equipment[slot]);
    }

    member.equipment[slot] = item;
    gameState.inventory.splice(itemIndex, 1);
    itemToEquipId = null;

    addLogMessage(`${member.name} 裝備了 ${item.name}。`);
    uiNeedsUpdate = true;
}

function unequipItem(memberId, slot) {
    const member = gameState.party.find(m => m.id === memberId);
    if (!member || !member.equipment[slot]) {
        return;
    }

    const item = member.equipment[slot];
    member.equipment[slot] = null;
    gameState.inventory.push(item);

    addLogMessage(`${member.name} 卸下了 ${item.name}。`);
    uiNeedsUpdate = true;
}

function calculateSellValue(item) {
    if (!item) {
        return 0;
    }
    const rarityData = rarities[item.rarity];
    const baseValue = rarityData ? rarityData.sellMultiplier : 5;
    const affixBonus = item.affixes.reduce((sum, affix) => sum + affix.value * 40, 0);
    return Math.max(1, Math.round(baseValue + affixBonus));
}

function sellItem(itemId) {
    const itemIndex = gameState.inventory.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
        return;
    }

    const item = gameState.inventory[itemIndex];
    const value = calculateSellValue(item);
    gameState.gold += value;
    gameState.inventory.splice(itemIndex, 1);
    addLogMessage(`出售 ${item.name}，獲得 ${value} 金幣。`);
    uiNeedsUpdate = true;
}

function equipBestItems() {
    const pooledItems = [...gameState.inventory];
    gameState.party.forEach(member => {
        Object.keys(member.equipment).forEach(slot => {
            if (member.equipment[slot]) {
                pooledItems.push(member.equipment[slot]);
                member.equipment[slot] = null;
            }
        });
    });

    const equippedIds = new Set();
    Object.keys(baseItems).forEach(slot => {
        const candidates = pooledItems.filter(item => item.slot === slot);
        candidates.sort((a, b) => getPowerScore(b) - getPowerScore(a));
        gameState.party.forEach((member, index) => {
            const bestItem = candidates[index];
            if (!bestItem) {
                return;
            }
            member.equipment[slot] = bestItem;
            equippedIds.add(bestItem.id);
        });
    });

    const leftovers = pooledItems.filter(item => !equippedIds.has(item.id));
    let goldFromSales = 0;
    leftovers.forEach(item => {
        goldFromSales += calculateSellValue(item);
    });
    if (goldFromSales > 0) {
        gameState.gold += goldFromSales;
        addLogMessage(`自動出售 ${leftovers.length} 件裝備，獲得 ${goldFromSales} 金幣。`);
    }

    gameState.inventory = [];
    addLogMessage('全隊已佩戴最佳裝備。');
    uiNeedsUpdate = true;
}

function getPowerScore(item) {
    if (!item) {
        return 0;
    }
    const rarityData = rarities[item.rarity];
    let score = rarityData ? rarityData.powerMultiplier * 10 : 0;
    item.affixes.forEach(affix => {
        score += affix.value * 100;
    });
    return score;
}

function isUpgrade(item) {
    return gameState.party.some(member => {
        const currentItem = member.equipment[item.slot];
        return getPowerScore(item) > getPowerScore(currentItem);
    });
}

const SAVE_KEY = 'idleRPGSave';

function saveGame() {
    try {
        gameState.lastSaveTimestamp = Date.now();
        localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
    } catch (error) {
        console.error('無法儲存遊戲：', error);
        addLogMessage('<span style="color:red;">儲存失敗，請檢查瀏覽器設定。</span>');
    }
}

function loadGame() {
    let savedStateJSON;
    try {
        savedStateJSON = localStorage.getItem(SAVE_KEY);
    } catch (error) {
        console.error('無法讀取存檔：', error);
        return false;
    }

    if (!savedStateJSON) {
        return false;
    }

    let savedState;
    try {
        savedState = JSON.parse(savedStateJSON);
    } catch (error) {
        console.error('存檔已損毀：', error);
        return false;
    }

    ensureStateIntegrity(savedState);
    applyOfflineProgress(savedState);

    Object.assign(gameState, savedState);
    gameState.party = savedState.party;
    gameState.inventory = savedState.inventory;
    gameState.upgrades = savedState.upgrades;
    gameState.recruitment = savedState.recruitment;
    gameState.timers = savedState.timers;

    checkMapUnlocks();

    spawnMonster(gameState.currentMonsterIndex || 0);
    addLogMessage('讀取存檔成功。');
    return true;
}

function ensureStateIntegrity(state) {
    state.party = (state.party || []).map((member, index) => {
        const resolvedClass = adventurerClasses[member.class] ? member.class : 'warrior';
        const classData = adventurerClasses[resolvedClass];
        const sanitizedSkills = { ...createSkillMap(classData) };
        Object.entries(member.skills || {}).forEach(([skillId, level]) => {
            if (classData.skills[skillId]) {
                const numericLevel = Number(level) || 0;
                const maxLevel = classData.skills[skillId].maxLevel || 0;
                sanitizedSkills[skillId] = Math.max(0, Math.min(numericLevel, maxLevel));
            }
        });
        const levelValue = member.level || 1;
        const xpRequirement = getXpRequirementForLevel(Math.min(levelValue, LEVEL_CAP));
        return {
            id: member.id ?? index,
            class: resolvedClass,
            name: member.name || `${classData.name} ${index + 1}`,
            level: levelValue,
            xp: Math.min(member.xp || 0, xpRequirement),
            xpToNextLevel: xpRequirement,
            skillPoints: member.skillPoints || 0,
            skills: sanitizedSkills,
            equipment: {
                weapon: member.equipment?.weapon || null,
                armor: member.equipment?.armor || null,
                accessory: member.equipment?.accessory || null,
            },
        };
    });

    if (state.party.length === 0) {
        state.party = JSON.parse(JSON.stringify(gameState.party));
    }

    state.inventory = Array.isArray(state.inventory) ? state.inventory : [];

    if (!state.upgrades || !state.upgrades.partyDamage) {
        state.upgrades = JSON.parse(JSON.stringify(gameState.upgrades));
    }

    if (!state.recruitment) {
        state.recruitment = { ...gameState.recruitment };
    }

    if (!state.timers) {
        state.timers = { ...gameState.timers };
    }

    if (typeof state.currentMonsterIndex !== 'number') {
        state.currentMonsterIndex = 0;
    }

    if (!state.paragon) {
        state.paragon = {
            level: 0,
            xp: 0,
            xpToNext: getParagonXpForLevel(0),
        };
    } else {
        if (typeof state.paragon.level !== 'number' || state.paragon.level < 0) {
            state.paragon.level = 0;
        }
        if (typeof state.paragon.xp !== 'number' || state.paragon.xp < 0) {
            state.paragon.xp = 0;
        }
        state.paragon.xpToNext = getParagonXpForLevel(state.paragon.level);
    }

    if (!state.rebirth) {
        state.rebirth = { count: 0, bestParagonLevel: 0 };
    } else {
        if (typeof state.rebirth.count !== 'number' || state.rebirth.count < 0) {
            state.rebirth.count = 0;
        }
        if (typeof state.rebirth.bestParagonLevel !== 'number' || state.rebirth.bestParagonLevel < 0) {
            state.rebirth.bestParagonLevel = state.paragon.level;
        }
    }

    if (!Array.isArray(state.unlockedMaps)) {
        state.unlockedMaps = ['forest'];
    }
    if (state.unlockedMaps.length === 0) {
        state.unlockedMaps.push('forest');
    }
    if (state.unlockedMaps.indexOf('forest') === -1) {
        state.unlockedMaps.push('forest');
    }

    state.currentMapId = state.currentMapId || 'forest';
    if (state.unlockedMaps.indexOf(state.currentMapId) === -1) {
        state.currentMapId = 'forest';
    }

    state.mapProgress = state.mapProgress || {};
    state.unlockedMaps.forEach(mapId => {
        if (!state.mapProgress[mapId]) {
            state.mapProgress[mapId] = { clears: 0 };
        }
    });

    addParagonXp(0, state, true);
}

function applyOfflineProgress(state) {
    if (!state.lastSaveTimestamp) {
        return;
    }

    const elapsedMs = Date.now() - state.lastSaveTimestamp;
    if (elapsedMs < 5000) {
        return;
    }

    const scaled = getScaledMonster(state.currentMonsterIndex || 0, state);
    const damagePerTick = calculateDamageWithState(state);
    if (damagePerTick <= 0) {
        return;
    }

    const timePerKillMs = (scaled.maxHp / damagePerTick) * GAME_TICK_MS;
    if (timePerKillMs <= 0) {
        return;
    }

    const monstersDefeated = Math.floor(elapsedMs / timePerKillMs);
    if (monstersDefeated <= 0) {
        return;
    }

    const aggregates = getTeamSkillAggregates(state);

    let offlineGoldMultiplier = 1 + (aggregates.teamGoldBonus || 0);
    let offlineXpMultiplier = 1 + (aggregates.teamXpBonus || 0);
    (state.party || []).forEach(member => {
        if (member && member.equipment) {
            Object.values(member.equipment).forEach(item => {
                if (!item) {
                    return;
                }
                item.affixes.forEach(affix => {
                    if (affix.stat === 'goldFind') {
                        offlineGoldMultiplier += affix.value;
                    }
                    if (affix.stat === 'xpGain') {
                        offlineXpMultiplier += affix.value;
                    }
                });
            });
        }
    });

    const paragonGoldBonus = 1 + (state.paragon?.level || 0) * PARAGON_GOLD_BONUS_PER_LEVEL;
    const rebirthGoldBonus = 1 + (state.rebirth?.count || 0) * REBIRTH_GOLD_BONUS_PER_COUNT;
    const mapModifier = getCurrentMap(state)?.goldModifier || 1;
    const skillMapBonus = 1 + (aggregates.mapGoldBonus || 0);
    const goldGained = Math.max(1, Math.round(monstersDefeated * scaled.gold * offlineGoldMultiplier * paragonGoldBonus * rebirthGoldBonus * mapModifier * skillMapBonus));

    const rebirthXpBonus = 1 + (state.rebirth?.count || 0) * REBIRTH_XP_BONUS_PER_COUNT;
    const xpGainedEach = Math.max(1, Math.round(monstersDefeated * scaled.xp * offlineXpMultiplier * rebirthXpBonus));

    state.gold = (state.gold || 0) + goldGained;
    let paragonEligibleMembers = 0;
    (state.party || []).forEach(member => {
        member.xp = (member.xp || 0) + xpGainedEach;
        processMemberLevelUps(member);
        if (member.level >= LEVEL_CAP) {
            paragonEligibleMembers += 1;
        }
    });

    if (paragonEligibleMembers > 0) {
        const paragonSkillBonus = 1 + (aggregates.paragonXpBonus || 0);
        const paragonAmount = Math.round(xpGainedEach * paragonEligibleMembers * paragonSkillBonus);
        addParagonXp(paragonAmount, state, true);
    }

    addLogMessage(`離線冒險 ${Math.floor(elapsedMs / 1000)} 秒，擊敗 ${monstersDefeated} 隻怪物。`);
    addLogMessage(`額外獲得 ${goldGained} 金幣與 ${xpGainedEach} 經驗。`);
}
