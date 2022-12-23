import * as basic from './basic'
import {Result} from "../index";

export function list(results:Result[],puppeteer?:boolean){
  if(puppeteer)return;
  return basic.list(results)
}
