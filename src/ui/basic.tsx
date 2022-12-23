import {Result} from "../index";

export function list(results:Result[]){
  return <>
    <p>我们找到了多个可能符合条件的歌曲,请您进行选择:</p>
    {results.map((t,i)=><>
      <p>{i+1}.<text content={t.name}/></p>
      <p> - <text content={t.artist.slice(0,10)+(t.artist.length>10?'...':'')}/> <text content={t.album}/></p>
      </>)}
  </>;
}
