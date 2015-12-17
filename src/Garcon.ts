import { ServerRequest, ServerResponse } from 'http';
import { default as pathToRegexp } from 'path-to-regexp';
import { parse as urlParse, Url } from 'url';

export class Context {
    ended: boolean = false;
    url: Url;
    private _end;
    constructor(public req: ServerRequest, public res: ServerResponse) {
        this.url = urlParse(req.url, true);
        this._end = res.end;
        res.end = (...args)=>{
            console.log('before-emit');
            res.emit('before-end');
            console.log('after-emit');
            this._end.call(res, ...args);
        };
        res.on('end', _=> this.ended = true);
    }
    setHeader(name: string, value: string) {
        this.res.setHeader(name, value);
        return this;
    }
}

export interface Middleware {
    (next: Next, context: Context): Promise<void>;
}

export interface Next {
    (): void;
}

const ALL_MATCH = new RegExp('');

export class Garcon {
    private _middleware: Array<[RegExp, Middleware]> = [];

    use(path: string | Middleware, middleware?: Middleware) {
        let p: RegExp;
        let m: Middleware;
        const keys = [];
        if (typeof path === 'string') {
            p = pathToRegexp(path, keys);
            m = middleware;
        } else {
            p = ALL_MATCH;
            m = path;
        }

        this._middleware.push([p, m]);
    }

    private handleRequest(req: ServerRequest, res: ServerResponse) {
        const context = new Context(req, res);
        const url = urlParse(req.url, true);
        let index = 0;
        const next = async () => {
            if (context.ended) {
                return;
            }
            while (index < this._middleware.length) {
                let [pathRe, middleware] = this._middleware[index++];
                let match = pathRe.exec(url.pathname);
                if (match !== null) {
                    await middleware.call(context, next, context);
                    break;
                }
            }
        }
        next().catch((e) => {
            throw e;
        });
    }

    callback() {
        return (req: ServerRequest, res: ServerResponse) => {
            this.handleRequest(req, res);
        }
    }

}


