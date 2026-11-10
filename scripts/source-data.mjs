import { readFile } from 'node:fs/promises';

const dataRoot = new URL('../01_참가자_배포용/04_원본데이터/', import.meta.url);
const readRows = async path => {
  const text = await readFile(new URL(path, dataRoot), 'utf8');
  const [header, ...lines] = text.trim().split(/\r?\n/);
  const columns = header.split('|');
  return lines.map(line => Object.fromEntries(line.split('|').map((value, index) => [columns[index], value])));
};

export async function deriveDermSkus() {
  const [inventory, sales, products, orders] = await Promise.all([
    readRows('02_masil/inventory/sku_inventory_ms.csv'),
    readRows('02_masil/inventory/sku_weekly_sales_ms.csv'),
    readRows('02_masil/master/m_sku_ms.csv'),
    readRows('02_masil/inventory/sc_purchase_orders_ms.csv')
  ]);
  const ids = products.filter(row => row.product_id === 'PL-02').map(row => row.sku_id).sort();
  return ids.map(id => {
    const stock = inventory.find(row => row.sku_id === id && row.snapshot_date === '2026-06-30');
    const master = products.find(row => row.sku_id === id);
    const lastFour = sales.filter(row => row.sku_id === id && row.week <= '2026-06-30')
      .sort((a, b) => b.week.localeCompare(a.week)).slice(0, 4);
    const po = orders.find(row => row.sku_id === id);
    if (!stock || !master || !po || lastFour.length !== 4) throw new Error(`${id}의 입력 기록이 부족합니다.`);
    return {
      id,
      onHand: Number(stock.on_hand_qty),
      weeklyDemand: lastFour.reduce((sum, row) => sum + Number(row.sold_qty), 0) / 4,
      safetyWeeks: Number(master.safety_stock_weeks_min),
      orderDate: po.order_date,
      orderQty: Number(po.order_qty),
      leadWeeks: Number(po.lead_time_weeks),
      orderAmountKrw: Number(po.amount_krw)
    };
  });
}
