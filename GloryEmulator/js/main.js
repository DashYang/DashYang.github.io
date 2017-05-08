function Property(name) {
    this.name = name;
    this.attackDamage = 0;
    this.abilityPower = 0;
    this.maxHp = 0;
    this.maxMp = 0;
    this.attackShield = 0;
    this.abilityShield = 0;
    this.attackSpeedBonus = 0;
    this.coolDownSpeed = 0;

    this.criticalStrike = 0;
    this.criticalEffect = 0;
    this.speed = 0;
    this.healUp = 0;
    this.powerUp = 0;
    this.piercingAttack = 0;
    this.piercingAbility = 0;
    this.lifeSteal = 0;
    this.spellVamp = 0;
    this.toughness = 0;
}


function Hero(name) {
    this.name = name;

    this.level = 1;
    this.currentHp = 0;
    this.currentMp = 0;

    //基础属性
    this.maxHp = 0;
    this.maxMp = 0;
    this.attackDamage = 0;
    this.abilityPower = 0;
    this.attackShield = 0;
    this.abilityShield = 0;

    //攻击属性
    this.speed;
    this.piercingAttack = 0;
    this.piercingAbility = 0;
    this.attackSpeed = 0;
    this.criticalStrike = 0;
    this.criticalEffect = 0;
    this.lifeSteal = 0;
    this.spellVamp = 0;
    this.coolDown = 0;
    this.isArcher = false;

    //防御属性
    this.toughness = 0;
    this.healUp = 0;
    this.powerUp = 0;

    //成长属性
    this.increaseHp = 0;
    this.increaseMp = 0;
    this.increaseHealup = 0;
    this.increasePowerup = 0;
    this.increaseAttackDamage = 0;
    this.increaseAbilityPower = 0;
    this.increaseAttackShield = 0;
    this.increaseAbilityShield = 0;
    this.increasePiercingAttack = 0;
    this.increasePiercingAbility = 0;
    this.increaseAttackSpeed = 0;
    this.increaseCriticalStrike = 0;
    //暴击
    this.increaseLifeSteal = 0;
    this.increaseSpellVamp = 0;
    this.increaseCoolDown = 0;

    this.items = new Array(6);

    //穿上装备
    this.putOnWeaponAt = function (index, item) {
        if (index < 0 || index > 5)
            return;
        this.items[index] = item;
    }

    //卸下装备
    this.removeWeaponAt = function (index) {
        if (index < 0 || index > 5)
            return;
        this.items[index] = null;
    }

    //生成英雄数据
    this.getHeroProperty = function () {
        var attackDamage = this.attackDamage + (this.level - 1) * this.increaseAttackDamage;
        var abilityPower = this.abilityPower + (this.level - 1) * this.increaseAbilityPower;
        var maxHp = this.maxHp + (this.level - 1) * this.increaseHp;
        var maxMp = this.maxMp + (this.level - 1) * this.increaseMp;
        var attackShield = this.attackShield + (this.level - 1) * this.increaseAttackShield;
        var abilityShield = this.abilityShield + (this.level - 1) * this.increaseAbilityShield;
        var attackSpeedBonus = this.attackSpeed + (this.level - 1) * this.increaseAttackSpeed;
        var coolDownSpeed = this.coolDown + (this.level - 1) * this.increaseCoolDown;
        var criticalStrike = this.criticalStrike + (this.level - 1) * this.increaseCriticalStrike;
        var piercingAttack = this.piercingAttack + (this.level - 1) * this.increasePiercingAttack;
        var piercingAbility = this.piercingAbility + (this.level - 1) * this.increasePiercingAbility;
        var lifeSteal = this.lifeSteal + (this.level - 1) * this.increaseLifeSteal;
        var spellVamp = this.spellVamp + (this.level - 1) * this.increaseSpellVamp;

        //没有等级加成的属性
        var criticalEffect = this.criticalEffect;
        var speed = this.speed;
        var healUp = this.healUp;
        var powerUp = this.powerUp;
        var toughness = this.toughness;

        for (var i = 0; i < 6; i++) {
            if (this.items[i] == null)
                continue;

            attackDamage += this.items[i].attackDamage;
            abilityPower += this.items[i].abilityPower;
            maxHp += this.items[i].maxHp;
            maxMp += this.items[i].maxMp;
            attackShield += this.items[i].attackShield;
            abilityShield += this.items[i].abilityShield;
            attackSpeedBonus += this.items[i].attackSpeedBonus;
            coolDownSpeed += this.items[i].coolDownSpeed;
            criticalStrike += this.items[i].criticalStrike;
            criticalEffect += this.items[i].criticalEffect;

            speed += this.items[i].speed;
            healUp += this.items[i].healUp;
            powerUp += this.items[i].powerUp;
            piercingAttack += this.items[i].piercingAttack;
            piercingAbility += this.items[i].piercingAbility;
            lifeSteal += this.items[i].lifeSteal;
            spellVamp += this.items[i].spellVamp;
            toughness += this.items[i].toughness;
        }

        var heroInformation = new Property(this.name);
        heroInformation.attackDamage = attackDamage;
        heroInformation.abilityPower = abilityPower;
        heroInformation.maxHp = maxHp;
        heroInformation.maxMp = maxMp;

        //主宰成长上限
        if(this.name == "主宰") {
            if(heroInformation.attackDamage > 990)
                heroInformation.attackDamage =  990;
            if(heroInformation.abilityPower > 990)
                heroInformation.abilityPower = 990;
            if(heroInformation.maxHp > 45000)
                heroInformation.maxHp = 45000;
        }

        //黑暗暴君成长上限
        if(this.name == "黑暗暴君") {
            if(heroInformation.attackDamage > 810)
                heroInformation.attackDamage =  810;
            if(heroInformation.abilityPower > 810)
                heroInformation.abilityPower = 810;
            if(heroInformation.maxHp > 45000)
                heroInformation.maxHp = 45000;
        }

        heroInformation.attackShield = attackShield;
        heroInformation.abilityShield = abilityShield;
        heroInformation.attackSpeedBonus = attackSpeedBonus < 200 ? attackSpeedBonus : 200;
        heroInformation.coolDownSpeed = coolDownSpeed < 40 ? coolDownSpeed : 40;
        heroInformation.criticalStrike = criticalStrike;
        heroInformation.criticalEffect = criticalEffect;
        heroInformation.speed = speed;
        heroInformation.healUp = healUp;
        heroInformation.powerUp = powerUp;
        heroInformation.piercingAttack = piercingAttack;
        heroInformation.piercingAbility = piercingAbility;
        heroInformation.lifeSteal = lifeSteal;
        heroInformation.spellVamp = spellVamp;
        heroInformation.toughness = toughness;

        if(isHeroHasWeaponNamed(this, itemMap["暗影战斧"])) {
            heroInformation.piercingAttack += 50 + this.level * 10;
        }

        if(isHeroHasWeaponNamed(this, itemMap["纯净苍穹"])) {
            heroInformation.attackDamage += 60;
        }

        if(isHeroHasWeaponNamed(this, itemMap["破魔刀"])) {
            var bonus = Math.round(heroInformation.attackDamage * 0.4);
            heroInformation.abilityShield += bonus < 300 ? bonus : 300;
        }

        if(isHeroHasWeaponNamed(this, itemMap["影忍之足"])) {
            heroInformation.speed += 60;
        }

        if(isHeroHasWeaponNamed(this, itemMap["抵抗之靴"])) {
            heroInformation.speed += 60;
            heroInformation.toughness += 35;
        }

        if(isHeroHasWeaponNamed(this, itemMap["冷静之靴"])) {
            heroInformation.speed += 60;
        }

        if(isHeroHasWeaponNamed(this, itemMap["秘法之靴"])) {
            heroInformation.speed += 60;
            heroInformation.piercingAbility += 75;
        }

        if(isHeroHasWeaponNamed(this, itemMap["急速战靴"])) {
            heroInformation.speed += 60;
        }

        if(isHeroHasWeaponNamed(this, itemMap["疾步之靴"])) {
            heroInformation.speed += 60;
        }

        return heroInformation;
    }
}

