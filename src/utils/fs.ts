import * as fs from 'fs';

export function readFile(path: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        fs.readFile(path, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

export function readFileDecode(path: string, encoding: string):Promise<string> {
    return readFile(path).then(data=>data.toString(encoding));
}

export function readFileUtf8(path: string):Promise<string> {
    return readFile(path).then(data=>data.toString('utf8'));
}
