const RingBuffer = require("../ringBuffer.js");

describe("RingBufferクラス", () => {
    it('RingBuffer Classは第2引数なしでインスタンス化するとArrayBuffer型になる', () => {
        const ringBuffer = new RingBuffer(20);
        expect(ringBuffer.arrayType).toBe(ArrayBuffer);
        expect(ringBuffer.length).toBe(20);
    })
});


describe("RingBufferクラス#Float32Array", () => {
    it('RingBuffer Classは第2引数にFloat32Arrayを指定してインスタンス化するとArrayBuffer型になる', () => {
        const ringBuffer = new RingBuffer(20, Float32Array);
        expect(ringBuffer.arrayType).toBe(Float32Array);
        expect(ringBuffer.length).toBe(20);
    })

    it('writeしてからreadすると格納した値を取り出すことができる', () => {
        const ringBuffer = new RingBuffer(40, Float32Array);
        const inputArray = new Float32Array([1.2, 3.4, 55, 1.234, 9.99, 10, 206, 0, 20.20, 6.66]); // size 10

        ringBuffer.write(inputArray);
        const results = ringBuffer.read(10);

        results.forEach((result, i) => {
            expect(result).toBeCloseTo(inputArray[i]);
        });
        expect(ringBuffer.wptr).toBe(10);
        expect(ringBuffer.rptr).toBe(10);
        
    })

    it('複数回に分けてwriteした内容を一括でreadできる', () => {
        const ringBuffer = new RingBuffer(20, Float32Array);
        const inputArray1 = new Float32Array([1.2, 3.4, 55, 1.234, 9.99, 10, 206, 0, 20.20, 6.66]); // size 10
        const inputArray2 = new Float32Array([54, 6.4, 7.01, 3.67, 8, 34.66, 90.003, 234, 0, 1]); // size 10

        ringBuffer.write(inputArray1);
        ringBuffer.write(inputArray2);
        const results = ringBuffer.read(20);

        const concatArray = new Float32Array(20);
        concatArray.set(inputArray1);
        concatArray.set(inputArray2, 10, 10);

        results.forEach((result, i) => {
            expect(result).toBeCloseTo(concatArray[i]);
        });

        expect(ringBuffer.wptr).toBe(0);
        expect(ringBuffer.rptr).toBe(0);
    })

    it('一括でwriteした内容を複数回に分けてreadできる', () => {
        const ringBuffer = new RingBuffer(20, Float32Array);
        const inputArray = new Float32Array([1.2, 3.4, 55, 1.234, 9.99, 10, 206, 0, 20.20, 6.66, 54, 6.4, 7.01, 3.67, 8, 34.66, 90.003, 234, 0, 1]); // size 20

        ringBuffer.write(inputArray);
        const results1 = ringBuffer.read(10);
        const results2 = ringBuffer.read(10);
        
        const concatResults = new Float32Array(20);
        concatResults.set(results1);
        concatResults.set(results2, 10, 10);

        concatResults.forEach((result, i) => {
            expect(result).toBeCloseTo(inputArray[i]);
        });
        expect(ringBuffer.wptr).toBe(0);
        expect(ringBuffer.rptr).toBe(0);
    })

    it('配列サイズを超える数を複数回に分けてwriteすると循環する', () => {
        const ringBuffer = new RingBuffer(30, Float32Array);
        const inputArray1 = new Float32Array([1.2, 3.4, 55, 1.234, 9.99, 10, 206, 0, 20.20, 6.66, 54, 6.4, 7.01, 3.67, 8, 34.66, 90.003, 234, 0, 1]); // size 20
        const inputArray2 = new Float32Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]); // size 20

        ringBuffer.write(inputArray1);
        const results1 = ringBuffer.read(10);

        ringBuffer.write(inputArray2);
        const results2 = ringBuffer.read(30);

        results1.forEach((result, i) => {
            expect(result).toBeCloseTo(inputArray1[i]);
        });

        const concatArray = new Float32Array(30);
        concatArray.set(inputArray1.subarray(10, 20));
        concatArray.set(inputArray2, 10, 20);

        results2.forEach((result, i) => {
            expect(result).toBeCloseTo(concatArray[i]);
        });
        expect(ringBuffer.wptr).toBe(10);
        expect(ringBuffer.rptr).toBe(10);
    })

    it('writeの追い越しが発生した場合データが上書きされる', () => {
        const ringBuffer = new RingBuffer(30, Float32Array);
        const inputArray1 = new Float32Array([1.2, 3.4, 55, 1.234, 9.99, 10, 206, 0, 20.20, 6.66, 54, 6.4, 7.01, 3.67, 8, 34.66, 90.003, 234, 0, 1]); // size 20
        const inputArray2 = new Float32Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]); // size 20

        ringBuffer.write(inputArray1);
        expect(ringBuffer.wptr).toBe(20);
        expect(ringBuffer.rptr).toBe(0);

        ringBuffer.write(inputArray2);
        expect(ringBuffer.wptr).toBe(10);
        expect(ringBuffer.rptr).toBe(10);

        const results = ringBuffer.read(30);

        const concatArray = new Float32Array(30);
        concatArray.set(inputArray1.subarray(10, 20));
        concatArray.set(inputArray2, 10, 20);

        results.forEach((result, i) => {
            expect(result).toBeCloseTo(concatArray[i]);
        });
        expect(ringBuffer.wptr).toBe(10);
        expect(ringBuffer.rptr).toBe(10);

    })

    it('writeが追い越しの後に循環した場合、値が上書きされreadも循環して更新される', () => {
        const ringBuffer = new RingBuffer(30, Float32Array);
        const inputArray1 = new Float32Array([1.2, 3.4, 55, 1.234, 9.99, 10, 206, 0, 20.20, 6.66, 54, 6.4, 7.01, 3.67, 8, 34.66, 90.003, 234, 0, 1]); // size 20
        const inputArray2 = new Float32Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]); // size 20
        const inputArray3 = new Float32Array([20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44]); // size 25

        ringBuffer.write(inputArray1);
        const results1 = ringBuffer.read(20);
        expect(ringBuffer.wptr).toBe(20);
        expect(ringBuffer.rptr).toBe(20);

        ringBuffer.write(inputArray2);
        expect(ringBuffer.wptr).toBe(10);
        expect(ringBuffer.rptr).toBe(20);
        
        ringBuffer.write(inputArray3);
        expect(ringBuffer.wptr).toBe(5);
        expect(ringBuffer.rptr).toBe(5);

        const results2 = ringBuffer.read(30);

        results1.forEach((result, i) => {
            expect(result).toBeCloseTo(inputArray1[i]);
        });

        const concatArray = new Float32Array(30);
        concatArray.set(inputArray2.subarray(15, 20));
        concatArray.set(inputArray3, 5, 25);

        results2.forEach((result, i) => {
            expect(result).toBeCloseTo(concatArray[i]);
        });
        expect(ringBuffer.wptr).toBe(5);
        expect(ringBuffer.rptr).toBe(5);
    })

    it('writeが循環の後に追い越しが発生した場合データが上書きされてreadが更新される', () => {
        const ringBuffer = new RingBuffer(30, Float32Array);
        const inputArray1 = new Float32Array([1.2, 3.4, 55, 1.234, 9.99, 10, 206, 0, 20.20, 6.66, 54, 6.4, 7.01, 3.67, 8, 34.66, 90.003, 234, 0, 1]); // size 20
        const inputArray2 = new Float32Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]); // size 20

        ringBuffer.write(inputArray1);
        const results1 = ringBuffer.read(5);
        expect(ringBuffer.wptr).toBe(20);
        expect(ringBuffer.rptr).toBe(5);

        ringBuffer.write(inputArray2);
        expect(ringBuffer.wptr).toBe(10);
        expect(ringBuffer.rptr).toBe(10);

        const results2 = ringBuffer.read(30);
        const results3 = ringBuffer.read(30);

        results1.forEach((result, i) => {
            expect(result).toBeCloseTo(inputArray1[i]);
        });

        const concatArray = new Float32Array(30);
        concatArray.set(inputArray1.subarray(10, 20));
        concatArray.set(inputArray2, 10, 20);

        results2.forEach((result, i) => {
            expect(result).toBeCloseTo(concatArray[i]);
        });
        expect(ringBuffer.wptr).toBe(10);
        expect(ringBuffer.rptr).toBe(10);
    })
});