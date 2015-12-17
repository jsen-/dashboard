/// <reference path="../tsd.d.ts" />
import { inspect } from 'util';

export function print(arg:any) {
	console.log(inspect(arg, { colors: true }));
}