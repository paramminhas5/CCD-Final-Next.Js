import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import SponsorPDFOnePager from "./SponsorPDFOnePager";
import SponsorPDFFull from "./SponsorPDFFull";

type Variant = "one-pager" | "full";

interface DownloadSponsorPDFProps {
  variant: Variant;
  className?: string;
  children?: React.ReactNode;
}

const fileNames: Record<Variant, string> = {
  "one-pager": "CCDxSocial-Sponsor-OnePager.pdf",
  full: "CCDxSocial-Sponsor-Full-Deck.pdf",
};

const DownloadSponsorPDF = ({ variant, className, children }: DownloadSponsorPDFProps) => {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const doc = variant === "one-pager" ? <SponsorPDFOnePager /> : <SponsorPDFFull />;
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileNames[variant];
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const defaultLabel = variant === "one-pager" ? "DOWNLOAD ONE-PAGER" : "DOWNLOAD FULL DECK";

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className={className}
    >
      {loading ? "GENERATING PDF..." : (children || `${defaultLabel} \u2193`)}
    </button>
  );
};

export default DownloadSponsorPDF;
