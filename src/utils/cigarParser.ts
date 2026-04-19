export interface CigarBlock {
  type: string; // 'M', 'I', 'S', 'D', 'N', etc.
  length: number;
  readStart: number; // Start coordinate on the read
  readEnd: number;   // End coordinate on the read
  color?: string;
}

export function parseCigarToBlocks(cigar: string): CigarBlock[] {
  const blocks: CigarBlock[] = [];
  const regex = /(\d+)([MISDN=XHP])/g;
  let match;
  let currentReadPos = 0;

  const typeConfig: Record<string, { consumesRead: boolean, color: string }> = {
    'M': { consumesRead: true, color: '#3182bd' }, // Blue
    'I': { consumesRead: true, color: '#e6550d' }, // Dark Orange
    'S': { consumesRead: true, color: '#9c9c9c' }, // Gray
    '=': { consumesRead: true, color: '#31a354' }, // Green
    'X': { consumesRead: true, color: '#d95f0e' }, // Orange
    'D': { consumesRead: false, color: '#de2d26' }, // Red
    'N': { consumesRead: false, color: '#756bb1' }, // Purple
    'H': { consumesRead: false, color: '#636363' }, // Dark Gray
    'P': { consumesRead: false, color: '#bcbddc' },
  };

  while ((match = regex.exec(cigar)) !== null) {
    const length = parseInt(match[1], 10);
    const type = match[2];
    
    const config = typeConfig[type] || { consumesRead: false, color: '#000' };

    const block: CigarBlock = {
      type,
      length,
      readStart: currentReadPos,
      readEnd: config.consumesRead ? currentReadPos + length : currentReadPos,
      color: config.color
    };

    blocks.push(block);

    if (config.consumesRead) {
      currentReadPos += length;
    }
  }

  return blocks;
}
