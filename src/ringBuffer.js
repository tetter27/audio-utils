class RingBuffer {

    constructor (length, arrayType = ArrayBuffer) {
        this.arrayType = arrayType;
        this.wptr = 0;
        this.rptr = 0;
        this.length = length;
        this.data = new this.arrayType(this.length);
        this.isFull = false;
    }

    read(readLength){
        let availableLength;
        if (this.isFull)                   availableLength = this.length;
        else if (this.wptr == this.rptr)   availableLength = 0;
        else if (this.wptr >  this.rptr)   availableLength = this.wptr - this.rptr;
        else if (this.wptr <  this.rptr)   availableLength = this.length - this.rptr + this.wptr;

        if (readLength > availableLength) return 0; 

        const values = new this.arrayType(readLength);
        const remainingSpace = this.length - this.rptr;
        const endIndex = Math.min(remainingSpace, readLength);

        // console.log("this.data: " + this.data);
        // console.log("this.rptr: " + this.rptr);
        // console.log("endIndex: " + endIndex);
        // console.log("isFull: " + this.isFull);

        // バッファが末尾に到達する前の部分を読み込む
        values.set(new this.arrayType(this.data.subarray(this.rptr, this.rptr + endIndex)));

        if (endIndex < readLength) {
            // バッファの末尾に達した後の部分を読み込む
            values.set(new this.arrayType(this.data.subarray(0, readLength - endIndex)), endIndex, readLength - endIndex);
        }

        // rptrを進める
        // rptrがbufferの範囲外の場合は循環させる
        this.rptr = (this.rptr + readLength) % this.length;

        this.isFull = false;

        // console.log("values: " + values);

        return values;
        
    }

    write(values) {
        if (!(values instanceof this.arrayType)) {
            throw new TypeError(`Input data must be an instance of ${this.arrayType.name}`);
        }

        const remainingSpace = this.length - this.wptr;
        const endIndex = Math.min(remainingSpace, values.length);

        // バッファの末尾に達する前の部分を書き込む
        this.data.set(values.subarray(0, endIndex), this.wptr, endIndex);

        if (endIndex < values.length) {
            // バッファの末尾に達した後の部分を書き込む
            this.data.set(values.subarray(endIndex), 0, values.length - endIndex);
        }

        // wptrを進める
        // wptrがbufferの範囲外の場合は循環させる
        this.wptr = (this.wptr + values.length) % this.length;

        // console.log("this.wptr: " + this.wptr);

        const isPassing = () => {
            let isPassingWithoutCycle = this.wptr >= this.rptr && 
                                        this.wptr - this.rptr < values.length;
            let isPassingWithCycle = this.wptr < this.rptr && 
                                     this.length - this.rptr + this.wptr < values.length;
            // console.log("isPassingWithoutCycle: " + isPassingWithoutCycle);
            // console.log("isPassingWithCycle: " + isPassingWithCycle);
            return isPassingWithoutCycle || isPassingWithCycle;
        };

        // console.log("isPassing: " + isPassing());

        // wptrがrptrを追い越した場合のみrptrの値を更新する
        if (isPassing()) {
            this.rptr = this.wptr % this.length;
            this.isFull = true;
        }
    }
}

module.exports = RingBuffer;