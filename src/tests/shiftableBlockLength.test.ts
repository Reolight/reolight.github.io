import { maskSynthetizer, nonReqMask, nonReqMaskWithLiterl } from "./common";

describe("Tests for determining movable block size when it must be shifted to place new block", () => {
    it("Определить длину сдвигаемого блока со значением '1   ' с позиции 0", () => {
        maskSynthetizer.generate(nonReqMask);
        maskSynthetizer.putSymbols("1", 0);

        const actual = maskSynthetizer["getShiftableBlockLength"](0);

        expect(actual).toBe(1);
    });

    it("Определить длину сдвигаемого блока со значением ' 11 ' с позиции 0", () => {
        maskSynthetizer.generate(nonReqMask);
        maskSynthetizer.putSymbols("11", 1);

        const actual = maskSynthetizer["getShiftableBlockLength"](1);

        expect(actual).toBe(2);
    });

    it("Определить длину сдвигаемого блока со значением '1 1 ' с позиции 0", () => {
        maskSynthetizer.generate(nonReqMask);
        maskSynthetizer.putSymbols("1", 0);
        maskSynthetizer.putSymbols("1", 2);

        const actual = maskSynthetizer["getShiftableBlockLength"](0);

        expect(actual).toBe(3);
    });

    it("Определить длину сдвигаемого блока со значением '1 .  ' с позиции 0", () => {
        maskSynthetizer.generate(nonReqMaskWithLiterl);
        maskSynthetizer.putSymbols("1", 0);

        const actual = maskSynthetizer["getShiftableBlockLength"](0);

        expect(actual).toBe(1);
    });

    it("Определить длину сдвигаемого блока со значением '1 .1 ' с позиции 0", () => {
        maskSynthetizer.generate(nonReqMaskWithLiterl);
        maskSynthetizer.putSymbols("1", 0);
        maskSynthetizer.putSymbols("1", 3);

        const actual = maskSynthetizer["getShiftableBlockLength"](0);

        expect(actual).toBe(4);
    });
});
