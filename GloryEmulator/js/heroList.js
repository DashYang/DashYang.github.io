/**
 * Created by dash on 2017/5/1.
 */

var heroMap = new Object()

/** 亚瑟 **/
function copyArthur() {
    var hero = new Hero("亚瑟");
    hero.level = 1;
    hero.maxHp = 3742;
    hero.maxMp = 0;
    hero.attackDamage = 164;
    hero.attackShield = 98;
    hero.abilityShield = 50;
    hero.speed = 390;
    hero.criticalEffect = 200;
    hero.isArcher = false;
    hero.healUp = 55;

    hero.increaseHp = 316;
    hero.increaseAttackDamage = 13;
    hero.increaseAttackShield = 21;
    hero.increaseAbilityShield = 8;
    hero.increaseAttackSpeed = 1;
    hero.increaseHealup = 3;
    return hero;
}

heroMap['亚瑟'] = copyArthur;

/** 黄忠 **/
function copyHuangZhong() {
    var hero = new Hero("黃忠");
    hero.level = 1;
    hero.maxHp = 3173;
    hero.maxMp = 440;
    hero.attackDamage = 172;
    hero.attackShield = 91;
    hero.abilityShield = 50;
    hero.speed = 340;
    hero.criticalEffect = 200;
    hero.isArcher = true;
    hero.healUp = 39;
    hero.powerUp = 16;

    hero.increaseHp = 194;
    hero.increaseMp = 96;
    hero.increaseAttackDamage = 16;
    hero.increaseAttackShield = 16;
    hero.increaseAbilityShield = 8;
    hero.increaseAttackSpeed = 3;
    hero.increaseHealup = 2;
    hero.increasePowerup = 1;
    return hero;

}

heroMap['黄忠'] = copyHuangZhong;

/** 成吉思汗 **/
function copyChengjisihan() {
    var hero = new Hero("成吉思汗");
    hero.level = 1;
    hero.maxHp = 3027;
    hero.maxMp = 440;
    hero.attackDamage = 184;
    hero.attackShield = 94;
    hero.abilityShield = 50;
    hero.speed = 370;
    hero.criticalEffect = 200;
    hero.isArcher = true;
    hero.healUp = 37;
    hero.powerUp = 15;

    hero.increaseHp = 198;
    hero.increaseMp = 93;
    hero.increaseAttackDamage = 15;
    hero.increaseAttackShield = 16;
    hero.increaseAbilityShield = 8;
    hero.increaseAttackSpeed = 3;
    hero.increaseHealup = 2;
    hero.increasePowerup = 1;
    return hero;

}

heroMap['成吉思汗'] = copyChengjisihan;

/** 马克波罗 **/
function copyMacroPolo() {
    var hero = new Hero("马可波罗");
    hero.level = 1;
    hero.maxHp = 3041;
    hero.maxMp = 200;
    hero.attackDamage = 175;
    hero.attackShield = 91;
    hero.abilityShield = 50;
    hero.speed = 350;
    hero.criticalEffect = 200;
    hero.isArcher = true;
    hero.healUp = 46;
    hero.powerUp = 50;

    hero.increaseHp = 181;
    hero.increaseAttackDamage = 13;
    hero.increaseAttackShield = 18;
    hero.increaseAbilityShield = 8;
    hero.increaseAttackSpeed = 2;
    hero.increaseHealup = 2;
    return hero;

}

heroMap['马可波罗'] = copyMacroPolo;

/** 虞姬 **/
function copyYuji() {
    var hero = new Hero("虞姬");
    hero.level = 1;
    hero.maxHp = 2977;
    hero.maxMp = 440;
    hero.attackDamage = 165;
    hero.attackShield = 84;
    hero.abilityShield = 50;
    hero.speed = 350;
    hero.criticalEffect = 200;
    hero.isArcher = true;
    hero.healUp = 36;
    hero.powerUp = 16;

    hero.increaseHp = 192;
    hero.increaseMp = 95;
    hero.increaseAttackDamage = 17;
    hero.increaseAttackShield = 17;
    hero.increaseAbilityShield = 8;
    hero.increaseAttackSpeed = 3;
    hero.increaseHealup = 1;
    hero.increasePowerup = 1;
    return hero;
}

