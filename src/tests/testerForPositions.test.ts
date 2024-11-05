import { maskSynthetizer, maskWithLetterInside } from "./common";

describe("Test for getting suitable fragment for mask", () => {
    it("Корректно обрезает неподходящие символы ('123' > '12')", () => {
        maskSynthetizer.generate(maskWithLetterInside);
        const output = maskSynthetizer["getPuttable"]("123", 0);

        expect(output.join("")).toBe("12");
    });
});
