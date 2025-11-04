// src/components/PDFReportTemplate.tsx
import React from "react";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

interface PDFReportProps {
  reportContent: string;
  playerName: string;
  session: string;
  playerType: "hitter" | "pitcher" | "unknown";
  logoBase64?: string;
}

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 50,
    fontSize: 11,
    fontFamily: "Helvetica",
    lineHeight: 1.7,
  },
  header: {
    marginBottom: 35,
    borderBottom: "3 solid #e5812b",
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  logo: {
    width: 80,
    height: 80,
    marginRight: 18,
    objectFit: "contain",
  },
  brandText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#e5812b",
    letterSpacing: 1.2,
  },
  reportTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 12,
    color: "#1a1a1a",
    letterSpacing: 0.5,
  },
  metadata: {
    marginTop: 18,
    fontSize: 10.5,
    color: "#555555",
    lineHeight: 1.8,
    paddingLeft: 2,
  },
  metadataLabel: {
    fontWeight: "bold",
    color: "#333333",
  },
  content: {
    marginTop: 25,
    fontSize: 11.5,
    lineHeight: 1.8,
    color: "#2a2a2a",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    marginTop: 18,
    color: "#e5812b",
    borderBottom: "2 solid #e5812b",
    paddingBottom: 6,
    letterSpacing: 0.3,
  },
  subsectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 8,
    color: "#333333",
    letterSpacing: 0.2,
  },
  paragraph: {
    marginBottom: 12,
    textAlign: "justify",
    lineHeight: 1.75,
  },
  listItem: {
    marginLeft: 20,
    marginBottom: 8,
    lineHeight: 1.7,
    paddingLeft: 8,
  },
  listBullet: {
    marginRight: 8,
    color: "#e5812b",
    fontWeight: "bold",
  },
  playerTypeBadge: {
    backgroundColor: "#e5812b",
    color: "#FFFFFF",
    padding: "5 10",
    borderRadius: 4,
    fontSize: 9.5,
    fontWeight: "bold",
    marginLeft: 10,
  },
  boldText: {
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  italicText: {
    fontStyle: "italic",
  },
});

// Helper function to parse text with bold/italic formatting
function parseInlineFormatting(text: string): React.ReactElement[] {
  const parts: React.ReactElement[] = [];
  let currentIndex = 0;
  
  // Match **bold** or *italic* or ***bold+italic***
  const regex = /(\*\*\*([^*]+)\*\*\*|\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let match;
  let lastIndex = 0;
  
  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(
        <Text key={currentIndex++}>{text.substring(lastIndex, match.index)}</Text>
      );
    }
    
    // Add formatted text
    if (match[1].startsWith("***")) {
      // Bold + italic
      parts.push(
        <Text key={currentIndex++} style={[styles.boldText, styles.italicText]}>
          {match[2]}
        </Text>
      );
    } else if (match[1].startsWith("**")) {
      // Bold
      parts.push(
        <Text key={currentIndex++} style={styles.boldText}>
          {match[3]}
        </Text>
      );
    } else {
      // Italic
      parts.push(
        <Text key={currentIndex++} style={styles.italicText}>
          {match[4]}
        </Text>
      );
    }
    
    lastIndex = regex.lastIndex;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(
      <Text key={currentIndex++}>{text.substring(lastIndex)}</Text>
    );
  }
  
  return parts.length > 0 ? parts : [<Text key={0}>{text}</Text>];
}

// Parse markdown-like content to PDF elements
function parseMarkdownToPDF(content: string): React.ReactElement[] {
  const lines = content.split("\n");
  const elements: React.ReactElement[] = [];
  let currentParagraph: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const paraText = currentParagraph.join(" ").trim();
      const formattedText = parseInlineFormatting(paraText);
      elements.push(
        <Text key={`para-${elements.length}`} style={styles.paragraph}>
          {formattedText}
        </Text>
      );
      currentParagraph = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Section headers (##)
    if (trimmed.startsWith("## ")) {
      flushParagraph();
      const sectionTitle = trimmed.substring(3).trim();
      elements.push(
        <View key={`section-${index}`} style={styles.section}>
          <Text style={styles.sectionTitle}>{sectionTitle}</Text>
        </View>
      );
    }
    // Subsections (###)
    else if (trimmed.startsWith("### ")) {
      flushParagraph();
      const subsectionTitle = trimmed.substring(4).trim();
      elements.push(
        <Text key={`subsection-${index}`} style={styles.subsectionTitle}>
          {subsectionTitle}
        </Text>
      );
    }
    // List items (- or *)
    else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      flushParagraph();
      const listItem = trimmed.substring(2).trim();
      const formattedText = parseInlineFormatting(listItem);
      elements.push(
        <Text key={`list-${index}`} style={styles.listItem}>
          <Text style={styles.listBullet}>•</Text> {formattedText}
        </Text>
      );
    }
    // Empty line - flush paragraph
    else if (trimmed === "") {
      flushParagraph();
    }
    // Regular text
    else if (trimmed.length > 0) {
      currentParagraph.push(trimmed);
    }
  });

  flushParagraph();
  return elements;
}

export const PDFReportTemplate: React.FC<PDFReportProps> = ({
  reportContent,
  playerName,
  session,
  playerType,
  logoBase64,
}) => {
  const playerTypeLabel = playerType === "hitter" ? "Hitter" : playerType === "pitcher" ? "Pitcher" : "Athlete";
  const pdfContent = parseMarkdownToPDF(reportContent);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header with Logo and Branding */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            {logoBase64 && (
              <Image
                src={logoBase64}
                style={styles.logo}
              />
            )}
            <Text style={styles.brandText}>SequenceBioLab</Text>
          </View>
          <Text style={styles.reportTitle}>Motion Capture Analysis Report</Text>
          <View style={styles.metadata}>
            <Text>
              <Text style={styles.metadataLabel}>Player:</Text> {playerName}
            </Text>
            <Text>
              {"\n"}
              <Text style={styles.metadataLabel}>Session:</Text> {session}
            </Text>
            <Text>
              {"\n"}
              <Text style={styles.metadataLabel}>Classification:</Text> {playerTypeLabel}
            </Text>
            <Text>
              {"\n"}
              <Text style={styles.metadataLabel}>Date:</Text>{" "}
              {new Date().toLocaleDateString("en-US", { 
                year: "numeric", 
                month: "long", 
                day: "numeric" 
              })}
            </Text>
          </View>
        </View>

        {/* Report Content */}
        <View style={styles.content}>
          {pdfContent.map((element, index) => (
            <React.Fragment key={`content-${index}`}>{element}</React.Fragment>
          ))}
        </View>
      </Page>
    </Document>
  );
};

