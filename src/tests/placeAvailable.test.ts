import { expect, test } from "vitest";
import { maskSynthetizer, nonReqMask, nonReqMaskWithLiterl as nonReqMaskWithLiteral } from "./common";

test("Правильно определяет количество доступных мест", () => {
    maskSynthetizer.generate(nonReqMask);
    const actual = maskSynthetizer['countAvailablePlaceFor'](0);

    expect(actual).toBe(4);
})

test("Правильно определяет количество доступных мест (литерал в центре)", () => {
    maskSynthetizer.generate(nonReqMaskWithLiteral);
    const actual = maskSynthetizer['countAvailablePlaceFor'](0);

    expect(actual).toBe(4);
});
