import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { parseCigarToBlocks } from '../../utils/cigarParser';

export interface CigarPlotProps {
    sequence: string;
    cigars: string[];
    width?: number;
}

const CigarPlot: React.FC<CigarPlotProps> = ({ sequence, cigars, width = 1000 }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [currentWidth, setCurrentWidth] = useState(width);

    useEffect(() => {
        if (containerRef.current) {
            setCurrentWidth(containerRef.current.clientWidth);
        }
    }, [width]);

    const margin = { top: 40, right: 20, bottom: 30, left: 100 };
    const trackHeight = 30;
    const trackPadding = 15;
    
    // Top track for sequence, then each cigar has a track
    const totalHeight = margin.top + margin.bottom + (cigars.length + 1) * (trackHeight + trackPadding);

    useEffect(() => {
        if (!svgRef.current) return;
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const innerWidth = currentWidth - margin.left - margin.right;
        const innerHeight = totalHeight - margin.top - margin.bottom;

        const maxReadLength = Math.max(
            sequence.length,
            ...cigars.map(c => {
                const blocks = parseCigarToBlocks(c);
                return blocks.length > 0 ? blocks[blocks.length - 1].readEnd : 0;
            })
        );

        const xScale = d3.scaleLinear()
            .domain([0, maxReadLength])
            .range([0, innerWidth]);

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Draw sequence track
        const seqGroup = g.append('g').attr('class', 'sequence-track');
        seqGroup.append('text')
            .attr('x', -10)
            .attr('y', trackHeight / 2)
            .attr('dy', '0.32em')
            .attr('text-anchor', 'end')
            .style('font-weight', 'bold')
            .text('Sequence');

        // Render bases if the width per base is large enough
        const charWidth = innerWidth / maxReadLength;
        
        if (charWidth >= 6 && sequence.length > 0) {
            sequence.split('').forEach((base, i) => {
                seqGroup.append('rect')
                    .attr('x', xScale(i))
                    .attr('y', 0)
                    .attr('width', charWidth * 0.9)
                    .attr('height', trackHeight)
                    .attr('fill', '#f0f0f0')
                    .attr('rx', 2);
                    
                seqGroup.append('text')
                    .attr('x', xScale(i) + (charWidth * 0.9) / 2)
                    .attr('y', trackHeight / 2)
                    .attr('dy', '0.35em')
                    .attr('text-anchor', 'middle')
                    .attr('font-size', Math.min(12, charWidth * 0.8) + 'px')
                    .attr('font-family', 'monospace')
                    .text(base);
            });
        } else {
            // Draw one block for the whole sequence if zoomed out
            seqGroup.append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', xScale(sequence.length))
                .attr('height', trackHeight)
                .attr('fill', '#d9d9d9');
        }

        // Draw cigar tracks
        cigars.forEach((cigar, index) => {
            const trackY = (index + 1) * (trackHeight + trackPadding);
            const cigarGroup = g.append('g')
                .attr('class', `cigar-track-${index}`)
                .attr('transform', `translate(0,${trackY})`);

            cigarGroup.append('text')
                .attr('x', -10)
                .attr('y', trackHeight / 2)
                .attr('dy', '0.32em')
                .attr('text-anchor', 'end')
                .attr('font-size', '12px')
                .text(`CIGAR ${index + 1}`);

            const blocks = parseCigarToBlocks(cigar);

            // Draw connecting central line for the read track
            const readEnd = blocks.length > 0 ? blocks[blocks.length - 1].readEnd : 0;
            cigarGroup.append('line')
                .attr('x1', 0)
                .attr('y1', trackHeight / 2)
                .attr('x2', xScale(readEnd))
                .attr('y2', trackHeight / 2)
                .attr('stroke', '#ccc')
                .attr('stroke-width', 2);

            blocks.forEach(block => {
                if (block.type === 'M' || block.type === '=' || block.type === 'X') {
                    cigarGroup.append('rect')
                        .attr('x', xScale(block.readStart))
                        .attr('y', 0)
                        .attr('width', xScale(block.readEnd) - xScale(block.readStart))
                        .attr('height', trackHeight)
                        .attr('fill', block.color || '#3182bd')
                        .attr('opacity', 0.8)
                        .append('title')
                        .text(`${block.length}${block.type}`);
                } else if (block.type === 'I' || block.type === 'S') {
                    // Inserts and Soft clips consume read, display them thinner
                    cigarGroup.append('rect')
                        .attr('x', xScale(block.readStart))
                        .attr('y', trackHeight * 0.25)
                        .attr('width', xScale(block.readEnd) - xScale(block.readStart))
                        .attr('height', trackHeight * 0.5)
                        .attr('fill', block.color || '#e6550d')
                        .append('title')
                        .text(`${block.length}${block.type}`);
                } else if (block.type === 'D' || block.type === 'N') {
                    // Deletions / Skipped regions do NOT consume read, just mark the position
                    cigarGroup.append('rect')
                        .attr('x', xScale(block.readStart) - 1)
                        .attr('y', -trackHeight * 0.2)
                        .attr('width', 2)
                        .attr('height', trackHeight * 1.4)
                        .attr('fill', block.color || '#de2d26')
                        .append('title')
                        .text(`${block.length}${block.type}`);
                } else if (block.type === 'H') {
                    // Hard clips do NOT consume read. Draw a distinct marker (e.g. dark dashed line)
                    cigarGroup.append('line')
                        .attr('x1', xScale(block.readStart))
                        .attr('y1', 0)
                        .attr('x2', xScale(block.readStart))
                        .attr('y2', trackHeight)
                        .attr('stroke', block.color || '#636363')
                        .attr('stroke-width', 2)
                        .attr('stroke-dasharray', '2,2')
                        .append('title')
                        .text(`${block.length}${block.type}`);
                }
            });
        });

        // X-axis
        const xAxis = d3.axisBottom(xScale).ticks(10);
        g.append('g')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(xAxis);

    }, [sequence, cigars, currentWidth, totalHeight]);

    return (
        <div ref={containerRef} style={{ width: '100%', overflowX: 'hidden' }}>
            <svg
                ref={svgRef}
                width={currentWidth}
                height={totalHeight}
                style={{ background: '#fafafa', borderRadius: '4px', border: '1px solid #eee' }}
            />
        </div>
    );
};

export default CigarPlot;
