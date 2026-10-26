import { skillCategories } from "./technicalSkills";
import { certificationUrl } from "./certifications";
import { PdfLatex } from "@typeward/texlive-wasm";
import type { StructuredResume } from "../types";
import { sortExperience } from "./resumeLayout";

const textReplacements: Array<[RegExp, string]> = [
  [/\u00e2\u20ac\u2122/g, "'"],
  [/\u00e2\u20ac\u0153|\u00e2\u20ac\u009d/g, '"'],
  [/\u00e2\u20ac\u201c|\u00e2\u20ac\u201d/g, "---"],
  [/\u2018|\u2019/g, "'"],
  [/\u201c|\u201d/g, '"'],
  [/\u2013/g, "--"],
  [/\u2014/g, "---"],
  [/\u2022/g, "-"],
  [/\u00a0/g, " "],
  [/\u200b|\ufeff/g, ""],
];

export function normalizeResumeText(value: string): string {
  let normalized = value;
  for (const [pattern, replacement] of textReplacements) normalized = normalized.replace(pattern, replacement);
  return normalized.normalize("NFKC").replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim();
}

const latexCharacters: Record<string, string> = {
  "\\": "$\\backslash$",
  "&": "\\&",
  "%": "\\%",
  "$": "{\\char36}",
  "#": "\\#",
  "_": "{\\ttfamily\\char95}",
  "{": "\\{",
  "}": "\\}",
  "~": "{\\ttfamily\\char126}",
  "^": "{\\ttfamily\\char94}",
  "×": "$\\times$",
  "−": "$-$",
  "±": "$\\pm$",
  "≤": "$\\leq$",
  "≥": "$\\geq$",
};

export function escapeLatex(value: string): string {
  return [...normalizeResumeText(value)].map(character => latexCharacters[character] || character).join("");
}

// Single canonical sanitizer for highlights: highlight phrases are escaped then wrapped with \textbf{}
export function escapeWithHighlights(text: string, highlights: string[]): string {
  const base = escapeLatex(text);
  if (!highlights?.length) return base;
  let result = base;
  for (const raw of highlights.slice(0, 2)) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const escapedHighlight = escapeLatex(trimmed);
    if (!escapedHighlight || result.includes(`\\textbf{${escapedHighlight}}`)) continue;
    // Do not bold entire sentence and avoid raw LaTeX/Markdown from AI
    if (escapedHighlight.length >= result.length) continue;
    // Replace first occurrence only, case-sensitive
    if (result.includes(escapedHighlight)) {
      result = result.replace(escapedHighlight, `\\textbf{${escapedHighlight}}`);
    }
  }
  return result;
}

export function escapeLatexUrl(value: string): string {
  return normalizeResumeText(value)
    .replace(/\\/g, "%5C")
    .replace(/{/g, "%7B")
    .replace(/}/g, "%7D")
    .replace(/~/g, "%7E")
    .replace(/\^/g, "%5E")
    .replace(/%/g, "\\%")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/&/g, "\\&");
}

function webUrl(value: string): string {
  const normalized = normalizeResumeText(value);
  return /^https?:\/\//i.test(normalized) ? normalized : `https://${normalized}`;
}

function displayUrl(value: string): string {
  return normalizeResumeText(value).replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");
}

function href(target: string, label: string): string {
  return `\\href{${escapeLatexUrl(target)}}{${escapeLatex(label)}}`;
}

function headerItems(header: StructuredResume["header"]): string[] {
  const items: string[] = [];
  if (header.phone) {
    const telephone = normalizeResumeText(header.phone).replace(/[^+\d]/g, "");
    items.push(telephone ? href(`tel:${telephone}`, header.phone) : escapeLatex(header.phone));
  }
  if (header.email) items.push(href(`mailto:${normalizeResumeText(header.email)}`, header.email));
  if (header.location) items.push(escapeLatex(header.location));
  if (header.linkedin) items.push(href(webUrl(header.linkedin), displayUrl(header.linkedin)));
  if (header.github) items.push(href(webUrl(header.github), displayUrl(header.github)));
  if (header.website) items.push(href(webUrl(header.website), displayUrl(header.website)));
  return items;
}

