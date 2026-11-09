export class PythonRunner{
  constructor(onStatus=()=>{}){this.onStatus=onStatus;this.active=null;}
  run(code,cases=[]){
    this.stop();
    return new Promise(resolve=>{
      const worker=new Worker(new URL('./runner-worker.js',import.meta.url),{type:'module'});
      const active={worker,resolve,timer:null};this.active=active;
      const finish=result=>{
        if(this.active!==active)return;
        clearTimeout(active.timer);worker.terminate();this.active=null;resolve(result);
      };
      this.onStatus('正在加载本地 Python 运行环境…');
      active.timer=setTimeout(()=>finish({error:'运行环境加载超过90秒。请检查是否通过HTTP/HTTPS打开，或刷新后重试。'}),90000);
      worker.onmessage=({data})=>{
        if(data.type==='ready'){
          clearTimeout(active.timer);this.onStatus('Python 执行中（限时5秒）…');
          active.timer=setTimeout(()=>finish({error:'执行超过5秒，已终止 Worker。检查死循环或缩小计算量后重试。',timeout:true}),5000);
          worker.postMessage({code,cases});
        }else if(data.type==='result')finish(data);
      };
      worker.onerror=event=>{event.preventDefault();finish({error:'Python 环境无法启动：'+event.message+'。请使用本地服务器打开，并检查 assets/vendor 文件是否完整。'});};
    });
  }
  stop(){
    if(!this.active)return;
    const {worker,resolve,timer}=this.active;clearTimeout(timer);worker.terminate();this.active=null;
    resolve({error:'已停止执行。可以修改代码后重新运行。',stopped:true});
  }
}