function HarmProperty() {
    this.minAttackDamage = 0;
    this.maxAttackDamage = 0;
    this.expectedAttackDamage = 0;

    this.minAbilityDamage = 0;
    this.maxAbilityDamage = 0;
    this.expectedAbilityDamage = 0;

    this.minLifeStealValue = 0;
    this.maxLifeStealValue = 0;
    this.expectedLifeStealValue = 0;

    this.minSpellVampValue = 0;
    this.maxSpellVampValue = 0;
    this.expectedSpellVampValue = 0;

    this.minAttackNumber = 100;
    this.maxAttackNumber = 100;
    this.expectedAttackNumber = 100;
}

var shieldValue = parseFloat(600);

function getDamageAfterShielding(damage, shield) {
    var shieldPercent = (100.0 * shield / (shield + shieldValue)) / 100.0;
    var realDamgePercent = 1 - shieldPercent;
    //王者荣耀免伤计算公式
    var result = damage * realDamgePercent;
    return Math.round(result);
}

function getSheildingValueAfterWeapon(originShieldingValue, constantShieldDecrease, percentShieldDecrease) {
    var result = (originShieldingValue - constantShieldDecrease) * (1 - 1.0 * percentShieldDecrease / 100);
    //物理穿透所有护甲,则护甲为0
    if (result < 0.0)
        result = 0.0;
    return Math.round(result);
}

