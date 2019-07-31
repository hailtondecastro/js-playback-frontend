import * as memStreams from 'memory-streams';

export class MemStreamReadableStreamAutoEnd extends memStreams.ReadableStream{
    private constructing = true;
    constructor(contents: string) {
        super(contents);
        try {
            this.addListener('readable', this.readableCb);
        } finally {
            this.constructing = false;
        }
    }

    private dataCbAdded = false;

    // public push(chunk: any, encoding?: string): boolean {
    //     throw new Error('Not alowed!!!');
    // }
    
    push(chunk: any, encoding?: string): boolean {
        let result = super.push(chunk, encoding);
        try {
            return result;
        } finally {
            if (!this.constructing) {
                this.emit('end');
            }
        }
    }

    private readableCb() {
        // this.removeListener('readable', this.readableCb);
        // let readTest = this.read(0);
        // this.addListener('readable', this.readableCb);
        // if (!this.dataCbAdded) {
        //     this.dataCbAdded = true;
        //     this.addListener('data', this.dataCb);
        // }
        if (!(this as any)._readableState
                || (this as any)._readableState.length === null
                || (this as any)._readableState.length === undefined) {
            throw new Error('Not supported');
        }
        if ((this as any)._readableState.length <= 0) {
            this.removeListener('readable', this.readableCb);
            this.emit('end');
        }
    }
    // private dataCb(chunk: any) {

    // }
}