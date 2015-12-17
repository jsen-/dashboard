/// <reference path="../tsd.d.ts" />
import 'reflect-metadata'
import { Inject, Injector, provide } from 'angular2/core'
import * as rx from 'rxjs'
import { createServer, ServerRequest, ServerResponse } from 'http'
import * as SocketIO from 'socket.io'
import { print } from './debug/print';
import { createReadStream } from 'fs';
import { readFile } from './utils/fs';
import { Garcon, Context, Next, Middleware } from './Garcon';
import { resolve } from 'path';

abstract class Log {
    abstract log(arg: any): void;
}


class MyLogger {
    log(arg: any) {
        print(arg);
    }
}

function sleep(ms:number) {
    return new Promise((resolve, _)=>{
        setTimeout(resolve, ms);
    });
}

let injector = Injector.resolveAndCreate([
    Garcon,
    provide(Log, { useValue: new MyLogger })
]);

const garcon: Garcon = injector.get(Garcon);

garcon.use(async (next: Next, context:Context) => {
    const start = Date.now();
    context.setHeader('Trailer', 'X-Request-Duration');
    context.res.once('before-end', ()=> {
        console.log('------------');
        const duration = Date.now() - start;
        context.res.addTrailers({'X-Request-Duration': '' + duration});
        console.log(`Request "${context.url.path}" duration: ${duration} ms`); 
    });
    try {
        await next();
    } catch(e) { }
});

let indexCache;
garcon.use('/', async (next: Next, context:Context) => {
    context.setHeader('Content-Type', 'text/html');
    context.res.write(indexCache === undefined ? indexCache = await readFile(resolve('static', 'index.html')) : indexCache);
    context.res.end();
});

let faviconCache;
garcon.use('/favicon.ico', async (next: Next, context:Context) => {
    context.setHeader('Content-Type', 'image/x-icon');
    context.res.write(faviconCache === undefined ? faviconCache = await readFile(resolve('static', 'favicon.ico')) : faviconCache);
    context.res.end();
});

const server = createServer(garcon.callback()).listen(1337, '0.0.0.0');
server.once('listening', () => {
    let { address, port } = server.address();
    console.info(`server listening on ${address} ${port}`);
});
