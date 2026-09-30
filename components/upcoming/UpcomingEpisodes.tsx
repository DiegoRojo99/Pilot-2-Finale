'use client';

import { useState } from 'react';
import styles from './styles.module.css';
import { NextToWatch } from './next-to-watch/NextToWatch';
import { ComingSoon } from './coming-soon/ComingSoon';

type TabType = 'next' | 'coming';

export function UpcomingEpisodes() {
  const [activeTab, setActiveTab] = useState<TabType>('next');

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Episode Guide</h1>
      </div>

      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tab} ${activeTab === 'next' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('next')}
        >
          📺 Next to Watch
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'coming' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('coming')}
        >
          🎬 Coming Soon
        </button>
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'next' && <NextToWatch />}
        {activeTab === 'coming' && <ComingSoon />}
      </div>
    </div>
  );
}