//实际伤害
function avoidDamage(damage, percentDamageAvoiding) {
    return damage * (1 - 1.0 * percentDamageAvoiding / 100);
}

function normalAttackFromAttackerToDefender(attacker, defender) {
    var attackerProperty = attacker.getHeroProperty();
    var defenderProperty = defender.getHeroProperty();

    var attackDamage = attackerProperty.attackDamage, piercingAttack = attackerProperty.piercingAttack;
    var shieldValue = defenderProperty.attackShield;

    var percentShieldDecreasing = 0;   //百分比护甲穿透
    var percentDamageAvoiding = 0;    //百分比伤害减免
    var extraAttackDamageBonus = 0;
    var abilityAttackDamageBonus = 0;
    //唯一被动的效果
    if(isHeroHasWeaponNamed(attacker, itemMap["破甲弓"])) {
        percentShieldDecreasing += 45;
    }

    if(isHeroHasWeaponNamed(defender, itemMap["影忍之足"])) {
        percentDamageAvoiding += 15;
    }

    if(isHeroHasWeaponNamed(attacker, itemMap["末世"])) {
        extraAttackDamageBonus += Math.round(defenderProperty.maxHp * 0.08);
    }

    if(isHeroHasWeaponNamed(attacker, itemMap["宗师之力"])) {
        abilityAttackDamageBonus += attackDamage;
    }

    if(isHeroHasWeaponNamed(attacker, itemMap["冰痕之握"])) {
        abilityAttackDamageBonus += 150 + attacker.level * 20;
    }

    var realAttackShieldValue = getSheildingValueAfterWeapon(shieldValue, piercingAttack, percentShieldDecreasing);

    //护甲减免和免伤加成

    //暴击加成
    var criticalDamageBonus = 0;
    if(attackerProperty.criticalStrike > 0)
        criticalDamageBonus += Math.round(attackDamage * ((1.0 * attackerProperty.criticalEffect / 100) -1));

    //护甲减免和免伤加成
    var minAttackDamage = avoidDamage(getDamageAfterShielding(attackDamage, realAttackShieldValue), percentDamageAvoiding) - 2;
    var maxAttackDamage = attackDamage + extraAttackDamageBonus + abilityAttackDamageBonus + criticalDamageBonus ;
    maxAttackDamage =  avoidDamage(getDamageAfterShielding(maxAttackDamage, realAttackShieldValue),percentDamageAvoiding) + 2;

    //期望攻击力 基础攻击力 + 暴击期望加成（暴击加成 * 暴击几率） + 技能附带攻击力提升 * 0.5
    var expectedAttackDamage = (attackDamage + criticalDamageBonus * 1.0 * attackerProperty.criticalStrike / 100 ) +
        abilityAttackDamageBonus * 0.5 + extraAttackDamageBonus * 0.5;
    expectedAttackDamage = avoidDamage(getDamageAfterShielding(expectedAttackDamage, realAttackShieldValue),percentDamageAvoiding);

    var harmProperty = new HarmProperty();
    harmProperty.minAttackDamage = Math.round(minAttackDamage);
    harmProperty.maxAttackDamage = Math.round(maxAttackDamage);
    harmProperty.expectedAttackDamaage = Math.round(expectedAttackDamage);

    harmProperty.minLifeStealValue = Math.round(minAttackDamage * 1.0 * attackerProperty.lifeSteal / 100);
    harmProperty.maxLifeStealValue = Math.round(maxAttackDamage * 1.0 * attackerProperty.lifeSteal / 100);
    harmProperty.expectedLifeStealValue = Math.round(expectedAttackDamage * 1.0 * attackerProperty.lifeSteal / 100);

    var doomFlag = false, destructionFlag = false;
    if(isHeroHasWeaponNamed(attacker,itemMap["末世"])) {
        doomFlag = true;
    }

    if(isHeroHasWeaponNamed(attacker, itemMap["破军"])) {
        destructionFlag = true;
    }

    harmProperty.maxAttackNumber = 0;
    var currentHp = defenderProperty.maxHp;
    while(currentHp > 0) {
        var totalDamage = 0;
        if(doomFlag == true)
            currentHp -= Math.round(currentHp * 0.08);
        if(destructionFlag == true && currentHp <= defenderProperty.maxHp / 2) {
            totalDamage += Math.round(attackDamage * 1.3);
        } else {
            totalDamage += attackDamage;
        }

        currentHp -= avoidDamage(getDamageAfterShielding(totalDamage,realAttackShieldValue), percentDamageAvoiding) - 2;
        harmProperty.maxAttackNumber ++;
    }

    harmProperty.minAttackNumber = 0;
    currentHp = defenderProperty.maxHp;
    while(currentHp > 0) {
        var totalDamage = 0;
        if(doomFlag == true)
            currentHp -= Math.round(currentHp * 0.08);
        if(destructionFlag == true && currentHp <= defenderProperty.maxHp / 2) {
            totalDamage += Math.round((attackDamage + criticalDamageBonus) * 1.3) + abilityAttackDamageBonus;
        } else {
            totalDamage += attackDamage + criticalDamageBonus + abilityAttackDamageBonus;
        }
        currentHp -= avoidDamage(getDamageAfterShielding(totalDamage,realAttackShieldValue), percentDamageAvoiding) + 2;
        harmProperty.minAttackNumber ++;
    }

    harmProperty.expectedAttackNumber = 0;
    var expectedCriticalDamage = criticalDamageBonus * 1.0 * attackerProperty.criticalStrike / 100 ;
    currentHp = defenderProperty.maxHp;
    while(currentHp > 0) {
        var totalDamage = 0;
        if (doomFlag == true)
            currentHp -= Math.round(currentHp * 0.08);
        if (destructionFlag == true && currentHp <= defenderProperty.maxHp / 2) {
            totalDamage += Math.round((attackDamage + expectedCriticalDamage) * 1.3) + Math.round(abilityAttackDamageBonus * 0.5);
        } else {
            totalDamage += attackDamage + expectedCriticalDamage + Math.round(abilityAttackDamageBonus * 0.5);
        }

        currentHp -= avoidDamage(getDamageAfterShielding(totalDamage,realAttackShieldValue), percentDamageAvoiding);
        harmProperty.expectedAttackNumber ++;
    }

    return harmProperty;

}

