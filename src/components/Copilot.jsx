import { useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { impacts, missingEvidence } from '../../modules/domain.js';
import { answerQuestion } from '../lib/copilot.js';
import Icon from './Icon.jsx';

const suggestions = ['후보별 리스크 차이를 비교해줘', '승인 전에 부족한 증빙을 알려줘', '공급량 50%일 때 영향을 요약해줘'];

export default function Copilot({ state, open, onOpenChange }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const threadRef = useRef(null);
  const impact = impacts(state);
  const missing = missingEvidence(state).length;
  useEffect(() => { if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight; }, [messages, open]);
  const ask = value => {
    const query = value.trim();
    if (!query) return;
    setMessages(previous => [...previous, { id: crypto.randomUUID(), query, answer: answerQuestion(state, query) }]);
    setInput('');
  };
  return <Dialog.Root open={open} onOpenChange={onOpenChange} modal={false}><Dialog.Portal><Dialog.Content className="ai-rail react-ai-rail" id="copilot-panel" aria-describedby="copilot-description"><header className="ai-head"><div className="ai-title"><span className="ai-mark"><Icon name="sparkles" size={17} /></span><div><Dialog.Title>분석 설명</Dialog.Title><span>규칙 기반 의사결정 보조</span></div></div><div className="ai-head-actions"><span className="ai-status">현재 화면 기준</span><Dialog.Close className="ai-close" aria-label="분석 패널 닫기"><Icon name="x" size={17} /></Dialog.Close></div></header><Dialog.Description className="sr-only" id="copilot-description">가상 데이터룸과 현재 시나리오를 규칙으로 설명하는 패널입니다.</Dialog.Description><div className="ai-context"><span className="context-label">현재 상황</span><span className="context-chip">MAT-047</span><span className="context-chip">M-B</span><span className="context-chip">지연 {state.delay}일 · 공급 {state.supply}%</span></div><div className="ai-thread" ref={threadRef}><div className="thread-divider"><span>현재 시연 컨텍스트</span></div><div className="assistant-message"><span className="message-icon"><Icon name="sparkles" size={16} /></span><div className="message-body"><b>가상 기록을 계산했습니다.</b><span>{impact.critical.id}의 보수적 재고 노출은 {impact.exposureDays}일입니다. 이송 중 물량과 입고일이 없어 실제 손실은 계산하지 않습니다.</span><div className="ai-brief"><div className="brief-head"><span>판단 요약</span><span className="risk-level">추가 확인 필요</span></div><div className="brief-primary"><span>후보 비교</span><strong>점수 산정 불가</strong></div><div className="brief-grid"><div><span>재고 노출</span><strong>{impact.exposureDays}일</strong></div><div><span>증빙 상태</span><strong>{missing ? `${missing}건 확인 필요` : '화면상 완료'}</strong></div></div><div className="brief-reason"><Icon name="activity" size={15} /><p>실측 입찰과 납기 자료가 없어 후보 순위를 정할 수 없습니다.</p></div></div><span className="next-label">추천 질문</span><div className="suggestion-list">{suggestions.map(query => <button className="ai-suggestion" key={query} onClick={() => ask(query)}>{query}<Icon name="arrow" size={14} /></button>)}</div></div></div>{messages.map(message => <div className="conversation-pair" key={message.id}><div className="user-message">{message.query}</div><div className="assistant-message"><span className="message-icon"><Icon name="sparkles" size={16} /></span><div className="message-body"><b>규칙 기반 답변</b><span>{message.answer}</span></div></div></div>)}</div><form className="ai-compose" onSubmit={event => { event.preventDefault(); ask(input); }}><div className="compose-box"><textarea value={input} onChange={event => setInput(event.target.value)} aria-label="현재 상황 질문" placeholder="현재 공급망에 대해 질문하세요" onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); ask(input); } }} /><div className="compose-actions"><span className="compose-meta">현재 화면과 시나리오 참조</span><button className="send-btn" type="submit" aria-label="질문 보내기"><Icon name="send" size={16} /></button></div></div><div className="ai-disclaimer">규칙 기반 답변 · 가상 데이터룸 · 생성형 AI 답변 아님</div></form></Dialog.Content></Dialog.Portal></Dialog.Root>;
}
