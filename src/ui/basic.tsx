import {Result} from "../index";

export function list(results:Result[]){
  return <>
    <p>请输入序号以进行选择,输入其他文本视为退出:</p>
    {results.map((t,i)=><>
      <p>{i+1}.<text content={t.name}/></p>
      <p> - <text content={t.artist.slice(0,10)+(t.artist.length>10?'...':'')}/></p>
      </>)}
  </>;
}