function isHeroHasWeaponNamed(hero, weapon) {
    for (var i = 0; i < 6; i++) {
        if (hero.items[i] == null)
            continue;
        if (hero.items[i] === weapon)
            return true;
    }
    return false;
}

function printHeroProperty(hero) {
    console.log("name: " + hero.name + " level: " + hero.level);
    console.log("ad: " + hero.attackDamage + " ap: " + hero.abilityDamage);
    console.log("ad shield: " + hero.attackShield + " ap shield: " + hero.abilityShield);

    var itemList = new Array();
    for (var i = 0; i < 6; i++) {
        if (hero.items[i] == null)
            continue;
        itemList.push(hero.items[i]);
    }
    console.log("items: " + itemList);
}

function Trim(str) {
    return str.replace(/(^\s*)|(\s*$)/g, "");
}

var playerMap = new Object();
function displaySingleHeroProperty(player) {
    var playerFunction = heroMap[Trim($("#" + player + "-avatar a").text())];
    if (playerFunction == null) {
        $("#" + player + "-attackDamage").text(0);
        $("#" + player + "-abilityPower").text(0);
        $("#" + player + "-maxHp").text(0);
        $("#" + player + "-maxMp").text(0);
        $("#" + player + "-attackShield").text(0);
        $("#" + player + "-abilityShield").text(0);
        $("#" + player + "-attackSpeed").text(0);
        $("#" + player + "-coolDown").text(0);
        $("#" + player + "-criticalStrike").text(0);
        $("#" + player + "-speed").text(0);
        $("#" + player + "-healUp").text(0);
        $("#" + player + "-powerUp").text(0);
        $("#" + player + "-piercingAttack").text(0);
        $("#" + player + "-piercingAbility").text(0);
        $("#" + player + "-lifeSteal").text(0);
        $("#" + player + "-spellVamp").text(0);
        $("#" + player + "-toughness").text(0);

        return;
    } else {
        var hero = playerFunction();
        hero.level = $("#" + player + "-level option:selected").text();  //获取等级

        //获取装备
        var itemList = $("#" + player + "-itemList ul li");
        for (var index = 0; index < 6; index++) {
            var itemName = Trim($(itemList[index]).text())
            if (itemName != "" && itemMap[itemName] != null) {
                hero.putOnWeaponAt(index, itemMap[itemName]);
            }

        }

        playerMap[player] = hero;
        var property = hero.getHeroProperty();
        $("#" + player + "-attackDamage").text(property.attackDamage);
        $("#" + player + "-abilityPower").text(property.abilityPower);
        $("#" + player + "-maxHp").text(property.maxHp);
        $("#" + player + "-maxMp").text(property.maxMp);
        $("#" + player + "-attackShield").text(property.attackShield);
        $("#" + player + "-abilityShield").text(property.abilityShield);
        $("#" + player + "-attackSpeedBonus").text(property.attackSpeedBonus);
        $("#" + player + "-coolDownSpeed").text(property.coolDownSpeed);
        $("#" + player + "-criticalStrike").text(property.criticalStrike);
        $("#" + player + "-speed").text(property.speed);
        $("#" + player + "-healUp").text(property.healUp);
        $("#" + player + "-powerUp").text(property.powerUp);
        $("#" + player + "-piercingAttack").text(property.piercingAttack);
        $("#" + player + "-piercingAbility").text(property.piercingAbility);
        $("#" + player + "-lifeSteal").text(property.lifeSteal);
        $("#" + player + "-spellVamp").text(property.spellVamp);
        if (property.isArcher == true)
            $("#" + player + "-isArcher").text("远程");
        else
            $("#" + player + "-isArcher").text("近程");
        $("#" + player + "-toughness").text(property.toughness);
    }
}

