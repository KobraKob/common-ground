'use client';

import { useMemo, useState } from 'react';
import { ExternalLink, MapPin } from 'lucide-react';
import { BENGALURU_COLLEGES } from '@/constants/colleges';
import type { College } from '@/types';

const BOUNDS = { west: 77.43, east: 77.77, south: 12.82, north: 13.06 };
const OSM_EMBED = 'https://www.openstreetmap.org/export/embed.html?bbox=77.43%2C12.82%2C77.77%2C13.06&layer=mapnik';

const CAMPUS_DETAILS: Record<string, { label: string; source: string; sourceLabel: string }> = {
  rvce: { label: 'Mysuru Road · RV Vidyaniketan', source: 'https://dev.rvu.edu.in/wp-content/uploads/2026/01/UGC-Public-Self-Disclosure.pdf', sourceLabel: 'Institutional disclosure' },
  pesu: { label: 'Ring Road Campus · Banashankari', source: 'https://pes.edu/naac/upload/UGC-PSD/9.1/PES_UGC_PSD_9.1.pdf', sourceLabel: 'PES University disclosure' },
  bmsce: { label: 'Basavanagudi', source: 'https://bmsce.ac.in/reports/CH/Activity_Report_CH_June_2022-May_2023.pdf', sourceLabel: 'BMSCE activity report' },
  christ: { label: 'Central Campus · Hosur Road', source: 'https://christuniversity.in/uploads/activities/Latex%20Training%20workshop_20230318104944.pdf', sourceLabel: 'Christ University record' },
  msrit: { label: 'Mathikere · MSR Nagar', source: 'https://www.wikidata.org/wiki/Q6713103', sourceLabel: 'Public coordinate record' },
  iiitb: { label: 'Electronic City · Phase 1', source: 'https://sclab.iiitb.ac.in/home-3/', sourceLabel: 'IIIT-B location' },
};

function mercator(latitude: number) {
  const radians = latitude * Math.PI / 180;
  return Math.log(Math.tan(Math.PI / 4 + radians / 2));
}

function markerPosition(latitude: number, longitude: number) {
  const x = ((longitude - BOUNDS.west) / (BOUNDS.east - BOUNDS.west)) * 100;
  const y = ((mercator(BOUNDS.north) - mercator(latitude)) / (mercator(BOUNDS.north) - mercator(BOUNDS.south))) * 100;
  return { left: `${x}%`, top: `${y}%` };
}

export function CampusNetworkMap({ colleges }: { colleges: College[] }) {
  const campuses = useMemo(() => {
    const source = colleges.length ? colleges : BENGALURU_COLLEGES;
    return source.flatMap((college) => {
      const fallback = BENGALURU_COLLEGES.find((item) => item.slug === college.slug);
      const latitude = college.latitude ?? fallback?.latitude;
      const longitude = college.longitude ?? fallback?.longitude;
      if (latitude == null || longitude == null) return [];
      return [{ ...college, latitude, longitude, detail: CAMPUS_DETAILS[college.slug] }];
    });
  }, [colleges]);
  const [selectedSlug, setSelectedSlug] = useState('rvce');
  const selected = campuses.find((campus) => campus.slug === selectedSlug) ?? campuses[0];

  if (!campuses.length) {
    return <section className="cg-surface p-6"><h2 className="font-semibold">Campus map is being prepared</h2><p className="mt-2 text-sm cg-muted">Campus locations will appear once verified coordinates are available.</p></section>;
  }

  return <section className="cg-surface overflow-hidden">
    <div className="flex flex-wrap items-start justify-between gap-3 p-5 sm:p-6">
      <div><p className="cg-eyebrow">BENGALURU CAMPUS NETWORK</p><h2 className="mt-2 text-xl font-semibold">Find a campus</h2><p className="mt-1 text-sm cg-muted">Select a pin to see its location and open directions.</p></div>
      <span className="rounded-full bg-[var(--cg-elevated)] px-3 py-1.5 text-xs cg-muted">{campuses.length} mapped campuses</span>
    </div>
    <div className="relative aspect-[4/3] w-full overflow-hidden border-y border-[var(--cg-border)] bg-[var(--cg-elevated)]">
      <iframe title="OpenStreetMap of Bengaluru campuses" src={OSM_EMBED} loading="lazy" className="pointer-events-none absolute inset-0 h-full w-full border-0" />
      <div className="pointer-events-none absolute inset-0">
        {campuses.map((campus) => {
          const position = markerPosition(campus.latitude, campus.longitude);
          const active = campus.slug === selected?.slug;
          return <button key={campus.slug} type="button" onClick={() => setSelectedSlug(campus.slug)} aria-label={`Select ${campus.name}`} aria-pressed={active} title={campus.short_name}
            className={`pointer-events-auto absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full border px-2 py-1.5 text-xs font-semibold shadow-lg transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cg-accent)] ${active ? 'border-[var(--cg-accent)] bg-[var(--cg-accent)] text-white' : 'border-white bg-[var(--cg-surface)] text-[var(--cg-text)]'}`}
            style={position}>
            <MapPin size={14}/><span>{campus.short_name}</span>
          </button>;
        })}
      </div>
    </div>
    {selected && <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
      <div className="min-w-0"><h3 className="font-semibold">{selected.name}</h3><p className="mt-1 text-sm cg-muted">{selected.detail?.label || selected.city}</p><p className="mt-1 text-xs cg-muted">Approximate campus-centre pin · {selected.latitude.toFixed(4)}, {selected.longitude.toFixed(4)}</p>
        {selected.detail?.source && <a href={selected.detail.source} target="_blank" rel="noreferrer" className="cg-link mt-2 inline-flex min-h-9 items-center text-xs">{selected.detail.sourceLabel}<ExternalLink size={12} className="ml-1.5"/></a>}
      </div>
      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selected.name + ', ' + selected.city + ', Bengaluru, India')}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-[var(--cg-elevated)] px-4 text-sm font-medium hover:bg-[var(--cg-accent)] hover:text-white">Open directions <ExternalLink size={15}/></a>
    </div>}
    <p className="border-t border-[var(--cg-border)] px-5 py-3 text-xs cg-muted">Map data © OpenStreetMap contributors. Pins show approximate campus locations, not official entrances. Verify directions with the institution before travelling.</p>
  </section>;
}