heroMap['虞姬'] = copyYuji;

/** 后羿 **/
function copyHouyi() {
    var hero = new Hero("后羿");
    hero.level = 1;
    hero.maxHp = 3182;
    hero.maxMp = 440;
    hero.attackDamage = 161;
    hero.attackShield = 86;
    hero.abilityShield = 50;
    hero.speed = 340;
    hero.criticalEffect = 200;
    hero.isArcher = true;
    hero.healUp = 41;
    hero.powerUp = 16;

    hero.increaseHp = 200;
    hero.increaseMp = 96;
    hero.increaseAttackDamage = 16;
    hero.increaseAttackShield = 17;
    hero.increaseAbilityShield = 8;
    hero.increaseAttackSpeed = 3;
    hero.increaseHealup = 2;
    hero.increasePowerup = 1;
    return hero;
}

heroMap['后羿'] = copyHouyi;

/** 狄仁杰 **/
function copyDirenjie() {
    var hero = new Hero("狄仁杰");
    hero.level = 1;
    hero.maxHp = 3242;
    hero.maxMp = 440;
    hero.attackDamage = 169;
    hero.attackShield = 95;
    hero.abilityShield = 50;
    hero.speed = 350;
    hero.criticalEffect = 200;
    hero.isArcher = true;
    hero.healUp = 40;
    hero.powerUp = 15;

    hero.increaseHp = 176;
    hero.increaseMp = 95;
    hero.increaseAttackDamage = 14;
    hero.increaseAttackShield = 17;
    hero.increaseAbilityShield = 8;
    hero.increaseAttackSpeed = 4;
    hero.increaseHealup = 1;
    hero.increasePowerup = 1;
    return hero;
}

heroMap['狄仁杰'] = copyDirenjie;

/** 鲁班七号 **/
function copyLuban() {
    var hero = new Hero("鲁班七号");
    hero.level = 1;
    hero.maxHp = 3401;
    hero.maxMp = 440;
    hero.attackDamage = 174;
    hero.attackShield = 88;
    hero.abilityShield = 50;
    hero.speed = 350;
    hero.criticalEffect = 200;
    hero.isArcher = true;
    hero.healUp = 42;
    hero.powerUp = 15;

    hero.increaseHp = 184;
    hero.increaseMp = 94;
    hero.increaseAttackDamage = 16;
    hero.increaseAttackShield = 16;
    hero.increaseAbilityShield = 8;
    hero.increaseAttackSpeed = 3;
    hero.increaseHealup = 1;
    hero.increasePowerup = 1;
    return hero;
}

heroMap['鲁班七号'] = copyLuban;

/** 孙尚香 **/
function copySunshangxiang() {
    var hero = new Hero("孙尚香");
    hero.level = 1;
    hero.maxHp = 3235;
    hero.maxMp = 440;
    hero.attackDamage = 172;
    hero.attackShield = 89;
    hero.abilityShield = 50;
    hero.speed = 340;
    hero.criticalEffect = 200;
    hero.isArcher = true;
    hero.healUp = 40;
    hero.powerUp = 15;

    hero.increaseHp = 198;
    hero.increaseMp = 94;
    hero.increaseAttackDamage = 17;
    hero.increaseAttackShield = 18;
    hero.increaseAbilityShield = 8;
    hero.increaseAttackSpeed = 3;
    hero.increaseHealup = 2;
    hero.increasePowerup = 1;
    return hero;
}

heroMap['孙尚香'] = copySunshangxiang;

