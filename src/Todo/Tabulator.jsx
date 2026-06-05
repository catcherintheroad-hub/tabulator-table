import React, { useEffect, useMemo, useRef, useState } from 'react';
import proDashboardCards from './proDashboardCards';

const TABULATOR_CSS_ID = 'cards-tabulator-css';
const TABULATOR_SCRIPT_ID = 'cards-tabulator-script';
const TABULATOR_CSS_URL = 'https://unpkg.com/tabulator-tables/dist/css/tabulator_midnight.min.css';
const TABULATOR_SCRIPT_URL = 'https://unpkg.com/tabulator-tables/dist/js/tabulator.min.js';

function useTabulatorCdn() {
  const [isReady, setIsReady] = useState(() => Boolean(window.Tabulator));

  useEffect(() => {
    if (window.Tabulator) {
      setIsReady(true);
      return undefined;
    }

    if (!document.getElementById(TABULATOR_CSS_ID)) {
      const link = document.createElement('link');
      link.id = TABULATOR_CSS_ID;
      link.rel = 'stylesheet';
      link.href = TABULATOR_CSS_URL;
      document.head.appendChild(link);
    }

    let script = document.getElementById(TABULATOR_SCRIPT_ID);
    const handleLoad = () => setIsReady(Boolean(window.Tabulator));

    if (!script) {
      script = document.createElement('script');
      script.id = TABULATOR_SCRIPT_ID;
      script.src = TABULATOR_SCRIPT_URL;
      script.async = true;
      script.addEventListener('load', handleLoad);
      document.body.appendChild(script);
    } else {
      script.addEventListener('load', handleLoad);
    }

    return () => {
      script.removeEventListener('load', handleLoad);
    };
  }, []);

  return isReady;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }[character]));
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function normalizeCard(card) {
  const grade = card.grade === null || card.grade === undefined ? null : Number(card.grade);
  const gradeLabel = grade ? `${card.grader || 'PSA'} ${grade}` : 'Raw';

  return {
    ...card,
    grade,
    gradeLabel,
    status: card.status || (grade ? 'Hold' : 'Raw'),
  };
}

export default function Tabulator() {
  const [globalSearch, setGlobalSearch] = useState('');
  const tableElementRef = useRef(null);
  const tableInstanceRef = useRef(null);
  const isTabulatorReady = useTabulatorCdn();
  const tableData = useMemo(() => proDashboardCards.map(normalizeCard), []);

  useEffect(() => {
    if (!isTabulatorReady || !tableElementRef.current) {
      return undefined;
    }

    tableInstanceRef.current = new window.Tabulator(tableElementRef.current, {
      data: tableData,
      layout: 'fitColumns',
      pagination: true,
      paginationSize: 20,
      placeholder: 'No cards match this view.',
      initialSort: [{ column: 'date', dir: 'desc' }],
      columns: [
        {
          title: '',
          field: 'image',
          width: 72,
          headerSort: false,
          formatter: (cell) => `<img class="card-avatar" alt="" src="${escapeHtml(cell.getValue())}" />`,
        },
        {
          title: 'Title',
          field: 'cardTitle',
          minWidth: 280,
          formatter: (cell) => {
            const row = cell.getRow().getData();
            return `<span class="card-title-cell"><strong>${escapeHtml(row.cardTitle)}</strong><span>${escapeHtml(row.playerName)}</span></span>`;
          },
        },
        {
          title: 'Grade',
          field: 'grade',
          width: 122,
          sorter: 'number',
          formatter: (cell) => {
            const row = cell.getRow().getData();
            const className = row.grade >= 10 ? 'grade-badge--gem' : row.grade ? 'grade-badge--graded' : 'grade-badge--raw';
            return `<span class="grade-badge ${className}">${escapeHtml(row.gradeLabel)}</span>`;
          },
        },
        {
          title: 'Value',
          field: 'value',
          width: 136,
          sorter: 'number',
          hozAlign: 'right',
          formatter: (cell) => `<strong>${formatCurrency(cell.getValue())}</strong>`,
        },
        {
          title: 'Status',
          field: 'status',
          width: 132,
          formatter: (cell) => `<span class="status-tag">${escapeHtml(cell.getValue())}</span>`,
        },
        {
          title: 'Date',
          field: 'date',
          width: 126,
          sorter: 'date',
        },
      ],
    });

    return () => {
      tableInstanceRef.current?.destroy();
      tableInstanceRef.current = null;
    };
  }, [isTabulatorReady, tableData]);

  useEffect(() => {
    if (!tableInstanceRef.current) {
      return;
    }

    const query = globalSearch.trim();
    if (!query) {
      tableInstanceRef.current.clearFilter();
      return;
    }

    tableInstanceRef.current.setFilter('playerName', 'like', query);
  }, [globalSearch]);

  return (
    <main className="cards-dashboard">
      <section className="cards-dashboard__header" aria-labelledby="cards-dashboard-title">
        <div>
          <p className="cards-dashboard__eyebrow">C.A.R.D.S. Pro Dashboard</p>
          <h1 id="cards-dashboard-title">Sports Card Inventory</h1>
        </div>
        <label className="cards-dashboard__search">
          <span>Player search</span>
          <input
            aria-label="Search by player name"
            type="search"
            placeholder="Search Jordan, Curry, Wembanyama..."
            value={globalSearch}
            onChange={(event) => setGlobalSearch(event.target.value)}
          />
        </label>
      </section>

      {!isTabulatorReady && (
        <div className="cards-dashboard__loading">Loading Tabulator table...</div>
      )}
      <div className="cards-dashboard__table" ref={tableElementRef} />
    </main>
  );
}
