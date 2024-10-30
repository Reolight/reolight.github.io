import { test, expect } from "vitest";
import { maskSynthetizer, maskWithLetterInside } from "./common";

test("Корректно обрезает неподходящие символы ('123' > '12')", () => {
    maskSynthetizer.generate(maskWithLetterInside);
    const output = maskSynthetizer["getPuttable"]("123", 0);

    expect(output.join("")).toBe("12");
});
