import {STORAGE_KEY,emptyState,readState,weekAt,mastered,progress,matchesWeek} from './core.js';
import {PythonRunner} from './runner.js';
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const json=v=>JSON.stringify(v,null,2);
let data,state=emptyState(),storageReady=true,editor,topicId,selectedWeek,runGeneration=0,route='overview';
const filters={query:'',module:'',status:''};
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
let toastTimer;
const toast=text=>{const el=$('#toast');el.textContent=text;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.hidden=true,3500);};
function notice(text){$('#notice').textContent=text;$('#notice').hidden=false;}
function save(){
  if(!storageReady)return;
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
  catch{storageReady=false;notice('浏览器无法保存记录（可能是隐私模式或空间不足）。当前会话仍可学习，请及时导出记录。');}
}
const runner=new PythonRunner(text=>{if($('#runtime-status'))$('#runtime-status').textContent=text;});
const topicById=id=>data.topics.find(t=>t.id===id);
const weekTopics=w=>data.topics.filter(t=>t.week===w);
const meter=(percent,color='var(--blue)')=>`<div class="meter" role="progressbar" aria-label="掌握进度" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100"><i style="width:${percent}%;background:${color}"></i></div>`;
const moduleName=id=>data.modules.find(m=>m.id===id).name;
const badge=t=>mastered(t,state)?'<span class="pass">已掌握 ✓</span>':state.attempts[t.id]?.ok?'<span>待概念自测</span>':state.wrong[t.id]?'<span class="fail">待复盘</span>':'<span>未掌握</span>';
const heading=(title,subtitle,extra='')=>`<div class="page-heading"><div><h1>${title}</h1><p>${subtitle}</p></div>${extra}</div>`;
function dailyList(days){return `<div class="day-list">${days.map(day=>`<div class="day"><input type="checkbox" id="${day.id}" data-day="${day.id}" ${state.days[day.id]?'checked':''}><label for="${day.id}"><time datetime="${day.date}">${day.date.replaceAll('-','.')} ${day.date===today?' · 今天':''}</time><span class="day-text">${esc(day.task)}</span></label><span class="hours">${day.hours} 小时</span></div>`).join('')}</div>`;}
function moduleRows(){return data.modules.map(m=>{const p=progress(data.topics.filter(t=>t.module===m.id),state);return `<div class="module-row"><div class="row-title"><a class="module-name" href="#tree"><i class="dot" style="background:${m.color}"></i>${m.name}</a><span>${p.done}/${p.total} · ${m.score}分</span></div>${meter(p.percent,m.color)}</div>`;}).join('');}
function overview(){
  const w=data.weeks[weekAt(today)-1],p=progress(data.topics,state),days=Object.values(state.days).filter(Boolean).length,attempted=Object.keys(state.attempts).length;
  return heading('把计划，变成独立完成的能力。','从 Python 初级开发出发，16 周完成一套可运行、可测试的 AI 应用。','<span class="pill">个人训练 · B 级起点</span>')+`
  <section class="hero"><div class="hero-copy"><span class="pill">当前学习 · 第 ${w.id} / 16 周</span><h2>${w.title}<br>今天，向完整交付迈进一步。</h2><p>本周交付：${w.project}。每周 18 小时，先理解原理，再关闭答案独立重做，用测试验证掌握。</p><a class="primary" style="display:inline-block;padding:9px 20px;border-radius:8px;font-size:12px" href="#courses:${w.id}">继续本周学习</a> <a style="font-size:11px;margin-left:16px" href="#practice:${w.topics[0]}">打开编程练习</a></div><div class="hero-art" aria-hidden="true"><div class="bridge"><i class="bridge-leg"></i><span class="bridge-code">&lt; / &gt;</span><i class="bridge-leg"></i></div><small>从理解，到独立构建</small></div></section>
  <section class="stats" aria-label="学习统计"><div class="stat"><span class="stat-icon">◷</span><div><strong>${days}<small>/ 112 天</small></strong><p>已完成每日学习</p></div></div><div class="stat"><span class="stat-icon">⌘</span><div><strong>${p.done}<small>/ 48 项</small></strong><p>代码与自测均通过</p></div></div><div class="stat"><span class="stat-icon">⌨</span><div><strong>${attempted}<small>/ 48 题</small></strong><p>已尝试编程检查</p></div></div><div class="stat"><span class="stat-icon">▧</span><div><strong>${Object.values(state.wrong).filter(Boolean).length}<small>题</small></strong><p>等待复盘的错题</p></div></div></section>
  <div class="grid-two"><div><section class="panel"><div class="section-head"><h2>本周学习清单</h2><a href="#courses:${w.id}">查看课程详情</a></div><p class="study-hours">${w.start} 至 ${w.end} · 周一至周五各 2 小时，周末各 4 小时</p>${dailyList(w.days)}</section><section class="panel"><div class="section-head"><h2>16 周成长路线</h2><small>${p.percent}% 知识点已掌握</small></div>${meter(p.percent)}<div class="roadmap">${data.weeks.map(x=>`<a aria-label="第${x.id}周：${x.title}" class="week-dot ${x.id===w.id?'current':''} ${weekTopics(x.id).every(t=>mastered(t,state))?'done':''}" href="#courses:${x.id}">${String(x.id).padStart(2,'0')}</a>`).join('')}</div><div class="timeline-labels"><span>11月 · 工程与部署</span><span>12月–1月 · Prompt / RAG</span><span>2月 · 优化与交付</span></div></section></div>
  <div><section class="panel"><div class="section-head"><h2>五大能力模块</h2><a href="#tree">知识地图</a></div><p class="study-hours">按编程检查 + 概念自测计算；分值为官方模块权重。</p>${moduleRows()}</section><section class="panel"><h2>阶段验收</h2>${[[4,'M1 · 真实模型服务','16 / 20 分'],[6,'M2 · 结构化问答','12 / 15 分'],[11,'M3 · 离线 RAG 助教','21 / 25 分'],[13,'M4 · 性能优化服务','12 / 15 分'],[16,'毕业 · 4小时完整模拟','90 / 100 分']].map(([n,label,goal])=>`<div class="milestone"><b><a href="#courses:${n}">${label}</a></b><small>${data.weeks[n-1].end} · 训练目标 ${goal}</small></div>`).join('')}<p class="study-hours">训练目标不代表官方获奖线。网页练习不能替代官方环境验收。</p></section></div></div>`;
}
function courseFilters(){return `<div class="filters"><input type="search" id="course-search" placeholder="搜索课程、知识点或实验…" aria-label="搜索课程" value="${esc(filters.query)}"><select id="module-filter" aria-label="按模块筛选"><option value="">全部模块</option>${data.modules.map(m=>`<option value="${m.id}" ${filters.module==m.id?'selected':''}>${m.name}</option>`).join('')}</select><select id="status-filter" aria-label="按掌握状态筛选"><option value="">全部状态</option><option value="todo" ${filters.status==='todo'?'selected':''}>待掌握</option><option value="done" ${filters.status==='done'?'selected':''}>已掌握</option></select></div>`;}
function weekDetail(w){
  const ts=weekTopics(w.id),assessment=state.assessments[w.id]||{};
  return `<section class="panel week-detail"><div class="section-head"><span class="pill">第 ${w.id} 周 · ${moduleName(w.module)}</span><span class="study-hours">18 小时</span></div><h2>${w.title}</h2><p class="week-date">${w.start} — ${w.end}</p><h3>本周知识点与练习</h3>${ts.map(t=>`<a href="#practice:${t.id}" class="lesson-link"><span>${t.title}${t.sim?' <small>· 模拟</small>':''}</span><small>${badge(t)}</small></a>`).join('')}<h3 style="margin-top:25px">综合项目：${w.project}</h3><div class="callout"><b>在官方技术栈完成</b><br>${w.lab}</div><h3>周考核与验收</h3><p class="rubric">${w.exam}。建议评分：核心功能40分、边界与测试25分、工程规范20分、独立解释与复盘15分。总分≥80且核心功能通过才算周验收达标；阶段目标另见具体门槛。</p><div class="assessment"><label>自评总分 <input type="number" min="0" max="100" step="1" id="assessment-score" value="${esc(assessment.score??'')}" data-week="${w.id}"></label><label><input type="checkbox" id="assessment-core" data-week="${w.id}" ${assessment.core?'checked':''}> 核心功能实战通过</label></div><p id="assessment-result" class="study-hours">${assessment.score>=80&&assessment.core?'自评周验收达标（需保留实际测试证据）':'请根据真实项目结果自评；浏览器练习不自动完成实战验收。'}</p><h3>每日安排 · 7 天</h3>${dailyList(w.days)}</section>`;
}
function courses(){
  const matches=data.weeks.filter(w=>matchesWeek(w,data.topics,filters.query,filters.module,filters.status,state));
  if(!matches.some(w=>w.id===selectedWeek))selectedWeek=matches[0]?.id;
  return heading('16 周课程','112 天，288 小时。每周都有能交付的项目和可以检验的结果。')+courseFilters()+`<p class="study-hours" id="course-count">找到 ${matches.length} 周课程</p><div class="course-layout"><div class="week-list" aria-label="周课程选择">${matches.map(w=>{const p=progress(weekTopics(w.id),state);return `<button class="week-card ${w.id===selectedWeek?'selected':''}" data-week-select="${w.id}" aria-pressed="${w.id===selectedWeek}"><span class="number">${String(w.id).padStart(2,'0')}</span><span><b>${w.title}</b><small>${w.start.slice(5).replace('-','.')} — ${w.end.slice(5).replace('-','.')} · ${p.done}/3</small></span></button>`;}).join('')}</div><div id="week-content">${selectedWeek?weekDetail(data.weeks[selectedWeek-1]):'<div class="empty">没有匹配的课程。试试其他关键词或清除筛选。</div>'}</div></div>`;
}
function tree(){return heading('把五大能力，连成一张地图。','每个节点包含讲解、编程练习与概念自测。代码与自测均通过后计为掌握。')+`<div class="tree-grid">${data.modules.map(m=>{const ts=data.topics.filter(t=>t.module===m.id),p=progress(ts,state);return `<section class="panel"><div class="section-head"><h2><i class="dot" style="background:${m.color}"></i> ${m.name}</h2><span class="pill">${m.score} 分</span></div><p class="study-hours">${p.done}/${p.total} 已掌握</p>${meter(p.percent,m.color)}<div style="margin-top:15px">${ts.map(t=>`<a href="#practice:${t.id}" class="tree-node"><span>W${t.week} · ${t.title}</span><span class="node-status">${badge(t)}</span></a>`).join('')}</div></section>`;}).join('')}</div>`;}
function practice(){
  const t=topicById(topicId)||data.topics[0];topicId=t.id;
  return heading('Python 实验室','在本机浏览器执行代码。先尝试，再提示，最后关闭答案独立重做。',`<span class="pill ${t.sim?'amber':'teal'}">${t.sim?'纯 Python 模拟逻辑':'标准库可运行练习'}</span>`)+`
  <div class="filters"><select id="exercise-week" aria-label="选择练习周次">${data.weeks.map(w=>`<option value="${w.id}" ${w.id===t.week?'selected':''}>第 ${w.id} 周 · ${w.title}</option>`).join('')}</select><select id="exercise-topic" aria-label="选择练习知识点">${weekTopics(t.week).map(x=>`<option value="${x.id}" ${x.id===t.id?'selected':''}>${x.title}</option>`).join('')}</select><a href="#courses:${t.week}" style="padding:10px;font-size:12px">本周课程</a></div>
  <div class="practice-layout"><section class="panel lesson-content"><span class="study-hours">W${t.week} · ${moduleName(t.module)}</span><h2 style="margin-top:8px">${t.title}</h2><p>${t.concept}</p><h3>独立编程题</h3><div class="task">${esc(t.task)}<br><small>实现 solve，返回题目要求的值；print 仅用于观察输出。</small></div><h3>示例与预期结果</h3>${t.cases.slice(0,2).map((c,i)=>`<div class="case">用例 ${i+1} · solve(*${esc(JSON.stringify(c.args))})\n预期返回：${esc(JSON.stringify(c.expected))}</div>`).join('')}<p class="study-hours">检查将验证全部 ${t.cases.length} 个用例，包含正常与边界情况。</p><details><summary>查看提示</summary><p>${t.hint}</p></details><details><summary>解题思路与工程边界</summary><p>${t.reason}</p></details><details id="answer-details"><summary>查看参考答案</summary><pre class="answer">${esc(t.solution)}</pre><button id="use-answer">将答案载入编辑器</button><p class="study-hours">建议读懂后关闭答案、重置代码，再独立完成。</p></details>
  <form id="quiz-form" class="quiz"><h3>概念自测</h3><p>${t.quiz}</p>${t.choices.map((choice,i)=>`<label><input type="radio" name="quiz" value="${i}" ${state.quizzes[t.id]===i?'checked':''}> ${choice}</label>`).join('')}<button type="submit">检查自测</button><p class="quiz-result" id="quiz-result">${state.quizzes[t.id]===undefined?'尚未作答':state.quizzes[t.id]===t.correct?'回答正确。'+t.reason:'尚未答对，请结合讲解重新思考。'}</p></form>
  <h3><label for="topic-note">本题笔记</label></h3><textarea id="topic-note" class="note-field" placeholder="记录报错、边界条件和自己的理解…">${esc(state.notes[t.id]||'')}</textarea><p class="study-hours">输入自动保存 · 代码草稿也会保存</p></section>
  <section class="editor-panel" aria-label="Python 代码编辑器"><div class="editor-heading"><b>练习代码.py</b><small>Python / Pyodide 0.27.7</small></div><textarea id="code" class="editor-fallback" aria-label="Python 代码">${esc(state.drafts[t.id]??t.starter)}</textarea><div class="editor-toolbar"><button id="run" class="primary">▷ 运行</button><button id="check">✓ 检查答案</button><button id="stop" disabled>停止</button><button id="reset">重置代码</button></div><div class="console-heading"><b>输出与错误</b><span id="runtime-status" role="status">按需加载 · 执行限时 5 秒</span></div><pre id="console" class="console" aria-live="polite">点击「运行」观察输出，点击「检查答案」验证返回值。</pre><div id="test-results" class="test-results" aria-live="polite"></div><div class="runtime-note">每次运行在独立 Web Worker 中使用全新 Python 状态，停止或超时会销毁 Worker。文件系统仅为临时内存；不能直接读取本机 D 盘。这里不运行 Paddle 模型、FAISS 或真实 FastAPI 服务。<a href="#resources">查看官方环境实战说明</a></div></section></div>`;
}
function notebook(){return heading('笔记与错题','保留思考过程。失败的编程检查会自动进入错题本，通过后自动移出。')+`<div class="filters"><input type="search" id="note-search" aria-label="搜索笔记或错题" placeholder="搜索知识点或笔记…"><select id="note-filter" aria-label="筛选笔记"><option value="all">全部记录</option><option value="wrong">待复盘错题</option><option value="notes">仅笔记</option></select></div><div id="note-items">${noteItems()}</div><section class="panel"><h2><label for="global-note">周复盘与项目记录</label></h2><p class="study-hours">建议记录：实际环境、失败用例、定位过程、修改依据、复测结果和下周补强。</p><textarea class="note-field" id="global-note" placeholder="本周独立完成了什么？哪些问题仍需在官方环境验证？">${esc(state.notes.global||'')}</textarea></section>`;}
function noteItems(query='',filter='all'){
  const ts=data.topics.filter(t=>(state.wrong[t.id]||state.notes[t.id])&&(filter!=='wrong'||state.wrong[t.id])&&(filter!=='notes'||state.notes[t.id])&&(t.title+' '+(state.notes[t.id]||'')).toLowerCase().includes(query.toLowerCase()));
  return ts.length?ts.map(t=>`<article class="notebook-item"><span class="pill ${state.wrong[t.id]?'amber':'teal'}">${state.wrong[t.id]?'待复盘':'学习笔记'} · W${t.week}</span><h3 style="margin-top:10px">${t.title}</h3><pre>${esc(state.notes[t.id]||'还没有笔记。打开练习，记录导致失败的边界条件与修正方式。')}</pre><div class="notebook-actions"><a href="#practice:${t.id}">打开练习与笔记</a>${state.wrong[t.id]?`<button class="text-button" data-reviewed="${t.id}">标记已复盘</button>`:''}</div></article>`).join(''):'<div class="empty">还没有匹配记录。练习中的笔记和未通过的检查会出现在这里。</div>';
}
function resources(){return heading('从浏览器练习，走向官方工程。','依据用户提供的竞赛规则（2026.10.08）；附录样题仅作参考，正式环境与接口以当场题面为准。')+`
  <section class="panel"><h2>两种环境，各有用途</h2><div class="callout"><b>本站：静态个人学习工具</b><br>Pyodide 是 WebAssembly 版 CPython，版本与官方 Python 3.10 不同。本站只用标准库，在本机浏览器运行算法、校验和模拟逻辑，没有后端、真实模型、持久文件系统或GPU。本地自测不是防作弊评测，能看到测试和参考答案。Worker 隔离主界面与执行状态，但不是用于运行恶意代码的安全容器；请只运行自己信任的代码。</div><p class="rubric"><b>官方实战：</b>规则第1–3页规定 Ubuntu 22.04 或当届统一镜像、Python 3.10、基础2核CPU/4GB内存；每场从 PaddlePaddle、MindSpore、ModelScope 生态确定一套基线，附录样题使用 PaddlePaddle/PaddleNLP，检索为 FAISS 或镜像同类组件。正式环境禁止外部模型、未经允许的包和远程服务。本站不声称 Pyodide 能运行这些特定模型或本地组件。</p></section>
  <div class="resource-grid"><section class="panel"><h2>官方环境实验路线</h2><ul><li>W1–2：在 Linux 中读取真实文件，拆分模块，学习 venv、Git 与 pytest；记录环境和依赖版本。</li><li>W3–4：运行 FastAPI/Pydantic/Uvicorn，加载官方只读模型与配套 tokenizer，验证真实推理和 /health。保存环境检查结果。</li><li>W5–6：接入 TXT Prompt 与 YAML 配置；三组参数对照，30条结构测试，拒答和注入输入测试。</li><li>W7–11：指定 Embedding + NumPy + FAISS，构建、保存、加载索引，保留元数据，真实模型生成并引用证据。验证版本与无答案。</li><li>W12–13：真实进程计时、峰值内存、5次预热、固定问题集；20请求并发4，质量门槛先于速度。</li><li>W14–16：完整Web/API/日志，按题面打包，在陌生业务完成4小时模拟并保留测试证据。</li></ul></section>
  <section class="panel"><h2>规则与学习入口</h2><a class="resource-link" href="./assets/rules.pdf" target="_blank" rel="noopener">用户提供的竞赛规则 PDF · 26 页</a><a class="resource-link" href="./assets/course-knowledge.json" download>下载第一周项目资料 · 12条自建模拟课程知识</a><a class="resource-link" href="https://www.lanqiao.cn/paths/3361/" target="_blank" rel="noopener">规则第4页 · 蓝桥杯备赛资源</a><a class="resource-link" href="https://www.lanqiao.cn/courses/67125" target="_blank" rel="noopener">规则第2页 · 在线环境体验</a><a class="resource-link" href="https://fastapi.tiangolo.com/zh/" target="_blank" rel="noopener">FastAPI 官方文档</a><a class="resource-link" href="https://www.paddlepaddle.org.cn/" target="_blank" rel="noopener">PaddlePaddle 官方文档</a><a class="resource-link" href="https://github.com/facebookresearch/faiss" target="_blank" rel="noopener">FAISS 官方仓库</a><a class="resource-link" href="https://docs.pytest.org/" target="_blank" rel="noopener">Pytest 官方文档</a><a class="resource-link" href="https://pyodide.org/en/0.27.7/usage/webworker.html" target="_blank" rel="noopener">本站运行器依据 · Pyodide 0.27.7 Worker 文档</a></section>
  <section class="panel"><h2>样题接口专项 · PDF 第11–14页</h2><ul><li>GET /health：真实 model_loaded / index_loaded 状态。</li><li>POST /answer：question去首尾空格后1–500字符；top_k整数1–5，默认3；request_id最长64字符。</li><li>POST /batch_answer：1–10个问题，按输入顺序返回。</li><li>错误：空问题、超长、top_k越界和批大小越界为400；类型/字段错误422；内部错误500。</li><li>无答案是200业务拒答：is_refused=true、sources=[]、intent=unknown。</li><li>完整响应：request_id、answer、intent、sources、confidence、is_refused、latency_ms；来源含id/title/score，score与confidence在0–1。</li><li>网页固定data-testid：question-input、submit-button、loading-indicator、answer-output、sources-output、error-message。</li></ul></section>
  <section class="panel"><h2>评分与交付 · PDF 第4–5、20–21页</h2><p class="rubric">五模块满分20/15/25/15/25。业务效果内部权重为关键事实50%、来源20%、结构15%、关键词与数值10%、语义辅助5%。</p><p class="rubric">样题性能满分条件：平均时延≤基线85%、P95≤90%、峰值内存≤90%；效果保持≥95%得相应满分，低于90%则T4性能分归0。禁止跳过模型或必要检索换速度。</p><pre class="case">submission/\n  manifest.json / app.py / README.md\n  src/\n  config/model.yaml / generation.yaml\n  prompts/system.txt\n  artifacts/index/ / document_manifest.json\n  web/\n  logs/env_check.json / app.jsonl</pre><p class="study-hours">附录未提供配套数据和评分服务。本站课程资料、习题与模拟输出为自建训练内容，不能当作官方隐藏数据或可直接提交的参赛工程。</p></section></div>`;}