function displayDuelProperty(player1, player2) {
    var harm1 = normalAttackFromAttackerToDefender(player1, player2);
    var harm2 = normalAttackFromAttackerToDefender(player2, player1);

    $("#player1-damage").text(harm1.minAttackDamage + "~" + harm1.maxAttackDamage + "(" + harm1.expectedAttackDamaage + ")");
    $("#player1-combo").text(harm1.minAttackNumber + "~" + harm1.maxAttackNumber + "(" + harm1.expectedAttackNumber+ ")");

    $("#player2-damage").text(harm2.minAttackDamage + "~" + harm2.maxAttackDamage + "(" + harm2.expectedAttackDamaage + ")");
    $("#player2-combo").text(harm2.minAttackNumber + "~" + harm2.maxAttackNumber + "(" + harm2.expectedAttackNumber+ ")");

}

function displayHeroesProperty() {
    displaySingleHeroProperty("player1");
    displaySingleHeroProperty("player2");
    if(playerMap["player1"] != null && playerMap["player2"] != null) {
        displayDuelProperty(playerMap["player1"], playerMap["player2"]);
    }
}

$(function () {
    displayHeroesProperty();

    $(".avatar").click(function () {
        $('#heroListModal').modal('show')
    });

    //当前目标英雄
    var targetHero = "player1";
    $(".player-status").click(function () {
        $(".player-status").removeClass("targetHero");
        $(this).addClass("targetHero");
        targetHero = $(this).attr("id");
    });

    //监听事件列表
    //移除装备
    $(".itemList ul a").click(function () {
            if($(this).parent().html("") === "")
                return;
            $(this).parent().html("");
            displayHeroesProperty();
        }
    );


    //添加装备
    $("#displayBoard ul li").click(function () {
            var itemContent = $(this).html();
            var itemList = $("#" + targetHero +"-itemList ul li");
            for (var index = 0; index < 6; index++) {
                if (Trim($(itemList[index]).html()) === "") {
                    $(itemList[index]).html(itemContent)
                    break;
                }

            }
            displayHeroesProperty();
            //移除装备
            $(".itemList ul a").click(function () {
                    if  ($(this).parent().html("") === "")
                        return;
                    $(this).parent().html("");
                    displayHeroesProperty();
                }
            );
        }
    );

    $(".heroList li").click(function () {
            var heroContent = $(this).html();
            var avatar = $("#" + targetHero+ "-avatar");
            avatar.html(heroContent);
            $('#heroListModal').modal('hide');
            displayHeroesProperty();
        }
    );

    $(".level").change(function () {
        displayHeroesProperty(heroMap[Trim($("#player1-avatar a").text())]);
    })
});



