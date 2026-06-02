export interface Project {
  /** Unique identifier — used in blog post frontmatter to link a post to its project */
  id: string;
  /** Display name */
  name: string;
  /** One-line description */
  description: string;
  /** GitHub (or other git host) repository URL */
  repoUrl: string;
  /** Primary language / tech stack */
  tech: string[];
}

const projects: Project[] = [
  {
    id: "dafit-desktop",
    name: "DaFitDesktop",
    description:
      "C++20 command-line tool that connects to Da Fit / MOYOUNG smart bands over Bluetooth LE and renders a health dashboard with ANSI art.",
    repoUrl: "https://github.com/arklnd/DaFitDesktop",
    tech: ["C++", "BLE", "Windows"],
  },
  {
    id: "desktop-clock-widget",
    name: "DesktopClockWidget",
    description:
      "Frameless, always-on-top WPF clock for Windows with analog + digital faces, alarm, stopwatch, and countdown timer.",
    repoUrl: "https://github.com/arklnd/DesktopClockWidget",
    tech: ["C#", ".NET", "WPF"],
  },
];

export default projects;

export function getProjectById(id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}
