import { maskSynthetizerIncludeEither } from "./common";

describe("differentiator tests", () => {
    it("Находит разницу с простой маской", () => {
        maskSynthetizerIncludeEither.generate("9999");
        maskSynthetizerIncludeEither.putSymbols("1984", 0);
        const actual = maskSynthetizerIncludeEither["findDifference"]("184");

        expect(actual).toBe(1);
    });

    it("Находит разницу с маской с литералом", () => {
        maskSynthetizerIncludeEither.generate("99.99");
        maskSynthetizerIncludeEither.putSymbols("1984", 0); // 19.84 >> 19__4 >> 194
        const actual = maskSynthetizerIncludeEither["findDifference"]("194");

        expect(actual).toBe(2);
    });
});
