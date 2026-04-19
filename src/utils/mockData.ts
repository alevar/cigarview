const generateSequence = (length: number) => {
    const bases = ['A', 'C', 'G', 'T'];
    let seq = '';
    // deterministic pseudo-random for consistent display
    for (let i = 0; i < length; i++) {
        // slightly skewed pseudo-random to make it look like real sequence
        const seed = (Math.sin(i * 12.9898) * 43758.5453) - Math.floor(Math.sin(i * 12.9898) * 43758.5453);
        seq += bases[Math.floor(seed * 4)];
    }
    return seq;
};

// Generates a 1000bp synthetic sequence
export const defaultSequence = generateSequence(1000);

// Default PacBio-like CIGARs that sum to exactly 1000 read bases
export const defaultCigars = [
    // Mostly matches, with scattered indels and mismatches, 1000 read bases consumed:
    // 150(M)+2(I)+50(M)+100(M)+3(X)+95(M)+20(S)+580(M) = 1000
    { value: "150M2I50M1D100M3X95M20S580M", flag: "" },
    
    // Exact matches vs mismatches, starting with Hard/Soft clips:
    // 50(S)+250(=)+5(X)+100(=)+10(D)+95(M)+10(I)+490(M) = 1000.  (H and D consume 0 read bases)
    { value: "10H50S250=5X100=10D95M10I490M5H", flag: "16" },
    
    // Perfect Match 1000
    { value: "1000M", flag: "0" }
];
