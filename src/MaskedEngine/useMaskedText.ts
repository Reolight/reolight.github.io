import React, { useEffect, useMemo } from "react";
import { MaskedInputSettings } from "./types";
import MaskProcessor from "./newProcessor";

const useMaskedText = (
    mask: string,
    settings: MaskedInputSettings,
    ref: React.MutableRefObject<HTMLInputElement>,
    updateCallback: (newValue: string) => void,
    initialValue?: string
): void => {
    const processor = useMemo(() => {
        if (!ref.current) {
            return undefined;
        }

        const proc = new MaskProcessor(mask, settings, ref, updateCallback);

        if (initialValue) {
            proc.applyValue(initialValue);
        }

        return proc;
    }, [initialValue, mask, ref, settings, updateCallback]);

    useEffect(() => {
        if (processor) {
            console.debug("attached");
            processor.attachListeners();
        }

        return () => {
            if (processor) {
                console.debug("deattached");
                processor?.deattachListeners();
            }
        };
    }, [processor]);

    useEffect(() => console.log("proc updated"), [processor]);
    useEffect(() => console.log("ref updated"), [ref]);
};

export default useMaskedText;
