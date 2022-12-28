import * as basic from './basic'
import * as puppeteer from './puppeteer'
import {Result} from "../index";

export function list(results:Result[],usePuppeteer?:boolean){
  if(usePuppeteer)return puppeteer.list(results);
  return basic.list(results)
}
