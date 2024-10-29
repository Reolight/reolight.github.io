import MaskCharSynthetizer from "../MaskedEngine/maskSynthetizer";
import { MaskFormat } from "../MaskedEngine/types";

export const maskSynthetizer = new MaskCharSynthetizer({
    beepOnError: false,
    cutCopyMaskFormat: MaskFormat.ExcludePromptAndLiterals,
    hidePromptOnLeave: false,
    promptSymbol: "_",
    rejectInputOnFirstFailure: false,
    resetOnPrompt: false,
    resetOnSpace: false,
    skipLiterals: false,
    textMaskFormat: MaskFormat.ExcludePromptAndLiterals,
});

export const nonReqMaskWithLiterl = "99.99";
export const nonReqMask = "9999";