function itemList(items: string[]): string {
  if (!items.length) return "";
  return ["\\resumeItemListStart", ...items.map(item => `  \\resumeItem{${escapeLatex(item)}}`), "\\resumeItemListEnd"].join("\n");
}

function bulletList(bullets: Array<{ text: string; highlights: string[] } | string>): string {
  if (!bullets.length) return "";
  const rendered = bullets.map(b => {
    const text = typeof b === "string" ? b : b.text;
    const highlights = typeof b === "string" ? [] : b.highlights || [];
    return `  \\resumeItem{${escapeWithHighlights(text, highlights)}}`;
  });
  return ["\\resumeItemListStart", ...rendered, "\\resumeItemListEnd"].join("\n");
}

function educationSection(resume: StructuredResume): string {
  const entries = resume.education.map(entry => [
    `  \\resumeSubheading{${escapeLatex(entry.degree)}}{${escapeLatex(entry.dates)}}{${escapeLatex(entry.institution)}}{${escapeLatex(entry.location)}}`,
    entry.details.length ? `  ${itemList(entry.details).replace(/\n/g, "\n  ")}` : "",
  ].filter(Boolean).join("\n"));
  return ["\\section{Education}", "\\resumeSubHeadingListStart", ...entries, "\\resumeSubHeadingListEnd"].join("\n");
}

function experienceSection(resume: StructuredResume): string {
  const entries = sortExperience(resume.experience).map(entry => {
    const header = `  \\resumeSubheading{${escapeLatex(entry.title)}}{${escapeLatex(entry.dates)}}{${escapeLatex(entry.organization)}}{${escapeLatex(entry.location)}}`;
    const subs = (entry as unknown as { subprojects?: Array<{ name: string; bullets: Array<{ text: string; highlights: string[] }> }>; bullets?: string[] }).subprojects;
    let body = "";
    if (subs?.length) {
      const subBlocks = subs.map(sub => {
        const title = sub.name?.trim() ? `  \\resumeSubproject{${escapeLatex(sub.name)}}` : "";
        const list = bulletList(sub.bullets).replace(/\n/g, "\n  ");
        return [title, list ? `  ${list}` : ""].filter(Boolean).join("\n");
      }).join("\n");
      body = subBlocks;
    } else {
      const legacyBullets = (entry as unknown as { bullets?: Array<{ text: string; highlights: string[] } | string> }).bullets || [];
      body = bulletList(legacyBullets as Array<{ text: string; highlights: string[] }>).replace(/\n/g, "\n  ");
      if (body) body = `  ${body}`;
    }
    return [header, body].filter(Boolean).join("\n");
  });
  return ["\\section{Experience}", "\\resumeSubHeadingListStart", ...entries, "\\resumeSubHeadingListEnd"].join("\n");
}

function projectsSection(resume: StructuredResume): string {
  if (!resume.projects.length) return "";
  const entries = resume.projects.map(project => {
    const technologies = project.technologies.length ? ` $|$ \\emph{${escapeLatex(project.technologies.join(", "))}}` : "";
    return [
      `  \\resumeProjectHeading{\\textbf{${escapeLatex(project.name)}}${technologies}}{${escapeLatex(project.dates)}}`,
      `  ${bulletList(project.bullets as Array<{ text: string; highlights: string[] }>).replace(/\n/g, "\n  ")}`,
    ].join("\n");
  });
  return ["\\section{Projects}", "\\resumeSubHeadingListStart", ...entries, "\\resumeSubHeadingListEnd"].join("\n");
}

function technicalSkillsSection(resume: StructuredResume): string {
  const seen = new Set<string>();
  const groups = skillCategories(resume.technicalSkills).map(group => ({
    ...group,
    skills: group.skills.filter(skill => {
      const key = skill.trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key); return true;
    }),
  })).filter(group => group.skills.length);
  const rows = groups.map(group => [
    "\\noindent\\begin{minipage}[t]{0.225\\linewidth}\\small",
    `\\textbf{${escapeLatex(group.name)}}`,
    "\\end{minipage}\\hfill\\begin{minipage}[t]{0.75\\linewidth}\\small",
    group.skills.map(escapeLatex).join(", "),
    "\\end{minipage}\\par\\vspace{5pt}",
  ].join("\n"));
  return ["\\section{Technical Skills}", ...rows].join("\n");
}

