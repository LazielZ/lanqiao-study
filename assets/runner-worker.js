import {loadPyodide} from './vendor/pyodide/pyodide.mjs';
let output='',truncated=false;
const capture=text=>{if(output.length<20000)output+=(text+'\n').slice(0,20000-output.length);else truncated=true;};
try{
  const py=await loadPyodide({indexURL:new URL('./vendor/pyodide/',import.meta.url).href,stdout:capture,stderr:capture});
  self.postMessage({type:'ready'});
  self.onmessage=async({data})=>{
    output='';truncated=false;
    const globals=py.runPython('dict()');
    try{
      await py.runPythonAsync(data.code,{globals});
      let tests=[];
      if(data.cases.length){
        globals.set('_cases_json',JSON.stringify(data.cases));
        const result=await py.runPythonAsync(`
import json as _json, inspect as _inspect
_results=[]
for _i,_case in enumerate(_json.loads(_cases_json),1):
    try:
        _actual=solve(*_case['args'])
        if _inspect.isawaitable(_actual):
            _actual=await _actual
        _ok=type(_actual) is type(_case['expected']) and _actual==_case['expected']
        if type(_actual) in (int,float) and type(_case['expected']) in (int,float):
            _ok=_actual==_case['expected']
        _results.append({'index':_i,'ok':_ok,'actual':repr(_actual)[:800],'expected':repr(_case['expected'])[:800]})
    except Exception as _e:
        _results.append({'index':_i,'ok':False,'error':str(_e)[:800]})
_json.dumps(_results,ensure_ascii=False)
`,{globals});
        tests=JSON.parse(result);
      }
      self.postMessage({type:'result',output:output+(truncated?'\n[输出超过20000字符，已截断]':''),tests});
    }catch(error){self.postMessage({type:'result',output,error:String(error.message).slice(0,6000)});}
    finally{globals.destroy();}
  };
}catch(error){self.postMessage({type:'result',error:'本地 Pyodide 加载失败：'+error.message});}
