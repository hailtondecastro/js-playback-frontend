
import { of, from, Observable, combineLatest } from "rxjs";
import { map, flatMap } from "rxjs/operators";
import { CacheHandler } from "../api/recorder-config";
import { combineFirstSerial } from "./rxjs-util";
import * as fs from 'fs';
import * as path from 'path';
import { BlobOrStream } from "../api/lazy-ref";

export namespace RecorderForNode {
    export class CacheHandlerDefault implements CacheHandler {
        public constructor(private filesFolder: string) {
            if(!path.isAbsolute(this.filesFolder)) {
                this.filesFolder = path.resolve(this.filesFolder); 
                this.filesFolder = path.normalize(this.filesFolder); 
            }
        }

        private cacheKeys: Set<string> = new Set();

        private createFilesFolderIfNeeded(): Observable<void> {
            const pathParts = this.filesFolder.split(path.sep);
            const obsArr: Observable<void>[] = [];
            for (let index = 0; index < pathParts.length; index++) {
                const intermediatePath = path.join(...pathParts.slice(0, index + 1));
                const p: Promise<void> = new Promise((resolve, reject) => {
                    fs.exists(intermediatePath, (exists) => {
                        if(!exists) {
                            fs.mkdir(intermediatePath, (err) => {
                                if(err) {
                                    reject(err);
                                } else {
                                    resolve(null);
                                }
                            });
                        } else {
                            resolve(null);
                        }
                    })
                });
                obsArr.push(from(p));
            }

            return combineFirstSerial(obsArr).pipe(
                map((valuesArr) => {
                    return null;
                })
            );
        }

        public clearCache(): Observable<void> {
            const obsArr: Observable<void>[] = [];
            for (const cacheItem of Array.from(this.cacheKeys)) {
                const fileStr = path.resolve(this.filesFolder, cacheItem);
                const p = new Promise<void>((resolve, reject) => {
                    fs.unlink(fileStr, (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(null);
                        }
                    });
                });
                obsArr.push(from(p));
            }
            if(obsArr.length > 0) {
                return combineLatest(obsArr).pipe(
                    map((value: void[]) => {
                        return null;
                    })
                );
            } else {
                return of(null);
            }
        }

        public getFromCache(cacheKey: string): Observable<BlobOrStream> {
            const fileStr = path.resolve(this.filesFolder, cacheKey);
            const rs: NodeJS.ReadableStream = fs.createReadStream(fileStr);
            
            return of(rs);
        }

        public putOnCache(cacheKey: string, stream: BlobOrStream) {
            const cacheKeyTmp = cacheKey + '.tmp';
            const cacheKeyPath = path.resolve(this.filesFolder, cacheKey);
            const cacheKeyTmpPath = path.resolve(this.filesFolder, cacheKeyTmp);
            const p: Promise<void> = new Promise((resolve, reject) => {
                const constrolFlags = {readEnded: false, lastWriteEnded: false };
                const ws: NodeJS.WritableStream = fs.createWriteStream(cacheKeyTmpPath, { flags: 'w'});
                const rs: NodeJS.ReadableStream = stream as NodeJS.ReadableStream;
                rs.on('error', (err) => {
                    reject(err);
                });
                ws.on('error', (err) => {
                    reject(err);
                });
                rs.on('end', (chunck) => {
                    constrolFlags.readEnded = true;
                });
                rs.on('data', (chunck) => {
                    ws.write(chunck, () => {
                        if(constrolFlags.readEnded) {
                            constrolFlags.lastWriteEnded = true;
                            const renameCB = () => {
                                ws.end(() => {
                                    fs.rename(cacheKeyTmpPath, cacheKeyPath, (err) => {
                                        if(err) {
                                            reject(err);
                                        } else {
                                            resolve(null);
                                        }
                                    });
                                });
                            };
                            fs.exists(cacheKeyPath, (exists) => {
                                if(exists) {
                                    fs.unlink(cacheKeyPath, (err) => {
                                        if(err) {
                                            reject(err);
                                        } else {
                                            renameCB();
                                        }
                                    })
                                } else {
                                    renameCB();
                                }
                            });
                        }
                    });
                });
            });

            return this.createFilesFolderIfNeeded().pipe(
                flatMap(() => {
                    return from(p);
                })
            );
        }

        public removeFromCache(cacheKey: string): Observable<void> {
            const cacheKeyPath = path.resolve(this.filesFolder, cacheKey);
            const p: Promise<void> = new Promise((resolve, reject) => {
                fs.unlink(cacheKeyPath, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(null);
                    }
                });
            });
            return from(p);
        }
    }
}