function certificationsSection(resume: StructuredResume): string {
  if (!resume.certifications?.length) return "";
  const entries = resume.certifications.map(entry => {
    const url = certificationUrl(entry.url);
    const name = url ? `\\href{${escapeLatexUrl(url)}}{${escapeLatex(entry.name)} \\resumeLinkIcon{}}` : escapeLatex(entry.name);
    const description = ""; // Compact credential list, matching the reference; source notes stay in the profile.
    return `  \\item\\small{${name}\\par${description}}`;
  });
  return ["\\section{Certifications}", "\\begin{list}{}{\\setlength{\\leftmargin}{0in}\\setlength{\\itemsep}{1pt}\\setlength{\\parsep}{0pt}\\setlength{\\topsep}{0pt}}", ...entries, "\\end{list}"].join("\n");
}

export function renderResumeLatex(resume: StructuredResume): string {
  const contact = headerItems(resume.header).join(" \\resumeBlueText{$|$} ");
  const projects = projectsSection(resume);
  const certifications = certificationsSection(resume);
  return String.raw`% Reference-inspired professional resume renderer
% Layout based on https://github.com/jakegut/resume (MIT License)
\pdfobjcompresslevel=0
\documentclass[letterpaper,11pt]{article}

\usepackage[utf8]{inputenc}
\newcommand{\resumeBlueStart}{\pdfliteral direct{0.459 0.808 0.945 rg 0.459 0.808 0.945 RG}}
\newcommand{\resumeBlueEnd}{\pdfliteral direct{0 g 0 G}}
\newcommand{\resumeBlueText}[1]{\leavevmode\resumeBlueStart#1\resumeBlueEnd}
% Small vector chain-link symbol; no extra font/package or visible URL needed.
\newcommand{\resumeLinkIcon}{\hbox to 10bp{\pdfliteral{q 0.459 0.808 0.945 RG 0.65 w 1 J 1 j 0.53 0.53 -0.53 0.53 5 1.3 cm -3 0 m -5 0 -5 3 -3 3 c -0.8 3 l 1.2 3 1.2 0 -0.8 0 c h S 0.8 0 m -1.2 0 -1.2 3 0.8 3 c 3 3 l 5 3 5 0 3 0 c h S Q}\hfil}}
\usepackage[hidelinks,breaklinks]{hyperref}
\renewcommand{\familydefault}{\sfdefault}
\IfFileExists{glyphtounicode.tex}{\input{glyphtounicode}}{}

\pagestyle{empty}
\setlength{\oddsidemargin}{-0.45in}
\setlength{\evensidemargin}{-0.45in}
\setlength{\textwidth}{7.4in}
\setlength{\topmargin}{-0.65in}
\setlength{\textheight}{10.05in}
\setlength{\headheight}{0pt}
\setlength{\headsep}{0pt}
\setlength{\footskip}{0.25in}
\setlength{\parindent}{0pt}
\setlength{\tabcolsep}{0in}

\urlstyle{same}
\raggedbottom
\raggedright
\renewcommand{\section}[1]{\par\addvspace{7pt}\resumeBlueStart\hrule height 0.5pt\resumeBlueEnd\vspace{1pt}\noindent\makebox[\linewidth]{\bfseries\normalsize\MakeUppercase{#1}}\par\vspace{1pt}\resumeBlueStart\hrule height 0.5pt\resumeBlueEnd\nobreak\vspace{4pt}}
\pdfgentounicode=1

\newcommand{\resumeItem}[1]{\item\small{#1}}
\newcommand{\resumeSubheading}[4]{
  \item\begin{minipage}{\linewidth}
    \noindent\parbox[t]{0.67\linewidth}{\bfseries #1}\hfill\parbox[t]{0.30\linewidth}{\raggedleft\small #2}\par\vspace{2pt}
    \noindent\parbox[t]{0.63\linewidth}{\itshape\small #3}\hfill\parbox[t]{0.34\linewidth}{\raggedleft\itshape\small #4}\par
  \end{minipage}\nopagebreak[4]\vspace{2pt}
}
\newcommand{\resumeProjectHeading}[2]{
  \item
  \begin{tabular*}{0.97\textwidth}{l@{\extracolsep{\fill}}r}
    \small#1 & #2 \\
  \end{tabular*}\vspace{1pt}
}
\newcommand{\resumeSubproject}[1]{\vspace{2pt}\noindent\textbf{\small #1}\vspace{1pt}}
\newcommand{\resumeItemListStart}{\begin{list}{-}{\setlength{\leftmargin}{0.13in}\setlength{\itemsep}{2pt}\setlength{\parsep}{0pt}\setlength{\topsep}{3pt}}}
\newcommand{\resumeItemListEnd}{\end{list}\vspace{2pt}}
\newcommand{\resumeSubHeadingListStart}{\begin{list}{}{\setlength{\leftmargin}{0in}\setlength{\itemsep}{5pt}\setlength{\parsep}{0pt}\setlength{\topsep}{0pt}}}
\newcommand{\resumeSubHeadingListEnd}{\end{list}}

\begin{document}

\noindent{\fontsize{25}{29}\selectfont\bfseries ${escapeLatex(resume.header.name.toUpperCase())}}\par\vspace{8pt}
{\small ${contact}}\par\vspace{3pt}

${technicalSkillsSection(resume)}
${certifications ? `\n${certifications}\n` : ""}
${experienceSection(resume)}
${projects ? `\n${projects}\n` : ""}
${educationSection(resume)}

\end{document}
`;
}

