import { maskSynthetizer, nonReqMask, nonReqMaskWithLiterl as nonReqMaskWithLiteral } from "./common";

describe("Moving parts of mask tests", () => {
    it("Передвигает движимое на 1 позицию", () => {
        maskSynthetizer.generate(nonReqMask);
        maskSynthetizer.putSymbols("1", 0);
        maskSynthetizer["shiftOccupiedRight"](0, 1);

        const actual = maskSynthetizer.toString((s) => s.textMaskFormat);

        expect(actual).toBe(" 1  ");
    });

    it("Передвигает движимое на 2 позиции", () => {
        maskSynthetizer.generate(nonReqMask);
        maskSynthetizer.putSymbols("1", 0);
        maskSynthetizer["shiftOccupiedRight"](0, 2);

        const actual = maskSynthetizer.toString((s) => s.textMaskFormat);

        expect(actual).toBe("  1 ");
    });

    it("Передвигает движимое на 1 позицию через литерал", () => {
        maskSynthetizer.generate(nonReqMaskWithLiteral);
        maskSynthetizer.putSymbols("1", 1);
        maskSynthetizer["shiftOccupiedRight"](0, 1);

        const actual = maskSynthetizer.toString((s) => s.textMaskFormat);

        expect(actual).toBe("   1 ");
    });

    it("Передвигает 2 движимых числа на 1 позицию", () => {
        maskSynthetizer.generate(nonReqMask);
        maskSynthetizer.putSymbols("11", 0);
        maskSynthetizer["shiftOccupiedRight"](0, 1);

        const actual = maskSynthetizer.toString((s) => s.textMaskFormat);

        expect(actual).toBe(" 11 ");
    });

    it("Передвигает 2 движимых символа за литерал на 2 позиции (литерал не считается позицией)", () => {
        maskSynthetizer.generate(nonReqMaskWithLiteral);
        maskSynthetizer.putSymbols("11", 0);
        maskSynthetizer["shiftOccupiedRight"](0, 2);

        const actual = maskSynthetizer.toString((s) => s.textMaskFormat);

        expect(actual).toBe("   11");
    });

    it("Передвигает 2 движимых символа на литерал: один символ перед, другой за", () => {
        maskSynthetizer.generate(nonReqMaskWithLiteral);
        maskSynthetizer.putSymbols("11", 0);
        maskSynthetizer["shiftOccupiedRight"](0, 1);

        const actual = maskSynthetizer.toString((s) => s.textMaskFormat);

        expect(actual).toBe(" 1 1 ");
    });
});

// it("Передвигает 1 движимый символ на 2 позиции, но НЕ упирается в букву", () => {
//     maskSynthetizer.generate(maskWithLetterInside);
//     maskSynthetizer.putSymbols("1", 0);
//     maskSynthetizer['shiftOccupiedRight'](0, 2);

//     const actual = maskSynthetizer.toString((s) => s.textMaskFormat);

//     expect(actual).toBe(" 1   ");
// })

// it("Передвигает 1 движимый символ на 3 позиции, но упирается в букву", () => {
//     maskSynthetizer.generate(maskWithLetterInside);
//     maskSynthetizer.putSymbols("1", 0);
//     maskSynthetizer['shiftOccupiedRight'](0, 3);

//     const actual = maskSynthetizer.toString((s) => s.textMaskFormat);

//     expect(actual).toBe(" 1   ");
// })