function render(){
  runner.stop();runGeneration++;editor=null;
  const [name,arg]=location.hash.slice(1).split(':');route=['overview','courses','tree','practice','notebook','resources'].includes(name)?name:'overview';
  if(route==='courses'&&arg&&data.weeks.some(w=>w.id===Number(arg)))selectedWeek=Number(arg);
  if(route==='practice'&&arg&&topicById(arg))topicId=arg;
  const titles={overview:'学习概览',courses:'16 周课程',tree:'知识地图',practice:'Python 实验室',notebook:'笔记与错题',resources:'实战与规则'};
  $('#breadcrumb').textContent=titles[route];document.title=titles[route]+' · 蓝桥研习室';
  document.querySelectorAll('[data-nav]').forEach(a=>{a.classList.toggle('active',a.dataset.nav===route);if(a.dataset.nav===route)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  $('#main').innerHTML=({overview,courses,tree,practice,notebook,resources})[route]();
  bind();
}
function bind(){
  document.querySelectorAll('[data-day]').forEach(input=>input.addEventListener('change',()=>{state.days[input.dataset.day]=input.checked;save();if(route==='overview')render();}));
  document.querySelectorAll('[data-week-select]').forEach(button=>button.onclick=()=>{location.hash='courses:'+button.dataset.weekSelect;});
  for(const [id,key,event] of [['course-search','query','input'],['module-filter','module','change'],['status-filter','status','change']]){
    const input=$('#'+id);if(input)input.addEventListener(event,()=>{const pos=input.selectionStart;filters[key]=input.value;render();const next=$('#'+id);next.focus();if(id==='course-search')next.setSelectionRange(pos,pos);});
  }
  for(const id of ['assessment-score','assessment-core'])if($('#'+id))$('#'+id).addEventListener('change',()=>{
    const scoreInput=$('#assessment-score'),score=Number(scoreInput.value);state.assessments[scoreInput.dataset.week]={score:Math.max(0,Math.min(100,Number.isFinite(score)?score:0)),core:$('#assessment-core').checked};save();$('#assessment-result').textContent=score>=80&&$('#assessment-core').checked?'自评周验收达标（需保留实际测试证据）':'尚未达标：建议总分≥80且核心功能通过。';
  });
  if(route==='practice')bindPractice();
  const updateNotes=()=>{$('#note-items').innerHTML=noteItems($('#note-search').value,$('#note-filter').value);bindReviewed();};
  if($('#note-search')){ $('#note-search').oninput=updateNotes;$('#note-filter').onchange=updateNotes;bindReviewed();$('#global-note').oninput=event=>{state.notes.global=event.target.value;save();};}
}
function bindReviewed(){document.querySelectorAll('[data-reviewed]').forEach(b=>b.onclick=()=>{delete state.wrong[b.dataset.reviewed];save();$('#note-items').innerHTML=noteItems($('#note-search').value,$('#note-filter').value);bindReviewed();toast('已标记复盘；掌握状态仍以代码与自测结果为准。');});}
function bindPractice(){
  const t=topicById(topicId);
  $('#exercise-week').onchange=event=>location.hash='practice:'+data.weeks[Number(event.target.value)-1].topics[0];
  $('#exercise-topic').onchange=event=>location.hash='practice:'+event.target.value;
  if(window.CodeMirror){editor=window.CodeMirror.fromTextArea($('#code'),{mode:'python',lineNumbers:true,indentUnit:4,tabSize:4,lineWrapping:true,extraKeys:{Tab:cm=>cm.replaceSelection('    '),'Ctrl-Enter':()=>execute(false),'Cmd-Enter':()=>execute(false)}});editor.getInputField().setAttribute('aria-label','Python 代码编辑器');editor.on('change',()=>{state.drafts[t.id]=editor.getValue();save();});}
  else $('#code').oninput=event=>{state.drafts[t.id]=event.target.value;save();};
  const setCode=value=>{if(editor)editor.setValue(value);else{$('#code').value=value;state.drafts[t.id]=value;save();}};
  $('#run').onclick=()=>execute(false);$('#check').onclick=()=>execute(true);$('#stop').onclick=()=>runner.stop();
  $('#reset').onclick=()=>{runner.stop();setCode(t.starter);$('#console').textContent='已恢复本题预置代码。';$('#test-results').replaceChildren();toast('代码已重置，笔记和学习记录保留。');};
  $('#use-answer').onclick=()=>{runner.stop();setCode(t.solution);toast('已载入参考答案。理解后请重置并独立重做。');};
  $('#topic-note').oninput=event=>{state.notes[t.id]=event.target.value;save();};
  $('#quiz-form').onsubmit=event=>{event.preventDefault();const selected=new FormData(event.target).get('quiz');if(selected===null){toast('先选择一个答案。');return;}state.quizzes[t.id]=Number(selected);save();$('#quiz-result').textContent=Number(selected)===t.correct?'回答正确。'+t.reason:'还没答对。'+t.concept;$('#quiz-result').className='quiz-result '+(Number(selected)===t.correct?'pass':'fail');};
}
async function execute(check){
  if(runner.active)return;
  const generation=runGeneration,t=topicById(topicId),code=editor?editor.getValue():$('#code').value;
  state.drafts[t.id]=code;save();$('#run').disabled=true;$('#check').disabled=true;$('#stop').disabled=false;
  $('#console').textContent='正在准备全新的 Python 执行环境…';$('#test-results').replaceChildren();
  const result=await runner.run(code,check?t.cases:[]);
  if(generation!==runGeneration)return;
  $('#run').disabled=false;$('#check').disabled=false;$('#stop').disabled=true;$('#runtime-status').textContent=result.error?'执行已结束':'执行完成';
  $('#console').textContent=(result.output||'')+(result.error?'\n'+result.error:result.output?'':'（无标准输出；请用 print 观察，或检查函数返回值。）');
  if(check&&!result.stopped){
    const tests=result.tests||[],ok=!result.error&&tests.length===t.cases.length&&tests.every(x=>x.ok);
    state.attempts[t.id]={ok,passed:tests.filter(x=>x.ok).length,total:t.cases.length,date:new Date().toISOString()};
    if(ok)delete state.wrong[t.id];else state.wrong[t.id]=true;save();
    $('#test-results').innerHTML=`<b class="${ok?'pass':'fail'}">${ok?'全部用例通过':'检查未通过'} · ${tests.filter(x=>x.ok).length}/${t.cases.length}</b>`+tests.map(x=>`<div class="test-row ${x.ok?'pass':'fail'}">用例${x.index} ${x.ok?'✓ 通过':'✕ 未通过'}${x.ok?'':`<br>${esc(x.error||'实际：'+x.actual+'；预期：'+x.expected)}`}</div>`).join('');
    if(ok)toast(state.quizzes[t.id]===t.correct?'代码与自测均通过，知识点已掌握。':'代码检查通过，完成概念自测后计为掌握。');
  }
}
$('#export').onclick=()=>{
  const blob=new Blob([json(state)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='蓝桥学习记录-'+today+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);toast('学习记录已导出，含进度、笔记和代码草稿。');
};
async function init(){
  try{state=readState(localStorage.getItem(STORAGE_KEY));}catch(error){storageReady=false;notice('已有记录无法读取，原始数据未覆盖。当前仅临时记录，请导出新记录后检查浏览器存储。'+error.message);}
  try{const response=await fetch(new URL('./curriculum.json',import.meta.url));if(!response.ok)throw new Error('课程文件读取失败：'+response.status);data=await response.json();selectedWeek=weekAt(today);topicId=data.weeks[selectedWeek-1].topics[0];window.addEventListener('hashchange',()=>{render();window.scrollTo({top:0,behavior:'instant'});});render();}
  catch(error){$('#main').innerHTML=`<section class="panel"><h1>研习室暂未打开</h1><p>${esc(error.message)}</p><p>请通过 HTTP/HTTPS 访问，不要双击 index.html。可在项目目录运行 <code>python -m http.server 4173</code>，再打开 <a href="http://localhost:4173">本地预览</a>。</p></section>`;}
}
init();
