import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { parseCigarToBlocks, CigarBlock } from '../../utils/cigarParser';
import { Button } from 'react-bootstrap';

export interface CigarPlotProps {
    sequence: string;
    cigars: string[];
    width?: number;
}

const CigarPlot: React.FC<CigarPlotProps> = ({ sequence, cigars, width = 1000 }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [currentWidth, setCurrentWidth] = useState(width);
    const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

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

        if (maxReadLength === 0) return;

        const xScale = d3.scaleLinear()
            .domain([0, maxReadLength])
            .range([0, innerWidth]);

        // Clip path to prevent rendering outside the box
        svg.append('defs').append('clipPath')
            .attr('id', 'clip-window')
            .append('rect')
            .attr('width', innerWidth)
            .attr('height', innerHeight + trackHeight);

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const xAxisGroup = g.append('g')
            .attr('transform', `translate(0,${innerHeight})`)
            .attr('class', 'x-axis');

        // Render fixed labels
        const labelsGroup = svg.append('g')
            .attr('transform', `translate(${margin.left - 10},${margin.top})`);

        labelsGroup.append('text')
            .attr('y', trackHeight / 2)
            .attr('dy', '0.32em')
            .attr('text-anchor', 'end')
            .style('font-weight', 'bold')
            .text('Sequence');

        cigars.forEach((cigar, index) => {
            labelsGroup.append('text')
            .attr('y', (index + 1) * (trackHeight + trackPadding) + trackHeight / 2)
            .attr('dy', '0.32em')
            .attr('text-anchor', 'end')
            .attr('font-size', '12px')
            .text(`CIGAR ${index + 1}`);
        });

        // Data arrays
        const sequenceData = sequence.split('').map((base, i) => ({ base, i }));
        const allCigarBlocks = cigars.map((cigar, index) => {
            return { index, blocks: parseCigarToBlocks(cigar) };
        });

        // The zoomed group (clipped)
        const zoomGroup = g.append('g').attr('clip-path', 'url(#clip-window)');

        // Background / fallback if zoomed out too far for sequence
        const seqFallback = zoomGroup.append('rect')
            .attr('class', 'seq-fallback')
            .attr('y', 0)
            .attr('height', trackHeight)
            .attr('fill', '#d9d9d9');

        const seqTrack = zoomGroup.append('g').attr('class', 'sequence-track');
        const seqRects = seqTrack.selectAll('rect.seq-base')
            .data(sequenceData)
            .enter().append('rect')
            .attr('class', 'seq-base')
            .attr('y', 0)
            .attr('height', trackHeight)
            .attr('fill', '#f0f0f0')
            .attr('rx', 2);
            
        const seqTexts = seqTrack.selectAll('text.seq-base-txt')
            .data(sequenceData)
            .enter().append('text')
            .attr('class', 'seq-base-txt')
            .attr('y', trackHeight / 2)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'middle')
            .attr('font-family', 'monospace')
            .text(d => d.base);

        // Cigar tracks inside zoomGroup
        const cigarTracks = zoomGroup.selectAll('g.cigar-track')
            .data(allCigarBlocks)
            .enter().append('g')
            .attr('class', 'cigar-track')
            .attr('transform', d => `translate(0,${(d.index + 1) * (trackHeight + trackPadding)})`);

        // Central lines for reads
        const cigarLines = cigarTracks.append('line')
            .attr('class', 'cigar-center-line')
            .attr('y1', trackHeight / 2)
            .attr('y2', trackHeight / 2)
            .attr('stroke', '#ccc')
            .attr('stroke-width', 2);

        const cigarBlocksGroup = cigarTracks.selectAll('g.cigar-block-item')
            .data(d => d.blocks)
            .enter().append('g')
            .attr('class', 'cigar-block-item');

        // Draw different rects/lines based on block type
        cigarBlocksGroup.each(function(d) {
            const el = d3.select(this);
            if (d.type === 'M' || d.type === '=' || d.type === 'X') {
                el.append('rect')
                    .attr('class', 'main-block')
                    .attr('y', 0)
                    .attr('height', trackHeight)
                    .attr('fill', d.color || '#3182bd')
                    .attr('opacity', 0.8)
                    .append('title').text(`${d.length}${d.type}`);
            } else if (d.type === 'I' || d.type === 'S') {
                el.append('rect')
                    .attr('class', 'main-block')
                    .attr('y', trackHeight * 0.25)
                    .attr('height', trackHeight * 0.5)
                    .attr('fill', d.color || '#e6550d')
                    .append('title').text(`${d.length}${d.type}`);
            } else if (d.type === 'D' || d.type === 'N') {
                el.append('rect')
                    .attr('class', 'marker-block')
                    .attr('y', -trackHeight * 0.2)
                    .attr('width', 2)
                    .attr('height', trackHeight * 1.4)
                    .attr('fill', d.color || '#de2d26')
                    .append('title').text(`${d.length}${d.type}`);
            } else if (d.type === 'H') {
                el.append('line')
                    .attr('class', 'marker-line')
                    .attr('y1', 0)
                    .attr('y2', trackHeight)
                    .attr('stroke', d.color || '#636363')
                    .attr('stroke-width', 2)
                    .attr('stroke-dasharray', '2,2')
                    .append('title').text(`${d.length}${d.type}`);
            }
        });

        const mainBlocks = zoomGroup.selectAll('rect.main-block');
        const markerBlocks = zoomGroup.selectAll('rect.marker-block');
        const markerLines = zoomGroup.selectAll('line.marker-line');

        // Apply zoom updates
        const updateViews = (transform: d3.ZoomTransform) => {
            const newXScale = transform.rescaleX(xScale);
            // Hide out-of-bounds to speed up rendering? Not strictly necessary with clipPath unless millions.
            
            // X-axis update
            xAxisGroup.call(d3.axisBottom(newXScale).ticks(10));

            // Sequence block scaling
            const charWidth = (innerWidth * transform.k) / maxReadLength;
            if (charWidth >= 6 && sequence.length > 0) {
                seqFallback.style('display', 'none');
                seqRects.style('display', null)
                    .attr('x', (d: any) => newXScale(d.i))
                    .attr('width', charWidth * 0.9);
                seqTexts.style('display', null)
                    .attr('x', (d: any) => newXScale(d.i) + (charWidth * 0.9) / 2)
                    .attr('font-size', Math.min(12, charWidth * 0.8) + 'px');
            } else {
                seqFallback.style('display', null)
                    .attr('x', newXScale(0))
                    .attr('width', newXScale(maxReadLength) - newXScale(0));
                seqRects.style('display', 'none');
                seqTexts.style('display', 'none');
            }

            // Central read line
            cigarLines
                .attr('x1', newXScale(0))
                .attr('x2', function() {
                    const ctx = d3.select(this.parentNode).datum() as any;
                    const rEnd = ctx.blocks.length > 0 ? ctx.blocks[ctx.blocks.length - 1].readEnd : 0;
                    return newXScale(rEnd);
                });

            // Cigar specific nodes
            mainBlocks
                .attr('x', (d: any) => newXScale(d.readStart))
                .attr('width', (d: any) => newXScale(d.readEnd) - newXScale(d.readStart));

            markerBlocks
                .attr('x', (d: any) => newXScale(d.readStart) - 1);

            markerLines
                .attr('x1', (d: any) => newXScale(d.readStart))
                .attr('x2', (d: any) => newXScale(d.readStart));
        };

        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([1, 100])
            .translateExtent([[0, 0], [innerWidth, innerHeight]])
            // constrain panning to the domain
            .extent([[0, 0], [innerWidth, innerHeight]])
            .on('zoom', (event) => {
                updateViews(event.transform);
            });

        zoomBehaviorRef.current = zoom;
        svg.call(zoom);

        // Init view
        updateViews(d3.zoomIdentity);

    }, [sequence, cigars, currentWidth, totalHeight]);

    const handleZoomIn = () => {
        if (svgRef.current && zoomBehaviorRef.current) {
            d3.select(svgRef.current).transition().duration(250).call(zoomBehaviorRef.current.scaleBy, 1.5);
        }
    };
    const handleZoomOut = () => {
        if (svgRef.current && zoomBehaviorRef.current) {
            d3.select(svgRef.current).transition().duration(250).call(zoomBehaviorRef.current.scaleBy, 0.75);
        }
    };
    const handleResetZoom = () => {
        if (svgRef.current && zoomBehaviorRef.current) {
            d3.select(svgRef.current).transition().duration(250).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
        }
    };

    return (
        <div ref={containerRef} style={{ width: '100%', position: 'relative', overflowX: 'hidden' }}>
            <div style={{ position: 'absolute', top: 5, right: 10, display: 'flex', gap: '5px', zIndex: 10 }}>
                <Button size="sm" variant="outline-secondary" onClick={handleZoomIn} title="Zoom In">
                    <i className="bi bi-zoom-in"></i>
                </Button>
                <Button size="sm" variant="outline-secondary" onClick={handleZoomOut} title="Zoom Out">
                    <i className="bi bi-zoom-out"></i>
                </Button>
                <Button size="sm" variant="outline-secondary" onClick={handleResetZoom} title="Reset Zoom">
                    <i className="bi bi-arrows-angle-expand"></i>
                </Button>
            </div>
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
