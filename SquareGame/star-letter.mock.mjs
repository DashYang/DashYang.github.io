// star-letter.mock.mjs —— 放工程根，`star-letter dev` 启动时加载；改后需重启 dev。
//
// 只为「模拟」档提供离线假数据，不计费。它不在 gameFile（./minitool-square-game）
// 里，所以不会进发布的游戏包。
//
// 本游戏只用到 exchange（广告复活）。leaderboard 不在必要时无法自桩——它由 Host
// 内置确定性模拟器接管，未写 handler 时自动使用，不需要（也不应该）在这里重写。

// 与线上兑换项 5488 保持一致：纯广告路径（costAmount 0 + adWatchCount 1），
// targetType 用游戏代码里匹配的 'revive'。
const REVIVE_ITEM = {
  id: 5488,
  name: "看广告复活",
  costAssetType: 1,
  costAmount: 0,
  adWatchCount: 1,
  targetType: "revive",
  targetAmount: 1,
};

let orderSeq = 0;

export default {
  "exchange.listItems": async () => ({ items: [REVIVE_ITEM] }),

  // SDK 内部把 exchange() 编排成 create → deliver → confirm/cancel，所以要桩的是
  // 这三步，而不是 exchange.exchange。via='ad' 时 create 返回 adOrderId。
  "exchange.create": async ({ exchangeItemId }) => {
    if (exchangeItemId !== REVIVE_ITEM.id) {
      throw new Error(`unknown exchangeItemId: ${exchangeItemId}`);
    }
    orderSeq += 1;
    return {
      adOrderId: `mock-ad-${orderSeq}`,
      remainWatchCount: 0,
      targetWatchCount: 1,
      // SDK 读这个字段里的 mockWaitSeconds 来模拟看广告耗时，1 秒够测流程
      providerPlacement: JSON.stringify({ mockWaitSeconds: 1 }),
      targetType: REVIVE_ITEM.targetType,
      targetAmount: REVIVE_ITEM.targetAmount,
    };
  },

  // 广告与确认的进度查询；未列出时按已看满处理
  "exchange.showRewardedAd": async () => ({ isEnded: true, count: 1 }),

  // ⚠ SDK 2.1.1 起收紧为「返回 success === true 才算成功」。返回 { ok: true }
  // 或 {} 会在三次确认后抛 EXCHANGE_CONFIRM_FAILED —— 模拟档也一样会触发。
  "exchange.confirm": async () => ({ success: true }),
  "exchange.cancel": async () => ({ ok: true }),
};
