import React from "react";
import styles from "./TechStackCarousel.module.css";

type Tech = { name: string; logo?: string };

const TECHS: Tech[] = [
  { name: "TypeScript", logo: "/icons/ts.svg" },
  { name: "React", logo: "/icons/react.svg" },
  { name: "Vite", logo: "/icons/vite.svg" },
  { name: "pnpm", logo: "/icons/pnpm.svg" },
  { name: "Express", logo: "/icons/express.svg" },
  { name: "Drizzle", logo: "/icons/drizzle.svg" },
  { name: "Zod", logo: "/icons/zod.svg" },
];

export default function TechStackCarousel() {
  const items = [...TECHS, ...TECHS];
  return (
    <div className={styles.wrapper} aria-hidden="false">
      <div className={styles.track}>
        {items.map((t, i) => (
          <div key={i} className={styles.item}>
            {t.logo ? (
              <img src={t.logo} alt={`${t.name} logo`} className={styles.logo} />
            ) : null}
            <span className={styles.name}>{t.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
