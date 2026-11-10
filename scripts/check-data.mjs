import { deriveDermSkus } from './source-data.mjs';
import { dermSkus } from '../modules/observations.js';

if (JSON.stringify(await deriveDermSkus()) !== JSON.stringify(dermSkus)) {
  throw new Error('가상 데이터룸과 화면의 재고·발주 입력이 다릅니다.');
}
console.log('가상 데이터룸 입력 대조 완료');
