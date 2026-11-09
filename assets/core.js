export const STORAGE_KEY='lanqiao-study-v1';
export const emptyState=()=>({version:1,days:{},attempts:{},quizzes:{},notes:{},drafts:{},wrong:{},assessments:{}});
export function readState(raw){
  if(!raw)return emptyState();
  const value=JSON.parse(raw);
  if(!value||value.version!==1)throw new Error('学习记录版本无法识别');
  const state=emptyState();
  for(const key of Object.keys(state).filter(k=>k!=='version')){
    if(!value[key]||typeof value[key]!=='object'||Array.isArray(value[key]))throw new Error('学习记录结构损坏');
    state[key]=value[key];
  }
  for(const key of ['notes','drafts'])if(Object.values(state[key]).some(v=>typeof v!=='string'))throw new Error('文本记录格式损坏');
  return state;
}
export function weekAt(date){
  const day=Date.parse(date+'T00:00:00Z');
  return Number.isFinite(day)?Math.max(1,Math.min(16,Math.floor((day-Date.UTC(2026,10,9))/604800000)+1)):1;
}
export function mastered(topic,state){return state.attempts[topic.id]?.ok===true&&state.quizzes[topic.id]===topic.correct;}
export function progress(topics,state){const done=topics.filter(t=>mastered(t,state)).length;return {done,total:topics.length,percent:topics.length?Math.round(done/topics.length*100):0};}
export function matchesWeek(week,topics,query,module,status,state){
  const selected=topics.filter(t=>t.week===week.id);
  const text=[week.title,week.project,week.lab,...selected.flatMap(t=>[t.title,t.concept,t.task])].join(' ').toLowerCase();
  const all=selected.every(t=>mastered(t,state));
  return (!query||text.includes(query.trim().toLowerCase()))&&(!module||week.module===Number(module))&&(!status||(status==='done'?all:!all));
}
