// 2026-07-01 기준 가상 데이터룸에서 재계산한 시나리오 입력.
// sku_inventory_ms + sku_weekly_sales_ms(최근 4주) + m_sku_ms + sc_purchase_orders_ms.
export const asOf = '2026-07-01';
export const dermSkus = [
  { id: 'SKU-1001', onHand: 23123, weeklyDemand: 7910.5, safetyWeeks: 4, orderDate: '2026-06-26', orderQty: 24000, leadWeeks: 12, orderAmountKrw: 524160000 },
  { id: 'SKU-1002', onHand: 21111, weeklyDemand: 7222, safetyWeeks: 4, orderDate: '2026-06-23', orderQty: 24000, leadWeeks: 12, orderAmountKrw: 524160000 },
  { id: 'SKU-1003', onHand: 16210, weeklyDemand: 3782.25, safetyWeeks: 4, orderDate: '2026-06-22', orderQty: 20000, leadWeeks: 12, orderAmountKrw: 436800000 },
  { id: 'SKU-1004', onHand: 14359, weeklyDemand: 6499, safetyWeeks: 4, orderDate: '2026-06-23', orderQty: 20000, leadWeeks: 12, orderAmountKrw: 436800000 }
];
