# MaterialSwitch AI

가상 데이터룸을 이용한 공급망 충격 분석과 대체 원료 의사결정 시연판입니다. 실제 기업 기록이나 자동 발주 시스템이 아닙니다.

## 실행

```bash
npm ci
npm run build
npm test
```

`dist/`를 정적 웹 서버에서 제공하면 됩니다. `npm run dev`는 현재 빌드를 다시 생성합니다.

## 구조

- `src/App.jsx`: React 화면 상태와 탐색
- `src/components/`: 사이드바, 아이콘, AI 분석 패널
- `src/views/`: 관제센터, 의사결정, 승인 작업, 이력, 데이터 계보
- `src/lib/copilot.js`: 가상 데이터와 현재 시나리오를 설명하는 규칙 기반 응답
- `modules/data.js`: 후보, 증빙 및 시연 시나리오
- `modules/domain.js`: 재고 노출과 공급 충족률 계산
- `modules/state.js`, `modules/actions.js`: 로컬 상태와 사용자 작업
- `modules/observations.js`: 가상 데이터룸에서 추출한 관측값
- `scripts/source-data.mjs`, `scripts/check-data.mjs`: 데이터룸 입력 재산출 및 빌드 검증
- `scripts/build-react.mjs`: esbuild 정적 묶음

UI는 React 19와 [Palantir Blueprint](https://github.com/palantir/blueprint)의 Card, Button, Tag, HTMLTable을 사용합니다. 공급망 관제센터의 어두운 데스크톱 테마는 `src/theme.css`에서 새로 정의했습니다. 표의 검색·정렬·페이지 이동은 TanStack Table, AI 설명 패널의 접근성은 Radix Dialog, 아이콘은 Lucide React를 사용합니다. shadcn/ui와 Vercel Chatbot은 구성 참고용이며 해당 저장소의 코드를 복사하지 않았습니다.

## 판단의 범위

재고 커버는 현재고와 최근 4주 판매량으로 계산합니다. 예정 도착은 발주일과 데이터룸의 리드타임, 사용자가 가정한 지연일로 계산합니다. 이송 중 재고와 확정 입고일이 없어 노출 기간은 보수적인 비교값이며 실제 품절일이 아닙니다. 미공급 발주액은 발주 금액에 미충족 비율을 곱한 값으로, 손실액이나 추가 비용이 아닙니다.

ALT-B1~B3의 실제 입찰, 품질, 납기 데이터가 없으므로 가중치, 점수, 순위를 만들지 않습니다. 증빙 체크와 승인은 시연 입력이며, 작업과 이력은 사용자의 브라우저에만 저장됩니다.

데모: https://ax-wonjun-ysln.axhub.page
