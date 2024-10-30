import React, { useEffect, useMemo } from "react";
import { MaskedInputSettings } from "./types";
import MaskProcessor from "./newProcessor";

const useMaskedText = (
    mask: string,
    settings: MaskedInputSettings,
    ref: React.MutableRefObject<HTMLInputElement>,
    updateCallback: (newValue: string) => void,
    initialValue?: string
): [string] => {
    const processor = useMemo(() => {
        const proc = new MaskProcessor(mask, settings, ref, updateCallback);
        if (initialValue) {
            proc.applyValue(initialValue);
        }

        return proc;
    }, [initialValue, mask, ref, settings, updateCallback]);

    useEffect(() => {
        if (ref.current) {
            console.log("attached");
            processor.attachListeners();
        }
    }, [processor, ref]);

    useEffect(() => console.log("proc updated"), [processor]);
    useEffect(() => console.log("ref updated"), [ref]);

    return [processor.value];
};

export default useMaskedText;
