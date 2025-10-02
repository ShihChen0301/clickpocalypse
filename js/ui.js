const skillPanelState = {};
let partyScrollPosition = 0;

function updateUI() {
    try {
        // Set visibility of header buttons based on equip mode
        const inEquipMode = itemToEquipId !== null;
        document.getElementById('equip-best-btn').style.display = inEquipMode ? 'none' : 'inline-block';
        document.getElementById('cancel-equip-btn').style.display = inEquipMode ? 'inline-block' : 'none';

        // Party Stats
        const partyContainer = document.getElementById('party-container');
        const previousPartyScroll = partyContainer.scrollTop;

        partyContainer.innerHTML = ''; 

        gameState.party.forEach(member => {
            const classData = adventurerClasses[member.class];
            const card = document.createElement('div');
            card.className = 'adventurer-card';
            card.dataset.memberId = member.id; // Set member ID for click targeting
            if (inEquipMode) {
                card.classList.add('targetable');
            }

            // --- Skills HTML ---
            let skillsHTML = '<div class="skills-section"><h5>技能</h5>';
            skillsHTML += `<div class="skill-points">技能點：${member.skillPoints}</div>`;

            const tiers = Array.isArray(classData.skillTiers) && classData.skillTiers.length > 0
                ? classData.skillTiers
                : [Object.keys(member.skills || {})];

            const memberSkillState = skillPanelState[member.id] || { openTiers: {} };
            if (!skillPanelState[member.id]) {
                skillPanelState[member.id] = memberSkillState;
            }

            tiers.forEach((tierSkills, tierIndex) => {
                const tierClass = tierIndex === 0 ? 'skill-tier first-tier' : 'skill-tier';
                const hasInvestedSkill = tierSkills.some(skillId => (member.skills?.[skillId] || 0) > 0);
                if (memberSkillState.openTiers[tierIndex] === undefined) {
                    memberSkillState.openTiers[tierIndex] = tierIndex === 0 || hasInvestedSkill;
                }
                const shouldOpen = Boolean(memberSkillState.openTiers[tierIndex]);
                skillsHTML += `<details class="${tierClass}" data-member-id="${member.id}" data-tier-index="${tierIndex}" ${shouldOpen ? 'open' : ''}>`;
                skillsHTML += `<summary class="skill-tier-title">第 ${tierIndex + 1} 層</summary>`;
                tierSkills.forEach(skillId => {
                    const skillData = classData.skills[skillId];
                    if (!skillData) {
                        return;
                    }
                    const status = typeof getSkillStatus === 'function' ? getSkillStatus(member, skillId) : null;
                    const currentLevel = status ? status.currentLevel : (member.skills?.[skillId] || 0);
                    const maxLevel = status ? status.maxLevel : (skillData.maxLevel || 0);
                    const levelText = `${currentLevel}/${maxLevel}`;

                    let actionHTML = '';
                    if (status) {
                        if (status.atMax) {
                            actionHTML = '<span class="skill-status">已滿</span>';
                        } else if (!status.isUnlocked) {
                            actionHTML = `<span class="skill-status">${status.unlockReason || '尚未解鎖'}</span>`;
                        } else if (!status.prerequisitesMet) {
                            actionHTML = `<span class="skill-status">${status.prerequisiteReason || '需求未達成'}</span>`;
                        } else if (member.skillPoints > 0 && status.canUpgrade) {
                            actionHTML = `<button class="upgrade-skill-btn" data-member-id="${member.id}" data-skill-id="${skillId}">+</button>`;
                        } else {
                            actionHTML = '<span class="skill-status">技能點不足</span>';
                        }
                    }

                    skillsHTML += `
                        <div class="skill-entry">
                            <div class="skill-info">
                                <div class="skill-name">${skillData.name} <span class="skill-level">(${levelText})</span></div>
                                <div class="skill-description">${skillData.description}</div>
                            </div>
                            <div class="skill-action">${actionHTML}</div>
                        </div>
                    `;
                });
                skillsHTML += '</details>';
            });

            skillsHTML += '</div>';

            // --- Equipment HTML ---
            let equipmentHTML = '<div class="equipment-section"><h5>裝備</h5>';
            for (const slot in member.equipment) {
                const item = member.equipment[slot];
                equipmentHTML += `<div>${slot}: `;
                if (item) {
                    equipmentHTML += `<span style="color: ${rarities[item.rarity].color}">${item.name}</span>`;
                    equipmentHTML += ` <button class="unequip-btn" data-member-id="${member.id}" data-slot="${slot}">x</button>`;
                } else {
                    equipmentHTML += '無';
                }
                equipmentHTML += '</div>';
            }
            equipmentHTML += '</div>';

            // --- Final Card Assembly ---
            card.innerHTML = `
                <div class="adventurer-header">
                    <img src="${classData.icon}" class="class-icon" alt="${classData.name}">
                    <div class="adventurer-info">
                        <div class="adventurer-name">${member.name} (${classData.name})</div>
                        <div>等級: <span>${member.level}</span></div>
                    </div>
                </div>
                <div class="adventurer-stats">
                    <div>經驗值: <span>${member.xp}</span> / <span>${member.xpToNextLevel}</span></div>
                </div>
                ${skillsHTML}
                ${equipmentHTML}
            `;
            partyContainer.appendChild(card);

        });

        // Inventory Display
        const inventoryContainer = document.getElementById('inventory-container');
        inventoryContainer.innerHTML = '';
        gameState.inventory.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'inventory-item';
            if (item.id === itemToEquipId) {
                itemEl.classList.add('selected');
            }

            let affixesHTML = '';
            item.affixes.forEach(affix => {
                affixesHTML += `<div>+${(affix.value * 100).toFixed(1)}${affix.name}</div>`;
            });

            const upgradeIndicator = isUpgrade(item) ? '<span class="upgrade-arrow">↑</span>' : '';

            itemEl.innerHTML = `
                <div style="color: ${rarities[item.rarity].color}">${item.name} ${upgradeIndicator}(${item.slot})</div>
                <div class="item-affixes">${affixesHTML}</div>
                <button class="equip-btn" data-item-id="${item.id}">裝備</button>
                <button class="sell-btn" data-item-id="${item.id}">出售</button>
            `;
            inventoryContainer.appendChild(itemEl);
        });

        // Add event listeners to all new buttons
        addEventListeners();

        partyContainer.scrollTop = previousPartyScroll ?? partyScrollPosition;
        partyScrollPosition = partyContainer.scrollTop;
        partyContainer.onscroll = (e) => {
            partyScrollPosition = e.currentTarget.scrollTop;
        };

        // Resources, Monster, Upgrades, Recruitment...
        document.getElementById('gold-display').textContent = gameState.gold;
        const paragonData = gameState.paragon || { level: 0, xp: 0, xpToNext: 0 };
        const rebirthData = gameState.rebirth || { count: 0 };
        const paragonLevelEl = document.getElementById('paragon-level');
        if (paragonLevelEl) {
            paragonLevelEl.textContent = paragonData.level;
        }
        const paragonXpEl = document.getElementById('paragon-xp');
        if (paragonXpEl) {
            paragonXpEl.textContent = paragonData.xp;
        }
        const paragonNextEl = document.getElementById('paragon-next');
        if (paragonNextEl) {
            paragonNextEl.textContent = paragonData.xpToNext;
        }
        const rebirthCountEl = document.getElementById('rebirth-count');
        if (rebirthCountEl) {
            rebirthCountEl.textContent = rebirthData.count || 0;
        }
        const rebirthHintEl = document.getElementById('rebirth-hint');
        const rebirthBtn = document.getElementById('rebirth-btn');
        const rebirthReady = typeof canRebirth === 'function' ? canRebirth() : false;
        if (rebirthBtn) {
            rebirthBtn.disabled = !rebirthReady;
            rebirthBtn.textContent = rebirthReady ? '轉生突破' : '尚未達成條件';
        }
        if (rebirthHintEl) {
            if (rebirthReady) {
                rebirthHintEl.textContent = '重置進度，獲得永久屬性加成。';
            } else {
                let requirementText = '需要達成條件後才可轉生。';
                if (REBIRTH_REQUIREMENT && REBIRTH_REQUIREMENT.paragonLevel != null) {
                    requirementText = `需要巔峰等級 ${REBIRTH_REQUIREMENT.paragonLevel}。`;
                }
                rebirthHintEl.textContent = requirementText;
            }
        }

        const mapSelector = document.getElementById('map-selector');
        if (mapSelector) {
            mapSelector.innerHTML = '';
            maps.forEach(map => {
                const unlocked = Array.isArray(gameState.unlockedMaps) && gameState.unlockedMaps.indexOf(map.id) !== -1;
                const button = document.createElement('button');
                button.className = 'map-button';
                button.textContent = map.name;
                button.setAttribute('data-map-id', map.id);
                if (map.id === gameState.currentMapId) {
                    button.classList.add('active');
                }
                if (!unlocked) {
                    button.classList.add('locked');
                    button.disabled = true;
                }
                mapSelector.appendChild(button);
            });
        }
        const mapDescriptionEl = document.getElementById('map-description');
        if (mapDescriptionEl) {
            const currentMap = getCurrentMap(gameState);
            const clears = gameState.mapProgress && gameState.mapProgress[currentMap.id] ? gameState.mapProgress[currentMap.id].clears : 0;
            mapDescriptionEl.textContent = `${currentMap.description}（已輪迴 ${clears} 次）`;
        }
        // Monster Info
        const monsterImage = document.getElementById('monster-image');
        document.getElementById('monster-name').textContent = currentMonster.name;
        document.getElementById('monster-hp-text').textContent = `${Math.max(0, Math.ceil(currentMonster.hp))} / ${currentMonster.maxHp}`;
        const hpPercent = (Math.max(0, currentMonster.hp) / currentMonster.maxHp) * 100;
        document.getElementById('monster-hp-bar').style.width = `${hpPercent}%`;

        if (currentMonster.image) {
            monsterImage.src = currentMonster.image;
            monsterImage.style.display = 'block';
        } else {
            monsterImage.style.display = 'none';
        }
        const damageUpgrade = gameState.upgrades.partyDamage;
        document.getElementById('upgrade-damage-cost').textContent = damageUpgrade.cost;
        document.getElementById('upgrade-damage-level').textContent = damageUpgrade.level;
        // Recruitment
        const recruitmentContainer = document.getElementById('recruitment-container');
        recruitmentContainer.innerHTML = ''; // Clear old options

        if (gameState.party.length < 5) {
            const existingClasses = gameState.party.map(m => m.class);
            const availableClasses = Object.keys(adventurerClasses).filter(c => !existingClasses.includes(c));

            availableClasses.forEach(className => {
                const optionEl = document.createElement('div');
                optionEl.className = 'recruitment-option';
                optionEl.innerHTML = `
                    <button class="recruit-btn" data-class-name="${className}">招募 ${adventurerClasses[className].name}</button>
                    <div>花費: <span>${gameState.recruitment.cost}</span> 金幣</div>
                `;
                recruitmentContainer.appendChild(optionEl);
            });
        } else {
            recruitmentContainer.innerHTML = "<div>隊伍已滿！</div>";
        }

        // Add event listeners to all new buttons AFTER they have been rendered
        addEventListeners();
    } catch (error) {
        console.error("Error during updateUI:", error);
        addLogMessage(`<span style="color: red;">UI 更新時發生錯誤: ${error.message}</span>`);
    }
}

