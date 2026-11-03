import styles from "./WatchingPage.module.css";
import { UpcomingEpisode } from "@/types";

type UpcomingGroup = {
  date: string;
  episodes: UpcomingEpisode[];
};

export default function ComingSoonGroup({ group }: { group: UpcomingGroup }) {   
    const groupDate = new Date(group.date);
    const dateLabel = groupDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    return (
        <div key={group.date} className={styles.dateGroup}>
            <div className={styles.dateLabel}>{dateLabel}</div>
            <div className={styles.episodesList}>
                {group.episodes.map((episode) => <ComingSoonEpisode key={`${episode.showId}-${episode.seasonNumber}-${episode.episodeNumber}`} episode={episode} />)}
            </div>
        </div>
    );
}

function ComingSoonEpisode({ episode }: { episode: UpcomingEpisode }) {
    const posterUrl = episode.showPosterPath ? `https://image.tmdb.org/t/p/w185${episode.showPosterPath}` : undefined;

    return (
        <div
            key={`${episode.showId}-${episode.seasonNumber}-${episode.episodeNumber}`}
            className={styles.episodeRow}
        >
            {posterUrl ? (
                <img
                    src={posterUrl}
                    alt={episode.showName}
                    className={styles.episodePoster}
                />
            ) : (
                <div className={styles.episodePosterPlaceholder} />
            )}

            <div className={styles.episodeRowContent}>
                <h3 className={styles.episodeRowShowName}>{episode.showName}</h3>
                <div className={styles.episodeRowMeta}>
                    <span className={styles.episodeRowLabel}>
                        S{String(episode.seasonNumber).padStart(2, '0')} E
                        {String(episode.episodeNumber).padStart(2, '0')}
                    </span>
                </div>
                {episode.title && (
                    <p className={styles.episodeRowTitle}>{episode.title}</p>
                )}
            </div>
        </div>
    );
}
