
export const sleep = async (milliseconds: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

export const waitFor = async (test: () => boolean, timeout = 5000): Promise<number> => {
    const step = 50;
    for(let total = 0 ; total <= timeout ; total += step) {
        if(test()) {
            return total;
        } else {
            await sleep(step);
        }
    }
    throw "Timeout reached for waitFor function";
}