import React, { useCallback, useEffect, useMemo, useState } from "react";
import { MaskedInputSettings } from "./types";
import MaskProcessor from "./processor";

const useMaskedText = (
    mask: string,
    settings: MaskedInputSettings,
    ref: React.MutableRefObject<HTMLInputElement>,
    initialValue: string = ""
): [string, string] => {
    const [value, setValue] = useState<string>(initialValue);

    const processor = useMemo(
        () => new MaskProcessor(mask, settings, ref),
        [mask, ref, settings]
    );

    const validator = useCallback(
        (e: Event): void => {
            try {
                processor.checkValidity(e);
                setValue(ref.current.value);
            } finally {
                /* empty */
            }
        },
        [processor, ref]
    );

    useEffect(() => {
        const cachedRef = ref.current;
        cachedRef.addEventListener("input", validator);

        return () => {
            cachedRef.removeEventListener("input", validator);
        };
    }, [processor, ref, validator]);

    console.log(processor);

    const visibleMask = useMemo(
        () => processor.visibleMask,
        [processor.visibleMask]
    );

    return [visibleMask, value];
};

export default useMaskedText;
