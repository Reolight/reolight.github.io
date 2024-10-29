import { expect, test } from "vitest";
import { maskSynthetizer, nonReqMask, nonReqMaskWithLiterl as nonReqMaskWithLiteral } from "./common";

test("Передвигает движимое на 1 позицию", () => {
    maskSynthetizer.generate(nonReqMask);
    maskSynthetizer.putSymbols("1", 0);
    maskSynthetizer['shiftOccupiedRight'](0, 1);

    const actual = maskSynthetizer.toString((s) => s.textMaskFormat);

    expect(actual).toBe(" 1  ");
})

test("Передвигает движимое на 2 позиции", () => {
    maskSynthetizer.generate(nonReqMask);
    maskSynthetizer.putSymbols("1", 0);
    maskSynthetizer['shiftOccupiedRight'](0, 2);

    const actual = maskSynthetizer.toString((s) => s.textMaskFormat);

    expect(actual).toBe("  1 ");
})

test("Передвигает движимое на 1 позицию через литерал", () => {
    maskSynthetizer.generate(nonReqMaskWithLiteral);
    maskSynthetizer.putSymbols("1", 1);
    maskSynthetizer['shiftOccupiedRight'](0, 1);

    const actual = maskSynthetizer.toString((s) => s.textMaskFormat);

    expect(actual).toBe("   1 ");
})