/** 刘备 **/
function copyLiubei() {
    var hero = new Hero("刘备");
    hero.level = 1;
    hero.maxHp = 3081;
    hero.maxMp = 440;
    hero.attackDamage = 169;
    hero.attackShield = 88;
    hero.abilityShield = 50;
    hero.speed = 350;
    hero.criticalEffect = 200;
    hero.isArcher = true;
    hero.healUp = 38;
    hero.powerUp = 15;

    hero.increaseHp = 179;
    hero.increaseMp = 93;
    hero.increaseAttackDamage = 16;
    hero.increaseAttackShield = 15;
    hero.increaseAbilityShield = 8;
    hero.increaseAttackSpeed = 3;
    hero.increaseHealup = 2;
    hero.increasePowerup = 1;
    return hero;
}

heroMap['刘备'] = copyLiubei;

/** 李元芳 **/
function copyLiyuanfang() {
    var hero = new Hero("李元芳");
    hero.level = 1;
    hero.maxHp = 3007;
    hero.maxMp = 440;
    hero.attackDamage = 161;
    hero.attackShield = 87;
    hero.abilityShield = 50;
    hero.speed = 340;
    hero.criticalEffect = 200;
    hero.isArcher = true;
    hero.healUp = 37;
    hero.powerUp = 15;

    hero.increaseHp = 194;
    hero.increaseMp = 95;
    hero.increaseAttackDamage = 16;
    hero.increaseAttackShield = 18;
    hero.increaseAbilityShield = 8;
    hero.increaseAttackSpeed = 2;
    hero.increaseHealup = 2;
    hero.increasePowerup = 1;
    return hero;
}

heroMap['李元芳'] = copyLiyuanfang;

/** 兰陵王 **/
function copyLanlingwang() {
    var hero = new Hero("兰陵王");
    hero.level = 1;
    hero.maxHp = 3292;
    hero.maxMp = 450;
    hero.attackDamage = 171;
    hero.attackShield = 85;
    hero.abilityShield = 50;
    hero.speed = 400;
    hero.criticalEffect = 200;
    hero.isArcher = false;
    hero.healUp = 52;
    hero.powerUp = 19;

    hero.increaseHp = 210;
    hero.increaseMp = 98;
    hero.increaseAttackDamage = 15;
    hero.increaseAttackShield = 18;
    hero.increaseAbilityShield = 8;
    hero.increaseAttackSpeed = 1;
    hero.increaseHealup = 3;
    hero.increasePowerup = 1;
    return hero;
}

heroMap['兰陵王'] = copyLanlingwang;


/** 李白 **/
function copylibai() {
    var hero = new Hero("李白");
    hero.level = 1;
    hero.maxHp = 2968;
    hero.maxMp = 450;
    hero.attackDamage = 169;
    hero.attackShield = 98;
    hero.abilityShield = 50;
    hero.speed = 390;
    hero.criticalEffect = 200;
    hero.isArcher = false;
    hero.healUp = 49;
    hero.powerUp = 16;

    hero.increaseHp = 179;
    hero.increaseMp = 97;
    hero.increaseAttackDamage = 11;
    hero.increaseAttackShield = 18;
    hero.increaseAbilityShield = 8;
    hero.increaseAttackSpeed = 3;
    hero.increaseHealup = 2;
    hero.increasePowerup = 1;
    return hero;
}

heroMap['李白'] = copylibai;

/** 项羽 **/
function copyXiangyu() {
    var hero = new Hero("项羽");
    hero.level = 1;
    hero.maxHp = 3535;
    hero.maxMp = 420;
    hero.attackDamage = 157;
    hero.attackShield = 123;
    hero.abilityShield = 50;
    hero.speed = 370;
    hero.criticalEffect = 200;
    hero.isArcher = false;
    hero.healUp = 58;
    hero.powerUp = 15;

    hero.increaseHp = 380;
    hero.increaseMp = 91;
    hero.increaseAttackDamage = 10;
    hero.increaseAttackShield = 26;
    hero.increaseAbilityShield = 8;
    hero.increaseAttackSpeed = 1;
    hero.increaseHealup = 4;
    hero.increasePowerup = 1;
    return hero;
}

heroMap['项羽'] = copyXiangyu;