function staticAssetUrl(path: string): string {
  if (typeof window === "undefined") throw new Error("Browser-side LaTeX compilation requires a browser");
  return new URL(`${import.meta.env.BASE_URL}${path}`, window.location.href).href;
}

let compiler: PdfLatex | null = null;

function getCompiler(): PdfLatex {
  if (!compiler) {
    compiler = new PdfLatex({
      enginePath: staticAssetUrl("texlive-wasm/pdflatex/emscripten/pdflatex.wasm"),
      bundleUrl: staticAssetUrl("texlive-wasm/texmf-core-pdflatex.bundle"),
      useWorker: true,
      verbose: "silent",
    });
  }
  return compiler;
}

export function inspectPdf(bytes: Uint8Array): { pageCount: number; isUsLetter: boolean; hasLinks: boolean } {
  const source = new TextDecoder("latin1").decode(bytes);
  const pageCount = source.match(/\/Type\s*\/Page(?!s)\b/g)?.length || 0;
  const isUsLetter = /\/MediaBox\s*\[\s*0(?:\.0+)?\s+0(?:\.0+)?\s+612(?:\.0+)?\s+792(?:\.0+)?\s*\]/.test(source);
  const hasLinks = /\/Subtype\s*\/Link\b/.test(source) && /\/URI\b/.test(source);
  return { pageCount, isUsLetter, hasLinks };
}

export async function compileResumeLatex(texSource: string): Promise<{ pdfFile: Blob; pdfBytes: Uint8Array; pageCount: number; log: string }> {
  const engine = getCompiler();
  try {
    const result = await engine.compile({
      mainTex: "main.tex",
      files: [{ path: "main.tex", content: texSource }],
      interaction: "nonstopmode",
      haltOnError: true,
      timeoutMs: 120_000,
      extraArgs: ["-no-shell-escape"],
    });
    const pdfBytes = result.outputs.get("main.pdf") || [...result.outputs.entries()].find(([path]) => path.endsWith(".pdf"))?.[1];
    if (result.exitCode !== 0 || !pdfBytes) {
      const detail = (result.log || result.stderr || result.stdout).slice(-2400);
      throw new Error(`LaTeX compilation failed${detail ? `: ${detail}` : ""}`);
    }
    const inspection = inspectPdf(pdfBytes);
    if (!inspection.pageCount) throw new Error("Compiled PDF page count could not be detected");
    if (!inspection.isUsLetter) throw new Error("Compiled PDF is not US Letter size");
    const buffer = Uint8Array.from(pdfBytes).buffer;
    return { pdfFile: new Blob([buffer], { type: "application/pdf" }), pdfBytes, pageCount: inspection.pageCount, log: result.log };
  } catch (error) {
    console.error("Browser LaTeX compilation failed", error instanceof Error ? error.stack : error);
    await compiler?.dispose().catch(() => undefined);
    compiler = null;
    throw error;
  }
}
