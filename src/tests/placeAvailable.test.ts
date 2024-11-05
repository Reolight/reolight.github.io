import { maskSynthetizer, nonReqMask, nonReqMaskWithLiterl as nonReqMaskWithLiteral } from "./common";

describe("Tests for counting available places", () => {
    it("Правильно определяет количество доступных мест", () => {
        maskSynthetizer.generate(nonReqMask);
        const actual = maskSynthetizer["countAvailablePlaceFor"](0);

        expect(actual).toBe(4);
    });

    it("Правильно определяет количество доступных мест (литерал в центре)", () => {
        maskSynthetizer.generate(nonReqMaskWithLiteral);
        const actual = maskSynthetizer["countAvailablePlaceFor"](0);

        expect(actual).toBe(4);
    });
});