/** 白起 **/
function copyBaiqi() {
    var hero = new Hero("白起");
    hero.level = 1;
    hero.maxHp = 3510;
    hero.maxMp = 420;
    hero.attackDamage = 158;
    hero.attackShield = 120;
    hero.abilityShield = 50;
    hero.speed = 390;
    hero.criticalEffect = 200;
    hero.isArcher = false;
    hero.healUp = 58;
    hero.powerUp = 14;

    hero.increaseHp = 366;
    hero.increaseMp = 89;
    hero.increaseAttackDamage = 9;
    hero.increaseAttackShield = 22;
    hero.increaseAbilityShield = 8;
    hero.increaseAttackSpeed = 1;
    hero.increaseHealup = 4;
    hero.increasePowerup = 1;
    return hero;
}

heroMap['白起'] = copyBaiqi;

/** 刘邦 **/
function copyLiubang() {
    var hero = new Hero("刘邦");
    hero.level = 1;
    hero.maxHp = 3369;
    hero.maxMp = 470;
    hero.attackDamage = 158;
    hero.attackShield = 125;
    hero.abilityShield = 50;
    hero.speed = 400;
    hero.criticalEffect = 200;
    hero.isArcher = false;
    hero.healUp = 58;
    hero.powerUp = 17;

    hero.increaseHp = 336;
    hero.increaseMp = 105;
    hero.increaseAttackDamage = 10;
    hero.increaseAttackShield = 27;
    hero.increaseAbilityShield = 8;
    hero.increaseAttackSpeed = 3;
    hero.increaseHealup = 4;
    hero.increasePowerup = 1;
    return hero;
}

heroMap['刘邦'] = copyLiubang;

/** 橘右京 **/
function copyJuyoujing() {
    var hero = new Hero("橘右京");
    hero.level = 1;
    hero.maxHp = 3150;
    hero.attackDamage = 165;
    hero.attackShield = 96;
    hero.abilityShield = 50;
    hero.speed = 390;
    hero.criticalEffect = 200;
    hero.isArcher = false;
    hero.healUp = 48;

    hero.increaseHp = 265;
    hero.increaseAttackDamage = 13;
    hero.increaseAttackShield = 21;
    hero.increaseAbilityShield = 8;
    hero.increaseAttackSpeed = 1;
    hero.increaseHealup = 3;
    return hero;
}

heroMap['橘右京'] = copyJuyoujing;

/** 暴君 **/
function copyTyrant() {
    var hero = new Hero("暴君");
    hero.level = 1;
    hero.maxHp = 9000;
    hero.attackDamage = 204;
    hero.abilityPower = 204
    hero.attackShield = 183;
    hero.abilityShield = 183;
    hero.isArcher = false;

    hero.increaseHp = 710;
    hero.increaseAttackDamage = 14;
    hero.increaseAbilityPower = 14;
    return hero;
}

heroMap['暴君'] = copyTyrant;

/** 黑暗暴君 **/
function copyDarktyrant() {
    var hero = new Hero("黑暗暴君");
    hero.level = 1;
    hero.maxHp = 42143;
    hero.attackDamage = 784;
    hero.abilityPower = 784
    hero.attackShield = 183;
    hero.abilityShield = 183;
    hero.isArcher = false;

    hero.increaseHp = 620;
    hero.increaseAttackDamage = 25;
    hero.increaseAbilityPower = 25;
    return hero;
}

heroMap['黑暗暴君'] = copyDarktyrant;

/** 主宰 **/
function copyDominator() {
    var hero = new Hero("主宰");
    hero.level = 1;
    hero.maxHp = 39303;
    hero.attackDamage = 898;
    hero.abilityPower = 898
    hero.attackShield = 183;
    hero.abilityShield = 183;
    hero.isArcher = false;

    hero.increaseHp = 1420;
    hero.increaseAttackDamage = 30;
    hero.increaseAbilityPower = 30;
    return hero;
}

heroMap['主宰'] = copyDominator;
