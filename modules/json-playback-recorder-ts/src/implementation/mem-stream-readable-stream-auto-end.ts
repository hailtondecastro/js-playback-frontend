import { Readable } from 'stream';

export class MemStreamReadableStreamAutoEnd extends Readable {
    private constructing = true;
    private chunkQueue: any[] = [];
    private encodingQueue: string[] = [];
    constructor(contents: string | Buffer, encoding?: string) {
        super();
        this.append(contents, encoding);
    }

    _read(size: number): void {
        if (this.chunkQueue.length === 0) {
            this.push(null);
        } else {
            const chunk: any = this.chunkQueue.shift();
            const encoding: any = this.encodingQueue.shift();
            this.push(chunk, encoding)
        }        
    }

    append(chunk: any, encoding?: string): void {
        this.chunkQueue.push(chunk);
        this.encodingQueue.push(encoding);
    }
}