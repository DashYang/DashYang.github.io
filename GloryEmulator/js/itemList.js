/**
 * Created by dash on 2017/5/1.
 */

var itemMap = new Object();

function copyDarkAxe() {
    var item = new Property("暗影战斧");
    item.attackDamage = 85;
    item.coolDownSpeed = 15;
    item.maxHp = 500;
    return item;
}

function copyDoom() {
    var item = new Property("末世");
    item.attackDamage = 60;
    item.attackSpeedBonus = 30;
    item.lifeSteal = 10;
    return item;
}

function copyBloodBlade() {
    var item = new Property("泣血之刃");
    item.attackDamage = 100;
    item.lifeSteal = 25;
    return item;
}

function copyInfiniteBlade() {
    var item = new Property("无尽战刃");
    item.attackDamage = 100;
    item.criticalStrike = 20;
    return item;
}

function copyMasterPower() {
    var item = new Property("宗师之力");
    item.attackDamage = 60;
    item.criticalStrike = 20;
    item.maxHp = 400;
    item.maxMp = 400
    return item;
}

function copyStormBlade() {
    var item = new Property("风暴巨剑");
    item.attackDamage = 80;
    return item;
}

function copyMagicBreak() {
    var item = new Property("破魔刀");
    item.attackDamage = 100;
    return item;
}

function copyBoltKnife() {
    var item = new Property("闪电匕首");
    item.attackSpeedBonus = 30;
    item.criticalStrike = 20;
    item.speed = 8;
    return item;
}

function copyShadowBlade() {
    var item = new Property("影刃");
    item.attackSpeedBonus = 40;
    item.criticalStrike = 10;
    item.speed = 5;
    return item;
}

function copyFamousBlade() {
    var item = new Property("名刀·司命");
    item.attackDamage = 60;
    item.coolDownSpeed = 5;
    return item;
}

function copyFrostSpear() {
    var item = new Property("冰霜长矛");
    item.attackDamage = 80;
    item.maxHp = 600;
    return item;
}

function copyDestruction() {
    var item = new Property("破军");
    item.attackDamage = 200;
    return item;
}

function copyArmorBreaker() {
    var item = new Property("破甲弓");
    item.attackDamage = 80;
    item.coolDownSpeed = 10;
    return item;
}

function copySunchaser() {
    var item = new Property("逐日之弓");
    item.attackDamage = 40;
    item.attackSpeedBonus = 20;
    item.criticalStrike = 15;
    item.speed = 5;
    return item;
}

function copyPunishmentBlade() {
    var item = new Property("制裁之刃");
    item.attackDamage = 100;
    item.lifeSteal = 10;
    return item;
}

function copyPureSky() {
    var item = new Property("纯净苍穹");
    item.attackDamage = 100;
    item.lifeSteal = 10;
    return item;
}

function copyStrikeBack() {
    var item = new Property("反伤刺甲");
    item.attackDamage = 40;
    item.attackShield = 420;
    return item;
}

function copyBloodRage() {
    var item = new Property("血魔之怒");
    item.attackDamage = 20;
    item.maxHp = 1000;
    return item;
}

function copyRedLotus() {
    var item = new Property("红莲斗篷");
    item.attackShield = 240;
    item.maxHp = 1200;
    return item;
}

function copyLordArmor() {
    var item = new Property("霸者重装");
    item.healUp = 100;
    item.maxHp = 2000;
    return item;
}

function copySinistersympol() {
    var item = new Property("不祥征兆");
    item.attackShield = 270;
    item.maxHp = 1200;
    return item;
}

function copyPhoneixEye() {
    var item = new Property("不死鸟之眼");
    item.abilityShield = 240;
    item.maxHp = 1200;
    item.healUp = 100;
    return item;
}

function copyWitchCape() {
    var item = new Property("魔女斗篷");
    item.abilityShield = 360;
    item.maxHp = 1000;
    return item;
}

function copyFrozenStorm() {
    var item = new Property("极寒风暴");
    item.coolDownSpeed = 20;
    item.maxMp = 500;
    item.attackShield = 360;
    return item;
}

function copyIcyHolding() {
    var item = new Property("冰痕之握");
    item.coolDownSpeed = 10;
    item.maxMp = 500;
    item.attackShield = 200;
    item.maxHp = 800;
    return item;
}

function copyPhilosopherShelter() {
    var item = new Property("贤者的庇护");
    item.attackShield = 140;
    item.abilityShield = 140;
    return item;
}

function copyBurstArmor() {
    var item = new Property("暴烈之甲");
    item.attackDamage = 60;
    item.maxHp = 1000;
    return item;
}


function copyNinjaBoot() {
    var item = new Property("影忍之足");
    item.attackShield = 110;
    return item;
}

function copyResistenceBoot() {
    var item = new Property("抵抗之靴");
    item.abilityShield = 110;
    return item;
}

function copyCooldownBoot() {
    var item = new Property("冷静之靴");
    item.coolDownSpeed = 10;
    return item;
}

function copyMagicBoot() {
    var item = new Property("秘法之靴");
    return item;
}

function copyFastBoot() {
    var item = new Property("急速战靴");
    item.attackSpeedBonus = 15;
    return item;
}

function copySpeedyBoot() {
    var item = new Property("疾步之靴");
    item.attackSpeedBonus = 15;
    return item;
}


itemMap["暗影战斧"] = copyDarkAxe();
itemMap["末世"] = copyDoom();
itemMap["泣血之刃"] = copyBloodBlade();
itemMap["无尽战刃"] = copyInfiniteBlade();
itemMap["宗师之力"] = copyMasterPower();
itemMap["风暴巨剑"] = copyStormBlade();
itemMap["破魔刀"] = copyMagicBreak();
itemMap["闪电匕首"] = copyBoltKnife();
itemMap["影刃"] = copyShadowBlade();
itemMap["名刀·司命"] = copyFamousBlade();
itemMap["冰霜长矛"] = copyFrostSpear();
itemMap["破军"] = copyDestruction();
itemMap["破甲弓"] = copyArmorBreaker();
itemMap["逐日之弓"] = copySunchaser();
itemMap["制裁之刃"] = copyPunishmentBlade();
itemMap["纯净苍穹"] = copyPureSky();
itemMap["反伤刺甲"] = copyStrikeBack();
itemMap["血魔之怒"] = copyBloodRage();
itemMap["红莲斗篷"] = copyRedLotus();
itemMap["霸者重装"] = copyLordArmor();
itemMap["不祥征兆"] = copySinistersympol();
itemMap["不死鸟之眼"] = copyPhoneixEye();
itemMap["魔女斗篷"] = copyWitchCape();
itemMap["极寒风暴"] = copyFrozenStorm();
itemMap["冰痕之握"] = copyIcyHolding();
itemMap["贤者的庇护"] = copyPhilosopherShelter();
itemMap["暴烈之甲"] = copyBurstArmor();
itemMap["影忍之足"] = copyNinjaBoot();
itemMap["抵抗之靴"] = copyResistenceBoot();
itemMap["冷静之靴"] = copyCooldownBoot();
itemMap["秘法之靴"] = copyMagicBoot();
itemMap["急速战靴"] = copyFastBoot();
itemMap["疾步之靴"] = copySpeedyBoot();
