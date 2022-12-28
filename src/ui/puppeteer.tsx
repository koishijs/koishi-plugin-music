import {Result} from "../index";

export function list(results:Result[]){
  return <>
    <p>请输入序号以进行选择,输入其他文本视为退出:</p>
    <html>
    <table style="padding:30px;background:#333333;color:#ffffff;">
      <tr>
        <th style="text-align:left">编号</th>
        <th style="text-align:left">名称</th>
        <th style="text-align:left">歌手/作曲</th>
      </tr>
      {results.map((t,i)=><tr>
        <td style="padding-right:30px">{i+1}</td>
        <td style="padding-right:30px"><text content={t.name}/></td>
        <td style="padding-right:30px"><text content={t.artist.slice(0,15)+(t.artist.length>15?'...':'')}/></td>
      </tr>)}
    </table>
    </html>
  </>;
}
