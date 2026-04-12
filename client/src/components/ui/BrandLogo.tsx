type BrandLogoProps = {
  caption?: string;
  className?: string;
  tone?: "dark" | "light";
};

export default function BrandLogo({
  caption = "Meetings that start on time",
  className = "",
  tone = "dark",
}: BrandLogoProps) {
  const titleClass = tone === "light" ? "text-white" : "text-dark-900";
  const captionClass = tone === "light" ? "text-[#c8d0e0]" : "text-dark-500";

  return (
    <div className={`nm-brand-logo ${className}`.trim()}>
      <div className="nm-brand-mark" aria-hidden="true">
        <span className="nm-brand-beam" />
      </div>
      <div className="nm-brand-wordmark">
        <strong className={titleClass}>NeuronMeet</strong>
        <span className={captionClass}>{caption}</span>
      </div>
    </div>
  );
}