function addEventListeners() {
    // Static Buttons
    const upgradeDamageBtn = document.getElementById('upgrade-damage-btn');
    if (upgradeDamageBtn) {
        upgradeDamageBtn.onclick = buyDamageUpgrade;
    }
    const equipBestBtn = document.getElementById('equip-best-btn');
    if (equipBestBtn) {
        equipBestBtn.onclick = equipBestItems;
    }
    const cancelEquipBtn = document.getElementById('cancel-equip-btn');
    if (cancelEquipBtn) {
        cancelEquipBtn.onclick = () => {
            itemToEquipId = null;
            uiNeedsUpdate = true;
        };
    }
    const rebirthBtn = document.getElementById('rebirth-btn');
    if (rebirthBtn) {
        rebirthBtn.onclick = performRebirth;
    }

    // Dynamic Buttons
    document.querySelectorAll('.adventurer-card.targetable').forEach(card => {
        card.onclick = (e) => {
            const memberId = parseInt(e.currentTarget.getAttribute('data-member-id'));
            if (itemToEquipId && memberId != null) {
                equipItem(itemToEquipId, memberId);
                itemToEquipId = null; // Exit equip mode
            }
        };
    });

    document.querySelectorAll('.upgrade-skill-btn').forEach(button => {
        button.onclick = (e) => {
            const memberId = parseInt(e.target.getAttribute('data-member-id'));
            const skillId = e.target.getAttribute('data-skill-id');
            upgradeSkill(memberId, skillId);
        };
    });

    document.querySelectorAll('.equip-btn').forEach(button => {
        button.onclick = (e) => {
            const itemId = parseFloat(e.target.getAttribute('data-item-id'));
            itemToEquipId = itemId; // Enter equip mode
            uiNeedsUpdate = true;
        };
    });

    document.querySelectorAll('.unequip-btn').forEach(button => {
        button.onclick = (e) => {
            const memberId = parseInt(e.target.getAttribute('data-member-id'));
            const slot = e.target.getAttribute('data-slot');
            unequipItem(memberId, slot);
        };
    });

    document.querySelectorAll('.recruit-btn').forEach(button => {
        button.onclick = (e) => {
            const className = e.target.getAttribute('data-class-name');
            recruitAdventurer(className);
        };
    });

    document.querySelectorAll('.sell-btn').forEach(button => {
        button.onclick = (e) => {
            const itemId = parseFloat(e.target.getAttribute('data-item-id'));
            sellItem(itemId);
        };
    });

    document.querySelectorAll('.skill-tier').forEach(detailsEl => {
        detailsEl.addEventListener('toggle', () => {
            const memberId = parseInt(detailsEl.getAttribute('data-member-id'), 10);
            const tierIndex = parseInt(detailsEl.getAttribute('data-tier-index'), 10);
            if (Number.isNaN(memberId) || Number.isNaN(tierIndex)) {
                return;
            }
            if (!skillPanelState[memberId]) {
                skillPanelState[memberId] = { openTiers: {} };
            }
            skillPanelState[memberId].openTiers[tierIndex] = detailsEl.open;
        });
    });

    document.querySelectorAll('.map-button').forEach(button => {
        button.onclick = (e) => {
            const mapId = e.currentTarget.getAttribute('data-map-id');
            if (mapId) {
                switchMap(mapId);
            }
        };
    });
}

function addLogMessage(message) {
    const logContainer = document.getElementById('log-container');
    const logEntry = document.createElement('div');
    logEntry.innerHTML = message; // Use innerHTML to allow for styled spans
    logContainer.prepend(logEntry);
    if (logContainer.children.length > 50) {
        logContainer.removeChild(logContainer.lastChild);
    }
}
